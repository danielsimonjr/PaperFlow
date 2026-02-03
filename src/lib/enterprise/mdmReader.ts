/**
 * MDM Reader Module
 *
 * Reads macOS MDM managed preferences and converts them to application configuration.
 * MCX (Managed Client for X) managed preferences take precedence over user preferences.
 */

import {
  macPreferences,
  isMacOS,
  type PreferenceSource,
} from './macPreferences';

/**
 * MDM Policy value with source information
 */
export interface MDMPolicyValue<T = unknown> {
  value: T;
  source: PreferenceSource;
  isManaged: boolean;
  key: string;
}

/**
 * Application settings from MDM
 */
export interface MDMApplicationSettings {
  defaultZoom?: MDMPolicyValue<number>;
  defaultViewMode?: MDMPolicyValue<'single' | 'continuous' | 'spread'>;
  enableAutoSave?: MDMPolicyValue<boolean>;
  autoSaveInterval?: MDMPolicyValue<number>;
  minimizeToTray?: MDMPolicyValue<boolean>;
  launchOnStartup?: MDMPolicyValue<boolean>;
  smoothScrolling?: MDMPolicyValue<boolean>;
  defaultHighlightColor?: MDMPolicyValue<string>;
  defaultAnnotationOpacity?: MDMPolicyValue<number>;
}

/**
 * Security settings from MDM
 */
export interface MDMSecuritySettings {
  requireEncryption?: MDMPolicyValue<boolean>;
  minEncryptionLevel?: MDMPolicyValue<'AES-128' | 'AES-256'>;
  disableJavaScript?: MDMPolicyValue<boolean>;
  disableExternalLinks?: MDMPolicyValue<boolean>;
  trustedLocations?: MDMPolicyValue<string[]>;
}

/**
 * Feature toggle settings from MDM
 */
export interface MDMFeatureSettings {
  enableOCR?: MDMPolicyValue<boolean>;
  enableRedaction?: MDMPolicyValue<boolean>;
  enableSignatures?: MDMPolicyValue<boolean>;
  enablePrinting?: MDMPolicyValue<boolean>;
  enableExport?: MDMPolicyValue<boolean>;
  enableCloudStorage?: MDMPolicyValue<boolean>;
  enableBatchProcessing?: MDMPolicyValue<boolean>;
  enableFormFilling?: MDMPolicyValue<boolean>;
  enableAnnotations?: MDMPolicyValue<boolean>;
  enableComparison?: MDMPolicyValue<boolean>;
}

/**
 * Update settings from MDM
 */
export interface MDMUpdateSettings {
  enableAutoUpdate?: MDMPolicyValue<boolean>;
  updateChannel?: MDMPolicyValue<'stable' | 'beta' | 'alpha'>;
  updateServerURL?: MDMPolicyValue<string>;
  checkFrequency?: MDMPolicyValue<'hourly' | 'daily' | 'weekly' | 'never'>;
  allowPrerelease?: MDMPolicyValue<boolean>;
  allowDowngrade?: MDMPolicyValue<boolean>;
}

/**
 * Network settings from MDM
 */
export interface MDMNetworkSettings {
  proxyServer?: MDMPolicyValue<string>;
  proxyPort?: MDMPolicyValue<number>;
  proxyBypass?: MDMPolicyValue<string[]>;
  allowTelemetry?: MDMPolicyValue<boolean>;
  offlineMode?: MDMPolicyValue<boolean>;
}

/**
 * Performance settings from MDM
 */
export interface MDMPerformanceSettings {
  maxMemoryUsageMB?: MDMPolicyValue<number>;
  enableHardwareAcceleration?: MDMPolicyValue<boolean>;
  thumbnailCacheSize?: MDMPolicyValue<number>;
  maxConcurrentOperations?: MDMPolicyValue<number>;
}

/**
 * Admin/Organization settings from MDM
 */
export interface MDMAdminSettings {
  adminContactEmail?: MDMPolicyValue<string>;
  adminContactName?: MDMPolicyValue<string>;
  organizationName?: MDMPolicyValue<string>;
  showManagedIndicator?: MDMPolicyValue<boolean>;
}

/**
 * Complete MDM policy configuration
 */
export interface MDMPolicyConfig {
  application: MDMApplicationSettings;
  security: MDMSecuritySettings;
  features: MDMFeatureSettings;
  updates: MDMUpdateSettings;
  network: MDMNetworkSettings;
  performance: MDMPerformanceSettings;
  admin: MDMAdminSettings;
  isMacOS: boolean;
  lastRefreshed: number;
}

/**
 * MDM Reader class
 */
class MDMReader {
  private cachedConfig: MDMPolicyConfig | null = null;
  private cacheTimestamp: number = 0;
  private cacheDurationMs: number = 60000; // 1 minute cache

  /**
   * Check if MDM policies are available
   */
  isAvailable(): boolean {
    return isMacOS();
  }

  /**
   * Read all MDM policies
   */
  async readAllPolicies(forceRefresh = false): Promise<MDMPolicyConfig> {
    const now = Date.now();

    // Return cached config if still valid
    if (
      !forceRefresh &&
      this.cachedConfig &&
      now - this.cacheTimestamp < this.cacheDurationMs
    ) {
      return this.cachedConfig;
    }

    const config: MDMPolicyConfig = {
      application: await this.readApplicationSettings(),
      security: await this.readSecuritySettings(),
      features: await this.readFeatureSettings(),
      updates: await this.readUpdateSettings(),
      network: await this.readNetworkSettings(),
      performance: await this.readPerformanceSettings(),
      admin: await this.readAdminSettings(),
      isMacOS: isMacOS(),
      lastRefreshed: now,
    };

    this.cachedConfig = config;
    this.cacheTimestamp = now;

    return config;
  }

  /**
   * Read application settings from MDM
   */
  async readApplicationSettings(): Promise<MDMApplicationSettings> {
    const settings: MDMApplicationSettings = {};

    // Default Zoom
    const zoomResult = await macPreferences.readInteger('DefaultZoom');
    if (zoomResult.exists && zoomResult.value !== null) {
      settings.defaultZoom = {
        value: Math.max(10, Math.min(400, zoomResult.value)),
        source: zoomResult.source,
        isManaged: zoomResult.isManaged,
        key: 'DefaultZoom',
      };
    }

    // Default View Mode
    const viewModeResult = await macPreferences.readString('DefaultViewMode');
    if (viewModeResult.exists && viewModeResult.value !== null) {
      const validModes = ['single', 'continuous', 'spread'];
      if (validModes.includes(viewModeResult.value)) {
        settings.defaultViewMode = {
          value: viewModeResult.value as 'single' | 'continuous' | 'spread',
          source: viewModeResult.source,
          isManaged: viewModeResult.isManaged,
          key: 'DefaultViewMode',
        };
      }
    }

    // Enable Auto-Save
    const autoSaveResult = await macPreferences.readBoolean('EnableAutoSave');
    if (autoSaveResult.exists && autoSaveResult.value !== null) {
      settings.enableAutoSave = {
        value: autoSaveResult.value,
        source: autoSaveResult.source,
        isManaged: autoSaveResult.isManaged,
        key: 'EnableAutoSave',
      };
    }

    // Auto-Save Interval
    const intervalResult = await macPreferences.readInteger('AutoSaveInterval');
    if (intervalResult.exists && intervalResult.value !== null) {
      settings.autoSaveInterval = {
        value: Math.max(10, Math.min(300, intervalResult.value)),
        source: intervalResult.source,
        isManaged: intervalResult.isManaged,
        key: 'AutoSaveInterval',
      };
    }

    // Minimize to Tray
    const trayResult = await macPreferences.readBoolean('MinimizeToTray');
    if (trayResult.exists && trayResult.value !== null) {
      settings.minimizeToTray = {
        value: trayResult.value,
        source: trayResult.source,
        isManaged: trayResult.isManaged,
        key: 'MinimizeToTray',
      };
    }

    // Launch on Startup
    const startupResult = await macPreferences.readBoolean('LaunchOnStartup');
    if (startupResult.exists && startupResult.value !== null) {
      settings.launchOnStartup = {
        value: startupResult.value,
        source: startupResult.source,
        isManaged: startupResult.isManaged,
        key: 'LaunchOnStartup',
      };
    }

    // Smooth Scrolling
    const scrollResult = await macPreferences.readBoolean('SmoothScrolling');
    if (scrollResult.exists && scrollResult.value !== null) {
      settings.smoothScrolling = {
        value: scrollResult.value,
        source: scrollResult.source,
        isManaged: scrollResult.isManaged,
        key: 'SmoothScrolling',
      };
    }

    // Default Highlight Color
    const colorResult = await macPreferences.readString('DefaultHighlightColor');
    if (colorResult.exists && colorResult.value !== null) {
      settings.defaultHighlightColor = {
        value: colorResult.value,
        source: colorResult.source,
        isManaged: colorResult.isManaged,
        key: 'DefaultHighlightColor',
      };
    }

    // Default Annotation Opacity
    const opacityResult = await macPreferences.readFloat('DefaultAnnotationOpacity');
    if (opacityResult.exists && opacityResult.value !== null) {
      settings.defaultAnnotationOpacity = {
        value: Math.max(0.1, Math.min(1.0, opacityResult.value)),
        source: opacityResult.source,
        isManaged: opacityResult.isManaged,
        key: 'DefaultAnnotationOpacity',
      };
    }

    return settings;
  }

  /**
   * Read security settings from MDM
   */
  async readSecuritySettings(): Promise<MDMSecuritySettings> {
    const settings: MDMSecuritySettings = {};

    // Require Encryption
    const encryptionResult = await macPreferences.readBoolean('RequireEncryption');
    if (encryptionResult.exists && encryptionResult.value !== null) {
      settings.requireEncryption = {
        value: encryptionResult.value,
        source: encryptionResult.source,
        isManaged: encryptionResult.isManaged,
        key: 'RequireEncryption',
      };
    }

    // Min Encryption Level
    const encLevelResult = await macPreferences.readString('MinEncryptionLevel');
    if (encLevelResult.exists && encLevelResult.value !== null) {
      const validLevels = ['AES-128', 'AES-256'];
      if (validLevels.includes(encLevelResult.value)) {
        settings.minEncryptionLevel = {
          value: encLevelResult.value as 'AES-128' | 'AES-256',
          source: encLevelResult.source,
          isManaged: encLevelResult.isManaged,
          key: 'MinEncryptionLevel',
        };
      }
    }

    // Disable JavaScript
    const jsResult = await macPreferences.readBoolean('DisableJavaScript');
    if (jsResult.exists && jsResult.value !== null) {
      settings.disableJavaScript = {
        value: jsResult.value,
        source: jsResult.source,
        isManaged: jsResult.isManaged,
        key: 'DisableJavaScript',
      };
    }

    // Disable External Links
    const linksResult = await macPreferences.readBoolean('DisableExternalLinks');
    if (linksResult.exists && linksResult.value !== null) {
      settings.disableExternalLinks = {
        value: linksResult.value,
        source: linksResult.source,
        isManaged: linksResult.isManaged,
        key: 'DisableExternalLinks',
      };
    }

    // Trusted Locations
    const locationsResult = await macPreferences.readArray('TrustedLocations');
    if (locationsResult.exists && locationsResult.value !== null) {
      settings.trustedLocations = {
        value: locationsResult.value,
        source: locationsResult.source,
        isManaged: locationsResult.isManaged,
        key: 'TrustedLocations',
      };
    }

    return settings;
  }

  /**
   * Read feature settings from MDM
   */
  async readFeatureSettings(): Promise<MDMFeatureSettings> {
    const settings: MDMFeatureSettings = {};

    const features = [
      { key: 'EnableOCR', prop: 'enableOCR' },
      { key: 'EnableRedaction', prop: 'enableRedaction' },
      { key: 'EnableSignatures', prop: 'enableSignatures' },
      { key: 'EnablePrinting', prop: 'enablePrinting' },
      { key: 'EnableExport', prop: 'enableExport' },
      { key: 'EnableCloudStorage', prop: 'enableCloudStorage' },
      { key: 'EnableBatchProcessing', prop: 'enableBatchProcessing' },
      { key: 'EnableFormFilling', prop: 'enableFormFilling' },
      { key: 'EnableAnnotations', prop: 'enableAnnotations' },
      { key: 'EnableComparison', prop: 'enableComparison' },
    ] as const;

    for (const feature of features) {
      const result = await macPreferences.readBoolean(feature.key);
      if (result.exists && result.value !== null) {
        (settings as Record<string, MDMPolicyValue<boolean>>)[feature.prop] = {
          value: result.value,
          source: result.source,
          isManaged: result.isManaged,
          key: feature.key,
        };
      }
    }

    return settings;
  }

  /**
   * Read update settings from MDM
   */
  async readUpdateSettings(): Promise<MDMUpdateSettings> {
    const settings: MDMUpdateSettings = {};

    // Enable Auto-Update
    const autoUpdateResult = await macPreferences.readBoolean('EnableAutoUpdate');
    if (autoUpdateResult.exists && autoUpdateResult.value !== null) {
      settings.enableAutoUpdate = {
        value: autoUpdateResult.value,
        source: autoUpdateResult.source,
        isManaged: autoUpdateResult.isManaged,
        key: 'EnableAutoUpdate',
      };
    }

    // Update Channel
    const channelResult = await macPreferences.readString('UpdateChannel');
    if (channelResult.exists && channelResult.value !== null) {
      const validChannels = ['stable', 'beta', 'alpha'];
      if (validChannels.includes(channelResult.value)) {
        settings.updateChannel = {
          value: channelResult.value as 'stable' | 'beta' | 'alpha',
          source: channelResult.source,
          isManaged: channelResult.isManaged,
          key: 'UpdateChannel',
        };
      }
    }

    // Update Server URL
    const serverResult = await macPreferences.readString('UpdateServerURL');
    if (serverResult.exists && serverResult.value !== null && serverResult.value.trim()) {
      settings.updateServerURL = {
        value: serverResult.value,
        source: serverResult.source,
        isManaged: serverResult.isManaged,
        key: 'UpdateServerURL',
      };
    }

    // Check Frequency
    const frequencyResult = await macPreferences.readString('CheckFrequency');
    if (frequencyResult.exists && frequencyResult.value !== null) {
      const validFrequencies = ['hourly', 'daily', 'weekly', 'never'];
      if (validFrequencies.includes(frequencyResult.value)) {
        settings.checkFrequency = {
          value: frequencyResult.value as 'hourly' | 'daily' | 'weekly' | 'never',
          source: frequencyResult.source,
          isManaged: frequencyResult.isManaged,
          key: 'CheckFrequency',
        };
      }
    }

    // Allow Prerelease
    const prereleaseResult = await macPreferences.readBoolean('AllowPrerelease');
    if (prereleaseResult.exists && prereleaseResult.value !== null) {
      settings.allowPrerelease = {
        value: prereleaseResult.value,
        source: prereleaseResult.source,
        isManaged: prereleaseResult.isManaged,
        key: 'AllowPrerelease',
      };
    }

    // Allow Downgrade
    const downgradeResult = await macPreferences.readBoolean('AllowDowngrade');
    if (downgradeResult.exists && downgradeResult.value !== null) {
      settings.allowDowngrade = {
        value: downgradeResult.value,
        source: downgradeResult.source,
        isManaged: downgradeResult.isManaged,
        key: 'AllowDowngrade',
      };
    }

    return settings;
  }

  /**
   * Read network settings from MDM
   */
  async readNetworkSettings(): Promise<MDMNetworkSettings> {
    const settings: MDMNetworkSettings = {};

    // Proxy Server
    const serverResult = await macPreferences.readString('ProxyServer');
    if (serverResult.exists && serverResult.value !== null && serverResult.value.trim()) {
      settings.proxyServer = {
        value: serverResult.value,
        source: serverResult.source,
        isManaged: serverResult.isManaged,
        key: 'ProxyServer',
      };
    }

    // Proxy Port
    const portResult = await macPreferences.readInteger('ProxyPort');
    if (portResult.exists && portResult.value !== null) {
      settings.proxyPort = {
        value: Math.max(1, Math.min(65535, portResult.value)),
        source: portResult.source,
        isManaged: portResult.isManaged,
        key: 'ProxyPort',
      };
    }

    // Proxy Bypass
    const bypassResult = await macPreferences.readArray('ProxyBypass');
    if (bypassResult.exists && bypassResult.value !== null) {
      settings.proxyBypass = {
        value: bypassResult.value,
        source: bypassResult.source,
        isManaged: bypassResult.isManaged,
        key: 'ProxyBypass',
      };
    }

    // Allow Telemetry
    const telemetryResult = await macPreferences.readBoolean('AllowTelemetry');
    if (telemetryResult.exists && telemetryResult.value !== null) {
      settings.allowTelemetry = {
        value: telemetryResult.value,
        source: telemetryResult.source,
        isManaged: telemetryResult.isManaged,
        key: 'AllowTelemetry',
      };
    }

    // Offline Mode
    const offlineResult = await macPreferences.readBoolean('OfflineMode');
    if (offlineResult.exists && offlineResult.value !== null) {
      settings.offlineMode = {
        value: offlineResult.value,
        source: offlineResult.source,
        isManaged: offlineResult.isManaged,
        key: 'OfflineMode',
      };
    }

    return settings;
  }

  /**
   * Read performance settings from MDM
   */
  async readPerformanceSettings(): Promise<MDMPerformanceSettings> {
    const settings: MDMPerformanceSettings = {};

    // Max Memory Usage
    const memoryResult = await macPreferences.readInteger('MaxMemoryUsageMB');
    if (memoryResult.exists && memoryResult.value !== null) {
      settings.maxMemoryUsageMB = {
        value: Math.max(256, Math.min(8192, memoryResult.value)),
        source: memoryResult.source,
        isManaged: memoryResult.isManaged,
        key: 'MaxMemoryUsageMB',
      };
    }

    // Hardware Acceleration
    const hwAccelResult = await macPreferences.readBoolean('EnableHardwareAcceleration');
    if (hwAccelResult.exists && hwAccelResult.value !== null) {
      settings.enableHardwareAcceleration = {
        value: hwAccelResult.value,
        source: hwAccelResult.source,
        isManaged: hwAccelResult.isManaged,
        key: 'EnableHardwareAcceleration',
      };
    }

    // Thumbnail Cache Size
    const cacheResult = await macPreferences.readInteger('ThumbnailCacheSize');
    if (cacheResult.exists && cacheResult.value !== null) {
      settings.thumbnailCacheSize = {
        value: Math.max(10, Math.min(500, cacheResult.value)),
        source: cacheResult.source,
        isManaged: cacheResult.isManaged,
        key: 'ThumbnailCacheSize',
      };
    }

    // Max Concurrent Operations
    const concurrentResult = await macPreferences.readInteger('MaxConcurrentOperations');
    if (concurrentResult.exists && concurrentResult.value !== null) {
      settings.maxConcurrentOperations = {
        value: Math.max(1, Math.min(16, concurrentResult.value)),
        source: concurrentResult.source,
        isManaged: concurrentResult.isManaged,
        key: 'MaxConcurrentOperations',
      };
    }

    return settings;
  }

  /**
   * Read admin settings from MDM
   */
  async readAdminSettings(): Promise<MDMAdminSettings> {
    const settings: MDMAdminSettings = {};

    // Admin Contact Email
    const emailResult = await macPreferences.readString('AdminContactEmail');
    if (emailResult.exists && emailResult.value !== null && emailResult.value.trim()) {
      settings.adminContactEmail = {
        value: emailResult.value,
        source: emailResult.source,
        isManaged: emailResult.isManaged,
        key: 'AdminContactEmail',
      };
    }

    // Admin Contact Name
    const nameResult = await macPreferences.readString('AdminContactName');
    if (nameResult.exists && nameResult.value !== null && nameResult.value.trim()) {
      settings.adminContactName = {
        value: nameResult.value,
        source: nameResult.source,
        isManaged: nameResult.isManaged,
        key: 'AdminContactName',
      };
    }

    // Organization Name
    const orgResult = await macPreferences.readString('OrganizationName');
    if (orgResult.exists && orgResult.value !== null && orgResult.value.trim()) {
      settings.organizationName = {
        value: orgResult.value,
        source: orgResult.source,
        isManaged: orgResult.isManaged,
        key: 'OrganizationName',
      };
    }

    // Show Managed Indicator
    const indicatorResult = await macPreferences.readBoolean('ShowManagedIndicator');
    if (indicatorResult.exists && indicatorResult.value !== null) {
      settings.showManagedIndicator = {
        value: indicatorResult.value,
        source: indicatorResult.source,
        isManaged: indicatorResult.isManaged,
        key: 'ShowManagedIndicator',
      };
    }

    return settings;
  }

  /**
   * Get a flattened list of all managed policies
   */
  async getManagedPolicies(): Promise<Array<{ key: string; value: unknown; source: string }>> {
    const config = await this.readAllPolicies();
    const policies: Array<{ key: string; value: unknown; source: string }> = [];

    const extractPolicies = (
      obj: Record<string, MDMPolicyValue | undefined>,
      prefix: string
    ) => {
      for (const [key, policyValue] of Object.entries(obj)) {
        if (policyValue?.isManaged) {
          policies.push({
            key: `${prefix}.${key}`,
            value: policyValue.value,
            source: policyValue.source,
          });
        }
      }
    };

    extractPolicies(config.application as Record<string, MDMPolicyValue>, 'application');
    extractPolicies(config.security as Record<string, MDMPolicyValue>, 'security');
    extractPolicies(config.features as Record<string, MDMPolicyValue>, 'features');
    extractPolicies(config.updates as Record<string, MDMPolicyValue>, 'updates');
    extractPolicies(config.network as Record<string, MDMPolicyValue>, 'network');
    extractPolicies(config.performance as Record<string, MDMPolicyValue>, 'performance');
    extractPolicies(config.admin as Record<string, MDMPolicyValue>, 'admin');

    return policies;
  }

  /**
   * Clear cached policies
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.cacheTimestamp = 0;
    macPreferences.clearCache();
  }

  /**
   * Set cache duration in milliseconds
   */
  setCacheDuration(ms: number): void {
    this.cacheDurationMs = ms;
  }
}

// Singleton instance
export const mdmReader = new MDMReader();

export default mdmReader;
