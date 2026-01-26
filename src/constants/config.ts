export const APP_CONFIG = {
  name: 'PaperFlow',
  version: '0.1.0',
  description: 'The Modern PDF Editor for Everyone',
} as const;

export const PDF_CONFIG = {
  // Zoom limits
  MIN_ZOOM: 10,
  MAX_ZOOM: 400,
  ZOOM_STEP: 25,

  // Rendering
  DEFAULT_SCALE: 1.0,
  THUMBNAIL_SCALE: 0.2,
  HIGH_DPI_SCALE: 2.0,

  // Performance
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  RENDER_AHEAD_PAGES: 2,
  THUMBNAIL_CACHE_SIZE: 50,

  // Timeouts
  RENDER_TIMEOUT: 30000, // 30 seconds
  LOAD_TIMEOUT: 60000, // 60 seconds
} as const;

export const STORAGE_KEYS = {
  RECENT_FILES: 'paperflow-recent-files',
  DOCUMENT_STATE: 'paperflow-document',
  UI_STATE: 'paperflow-ui',
  SETTINGS: 'paperflow-settings',
  SIGNATURES: 'paperflow-signatures',
} as const;

export const SUPPORTED_FORMATS = {
  import: ['.pdf'],
  export: ['.pdf', '.docx', '.pptx', '.xlsx', '.png', '.jpg'],
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
