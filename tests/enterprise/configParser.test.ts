/**
 * Configuration Parser Tests (Sprint 20)
 */

import { describe, it, expect } from 'vitest';
import {
  parseJSON,
  validateConfig,
  mergeWithDefaults,
  DEFAULT_CONFIG,
} from '@lib/enterprise/configParser';

describe('configParser', () => {
  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      const json = '{"version": "1.0.0", "application": {"defaultZoom": 100}}';
      const result = parseJSON(json);

      expect(result.error).toBeUndefined();
      expect(result.config).toEqual({
        version: '1.0.0',
        application: { defaultZoom: 100 },
      });
    });

    it('should handle JSON with comments (JSONC)', () => {
      const jsonc = `{
        // This is a comment
        "version": "1.0.0",
        /* Block comment */
        "application": {
          "defaultZoom": 100
        }
      }`;
      const result = parseJSON(jsonc);

      expect(result.error).toBeUndefined();
      expect(result.config).toBeDefined();
    });

    it('should return error for invalid JSON', () => {
      const invalid = '{invalid json}';
      const result = parseJSON(invalid);

      expect(result.error).toBeDefined();
      expect(result.config).toBeNull();
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        version: '1.0.0',
        application: {
          defaultZoom: 150,
          defaultViewMode: 'continuous',
          enableAutoSave: true,
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid zoom value', () => {
      const config = {
        application: { defaultZoom: 500 },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'application.defaultZoom')).toBe(true);
    });

    it('should reject invalid view mode', () => {
      const config = {
        application: { defaultViewMode: 'invalid' },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'application.defaultViewMode')).toBe(true);
    });

    it('should reject invalid auto-save interval', () => {
      const config = {
        application: { autoSaveInterval: 5 },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path === 'application.autoSaveInterval')).toBe(true);
    });

    it('should validate security settings', () => {
      const config = {
        security: {
          requireEncryption: true,
          minEncryptionLevel: 'AES-256',
          trustedLocations: ['/path/to/docs'],
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid encryption level', () => {
      const config = {
        security: { minEncryptionLevel: 'DES' },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should validate feature toggles', () => {
      const config = {
        features: {
          enableOCR: true,
          enableRedaction: false,
          enablePrinting: true,
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject non-boolean feature values', () => {
      const config = {
        features: { enableOCR: 'yes' },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should validate update settings', () => {
      const config = {
        updates: {
          updateChannel: 'beta',
          checkFrequency: 'weekly',
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid update channel', () => {
      const config = {
        updates: { updateChannel: 'nightly' },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should validate network settings', () => {
      const config = {
        network: {
          proxyServer: 'proxy.company.com',
          proxyPort: 8080,
          proxyBypass: ['localhost'],
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid proxy port', () => {
      const config = {
        network: { proxyPort: 99999 },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should validate performance settings', () => {
      const config = {
        performance: {
          maxMemoryUsageMB: 2048,
          enableHardwareAcceleration: true,
          thumbnailCacheSize: 200,
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject memory below minimum', () => {
      const config = {
        performance: { maxMemoryUsageMB: 100 },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should validate kiosk settings', () => {
      const config = {
        kiosk: {
          enabled: true,
          exitPin: '1234',
          inactivityTimeout: 300,
          allowedFeatures: ['view', 'zoom', 'search'],
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid kiosk features', () => {
      const config = {
        kiosk: {
          allowedFeatures: ['view', 'invalid-feature'],
        },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });

    it('should reject PIN that is too short', () => {
      const config = {
        kiosk: { exitPin: '12' },
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should return defaults for empty config', () => {
      const result = mergeWithDefaults({});

      expect(result.application?.defaultZoom).toBe(DEFAULT_CONFIG.application?.defaultZoom);
      expect(result.application?.defaultViewMode).toBe(DEFAULT_CONFIG.application?.defaultViewMode);
    });

    it('should override defaults with provided values', () => {
      const result = mergeWithDefaults({
        application: { defaultZoom: 150 },
      });

      expect(result.application?.defaultZoom).toBe(150);
      expect(result.application?.defaultViewMode).toBe('single'); // Default preserved
    });

    it('should deep merge nested objects', () => {
      const result = mergeWithDefaults({
        security: { requireEncryption: true },
      });

      expect(result.security?.requireEncryption).toBe(true);
      expect(result.security?.minEncryptionLevel).toBe('AES-128'); // Default preserved
    });

    it('should include version', () => {
      const result = mergeWithDefaults({});

      expect(result.version).toBeDefined();
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have valid default values', () => {
      const result = validateConfig(DEFAULT_CONFIG);

      expect(result.valid).toBe(true);
    });

    it('should have all required sections', () => {
      expect(DEFAULT_CONFIG.application).toBeDefined();
      expect(DEFAULT_CONFIG.security).toBeDefined();
      expect(DEFAULT_CONFIG.features).toBeDefined();
      expect(DEFAULT_CONFIG.updates).toBeDefined();
      expect(DEFAULT_CONFIG.network).toBeDefined();
      expect(DEFAULT_CONFIG.performance).toBeDefined();
    });
  });
});
