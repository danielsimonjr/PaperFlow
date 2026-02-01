/**
 * OCR Type Definitions
 * Comprehensive TypeScript interfaces for OCR results, configuration, and processing.
 */

/**
 * Bounding box coordinates for OCR elements
 */
export interface BoundingBox {
  /** Left edge x coordinate */
  x0: number;
  /** Top edge y coordinate */
  y0: number;
  /** Right edge x coordinate */
  x1: number;
  /** Bottom edge y coordinate */
  y1: number;
  /** Width of the bounding box */
  width: number;
  /** Height of the bounding box */
  height: number;
}

/**
 * Baseline information for text alignment
 */
export interface Baseline {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Single recognized word with position and confidence
 */
export interface OCRWord {
  /** The recognized text */
  text: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Bounding box coordinates */
  bbox: BoundingBox;
  /** Text baseline for alignment */
  baseline: Baseline;
  /** Detected font size in points */
  fontSize: number;
  /** Detected font name (if available) */
  fontName: string;
  /** Whether the word is bold */
  isBold?: boolean;
  /** Whether the word is italic */
  isItalic?: boolean;
  /** Whether the word is underlined */
  isUnderlined?: boolean;
  /** Whether the word is monospace */
  isMonospace?: boolean;
}

/**
 * Line of text containing multiple words
 */
export interface OCRLine {
  /** Combined text of all words in the line */
  text: string;
  /** Average confidence score for the line */
  confidence: number;
  /** Bounding box encompassing the entire line */
  bbox: BoundingBox;
  /** Words in reading order */
  words: OCRWord[];
  /** Baseline for the line */
  baseline?: Baseline;
}

/**
 * Block types for layout analysis
 */
export type BlockType = 'text' | 'table' | 'image' | 'horizontal_line' | 'vertical_line' | 'unknown';

/**
 * Block of content (paragraph, table, image region)
 */
export interface OCRBlock {
  /** Combined text of all lines in the block */
  text: string;
  /** Average confidence score for the block */
  confidence: number;
  /** Bounding box encompassing the entire block */
  bbox: BoundingBox;
  /** Lines in reading order */
  lines: OCRLine[];
  /** Type of content in the block */
  blockType: BlockType;
}

/**
 * Complete OCR result for a page
 */
export interface OCRResult {
  /** Full text content of the page */
  text: string;
  /** Overall confidence score (0-100) */
  confidence: number;
  /** Content blocks (paragraphs, tables, etc.) */
  blocks: OCRBlock[];
  /** All lines (flattened from blocks) */
  lines: OCRLine[];
  /** All words (flattened from lines) */
  words: OCRWord[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Language used for recognition */
  language: string;
  /** Page index (0-based) */
  pageIndex: number;
  /** Image dimensions that were processed */
  imageDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Page Segmentation Modes (PSM) for Tesseract
 */
export enum PageSegmentationMode {
  /** Orientation and script detection (OSD) only */
  OSD_ONLY = 0,
  /** Automatic page segmentation with OSD */
  AUTO_OSD = 1,
  /** Automatic page segmentation, no OSD or OCR */
  AUTO_ONLY = 2,
  /** Fully automatic page segmentation, no OSD (default) */
  AUTO = 3,
  /** Assume a single column of text of variable sizes */
  SINGLE_COLUMN = 4,
  /** Assume a single uniform block of vertically aligned text */
  SINGLE_BLOCK_VERT_TEXT = 5,
  /** Assume a single uniform block of text */
  SINGLE_BLOCK = 6,
  /** Treat the image as a single text line */
  SINGLE_LINE = 7,
  /** Treat the image as a single word */
  SINGLE_WORD = 8,
  /** Treat the image as a single word in a circle */
  CIRCLE_WORD = 9,
  /** Treat the image as a single character */
  SINGLE_CHAR = 10,
  /** Sparse text - find as much text as possible in no particular order */
  SPARSE_TEXT = 11,
  /** Sparse text with OSD */
  SPARSE_TEXT_OSD = 12,
  /** Raw line - treat the image as a single text line, bypassing hacks */
  RAW_LINE = 13,
}

/**
 * OCR Engine Modes (OEM) for Tesseract
 */
export enum OCREngineMode {
  /** Legacy engine only */
  TESSERACT_ONLY = 0,
  /** Neural nets LSTM engine only */
  LSTM_ONLY = 1,
  /** Legacy + LSTM engines */
  TESSERACT_LSTM_COMBINED = 2,
  /** Default, based on what is available */
  DEFAULT = 3,
}

/**
 * OCR processing options
 */
export interface OCROptions {
  /** Language code (e.g., 'eng', 'fra', 'deu') */
  language: string;
  /** Page segmentation mode */
  pageSegmentationMode?: PageSegmentationMode;
  /** OCR engine mode */
  ocrEngineMode?: OCREngineMode;
  /** Preserve spaces between words */
  preserveInterwordSpaces?: boolean;
  /** Whitelist of characters to recognize */
  tesseditCharWhitelist?: string;
  /** Blacklist of characters to exclude */
  tesseditCharBlacklist?: string;
  /** User-defined words file path */
  userWordsFile?: string;
  /** User-defined patterns file path */
  userPatternsFile?: string;
}

/**
 * OCR progress status values
 */
export type OCRStatus =
  | 'idle'
  | 'loading'
  | 'initializing'
  | 'recognizing'
  | 'complete'
  | 'error';

/**
 * Progress information during OCR processing
 */
export interface OCRProgress {
  /** Current status of the OCR operation */
  status: OCRStatus;
  /** Progress percentage (0-1) */
  progress: number;
  /** Worker ID if using multiple workers */
  workerId?: string;
  /** Current page being processed (for batch operations) */
  currentPage?: number;
  /** Total pages to process (for batch operations) */
  totalPages?: number;
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Supported OCR languages with display names
 */
export interface OCRLanguage {
  /** Language code (e.g., 'eng') */
  code: string;
  /** Display name (e.g., 'English') */
  name: string;
  /** Whether the language data is downloaded */
  isDownloaded?: boolean;
  /** Size of the language data file in bytes */
  dataSize?: number;
}

/**
 * Common OCR languages supported by Tesseract
 */
export const SUPPORTED_LANGUAGES: OCRLanguage[] = [
  { code: 'eng', name: 'English' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'spa', name: 'Spanish' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'nld', name: 'Dutch' },
  { code: 'pol', name: 'Polish' },
  { code: 'rus', name: 'Russian' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'chi_sim', name: 'Chinese (Simplified)' },
  { code: 'chi_tra', name: 'Chinese (Traditional)' },
  { code: 'kor', name: 'Korean' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
];

/**
 * Image preprocessing options
 */
export interface PreprocessingOptions {
  /** Convert to grayscale */
  grayscale?: boolean;
  /** Apply binary thresholding */
  binarize?: boolean;
  /** Threshold value for binarization (0-255) */
  threshold?: number;
  /** Apply adaptive thresholding */
  adaptiveThreshold?: boolean;
  /** Deskew the image */
  deskew?: boolean;
  /** Remove noise */
  denoise?: boolean;
  /** Scale factor (1.0 = no scaling) */
  scale?: number;
  /** Invert colors (for white text on dark background) */
  invert?: boolean;
}

/**
 * OCR engine configuration
 */
export interface OCREngineConfig {
  /** Path to worker script (for custom worker location) */
  workerPath?: string;
  /** Path to language data files */
  langPath?: string;
  /** Path to core WASM files */
  corePath?: string;
  /** Cache language data in IndexedDB */
  cacheLanguageData?: boolean;
  /** Log level for debugging */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
