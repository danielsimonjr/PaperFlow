/**
 * Secure Storage Module
 *
 * Provides secure credential storage using OS-level secure storage:
 * - Windows: Credential Manager via DPAPI
 * - macOS: Keychain
 * - Linux: Secret Service (libsecret)
 *
 * Uses Electron's safeStorage API for platform-agnostic secure storage.
 */

import { safeStorage, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Credential entry
 */
export interface SecureCredential {
  key: string;
  service: string;
  account?: string;
  label?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Secure storage file
 */
interface SecureStorageFile {
  version: number;
  entries: Record<string, {
    encryptedValue: string;
    service: string;
    account?: string;
    label?: string;
    createdAt: number;
    updatedAt: number;
  }>;
}

// Storage configuration
const STORAGE_VERSION = 1;
const STORAGE_FILENAME = 'secure-storage.json';
const SERVICE_NAME = 'PaperFlow';

// In-memory cache
let storageCache: SecureStorageFile | null = null;

/**
 * Get the path to the secure storage file
 */
function getStoragePath(): string {
  return path.join(app.getPath('userData'), STORAGE_FILENAME);
}

/**
 * Check if secure storage is available
 */
export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * Load storage from file
 */
async function loadStorage(): Promise<SecureStorageFile> {
  if (storageCache) {
    return storageCache;
  }

  const storagePath = getStoragePath();

  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    storageCache = JSON.parse(data) as SecureStorageFile;

    // Validate version
    if (storageCache.version !== STORAGE_VERSION) {
      console.warn('[SecureStorage] Storage version mismatch, creating new storage');
      storageCache = { version: STORAGE_VERSION, entries: {} };
    }

    return storageCache;
  } catch {
    // File doesn't exist or is corrupted
    storageCache = { version: STORAGE_VERSION, entries: {} };
    return storageCache;
  }
}

/**
 * Save storage to file
 */
async function saveStorage(): Promise<void> {
  if (!storageCache) {
    return;
  }

  const storagePath = getStoragePath();
  await fs.writeFile(storagePath, JSON.stringify(storageCache, null, 2), 'utf-8');
}

/**
 * Encrypt a value using Electron's safeStorage
 */
function encryptValue(value: string): string {
  if (!isSecureStorageAvailable()) {
    // Fallback to basic encoding (not secure, but functional)
    console.warn('[SecureStorage] Secure storage not available, using basic encoding');
    return Buffer.from(value).toString('base64');
  }

  const encrypted = safeStorage.encryptString(value);
  return encrypted.toString('base64');
}

/**
 * Decrypt a value using Electron's safeStorage
 */
function decryptValue(encryptedValue: string): string {
  if (!isSecureStorageAvailable()) {
    // Fallback to basic decoding
    return Buffer.from(encryptedValue, 'base64').toString('utf-8');
  }

  const buffer = Buffer.from(encryptedValue, 'base64');
  return safeStorage.decryptString(buffer);
}

/**
 * Store a secret securely
 *
 * @param key - Unique key for the secret
 * @param value - Value to store
 * @param options - Additional options
 */
export async function setSecret(
  key: string,
  value: string,
  options?: {
    service?: string;
    account?: string;
    label?: string;
  }
): Promise<void> {
  const storage = await loadStorage();

  const encryptedValue = encryptValue(value);
  const now = Date.now();

  const existingEntry = storage.entries[key];

  storage.entries[key] = {
    encryptedValue,
    service: options?.service || SERVICE_NAME,
    account: options?.account,
    label: options?.label,
    createdAt: existingEntry?.createdAt || now,
    updatedAt: now,
  };

  await saveStorage();

  console.log(`[SecureStorage] Stored secret: ${key}`);
}

/**
 * Retrieve a secret
 *
 * @param key - Key of the secret to retrieve
 * @returns Decrypted value or null if not found
 */
export async function getSecret(key: string): Promise<string | null> {
  const storage = await loadStorage();

  const entry = storage.entries[key];
  if (!entry) {
    return null;
  }

  try {
    return decryptValue(entry.encryptedValue);
  } catch (error) {
    console.error(`[SecureStorage] Failed to decrypt secret: ${key}`, error);
    return null;
  }
}

/**
 * Check if a secret exists
 *
 * @param key - Key to check
 */
export async function hasSecret(key: string): Promise<boolean> {
  const storage = await loadStorage();
  return key in storage.entries;
}

/**
 * Delete a secret
 *
 * @param key - Key of the secret to delete
 * @returns True if deleted, false if not found
 */
export async function deleteSecret(key: string): Promise<boolean> {
  const storage = await loadStorage();

  if (!(key in storage.entries)) {
    return false;
  }

  delete storage.entries[key];
  await saveStorage();

  console.log(`[SecureStorage] Deleted secret: ${key}`);
  return true;
}

/**
 * List all stored credentials (without values)
 */
export async function listCredentials(): Promise<SecureCredential[]> {
  const storage = await loadStorage();

  return Object.entries(storage.entries).map(([key, entry]) => ({
    key,
    service: entry.service,
    account: entry.account,
    label: entry.label,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}

/**
 * Clear all stored credentials
 */
export async function clearAllCredentials(): Promise<number> {
  const storage = await loadStorage();
  const count = Object.keys(storage.entries).length;

  storage.entries = {};
  await saveStorage();

  console.log(`[SecureStorage] Cleared ${count} credential(s)`);
  return count;
}

/**
 * Generate a secure random key
 *
 * @param length - Length of the key in bytes
 * @returns Hex-encoded key
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a value (for comparison without storing plain text)
 *
 * @param value - Value to hash
 * @returns SHA-256 hash
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Verify a value against a hash
 *
 * @param value - Value to verify
 * @param hash - Hash to compare against
 */
export function verifyHash(value: string, hash: string): boolean {
  return hashValue(value) === hash;
}

/**
 * Common credential keys
 */
export const CredentialKeys = {
  API_KEY: 'api-key',
  LICENSE_KEY: 'license-key',
  SYNC_TOKEN: 'sync-token',
  ENCRYPTION_KEY: 'encryption-key',
  BACKUP_PASSWORD: 'backup-password',
} as const;

/**
 * IPC channel names for secure storage
 */
export const SECURE_STORAGE_CHANNELS = {
  SET_SECRET: 'secure-storage-set',
  GET_SECRET: 'secure-storage-get',
  HAS_SECRET: 'secure-storage-has',
  DELETE_SECRET: 'secure-storage-delete',
  LIST_CREDENTIALS: 'secure-storage-list',
  CLEAR_ALL: 'secure-storage-clear-all',
  IS_AVAILABLE: 'secure-storage-is-available',
  GENERATE_KEY: 'secure-storage-generate-key',
} as const;
