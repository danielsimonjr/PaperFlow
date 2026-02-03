/**
 * Policy Merger Module
 *
 * Merges policies from multiple sources (GPO, MDM, config files, local settings)
 * with proper precedence ordering. Enterprise policies override user settings.
 */

import { gpoReader, type GPOPolicyConfig } from './gpoReader';
import { mdmReader, type MDMPolicyConfig } from './mdmReader';
import { isWindows } from './registryAccess';
import { isMacOS } from './macPreferences';

/**
 * Policy source with precedence (higher = more authoritative)
 */
export enum PolicySource {
  Default = 0,
  UserPreference = 1,
  ConfigFile = 2,
  Environment = 3,
  MDM = 4,      // macOS MDM
  GPO = 5,      // Windows GPO (highest for Windows)
}

/**
 * A merged policy value with metadata
 */
export interface MergedPolicyValue<T = unknown> {
  value: T;
  source: PolicySource;
  sourceName: string;
  isLocked: boolean;
  originalValue?: T;
  defaultValue?: T;
}

/**
 * Merged application settings
 */
export interface MergedApplicationSettings {
  defaultZoom: MergedPolicyValue<number>;
  defaultViewMode: MergedPolicyValue<'single' | 'continuous' | 'spread'>;
  enableAutoSave: MergedPolicyValue<boolean>;
  autoSaveInterval: MergedPolicyValue<number>;
  minimizeToTray: MergedPolicyValue<boolean>;
  launchOnStartup: MergedPolicyValue<boolean>;
  smoothScrolling: MergedPolicyValue<boolean>;
  defaultHighlightColor: MergedPolicyValue<string>;
  defaultAnnotationOpacity: MergedPolicyValue<number>;
}

/**
 * Merged security settings
 */
export interface MergedSecuritySettings {
  requireEncryption: MergedPolicyValue<boolean>;
  minEncryptionLevel: MergedPolicyValue<'AES-128' | 'AES-256'>;
  disableJavaScript: MergedPolicyValue<boolean>;
  disableExternalLinks: MergedPolicyValue<boolean>;
  trustedLocations: MergedPolicyValue<string[]>;
}

/**
 * Merged feature settings
 */
export interface MergedFeatureSettings {
  enableOCR: MergedPolicyValue<boolean>;
  enableRedaction: MergedPolicyValue<boolean>;
  enableSignatures: MergedPolicyValue<boolean>;
  enablePrinting: MergedPolicyValue<boolean>;
  enableExport: MergedPolicyValue<boolean>;
  enableCloudStorage: MergedPolicyValue<boolean>;
  enableBatchProcessing: MergedPolicyValue<boolean>;
  enableFormFilling: MergedPolicyValue<boolean>;
  enableAnnotations: MergedPolicyValue<boolean>;
  enableComparison: MergedPolicyValue<boolean>;
}

/**
 * Merged update settings
 */
export interface MergedUpdateSettings {
  enableAutoUpdate: MergedPolicyValue<boolean>;
  updateChannel: MergedPolicyValue<'stable' | 'beta' | 'alpha'>;
  updateServerURL: MergedPolicyValue<string>;
  checkFrequency: MergedPolicyValue<'hourly' | 'daily' | 'weekly' | 'never'>;
  allowPrerelease: MergedPolicyValue<boolean>;
  allowDowngrade: MergedPolicyValue<boolean>;
}

/**
 * Merged network settings
 */
export interface MergedNetworkSettings {
  proxyServer: MergedPolicyValue<string>;
  proxyPort: MergedPolicyValue<number>;
  proxyBypass: MergedPolicyValue<string[]>;
  allowTelemetry: MergedPolicyValue<boolean>;
  offlineMode: MergedPolicyValue<boolean>;
}

/**
 * Merged performance settings
 */
export interface MergedPerformanceSettings {
  maxMemoryUsageMB: MergedPolicyValue<number>;
  enableHardwareAcceleration: MergedPolicyValue<boolean>;
  thumbnailCacheSize: MergedPolicyValue<number>;
  maxConcurrentOperations: MergedPolicyValue<number>;
}

/**
 * Admin contact information
 */
export interface AdminContact {
  email: string | null;
  name: string | null;
  organization: string | null;
}

/**
 * Complete merged policy configuration
 */
export interface MergedPolicyConfig {
  application: MergedApplicationSettings;
  security: MergedSecuritySettings;
  features: MergedFeatureSettings;
  updates: MergedUpdateSettings;
  network: MergedNetworkSettings;
  performance: MergedPerformanceSettings;
  adminContact: AdminContact;
  hasEnterprisePolicies: boolean;
  managedSettingsCount: number;
  platform: 'windows' | 'macos' | 'linux' | 'web';
  lastMerged: number;
}

/**
 * Default values for all settings
 */
const DEFAULT_VALUES = {
  application: {
    defaultZoom: 100,
    defaultViewMode: 'single' as const,
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
    minEncryptionLevel: 'AES-128' as const,
    disableJavaScript: false,
    disableExternalLinks: false,
    trustedLocations: [] as string[],
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
    updateChannel: 'stable' as const,
    updateServerURL: '',
    checkFrequency: 'daily' as const,
    allowPrerelease: false,
    allowDowngrade: false,
  },
  network: {
    proxyServer: '',
    proxyPort: 8080,
    proxyBypass: [] as string[],
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
 * Create a merged policy value with defaults
 */
function createMergedValue<T>(
  value: T,
  source: PolicySource = PolicySource.Default,
  defaultValue?: T
): MergedPolicyValue<T> {
  const sourceNames: Record<PolicySource, string> = {
    [PolicySource.Default]: 'Default',
    [PolicySource.UserPreference]: 'User Preference',
    [PolicySource.ConfigFile]: 'Configuration File',
    [PolicySource.Environment]: 'Environment Variable',
    [PolicySource.MDM]: 'MDM Profile',
    [PolicySource.GPO]: 'Group Policy',
  };

  return {
    value,
    source,
    sourceName: sourceNames[source],
    isLocked: source >= PolicySource.MDM,
    defaultValue: defaultValue ?? value,
  };
}

/**
 * Policy Merger class
 */
class PolicyMerger {
  private cachedConfig: MergedPolicyConfig | null = null;
  private userSettings: Partial<Record<string, unknown>> = {};
  private configFileSettings: Partial<Record<string, unknown>> = {};

  /**
   * Detect the current platform
   */
  private getPlatform(): 'windows' | 'macos' | 'linux' | 'web' {
    if (isWindows()) return 'windows';
    if (isMacOS()) return 'macos';
    if (typeof process !== 'undefined' && process.platform === 'linux') return 'linux';
    return 'web';
  }

  /**
   * Set user settings (from local storage or settings store)
   */
  setUserSettings(settings: Partial<Record<string, unknown>>): void {
    this.userSettings = settings;
    this.cachedConfig = null;
  }

  /**
   * Set config file settings
   */
  setConfigFileSettings(settings: Partial<Record<string, unknown>>): void {
    this.configFileSettings = settings;
    this.cachedConfig = null;
  }

  /**
   * Merge all policy sources and return unified configuration
   */
  async mergeAllPolicies(forceRefresh = false): Promise<MergedPolicyConfig> {
    if (!forceRefresh && this.cachedConfig) {
      return this.cachedConfig;
    }

    const platform = this.getPlatform();
    let gpoConfig: GPOPolicyConfig | null = null;
    let mdmConfig: MDMPolicyConfig | null = null;

    // Read platform-specific enterprise policies
    if (platform === 'windows') {
      gpoConfig = await gpoReader.readAllPolicies(forceRefresh);
    } else if (platform === 'macos') {
      mdmConfig = await mdmReader.readAllPolicies(forceRefresh);
    }

    // Merge settings
    const config: MergedPolicyConfig = {
      application: this.mergeApplicationSettings(gpoConfig, mdmConfig),
      security: this.mergeSecuritySettings(gpoConfig, mdmConfig),
      features: this.mergeFeatureSettings(gpoConfig, mdmConfig),
      updates: this.mergeUpdateSettings(gpoConfig, mdmConfig),
      network: this.mergeNetworkSettings(gpoConfig, mdmConfig),
      performance: this.mergePerformanceSettings(gpoConfig, mdmConfig),
      adminContact: this.extractAdminContact(mdmConfig),
      hasEnterprisePolicies: false,
      managedSettingsCount: 0,
      platform,
      lastMerged: Date.now(),
    };

    // Count managed settings
    const countManaged = (obj: Record<string, MergedPolicyValue>): number => {
      return Object.values(obj).filter((v) => v.isLocked).length;
    };

    config.managedSettingsCount =
      countManaged(config.application as unknown as Record<string, MergedPolicyValue>) +
      countManaged(config.security as unknown as Record<string, MergedPolicyValue>) +
      countManaged(config.features as unknown as Record<string, MergedPolicyValue>) +
      countManaged(config.updates as unknown as Record<string, MergedPolicyValue>) +
      countManaged(config.network as unknown as Record<string, MergedPolicyValue>) +
      countManaged(config.performance as unknown as Record<string, MergedPolicyValue>);

    config.hasEnterprisePolicies = config.managedSettingsCount > 0;

    this.cachedConfig = config;
    return config;
  }

  /**
   * Merge application settings
   */
  private mergeApplicationSettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedApplicationSettings {
    const defaults = DEFAULT_VALUES.application;

    return {
      defaultZoom: this.mergeValue(
        'defaultZoom',
        defaults.defaultZoom,
        gpo?.application.defaultZoom,
        mdm?.application.defaultZoom
      ),
      defaultViewMode: this.mergeValue(
        'defaultViewMode',
        defaults.defaultViewMode,
        gpo?.application.defaultViewMode,
        mdm?.application.defaultViewMode
      ),
      enableAutoSave: this.mergeValue(
        'enableAutoSave',
        defaults.enableAutoSave,
        gpo?.application.enableAutoSave,
        mdm?.application.enableAutoSave
      ),
      autoSaveInterval: this.mergeValue(
        'autoSaveInterval',
        defaults.autoSaveInterval,
        gpo?.application.autoSaveInterval,
        mdm?.application.autoSaveInterval
      ),
      minimizeToTray: this.mergeValue(
        'minimizeToTray',
        defaults.minimizeToTray,
        gpo?.application.minimizeToTray,
        mdm?.application.minimizeToTray
      ),
      launchOnStartup: this.mergeValue(
        'launchOnStartup',
        defaults.launchOnStartup,
        gpo?.application.launchOnStartup,
        mdm?.application.launchOnStartup
      ),
      smoothScrolling: this.mergeValue(
        'smoothScrolling',
        defaults.smoothScrolling,
        undefined,
        mdm?.application.smoothScrolling
      ),
      defaultHighlightColor: this.mergeValue(
        'defaultHighlightColor',
        defaults.defaultHighlightColor,
        undefined,
        mdm?.application.defaultHighlightColor
      ),
      defaultAnnotationOpacity: this.mergeValue(
        'defaultAnnotationOpacity',
        defaults.defaultAnnotationOpacity,
        undefined,
        mdm?.application.defaultAnnotationOpacity
      ),
    };
  }

  /**
   * Merge security settings
   */
  private mergeSecuritySettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedSecuritySettings {
    const defaults = DEFAULT_VALUES.security;

    return {
      requireEncryption: this.mergeValue(
        'requireEncryption',
        defaults.requireEncryption,
        gpo?.security.requireEncryption,
        mdm?.security.requireEncryption
      ),
      minEncryptionLevel: this.mergeValue(
        'minEncryptionLevel',
        defaults.minEncryptionLevel,
        gpo?.security.minEncryptionLevel,
        mdm?.security.minEncryptionLevel
      ),
      disableJavaScript: this.mergeValue(
        'disableJavaScript',
        defaults.disableJavaScript,
        gpo?.security.disableJavaScript,
        mdm?.security.disableJavaScript
      ),
      disableExternalLinks: this.mergeValue(
        'disableExternalLinks',
        defaults.disableExternalLinks,
        gpo?.security.disableExternalLinks,
        mdm?.security.disableExternalLinks
      ),
      trustedLocations: this.mergeValue(
        'trustedLocations',
        defaults.trustedLocations,
        gpo?.security.trustedLocations,
        mdm?.security.trustedLocations
      ),
    };
  }

  /**
   * Merge feature settings
   */
  private mergeFeatureSettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedFeatureSettings {
    const defaults = DEFAULT_VALUES.features;

    return {
      enableOCR: this.mergeValue('enableOCR', defaults.enableOCR, gpo?.features.enableOCR, mdm?.features.enableOCR),
      enableRedaction: this.mergeValue('enableRedaction', defaults.enableRedaction, gpo?.features.enableRedaction, mdm?.features.enableRedaction),
      enableSignatures: this.mergeValue('enableSignatures', defaults.enableSignatures, gpo?.features.enableSignatures, mdm?.features.enableSignatures),
      enablePrinting: this.mergeValue('enablePrinting', defaults.enablePrinting, gpo?.features.enablePrinting, mdm?.features.enablePrinting),
      enableExport: this.mergeValue('enableExport', defaults.enableExport, gpo?.features.enableExport, mdm?.features.enableExport),
      enableCloudStorage: this.mergeValue('enableCloudStorage', defaults.enableCloudStorage, gpo?.features.enableCloudStorage, mdm?.features.enableCloudStorage),
      enableBatchProcessing: this.mergeValue('enableBatchProcessing', defaults.enableBatchProcessing, gpo?.features.enableBatchProcessing, mdm?.features.enableBatchProcessing),
      enableFormFilling: this.mergeValue('enableFormFilling', defaults.enableFormFilling, undefined, mdm?.features.enableFormFilling),
      enableAnnotations: this.mergeValue('enableAnnotations', defaults.enableAnnotations, undefined, mdm?.features.enableAnnotations),
      enableComparison: this.mergeValue('enableComparison', defaults.enableComparison, undefined, mdm?.features.enableComparison),
    };
  }

  /**
   * Merge update settings
   */
  private mergeUpdateSettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedUpdateSettings {
    const defaults = DEFAULT_VALUES.updates;

    return {
      enableAutoUpdate: this.mergeValue('enableAutoUpdate', defaults.enableAutoUpdate, gpo?.updates.enableAutoUpdate, mdm?.updates.enableAutoUpdate),
      updateChannel: this.mergeValue('updateChannel', defaults.updateChannel, gpo?.updates.updateChannel, mdm?.updates.updateChannel),
      updateServerURL: this.mergeValue('updateServerURL', defaults.updateServerURL, gpo?.updates.updateServerURL, mdm?.updates.updateServerURL),
      checkFrequency: this.mergeValue('checkFrequency', defaults.checkFrequency, gpo?.updates.checkFrequency, mdm?.updates.checkFrequency),
      allowPrerelease: this.mergeValue('allowPrerelease', defaults.allowPrerelease, undefined, mdm?.updates.allowPrerelease),
      allowDowngrade: this.mergeValue('allowDowngrade', defaults.allowDowngrade, undefined, mdm?.updates.allowDowngrade),
    };
  }

  /**
   * Merge network settings
   */
  private mergeNetworkSettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedNetworkSettings {
    const defaults = DEFAULT_VALUES.network;

    return {
      proxyServer: this.mergeValue('proxyServer', defaults.proxyServer, gpo?.network.proxyServer, mdm?.network.proxyServer),
      proxyPort: this.mergeValue('proxyPort', defaults.proxyPort, gpo?.network.proxyPort, mdm?.network.proxyPort),
      proxyBypass: this.mergeValue('proxyBypass', defaults.proxyBypass, gpo?.network.proxyBypass, mdm?.network.proxyBypass),
      allowTelemetry: this.mergeValue('allowTelemetry', defaults.allowTelemetry, gpo?.network.allowTelemetry, mdm?.network.allowTelemetry),
      offlineMode: this.mergeValue('offlineMode', defaults.offlineMode, undefined, mdm?.network.offlineMode),
    };
  }

  /**
   * Merge performance settings
   */
  private mergePerformanceSettings(
    gpo: GPOPolicyConfig | null,
    mdm: MDMPolicyConfig | null
  ): MergedPerformanceSettings {
    const defaults = DEFAULT_VALUES.performance;

    return {
      maxMemoryUsageMB: this.mergeValue('maxMemoryUsageMB', defaults.maxMemoryUsageMB, gpo?.performance.maxMemoryUsageMB, mdm?.performance.maxMemoryUsageMB),
      enableHardwareAcceleration: this.mergeValue('enableHardwareAcceleration', defaults.enableHardwareAcceleration, gpo?.performance.enableHardwareAcceleration, mdm?.performance.enableHardwareAcceleration),
      thumbnailCacheSize: this.mergeValue('thumbnailCacheSize', defaults.thumbnailCacheSize, undefined, mdm?.performance.thumbnailCacheSize),
      maxConcurrentOperations: this.mergeValue('maxConcurrentOperations', defaults.maxConcurrentOperations, undefined, mdm?.performance.maxConcurrentOperations),
    };
  }

  /**
   * Extract admin contact from MDM
   */
  private extractAdminContact(mdm: MDMPolicyConfig | null): AdminContact {
    return {
      email: mdm?.admin.adminContactEmail?.value ?? null,
      name: mdm?.admin.adminContactName?.value ?? null,
      organization: mdm?.admin.organizationName?.value ?? null,
    };
  }

  /**
   * Merge a single value from multiple sources
   */
  private mergeValue<T>(
    key: string,
    defaultValue: T,
    gpoValue?: { value: T; isManaged: boolean } | undefined,
    mdmValue?: { value: T; isManaged: boolean } | undefined
  ): MergedPolicyValue<T> {
    // Check GPO (Windows) - highest precedence on Windows
    if (gpoValue?.isManaged) {
      return createMergedValue(gpoValue.value, PolicySource.GPO, defaultValue);
    }

    // Check MDM (macOS) - highest precedence on macOS
    if (mdmValue?.isManaged) {
      return createMergedValue(mdmValue.value, PolicySource.MDM, defaultValue);
    }

    // Check config file settings
    const configValue = this.configFileSettings[key];
    if (configValue !== undefined) {
      return createMergedValue(configValue as T, PolicySource.ConfigFile, defaultValue);
    }

    // Check user preferences
    const userValue = this.userSettings[key];
    if (userValue !== undefined) {
      return createMergedValue(userValue as T, PolicySource.UserPreference, defaultValue);
    }

    // Return default
    return createMergedValue(defaultValue, PolicySource.Default, defaultValue);
  }

  /**
   * Clear cached configuration
   */
  clearCache(): void {
    this.cachedConfig = null;
    gpoReader.clearCache();
    mdmReader.clearCache();
  }

  /**
   * Get all locked (managed) settings
   */
  async getLockedSettings(): Promise<string[]> {
    const config = await this.mergeAllPolicies();
    const locked: string[] = [];

    const checkLocked = (obj: Record<string, MergedPolicyValue>, prefix: string) => {
      for (const [key, value] of Object.entries(obj)) {
        if (value.isLocked) {
          locked.push(`${prefix}.${key}`);
        }
      }
    };

    checkLocked(config.application as unknown as Record<string, MergedPolicyValue>, 'application');
    checkLocked(config.security as unknown as Record<string, MergedPolicyValue>, 'security');
    checkLocked(config.features as unknown as Record<string, MergedPolicyValue>, 'features');
    checkLocked(config.updates as unknown as Record<string, MergedPolicyValue>, 'updates');
    checkLocked(config.network as unknown as Record<string, MergedPolicyValue>, 'network');
    checkLocked(config.performance as unknown as Record<string, MergedPolicyValue>, 'performance');

    return locked;
  }
}

// Singleton instance
export const policyMerger = new PolicyMerger();

export default policyMerger;
