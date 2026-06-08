/**
 * License Storage + safeStorage Bridge Integration Tests
 *
 * When the renderer-side `window.electron.safeStorage` bridge is present and
 * reports encryption available:
 *   (a) `LicenseStorage.saveLicense(...)` writes DPAPI ciphertext (not plaintext)
 *   (b) `LicenseStorage.loadLicense()` round-trips through the bridge
 *   (c) Tampered ciphertext fails the HMAC integrity check
 *   (d) The INSECURE_PLATFORM warning path is NOT taken
 *
 * Companion to tests/electron/safeStorageBridge.test.ts which exercises the
 * main-process side of the same bridge.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseInfo } from '@/types/license';

interface MockSafeStorage {
  isEncryptionAvailable: () => boolean;
  encryptString: (plain: string) => Uint8Array;
  decryptString: (cipher: Uint8Array) => string;
}

const BRIDGE_CIPHER_PREFIX = 'dpapi:';

function installBridge(opts?: { available?: boolean }): MockSafeStorage {
  const available = opts?.available !== false;
  const mock: MockSafeStorage = {
    isEncryptionAvailable: () => available,
    encryptString: (plain: string) =>
      new TextEncoder().encode(BRIDGE_CIPHER_PREFIX + plain),
    decryptString: (cipher: Uint8Array) => {
      const s = new TextDecoder().decode(cipher);
      if (!s.startsWith(BRIDGE_CIPHER_PREFIX)) {
        throw new Error('mock bridge decrypt: not ciphertext');
      }
      return s.slice(BRIDGE_CIPHER_PREFIX.length);
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electron = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(window as any).electron,
    safeStorage: mock,
  };
  return mock;
}

function uninstallBridge(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).electron) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron.safeStorage;
  }
}

function makeLicense(): LicenseInfo {
  return {
    key: 'BRIDGE-TEST-001',
    data: {
      serial: 'BRIDGE-001',
      edition: 'pro',
      type: 'perpetual',
      issuedAt: new Date('2026-05-01').toISOString(),
      expiresAt: null,
      seats: 1,
      customer: 'Bridge Test',
      addons: [],
    },
    status: 'valid',
    daysUntilExpiry: null,
    inGracePeriod: false,
    gracePeriodEndsAt: null,
    hardwareFingerprint: null,
    activatedAt: null,
    lastValidated: 1_700_000_000_000,
  };
}

describe('licenseStorage <-> safeStorage bridge', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    installBridge({ available: true });
  });

  afterEach(() => {
    uninstallBridge();
  });

  it('save() writes bridge ciphertext (not plaintext) when isEncryptionAvailable() === true', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    await storage.saveLicense(makeLicense());

    const raw = localStorage.getItem('paperflow-license');
    expect(raw).not.toBeNull();
    const decoded = atob(raw as string);
    // Bridge mock prefixes ciphertext with `dpapi:`. Plaintext fallback would
    // begin with the JSON `{"_storageVersion":2,...`.
    expect(decoded.startsWith(BRIDGE_CIPHER_PREFIX)).toBe(true);
    expect(decoded.startsWith('{')).toBe(false);
  });

  it('load() round-trips: decrypts via the bridge and recovers the original license', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    const original = makeLicense();
    expect(await storage.saveLicense(original)).toBe(true);

    const loaded = await storage.loadLicense();
    expect(loaded).not.toBeNull();
    expect(loaded?.license.key).toBe(original.key);
    expect(loaded?.license.data.edition).toBe('pro');
  });

  it('load() rejects tampered ciphertext (HMAC mismatch)', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    await storage.saveLicense(makeLicense());

    // Tamper inside the bridge-encoded blob without recomputing the HMAC.
    const raw = localStorage.getItem('paperflow-license') as string;
    const decoded = atob(raw);
    expect(decoded.startsWith(BRIDGE_CIPHER_PREFIX)).toBe(true);
    const inner = JSON.parse(decoded.slice(BRIDGE_CIPHER_PREFIX.length));
    inner.license.data.edition = 'enterprise'; // privilege escalation attempt
    const tampered = BRIDGE_CIPHER_PREFIX + JSON.stringify(inner);
    localStorage.setItem('paperflow-license', btoa(tampered));

    const loaded = await storage.loadLicense();
    expect(loaded).toBeNull();
  });

  it('does NOT emit the INSECURE_PLATFORM warning when the bridge reports encryption available', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    await storage.saveLicense(makeLicense());
    await storage.loadLicense();

    const insecureWarn = warnSpy.mock.calls.some((c) =>
      c.some((arg) => typeof arg === 'string' && arg.includes('INSECURE_PLATFORM'))
    );
    expect(insecureWarn).toBe(false);

    warnSpy.mockRestore();
  });
});
