/**
 * SafeStorage IPC Handlers
 *
 * Exposes Electron's `safeStorage` API to the renderer via three synchronous
 * IPC channels. Synchronous because the renderer-side consumer
 * (`src/lib/license/licenseStorage.ts`) was authored to call these methods
 * synchronously (matching Electron main-process `safeStorage` semantics).
 *
 * On the wire, ciphertext is base64-encoded — `Buffer` does not survive a JSON
 * IPC round-trip without manual encoding. The preload re-decodes to a typed
 * array before handing it to the consumer.
 *
 * Closes the gap left by the 2026-05-03 license-storage rewrite (commit
 * 2353770), where `licenseStorage.ts` already detects and consumes
 * `window.electron.safeStorage` but the bridge itself was never wired up.
 *
 * Platform behavior of `safeStorage.isEncryptionAvailable()`:
 *   - Windows: DPAPI per-user; nearly always true on a real desktop session.
 *   - macOS:   Keychain; true once the user account has a login keychain.
 *   - Linux:   libsecret (gnome-keyring / KWallet); false on headless servers.
 */

import { ipcMain as defaultIpcMain, safeStorage } from 'electron';
import type { IpcMain } from 'electron';
import { IPC_CHANNELS } from './channels';

/**
 * Register the three sync IPC handlers that bridge `safeStorage` to renderers.
 *
 * Pass an explicit `IpcMain` instance (defaults to the global one) to make
 * unit-testing of registration straightforward.
 */
export function registerSafeStorageHandlers(ipcMain: IpcMain = defaultIpcMain): void {
  ipcMain.on(IPC_CHANNELS.SAFE_STORAGE_IS_AVAILABLE, (event) => {
    try {
      event.returnValue = safeStorage.isEncryptionAvailable();
    } catch {
      // Defensive: if the platform throws (sandbox / headless edge cases),
      // report unavailable rather than crashing the renderer's sync wait.
      event.returnValue = false;
    }
  });

  ipcMain.on(IPC_CHANNELS.SAFE_STORAGE_ENCRYPT, (event, plain: unknown) => {
    if (typeof plain !== 'string') {
      throw new Error('safeStorage.encryptString expects a string argument');
    }
    const cipher = safeStorage.encryptString(plain);
    // Encode for JSON-safe IPC transport. The preload will base64-decode back
    // into a Uint8Array before exposing to the renderer.
    event.returnValue = cipher.toString('base64');
  });

  ipcMain.on(IPC_CHANNELS.SAFE_STORAGE_DECRYPT, (event, cipherB64: unknown) => {
    if (typeof cipherB64 !== 'string') {
      throw new Error('safeStorage.decryptString expects a base64 string argument');
    }
    const buf = Buffer.from(cipherB64, 'base64');
    event.returnValue = safeStorage.decryptString(buf);
  });
}
