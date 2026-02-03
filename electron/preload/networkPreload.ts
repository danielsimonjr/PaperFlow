/**
 * Network Preload Script
 *
 * Exposes network status API to renderer process through contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { NetworkStatusInfo } from '../../src/types/offline';

/**
 * Network API interface
 */
export interface NetworkAPI {
  /**
   * Get current network status
   */
  getStatus: () => Promise<NetworkStatusInfo>;

  /**
   * Force a network status check
   */
  checkStatus: () => Promise<NetworkStatusInfo>;

  /**
   * Subscribe to network status changes
   */
  subscribe: (callback: (status: NetworkStatusInfo) => void) => () => void;

  /**
   * Check if currently online
   */
  isOnline: () => Promise<boolean>;
}

/**
 * Create the network API
 */
function createNetworkAPI(): NetworkAPI {
  const listeners = new Set<(status: NetworkStatusInfo) => void>();
  let isSubscribed = false;

  // Set up listener for status changes
  const setupListener = () => {
    if (isSubscribed) return;
    isSubscribed = true;

    ipcRenderer.on('network-status-changed', (_event, status: NetworkStatusInfo) => {
      listeners.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.error('Network status callback error:', error);
        }
      });
    });

    ipcRenderer.send('network-subscribe');
  };

  return {
    getStatus: async (): Promise<NetworkStatusInfo> => {
      return ipcRenderer.invoke('network-get-status');
    },

    checkStatus: async (): Promise<NetworkStatusInfo> => {
      return ipcRenderer.invoke('network-check');
    },

    subscribe: (callback: (status: NetworkStatusInfo) => void): (() => void) => {
      setupListener();
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && isSubscribed) {
          ipcRenderer.send('network-unsubscribe');
          isSubscribed = false;
        }
      };
    },

    isOnline: async (): Promise<boolean> => {
      const status = await ipcRenderer.invoke('network-get-status');
      return status.isOnline;
    },
  };
}

// Expose the network API
const networkAPI = createNetworkAPI();
contextBridge.exposeInMainWorld('electronNetwork', networkAPI);

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronNetwork?: NetworkAPI;
  }
}
