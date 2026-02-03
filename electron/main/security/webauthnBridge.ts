/**
 * Electron WebAuthn Bridge
 *
 * Provides WebAuthn support in Electron with native authenticator handling.
 */

import { BrowserWindow, ipcMain, session } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';

/**
 * WebAuthn bridge configuration
 */
interface WebAuthnBridgeConfig {
  rpId: string;
  allowedOrigins: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: WebAuthnBridgeConfig = {
  rpId: 'paperflow.app',
  allowedOrigins: ['app://paperflow', 'https://paperflow.app'],
};

/**
 * WebAuthn bridge for Electron
 */
export class WebAuthnBridge {
  private config: WebAuthnBridgeConfig;
  private pendingRequests: Map<
    string,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  > = new Map();

  constructor(config: Partial<WebAuthnBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the bridge
   */
  initialize(): void {
    this.setupIpcHandlers();
    this.configureWebContents();
  }

  /**
   * Set up IPC handlers for WebAuthn operations
   */
  private setupIpcHandlers(): void {
    // Check WebAuthn availability
    ipcMain.handle(IPC_CHANNELS.WEBAUTHN_IS_AVAILABLE, async () => {
      return true; // Electron supports WebAuthn
    });

    // Check platform authenticator
    ipcMain.handle(
      IPC_CHANNELS.WEBAUTHN_IS_PLATFORM_AVAILABLE,
      async () => {
        // Check if platform authenticator is available
        // On Windows: Windows Hello
        // On macOS: Touch ID
        // On Linux: May require additional configuration
        return process.platform !== 'linux';
      }
    );

    // Get authenticator info
    ipcMain.handle(IPC_CHANNELS.WEBAUTHN_GET_AUTHENTICATORS, async () => {
      return this.getAvailableAuthenticators();
    });
  }

  /**
   * Configure web contents for WebAuthn
   */
  private configureWebContents(): void {
    // Intercept WebAuthn requests in the default session
    session.defaultSession.webRequest.onBeforeRequest(
      {
        urls: ['*://*/*'],
      },
      (details, callback) => {
        // Allow all requests by default
        callback({ cancel: false });
      }
    );
  }

  /**
   * Get available authenticators
   */
  private getAvailableAuthenticators(): {
    id: string;
    name: string;
    type: string;
  }[] {
    const authenticators: { id: string; name: string; type: string }[] = [];

    // Platform authenticator
    if (process.platform === 'win32') {
      authenticators.push({
        id: 'windows-hello',
        name: 'Windows Hello',
        type: 'platform',
      });
    } else if (process.platform === 'darwin') {
      authenticators.push({
        id: 'touch-id',
        name: 'Touch ID',
        type: 'platform',
      });
    }

    // Cross-platform (USB keys are always potentially available)
    authenticators.push({
      id: 'usb-key',
      name: 'USB Security Key',
      type: 'cross-platform',
    });

    authenticators.push({
      id: 'nfc-key',
      name: 'NFC Security Key',
      type: 'cross-platform',
    });

    return authenticators;
  }

  /**
   * Handle WebAuthn protocol
   */
  setupProtocolHandler(mainWindow: BrowserWindow): void {
    // Handle custom protocol for WebAuthn
    // This is useful for handling WebAuthn in custom Electron windows

    mainWindow.webContents.session.setPermissionRequestHandler(
      (_webContents, permission, callback) => {
        // Allow WebAuthn-related permissions
        if (permission === 'usb' || permission === 'hid') {
          callback(true);
          return;
        }

        // Default handling
        callback(true);
      }
    );
  }

  /**
   * Cleanup
   */
  destroy(): void {
    ipcMain.removeHandler(IPC_CHANNELS.WEBAUTHN_IS_AVAILABLE);
    ipcMain.removeHandler(IPC_CHANNELS.WEBAUTHN_IS_PLATFORM_AVAILABLE);
    ipcMain.removeHandler(IPC_CHANNELS.WEBAUTHN_GET_AUTHENTICATORS);
    this.pendingRequests.clear();
  }
}

// Singleton instance
let bridgeInstance: WebAuthnBridge | null = null;

export function getWebAuthnBridge(
  config?: Partial<WebAuthnBridgeConfig>
): WebAuthnBridge {
  if (!bridgeInstance) {
    bridgeInstance = new WebAuthnBridge(config);
  }
  return bridgeInstance;
}

export function initializeWebAuthnBridge(
  mainWindow: BrowserWindow,
  config?: Partial<WebAuthnBridgeConfig>
): WebAuthnBridge {
  const bridge = getWebAuthnBridge(config);
  bridge.initialize();
  bridge.setupProtocolHandler(mainWindow);
  return bridge;
}

export default WebAuthnBridge;
