/**
 * Enterprise Configuration Types
 *
 * TypeScript types for enterprise configuration schema (Sprint 20).
 */

/**
 * View mode options
 */
export type ViewMode = 'single' | 'continuous' | 'spread';

/**
 * Encryption level options
 */
export type EncryptionLevel = 'AES-128' | 'AES-256';

/**
 * Update channel options
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha';

/**
 * Update check frequency options
 */
export type CheckFrequency = 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Configuration source
 */
export type ConfigSource =
  | 'default'
  | 'file'
  | 'environment'
  | 'remote'
  | 'gpo'
  | 'mdm';

/**
 * Application configuration settings
 */
export interface ApplicationConfig {
  /** Default zoom level (10-400) */
  defaultZoom?: number;
  /** Default document view mode */
  defaultViewMode?: ViewMode;
  /** Enable automatic document saving */
  enableAutoSave?: boolean;
  /** Auto-save interval in seconds (10-300) */
  autoSaveInterval?: number;
  /** Minimize to system tray instead of taskbar */
  minimizeToTray?: boolean;
  /** Launch application on system startup */
  launchOnStartup?: boolean;
  /** Enable smooth scrolling animations */
  smoothScrolling?: boolean;
  /** Default highlight annotation color (hex) */
  defaultHighlightColor?: string;
  /** Default annotation opacity (0.1-1.0) */
  defaultAnnotationOpacity?: number;
}

/**
 * Security configuration settings
 */
export interface SecurityConfig {
  /** Require encryption when saving PDFs */
  requireEncryption?: boolean;
  /** Minimum encryption algorithm */
  minEncryptionLevel?: EncryptionLevel;
  /** Disable JavaScript execution in PDFs */
  disableJavaScript?: boolean;
  /** Prevent opening external URLs */
  disableExternalLinks?: boolean;
  /** List of trusted folder paths */
  trustedLocations?: string[];
}

/**
 * Feature toggle configuration
 */
export interface FeaturesConfig {
  /** Enable OCR functionality */
  enableOCR?: boolean;
  /** Enable content redaction */
  enableRedaction?: boolean;
  /** Enable signature features */
  enableSignatures?: boolean;
  /** Enable document printing */
  enablePrinting?: boolean;
  /** Enable export features */
  enableExport?: boolean;
  /** Enable cloud storage integration */
  enableCloudStorage?: boolean;
  /** Enable batch processing */
  enableBatchProcessing?: boolean;
  /** Enable form filling */
  enableFormFilling?: boolean;
  /** Enable annotations */
  enableAnnotations?: boolean;
  /** Enable document comparison */
  enableComparison?: boolean;
}

/**
 * Update configuration settings
 */
export interface UpdatesConfig {
  /** Enable automatic updates */
  enableAutoUpdate?: boolean;
  /** Update release channel */
  updateChannel?: UpdateChannel;
  /** Custom update server URL */
  updateServerURL?: string;
  /** Update check frequency */
  checkFrequency?: CheckFrequency;
  /** Allow prerelease updates */
  allowPrerelease?: boolean;
  /** Allow version downgrades */
  allowDowngrade?: boolean;
}

/**
 * Network configuration settings
 */
export interface NetworkConfig {
  /** Proxy server hostname or IP */
  proxyServer?: string;
  /** Proxy server port (1-65535) */
  proxyPort?: number;
  /** Addresses that bypass proxy */
  proxyBypass?: string[];
  /** Allow anonymous telemetry */
  allowTelemetry?: boolean;
  /** Force offline mode */
  offlineMode?: boolean;
}

/**
 * Performance configuration settings
 */
export interface PerformanceConfig {
  /** Maximum memory usage in MB (256-8192) */
  maxMemoryUsageMB?: number;
  /** Enable GPU hardware acceleration */
  enableHardwareAcceleration?: boolean;
  /** Number of thumbnails to cache (10-500) */
  thumbnailCacheSize?: number;
  /** Maximum concurrent operations (1-16) */
  maxConcurrentOperations?: number;
}

/**
 * License configuration settings (Sprint 21)
 */
export interface LicenseConfig {
  /** License key */
  licenseKey?: string;
  /** License server URL */
  licenseServerURL?: string;
  /** Offline grace period in days */
  offlineGracePeriodDays?: number;
  /** Enable hardware binding */
  enableHardwareBinding?: boolean;
}

/**
 * LAN collaboration configuration (Sprint 22)
 */
export interface LANConfig {
  /** Enable LAN peer discovery */
  enableDiscovery?: boolean;
  /** Discovery service port */
  discoveryPort?: number;
  /** Enable real-time sync */
  enableSync?: boolean;
  /** Require peer authentication */
  requireAuthentication?: boolean;
}

/**
 * Kiosk mode configuration (Sprint 24)
 */
export interface KioskConfig {
  /** Enable kiosk mode */
  enabled?: boolean;
  /** PIN for exiting kiosk mode */
  exitPin?: string;
  /** Allowed document paths */
  allowedDocuments?: string[];
  /** Inactivity timeout in seconds */
  inactivityTimeout?: number;
  /** Enable auto-reset on inactivity */
  enableAutoReset?: boolean;
  /** Allowed features in kiosk mode */
  allowedFeatures?: string[];
}

/**
 * Admin contact information
 */
export interface AdminConfig {
  /** Admin contact email */
  adminContactEmail?: string;
  /** Admin contact name */
  adminContactName?: string;
  /** Organization name */
  organizationName?: string;
  /** Show managed settings indicator */
  showManagedIndicator?: boolean;
}

/**
 * Complete enterprise configuration
 */
export interface EnterpriseConfig {
  /** Schema version */
  $schema?: string;
  /** Configuration version */
  version?: string;
  /** Application settings */
  application?: ApplicationConfig;
  /** Security settings */
  security?: SecurityConfig;
  /** Feature toggles */
  features?: FeaturesConfig;
  /** Update settings */
  updates?: UpdatesConfig;
  /** Network settings */
  network?: NetworkConfig;
  /** Performance settings */
  performance?: PerformanceConfig;
  /** License settings */
  license?: LicenseConfig;
  /** LAN collaboration settings */
  lan?: LANConfig;
  /** Kiosk mode settings */
  kiosk?: KioskConfig;
  /** Admin contact info */
  admin?: AdminConfig;
}

/**
 * Configuration value with metadata
 */
export interface ConfigValueWithMetadata<T> {
  /** The configuration value */
  value: T;
  /** Source of the value */
  source: ConfigSource;
  /** Whether the value is locked by policy */
  isLocked: boolean;
  /** The default value */
  defaultValue?: T;
  /** Last modified timestamp */
  lastModified?: number;
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Path to the invalid value */
  path: string;
  /** Error message */
  message: string;
  /** The invalid value */
  value?: unknown;
  /** Expected type or format */
  expected?: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** List of validation errors */
  errors: ConfigValidationError[];
  /** Warnings (non-fatal issues) */
  warnings: ConfigValidationError[];
}

/**
 * Remote configuration response
 */
export interface RemoteConfigResponse {
  /** Configuration data */
  config: EnterpriseConfig;
  /** Server timestamp */
  timestamp: number;
  /** ETag for caching */
  etag?: string;
  /** Time-to-live in seconds */
  ttl?: number;
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  /** Changed key path */
  key: string;
  /** Previous value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** Source of the change */
  source: ConfigSource;
  /** Timestamp */
  timestamp: number;
}

export default EnterpriseConfig;
