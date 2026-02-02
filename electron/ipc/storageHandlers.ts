/**
 * Secure Storage IPC Handlers
 *
 * Handles IPC communication for secure storage operations.
 */

import { IpcMain } from 'electron';
import {
  setSecret,
  getSecret,
  hasSecret,
  deleteSecret,
  listCredentials,
  clearAllCredentials,
  isSecureStorageAvailable,
  generateSecureKey,
  SECURE_STORAGE_CHANNELS,
} from '../secureStorage';

/**
 * Set up secure storage IPC handlers
 */
export function setupStorageHandlers(ipcMain: IpcMain): void {
  // Set a secret
  ipcMain.handle(
    SECURE_STORAGE_CHANNELS.SET_SECRET,
    async (
      _event,
      key: string,
      value: string,
      options?: { service?: string; account?: string; label?: string }
    ) => {
      try {
        await setSecret(key, value, options);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to store secret',
        };
      }
    }
  );

  // Get a secret
  ipcMain.handle(SECURE_STORAGE_CHANNELS.GET_SECRET, async (_event, key: string) => {
    try {
      const value = await getSecret(key);
      return { success: true, value };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve secret',
      };
    }
  });

  // Check if secret exists
  ipcMain.handle(SECURE_STORAGE_CHANNELS.HAS_SECRET, async (_event, key: string) => {
    try {
      const exists = await hasSecret(key);
      return { success: true, exists };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check secret',
      };
    }
  });

  // Delete a secret
  ipcMain.handle(SECURE_STORAGE_CHANNELS.DELETE_SECRET, async (_event, key: string) => {
    try {
      const deleted = await deleteSecret(key);
      return { success: true, deleted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete secret',
      };
    }
  });

  // List all credentials
  ipcMain.handle(SECURE_STORAGE_CHANNELS.LIST_CREDENTIALS, async () => {
    try {
      const credentials = await listCredentials();
      return { success: true, credentials };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list credentials',
      };
    }
  });

  // Clear all credentials
  ipcMain.handle(SECURE_STORAGE_CHANNELS.CLEAR_ALL, async () => {
    try {
      const count = await clearAllCredentials();
      return { success: true, count };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear credentials',
      };
    }
  });

  // Check if secure storage is available
  ipcMain.handle(SECURE_STORAGE_CHANNELS.IS_AVAILABLE, () => {
    return { available: isSecureStorageAvailable() };
  });

  // Generate a secure key
  ipcMain.handle(SECURE_STORAGE_CHANNELS.GENERATE_KEY, (_event, length?: number) => {
    const key = generateSecureKey(length);
    return { key };
  });
}
