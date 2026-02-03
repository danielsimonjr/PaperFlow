/**
 * License Format Module (Sprint 21)
 *
 * Defines the license key format and structure.
 */

import type { LicenseType, LicenseEdition } from '@/types/license';

/**
 * License key prefix mapping
 */
export const LICENSE_PREFIXES: Record<LicenseEdition, string> = {
  free: 'PF',
  pro: 'PS',
  business: 'PP',
  enterprise: 'PE',
};

/**
 * License type codes
 */
export const LICENSE_TYPE_CODES: Record<LicenseType, string> = {
  perpetual: 'P',
  subscription: 'S',
  trial: 'T',
};

/**
 * Decoded license data
 */
export interface DecodedLicenseData {
  edition: LicenseEdition;
  type: LicenseType;
  serialNumber: string;
  issuedAt: Date;
  expiresAt: Date | null;
  seats: number;
  features: string[];
  customerId?: string;
  checksum: string;
}

/**
 * License key format:
 * XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
 *
 * Structure:
 * - Part 1: Edition + Type + Version (5 chars)
 * - Part 2-3: Serial number (10 chars)
 * - Part 4: Expiry + Seats encoded (5 chars)
 * - Part 5: Checksum (5 chars)
 */

/**
 * Character set for license key (avoid ambiguous chars)
 */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Encode a number to base32-like string
 */
export function encodeNumber(num: number, length: number): string {
  let result = '';
  let remaining = num;

  for (let i = 0; i < length; i++) {
    result = CHARSET[remaining % 32] + result;
    remaining = Math.floor(remaining / 32);
  }

  return result;
}

/**
 * Decode a base32-like string to number
 */
export function decodeNumber(str: string): number {
  let result = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === undefined) continue;
    const index = CHARSET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid character in license key: ${char}`);
    }
    result = result * 32 + index;
  }

  return result;
}

/**
 * Calculate checksum for license data
 */
export function calculateChecksum(data: string): string {
  let hash = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  // Convert to positive number
  hash = Math.abs(hash);

  return encodeNumber(hash, 5);
}

/**
 * Verify checksum
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  return calculateChecksum(data) === checksum;
}

/**
 * Format license key with dashes
 */
export function formatLicenseKey(key: string): string {
  // Remove existing dashes and spaces
  const clean = key.replace(/[-\s]/g, '').toUpperCase();

  // Split into 5-character parts
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 5) {
    parts.push(clean.substring(i, i + 5));
  }

  return parts.join('-');
}

/**
 * Parse license key and remove formatting
 */
export function parseLicenseKey(key: string): string {
  return key.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Encode expiry date to 3-character string
 * Encodes as months since January 2020
 */
export function encodeExpiry(date: Date | null): string {
  if (!date) {
    return 'ZZZ'; // Never expires (perpetual)
  }

  const baseDate = new Date(2020, 0, 1);
  const months = Math.floor((date.getTime() - baseDate.getTime()) / (30 * 24 * 60 * 60 * 1000));

  return encodeNumber(months, 3);
}

/**
 * Decode expiry date from 3-character string
 */
export function decodeExpiry(encoded: string): Date | null {
  if (encoded === 'ZZZ') {
    return null; // Never expires
  }

  const months = decodeNumber(encoded);
  const baseDate = new Date(2020, 0, 1);

  return new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
}

/**
 * Encode seat count to 2-character string
 */
export function encodeSeats(seats: number): string {
  // Special values
  if (seats === -1) return 'XX'; // Unlimited
  if (seats > 1023) return 'XY'; // Site license (>1000)

  return encodeNumber(seats, 2);
}

/**
 * Decode seat count from 2-character string
 */
export function decodeSeats(encoded: string): number {
  if (encoded === 'XX') return -1; // Unlimited
  if (encoded === 'XY') return 9999; // Site license

  return decodeNumber(encoded);
}

/**
 * Generate a random serial number
 */
export function generateSerialNumber(): string {
  let serial = '';

  for (let i = 0; i < 10; i++) {
    serial += CHARSET[Math.floor(Math.random() * 32)];
  }

  return serial;
}

/**
 * Encode license data to key parts
 */
export function encodeLicenseData(data: {
  edition: LicenseEdition;
  type: LicenseType;
  serialNumber: string;
  expiresAt: Date | null;
  seats: number;
}): string {
  const prefix = LICENSE_PREFIXES[data.edition];
  const typeCode = LICENSE_TYPE_CODES[data.type];
  const version = '2'; // Format version (must be in CHARSET, which starts at '2')

  // Part 1: Edition prefix + Type + Version
  const part1 = prefix + typeCode + version + 'A'; // Padding

  // Parts 2-3: Serial number (10 chars)
  const part2 = data.serialNumber.substring(0, 5);
  const part3 = data.serialNumber.substring(5, 10);

  // Part 4: Expiry (3 chars) + Seats (2 chars)
  const part4 = encodeExpiry(data.expiresAt) + encodeSeats(data.seats);

  // Part 5: Checksum
  const dataToHash = part1 + part2 + part3 + part4;
  const part5 = calculateChecksum(dataToHash);

  return formatLicenseKey(part1 + part2 + part3 + part4 + part5);
}

/**
 * Decode license key to data
 */
export function decodeLicenseKey(key: string): DecodedLicenseData | null {
  try {
    const clean = parseLicenseKey(key);

    if (clean.length !== 25) {
      return null;
    }

    const part1 = clean.substring(0, 5);
    const part2 = clean.substring(5, 10);
    const part3 = clean.substring(10, 15);
    const part4 = clean.substring(15, 20);
    const part5 = clean.substring(20, 25);

    // Verify checksum
    const dataToHash = part1 + part2 + part3 + part4;
    if (!verifyChecksum(dataToHash, part5)) {
      return null;
    }

    // Decode edition
    const prefix = part1.substring(0, 2);
    const edition = (Object.entries(LICENSE_PREFIXES).find(([, v]) => v === prefix)?.[0] ||
      'free') as LicenseEdition;

    // Decode type
    const typeCode = part1[2];
    const type = (Object.entries(LICENSE_TYPE_CODES).find(([, v]) => v === typeCode)?.[0] ||
      'perpetual') as LicenseType;

    // Decode serial
    const serialNumber = part2 + part3;

    // Decode expiry and seats
    const expiresAt = decodeExpiry(part4.substring(0, 3));
    const seats = decodeSeats(part4.substring(3, 5));

    return {
      edition,
      type,
      serialNumber,
      issuedAt: new Date(), // Not encoded in key
      expiresAt,
      seats,
      features: getEditionFeatures(edition),
      checksum: part5,
    };
  } catch {
    return null;
  }
}

/**
 * Get features for an edition
 */
export function getEditionFeatures(edition: LicenseEdition): string[] {
  const features: Record<LicenseEdition, string[]> = {
    free: ['view', 'annotate'],
    pro: ['view', 'annotate', 'edit', 'forms', 'sign'],
    business: ['view', 'annotate', 'edit', 'forms', 'sign', 'ocr', 'redact', 'compare'],
    enterprise: [
      'view',
      'annotate',
      'edit',
      'forms',
      'sign',
      'ocr',
      'redact',
      'compare',
      'batch',
      'collaboration',
      'audit',
      'api',
    ],
  };

  return features[edition] || features.free;
}

/**
 * Validate license key format
 */
export function isValidFormat(key: string): boolean {
  const clean = parseLicenseKey(key);

  // Check length
  if (clean.length !== 25) {
    return false;
  }

  // Check all characters are valid
  for (const char of clean) {
    if (!CHARSET.includes(char)) {
      return false;
    }
  }

  // Verify checksum
  const dataToHash = clean.substring(0, 20);
  const checksum = clean.substring(20, 25);

  return verifyChecksum(dataToHash, checksum);
}

export default {
  formatLicenseKey,
  parseLicenseKey,
  encodeLicenseData,
  decodeLicenseKey,
  isValidFormat,
  calculateChecksum,
  generateSerialNumber,
};
