/**
 * OCR Engine
 * Provides OCR functionality using Tesseract.js with Web Worker support.
 */

import Tesseract from 'tesseract.js';
import type {
  OCRResult,
  OCROptions,
  OCRProgress,
  OCRWord,
  OCRLine,
  OCRBlock,
  BoundingBox,
  Baseline,
  BlockType,
  OCREngineConfig,
} from './types';
import { PageSegmentationMode, OCREngineMode } from './types';
import { getLanguageLoader } from './languageLoader';

// Type for Tesseract worker
type TesseractWorker = Tesseract.Worker;

// Type for image input that Tesseract accepts
type ImageLike = HTMLCanvasElement | HTMLImageElement | Blob | string;

/**
 * Converts ImageData to a canvas for Tesseract
 */
function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * OCR Engine class for processing images and PDFs
 */
export class OCREngine {
  private worker: TesseractWorker | null = null;
  private currentLanguage: string = 'eng';
  private isInitialized: boolean = false;
  private onProgress?: (progress: OCRProgress) => void;
  private config: OCREngineConfig;

  constructor(
    onProgress?: (progress: OCRProgress) => void,
    config: OCREngineConfig = {}
  ) {
    this.onProgress = onProgress;
    this.config = config;
  }

  /**
   * Initializes the OCR engine with the specified language
   * @param language Language code (e.g., 'eng', 'fra', 'eng+fra')
   */
  async initialize(language: string = 'eng'): Promise<void> {
    // Terminate existing worker if any
    if (this.worker) {
      await this.terminate();
    }

    this.reportProgress({ status: 'loading', progress: 0 });

    try {
      // Create worker with progress logging
      this.worker = await Tesseract.createWorker(language, 1, {
        logger: (m: { status: string; progress: number; workerId?: string }) => {
          this.reportProgress({
            status: this.mapTesseractStatus(m.status),
            progress: m.progress,
            workerId: m.workerId,
          });
        },
        ...(this.config.langPath && { langPath: this.config.langPath }),
        ...(this.config.corePath && { corePath: this.config.corePath }),
        ...(this.config.workerPath && { workerPath: this.config.workerPath }),
      });

      this.currentLanguage = language;
      this.isInitialized = true;

      // Mark language as downloaded in cache
      const languageLoader = getLanguageLoader();
      const languages = language.split('+');
      for (const lang of languages) {
        await languageLoader.markLanguageDownloaded(lang);
      }

      this.reportProgress({ status: 'idle', progress: 1 });
    } catch (error) {
      this.reportProgress({
        status: 'error',
        progress: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Performs OCR on an image
   * @param image Image source (canvas, image element, blob, URL, or ImageData)
   * @param options OCR options
   * @param pageIndex Page index for multi-page documents
   * @returns OCR result with recognized text and positions
   */
  async recognize(
    image: HTMLCanvasElement | HTMLImageElement | ImageData | Blob | string,
    options?: Partial<OCROptions>,
    pageIndex: number = 0
  ): Promise<OCRResult> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('OCR engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    this.reportProgress({ status: 'recognizing', progress: 0 });

    try {
      // Set parameters if provided
      if (options) {
        await this.setParameters(options);
      }

      // Convert ImageData to canvas if needed
      let imageInput: ImageLike;
      let imageDimensions: { width: number; height: number } | undefined;

      if (image instanceof ImageData) {
        const canvas = imageDataToCanvas(image);
        imageInput = canvas;
        imageDimensions = { width: image.width, height: image.height };
      } else if (image instanceof HTMLCanvasElement) {
        imageInput = image;
        imageDimensions = { width: image.width, height: image.height };
      } else if (image instanceof HTMLImageElement) {
        imageInput = image;
        imageDimensions = {
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        };
      } else {
        imageInput = image;
      }

      // Perform recognition
      const result = await this.worker.recognize(imageInput);
      const processingTime = performance.now() - startTime;

      this.reportProgress({ status: 'complete', progress: 1 });

      return this.transformResult(result.data, processingTime, pageIndex, imageDimensions);
    } catch (error) {
      this.reportProgress({
        status: 'error',
        progress: 0,
        errorMessage: error instanceof Error ? error.message : 'Recognition failed',
      });
      throw error;
    }
  }

  /**
   * Sets OCR parameters
   */
  private async setParameters(options: Partial<OCROptions>): Promise<void> {
    if (!this.worker) return;

    const params: Record<string, string | number> = {};

    if (options.pageSegmentationMode !== undefined) {
      params.tessedit_pageseg_mode = options.pageSegmentationMode;
    }

    if (options.preserveInterwordSpaces !== undefined) {
      params.preserve_interword_spaces = options.preserveInterwordSpaces ? '1' : '0';
    }

    if (options.tesseditCharWhitelist) {
      params.tessedit_char_whitelist = options.tesseditCharWhitelist;
    }

    if (options.tesseditCharBlacklist) {
      params.tessedit_char_blacklist = options.tesseditCharBlacklist;
    }

    if (Object.keys(params).length > 0) {
      await this.worker.setParameters(params);
    }
  }

  /**
   * Terminates the OCR worker and releases resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.reportProgress({ status: 'idle', progress: 0 });
    }
  }

  /**
   * Checks if the engine is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  /**
   * Gets the current language
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Changes the recognition language (reinitializes the worker)
   */
  async setLanguage(language: string): Promise<void> {
    if (language !== this.currentLanguage) {
      await this.initialize(language);
    }
  }

  /**
   * Reports progress to the callback
   */
  private reportProgress(progress: OCRProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Maps Tesseract status to our status type
   */
  private mapTesseractStatus(status: string): OCRProgress['status'] {
    switch (status) {
      case 'loading tesseract core':
      case 'loading language traineddata':
        return 'loading';
      case 'initializing tesseract':
      case 'initializing api':
        return 'initializing';
      case 'recognizing text':
        return 'recognizing';
      default:
        return 'loading';
    }
  }

  /**
   * Transforms Tesseract result to our OCRResult format
   */
  private transformResult(
    data: Tesseract.Page,
    processingTime: number,
    pageIndex: number,
    imageDimensions?: { width: number; height: number }
  ): OCRResult {
    const words: OCRWord[] = [];
    const lines: OCRLine[] = [];
    const blocks: OCRBlock[] = [];

    // Process blocks from Tesseract result
    // Tesseract.js returns data with blocks containing paragraphs
    const tesseractBlocks = (data as unknown as { blocks?: TesseractBlock[] }).blocks;

    if (tesseractBlocks) {
      for (const block of tesseractBlocks) {
        const blockLines: OCRLine[] = [];

        if (block.paragraphs) {
          for (const paragraph of block.paragraphs) {
            if (paragraph.lines) {
              for (const line of paragraph.lines) {
                const lineWords: OCRWord[] = [];

                if (line.words) {
                  for (const word of line.words) {
                    const ocrWord: OCRWord = {
                      text: word.text,
                      confidence: word.confidence,
                      bbox: this.transformBbox(word.bbox),
                      baseline: this.transformBaseline(word.baseline),
                      fontSize: word.font_size || 12,
                      fontName: word.font_name || 'unknown',
                      isBold: word.is_bold,
                      isItalic: word.is_italic,
                      isUnderlined: word.is_underlined,
                      isMonospace: word.is_monospace,
                    };
                    lineWords.push(ocrWord);
                    words.push(ocrWord);
                  }
                }

                const ocrLine: OCRLine = {
                  text: line.text,
                  confidence: line.confidence,
                  bbox: this.transformBbox(line.bbox),
                  words: lineWords,
                  baseline: line.baseline ? this.transformBaseline(line.baseline) : undefined,
                };
                blockLines.push(ocrLine);
                lines.push(ocrLine);
              }
            }
          }
        }

        const ocrBlock: OCRBlock = {
          text: block.text,
          confidence: block.confidence,
          bbox: this.transformBbox(block.bbox),
          lines: blockLines,
          blockType: this.inferBlockType(block),
        };
        blocks.push(ocrBlock);
      }
    }

    return {
      text: data.text,
      confidence: data.confidence,
      blocks,
      lines,
      words,
      processingTime,
      language: this.currentLanguage,
      pageIndex,
      imageDimensions,
    };
  }

  /**
   * Transforms Tesseract bbox to our BoundingBox format
   */
  private transformBbox(bbox: Tesseract.Bbox): BoundingBox {
    return {
      x0: bbox.x0,
      y0: bbox.y0,
      x1: bbox.x1,
      y1: bbox.y1,
      width: bbox.x1 - bbox.x0,
      height: bbox.y1 - bbox.y0,
    };
  }

  /**
   * Transforms Tesseract baseline to our Baseline format
   */
  private transformBaseline(baseline: Tesseract.Baseline): Baseline {
    return {
      x0: baseline.x0,
      y0: baseline.y0,
      x1: baseline.x1,
      y1: baseline.y1,
    };
  }

  /**
   * Infers block type from block content
   */
  private inferBlockType(block: TesseractBlock): BlockType {
    // Simple heuristic - could be improved with more analysis
    const text = block.text?.trim() ?? '';

    // Check for horizontal line (no text)
    if (text.length === 0 || /^[-_=]+$/.test(text)) {
      return 'horizontal_line';
    }

    // Check for table-like structure
    if (block.paragraphs && block.paragraphs.length > 1) {
      const lineCount = block.paragraphs.reduce(
        (sum, p) => sum + (p.lines?.length ?? 0),
        0
      );
      if (lineCount > 3) {
        // Could be a table - check for aligned columns
        return 'text'; // Default to text, table detection needs more analysis
      }
    }

    return 'text';
  }
}

// Internal type for Tesseract block structure
interface TesseractBlock {
  text: string;
  confidence: number;
  bbox: Tesseract.Bbox;
  paragraphs?: TesseractParagraph[];
}

interface TesseractParagraph {
  text: string;
  confidence: number;
  bbox: Tesseract.Bbox;
  lines?: TesseractLine[];
}

interface TesseractLine {
  text: string;
  confidence: number;
  bbox: Tesseract.Bbox;
  baseline?: Tesseract.Baseline;
  words?: TesseractWord[];
}

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: Tesseract.Bbox;
  baseline: Tesseract.Baseline;
  font_size?: number;
  font_name?: string;
  is_bold?: boolean;
  is_italic?: boolean;
  is_underlined?: boolean;
  is_monospace?: boolean;
}

/**
 * Creates a new OCR engine instance
 */
export function createOCREngine(
  onProgress?: (progress: OCRProgress) => void,
  config?: OCREngineConfig
): OCREngine {
  return new OCREngine(onProgress, config);
}

/**
 * Quick OCR function for single-use recognition
 * Creates a worker, performs OCR, and terminates
 */
export async function quickOCR(
  image: HTMLCanvasElement | HTMLImageElement | ImageData | Blob | string,
  language: string = 'eng',
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const engine = createOCREngine(onProgress);

  try {
    await engine.initialize(language);
    const result = await engine.recognize(image);
    return result;
  } finally {
    await engine.terminate();
  }
}

// Re-export enums for convenience
export { PageSegmentationMode, OCREngineMode };
