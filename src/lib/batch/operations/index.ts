/**
 * Batch Operations Index
 * Exports all batch operation modules.
 */

// Compress operation
export {
  compressSinglePdf,
  processBatchCompress,
  estimateCompression,
  isCompressionWorthwhile,
  getCompressionSummary,
  type CompressProgressCallback,
  type CompressionResult,
} from './batchCompress';

// Merge operation
export {
  mergePdfs,
  processBatchMerge,
  validateMergeOptions,
  getMergePreview,
  type MergeProgressCallback,
  type MergeResult,
} from './batchMerge';

// Split operation
export {
  splitSinglePdf,
  processBatchSplit,
  validateSplitOptions,
  estimateSplitResult,
  type SplitProgressCallback,
  type SplitResult,
} from './batchSplit';

// Watermark operation
export {
  applyWatermarkToPdf,
  processBatchWatermark,
  validateWatermarkOptions,
  previewWatermark,
  WATERMARK_PRESETS,
  type WatermarkProgressCallback,
  type WatermarkResult,
} from './batchWatermark';

// OCR operation
export {
  processOCRSinglePdf,
  processBatchOCR,
  validateOCROptions,
  getAvailableLanguages,
  estimateOCRTime,
  needsOCR,
  getPreprocessingForAccuracy,
  type OCRProgressCallback,
  type OCRFileResult,
} from './batchOCR';
