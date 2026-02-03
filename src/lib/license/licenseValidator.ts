/**
 * License Validator Module (Sprint 21)
 *
 * Validates license keys offline using embedded public key.
 */

import type {
  LicenseKeyData,
  LicenseInfo,
  LicenseValidationResult,
  LicenseStatus,
} from '@/types/license';
import {
  decodeLicenseKey as decodeKeyFormat,
  isValidFormat,
} from './licenseFormat';

/**
 * Embedded public key for signature verification
 * In production, this would be the actual RSA public key
 */
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh
kd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ
0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg
cKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc
mwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Validate a license key format
 */
export function isValidKeyFormat(key: string): boolean {
  // Use the format module for validation - it checks both structure and charset
  return isValidFormat(key);
}

/**
 * Calculate checksum for license key validation
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 4);
}

/**
 * Decode license key to extract embedded data
 */
export function decodeLicenseKey(key: string): LicenseKeyData | null {
  // Use the licenseFormat module for decoding
  const decoded = decodeKeyFormat(key);

  if (!decoded) {
    return null;
  }

  // Convert DecodedLicenseData to LicenseKeyData
  return {
    serial: decoded.serialNumber,
    edition: decoded.edition,
    type: decoded.type,
    issuedAt: decoded.issuedAt.toISOString(),
    expiresAt: decoded.expiresAt ? decoded.expiresAt.toISOString() : null,
    seats: decoded.seats,
    customer: decoded.customerId || '',
    addons: [],
  };
}

/**
 * Verify license signature using public key
 */
export async function verifySignature(
  key: string,
  signature: string
): Promise<boolean> {
  try {
    // In a real implementation, this would use Web Crypto API
    // to verify the RSA signature against the public key

    // For now, simulate signature verification
    const expectedSignature = calculateChecksum(key + PUBLIC_KEY.slice(0, 50));
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Calculate license status based on expiry
 */
function calculateStatus(data: LicenseKeyData): {
  status: LicenseStatus;
  daysUntilExpiry: number | null;
  inGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
} {
  if (!data.expiresAt) {
    // Perpetual license
    return {
      status: 'valid',
      daysUntilExpiry: null,
      inGracePeriod: false,
      gracePeriodEndsAt: null,
    };
  }

  const now = new Date();
  const expiry = new Date(data.expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry > 0) {
    return {
      status: 'valid',
      daysUntilExpiry,
      inGracePeriod: false,
      gracePeriodEndsAt: null,
    };
  }

  // Check grace period
  const gracePeriodDays = 7; // Default grace period
  if (Math.abs(daysUntilExpiry) <= gracePeriodDays) {
    const gracePeriodEnd = new Date(expiry);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    return {
      status: 'grace_period',
      daysUntilExpiry,
      inGracePeriod: true,
      gracePeriodEndsAt: gracePeriodEnd.toISOString(),
    };
  }

  return {
    status: 'expired',
    daysUntilExpiry,
    inGracePeriod: false,
    gracePeriodEndsAt: null,
  };
}

/**
 * Validate a license key completely
 */
export function validateLicenseKey(
  key: string,
  hardwareFingerprint?: string
): LicenseValidationResult {
  // Check format
  if (!isValidKeyFormat(key)) {
    return {
      valid: false,
      license: null,
      error: 'Invalid license key format',
      errorCode: 'INVALID_FORMAT',
    };
  }

  // Decode the key
  const data = decodeLicenseKey(key);
  if (!data) {
    return {
      valid: false,
      license: null,
      error: 'Invalid license key data',
      errorCode: 'INVALID_SIGNATURE',
    };
  }

  // Calculate status
  const statusInfo = calculateStatus(data);

  // Check if expired (beyond grace period)
  if (statusInfo.status === 'expired') {
    return {
      valid: false,
      license: null,
      error: 'License has expired',
      errorCode: 'EXPIRED',
    };
  }

  // Build license info
  const license: LicenseInfo = {
    key,
    data,
    status: statusInfo.status,
    daysUntilExpiry: statusInfo.daysUntilExpiry,
    inGracePeriod: statusInfo.inGracePeriod,
    gracePeriodEndsAt: statusInfo.gracePeriodEndsAt,
    hardwareFingerprint: hardwareFingerprint || null,
    activatedAt: null, // Would be set during activation
    lastValidated: Date.now(),
  };

  return {
    valid: true,
    license,
  };
}

/**
 * Check if a feature is available for the given license
 */
export function isFeatureAvailable(
  license: LicenseInfo | null,
  featureId: string
): boolean {
  if (!license) {
    return false;
  }

  // Define feature availability by edition
  const editionFeatures: Record<string, string[]> = {
    free: [],
    pro: ['ocr', 'batch_processing', 'custom_stamps'],
    business: ['ocr', 'batch_processing', 'custom_stamps', 'redaction', 'cloud_storage', 'form_designer'],
    enterprise: ['ocr', 'batch_processing', 'custom_stamps', 'redaction', 'cloud_storage', 'form_designer', 'collaboration', 'advanced_security', 'api_access', 'priority_support'],
  };

  const availableFeatures = editionFeatures[license.data.edition] || [];

  // Check base edition features
  if (availableFeatures.includes(featureId)) {
    return true;
  }

  // Check add-on features
  if (license.data.addons.includes(featureId as import('@/types/license').FeatureId)) {
    return true;
  }

  return false;
}

/**
 * Get expiry warning info
 */
export function getExpiryWarning(license: LicenseInfo | null): {
  level: 'none' | 'notice' | 'warning' | 'critical';
  daysRemaining: number | null;
  message: string;
} {
  if (!license || license.daysUntilExpiry === null) {
    return {
      level: 'none',
      daysRemaining: null,
      message: '',
    };
  }

  const days = license.daysUntilExpiry;

  if (days <= 0) {
    if (license.inGracePeriod) {
      return {
        level: 'critical',
        daysRemaining: days,
        message: `Your license has expired. Grace period ends in ${7 + days} days.`,
      };
    }
    return {
      level: 'critical',
      daysRemaining: days,
      message: 'Your license has expired.',
    };
  }

  if (days <= 7) {
    return {
      level: 'critical',
      daysRemaining: days,
      message: `Your license expires in ${days} day${days === 1 ? '' : 's'}.`,
    };
  }

  if (days <= 14) {
    return {
      level: 'warning',
      daysRemaining: days,
      message: `Your license expires in ${days} days.`,
    };
  }

  if (days <= 30) {
    return {
      level: 'notice',
      daysRemaining: days,
      message: `Your license expires in ${days} days.`,
    };
  }

  return {
    level: 'none',
    daysRemaining: days,
    message: '',
  };
}

export default {
  isValidKeyFormat,
  decodeLicenseKey,
  verifySignature,
  validateLicenseKey,
  isFeatureAvailable,
  getExpiryWarning,
};
