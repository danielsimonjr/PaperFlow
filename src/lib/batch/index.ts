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
