/**
 * Electron Network Status Detection
 *
 * Main process handlers for network status detection with more reliable
 * connectivity checks than navigator.onLine.
 */

import { net, BrowserWindow, ipcMain } from 'electron';
import dns from 'dns';
import https from 'https';
import type { NetworkStatusInfo } from '../../src/types/offline';

/**
 * Check endpoints for connectivity
 */
const CHECK_ENDPOINTS = [
  'https://www.google.com/generate_204',
  'https://www.cloudflare.com/cdn-cgi/trace',
  'https://connectivity-check.ubuntu.com/',
] as const;

// DNS servers available for future enhanced connectivity checks
// const DNS_SERVERS = ['8.8.8.8', '1.1.1.1', '208.67.222.222'] as const;

/**
 * Network status manager
 */
class NetworkStatusManager {
  private currentStatus: NetworkStatusInfo = {
    isOnline: true,
    connectionType: 'unknown',
    lastChecked: new Date(),
  };
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: NetworkStatusInfo) => void> = new Set();

  /**
   * Initialize network status monitoring
   */
  initialize(): void {
    // Perform initial check
    this.checkNetworkStatus();

    // Set up periodic checks (every 30 seconds)
    this.checkInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, 30000);

    // Register IPC handlers
    this.registerIPCHandlers();
  }

  /**
   * Register IPC handlers for renderer communication
   */
  private registerIPCHandlers(): void {
    // Get current network status
    ipcMain.handle('network-get-status', async () => {
      await this.checkNetworkStatus();
      return this.currentStatus;
    });

    // Force a network check
    ipcMain.handle('network-check', async () => {
      return this.checkNetworkStatus();
    });

    // Subscribe to network status changes
    ipcMain.on('network-subscribe', (event) => {
      const webContents = event.sender;
      const listener = (status: NetworkStatusInfo) => {
        if (!webContents.isDestroyed()) {
          webContents.send('network-status-changed', status);
        }
      };
      this.listeners.add(listener);

      // Send current status immediately
      if (!webContents.isDestroyed()) {
        webContents.send('network-status-changed', this.currentStatus);
      }

      // Clean up listener when window is closed
      webContents.on('destroyed', () => {
        this.listeners.delete(listener);
      });
    });

    ipcMain.on('network-unsubscribe', () => {
      // Listeners are auto-cleaned on window destroy
    });
  }

  /**
   * Check network status using multiple methods
   */
  async checkNetworkStatus(): Promise<NetworkStatusInfo> {
    const previousStatus = this.currentStatus.isOnline;

    // Method 1: Check Electron net module
    const netOnline = net.isOnline();

    // Method 2: DNS lookup check
    const dnsOnline = await this.checkDNS();

    // Method 3: HTTP connectivity check
    const httpOnline = await this.checkHTTPConnectivity();

    // Combine results - consider online if any method succeeds
    const isOnline = netOnline && (dnsOnline || httpOnline);

    // Determine connection type (simplified - in real app, use system APIs)
    let connectionType: NetworkStatusInfo['connectionType'] = 'unknown';
    if (isOnline) {
      // On Windows/macOS/Linux, we could use native APIs to get actual connection type
      // For now, just use 'unknown' or make educated guesses
      connectionType = 'ethernet';
    }

    this.currentStatus = {
      isOnline,
      connectionType,
      lastChecked: new Date(),
    };

    // Notify listeners if status changed
    if (previousStatus !== isOnline) {
      this.notifyListeners();
    }

    return this.currentStatus;
  }

  /**
   * Check DNS connectivity
   */
  private async checkDNS(): Promise<boolean> {
    return new Promise((resolve) => {
      dns.resolve('www.google.com', (err) => {
        resolve(!err);
      });
    });
  }

  /**
   * Check HTTP connectivity
   */
  private async checkHTTPConnectivity(): Promise<boolean> {
    // Try each endpoint until one succeeds
    for (const endpoint of CHECK_ENDPOINTS) {
      try {
        const isReachable = await this.checkEndpoint(endpoint);
        if (isReachable) {
          return true;
        }
      } catch {
        // Continue to next endpoint
      }
    }
    return false;
  }

  /**
   * Check a single endpoint
   */
  private checkEndpoint(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      const req = https.get(url, { timeout: 5000 }, (res) => {
        clearTimeout(timeout);
        // Consider any response (even errors) as "connected"
        resolve(res.statusCode !== undefined);
      });

      req.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      req.on('timeout', () => {
        clearTimeout(timeout);
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    }

    // Also notify all browser windows
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send('network-status-changed', this.currentStatus);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus(): NetworkStatusInfo {
    return this.currentStatus;
  }

  /**
   * Force a status check
   */
  async forceCheck(): Promise<NetworkStatusInfo> {
    return this.checkNetworkStatus();
  }

  /**
   * Add status listener
   */
  addListener(callback: (status: NetworkStatusInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const networkStatusManager = new NetworkStatusManager();

/**
 * Initialize network status monitoring
 */
export function initializeNetworkStatus(): void {
  networkStatusManager.initialize();
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatusInfo {
  return networkStatusManager.getStatus();
}

/**
 * Force a network status check
 */
export async function checkNetworkStatus(): Promise<NetworkStatusInfo> {
  return networkStatusManager.forceCheck();
}
