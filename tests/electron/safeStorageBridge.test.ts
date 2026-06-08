/**
 * SafeStorage Preload Bridge Tests
 *
 * Verifies the IPC channel constants, main-process handlers, and the contract
 * by which the preload exposes Electron `safeStorage` to the renderer.
 *
 * Closes the gap left by commit 2353770 (license-storage rewrite). Before this
 * bridge, `window.electron.safeStorage` was undefined in production, so
 * licenseStorage's INSECURE_PLATFORM fallback path ran instead of DPAPI / Keychain.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IPC_CHANNELS } from '../../electron/ipc/channels';

describe('SafeStorage IPC channels', () => {
  it('defines a SAFE_STORAGE_IS_AVAILABLE channel', () => {
    expect(IPC_CHANNELS.SAFE_STORAGE_IS_AVAILABLE).toBe('safe-storage-is-available');
  });

  it('defines a SAFE_STORAGE_ENCRYPT channel', () => {
    expect(IPC_CHANNELS.SAFE_STORAGE_ENCRYPT).toBe('safe-storage-encrypt');
  });

  it('defines a SAFE_STORAGE_DECRYPT channel', () => {
    expect(IPC_CHANNELS.SAFE_STORAGE_DECRYPT).toBe('safe-storage-decrypt');
  });

  it('keeps all channel names unique after the additions', () => {
    const values = Object.values(IPC_CHANNELS);
    expect(new Set(values).size).toBe(values.length);
  });
});

// ---------------------------------------------------------------------------
// Main-process handler behavior
// ---------------------------------------------------------------------------

interface RegisteredSyncHandler {
  channel: string;
  handler: (event: { returnValue: unknown }, ...args: unknown[]) => void;
}

interface RegisteredHandler {
  channel: string;
  handler: (event: unknown, ...args: unknown[]) => unknown;
}

vi.mock('electron', () => {
  const syncHandlers: RegisteredSyncHandler[] = [];
  const handlers: RegisteredHandler[] = [];
  return {
    safeStorage: {
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn((s: string) => Buffer.from('cipher:' + s, 'utf-8')),
      decryptString: vi.fn((b: Buffer) => {
        const s = b.toString('utf-8');
        if (!s.startsWith('cipher:')) throw new Error('not cipher');
        return s.slice('cipher:'.length);
      }),
    },
    ipcMain: {
      on: (channel: string, handler: RegisteredSyncHandler['handler']) => {
        syncHandlers.push({ channel, handler });
      },
      handle: (channel: string, handler: RegisteredHandler['handler']) => {
        handlers.push({ channel, handler });
      },
      removeHandler: vi.fn(),
      __syncHandlers: syncHandlers,
      __handlers: handlers,
    },
  };
});

describe('SafeStorage main-process handlers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('registers sync IPC listeners for the three safeStorage channels', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    // Reset any prior registrations so this test reads only the bridge's effects.
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const channels = ipcMain.__syncHandlers.map((h: RegisteredSyncHandler) => h.channel);
    expect(channels).toContain(IPC_CHANNELS.SAFE_STORAGE_IS_AVAILABLE);
    expect(channels).toContain(IPC_CHANNELS.SAFE_STORAGE_ENCRYPT);
    expect(channels).toContain(IPC_CHANNELS.SAFE_STORAGE_DECRYPT);
  });

  it('SAFE_STORAGE_IS_AVAILABLE returns the boolean from safeStorage.isEncryptionAvailable()', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const handler = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_IS_AVAILABLE
    )!;
    const event = { returnValue: undefined as unknown };
    handler.handler(event);
    expect(event.returnValue).toBe(true);
  });

  it('SAFE_STORAGE_ENCRYPT returns base64 ciphertext for a string input', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const handler = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_ENCRYPT
    )!;
    const event = { returnValue: undefined as unknown };
    handler.handler(event, 'hello');
    expect(typeof event.returnValue).toBe('string');
    // Mock encrypts by prefixing 'cipher:'; the IPC return is base64.
    const decoded = Buffer.from(event.returnValue as string, 'base64').toString('utf-8');
    expect(decoded).toBe('cipher:hello');
  });

  it('SAFE_STORAGE_ENCRYPT throws when given a non-string', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const handler = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_ENCRYPT
    )!;
    const event = { returnValue: undefined as unknown };
    expect(() => handler.handler(event, 123 as unknown)).toThrow(/string/i);
  });

  it('SAFE_STORAGE_DECRYPT round-trips base64 ciphertext back to plain string', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const enc = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_ENCRYPT
    )!;
    const dec = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_DECRYPT
    )!;

    const encEvent = { returnValue: undefined as unknown };
    enc.handler(encEvent, 'license-payload');
    const cipherB64 = encEvent.returnValue as string;

    const decEvent = { returnValue: undefined as unknown };
    dec.handler(decEvent, cipherB64);
    expect(decEvent.returnValue).toBe('license-payload');
  });

  it('SAFE_STORAGE_DECRYPT throws when given a non-string', async () => {
    const electron = await import('electron');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ipcMain = electron.ipcMain as any;
    ipcMain.__syncHandlers.length = 0;

    const { registerSafeStorageHandlers } = await import('../../electron/ipc/safeStorageHandlers');
    registerSafeStorageHandlers(ipcMain);

    const handler = ipcMain.__syncHandlers.find(
      (h: RegisteredSyncHandler) => h.channel === IPC_CHANNELS.SAFE_STORAGE_DECRYPT
    )!;
    const event = { returnValue: undefined as unknown };
    expect(() => handler.handler(event, 42 as unknown)).toThrow(/string/i);
  });
});
