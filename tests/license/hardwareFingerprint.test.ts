/**
 * Hardware Fingerprint Tests (Sprint 21)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateFingerprint,
  compareFingerprints,
  FingerprintGenerator,
} from '@lib/license/hardwareFingerprint';
import type { HardwareFingerprint } from '@/types/license';

// Mock navigator and other browser APIs
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  hardwareConcurrency: 8,
  deviceMemory: 16,
  platform: 'Win32',
  language: 'en-US',
  languages: ['en-US', 'en'],
  maxTouchPoints: 0,
  vendor: 'Google Inc.',
};

describe('FingerprintGenerator', () => {
  let generator: FingerprintGenerator;
  let originalNavigator: typeof navigator;

  beforeEach(() => {
    generator = new FingerprintGenerator();
    originalNavigator = global.navigator;

    // @ts-expect-error - Mocking navigator
    global.navigator = mockNavigator;
  });

  afterEach(() => {
    global.navigator = originalNavigator;
  });

  describe('generate', () => {
    it('should generate a fingerprint object', async () => {
      const fingerprint = await generator.generate();

      expect(fingerprint).toBeDefined();
      expect(fingerprint.machineId).toBeDefined();
      expect(fingerprint.platform).toBeDefined();
    });

    it('should generate consistent fingerprints', async () => {
      const fp1 = await generator.generate();
      const fp2 = await generator.generate();

      // Browser-based fingerprint should be mostly consistent
      expect(fp1.platform).toBe(fp2.platform);
      expect(fp1.hardwareConcurrency).toBe(fp2.hardwareConcurrency);
    });

    it('should include browser info', async () => {
      const fingerprint = await generator.generate();

      expect(fingerprint.browserInfo).toBeDefined();
      expect(fingerprint.browserInfo?.userAgent).toContain('Mozilla');
    });
  });
});

describe('compareFingerprints', () => {
  const baseFingerprint: HardwareFingerprint = {
    machineId: 'test-machine-123',
    cpuId: 'cpu-123456',
    diskSerial: 'disk-abcdef',
    macAddress: '00:11:22:33:44:55',
    platform: 'win32',
    arch: 'x64',
    hostname: 'test-host',
    hardwareConcurrency: 8,
    totalMemory: 16 * 1024 * 1024 * 1024,
    generatedAt: Date.now(),
  };

  it('should return match for identical fingerprints', () => {
    const result = compareFingerprints(baseFingerprint, { ...baseFingerprint });

    expect(result.isMatch).toBe(true);
    expect(result.matchScore).toBe(1);
  });

  it('should allow minor hardware changes', () => {
    const modified: HardwareFingerprint = {
      ...baseFingerprint,
      // Changed MAC address (maybe network adapter replaced)
      macAddress: '00:11:22:33:44:66',
      // Different hostname (renamed)
      hostname: 'new-host-name',
    };

    const result = compareFingerprints(baseFingerprint, modified);

    // Should still match with high enough score
    expect(result.matchScore).toBeGreaterThan(0.5);
  });

  it('should reject completely different hardware', () => {
    const different: HardwareFingerprint = {
      machineId: 'different-machine',
      cpuId: 'different-cpu',
      diskSerial: 'different-disk',
      macAddress: 'FF:FF:FF:FF:FF:FF',
      platform: 'darwin',
      arch: 'arm64',
      hostname: 'different-host',
      hardwareConcurrency: 4,
      totalMemory: 8 * 1024 * 1024 * 1024,
      generatedAt: Date.now(),
    };

    const result = compareFingerprints(baseFingerprint, different);

    expect(result.isMatch).toBe(false);
    expect(result.matchScore).toBeLessThan(0.5);
  });

  it('should weight critical identifiers higher', () => {
    // Same core identifiers, different peripherals
    const sameCore: HardwareFingerprint = {
      ...baseFingerprint,
      macAddress: 'different-mac',
      hostname: 'different-host',
    };

    // Different core identifiers
    const differentCore: HardwareFingerprint = {
      ...baseFingerprint,
      cpuId: 'different-cpu',
      diskSerial: 'different-disk',
    };

    const sameCoreResult = compareFingerprints(baseFingerprint, sameCore);
    const differentCoreResult = compareFingerprints(baseFingerprint, differentCore);

    // Same core should score higher than different core
    expect(sameCoreResult.matchScore).toBeGreaterThan(differentCoreResult.matchScore);
  });

  it('should report mismatch reasons', () => {
    const modified: HardwareFingerprint = {
      ...baseFingerprint,
      cpuId: 'different-cpu',
      platform: 'linux',
    };

    const result = compareFingerprints(baseFingerprint, modified);

    expect(result.mismatchReasons).toBeDefined();
    expect(result.mismatchReasons?.length).toBeGreaterThan(0);
    expect(result.mismatchReasons).toContain('cpuId');
    expect(result.mismatchReasons).toContain('platform');
  });

  it('should handle missing optional fields', () => {
    const withOptional: HardwareFingerprint = {
      ...baseFingerprint,
      browserInfo: {
        userAgent: 'test',
        language: 'en',
        platform: 'Win32',
      },
    };

    const withoutOptional: HardwareFingerprint = {
      ...baseFingerprint,
    };

    const result = compareFingerprints(withOptional, withoutOptional);

    // Should not penalize for missing optional fields
    expect(result.matchScore).toBeGreaterThan(0.8);
  });
});

describe('generateFingerprint', () => {
  it('should generate fingerprint using default generator', async () => {
    const fingerprint = await generateFingerprint();

    expect(fingerprint).toBeDefined();
    expect(fingerprint.generatedAt).toBeDefined();
    expect(fingerprint.generatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('should include timestamp', async () => {
    const before = Date.now();
    const fingerprint = await generateFingerprint();
    const after = Date.now();

    expect(fingerprint.generatedAt).toBeGreaterThanOrEqual(before);
    expect(fingerprint.generatedAt).toBeLessThanOrEqual(after);
  });
});

describe('Fingerprint stability', () => {
  it('should produce stable machine ID', async () => {
    const generator = new FingerprintGenerator();

    const fp1 = await generator.generate();
    const fp2 = await generator.generate();

    // Machine ID should be deterministic
    expect(fp1.machineId).toBe(fp2.machineId);
  });

  it('should handle environment without native APIs', async () => {
    // This tests the browser fallback path
    const generator = new FingerprintGenerator();
    const fingerprint = await generator.generate();

    expect(fingerprint).toBeDefined();
    expect(fingerprint.machineId).toBeTruthy();
  });
});
