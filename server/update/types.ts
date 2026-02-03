/**
 * Update Server Types (Sprint 23)
 *
 * TypeScript types for the on-premise update server.
 */

/**
 * Platform identifiers
 */
export type Platform = 'win32' | 'darwin' | 'linux';

/**
 * Architecture identifiers
 */
export type Architecture = 'x64' | 'arm64' | 'ia32';

/**
 * Update channel
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha';

/**
 * Release status
 */
export type ReleaseStatus = 'draft' | 'published' | 'deprecated' | 'revoked';

/**
 * Release file information
 */
export interface ReleaseFile {
  /** File name */
  name: string;
  /** File URL or path */
  url: string;
  /** File size in bytes */
  size: number;
  /** SHA256 checksum */
  sha256: string;
  /** SHA512 checksum */
  sha512?: string;
  /** Platform this file is for */
  platform: Platform;
  /** Architecture this file is for */
  arch: Architecture;
  /** File type (installer, delta, full) */
  type: 'installer' | 'delta' | 'full' | 'blockmap';
  /** For delta files, the base version */
  baseVersion?: string;
}

/**
 * Release information
 */
export interface Release {
  /** Version string (semver) */
  version: string;
  /** Release date (ISO string) */
  releaseDate: string;
  /** Release channel */
  channel: UpdateChannel;
  /** Release status */
  status: ReleaseStatus;
  /** Release notes (markdown) */
  releaseNotes: string;
  /** Minimum required version (for required updates) */
  minVersion?: string;
  /** Whether this release is mandatory */
  mandatory: boolean;
  /** Release files */
  files: ReleaseFile[];
  /** Signature of release metadata */
  signature?: string;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Update check request
 */
export interface UpdateCheckRequest {
  /** Current version */
  currentVersion: string;
  /** Platform */
  platform: Platform;
  /** Architecture */
  arch: Architecture;
  /** Preferred channel */
  channel: UpdateChannel;
  /** License key (optional, for enterprise) */
  licenseKey?: string;
}

/**
 * Update check response
 */
export interface UpdateCheckResponse {
  /** Whether an update is available */
  updateAvailable: boolean;
  /** Latest release info (if update available) */
  release?: Release;
  /** Whether update is mandatory */
  mandatory: boolean;
  /** Message to display */
  message?: string;
}

/**
 * Upload release request
 */
export interface UploadReleaseRequest {
  /** Version string */
  version: string;
  /** Channel */
  channel: UpdateChannel;
  /** Release notes */
  releaseNotes: string;
  /** Minimum version */
  minVersion?: string;
  /** Whether mandatory */
  mandatory: boolean;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server port */
  port: number;
  /** Base URL for downloads */
  baseUrl: string;
  /** Storage path for releases */
  storagePath: string;
  /** Authentication enabled */
  authEnabled: boolean;
  /** Admin API key */
  adminApiKey?: string;
  /** Max file upload size (bytes) */
  maxUploadSize: number;
  /** Enable delta generation */
  enableDeltaGeneration: boolean;
  /** Supported channels */
  channels: UpdateChannel[];
  /** Enable rate limiting */
  rateLimitEnabled: boolean;
  /** Requests per minute limit */
  rateLimitRpm: number;
}

/**
 * Delta generation request
 */
export interface DeltaGenerationRequest {
  /** Base version */
  fromVersion: string;
  /** Target version */
  toVersion: string;
  /** Platform */
  platform: Platform;
  /** Architecture */
  arch: Architecture;
}

/**
 * Server health status
 */
export interface HealthStatus {
  /** Server status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Server version */
  version: string;
  /** Uptime in seconds */
  uptime: number;
  /** Number of releases */
  releaseCount: number;
  /** Storage usage in bytes */
  storageUsage: number;
  /** Last release date */
  lastReleaseDate?: string;
  /** Components status */
  components: {
    storage: 'ok' | 'error';
    database: 'ok' | 'error';
    deltaGeneration: 'ok' | 'error' | 'disabled';
  };
}

/**
 * Release statistics
 */
export interface ReleaseStats {
  /** Version */
  version: string;
  /** Total downloads */
  totalDownloads: number;
  /** Downloads by platform */
  downloadsByPlatform: Record<Platform, number>;
  /** Downloads by channel */
  downloadsByChannel: Record<UpdateChannel, number>;
  /** Daily downloads */
  dailyDownloads: { date: string; count: number }[];
}

/**
 * Error response
 */
export interface ErrorResponse {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional details */
  details?: unknown;
}

export default Release;
