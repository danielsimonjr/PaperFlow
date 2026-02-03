/**
 * GPO Reader Module
 *
 * Reads Windows Group Policy settings from the registry and converts
 * them to application configuration. HKLM policies take precedence over HKCU.
 */

import {
  registryAccess,
  POLICY_PATHS,
  isWindows,
  type RegistryHive,
} from './registryAccess';

/**
 * GPO Policy value with source information
 */
export interface GPOPolicyValue<T = unknown> {
  value: T;
  source: RegistryHive | 'default';
  isManaged: boolean;
  path: string;
}

/**
 * Application settings from GPO
 */
export interface GPOApplicationSettings {
  defaultZoom?: GPOPolicyValue<number>;
  defaultViewMode?: GPOPolicyValue<'single' | 'continuous' | 'spread'>;
  enableAutoSave?: GPOPolicyValue<boolean>;
  autoSaveInterval?: GPOPolicyValue<number>;
  minimizeToTray?: GPOPolicyValue<boolean>;
  launchOnStartup?: GPOPolicyValue<boolean>;
}

/**
 * Security settings from GPO
 */
export interface GPOSecuritySettings {
  requireEncryption?: GPOPolicyValue<boolean>;
  minEncryptionLevel?: GPOPolicyValue<'AES-128' | 'AES-256'>;
  disableJavaScript?: GPOPolicyValue<boolean>;
  disableExternalLinks?: GPOPolicyValue<boolean>;
  trustedLocations?: GPOPolicyValue<string[]>;
}

/**
 * Feature toggle settings from GPO
 */
export interface GPOFeatureSettings {
  enableOCR?: GPOPolicyValue<boolean>;
  enableRedaction?: GPOPolicyValue<boolean>;
  enableSignatures?: GPOPolicyValue<boolean>;
  enablePrinting?: GPOPolicyValue<boolean>;
  enableExport?: GPOPolicyValue<boolean>;
  enableCloudStorage?: GPOPolicyValue<boolean>;
  enableBatchProcessing?: GPOPolicyValue<boolean>;
}

/**
 * Update settings from GPO
 */
export interface GPOUpdateSettings {
  enableAutoUpdate?: GPOPolicyValue<boolean>;
  updateChannel?: GPOPolicyValue<'stable' | 'beta' | 'alpha'>;
  updateServerURL?: GPOPolicyValue<string>;
  checkFrequency?: GPOPolicyValue<'hourly' | 'daily' | 'weekly' | 'never'>;
}

/**
 * Network settings from GPO
 */
export interface GPONetworkSettings {
  proxyServer?: GPOPolicyValue<string>;
  proxyPort?: GPOPolicyValue<number>;
  proxyBypass?: GPOPolicyValue<string[]>;
  allowTelemetry?: GPOPolicyValue<boolean>;
}

/**
 * Performance settings from GPO
 */
export interface GPOPerformanceSettings {
  maxMemoryUsageMB?: GPOPolicyValue<number>;
  enableHardwareAcceleration?: GPOPolicyValue<boolean>;
}

/**
 * Complete GPO policy configuration
 */
export interface GPOPolicyConfig {
  application: GPOApplicationSettings;
  security: GPOSecuritySettings;
  features: GPOFeatureSettings;
  updates: GPOUpdateSettings;
  network: GPONetworkSettings;
  performance: GPOPerformanceSettings;
  isWindows: boolean;
  lastRefreshed: number;
}

/**
 * GPO Reader class
 */
class GPOReader {
  private cachedConfig: GPOPolicyConfig | null = null;
  private cacheTimestamp: number = 0;
  private cacheDurationMs: number = 60000; // 1 minute cache

  /**
   * Check if GPO policies are available
   */
  isAvailable(): boolean {
    return isWindows();
  }

  /**
   * Read all GPO policies
   */
  async readAllPolicies(forceRefresh = false): Promise<GPOPolicyConfig> {
    const now = Date.now();

    // Return cached config if still valid
    if (
      !forceRefresh &&
      this.cachedConfig &&
      now - this.cacheTimestamp < this.cacheDurationMs
    ) {
      return this.cachedConfig;
    }

    const config: GPOPolicyConfig = {
      application: await this.readApplicationSettings(),
      security: await this.readSecuritySettings(),
      features: await this.readFeatureSettings(),
      updates: await this.readUpdateSettings(),
      network: await this.readNetworkSettings(),
      performance: await this.readPerformanceSettings(),
      isWindows: isWindows(),
      lastRefreshed: now,
    };

    this.cachedConfig = config;
    this.cacheTimestamp = now;

    return config;
  }

  /**
   * Read application settings from GPO
   */
  async readApplicationSettings(): Promise<GPOApplicationSettings> {
    const settings: GPOApplicationSettings = {};
    const path = POLICY_PATHS.application;

    // Default Zoom
    const zoomResult = await registryAccess.readDword(path, 'DefaultZoom');
    if (zoomResult.exists && zoomResult.value !== null) {
      settings.defaultZoom = {
        value: Math.max(10, Math.min(400, zoomResult.value)),
        source: zoomResult.hive,
        isManaged: true,
        path: `${path}\\DefaultZoom`,
      };
    }

    // Default View Mode
    const viewModeResult = await registryAccess.readString(path, 'DefaultViewMode');
    if (viewModeResult.exists && viewModeResult.value !== null) {
      const validModes = ['single', 'continuous', 'spread'];
      if (validModes.includes(viewModeResult.value)) {
        settings.defaultViewMode = {
          value: viewModeResult.value as 'single' | 'continuous' | 'spread',
          source: viewModeResult.hive,
          isManaged: true,
          path: `${path}\\DefaultViewMode`,
        };
      }
    }

    // Enable Auto-Save
    const autoSaveResult = await registryAccess.readDword(path, 'EnableAutoSave');
    if (autoSaveResult.exists && autoSaveResult.value !== null) {
      settings.enableAutoSave = {
        value: autoSaveResult.value !== 0,
        source: autoSaveResult.hive,
        isManaged: true,
        path: `${path}\\EnableAutoSave`,
      };
    }

    // Auto-Save Interval
    const intervalResult = await registryAccess.readDword(path, 'AutoSaveInterval');
    if (intervalResult.exists && intervalResult.value !== null) {
      settings.autoSaveInterval = {
        value: Math.max(10, Math.min(300, intervalResult.value)),
        source: intervalResult.hive,
        isManaged: true,
        path: `${path}\\AutoSaveInterval`,
      };
    }

    // Minimize to Tray
    const trayResult = await registryAccess.readDword(path, 'MinimizeToTray');
    if (trayResult.exists && trayResult.value !== null) {
      settings.minimizeToTray = {
        value: trayResult.value !== 0,
        source: trayResult.hive,
        isManaged: true,
        path: `${path}\\MinimizeToTray`,
      };
    }

    // Launch on Startup
    const startupResult = await registryAccess.readDword(path, 'LaunchOnStartup');
    if (startupResult.exists && startupResult.value !== null) {
      settings.launchOnStartup = {
        value: startupResult.value !== 0,
        source: startupResult.hive,
        isManaged: true,
        path: `${path}\\LaunchOnStartup`,
      };
    }

    return settings;
  }

  /**
   * Read security settings from GPO
   */
  async readSecuritySettings(): Promise<GPOSecuritySettings> {
    const settings: GPOSecuritySettings = {};
    const path = POLICY_PATHS.security;

    // Require Encryption
    const encryptionResult = await registryAccess.readDword(path, 'RequireEncryption');
    if (encryptionResult.exists && encryptionResult.value !== null) {
      settings.requireEncryption = {
        value: encryptionResult.value !== 0,
        source: encryptionResult.hive,
        isManaged: true,
        path: `${path}\\RequireEncryption`,
      };
    }

    // Min Encryption Level
    const encLevelResult = await registryAccess.readString(path, 'MinEncryptionLevel');
    if (encLevelResult.exists && encLevelResult.value !== null) {
      const validLevels = ['AES-128', 'AES-256'];
      if (validLevels.includes(encLevelResult.value)) {
        settings.minEncryptionLevel = {
          value: encLevelResult.value as 'AES-128' | 'AES-256',
          source: encLevelResult.hive,
          isManaged: true,
          path: `${path}\\MinEncryptionLevel`,
        };
      }
    }

    // Disable JavaScript
    const jsResult = await registryAccess.readDword(path, 'DisableJavaScript');
    if (jsResult.exists && jsResult.value !== null) {
      settings.disableJavaScript = {
        value: jsResult.value !== 0,
        source: jsResult.hive,
        isManaged: true,
        path: `${path}\\DisableJavaScript`,
      };
    }

    // Disable External Links
    const linksResult = await registryAccess.readDword(path, 'DisableExternalLinks');
    if (linksResult.exists && linksResult.value !== null) {
      settings.disableExternalLinks = {
        value: linksResult.value !== 0,
        source: linksResult.hive,
        isManaged: true,
        path: `${path}\\DisableExternalLinks`,
      };
    }

    // Trusted Locations
    const locationsResult = await registryAccess.readMultiString(path, 'TrustedLocations');
    if (locationsResult.exists && locationsResult.value !== null) {
      settings.trustedLocations = {
        value: locationsResult.value,
        source: locationsResult.hive,
        isManaged: true,
        path: `${path}\\TrustedLocations`,
      };
    }

    return settings;
  }

  /**
   * Read feature settings from GPO
   */
  async readFeatureSettings(): Promise<GPOFeatureSettings> {
    const settings: GPOFeatureSettings = {};
    const path = POLICY_PATHS.features;

    const features = [
      { key: 'EnableOCR', prop: 'enableOCR' },
      { key: 'EnableRedaction', prop: 'enableRedaction' },
      { key: 'EnableSignatures', prop: 'enableSignatures' },
      { key: 'EnablePrinting', prop: 'enablePrinting' },
      { key: 'EnableExport', prop: 'enableExport' },
      { key: 'EnableCloudStorage', prop: 'enableCloudStorage' },
      { key: 'EnableBatchProcessing', prop: 'enableBatchProcessing' },
    ] as const;

    for (const feature of features) {
      const result = await registryAccess.readDword(path, feature.key);
      if (result.exists && result.value !== null) {
        (settings as Record<string, GPOPolicyValue<boolean>>)[feature.prop] = {
          value: result.value !== 0,
          source: result.hive,
          isManaged: true,
          path: `${path}\\${feature.key}`,
        };
      }
    }

    return settings;
  }

  /**
   * Read update settings from GPO
   */
  async readUpdateSettings(): Promise<GPOUpdateSettings> {
    const settings: GPOUpdateSettings = {};
    const path = POLICY_PATHS.updates;

    // Enable Auto-Update
    const autoUpdateResult = await registryAccess.readDword(path, 'EnableAutoUpdate');
    if (autoUpdateResult.exists && autoUpdateResult.value !== null) {
      settings.enableAutoUpdate = {
        value: autoUpdateResult.value !== 0,
        source: autoUpdateResult.hive,
        isManaged: true,
        path: `${path}\\EnableAutoUpdate`,
      };
    }

    // Update Channel
    const channelResult = await registryAccess.readString(path, 'UpdateChannel');
    if (channelResult.exists && channelResult.value !== null) {
      const validChannels = ['stable', 'beta', 'alpha'];
      if (validChannels.includes(channelResult.value)) {
        settings.updateChannel = {
          value: channelResult.value as 'stable' | 'beta' | 'alpha',
          source: channelResult.hive,
          isManaged: true,
          path: `${path}\\UpdateChannel`,
        };
      }
    }

    // Update Server URL
    const serverResult = await registryAccess.readString(path, 'UpdateServerURL');
    if (serverResult.exists && serverResult.value !== null && serverResult.value.trim()) {
      settings.updateServerURL = {
        value: serverResult.value,
        source: serverResult.hive,
        isManaged: true,
        path: `${path}\\UpdateServerURL`,
      };
    }

    // Check Frequency
    const frequencyResult = await registryAccess.readString(path, 'CheckFrequency');
    if (frequencyResult.exists && frequencyResult.value !== null) {
      const validFrequencies = ['hourly', 'daily', 'weekly', 'never'];
      if (validFrequencies.includes(frequencyResult.value)) {
        settings.checkFrequency = {
          value: frequencyResult.value as 'hourly' | 'daily' | 'weekly' | 'never',
          source: frequencyResult.hive,
          isManaged: true,
          path: `${path}\\CheckFrequency`,
        };
      }
    }

    return settings;
  }

  /**
   * Read network settings from GPO
   */
  async readNetworkSettings(): Promise<GPONetworkSettings> {
    const settings: GPONetworkSettings = {};
    const path = POLICY_PATHS.network;

    // Proxy Server
    const serverResult = await registryAccess.readString(path, 'ProxyServer');
    if (serverResult.exists && serverResult.value !== null && serverResult.value.trim()) {
      settings.proxyServer = {
        value: serverResult.value,
        source: serverResult.hive,
        isManaged: true,
        path: `${path}\\ProxyServer`,
      };
    }

    // Proxy Port
    const portResult = await registryAccess.readDword(path, 'ProxyPort');
    if (portResult.exists && portResult.value !== null) {
      settings.proxyPort = {
        value: Math.max(1, Math.min(65535, portResult.value)),
        source: portResult.hive,
        isManaged: true,
        path: `${path}\\ProxyPort`,
      };
    }

    // Proxy Bypass
    const bypassResult = await registryAccess.readMultiString(path, 'ProxyBypass');
    if (bypassResult.exists && bypassResult.value !== null) {
      settings.proxyBypass = {
        value: bypassResult.value,
        source: bypassResult.hive,
        isManaged: true,
        path: `${path}\\ProxyBypass`,
      };
    }

    // Allow Telemetry
    const telemetryResult = await registryAccess.readDword(path, 'AllowTelemetry');
    if (telemetryResult.exists && telemetryResult.value !== null) {
      settings.allowTelemetry = {
        value: telemetryResult.value !== 0,
        source: telemetryResult.hive,
        isManaged: true,
        path: `${path}\\AllowTelemetry`,
      };
    }

    return settings;
  }

  /**
   * Read performance settings from GPO
   */
  async readPerformanceSettings(): Promise<GPOPerformanceSettings> {
    const settings: GPOPerformanceSettings = {};
    const path = POLICY_PATHS.performance;

    // Max Memory Usage
    const memoryResult = await registryAccess.readDword(path, 'MaxMemoryUsageMB');
    if (memoryResult.exists && memoryResult.value !== null) {
      settings.maxMemoryUsageMB = {
        value: Math.max(256, Math.min(8192, memoryResult.value)),
        source: memoryResult.hive,
        isManaged: true,
        path: `${path}\\MaxMemoryUsageMB`,
      };
    }

    // Hardware Acceleration
    const hwAccelResult = await registryAccess.readDword(path, 'EnableHardwareAcceleration');
    if (hwAccelResult.exists && hwAccelResult.value !== null) {
      settings.enableHardwareAcceleration = {
        value: hwAccelResult.value !== 0,
        source: hwAccelResult.hive,
        isManaged: true,
        path: `${path}\\EnableHardwareAcceleration`,
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
      obj: Record<string, GPOPolicyValue | undefined>,
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

    extractPolicies(config.application as Record<string, GPOPolicyValue>, 'application');
    extractPolicies(config.security as Record<string, GPOPolicyValue>, 'security');
    extractPolicies(config.features as Record<string, GPOPolicyValue>, 'features');
    extractPolicies(config.updates as Record<string, GPOPolicyValue>, 'updates');
    extractPolicies(config.network as Record<string, GPOPolicyValue>, 'network');
    extractPolicies(config.performance as Record<string, GPOPolicyValue>, 'performance');

    return policies;
  }

  /**
   * Clear cached policies
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Set cache duration in milliseconds
   */
  setCacheDuration(ms: number): void {
    this.cacheDurationMs = ms;
  }
}

// Singleton instance
export const gpoReader = new GPOReader();

export default gpoReader;
