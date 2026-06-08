/**
 * License Storage Tests (Sprint 21 + 2026-05-03 hardening)
 *
 * Round-trip + integrity + legacy-migration coverage for licenseStorage.
 * The renderer-side module is supposed to use Electron `safeStorage` (DPAPI on
 * Windows, Keychain on macOS) when available, with HMAC-SHA-256 integrity over
 * the canonical JSON. When safeStorage is unavailable we fall back to plain
 * JSON with an INSECURE_PLATFORM warning logged once.
 *
 * The Electron-only safeStorage surface is exposed to renderer code as
 * `window.electron.safeStorage` (mocked here via vi.mock-style in-place
 * assignment, since the real preload binding is not present in jsdom).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseInfo } from '@/types/license';

// ---------------------------------------------------------------------------
// Mock safeStorage on window.electron
// ---------------------------------------------------------------------------

interface MockSafeStorage {
  isEncryptionAvailable: () => boolean;
  encryptString: (plain: string) => Uint8Array;
  decryptString: (cipher: Uint8Array) => string;
}

function installSafeStorageMock(opts?: { available?: boolean }): MockSafeStorage {
  const available = opts?.available !== false;
  const PREFIX = 'enc:';
  const mock: MockSafeStorage = {
    isEncryptionAvailable: () => available,
    encryptString: (plain: string) => {
      // Trivial reversible "encryption" so tests can assert decrypt round-trip.
      return new TextEncoder().encode(PREFIX + plain);
    },
    decryptString: (cipher: Uint8Array) => {
      const s = new TextDecoder().decode(cipher);
      if (!s.startsWith(PREFIX)) throw new Error('mock-decrypt: not encrypted');
      return s.slice(PREFIX.length);
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electron = {
    ...(window as any).electron, // eslint-disable-line @typescript-eslint/no-explicit-any
    safeStorage: mock,
  };
  return mock;
}

function uninstallSafeStorageMock(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).electron) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron.safeStorage;
  }
}

function makeLicense(): LicenseInfo {
  return {
    key: 'TEST-KEY-12345',
    data: {
      serial: 'ABC123',
      edition: 'pro',
      type: 'perpetual',
      issuedAt: new Date('2026-01-01').toISOString(),
      expiresAt: null,
      seats: 1,
      customer: 'Test Co',
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

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('licenseStorage (safeStorage + HMAC-SHA-256)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    installSafeStorageMock({ available: true });
  });

  afterEach(() => {
    uninstallSafeStorageMock();
  });

  it('round-trips a license: save -> load returns the same data', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    const license = makeLicense();

    const saved = await storage.saveLicense(license);
    expect(saved).toBe(true);

    const loaded = await storage.loadLicense();
    expect(loaded).not.toBeNull();
    expect(loaded?.license.key).toBe(license.key);
    expect(loaded?.license.data.edition).toBe('pro');
  });

  it('writes the new on-disk format (storageVersion = 2)', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    await storage.saveLicense(makeLicense());

    const raw = localStorage.getItem('paperflow-license');
    expect(raw).not.toBeNull();
    // The new format is base64(safeStorage.encryptString(JSON)). Our mock
    // encrypts by prefixing 'enc:' so the inner JSON should decode and contain
    // a _storageVersion === 2 marker.
    const decoded = atob(raw as string);
    expect(decoded.startsWith('enc:')).toBe(true);
    const payload = JSON.parse(decoded.slice('enc:'.length));
    expect(payload._storageVersion).toBe(2);
    expect(typeof payload.hmac).toBe('string');
    expect(payload.hmac.length).toBeGreaterThanOrEqual(32);
  });

  it('rejects loading when the stored HMAC does not match the canonical payload', async () => {
    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    await storage.saveLicense(makeLicense());

    // Tamper: re-write storage with a corrupted license but keep the old HMAC.
    const raw = localStorage.getItem('paperflow-license') as string;
    const decoded = atob(raw);
    const inner = JSON.parse(decoded.slice('enc:'.length));
    inner.license.data.edition = 'enterprise'; // privilege escalation attempt
    const tampered = 'enc:' + JSON.stringify(inner);
    localStorage.setItem('paperflow-license', btoa(tampered));

    const loaded = await storage.loadLicense();
    expect(loaded).toBeNull();
  });

  it('migrates a legacy XOR-encoded file to the new safeStorage + HMAC format on first read', async () => {
    // Produce a legacy-format file the same way the old impl did:
    //   serialized = JSON of { license, binding?, storedAt, version: 1, checksum }
    //   stored = btoa( xor(serialized, 'paperflow-secure-storage-key-v1') )
    const legacyKey = 'paperflow-secure-storage-key-v1';
    const xor = (s: string): string => {
      let out = '';
      for (let i = 0; i < s.length; i++) {
        out += String.fromCharCode(s.charCodeAt(i) ^ legacyKey.charCodeAt(i % legacyKey.length));
      }
      return out;
    };
    const license = makeLicense();
    const legacyBody = {
      license,
      binding: undefined,
      storedAt: 1_700_000_000_000,
      version: 1,
      checksum: '',
    };
    // Mirror legacy checksum implementation: 32-bit folding hash, base36.
    const calcLegacyChecksum = (data: unknown): string => {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        hash = ((hash << 5) - hash + c) | 0;
      }
      return Math.abs(hash).toString(36);
    };
    legacyBody.checksum = calcLegacyChecksum({
      license: legacyBody.license,
      binding: legacyBody.binding,
      storedAt: legacyBody.storedAt,
    });
    const serialized = JSON.stringify(legacyBody);
    localStorage.setItem('paperflow-license', btoa(xor(serialized)));

    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();

    // First load should auto-migrate and return the license.
    const loaded = await storage.loadLicense();
    expect(loaded).not.toBeNull();
    expect(loaded?.license.key).toBe(license.key);

    // After load, the on-disk format should be the new one (v2 + HMAC + safeStorage).
    const raw = localStorage.getItem('paperflow-license') as string;
    const decoded = atob(raw);
    expect(decoded.startsWith('enc:')).toBe(true); // mock safeStorage prefix
    const payload = JSON.parse(decoded.slice('enc:'.length));
    expect(payload._storageVersion).toBe(2);
    expect(typeof payload.hmac).toBe('string');
  });

  it('falls back gracefully when safeStorage is unavailable (no DPAPI / headless)', async () => {
    uninstallSafeStorageMock();
    installSafeStorageMock({ available: false });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { LicenseStorage } = await import('@lib/license/licenseStorage');
    const storage = new LicenseStorage();
    const license = makeLicense();
    expect(await storage.saveLicense(license)).toBe(true);

    // Insecure path should warn at least once.
    const warned = warnSpy.mock.calls.some((c) =>
      c.some((arg) => typeof arg === 'string' && arg.includes('INSECURE_PLATFORM'))
    );
    expect(warned).toBe(true);

    const loaded = await storage.loadLicense();
    expect(loaded?.license.key).toBe(license.key);

    warnSpy.mockRestore();
  });
});
