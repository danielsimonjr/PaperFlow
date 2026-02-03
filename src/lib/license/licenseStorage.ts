/**
 * License Storage Module (Sprint 21)
 *
 * Securely stores license data with encryption and integrity verification.
 */

import type { LicenseInfo } from '@/types/license';
import type { LocalBinding } from './licenseBinding';

/**
 * Keychain API interface (for runtime check)
 */
interface KeychainAPI {
  getPassword: (service: string, account: string) => Promise<string | null>;
  setPassword: (service: string, account: string, password: string) => Promise<void>;
  deletePassword: (service: string, account: string) => Promise<boolean>;
}

/**
 * Check if electron has keychain API
 */
function getKeychainAPI(): KeychainAPI | null {
  if (typeof window !== 'undefined' && window.electron) {
    const electron = window.electron as unknown as { keychain?: KeychainAPI };
    return electron.keychain || null;
  }
  return null;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  LICENSE: 'paperflow-license',
  BINDING: 'paperflow-license-binding',
  CACHE: 'paperflow-license-cache',
  GRACE: 'paperflow-license-grace',
};

/**
 * Stored license data
 */
export interface StoredLicenseData {
  license: LicenseInfo;
  binding?: LocalBinding;
  storedAt: number;
  version: number;
  checksum: string;
}

/**
 * License cache entry
 */
export interface LicenseCacheEntry {
  licenseKey: string;
  validatedAt: number;
  expiresAt: number;
  isValid: boolean;
  features: string[];
}

/**
 * Calculate checksum for license data
 */
function calculateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return Math.abs(hash).toString(36);
}

/**
 * Encrypt data with simple XOR (for basic obfuscation)
 * In production, use proper encryption
 */
function obfuscate(data: string, key: string): string {
  let result = '';

  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }

  return btoa(result);
}

/**
 * Decrypt XOR obfuscated data
 */
function deobfuscate(data: string, key: string): string {
  const decoded = atob(data);
  let result = '';

  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }

  return result;
}

/**
 * Get storage key for encryption
 */
function getStorageKey(): string {
  // Use a combination of static key and machine-specific data
  // In production, derive from hardware fingerprint
  return 'paperflow-secure-storage-key-v1';
}

/**
 * License storage class
 */
export class LicenseStorage {
  private storageKey: string;

  constructor() {
    this.storageKey = getStorageKey();
  }

  /**
   * Save license data
   */
  async saveLicense(license: LicenseInfo, binding?: LocalBinding): Promise<boolean> {
    try {
      const data: StoredLicenseData = {
        license,
        binding,
        storedAt: Date.now(),
        version: 1,
        checksum: '',
      };

      // Calculate checksum before adding it
      data.checksum = calculateChecksum({ license, binding, storedAt: data.storedAt });

      // Serialize and encrypt
      const serialized = JSON.stringify(data);
      const encrypted = obfuscate(serialized, this.storageKey);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.LICENSE, encrypted);

      // Also try to save to keychain if available
      await this.saveToKeychain(license.key, encrypted);

      return true;
    } catch (error) {
      console.error('Failed to save license:', error);
      return false;
    }
  }

  /**
   * Load license data
   */
  async loadLicense(): Promise<StoredLicenseData | null> {
    try {
      // Try localStorage first
      let encrypted = localStorage.getItem(STORAGE_KEYS.LICENSE);

      // Fall back to keychain
      if (!encrypted) {
        encrypted = await this.loadFromKeychain();
      }

      if (!encrypted) {
        return null;
      }

      // Decrypt and parse
      const serialized = deobfuscate(encrypted, this.storageKey);
      const data: StoredLicenseData = JSON.parse(serialized);

      // Verify checksum
      const expectedChecksum = calculateChecksum({
        license: data.license,
        binding: data.binding,
        storedAt: data.storedAt,
      });

      if (data.checksum !== expectedChecksum) {
        console.error('License data integrity check failed');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load license:', error);
      return null;
    }
  }

  /**
   * Clear license data
   */
  async clearLicense(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.LICENSE);
    await this.clearFromKeychain();
  }

  /**
   * Save to OS keychain
   */
  private async saveToKeychain(key: string, data: string): Promise<void> {
    const keychainAPI = getKeychainAPI();
    if (keychainAPI) {
      try {
        await keychainAPI.setPassword('PaperFlow', `license-${key}`, data);
      } catch {
        // Keychain not available
      }
    }
  }

  /**
   * Load from OS keychain
   */
  private async loadFromKeychain(): Promise<string | null> {
    const keychainAPI = getKeychainAPI();
    if (keychainAPI) {
      try {
        // We need the license key to load, so this is a fallback only
        return null;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Clear from OS keychain
   */
  private async clearFromKeychain(): Promise<void> {
    // Would need license key to clear specific entry
  }

  /**
   * Save license cache
   */
  saveCache(entry: LicenseCacheEntry): void {
    try {
      const cacheData = JSON.stringify(entry);
      localStorage.setItem(STORAGE_KEYS.CACHE, obfuscate(cacheData, this.storageKey));
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Load license cache
   */
  loadCache(): LicenseCacheEntry | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.CACHE);
      if (!encrypted) return null;

      const decrypted = deobfuscate(encrypted, this.storageKey);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Clear license cache
   */
  clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.CACHE);
  }

  /**
   * Save grace period data
   */
  saveGracePeriod(data: { startedAt: number; endsAt: number; reason: string }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GRACE, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  /**
   * Load grace period data
   */
  loadGracePeriod(): { startedAt: number; endsAt: number; reason: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRACE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear grace period data
   */
  clearGracePeriod(): void {
    localStorage.removeItem(STORAGE_KEYS.GRACE);
  }

  /**
   * Check if license is stored
   */
  hasStoredLicense(): boolean {
    return localStorage.getItem(STORAGE_KEYS.LICENSE) !== null;
  }

  /**
   * Export license data (for transfer)
   */
  async exportLicense(): Promise<string | null> {
    const data = await this.loadLicense();
    if (!data) return null;

    // Create export format without binding
    const exportData = {
      license: data.license,
      exportedAt: Date.now(),
    };

    return btoa(JSON.stringify(exportData));
  }

  /**
   * Import license data
   */
  async importLicense(exportedData: string): Promise<LicenseInfo | null> {
    try {
      const decoded = atob(exportedData);
      const data = JSON.parse(decoded);

      if (!data.license?.key) {
        return null;
      }

      return data.license;
    } catch {
      return null;
    }
  }
}

/**
 * Create license storage instance
 */
export function createLicenseStorage(): LicenseStorage {
  return new LicenseStorage();
}

/**
 * Global license storage instance
 */
let globalStorage: LicenseStorage | null = null;

/**
 * Get global license storage
 */
export function getGlobalLicenseStorage(): LicenseStorage {
  if (!globalStorage) {
    globalStorage = new LicenseStorage();
  }
  return globalStorage;
}

export default LicenseStorage;
