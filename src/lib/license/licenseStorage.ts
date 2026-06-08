/**
 * License Storage Module (Sprint 21 + 2026-05-03 hardening)
 *
 * Securely stores license data with:
 *   - On-device encryption via Electron `safeStorage` (DPAPI on Windows /
 *     Keychain on macOS / Secret Service on Linux). Exposed to renderer code
 *     as `window.electron.safeStorage`.
 *   - HMAC-SHA-256 integrity over the canonical JSON payload, using a key
 *     bound to the local OS via the same safeStorage primitive.
 *
 * Old XOR-encoded files (storage version 1) are auto-migrated on first read.
 * If safeStorage is unavailable (e.g., headless CI, no DPAPI), we fall back
 * to plain JSON with a one-time `INSECURE_PLATFORM` warning. HMAC is still
 * computed and verified in the fallback path so accidental in-place edits
 * still get caught.
 *
 * NOTE: HMAC uses Web Crypto SubtleCrypto, which is reachable from the
 * renderer (Electron + browser). The original spec mentioned `crypto.createHmac`
 * (Node), but renderer code cannot import `node:crypto`. Web Crypto is the
 * direct equivalent for this use case.
 */

import type { LicenseInfo } from '@/types/license';
import type { LocalBinding } from './licenseBinding';

// ---------------------------------------------------------------------------
// Storage shape
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  LICENSE: 'paperflow-license',
  CACHE: 'paperflow-license-cache',
  GRACE: 'paperflow-license-grace',
  HMAC_SEED: 'paperflow-license-hmac-seed',
} as const;

const CURRENT_STORAGE_VERSION = 2;
const HMAC_KEY_MARKER = 'paperflow-license-integrity-v2';

/**
 * On-disk format for storage version 2:
 *   {
 *     _storageVersion: 2,
 *     license: LicenseInfo,
 *     binding?: LocalBinding,
 *     storedAt: number,
 *     hmac: hex string of HMAC-SHA-256 over canonicalJson({license, binding, storedAt}),
 *   }
 * The serialized JSON is then encrypted via safeStorage (when available) and
 * base64-encoded for localStorage compatibility.
 */
interface V2Payload {
  _storageVersion: 2;
  license: LicenseInfo;
  binding?: LocalBinding;
  storedAt: number;
  hmac: string;
}

/**
 * Public, returned from loadLicense — kept compatible with the previous
 * surface so downstream callers don't break.
 */
export interface StoredLicenseData {
  license: LicenseInfo;
  binding?: LocalBinding;
  storedAt: number;
  version: number;
  /** @deprecated retained for back-compat; HMAC is the real integrity check now. */
  checksum: string;
}

export interface LicenseCacheEntry {
  licenseKey: string;
  validatedAt: number;
  expiresAt: number;
  isValid: boolean;
  features: string[];
}

// ---------------------------------------------------------------------------
// safeStorage shim (renderer -> preload bridge)
// ---------------------------------------------------------------------------

interface SafeStorageAPI {
  isEncryptionAvailable: () => boolean;
  encryptString: (plain: string) => Uint8Array | ArrayBuffer | { buffer: ArrayBuffer };
  decryptString: (cipher: Uint8Array) => string;
}

function getSafeStorage(): SafeStorageAPI | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const electron = (window as any).electron;
  if (!electron) return null;
  const ss: SafeStorageAPI | undefined = electron.safeStorage;
  if (!ss || typeof ss.isEncryptionAvailable !== 'function') return null;
  return ss;
}

let insecureWarningEmitted = false;
function warnInsecureOnce(): void {
  if (insecureWarningEmitted) return;
  insecureWarningEmitted = true;
  console.warn(
    '[licenseStorage] INSECURE_PLATFORM: Electron safeStorage is unavailable; ' +
      'license file will be written in plaintext (HMAC integrity still applied). ' +
      'On Windows this typically means DPAPI is not reachable from this process.'
  );
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

function toUint8(v: Uint8Array | ArrayBuffer | { buffer: ArrayBuffer; byteOffset?: number; byteLength?: number }): Uint8Array {
  // Duck-typed checks: realm-crossing (e.g., test mocks) breaks instanceof.
  if (v && typeof (v as { byteLength?: unknown }).byteLength === 'number') {
    if (typeof (v as ArrayBuffer).slice === 'function' && !('buffer' in v)) {
      return new Uint8Array(v as ArrayBuffer);
    }
    if ('buffer' in v && v.buffer && typeof (v.buffer as ArrayBuffer).byteLength === 'number') {
      const view = v as { buffer: ArrayBuffer; byteOffset?: number; byteLength?: number };
      return new Uint8Array(view.buffer, view.byteOffset ?? 0, view.byteLength);
    }
  }
  // Last resort: array-like of bytes.
  if (v && typeof (v as { length?: unknown }).length === 'number') {
    return new Uint8Array(v as ArrayLike<number>);
  }
  throw new Error('Unsupported buffer-like return from safeStorage');
}

function uint8ToBinaryString(u: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i] ?? 0);
  return s;
}

function binaryStringToUint8(s: string): Uint8Array {
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

function bufferToHex(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u.length; i++) s += (u[i] ?? 0).toString(16).padStart(2, '0');
  return s;
}

/**
 * Canonical JSON: stable key ordering for HMAC determinism.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k]))
      .join(',') +
    '}'
  );
}

// ---------------------------------------------------------------------------
// HMAC key derivation
// ---------------------------------------------------------------------------

function getSubtle(): SubtleCrypto | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (globalThis as any).crypto;
  if (!c || !c.subtle) return null;
  return c.subtle as SubtleCrypto;
}

/**
 * Derive HMAC key bytes:
 *   - In Electron with safeStorage: encryptString(HMAC_KEY_MARKER) is OS-bound
 *     ciphertext (DPAPI / Keychain). We use that ciphertext as the HMAC key
 *     material. An attacker copying the license file off-machine cannot
 *     reproduce the HMAC without DPAPI access on the same OS user account.
 *   - Without safeStorage: we generate a random per-install seed once,
 *     persist it in localStorage. This is the INSECURE_PLATFORM path — it
 *     defends against accidental in-place edits but not against an attacker
 *     who can read localStorage.
 */
async function deriveHmacKey(): Promise<CryptoKey> {
  const subtle = getSubtle();
  if (!subtle) throw new Error('Web Crypto SubtleCrypto unavailable');

  let keyBytes: Uint8Array;
  const ss = getSafeStorage();
  if (ss && ss.isEncryptionAvailable()) {
    keyBytes = toUint8(ss.encryptString(HMAC_KEY_MARKER));
  } else {
    let seed = localStorage.getItem(STORAGE_KEYS.HMAC_SEED);
    if (!seed) {
      // Generate a fresh 32-byte seed.
      const buf = new Uint8Array(32);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((globalThis as any).crypto as Crypto).getRandomValues(buf);
      seed = btoa(uint8ToBinaryString(buf));
      localStorage.setItem(STORAGE_KEYS.HMAC_SEED, seed);
    }
    keyBytes = binaryStringToUint8(atob(seed));
  }

  // Slice into a fresh ArrayBuffer to satisfy strict BufferSource typing
  // (avoids the SharedArrayBuffer ↔ ArrayBuffer mismatch introduced in
  // newer TS lib.dom.d.ts, mirroring the workaround already in updateClient.ts).
  const keyBuf = keyBytes.buffer.slice(
    keyBytes.byteOffset,
    keyBytes.byteOffset + keyBytes.byteLength
  ) as ArrayBuffer;

  return subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function computeHmac(payload: { license: LicenseInfo; binding?: LocalBinding; storedAt: number }): Promise<string> {
  const subtle = getSubtle();
  if (!subtle) throw new Error('Web Crypto SubtleCrypto unavailable');
  const key = await deriveHmacKey();
  const data = new TextEncoder().encode(canonicalJson(payload));
  const sig = await subtle.sign('HMAC', key, data);
  return bufferToHex(sig);
}

async function verifyHmac(payload: { license: LicenseInfo; binding?: LocalBinding; storedAt: number }, hmac: string): Promise<boolean> {
  const expected = await computeHmac(payload);
  // Constant-time compare on hex strings of equal length.
  if (expected.length !== hmac.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ hmac.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Encrypt / decrypt the on-disk blob
// ---------------------------------------------------------------------------

/**
 * Encrypt a JSON string and return base64 (suitable for localStorage).
 */
function encryptForDisk(json: string): string {
  const ss = getSafeStorage();
  if (ss && ss.isEncryptionAvailable()) {
    const cipher = toUint8(ss.encryptString(json));
    return btoa(uint8ToBinaryString(cipher));
  }
  warnInsecureOnce();
  // INSECURE_PLATFORM fallback: still base64 to keep on-disk format uniform.
  return btoa(uint8ToBinaryString(new TextEncoder().encode(json)));
}

/**
 * Decrypt a base64 blob from disk back to JSON.
 */
function decryptFromDisk(b64: string): string {
  const bytes = binaryStringToUint8(atob(b64));
  const ss = getSafeStorage();
  if (ss && ss.isEncryptionAvailable()) {
    return ss.decryptString(bytes);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Heuristic: does the stored blob look like the new v2 format?
 * The v2 path always produces a base64-of-(safeStorage-cipher | utf-8 JSON).
 * Once decrypted/decoded it parses to JSON containing `_storageVersion: 2`.
 * The legacy XOR path produces base64 of a string that is *not* valid UTF-8
 * after decoding (since XOR with a key shifts bytes), and never parses to
 * JSON with that marker.
 */
function looksLikeV2(b64: string): boolean {
  try {
    const text = decryptFromDisk(b64);
    const parsed = JSON.parse(text);
    return parsed && parsed._storageVersion === CURRENT_STORAGE_VERSION;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Legacy (v1) reader for one-shot migration
// ---------------------------------------------------------------------------

const LEGACY_XOR_KEY = 'paperflow-secure-storage-key-v1';

function legacyXorDecode(b64: string): string {
  const decoded = atob(b64);
  let out = '';
  for (let i = 0; i < decoded.length; i++) {
    out += String.fromCharCode(decoded.charCodeAt(i) ^ LEGACY_XOR_KEY.charCodeAt(i % LEGACY_XOR_KEY.length));
  }
  return out;
}

interface LegacyV1Body {
  license: LicenseInfo;
  binding?: LocalBinding;
  storedAt: number;
  version: number;
  checksum: string;
}

function tryReadLegacy(b64: string): LegacyV1Body | null {
  try {
    const json = legacyXorDecode(b64);
    const parsed = JSON.parse(json) as LegacyV1Body;
    if (parsed && parsed.license && parsed.license.key) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public class
// ---------------------------------------------------------------------------

export class LicenseStorage {
  /**
   * Save license data. Returns false on hard failure.
   */
  async saveLicense(license: LicenseInfo, binding?: LocalBinding): Promise<boolean> {
    try {
      const storedAt = Date.now();
      const hmac = await computeHmac({ license, binding, storedAt });
      const payload: V2Payload = {
        _storageVersion: CURRENT_STORAGE_VERSION,
        license,
        binding,
        storedAt,
        hmac,
      };
      const json = JSON.stringify(payload);
      const blob = encryptForDisk(json);
      localStorage.setItem(STORAGE_KEYS.LICENSE, blob);
      return true;
    } catch (error) {
      console.error('[licenseStorage] Failed to save license:', error);
      return false;
    }
  }

  /**
   * Load license data. Auto-migrates legacy v1 (XOR) files on first read.
   * Returns null if nothing is stored or integrity check fails.
   */
  async loadLicense(): Promise<StoredLicenseData | null> {
    try {
      const blob = localStorage.getItem(STORAGE_KEYS.LICENSE);
      if (!blob) return null;

      // V2 path
      if (looksLikeV2(blob)) {
        const json = decryptFromDisk(blob);
        const parsed = JSON.parse(json) as V2Payload;
        const ok = await verifyHmac(
          { license: parsed.license, binding: parsed.binding, storedAt: parsed.storedAt },
          parsed.hmac
        );
        if (!ok) {
          console.error('[licenseStorage] HMAC integrity check failed');
          return null;
        }
        return {
          license: parsed.license,
          binding: parsed.binding,
          storedAt: parsed.storedAt,
          version: CURRENT_STORAGE_VERSION,
          checksum: parsed.hmac,
        };
      }

      // V1 (legacy XOR) path -> migrate
      const legacy = tryReadLegacy(blob);
      if (legacy) {
        // Re-save in v2 format. Best-effort: a save failure should not
        // prevent returning the legacy data.
        await this.saveLicense(legacy.license, legacy.binding);
        return {
          license: legacy.license,
          binding: legacy.binding,
          storedAt: legacy.storedAt,
          version: legacy.version,
          checksum: legacy.checksum,
        };
      }

      return null;
    } catch (error) {
      console.error('[licenseStorage] Failed to load license:', error);
      return null;
    }
  }

  async clearLicense(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.LICENSE);
  }

  /**
   * Save license cache (validated-features short-circuit). Best-effort.
   */
  saveCache(entry: LicenseCacheEntry): void {
    try {
      const blob = encryptForDisk(JSON.stringify(entry));
      localStorage.setItem(STORAGE_KEYS.CACHE, blob);
    } catch {
      /* ignore */
    }
  }

  loadCache(): LicenseCacheEntry | null {
    try {
      const blob = localStorage.getItem(STORAGE_KEYS.CACHE);
      if (!blob) return null;
      const json = decryptFromDisk(blob);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.CACHE);
  }

  saveGracePeriod(data: { startedAt: number; endsAt: number; reason: string }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GRACE, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  loadGracePeriod(): { startedAt: number; endsAt: number; reason: string } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRACE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearGracePeriod(): void {
    localStorage.removeItem(STORAGE_KEYS.GRACE);
  }

  hasStoredLicense(): boolean {
    return localStorage.getItem(STORAGE_KEYS.LICENSE) !== null;
  }

  /**
   * Export license data (without binding) for transfer between machines.
   */
  async exportLicense(): Promise<string | null> {
    const data = await this.loadLicense();
    if (!data) return null;
    const exportData = {
      license: data.license,
      exportedAt: Date.now(),
    };
    return btoa(JSON.stringify(exportData));
  }

  async importLicense(exportedData: string): Promise<LicenseInfo | null> {
    try {
      const decoded = atob(exportedData);
      const data = JSON.parse(decoded);
      if (!data.license?.key) return null;
      return data.license;
    } catch {
      return null;
    }
  }
}

export function createLicenseStorage(): LicenseStorage {
  return new LicenseStorage();
}

let globalStorage: LicenseStorage | null = null;
export function getGlobalLicenseStorage(): LicenseStorage {
  if (!globalStorage) globalStorage = new LicenseStorage();
  return globalStorage;
}

export default LicenseStorage;
