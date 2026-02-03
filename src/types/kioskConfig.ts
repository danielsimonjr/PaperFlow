/**
 * Kiosk Configuration Types (Sprint 24)
 *
 * TypeScript types for kiosk mode configuration and state.
 */

/**
 * Kiosk feature identifiers
 */
export type KioskFeature =
  | 'view'
  | 'zoom'
  | 'scroll'
  | 'search'
  | 'print'
  | 'annotate'
  | 'form_fill'
  | 'navigate'
  | 'thumbnails';

/**
 * Kiosk restriction settings
 */
export interface KioskRestrictions {
  /** Disable file save operations */
  disableSave: boolean;
  /** Disable printing */
  disablePrint: boolean;
  /** Disable export features */
  disableExport: boolean;
  /** Disable sharing */
  disableShare: boolean;
  /** Disable settings access */
  disableSettings: boolean;
  /** Disable URL/file navigation */
  disableNavigation: boolean;
  /** Disable external links */
  disableExternalLinks: boolean;
  /** Disable right-click context menu */
  disableContextMenu: boolean;
  /** Disable keyboard shortcuts */
  disableShortcuts: boolean;
  /** Disable text selection/copy */
  disableTextSelection: boolean;
  /** Disable annotations */
  disableAnnotations: boolean;
  /** Disable form editing (show only) */
  disableFormEditing: boolean;
}

/**
 * Auto-reset configuration
 */
export interface AutoResetConfig {
  /** Enable auto-reset on inactivity */
  enabled: boolean;
  /** Inactivity timeout in seconds */
  timeoutSeconds: number;
  /** Show countdown warning before reset */
  showWarning: boolean;
  /** Warning countdown seconds */
  warningSeconds: number;
  /** Reset to this document path (or home screen) */
  resetToDocument?: string;
  /** Clear annotations on reset */
  clearAnnotations: boolean;
  /** Clear form data on reset */
  clearFormData: boolean;
  /** Clear navigation history on reset */
  clearHistory: boolean;
}

/**
 * Kiosk UI configuration
 */
export interface KioskUIConfig {
  /** Show minimal toolbar */
  showToolbar: boolean;
  /** Toolbar items to show */
  toolbarItems: KioskFeature[];
  /** Show page thumbnails sidebar */
  showThumbnails: boolean;
  /** Show page navigation controls */
  showPageNavigation: boolean;
  /** Show zoom controls */
  showZoomControls: boolean;
  /** Show search bar */
  showSearch: boolean;
  /** Full screen mode */
  fullScreen: boolean;
  /** Hide cursor after inactivity (seconds, 0 to disable) */
  hideCursorAfter: number;
  /** Custom branding/logo URL */
  brandingLogoUrl?: string;
  /** Custom welcome message */
  welcomeMessage?: string;
  /** Touch mode (larger UI elements) */
  touchMode: boolean;
}

/**
 * Kiosk exit authentication
 */
export interface KioskExitAuth {
  /** PIN code to exit kiosk mode */
  pin: string;
  /** Maximum PIN attempts before lockout */
  maxAttempts: number;
  /** Lockout duration in seconds after max attempts */
  lockoutSeconds: number;
  /** Allow admin keyboard shortcut (Ctrl+Alt+Shift+K) */
  allowAdminShortcut: boolean;
  /** Admin shortcut PIN (can differ from exit PIN) */
  adminPin?: string;
}

/**
 * Complete kiosk configuration
 */
export interface KioskConfig {
  /** Kiosk mode enabled */
  enabled: boolean;
  /** Restrictions configuration */
  restrictions: KioskRestrictions;
  /** Auto-reset configuration */
  autoReset: AutoResetConfig;
  /** UI configuration */
  ui: KioskUIConfig;
  /** Exit authentication */
  exitAuth: KioskExitAuth;
  /** Allowed document paths (glob patterns) */
  allowedDocuments: string[];
  /** Default/home document path */
  homeDocument?: string;
  /** Allow opening documents from allowed paths */
  allowDocumentSelection: boolean;
  /** Allowed features */
  allowedFeatures: KioskFeature[];
}

/**
 * Kiosk session state
 */
export interface KioskSessionState {
  /** Session ID */
  sessionId: string;
  /** Session start time */
  startedAt: number;
  /** Last activity time */
  lastActivityAt: number;
  /** Current document path */
  currentDocument?: string;
  /** Current page number */
  currentPage: number;
  /** Session annotations (temporary) */
  annotations: unknown[];
  /** Session form data */
  formData: Record<string, unknown>;
  /** Is session active */
  isActive: boolean;
}

/**
 * Kiosk state
 */
export interface KioskState {
  /** Is kiosk mode active */
  isActive: boolean;
  /** Current configuration */
  config: KioskConfig | null;
  /** Current session */
  session: KioskSessionState | null;
  /** Inactivity countdown (seconds remaining, null if not counting) */
  inactivityCountdown: number | null;
  /** Exit attempt count */
  exitAttempts: number;
  /** Is in lockout period */
  isLocked: boolean;
  /** Lockout end time */
  lockoutEndTime: number | null;
  /** Error message */
  error: string | null;
}

/**
 * Default kiosk restrictions (all restricted)
 */
export const DEFAULT_RESTRICTIONS: KioskRestrictions = {
  disableSave: true,
  disablePrint: true,
  disableExport: true,
  disableShare: true,
  disableSettings: true,
  disableNavigation: true,
  disableExternalLinks: true,
  disableContextMenu: true,
  disableShortcuts: true,
  disableTextSelection: false,
  disableAnnotations: false,
  disableFormEditing: false,
};

/**
 * Default auto-reset configuration
 */
export const DEFAULT_AUTO_RESET: AutoResetConfig = {
  enabled: true,
  timeoutSeconds: 300, // 5 minutes
  showWarning: true,
  warningSeconds: 30,
  clearAnnotations: true,
  clearFormData: true,
  clearHistory: true,
};

/**
 * Default UI configuration
 */
export const DEFAULT_UI_CONFIG: KioskUIConfig = {
  showToolbar: true,
  toolbarItems: ['view', 'zoom', 'search', 'navigate'],
  showThumbnails: false,
  showPageNavigation: true,
  showZoomControls: true,
  showSearch: true,
  fullScreen: true,
  hideCursorAfter: 10,
  touchMode: true,
};

/**
 * Default exit authentication
 */
export const DEFAULT_EXIT_AUTH: KioskExitAuth = {
  pin: '0000',
  maxAttempts: 3,
  lockoutSeconds: 300,
  allowAdminShortcut: true,
};

/**
 * Default kiosk configuration
 */
export const DEFAULT_KIOSK_CONFIG: KioskConfig = {
  enabled: false,
  restrictions: DEFAULT_RESTRICTIONS,
  autoReset: DEFAULT_AUTO_RESET,
  ui: DEFAULT_UI_CONFIG,
  exitAuth: DEFAULT_EXIT_AUTH,
  allowedDocuments: [],
  allowDocumentSelection: false,
  allowedFeatures: ['view', 'zoom', 'scroll', 'search', 'navigate'],
};

export default KioskConfig;
