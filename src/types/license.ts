/**
 * License Types (Sprint 21)
 *
 * TypeScript types for the license key validation system.
 */

/**
 * License edition types
 */
export type LicenseEdition = 'free' | 'pro' | 'business' | 'enterprise';

/**
 * License status
 */
export type LicenseStatus =
  | 'valid'
  | 'expired'
  | 'grace_period'
  | 'invalid'
  | 'revoked'
  | 'not_activated';

/**
 * License type
 */
export type LicenseType = 'perpetual' | 'subscription' | 'trial';

/**
 * Feature ID for feature gating
 */
export type FeatureId =
  | 'ocr'
  | 'redaction'
  | 'batch_processing'
  | 'cloud_storage'
  | 'collaboration'
  | 'advanced_security'
  | 'custom_stamps'
  | 'form_designer'
  | 'api_access'
  | 'priority_support';

/**
 * Decoded license key data
 */
export interface LicenseKeyData {
  /** Unique serial number */
  serial: string;
  /** License edition */
  edition: LicenseEdition;
  /** License type */
  type: LicenseType;
  /** Issue date (ISO string) */
  issuedAt: string;
  /** Expiry date (ISO string, null for perpetual) */
  expiresAt: string | null;
  /** Number of seats/users */
  seats: number;
  /** Customer/organization name */
  customer: string;
  /** Customer email */
  email?: string;
  /** Additional add-on features */
  addons: FeatureId[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete license information
 */
export interface LicenseInfo {
  /** The license key string */
  key: string;
  /** Decoded key data */
  data: LicenseKeyData;
  /** Current status */
  status: LicenseStatus;
  /** Days until expiry (negative if expired) */
  daysUntilExpiry: number | null;
  /** Whether in grace period */
  inGracePeriod: boolean;
  /** Grace period end date */
  gracePeriodEndsAt: string | null;
  /** Hardware fingerprint this license is bound to */
  hardwareFingerprint: string | null;
  /** Activation date */
  activatedAt: string | null;
  /** Last validation timestamp */
  lastValidated: number;
}

/**
 * License validation result
 */
export interface LicenseValidationResult {
  /** Whether the license is valid */
  valid: boolean;
  /** License info if valid */
  license: LicenseInfo | null;
  /** Error message if invalid */
  error?: string;
  /** Error code */
  errorCode?: LicenseErrorCode;
}

/**
 * License error codes
 */
export type LicenseErrorCode =
  | 'INVALID_FORMAT'
  | 'INVALID_SIGNATURE'
  | 'EXPIRED'
  | 'NOT_ACTIVATED'
  | 'HARDWARE_MISMATCH'
  | 'REVOKED'
  | 'SERVER_ERROR'
  | 'OFFLINE';

/**
 * Hardware fingerprint components
 */
export interface HardwareFingerprint {
  /** CPU identifier */
  cpuId: string;
  /** Motherboard serial */
  motherboardId: string;
  /** Primary disk serial */
  diskId: string;
  /** Primary MAC address */
  macAddress: string;
  /** OS installation ID */
  osId: string;
  /** Combined fingerprint hash */
  fingerprint: string;
}

/**
 * Fingerprint match result
 */
export interface FingerprintMatchResult {
  /** Whether the fingerprint matches */
  matches: boolean;
  /** Match confidence (0-1) */
  confidence: number;
  /** Number of matching components */
  matchingComponents: number;
  /** Total components checked */
  totalComponents: number;
  /** Changed components */
  changedComponents: string[];
}

/**
 * License activation request
 */
export interface ActivationRequest {
  /** License key to activate */
  licenseKey: string;
  /** Hardware fingerprint */
  fingerprint: HardwareFingerprint;
  /** Machine name */
  machineName: string;
  /** OS information */
  osInfo: {
    platform: string;
    version: string;
    arch: string;
  };
  /** App version */
  appVersion: string;
}

/**
 * License activation response
 */
export interface ActivationResponse {
  /** Whether activation succeeded */
  success: boolean;
  /** Activation token for offline validation */
  activationToken?: string;
  /** License info */
  license?: LicenseInfo;
  /** Error message */
  error?: string;
  /** Remaining activations for this key */
  remainingActivations?: number;
}

/**
 * License deactivation request
 */
export interface DeactivationRequest {
  /** License key to deactivate */
  licenseKey: string;
  /** Activation token */
  activationToken: string;
  /** Hardware fingerprint */
  fingerprint: string;
}

/**
 * License deactivation response
 */
export interface DeactivationResponse {
  /** Whether deactivation succeeded */
  success: boolean;
  /** Error message */
  error?: string;
}

/**
 * Feature availability based on license
 */
export interface FeatureAvailability {
  /** Feature ID */
  featureId: FeatureId;
  /** Whether the feature is available */
  available: boolean;
  /** Required edition for this feature */
  requiredEdition: LicenseEdition;
  /** Whether it's an add-on feature */
  isAddon: boolean;
}

/**
 * License store state
 */
export interface LicenseState {
  /** Current license info */
  license: LicenseInfo | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Last check timestamp */
  lastChecked: number | null;
  /** Offline mode */
  isOffline: boolean;
  /** Days in grace period */
  gracePeriodDays: number;
}

/**
 * License expiry warning levels
 */
export interface ExpiryWarning {
  /** Warning level */
  level: 'none' | 'notice' | 'warning' | 'critical';
  /** Days until expiry */
  daysRemaining: number | null;
  /** Message to display */
  message: string;
  /** Whether to show upgrade prompt */
  showUpgradePrompt: boolean;
}

/**
 * Edition features mapping
 */
export const EDITION_FEATURES: Record<LicenseEdition, FeatureId[]> = {
  free: [],
  pro: ['ocr', 'batch_processing', 'custom_stamps'],
  business: ['ocr', 'batch_processing', 'custom_stamps', 'redaction', 'cloud_storage', 'form_designer'],
  enterprise: ['ocr', 'batch_processing', 'custom_stamps', 'redaction', 'cloud_storage', 'form_designer', 'collaboration', 'advanced_security', 'api_access', 'priority_support'],
};

/**
 * Grace period configuration
 */
export const GRACE_PERIOD_DAYS = 7;

/**
 * Expiry warning thresholds
 */
export const EXPIRY_WARNING_DAYS = {
  notice: 30,
  warning: 14,
  critical: 7,
};

export default LicenseInfo;
