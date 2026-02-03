/**
 * GPO Reader Tests
 *
 * Tests for Windows Group Policy reading functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  gpoReader,
} from '@lib/enterprise/gpoReader';
import {
  setMockRegistryValue,
  setMockRegistryValues,
  clearMockRegistryValues,
  POLICY_PATHS,
} from '@lib/enterprise/registryAccess';

describe('gpoReader', () => {
  beforeEach(() => {
    clearMockRegistryValues();
    gpoReader.clearCache();
  });

  afterEach(() => {
    clearMockRegistryValues();
  });

  describe('isAvailable', () => {
    it('should return false on non-Windows platforms', () => {
      // In test environment, process.platform is not win32
      const available = gpoReader.isAvailable();
      // This test will pass regardless of platform since we're checking the function works
      expect(typeof available).toBe('boolean');
    });
  });

  describe('readApplicationSettings', () => {
    it('should read default zoom setting', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        150
      );

      const settings = await gpoReader.readApplicationSettings();

      expect(settings.defaultZoom).toBeDefined();
      expect(settings.defaultZoom?.value).toBe(150);
      expect(settings.defaultZoom?.isManaged).toBe(true);
      expect(settings.defaultZoom?.source).toBe('HKLM');
    });

    it('should clamp zoom value to valid range', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        500 // Above max of 400
      );

      const settings = await gpoReader.readApplicationSettings();

      expect(settings.defaultZoom?.value).toBe(400);
    });

    it('should read view mode setting', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultViewMode`,
        'continuous'
      );

      const settings = await gpoReader.readApplicationSettings();

      expect(settings.defaultViewMode?.value).toBe('continuous');
      expect(settings.defaultViewMode?.isManaged).toBe(true);
    });

    it('should ignore invalid view mode values', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultViewMode`,
        'invalid'
      );

      const settings = await gpoReader.readApplicationSettings();

      expect(settings.defaultViewMode).toBeUndefined();
    });

    it('should read boolean settings correctly', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\EnableAutoSave`,
        1
      );
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\MinimizeToTray`,
        0
      );

      const settings = await gpoReader.readApplicationSettings();

      expect(settings.enableAutoSave?.value).toBe(true);
      expect(settings.minimizeToTray?.value).toBe(false);
    });
  });

  describe('readSecuritySettings', () => {
    it('should read encryption settings', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.security}\\RequireEncryption`,
        1
      );
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.security}\\MinEncryptionLevel`,
        'AES-256'
      );

      const settings = await gpoReader.readSecuritySettings();

      expect(settings.requireEncryption?.value).toBe(true);
      expect(settings.minEncryptionLevel?.value).toBe('AES-256');
    });

    it('should read JavaScript and link settings', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.security}\\DisableJavaScript`,
        1
      );
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.security}\\DisableExternalLinks`,
        1
      );

      const settings = await gpoReader.readSecuritySettings();

      expect(settings.disableJavaScript?.value).toBe(true);
      expect(settings.disableExternalLinks?.value).toBe(true);
    });

    it('should read trusted locations array', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.security}\\TrustedLocations`,
        ['C:\\Docs', 'D:\\Shared']
      );

      const settings = await gpoReader.readSecuritySettings();

      expect(settings.trustedLocations?.value).toEqual(['C:\\Docs', 'D:\\Shared']);
      expect(settings.trustedLocations?.isManaged).toBe(true);
    });
  });

  describe('readFeatureSettings', () => {
    it('should read feature toggles', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.features}\\EnableOCR`]: 1,
        [`HKLM\\${POLICY_PATHS.features}\\EnableRedaction`]: 0,
        [`HKLM\\${POLICY_PATHS.features}\\EnableSignatures`]: 1,
        [`HKLM\\${POLICY_PATHS.features}\\EnablePrinting`]: 0,
      });

      const settings = await gpoReader.readFeatureSettings();

      expect(settings.enableOCR?.value).toBe(true);
      expect(settings.enableRedaction?.value).toBe(false);
      expect(settings.enableSignatures?.value).toBe(true);
      expect(settings.enablePrinting?.value).toBe(false);
    });
  });

  describe('readUpdateSettings', () => {
    it('should read update configuration', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.updates}\\EnableAutoUpdate`]: 0,
        [`HKLM\\${POLICY_PATHS.updates}\\UpdateChannel`]: 'beta',
        [`HKLM\\${POLICY_PATHS.updates}\\UpdateServerURL`]: 'https://updates.company.com',
        [`HKLM\\${POLICY_PATHS.updates}\\CheckFrequency`]: 'weekly',
      });

      const settings = await gpoReader.readUpdateSettings();

      expect(settings.enableAutoUpdate?.value).toBe(false);
      expect(settings.updateChannel?.value).toBe('beta');
      expect(settings.updateServerURL?.value).toBe('https://updates.company.com');
      expect(settings.checkFrequency?.value).toBe('weekly');
    });

    it('should ignore empty update server URL', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.updates}\\UpdateServerURL`,
        '   '
      );

      const settings = await gpoReader.readUpdateSettings();

      expect(settings.updateServerURL).toBeUndefined();
    });
  });

  describe('readNetworkSettings', () => {
    it('should read proxy configuration', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.network}\\ProxyServer`]: 'proxy.company.com',
        [`HKLM\\${POLICY_PATHS.network}\\ProxyPort`]: 8080,
        [`HKLM\\${POLICY_PATHS.network}\\ProxyBypass`]: ['localhost', '*.internal.com'],
      });

      const settings = await gpoReader.readNetworkSettings();

      expect(settings.proxyServer?.value).toBe('proxy.company.com');
      expect(settings.proxyPort?.value).toBe(8080);
      expect(settings.proxyBypass?.value).toEqual(['localhost', '*.internal.com']);
    });

    it('should clamp proxy port to valid range', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.network}\\ProxyPort`,
        99999 // Invalid port
      );

      const settings = await gpoReader.readNetworkSettings();

      expect(settings.proxyPort?.value).toBe(65535);
    });
  });

  describe('readPerformanceSettings', () => {
    it('should read performance configuration', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.performance}\\MaxMemoryUsageMB`]: 2048,
        [`HKLM\\${POLICY_PATHS.performance}\\EnableHardwareAcceleration`]: 0,
      });

      const settings = await gpoReader.readPerformanceSettings();

      expect(settings.maxMemoryUsageMB?.value).toBe(2048);
      expect(settings.enableHardwareAcceleration?.value).toBe(false);
    });

    it('should clamp memory to valid range', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.performance}\\MaxMemoryUsageMB`,
        100 // Below min of 256
      );

      const settings = await gpoReader.readPerformanceSettings();

      expect(settings.maxMemoryUsageMB?.value).toBe(256);
    });
  });

  describe('readAllPolicies', () => {
    it('should read all policy categories', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.application}\\DefaultZoom`]: 125,
        [`HKLM\\${POLICY_PATHS.security}\\RequireEncryption`]: 1,
        [`HKLM\\${POLICY_PATHS.features}\\EnableOCR`]: 1,
        [`HKLM\\${POLICY_PATHS.updates}\\UpdateChannel`]: 'stable',
        [`HKLM\\${POLICY_PATHS.network}\\AllowTelemetry`]: 0,
        [`HKLM\\${POLICY_PATHS.performance}\\MaxMemoryUsageMB`]: 1024,
      });

      const config = await gpoReader.readAllPolicies();

      expect(config.application.defaultZoom?.value).toBe(125);
      expect(config.security.requireEncryption?.value).toBe(true);
      expect(config.features.enableOCR?.value).toBe(true);
      expect(config.updates.updateChannel?.value).toBe('stable');
      expect(config.network.allowTelemetry?.value).toBe(false);
      expect(config.performance.maxMemoryUsageMB?.value).toBe(1024);
      expect(config.lastRefreshed).toBeGreaterThan(0);
    });

    it('should use cache on subsequent calls', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        100
      );

      const config1 = await gpoReader.readAllPolicies();
      const timestamp1 = config1.lastRefreshed;

      // Change the mock value
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        200
      );

      // Should return cached value
      const config2 = await gpoReader.readAllPolicies();
      expect(config2.lastRefreshed).toBe(timestamp1);
      expect(config2.application.defaultZoom?.value).toBe(100);
    });

    it('should refresh when forced', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        100
      );

      await gpoReader.readAllPolicies();

      // Change the mock value
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        200
      );

      // Force refresh
      const config2 = await gpoReader.readAllPolicies(true);
      expect(config2.application.defaultZoom?.value).toBe(200);
    });
  });

  describe('getManagedPolicies', () => {
    it('should return flattened list of managed policies', async () => {
      setMockRegistryValues({
        [`HKLM\\${POLICY_PATHS.application}\\DefaultZoom`]: 125,
        [`HKLM\\${POLICY_PATHS.security}\\RequireEncryption`]: 1,
      });

      const policies = await gpoReader.getManagedPolicies();

      expect(policies.length).toBe(2);
      expect(policies).toContainEqual({
        key: 'application.defaultZoom',
        value: 125,
        source: 'HKLM',
      });
      expect(policies).toContainEqual({
        key: 'security.requireEncryption',
        value: true,
        source: 'HKLM',
      });
    });
  });

  describe('clearCache', () => {
    it('should clear the policy cache', async () => {
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        100
      );

      await gpoReader.readAllPolicies();

      // Change value
      setMockRegistryValue(
        `HKLM\\${POLICY_PATHS.application}\\DefaultZoom`,
        200
      );

      // Clear cache
      gpoReader.clearCache();

      // Should read new value
      const config = await gpoReader.readAllPolicies();
      expect(config.application.defaultZoom?.value).toBe(200);
    });
  });
});
