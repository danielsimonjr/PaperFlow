/**
 * Configuration Parser Module (Sprint 20)
 *
 * Parses and validates JSON/YAML configuration files against the schema.
 */

import type {
  EnterpriseConfig,
  ConfigValidationError,
  ConfigValidationResult,
} from '@/types/enterpriseConfig';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: EnterpriseConfig = {
  version: '1.0.0',
  application: {
    defaultZoom: 100,
    defaultViewMode: 'single',
    enableAutoSave: true,
    autoSaveInterval: 30,
    minimizeToTray: false,
    launchOnStartup: false,
    smoothScrolling: true,
    defaultHighlightColor: '#FFEB3B',
    defaultAnnotationOpacity: 0.5,
  },
  security: {
    requireEncryption: false,
    minEncryptionLevel: 'AES-128',
    disableJavaScript: false,
    disableExternalLinks: false,
    trustedLocations: [],
  },
  features: {
    enableOCR: true,
    enableRedaction: true,
    enableSignatures: true,
    enablePrinting: true,
    enableExport: true,
    enableCloudStorage: true,
    enableBatchProcessing: true,
    enableFormFilling: true,
    enableAnnotations: true,
    enableComparison: true,
  },
  updates: {
    enableAutoUpdate: true,
    updateChannel: 'stable',
    updateServerURL: '',
    checkFrequency: 'daily',
    allowPrerelease: false,
    allowDowngrade: false,
  },
  network: {
    proxyServer: '',
    proxyPort: 8080,
    proxyBypass: ['localhost', '127.0.0.1'],
    allowTelemetry: true,
    offlineMode: false,
  },
  performance: {
    maxMemoryUsageMB: 1024,
    enableHardwareAcceleration: true,
    thumbnailCacheSize: 100,
    maxConcurrentOperations: 4,
  },
};

/**
 * Parse JSON configuration with error handling
 */
export function parseJSON(content: string): { config: unknown; error?: string } {
  try {
    // Handle JSON with comments (JSONC)
    const cleaned = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '');        // Remove line comments

    const config = JSON.parse(cleaned);
    return { config };
  } catch (error) {
    return {
      config: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Parse YAML configuration (requires yaml library)
 */
export async function parseYAML(content: string): Promise<{ config: unknown; error?: string }> {
  try {
    // Dynamic import for yaml library
    // @ts-expect-error yaml package may not be installed
    const yaml = await import('yaml');
    const config = yaml.parse(content);
    return { config };
  } catch (error) {
    // If yaml library not available, return error
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      return {
        config: null,
        error: 'YAML parsing requires the "yaml" package. Install with: npm install yaml',
      };
    }
    return {
      config: null,
      error: error instanceof Error ? error.message : 'Invalid YAML',
    };
  }
}

/**
 * Validate configuration against schema
 */
export function validateConfig(config: unknown): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: ConfigValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({
      path: '',
      message: 'Configuration must be an object',
      value: config,
    });
    return { valid: false, errors, warnings };
  }

  const cfg = config as Record<string, unknown>;

  // Validate application settings
  if (cfg.application) {
    validateApplicationSettings(cfg.application as Record<string, unknown>, errors, warnings);
  }

  // Validate security settings
  if (cfg.security) {
    validateSecuritySettings(cfg.security as Record<string, unknown>, errors, warnings);
  }

  // Validate features
  if (cfg.features) {
    validateFeatureSettings(cfg.features as Record<string, unknown>, errors, warnings);
  }

  // Validate updates
  if (cfg.updates) {
    validateUpdateSettings(cfg.updates as Record<string, unknown>, errors, warnings);
  }

  // Validate network
  if (cfg.network) {
    validateNetworkSettings(cfg.network as Record<string, unknown>, errors, warnings);
  }

  // Validate performance
  if (cfg.performance) {
    validatePerformanceSettings(cfg.performance as Record<string, unknown>, errors, warnings);
  }

  // Validate kiosk
  if (cfg.kiosk) {
    validateKioskSettings(cfg.kiosk as Record<string, unknown>, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate application settings
 */
function validateApplicationSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  // defaultZoom
  if (settings.defaultZoom !== undefined) {
    const zoom = settings.defaultZoom;
    if (typeof zoom !== 'number' || zoom < 10 || zoom > 400) {
      errors.push({
        path: 'application.defaultZoom',
        message: 'defaultZoom must be a number between 10 and 400',
        value: zoom,
        expected: 'number (10-400)',
      });
    }
  }

  // defaultViewMode
  if (settings.defaultViewMode !== undefined) {
    const validModes = ['single', 'continuous', 'spread'];
    if (!validModes.includes(settings.defaultViewMode as string)) {
      errors.push({
        path: 'application.defaultViewMode',
        message: `defaultViewMode must be one of: ${validModes.join(', ')}`,
        value: settings.defaultViewMode,
        expected: validModes.join(' | '),
      });
    }
  }

  // autoSaveInterval
  if (settings.autoSaveInterval !== undefined) {
    const interval = settings.autoSaveInterval;
    if (typeof interval !== 'number' || interval < 10 || interval > 300) {
      errors.push({
        path: 'application.autoSaveInterval',
        message: 'autoSaveInterval must be a number between 10 and 300',
        value: interval,
        expected: 'number (10-300)',
      });
    }
  }

  // defaultHighlightColor
  if (settings.defaultHighlightColor !== undefined) {
    const color = settings.defaultHighlightColor;
    if (typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push({
        path: 'application.defaultHighlightColor',
        message: 'defaultHighlightColor must be a valid hex color (e.g., #FFEB3B)',
        value: color,
        expected: 'hex color (#RRGGBB)',
      });
    }
  }

  // defaultAnnotationOpacity
  if (settings.defaultAnnotationOpacity !== undefined) {
    const opacity = settings.defaultAnnotationOpacity;
    if (typeof opacity !== 'number' || opacity < 0.1 || opacity > 1.0) {
      errors.push({
        path: 'application.defaultAnnotationOpacity',
        message: 'defaultAnnotationOpacity must be a number between 0.1 and 1.0',
        value: opacity,
        expected: 'number (0.1-1.0)',
      });
    }
  }

  // Boolean fields
  const booleanFields = [
    'enableAutoSave',
    'minimizeToTray',
    'launchOnStartup',
    'smoothScrolling',
  ];
  for (const field of booleanFields) {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      errors.push({
        path: `application.${field}`,
        message: `${field} must be a boolean`,
        value: settings[field],
        expected: 'boolean',
      });
    }
  }
}

/**
 * Validate security settings
 */
function validateSecuritySettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  // minEncryptionLevel
  if (settings.minEncryptionLevel !== undefined) {
    const validLevels = ['AES-128', 'AES-256'];
    if (!validLevels.includes(settings.minEncryptionLevel as string)) {
      errors.push({
        path: 'security.minEncryptionLevel',
        message: `minEncryptionLevel must be one of: ${validLevels.join(', ')}`,
        value: settings.minEncryptionLevel,
        expected: validLevels.join(' | '),
      });
    }
  }

  // trustedLocations
  if (settings.trustedLocations !== undefined) {
    if (!Array.isArray(settings.trustedLocations)) {
      errors.push({
        path: 'security.trustedLocations',
        message: 'trustedLocations must be an array of strings',
        value: settings.trustedLocations,
        expected: 'string[]',
      });
    } else {
      for (let i = 0; i < settings.trustedLocations.length; i++) {
        if (typeof settings.trustedLocations[i] !== 'string') {
          errors.push({
            path: `security.trustedLocations[${i}]`,
            message: 'trustedLocations entries must be strings',
            value: settings.trustedLocations[i],
            expected: 'string',
          });
        }
      }
    }
  }

  // Boolean fields
  const booleanFields = [
    'requireEncryption',
    'disableJavaScript',
    'disableExternalLinks',
  ];
  for (const field of booleanFields) {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      errors.push({
        path: `security.${field}`,
        message: `${field} must be a boolean`,
        value: settings[field],
        expected: 'boolean',
      });
    }
  }
}

/**
 * Validate feature settings
 */
function validateFeatureSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  const featureFields = [
    'enableOCR',
    'enableRedaction',
    'enableSignatures',
    'enablePrinting',
    'enableExport',
    'enableCloudStorage',
    'enableBatchProcessing',
    'enableFormFilling',
    'enableAnnotations',
    'enableComparison',
  ];

  for (const field of featureFields) {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      errors.push({
        path: `features.${field}`,
        message: `${field} must be a boolean`,
        value: settings[field],
        expected: 'boolean',
      });
    }
  }
}

/**
 * Validate update settings
 */
function validateUpdateSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
   
  warnings: ConfigValidationError[]
): void {
  // updateChannel
  if (settings.updateChannel !== undefined) {
    const validChannels = ['stable', 'beta', 'alpha'];
    if (!validChannels.includes(settings.updateChannel as string)) {
      errors.push({
        path: 'updates.updateChannel',
        message: `updateChannel must be one of: ${validChannels.join(', ')}`,
        value: settings.updateChannel,
        expected: validChannels.join(' | '),
      });
    }
  }

  // checkFrequency
  if (settings.checkFrequency !== undefined) {
    const validFrequencies = ['hourly', 'daily', 'weekly', 'never'];
    if (!validFrequencies.includes(settings.checkFrequency as string)) {
      errors.push({
        path: 'updates.checkFrequency',
        message: `checkFrequency must be one of: ${validFrequencies.join(', ')}`,
        value: settings.checkFrequency,
        expected: validFrequencies.join(' | '),
      });
    }
  }

  // updateServerURL
  if (settings.updateServerURL !== undefined) {
    const url = settings.updateServerURL;
    if (typeof url !== 'string') {
      errors.push({
        path: 'updates.updateServerURL',
        message: 'updateServerURL must be a string',
        value: url,
        expected: 'string (URL)',
      });
    } else if (url.trim() && !isValidUrl(url)) {
      warnings.push({
        path: 'updates.updateServerURL',
        message: 'updateServerURL does not appear to be a valid URL',
        value: url,
        expected: 'valid URL',
      });
    }
  }
}

/**
 * Validate network settings
 */
function validateNetworkSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  // proxyPort
  if (settings.proxyPort !== undefined) {
    const port = settings.proxyPort;
    if (typeof port !== 'number' || port < 1 || port > 65535) {
      errors.push({
        path: 'network.proxyPort',
        message: 'proxyPort must be a number between 1 and 65535',
        value: port,
        expected: 'number (1-65535)',
      });
    }
  }

  // proxyBypass
  if (settings.proxyBypass !== undefined) {
    if (!Array.isArray(settings.proxyBypass)) {
      errors.push({
        path: 'network.proxyBypass',
        message: 'proxyBypass must be an array of strings',
        value: settings.proxyBypass,
        expected: 'string[]',
      });
    }
  }
}

/**
 * Validate performance settings
 */
function validatePerformanceSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  // maxMemoryUsageMB
  if (settings.maxMemoryUsageMB !== undefined) {
    const mem = settings.maxMemoryUsageMB;
    if (typeof mem !== 'number' || mem < 256 || mem > 8192) {
      errors.push({
        path: 'performance.maxMemoryUsageMB',
        message: 'maxMemoryUsageMB must be a number between 256 and 8192',
        value: mem,
        expected: 'number (256-8192)',
      });
    }
  }

  // thumbnailCacheSize
  if (settings.thumbnailCacheSize !== undefined) {
    const size = settings.thumbnailCacheSize;
    if (typeof size !== 'number' || size < 10 || size > 500) {
      errors.push({
        path: 'performance.thumbnailCacheSize',
        message: 'thumbnailCacheSize must be a number between 10 and 500',
        value: size,
        expected: 'number (10-500)',
      });
    }
  }

  // maxConcurrentOperations
  if (settings.maxConcurrentOperations !== undefined) {
    const ops = settings.maxConcurrentOperations;
    if (typeof ops !== 'number' || ops < 1 || ops > 16) {
      errors.push({
        path: 'performance.maxConcurrentOperations',
        message: 'maxConcurrentOperations must be a number between 1 and 16',
        value: ops,
        expected: 'number (1-16)',
      });
    }
  }
}

/**
 * Validate kiosk settings
 */
function validateKioskSettings(
  settings: Record<string, unknown>,
  errors: ConfigValidationError[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _warnings: ConfigValidationError[]
): void {
  // exitPin
  if (settings.exitPin !== undefined) {
    const pin = settings.exitPin;
    if (typeof pin !== 'string' || pin.length < 4 || pin.length > 8) {
      errors.push({
        path: 'kiosk.exitPin',
        message: 'exitPin must be a string between 4 and 8 characters',
        value: typeof pin === 'string' ? '****' : pin,
        expected: 'string (4-8 characters)',
      });
    }
  }

  // inactivityTimeout
  if (settings.inactivityTimeout !== undefined) {
    const timeout = settings.inactivityTimeout;
    if (typeof timeout !== 'number' || timeout < 30 || timeout > 3600) {
      errors.push({
        path: 'kiosk.inactivityTimeout',
        message: 'inactivityTimeout must be a number between 30 and 3600',
        value: timeout,
        expected: 'number (30-3600)',
      });
    }
  }

  // allowedFeatures
  if (settings.allowedFeatures !== undefined) {
    const validFeatures = ['view', 'zoom', 'print', 'annotate', 'search'];
    if (!Array.isArray(settings.allowedFeatures)) {
      errors.push({
        path: 'kiosk.allowedFeatures',
        message: 'allowedFeatures must be an array',
        value: settings.allowedFeatures,
        expected: 'string[]',
      });
    } else {
      for (let i = 0; i < settings.allowedFeatures.length; i++) {
        const feature = settings.allowedFeatures[i];
        if (!validFeatures.includes(feature as string)) {
          errors.push({
            path: `kiosk.allowedFeatures[${i}]`,
            message: `Invalid feature: ${feature}. Must be one of: ${validFeatures.join(', ')}`,
            value: feature,
            expected: validFeatures.join(' | '),
          });
        }
      }
    }
  }
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge configuration with defaults
 */
export function mergeWithDefaults(config: Partial<EnterpriseConfig>): EnterpriseConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    application: {
      ...DEFAULT_CONFIG.application,
      ...config.application,
    },
    security: {
      ...DEFAULT_CONFIG.security,
      ...config.security,
    },
    features: {
      ...DEFAULT_CONFIG.features,
      ...config.features,
    },
    updates: {
      ...DEFAULT_CONFIG.updates,
      ...config.updates,
    },
    network: {
      ...DEFAULT_CONFIG.network,
      ...config.network,
    },
    performance: {
      ...DEFAULT_CONFIG.performance,
      ...config.performance,
    },
  };
}

export default {
  parseJSON,
  parseYAML,
  validateConfig,
  mergeWithDefaults,
  DEFAULT_CONFIG,
};
