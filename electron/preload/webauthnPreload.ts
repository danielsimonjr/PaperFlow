/**
 * WebAuthn Preload
 *
 * Exposes WebAuthn functionality to the renderer process.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/channels';

/**
 * WebAuthn API exposed to renderer
 */
export const webauthnAPI = {
  /**
   * Check if WebAuthn is available
   */
  isAvailable: (): Promise<boolean> => {
    return ipcRenderer.invoke(IPC_CHANNELS.WEBAUTHN_IS_AVAILABLE);
  },

  /**
   * Check if platform authenticator is available
   */
  isPlatformAuthenticatorAvailable: (): Promise<boolean> => {
    return ipcRenderer.invoke(IPC_CHANNELS.WEBAUTHN_IS_PLATFORM_AVAILABLE);
  },

  /**
   * Get available authenticators
   */
  getAuthenticators: (): Promise<
    { id: string; name: string; type: string }[]
  > => {
    return ipcRenderer.invoke(IPC_CHANNELS.WEBAUTHN_GET_AUTHENTICATORS);
  },
};

/**
 * Expose WebAuthn API if in Electron context
 */
export function exposeWebAuthnAPI(): void {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('electronWebAuthn', webauthnAPI);
    } catch (error) {
      console.error('Failed to expose WebAuthn API:', error);
    }
  } else {
    (window as Record<string, unknown>).electronWebAuthn = webauthnAPI;
  }
}

export default webauthnAPI;
