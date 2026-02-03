/**
 * Feature Gating Tests (Sprint 21)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeatureGating,
  createFeatureGating,
  isFeatureAvailable,
} from '@lib/license/featureGating';
import type { LicenseInfo, LicenseEdition } from '@/types/license';

/**
 * Create mock license
 */
function createMockLicense(
  edition: LicenseEdition,
  options: Partial<LicenseInfo> = {}
): LicenseInfo {
  return {
    key: 'TEST-KEY-12345',
    edition,
    type: 'subscription',
    status: 'active',
    issuedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    seats: 1,
    seatsUsed: 1,
    features: [],
    customerId: 'test-customer',
    ...options,
  };
}

describe('FeatureGating', () => {
  let gating: FeatureGating;

  beforeEach(() => {
    gating = new FeatureGating();
  });

  describe('without license (free edition)', () => {
    it('should allow view feature', () => {
      expect(gating.isFeatureAvailable('view')).toBe(true);
    });

    it('should allow annotate feature', () => {
      expect(gating.isFeatureAvailable('annotate')).toBe(true);
    });

    it('should deny edit feature', () => {
      expect(gating.isFeatureAvailable('edit')).toBe(false);
    });

    it('should deny OCR feature', () => {
      expect(gating.isFeatureAvailable('ocr')).toBe(false);
    });

    it('should deny batch feature', () => {
      expect(gating.isFeatureAvailable('batch')).toBe(false);
    });
  });

  describe('with standard license', () => {
    beforeEach(() => {
      gating.setLicense(createMockLicense('standard'));
    });

    it('should allow view feature', () => {
      expect(gating.isFeatureAvailable('view')).toBe(true);
    });

    it('should allow edit feature', () => {
      expect(gating.isFeatureAvailable('edit')).toBe(true);
    });

    it('should allow forms feature', () => {
      expect(gating.isFeatureAvailable('forms')).toBe(true);
    });

    it('should deny OCR feature', () => {
      expect(gating.isFeatureAvailable('ocr')).toBe(false);
    });

    it('should deny batch feature', () => {
      expect(gating.isFeatureAvailable('batch')).toBe(false);
    });
  });

  describe('with professional license', () => {
    beforeEach(() => {
      gating.setLicense(createMockLicense('professional'));
    });

    it('should allow all standard features', () => {
      expect(gating.isFeatureAvailable('view')).toBe(true);
      expect(gating.isFeatureAvailable('edit')).toBe(true);
      expect(gating.isFeatureAvailable('forms')).toBe(true);
    });

    it('should allow OCR feature', () => {
      expect(gating.isFeatureAvailable('ocr')).toBe(true);
    });

    it('should allow redact feature', () => {
      expect(gating.isFeatureAvailable('redact')).toBe(true);
    });

    it('should allow compare feature', () => {
      expect(gating.isFeatureAvailable('compare')).toBe(true);
    });

    it('should deny batch feature', () => {
      expect(gating.isFeatureAvailable('batch')).toBe(false);
    });

    it('should deny collaboration feature', () => {
      expect(gating.isFeatureAvailable('collaboration')).toBe(false);
    });
  });

  describe('with enterprise license', () => {
    beforeEach(() => {
      gating.setLicense(createMockLicense('enterprise'));
    });

    it('should allow all features', () => {
      expect(gating.isFeatureAvailable('view')).toBe(true);
      expect(gating.isFeatureAvailable('edit')).toBe(true);
      expect(gating.isFeatureAvailable('ocr')).toBe(true);
      expect(gating.isFeatureAvailable('batch')).toBe(true);
      expect(gating.isFeatureAvailable('collaboration')).toBe(true);
      expect(gating.isFeatureAvailable('audit')).toBe(true);
      expect(gating.isFeatureAvailable('api')).toBe(true);
    });
  });

  describe('with expired license', () => {
    beforeEach(() => {
      gating.setLicense(
        createMockLicense('professional', {
          status: 'expired',
        })
      );
    });

    it('should only allow free features', () => {
      expect(gating.isFeatureAvailable('view')).toBe(true);
      expect(gating.isFeatureAvailable('annotate')).toBe(true);
      expect(gating.isFeatureAvailable('edit')).toBe(false);
      expect(gating.isFeatureAvailable('ocr')).toBe(false);
    });
  });

  describe('with grace period license', () => {
    beforeEach(() => {
      gating.setLicense(
        createMockLicense('professional', {
          status: 'grace',
        })
      );
    });

    it('should allow professional features during grace period', () => {
      expect(gating.isFeatureAvailable('edit')).toBe(true);
      expect(gating.isFeatureAvailable('ocr')).toBe(true);
      expect(gating.isFeatureAvailable('redact')).toBe(true);
    });
  });

  describe('add-ons', () => {
    it('should require add-on for cloud_sync', () => {
      gating.setLicense(createMockLicense('standard'));

      // Without add-on
      expect(gating.isFeatureAvailable('cloud_sync')).toBe(false);

      // With add-on
      gating.setLicense(
        createMockLicense('standard', {
          addOns: ['cloud_sync_addon'],
        })
      );
      expect(gating.isFeatureAvailable('cloud_sync')).toBe(true);
    });
  });

  describe('getAvailableFeatures', () => {
    it('should return only free features without license', () => {
      const features = gating.getAvailableFeatures();

      expect(features).toContain('view');
      expect(features).toContain('annotate');
      expect(features).not.toContain('edit');
      expect(features).not.toContain('batch');
    });

    it('should return all enterprise features with enterprise license', () => {
      gating.setLicense(createMockLicense('enterprise'));
      const features = gating.getAvailableFeatures();

      expect(features).toContain('batch');
      expect(features).toContain('collaboration');
      expect(features).toContain('api');
    });
  });

  describe('getUpgradePrompt', () => {
    it('should return upgrade info for unavailable feature', () => {
      const prompt = gating.getUpgradePrompt('ocr');

      expect(prompt).not.toBeNull();
      expect(prompt?.required).toBe('professional');
      expect(prompt?.current).toBe('free');
    });

    it('should return null for available feature', () => {
      const prompt = gating.getUpgradePrompt('view');

      expect(prompt).toBeNull();
    });

    it('should indicate add-on requirement', () => {
      gating.setLicense(createMockLicense('standard'));
      const prompt = gating.getUpgradePrompt('cloud_sync');

      expect(prompt).not.toBeNull();
      expect(prompt?.addOnRequired).toBe('cloud_sync_addon');
    });
  });

  describe('getCurrentEdition', () => {
    it('should return free without license', () => {
      expect(gating.getCurrentEdition()).toBe('free');
    });

    it('should return license edition', () => {
      gating.setLicense(createMockLicense('professional'));
      expect(gating.getCurrentEdition()).toBe('professional');
    });
  });
});

describe('FeatureGating.getFeaturesForEdition', () => {
  it('should return free features', () => {
    const features = FeatureGating.getFeaturesForEdition('free');

    expect(features).toContain('view');
    expect(features).toContain('annotate');
    expect(features).not.toContain('edit');
  });

  it('should return enterprise features', () => {
    const features = FeatureGating.getFeaturesForEdition('enterprise');

    expect(features).toContain('batch');
    expect(features).toContain('collaboration');
    expect(features).toContain('api');
  });
});

describe('createFeatureGating', () => {
  it('should create gating with license', () => {
    const gating = createFeatureGating(createMockLicense('professional'));

    expect(gating.isFeatureAvailable('ocr')).toBe(true);
  });

  it('should create gating without license', () => {
    const gating = createFeatureGating();

    expect(gating.isFeatureAvailable('ocr')).toBe(false);
  });
});

describe('isFeatureAvailable helper', () => {
  it('should check feature with provided license', () => {
    const license = createMockLicense('enterprise');

    expect(isFeatureAvailable('batch', license)).toBe(true);
    expect(isFeatureAvailable('batch', null)).toBe(false);
  });
});
