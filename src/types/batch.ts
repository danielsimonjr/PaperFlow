/**
 * Batch Processing Types
 * Extended type definitions for native batch operations.
 */

// Re-export existing batch types
export type {
  PageRange,
  PositionPreset,
  Position,
  FontConfig,
  Margins,
  WatermarkType,
  WatermarkPosition,
  WatermarkOptions,
  WatermarkTemplate,
  HeaderFooterSection,
  HeaderFooterOptions,
  PageNumberFormat,
  BatchOperationType as LegacyBatchOperationType,
  BatchOperationStatus,
  BatchOperation as LegacyBatchOperation,
  BatchProgress as LegacyBatchProgress,
  BatchResult as LegacyBatchResult,
} from '@/lib/batch/types';

/**
 * Extended batch operation types for native processing
 */
export type BatchOperationType =
  | 'compress'
  | 'merge'
  | 'split'
  | 'watermark'
  | 'ocr'
  | 'export-pdf'
  | 'export-images'
  | 'header-footer'
  | 'bates-number'
  | 'flatten';

/**
 * Job priority levels
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Job status
 */
export type JobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * Error handling strategy
 */
export type ErrorStrategy = 'stop' | 'skip' | 'retry';

/**
 * File info for batch processing
 */
export interface BatchFile {
  id: string;
  name: string;
  path: string;
  size: number;
  pageCount?: number;
  status: JobStatus;
  progress: number;
  error?: string;
  outputPath?: string;
  processingTime?: number;
  retryCount: number;
}

/**
 * Batch job definition
 */
export interface BatchJob {
  id: string;
  type: BatchOperationType;
  name: string;
  files: BatchFile[];
  options: BatchJobOptions;
  status: JobStatus;
  priority: JobPriority;
  progress: BatchJobProgress;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  templateId?: string;
}

/**
 * Batch job options (varies by operation type)
 */
export interface BatchJobOptions {
  // Common options
  outputDir?: string;
  outputNaming?: OutputNamingConfig;
  errorStrategy: ErrorStrategy;
  maxRetries: number;
  parallelism: number;

  // Operation-specific options
  compress?: CompressJobOptions;
  merge?: MergeJobOptions;
  split?: SplitJobOptions;
  watermark?: WatermarkJobOptions;
  ocr?: OCRJobOptions;
  exportPdf?: ExportPdfJobOptions;
  exportImages?: ExportImagesJobOptions;
}

/**
 * Output file naming configuration
 */
export interface OutputNamingConfig {
  pattern: string; // e.g., "{original}_{operation}_{date}"
  prefix?: string;
  suffix?: string;
  counter?: {
    start: number;
    padding: number;
  };
}

/**
 * Compression job options
 */
export interface CompressJobOptions {
  quality: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number; // 0.1 to 1.0
  removeMetadata: boolean;
  subsampleImages: boolean;
  targetSize?: number; // Target file size in bytes
}

/**
 * Merge job options
 */
export interface MergeJobOptions {
  strategy: 'append' | 'interleave' | 'by-bookmark';
  outputName: string;
  addBookmarks: boolean;
  bookmarkLevel: number;
}

/**
 * Split job options
 */
export interface SplitJobOptions {
  method: 'page-count' | 'file-size' | 'bookmarks' | 'blank-pages' | 'range';
  pagesPerFile?: number;
  maxFileSize?: number; // bytes
  blankPageThreshold?: number; // percentage of white pixels
  ranges?: string[]; // e.g., ["1-5", "6-10"]
}

/**
 * Watermark job options
 */
export interface WatermarkJobOptions {
  type: 'text' | 'image';
  content: string;
  position: 'center' | 'tile' | 'diagonal' | 'custom';
  customPosition?: { x: number; y: number };
  opacity: number;
  rotation: number;
  scale: number;
  layer: 'over' | 'under';
  fontSize?: number;
  fontColor?: string;
}

/**
 * OCR job options
 */
export interface OCRJobOptions {
  language: string;
  languages?: string[]; // Multiple languages
  outputFormat: 'searchable-pdf' | 'text' | 'hocr';
  preprocessing: {
    deskew: boolean;
    denoise: boolean;
    contrast: boolean;
  };
  accuracy: 'fast' | 'balanced' | 'best';
}

/**
 * Export PDF job options
 */
export interface ExportPdfJobOptions {
  flatten: boolean;
  removeAnnotations: boolean;
  pdfVersion?: string;
  encryption?: {
    userPassword?: string;
    ownerPassword?: string;
    permissions: string[];
  };
}

/**
 * Export images job options
 */
export interface ExportImagesJobOptions {
  format: 'png' | 'jpeg' | 'webp' | 'tiff';
  dpi: number;
  quality: number; // For JPEG/WebP
  colorSpace: 'rgb' | 'grayscale' | 'cmyk';
  createZip: boolean;
}

/**
 * Batch job progress
 */
export interface BatchJobProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile?: string;
  currentFileProgress: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
  processingSpeed?: number; // files per second
  startTime?: number;
}

/**
 * Batch job result
 */
export interface BatchJobResult {
  jobId: string;
  success: boolean;
  totalFiles: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  totalTime: number;
  outputFiles: OutputFileInfo[];
  errors: BatchFileError[];
  statistics: BatchStatistics;
}

/**
 * Output file info
 */
export interface OutputFileInfo {
  inputPath: string;
  outputPath: string;
  inputSize: number;
  outputSize: number;
  processingTime: number;
}

/**
 * Batch file error
 */
export interface BatchFileError {
  fileId: string;
  fileName: string;
  error: string;
  code?: string;
  recoverable: boolean;
  timestamp: number;
}

/**
 * Batch statistics
 */
export interface BatchStatistics {
  totalInputSize: number;
  totalOutputSize: number;
  averageProcessingTime: number;
  peakMemoryUsage?: number;
  compressionRatio?: number;
}

/**
 * Batch operation template
 */
export interface BatchTemplate {
  id: string;
  name: string;
  description?: string;
  operationType: BatchOperationType;
  options: Partial<BatchJobOptions>;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  icon?: string;
}

/**
 * Default batch templates
 */
export const DEFAULT_BATCH_TEMPLATES: Omit<BatchTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Quick Compress',
    description: 'Fast compression with good quality',
    operationType: 'compress',
    options: {
      compress: {
        quality: 'medium',
        imageQuality: 0.7,
        removeMetadata: true,
        subsampleImages: true,
      },
      errorStrategy: 'skip',
      maxRetries: 1,
      parallelism: 2,
    },
    isDefault: true,
    icon: 'compress',
  },
  {
    name: 'Maximum Compression',
    description: 'Smallest file size, lower quality',
    operationType: 'compress',
    options: {
      compress: {
        quality: 'low',
        imageQuality: 0.4,
        removeMetadata: true,
        subsampleImages: true,
      },
      errorStrategy: 'skip',
      maxRetries: 1,
      parallelism: 2,
    },
    isDefault: true,
    icon: 'compress',
  },
  {
    name: 'Merge All',
    description: 'Merge all files into one PDF',
    operationType: 'merge',
    options: {
      merge: {
        strategy: 'append',
        outputName: 'merged',
        addBookmarks: true,
        bookmarkLevel: 1,
      },
      errorStrategy: 'stop',
      maxRetries: 0,
      parallelism: 1,
    },
    isDefault: true,
    icon: 'merge',
  },
  {
    name: 'Split by Pages',
    description: 'Split into files of 10 pages each',
    operationType: 'split',
    options: {
      split: {
        method: 'page-count',
        pagesPerFile: 10,
      },
      errorStrategy: 'skip',
      maxRetries: 1,
      parallelism: 2,
    },
    isDefault: true,
    icon: 'split',
  },
  {
    name: 'Add DRAFT Watermark',
    description: 'Add diagonal DRAFT watermark',
    operationType: 'watermark',
    options: {
      watermark: {
        type: 'text',
        content: 'DRAFT',
        position: 'diagonal',
        opacity: 0.3,
        rotation: -45,
        scale: 1,
        layer: 'over',
        fontSize: 72,
        fontColor: '#888888',
      },
      errorStrategy: 'skip',
      maxRetries: 1,
      parallelism: 2,
    },
    isDefault: true,
    icon: 'watermark',
  },
  {
    name: 'OCR - Make Searchable',
    description: 'Add searchable text layer',
    operationType: 'ocr',
    options: {
      ocr: {
        language: 'eng',
        outputFormat: 'searchable-pdf',
        preprocessing: {
          deskew: true,
          denoise: true,
          contrast: false,
        },
        accuracy: 'balanced',
      },
      errorStrategy: 'skip',
      maxRetries: 2,
      parallelism: 1,
    },
    isDefault: true,
    icon: 'ocr',
  },
  {
    name: 'Export as Images',
    description: 'Convert pages to PNG images',
    operationType: 'export-images',
    options: {
      exportImages: {
        format: 'png',
        dpi: 150,
        quality: 0.9,
        colorSpace: 'rgb',
        createZip: true,
      },
      errorStrategy: 'skip',
      maxRetries: 1,
      parallelism: 2,
    },
    isDefault: true,
    icon: 'image',
  },
];

/**
 * Resource usage info
 */
export interface ResourceUsage {
  cpuPercent: number;
  memoryUsed: number;
  memoryTotal: number;
  activeWorkers: number;
  maxWorkers: number;
}

/**
 * Worker thread message types
 */
export type WorkerMessageType =
  | 'start'
  | 'progress'
  | 'complete'
  | 'error'
  | 'cancel'
  | 'pause'
  | 'resume';

/**
 * Worker thread message
 */
export interface WorkerMessage {
  type: WorkerMessageType;
  jobId: string;
  fileId?: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

/**
 * Batch queue statistics
 */
export interface QueueStatistics {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageWaitTime: number;
  averageProcessingTime: number;
}
