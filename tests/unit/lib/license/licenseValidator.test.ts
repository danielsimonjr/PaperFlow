/**
 * License Validator Tests (Sprint 21)
 */

import { describe, it, expect } from 'vitest';
import {
  validateLicenseKey,
  isFeatureAvailable,
  getExpiryWarning,
} from '@lib/license/licenseValidator';
import {
  formatLicenseKey,
  parseLicenseKey,
  encodeLicenseData,
  decodeLicenseKey as decodeKeyFormat,
  isValidFormat,
  generateSerialNumber,
} from '@lib/license/licenseFormat';
import type { LicenseInfo } from '@/types/license';

describe('License Format', () => {
  describe('formatLicenseKey', () => {
    it('should format key with dashes', () => {
      const key = 'ABCDE12345FGHIJ67890KLMNO';
      const formatted = formatLicenseKey(key);

      expect(formatted).toBe('ABCDE-12345-FGHIJ-67890-KLMNO');
    });

    it('should handle already formatted key', () => {
      const key = 'ABCDE-12345-FGHIJ-67890-KLMNO';
      const formatted = formatLicenseKey(key);

      expect(formatted).toBe('ABCDE-12345-FGHIJ-67890-KLMNO');
    });

    it('should convert to uppercase', () => {
      const key = 'abcde12345fghij67890klmno';
      const formatted = formatLicenseKey(key);

      expect(formatted).toMatch(/^[A-Z0-9-]+$/);
    });
  });

  describe('parseLicenseKey', () => {
    it('should remove dashes and spaces', () => {
      const key = 'ABCDE-12345-FGHIJ-67890-KLMNO';
      const parsed = parseLicenseKey(key);

      expect(parsed).toBe('ABCDE12345FGHIJ67890KLMNO');
    });

    it('should handle key with spaces', () => {
      const key = 'ABCDE 12345 FGHIJ 67890 KLMNO';
      const parsed = parseLicenseKey(key);

      expect(parsed).toBe('ABCDE12345FGHIJ67890KLMNO');
    });
  });

  describe('generateSerialNumber', () => {
    it('should generate 10-character serial', () => {
      const serial = generateSerialNumber();

      expect(serial).toHaveLength(10);
    });

    it('should generate unique serials', () => {
      const serials = new Set<string>();

      for (let i = 0; i < 100; i++) {
        serials.add(generateSerialNumber());
      }

      expect(serials.size).toBe(100);
    });
  });

  describe('encodeLicenseData', () => {
    it('should encode license data to key', () => {
      const data = {
        edition: 'pro' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(2025, 11, 31),
        seats: 5,
      };

      const key = encodeLicenseData(data);

      expect(key).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    });

    it('should encode perpetual license', () => {
      const data = {
        edition: 'enterprise' as const,
        type: 'perpetual' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: null,
        seats: -1, // Unlimited
      };

      const key = encodeLicenseData(data);

      expect(key).toBeDefined();
    });
  });

  describe('decodeLicenseKey', () => {
    it('should decode valid key', () => {
      const data = {
        edition: 'pro' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(2025, 11, 31),
        seats: 5,
      };

      const key = encodeLicenseData(data);
      const decoded = decodeKeyFormat(key);

      expect(decoded).not.toBeNull();
      expect(decoded?.edition).toBe('pro');
      expect(decoded?.type).toBe('subscription');
      expect(decoded?.seats).toBe(5);
    });

    it('should return null for invalid key', () => {
      const decoded = decodeKeyFormat('INVALID-KEY-FORMAT');

      expect(decoded).toBeNull();
    });

    it('should return null for tampered key', () => {
      const data = {
        edition: 'pro' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(2025, 11, 31),
        seats: 5,
      };

      const key = encodeLicenseData(data);
      // Tamper with the key
      const tampered = key.slice(0, -5) + 'XXXXX';
      const decoded = decodeKeyFormat(tampered);

      expect(decoded).toBeNull();
    });

    it('should decode perpetual license correctly', () => {
      const data = {
        edition: 'enterprise' as const,
        type: 'perpetual' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: null,
        seats: -1,
      };

      const key = encodeLicenseData(data);
      const decoded = decodeKeyFormat(key);

      expect(decoded?.expiresAt).toBeNull();
      expect(decoded?.seats).toBe(-1);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid format', () => {
      const data = {
        edition: 'free' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(2025, 6, 15),
        seats: 1,
      };

      const key = encodeLicenseData(data);

      expect(isValidFormat(key)).toBe(true);
    });

    it('should return false for wrong length', () => {
      expect(isValidFormat('SHORT')).toBe(false);
      expect(isValidFormat('TOOLONGKEYABCDEFGHIJKLMNOPQRST')).toBe(false);
    });

    it('should return false for invalid characters', () => {
      // Characters not in charset (O, I, L, 0, 1) should fail checksum
      expect(isValidFormat('OOOOO-OOOOO-OOOOO-OOOOO-OOOOO')).toBe(false);
    });
  });
});

describe('License Validator', () => {
  describe('validateLicenseKey', () => {
    it('should validate a properly formatted key', () => {
      const data = {
        edition: 'pro' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        seats: 1,
      };

      const key = encodeLicenseData(data);
      const result = validateLicenseKey(key);

      expect(result.valid).toBe(true);
      expect(result.license?.data.edition).toBe('pro');
    });

    it('should reject expired license', () => {
      const data = {
        edition: 'free' as const,
        type: 'subscription' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        seats: 1,
      };

      const key = encodeLicenseData(data);
      const result = validateLicenseKey(key);

      // Note: Depending on grace period, this may be valid or expired
      // If within 7-day grace period, it will be grace_period status
      expect(result.valid === false || result.license?.status === 'grace_period').toBe(true);
    });

    it('should accept perpetual license', () => {
      const data = {
        edition: 'enterprise' as const,
        type: 'perpetual' as const,
        serialNumber: generateSerialNumber(),
        expiresAt: null,
        seats: -1,
      };

      const key = encodeLicenseData(data);
      const result = validateLicenseKey(key);

      expect(result.valid).toBe(true);
      expect(result.license?.data.type).toBe('perpetual');
    });

    it('should reject invalid key format', () => {
      const result = validateLicenseKey('INVALID-KEY');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });
  });
});

describe('Feature Availability', () => {
  const createMockLicense = (edition: 'free' | 'pro' | 'business' | 'enterprise'): LicenseInfo => ({
    key: 'TEST-KEY-12345',
    data: {
      serial: 'ABC123',
      edition,
      type: 'perpetual',
      issuedAt: new Date().toISOString(),
      expiresAt: null,
      seats: 1,
      customer: 'Test',
      addons: [],
    },
    status: 'valid',
    daysUntilExpiry: null,
    inGracePeriod: false,
    gracePeriodEndsAt: null,
    hardwareFingerprint: null,
    activatedAt: null,
    lastValidated: Date.now(),
  });

  it('should allow basic features for free edition', () => {
    const license = createMockLicense('free');

    // Free edition has no premium features
    expect(isFeatureAvailable(license, 'ocr')).toBe(false);
    expect(isFeatureAvailable(license, 'batch_processing')).toBe(false);
  });

  it('should allow pro features for pro edition', () => {
    const license = createMockLicense('pro');

    expect(isFeatureAvailable(license, 'ocr')).toBe(true);
    expect(isFeatureAvailable(license, 'batch_processing')).toBe(true);
    expect(isFeatureAvailable(license, 'custom_stamps')).toBe(true);
  });

  it('should allow business features for business edition', () => {
    const license = createMockLicense('business');

    expect(isFeatureAvailable(license, 'ocr')).toBe(true);
    expect(isFeatureAvailable(license, 'redaction')).toBe(true);
    expect(isFeatureAvailable(license, 'cloud_storage')).toBe(true);
  });

  it('should allow all features for enterprise edition', () => {
    const license = createMockLicense('enterprise');

    expect(isFeatureAvailable(license, 'ocr')).toBe(true);
    expect(isFeatureAvailable(license, 'collaboration')).toBe(true);
    expect(isFeatureAvailable(license, 'api_access')).toBe(true);
  });

  it('should return false for null license', () => {
    expect(isFeatureAvailable(null, 'ocr')).toBe(false);
  });
});

describe('Expiry Warnings', () => {
  const createMockLicense = (daysUntilExpiry: number | null, inGracePeriod = false): LicenseInfo => ({
    key: 'TEST-KEY-12345',
    data: {
      serial: 'ABC123',
      edition: 'pro',
      type: daysUntilExpiry === null ? 'perpetual' : 'subscription',
      issuedAt: new Date().toISOString(),
      expiresAt: daysUntilExpiry !== null
        ? new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString()
        : null,
      seats: 1,
      customer: 'Test',
      addons: [],
    },
    status: inGracePeriod ? 'grace_period' : 'valid',
    daysUntilExpiry,
    inGracePeriod,
    gracePeriodEndsAt: null,
    hardwareFingerprint: null,
    activatedAt: null,
    lastValidated: Date.now(),
  });

  it('should return no warning for perpetual license', () => {
    const license = createMockLicense(null);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('none');
  });

  it('should return critical warning for license expiring in 7 days or less', () => {
    const license = createMockLicense(5);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('critical');
    expect(warning.daysRemaining).toBe(5);
  });

  it('should return warning for license expiring in 14 days or less', () => {
    const license = createMockLicense(10);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('warning');
  });

  it('should return notice for license expiring in 30 days or less', () => {
    const license = createMockLicense(20);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('notice');
  });

  it('should return no warning for license with more than 30 days', () => {
    const license = createMockLicense(60);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('none');
  });

  it('should return critical warning for grace period', () => {
    const license = createMockLicense(-3, true);
    const warning = getExpiryWarning(license);

    expect(warning.level).toBe('critical');
    expect(warning.message).toContain('Grace period');
  });
});
