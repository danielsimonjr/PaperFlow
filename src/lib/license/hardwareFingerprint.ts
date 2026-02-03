/**
 * Hardware Fingerprint Module (Sprint 21)
 *
 * Generates a unique hardware fingerprint for license binding.
 * Uses multiple hardware identifiers with fuzzy matching to allow
 * for minor hardware changes.
 */

import type { HardwareFingerprint, FingerprintMatchResult } from '@/types/license';

/**
 * Fingerprint component weight for matching
 */
const COMPONENT_WEIGHTS = {
  cpuId: 0.25,
  motherboardId: 0.25,
  diskId: 0.2,
  macAddress: 0.15,
  osId: 0.15,
};

/**
 * Minimum confidence threshold for fingerprint match
 */
const MATCH_THRESHOLD = 0.6;

/**
 * Simple hash function for combining identifiers
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate SHA-256 hash (uses Web Crypto API)
 */
async function sha256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without Web Crypto
  return simpleHash(message);
}

/**
 * Get CPU identifier
 * In a real implementation, this would use native APIs
 */
async function getCpuId(): Promise<string> {
  // Check if running in Electron with access to system info
  if (typeof window !== 'undefined' && window.electron) {
    try {
      const platformInfo = await window.electron.getPlatformInfo();
      // Use a combination of available info as a pseudo CPU ID
      return simpleHash(`${platformInfo.platform}-${platformInfo.arch}-${platformInfo.electronVersion}`);
    } catch {
      // Fall through to default
    }
  }

  // For web/development, use a stable browser fingerprint component
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (nav) {
    return simpleHash(`${nav.hardwareConcurrency || 0}-${nav.platform || 'unknown'}`);
  }

  return 'unknown-cpu';
}

/**
 * Get motherboard identifier
 */
async function getMotherboardId(): Promise<string> {
  // In a real implementation, this would use:
  // - Windows: WMI queries
  // - macOS: system_profiler
  // - Linux: dmidecode

  // For now, use a combination of available system info
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (nav) {
    return simpleHash(`${nav.platform || ''}-${nav.language || ''}`);
  }

  return 'unknown-mb';
}

/**
 * Get primary disk identifier
 */
async function getDiskId(): Promise<string> {
  // In a real implementation, this would get the disk serial number
  // For now, use localStorage persistence as a pseudo-identifier

  if (typeof localStorage !== 'undefined') {
    let diskId = localStorage.getItem('paperflow-disk-id');
    if (!diskId) {
      diskId = simpleHash(`disk-${Date.now()}-${Math.random()}`);
      localStorage.setItem('paperflow-disk-id', diskId);
    }
    return diskId;
  }

  return 'unknown-disk';
}

/**
 * Get primary MAC address
 */
async function getMacAddress(): Promise<string> {
  // In a real implementation, this would use native APIs to get MAC
  // For web, we can't access MAC addresses directly

  // Use a stable identifier based on available APIs
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (nav) {
    return simpleHash(`${nav.userAgent || ''}-${nav.vendor || ''}`);
  }

  return 'unknown-mac';
}

/**
 * Get OS installation identifier
 */
async function getOsId(): Promise<string> {
  // Check for Electron environment
  if (typeof window !== 'undefined' && window.electron) {
    try {
      const appPath = await window.electron.getAppPath();
      return simpleHash(appPath.userData);
    } catch {
      // Fall through
    }
  }

  // For web, use a persistent identifier
  if (typeof localStorage !== 'undefined') {
    let osId = localStorage.getItem('paperflow-os-id');
    if (!osId) {
      osId = simpleHash(`os-${Date.now()}-${Math.random()}`);
      localStorage.setItem('paperflow-os-id', osId);
    }
    return osId;
  }

  return 'unknown-os';
}

/**
 * Generate a complete hardware fingerprint
 */
export async function generateFingerprint(): Promise<HardwareFingerprint> {
  const [cpuId, motherboardId, diskId, macAddress, osId] = await Promise.all([
    getCpuId(),
    getMotherboardId(),
    getDiskId(),
    getMacAddress(),
    getOsId(),
  ]);

  // Combine all components into a single fingerprint
  const combined = `${cpuId}|${motherboardId}|${diskId}|${macAddress}|${osId}`;
  const fingerprint = await sha256(combined);

  return {
    cpuId,
    motherboardId,
    diskId,
    macAddress,
    osId,
    fingerprint,
  };
}

/**
 * Match two fingerprints with fuzzy matching
 */
export function matchFingerprints(
  current: HardwareFingerprint,
  stored: HardwareFingerprint
): FingerprintMatchResult {
  const changedComponents: string[] = [];
  let matchingWeight = 0;
  let matchingCount = 0;
  const totalComponents = Object.keys(COMPONENT_WEIGHTS).length;

  // Compare each component
  const components = ['cpuId', 'motherboardId', 'diskId', 'macAddress', 'osId'] as const;

  for (const component of components) {
    const weight = COMPONENT_WEIGHTS[component];
    if (current[component] === stored[component]) {
      matchingWeight += weight;
      matchingCount++;
    } else {
      changedComponents.push(component);
    }
  }

  const confidence = matchingWeight;
  const matches = confidence >= MATCH_THRESHOLD;

  return {
    matches,
    confidence,
    matchingComponents: matchingCount,
    totalComponents,
    changedComponents,
  };
}

/**
 * Serialize fingerprint for storage
 */
export function serializeFingerprint(fingerprint: HardwareFingerprint): string {
  return JSON.stringify(fingerprint);
}

/**
 * Deserialize fingerprint from storage
 */
export function deserializeFingerprint(data: string): HardwareFingerprint | null {
  try {
    const parsed = JSON.parse(data);
    if (
      parsed &&
      typeof parsed.cpuId === 'string' &&
      typeof parsed.fingerprint === 'string'
    ) {
      return parsed as HardwareFingerprint;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get a short fingerprint ID for display
 */
export function getShortFingerprintId(fingerprint: HardwareFingerprint): string {
  return fingerprint.fingerprint.slice(0, 16).toUpperCase();
}

/**
 * Check if fingerprint has changed significantly
 */
export async function hasSignificantChange(
  storedFingerprint: string
): Promise<{ changed: boolean; details: FingerprintMatchResult | null }> {
  const stored = deserializeFingerprint(storedFingerprint);
  if (!stored) {
    return { changed: true, details: null };
  }

  const current = await generateFingerprint();
  const matchResult = matchFingerprints(current, stored);

  return {
    changed: !matchResult.matches,
    details: matchResult,
  };
}

export default {
  generateFingerprint,
  matchFingerprints,
  serializeFingerprint,
  deserializeFingerprint,
  getShortFingerprintId,
  hasSignificantChange,
  MATCH_THRESHOLD,
};
