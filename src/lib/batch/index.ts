/**
 * Batch Processing Module
 * Batch operations for PDFs including watermarks and headers/footers.
 */

// Types
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
  BatchOperationType,
  BatchOperationStatus,
  BatchOperation,
  BatchProgress,
  BatchResult,
} from './types';

export {
  DEFAULT_FONT_CONFIG,
  DEFAULT_MARGINS,
  DEFAULT_WATERMARK_OPTIONS,
  WATERMARK_TEMPLATES,
  DEFAULT_HEADER_FOOTER_OPTIONS,
  HEADER_FOOTER_VARIABLES,
} from './types';

// Watermark functions
export {
  calculatePositionFromPreset,
  getApplicablePages,
  calculateTextDimensions,
  generateTilePositions,
  applyRotation,
  parseColor,
  validateWatermarkOptions,
  mergeWatermarkOptions,
  createWatermarkOperationData,
  getWatermarkTemplate,
  createCustomTemplate,
} from './watermark';

// Header/Footer functions
export {
  formatPageNumber,
  toRomanNumeral,
  toLetterNumeral,
  substituteVariables,
  createVariableContext,
  calculateSectionPosition,
  validateHeaderFooterOptions,
  mergeHeaderFooterOptions,
  shouldApplyToPage,
  approximateTextWidth,
  createHeaderFooterOperationData,
  parsePageRangeString,
  createPreset,
} from './headerFooter';

// Batch processor functions
export {
  createBatchOperation,
  updateOperationStatus,
  calculateBatchProgress,
  sortOperationsByPriority,
  getNextPendingOperation,
  isBatchComplete,
  hasFailedOperations,
  getFailedOperations,
  createBatchResult,
  validateOperationOptions,
  estimateOperationTime,
  generateOperationSummary,
  cancelPendingOperations,
  resetFailedOperations,
  groupOperationsByType,
} from './batchProcessor';

// Bates numbering functions
export {
  formatBatesNumber,
  getNextBatesNumber,
  createBatesState,
  resetBatesState,
  calculateBatesPosition,
  estimateBatesTextDimensions,
  validateBatesOptions,
  mergeBatesOptions,
  generateBatesPreview,
  calculateLastBatesNumber,
  parseBatesNumber,
  createBatesOperationData,
  getBatesPreset,
  shouldApplyBatesToPage,
  BATES_PRESETS,
  DEFAULT_BATES_OPTIONS,
} from './batesNumber';

export type {
  BatesPosition,
  BatesNumberOptions,
  BatesState,
} from './batesNumber';

// Flatten functions
export {
  createEmptyFlattenStats,
  updateFlattenStats,
  shouldFlattenTarget,
  validateFlattenOptions,
  mergeFlattenOptions,
  generateFlattenSummary,
  shouldFlattenPage,
  estimateSizeReduction,
  createPageFlattenResult,
  getFlattenPreset,
  getTotalItemsFlattened,
  isFlattenComplete,
  calculateFlattenProgress,
  FLATTEN_PRESETS,
  DEFAULT_FLATTEN_OPTIONS,
} from './flatten';

export type {
  FlattenTarget,
  FlattenOptions,
  PageFlattenResult,
  FlattenStats,
} from './flatten';
