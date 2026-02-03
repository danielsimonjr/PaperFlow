/**
 * Expiry Handler Module (Sprint 21)
 *
 * Handles license expiry, warnings, and grace periods.
 */

import type { LicenseInfo, LicenseStatus } from '@/types/license';

/**
 * Expiry state
 */
export interface ExpiryState {
  status: LicenseStatus;
  daysRemaining: number | null;
  isInGracePeriod: boolean;
  gracePeriodEndsAt: number | null;
  warningLevel: 'none' | 'info' | 'warning' | 'critical' | 'expired';
  message: string;
}

/**
 * Expiry configuration
 */
export interface ExpiryConfig {
  /** Days before expiry to start showing warnings */
  warningDays: number;
  /** Days before expiry to show critical warning */
  criticalWarningDays: number;
  /** Grace period days after expiry */
  gracePeriodDays: number;
  /** Allow grace period */
  allowGracePeriod: boolean;
}

/**
 * Default expiry configuration
 */
const DEFAULT_CONFIG: ExpiryConfig = {
  warningDays: 30,
  criticalWarningDays: 7,
  gracePeriodDays: 7,
  allowGracePeriod: true,
};

/**
 * Expiry handler class
 */
export class ExpiryHandler {
  private config: ExpiryConfig;
  private gracePeriodStarted: Map<string, number> = new Map();

  constructor(config: Partial<ExpiryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check license expiry state
   */
  checkExpiry(license: LicenseInfo): ExpiryState {
    // Perpetual licenses don't expire
    if (license.data.type === 'perpetual' || !license.data.expiresAt) {
      return {
        status: 'valid',
        daysRemaining: null,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        warningLevel: 'none',
        message: 'Perpetual license - no expiration',
      };
    }

    const now = Date.now();
    const expiresAt = new Date(license.data.expiresAt).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysRemaining = Math.ceil((expiresAt - now) / msPerDay);

    // License is expired
    if (daysRemaining < 0) {
      return this.handleExpired(license, daysRemaining, expiresAt);
    }

    // Critical warning (7 days or less)
    if (daysRemaining <= this.config.criticalWarningDays) {
      return {
        status: 'valid',
        daysRemaining,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        warningLevel: 'critical',
        message: `License expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Renew now to avoid interruption.`,
      };
    }

    // Warning (30 days or less)
    if (daysRemaining <= this.config.warningDays) {
      return {
        status: 'valid',
        daysRemaining,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        warningLevel: 'warning',
        message: `License expires in ${daysRemaining} days. Consider renewing soon.`,
      };
    }

    // Active, no warnings
    return {
      status: 'valid',
      daysRemaining,
      isInGracePeriod: false,
      gracePeriodEndsAt: null,
      warningLevel: 'none',
      message: `License valid for ${daysRemaining} more days`,
    };
  }

  /**
   * Handle expired license
   */
  private handleExpired(license: LicenseInfo, daysRemaining: number, expiresAtMs: number): ExpiryState {
    const daysSinceExpiry = Math.abs(daysRemaining);

    // Check if grace period allowed
    if (!this.config.allowGracePeriod) {
      return {
        status: 'expired',
        daysRemaining: 0,
        isInGracePeriod: false,
        gracePeriodEndsAt: null,
        warningLevel: 'expired',
        message: 'Your license has expired. Please renew to continue using premium features.',
      };
    }

    // Check grace period
    if (daysSinceExpiry <= this.config.gracePeriodDays) {
      const gracePeriodRemaining = this.config.gracePeriodDays - daysSinceExpiry;
      const gracePeriodEndsAt = expiresAtMs + this.config.gracePeriodDays * 24 * 60 * 60 * 1000;

      // Start grace period if not already started
      if (!this.gracePeriodStarted.has(license.key)) {
        this.gracePeriodStarted.set(license.key, Date.now());
      }

      return {
        status: 'grace_period',
        daysRemaining: 0,
        isInGracePeriod: true,
        gracePeriodEndsAt,
        warningLevel: 'critical',
        message: `License expired. Grace period: ${gracePeriodRemaining} day${gracePeriodRemaining === 1 ? '' : 's'} remaining. Renew now to avoid feature lockout.`,
      };
    }

    // Grace period also expired
    return {
      status: 'expired',
      daysRemaining: 0,
      isInGracePeriod: false,
      gracePeriodEndsAt: null,
      warningLevel: 'expired',
      message: 'Your license and grace period have expired. Please renew to restore premium features.',
    };
  }

  /**
   * Get warning message for days remaining
   */
  getWarningMessage(daysRemaining: number): string | null {
    if (daysRemaining > this.config.warningDays) {
      return null;
    }

    if (daysRemaining <= 0) {
      return 'Your license has expired';
    }

    if (daysRemaining <= this.config.criticalWarningDays) {
      return `License expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}!`;
    }

    return `License expires in ${daysRemaining} days`;
  }

  /**
   * Check if renewal reminder should show
   */
  shouldShowRenewalReminder(license: LicenseInfo): boolean {
    const state = this.checkExpiry(license);
    return state.warningLevel !== 'none';
  }

  /**
   * Get next check time
   */
  getNextCheckTime(license: LicenseInfo): number {
    if (!license.data.expiresAt) {
      // Perpetual - check weekly
      return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    const state = this.checkExpiry(license);

    if (state.daysRemaining === null) {
      return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    // Check more frequently as expiry approaches
    if (state.daysRemaining <= 1) {
      return Date.now() + 1 * 60 * 60 * 1000; // Hourly
    }

    if (state.daysRemaining <= 7) {
      return Date.now() + 12 * 60 * 60 * 1000; // Twice daily
    }

    if (state.daysRemaining <= 30) {
      return Date.now() + 24 * 60 * 60 * 1000; // Daily
    }

    // Weekly check
    return Date.now() + 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * Format expiry date for display
   */
  formatExpiryDate(date: number | null): string {
    if (!date) {
      return 'Never (Perpetual)';
    }

    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Calculate days until expiry
   */
  static daysUntilExpiry(expiresAt: number | null): number | null {
    if (!expiresAt) return null;

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((expiresAt - now) / msPerDay);
  }

  /**
   * Check if license is in warning period
   */
  isInWarningPeriod(license: LicenseInfo): boolean {
    if (!license.data.expiresAt) return false;

    const expiresAtMs = new Date(license.data.expiresAt).getTime();
    const daysRemaining = ExpiryHandler.daysUntilExpiry(expiresAtMs);
    if (daysRemaining === null) return false;

    return daysRemaining <= this.config.warningDays && daysRemaining > 0;
  }

  /**
   * Check if license is in critical period
   */
  isInCriticalPeriod(license: LicenseInfo): boolean {
    if (!license.data.expiresAt) return false;

    const expiresAtMs = new Date(license.data.expiresAt).getTime();
    const daysRemaining = ExpiryHandler.daysUntilExpiry(expiresAtMs);
    if (daysRemaining === null) return false;

    return daysRemaining <= this.config.criticalWarningDays && daysRemaining > 0;
  }

  /**
   * Reset grace period tracking
   */
  resetGracePeriod(licenseKey: string): void {
    this.gracePeriodStarted.delete(licenseKey);
  }

  /**
   * Get grace period start time
   */
  getGracePeriodStart(licenseKey: string): number | null {
    return this.gracePeriodStarted.get(licenseKey) || null;
  }
}

/**
 * Create expiry handler
 */
export function createExpiryHandler(config?: Partial<ExpiryConfig>): ExpiryHandler {
  return new ExpiryHandler(config);
}

/**
 * Global expiry handler
 */
let globalHandler: ExpiryHandler | null = null;

/**
 * Get global expiry handler
 */
export function getGlobalExpiryHandler(): ExpiryHandler {
  if (!globalHandler) {
    globalHandler = new ExpiryHandler();
  }
  return globalHandler;
}

export default ExpiryHandler;
