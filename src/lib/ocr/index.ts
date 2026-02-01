/**
 * OCR Module
 * Provides optical character recognition functionality using Tesseract.js
 */

// Types
export type {
  BoundingBox,
  Baseline,
  OCRWord,
  OCRLine,
  OCRBlock,
  OCRResult,
  OCROptions,
  OCRProgress,
  OCRStatus,
  OCRLanguage,
  BlockType,
  PreprocessingOptions,
  OCREngineConfig,
} from './types';

export { PageSegmentationMode, OCREngineMode, SUPPORTED_LANGUAGES } from './types';

// OCR Engine
export { OCREngine, createOCREngine, quickOCR } from './ocrEngine';

// Language Loader
export {
  LanguageLoader,
  getLanguageLoader,
  checkOCRSupport,
  getCacheSize,
} from './languageLoader';

// Image Preprocessor
export {
  preprocessImage,
  renderPageToCanvas,
  calculateOptimalScale,
  shouldInvertImage,
} from './imagePreprocessor';

// Text Layer Embedding
export {
  embedTextLayer,
  createSearchablePDF,
  validateOCRResults,
  type EmbedOptions,
  type EmbedResult,
} from './textLayerEmbed';

// Layout Analyzer
export {
  analyzeLayout,
  tableToCSV,
  type Column,
  type TableCell,
  type Table,
  type TextRegion,
  type ImageRegion,
  type Region,
  type LayoutAnalysis,
  type LayoutConfig,
} from './layoutAnalyzer';

// Batch OCR
export {
  BatchOCRController,
  createBatchOCRController,
  type BatchPageStatus,
  type BatchPageResult,
  type BatchProgress,
  type BatchConfig,
  type BatchProgressCallback,
  type PageCompleteCallback,
} from './batchOCR';

// Export Formats
export {
  exportToPlainText,
  exportToHTML,
  exportToHOCR,
  exportToJSON,
  exportTablesToCSV,
  type ExportOptions,
} from './exportFormats';
