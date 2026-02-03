/**
 * Scanner Types
 *
 * TypeScript types for scanner functionality.
 */

/**
 * Scanner platform
 */
export type ScannerPlatform = 'twain' | 'wia' | 'sane' | 'imagecapture';

/**
 * Scan color mode
 */
export type ScanColorMode = 'color' | 'grayscale' | 'blackwhite';

/**
 * Scan resolution (DPI)
 */
export type ScanResolution = 75 | 100 | 150 | 200 | 300 | 400 | 600 | 1200;

/**
 * Paper size for scanning
 */
export type ScanPaperSize =
  | 'auto'
  | 'letter'
  | 'legal'
  | 'a4'
  | 'a5'
  | 'b5'
  | 'custom';

/**
 * Scanner capabilities
 */
export interface ScannerCapabilities {
  /** Supported resolutions */
  resolutions: ScanResolution[];
  /** Supported color modes */
  colorModes: ScanColorMode[];
  /** Supports duplex scanning */
  duplex: boolean;
  /** Supports auto document feeder */
  hasADF: boolean;
  /** Supports flatbed scanning */
  hasFlatbed: boolean;
  /** Maximum scan width in inches */
  maxWidth: number;
  /** Maximum scan height in inches */
  maxHeight: number;
  /** Supported paper sizes */
  paperSizes: ScanPaperSize[];
}

/**
 * Scanner device info
 */
export interface ScannerDevice {
  /** Unique device ID */
  id: string;
  /** Device name */
  name: string;
  /** Manufacturer */
  manufacturer?: string;
  /** Model */
  model?: string;
  /** Platform/driver type */
  platform: ScannerPlatform;
  /** Device capabilities */
  capabilities: ScannerCapabilities;
  /** Is currently available */
  available: boolean;
}

/**
 * Scan settings
 */
export interface ScanSettings {
  /** Resolution in DPI */
  resolution: ScanResolution;
  /** Color mode */
  colorMode: ScanColorMode;
  /** Paper size */
  paperSize: ScanPaperSize;
  /** Custom width (if paperSize is 'custom') */
  customWidth?: number;
  /** Custom height (if paperSize is 'custom') */
  customHeight?: number;
  /** Enable duplex scanning */
  duplex?: boolean;
  /** Use ADF instead of flatbed */
  useADF?: boolean;
  /** Brightness adjustment (-100 to 100) */
  brightness?: number;
  /** Contrast adjustment (-100 to 100) */
  contrast?: number;
  /** Automatically detect document edges */
  autoDetect?: boolean;
  /** Automatically correct perspective */
  autoCorrect?: boolean;
}

/**
 * Scan result
 */
export interface ScanResult {
  /** Success flag */
  success: boolean;
  /** Scanned image data (if successful) */
  imageData?: ImageData;
  /** Image as data URL (if successful) */
  dataUrl?: string;
  /** Image as blob (if successful) */
  blob?: Blob;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Resolution used */
  resolution?: number;
  /** Color mode used */
  colorMode?: ScanColorMode;
  /** Timestamp when scan was taken */
  timestamp?: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Batch scan result
 */
export interface BatchScanResult {
  /** Success flag */
  success: boolean;
  /** Number of pages scanned */
  pageCount: number;
  /** Individual scan results */
  pages: ScanResult[];
  /** Error message (if failed) */
  error?: string;
}

/**
 * Scan progress callback
 */
export type ScanProgressCallback = (
  current: number,
  total: number,
  preview?: string
) => void;

/**
 * Scan event types
 */
export type ScanEvent =
  | 'scanStarted'
  | 'scanProgress'
  | 'scanCompleted'
  | 'scanError'
  | 'pageScanned'
  | 'deviceConnected'
  | 'deviceDisconnected';

/**
 * Scan event callback
 */
export type ScanEventCallback = (
  event: ScanEvent,
  data?: ScanResult | ScannerDevice | { progress: number }
) => void;

/**
 * Document detection result
 */
export interface DocumentDetectionResult {
  /** Was a document detected */
  detected: boolean;
  /** Document corners (clockwise from top-left) */
  corners?: [Point, Point, Point, Point];
  /** Suggested crop rectangle */
  cropRect?: Rectangle;
  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Point
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Scan profile
 */
export interface ScanProfile {
  /** Profile ID */
  id: string;
  /** Profile name */
  name: string;
  /** Description */
  description?: string;
  /** Scan settings */
  settings: ScanSettings;
  /** Is a default profile */
  isDefault?: boolean;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Image enhancement options
 */
export interface ImageEnhancementOptions {
  /** Auto-level colors */
  autoLevel?: boolean;
  /** Remove background */
  removeBackground?: boolean;
  /** Sharpen image */
  sharpen?: boolean;
  /** Sharpen amount (0-100) */
  sharpenAmount?: number;
  /** Despeckle (remove noise) */
  despeckle?: boolean;
  /** Deskew (straighten) */
  deskew?: boolean;
}

/**
 * OCR language
 */
export type OCRLanguage =
  | 'eng' // English
  | 'fra' // French
  | 'deu' // German
  | 'spa' // Spanish
  | 'ita' // Italian
  | 'por' // Portuguese
  | 'jpn' // Japanese
  | 'chi_sim' // Chinese (Simplified)
  | 'chi_tra' // Chinese (Traditional)
  | 'kor' // Korean
  | 'ara' // Arabic
  | 'rus'; // Russian

/**
 * OCR settings
 */
export interface OCRSettings {
  /** Enable OCR */
  enabled: boolean;
  /** Languages to recognize */
  languages: OCRLanguage[];
  /** Create searchable PDF */
  createSearchablePDF?: boolean;
  /** Preserve original image */
  preserveImage?: boolean;
}

/**
 * PDF conversion options
 */
export interface PDFConversionOptions {
  /** Compression quality (0-100) */
  quality?: number;
  /** PDF title */
  title?: string;
  /** PDF author */
  author?: string;
  /** PDF subject */
  subject?: string;
  /** PDF keywords */
  keywords?: string[];
  /** OCR settings */
  ocr?: OCRSettings;
}
