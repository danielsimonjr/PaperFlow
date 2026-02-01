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
