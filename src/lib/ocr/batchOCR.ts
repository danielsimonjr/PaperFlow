/**
 * Batch OCR Controller
 * Manages processing multiple pages with progress tracking and error handling.
 */

import type { OCRResult, PreprocessingOptions } from './types';
import { OCREngine } from './ocrEngine';
import { preprocessImage, renderPageToCanvas } from './imagePreprocessor';
import type { PDFPageProxy } from 'pdfjs-dist';

export type BatchPageStatus = 'pending' | 'processing' | 'complete' | 'error' | 'skipped';

export interface BatchPageResult {
  pageIndex: number;
  status: BatchPageStatus;
  result?: OCRResult;
  error?: string;
  processingTime?: number;
}

export interface BatchProgress {
  totalPages: number;
  completedPages: number;
  currentPage: number;
  status: 'idle' | 'processing' | 'paused' | 'complete' | 'cancelled';
  startTime: number;
  estimatedTimeRemaining?: number;
  pageStatuses: Map<number, BatchPageStatus>;
}

export interface BatchConfig {
  /** Maximum pages to process in parallel */
  parallelism: number;
  /** Whether to continue on errors */
  continueOnError: boolean;
  /** Preprocessing options */
  preprocessingOptions: PreprocessingOptions;
  /** Render scale for page images */
  renderScale: number;
  /** Language for OCR */
  language: string;
}

const DEFAULT_CONFIG: BatchConfig = {
  parallelism: 1, // Sequential by default for memory management
  continueOnError: true,
  preprocessingOptions: {
    grayscale: true,
    binarize: false,
    denoise: false,
    scale: 1.0,
  },
  renderScale: 2.0,
  language: 'eng',
};

export type BatchProgressCallback = (progress: BatchProgress) => void;
export type PageCompleteCallback = (result: BatchPageResult) => void;

/**
 * Batch OCR Controller for processing multiple pages
 */
export class BatchOCRController {
  private engine: OCREngine | null = null;
  private config: BatchConfig;
  private progress: BatchProgress;
  private isPaused = false;
  private isCancelled = false;
  private progressCallback?: BatchProgressCallback;
  private pageCompleteCallback?: PageCompleteCallback;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.progress = this.createInitialProgress(0);
  }

  /**
   * Creates initial progress state
   */
  private createInitialProgress(totalPages: number): BatchProgress {
    return {
      totalPages,
      completedPages: 0,
      currentPage: -1,
      status: 'idle',
      startTime: 0,
      pageStatuses: new Map(),
    };
  }

  /**
   * Sets the progress callback
   */
  onProgress(callback: BatchProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Sets the page complete callback
   */
  onPageComplete(callback: PageCompleteCallback): void {
    this.pageCompleteCallback = callback;
  }

  /**
   * Updates progress and notifies callback
   */
  private updateProgress(updates: Partial<BatchProgress>): void {
    Object.assign(this.progress, updates);

    // Calculate estimated time remaining
    if (this.progress.completedPages > 0) {
      const elapsed = Date.now() - this.progress.startTime;
      const avgTimePerPage = elapsed / this.progress.completedPages;
      const remainingPages = this.progress.totalPages - this.progress.completedPages;
      this.progress.estimatedTimeRemaining = avgTimePerPage * remainingPages;
    }

    this.progressCallback?.(this.progress);
  }

  /**
   * Processes multiple pages
   */
  async processBatch(
    getPage: (pageIndex: number) => Promise<PDFPageProxy>,
    pageIndices: number[]
  ): Promise<BatchPageResult[]> {
    const results: BatchPageResult[] = [];

    // Initialize progress
    this.progress = this.createInitialProgress(pageIndices.length);
    for (const pageIndex of pageIndices) {
      this.progress.pageStatuses.set(pageIndex, 'pending');
    }

    this.updateProgress({ status: 'processing', startTime: Date.now() });

    // Initialize OCR engine
    this.engine = new OCREngine();

    try {
      await this.engine.initialize(this.config.language);

      // Process pages (sequential or parallel based on config)
      if (this.config.parallelism === 1) {
        // Sequential processing
        for (let i = 0; i < pageIndices.length; i++) {
          if (this.isCancelled) break;

          // Wait if paused
          while (this.isPaused && !this.isCancelled) {
            await this.sleep(100);
          }

          const pageIndex = pageIndices[i]!;
          this.updateProgress({
            currentPage: i,
            pageStatuses: new Map(this.progress.pageStatuses).set(pageIndex, 'processing'),
          });

          const result = await this.processPage(getPage, pageIndex);
          results.push(result);

          this.progress.pageStatuses.set(pageIndex, result.status);
          this.updateProgress({
            completedPages: this.progress.completedPages + 1,
            pageStatuses: new Map(this.progress.pageStatuses),
          });

          this.pageCompleteCallback?.(result);

          if (result.status === 'error' && !this.config.continueOnError) {
            break;
          }
        }
      } else {
        // Parallel processing with limited concurrency
        const chunks = this.chunkArray(pageIndices, this.config.parallelism);

        for (const chunk of chunks) {
          if (this.isCancelled) break;

          while (this.isPaused && !this.isCancelled) {
            await this.sleep(100);
          }

          const chunkResults = await Promise.all(
            chunk.map((pageIndex) => this.processPage(getPage, pageIndex))
          );

          for (const result of chunkResults) {
            results.push(result);
            this.progress.pageStatuses.set(result.pageIndex, result.status);
            this.pageCompleteCallback?.(result);
          }

          this.updateProgress({
            completedPages: this.progress.completedPages + chunkResults.length,
            pageStatuses: new Map(this.progress.pageStatuses),
          });
        }
      }

      this.updateProgress({
        status: this.isCancelled ? 'cancelled' : 'complete',
      });
    } finally {
      await this.engine.terminate();
      this.engine = null;
    }

    return results;
  }

  /**
   * Processes a single page
   */
  private async processPage(
    getPage: (pageIndex: number) => Promise<PDFPageProxy>,
    pageIndex: number
  ): Promise<BatchPageResult> {
    const startTime = Date.now();

    try {
      // Get the page
      const page = await getPage(pageIndex);

      // Render to canvas
      const canvas = await renderPageToCanvas(page, this.config.renderScale);

      // Preprocess
      const processedCanvas = preprocessImage(canvas, this.config.preprocessingOptions);

      // Run OCR
      const result = await this.engine!.recognize(processedCanvas, undefined, pageIndex);

      return {
        pageIndex,
        status: 'complete',
        result,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        pageIndex,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Pauses the batch processing
   */
  pause(): void {
    if (this.progress.status === 'processing') {
      this.isPaused = true;
      this.updateProgress({ status: 'paused' });
    }
  }

  /**
   * Resumes the batch processing
   */
  resume(): void {
    if (this.progress.status === 'paused') {
      this.isPaused = false;
      this.updateProgress({ status: 'processing' });
    }
  }

  /**
   * Cancels the batch processing
   */
  cancel(): void {
    this.isCancelled = true;
    this.isPaused = false;
    this.updateProgress({ status: 'cancelled' });
  }

  /**
   * Gets current progress
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }

  /**
   * Retries failed pages
   */
  async retryFailed(
    getPage: (pageIndex: number) => Promise<PDFPageProxy>,
    previousResults: BatchPageResult[]
  ): Promise<BatchPageResult[]> {
    const failedPages = previousResults
      .filter((r) => r.status === 'error')
      .map((r) => r.pageIndex);

    if (failedPages.length === 0) {
      return previousResults;
    }

    const retryResults = await this.processBatch(getPage, failedPages);

    // Merge results
    const resultMap = new Map<number, BatchPageResult>();
    for (const result of previousResults) {
      resultMap.set(result.pageIndex, result);
    }
    for (const result of retryResults) {
      resultMap.set(result.pageIndex, result);
    }

    return Array.from(resultMap.values()).sort((a, b) => a.pageIndex - b.pageIndex);
  }

  /**
   * Helper to chunk array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Creates a batch OCR controller
 */
export function createBatchOCRController(config?: Partial<BatchConfig>): BatchOCRController {
  return new BatchOCRController(config);
}
