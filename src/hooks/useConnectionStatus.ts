/**
 * Connection Status Hook
 *
 * React hook for monitoring connection status with
 * enhanced detection in Electron.
 */

import { useState, useEffect, useRef } from 'react';
import { useOfflineStore, initializeOfflineListeners } from '@/stores/offlineStore';
import type { ConnectionStatus, NetworkStatusInfo } from '@/types/offline';

/**
 * Connection info
 */
interface ConnectionInfo {
  status: ConnectionStatus;
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
  connectionType?: NetworkStatusInfo['connectionType'];
  effectiveType?: NetworkStatusInfo['effectiveType'];
  downlink?: number;
  rtt?: number;
}

/**
 * Hook options
 */
interface UseConnectionStatusOptions {
  /**
   * Callback when going offline
   */
  onOffline?: () => void;

  /**
   * Callback when coming back online
   */
  onOnline?: () => void;

  /**
   * Callback on any status change
   */
  onChange?: (info: ConnectionInfo) => void;

  /**
   * Enable network quality monitoring
   */
  monitorQuality?: boolean;
}

/**
 * Hook for connection status monitoring
 */
export function useConnectionStatus(options: UseConnectionStatusOptions = {}): ConnectionInfo {
  const { onOffline, onOnline, onChange, monitorQuality = false } = options;

  const [info, setInfo] = useState<ConnectionInfo>(() => ({
    status: navigator.onLine ? 'online' : 'offline',
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineSince: navigator.onLine ? null : new Date(),
  }));

  const storeIsOnline = useOfflineStore((state) => state.isOnline);
  const setStoreOnline = useOfflineStore((state) => state.setOnline);
  const previousOnlineRef = useRef(navigator.onLine);

  // Initialize store listeners
  useEffect(() => {
    const cleanup = initializeOfflineListeners();
    return cleanup;
  }, []);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      const wasOffline = !previousOnlineRef.current;
      previousOnlineRef.current = true;

      const newInfo: ConnectionInfo = {
        status: 'online',
        isOnline: true,
        wasOffline,
        offlineSince: null,
      };

      setInfo(newInfo);
      setStoreOnline(true);

      if (onOnline && wasOffline) {
        onOnline();
      }
      if (onChange) {
        onChange(newInfo);
      }
    };

    const handleOffline = () => {
      previousOnlineRef.current = false;

      const newInfo: ConnectionInfo = {
        status: 'offline',
        isOnline: false,
        wasOffline: false,
        offlineSince: new Date(),
      };

      setInfo(newInfo);
      setStoreOnline(false);

      if (onOffline) {
        onOffline();
      }
      if (onChange) {
        onChange(newInfo);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline, onChange, setStoreOnline]);

  // Electron network status
  useEffect(() => {
    const electronNetwork = window.electronNetwork;
    if (!electronNetwork) return;

    const unsubscribe = electronNetwork.subscribe((status: NetworkStatusInfo) => {
      const wasOffline = !previousOnlineRef.current;
      previousOnlineRef.current = status.isOnline;

      const newInfo: ConnectionInfo = {
        status: status.isOnline ? 'online' : 'offline',
        isOnline: status.isOnline,
        wasOffline: status.isOnline && wasOffline,
        offlineSince: status.isOnline ? null : info.offlineSince || new Date(),
        connectionType: status.connectionType,
        effectiveType: status.effectiveType,
        downlink: status.downlink,
        rtt: status.rtt,
      };

      setInfo(newInfo);
      setStoreOnline(status.isOnline);

      if (status.isOnline && wasOffline && onOnline) {
        onOnline();
      } else if (!status.isOnline && onOffline) {
        onOffline();
      }

      if (onChange) {
        onChange(newInfo);
      }
    });

    return unsubscribe;
  }, [onOnline, onOffline, onChange, setStoreOnline, info.offlineSince]);

  // Network Information API (experimental)
  useEffect(() => {
    if (!monitorQuality) return;

    const connection =
      (navigator as NavigatorWithConnection).connection ||
      (navigator as NavigatorWithConnection).mozConnection ||
      (navigator as NavigatorWithConnection).webkitConnection;

    if (!connection) return;

    const handleChange = () => {
      setInfo((prev) => ({
        ...prev,
        effectiveType: connection.effectiveType as ConnectionInfo['effectiveType'],
        downlink: connection.downlink,
        rtt: connection.rtt,
      }));
    };

    connection.addEventListener('change', handleChange);
    handleChange(); // Get initial values

    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }, [monitorQuality]);

  // Sync with store
  useEffect(() => {
    if (storeIsOnline !== info.isOnline) {
      setInfo((prev) => ({
        ...prev,
        status: storeIsOnline ? 'online' : 'offline',
        isOnline: storeIsOnline,
        offlineSince: storeIsOnline ? null : prev.offlineSince || new Date(),
      }));
    }
  }, [storeIsOnline, info.isOnline]);

  return info;
}

/**
 * Simple hook for just online/offline status
 */
export function useIsOnline(): boolean {
  const { isOnline } = useConnectionStatus();
  return isOnline;
}

/**
 * Hook to run callback when coming back online
 */
export function useOnReconnect(callback: () => void): void {
  useConnectionStatus({
    onOnline: callback,
  });
}

/**
 * Hook to run callback when going offline
 */
export function useOnDisconnect(callback: () => void): void {
  useConnectionStatus({
    onOffline: callback,
  });
}

// Type definitions for Navigator with connection
interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

// Augment Window type for electronNetwork
interface ElectronNetworkAPI {
  getStatus: () => Promise<NetworkStatusInfo>;
  checkStatus: () => Promise<NetworkStatusInfo>;
  subscribe: (callback: (status: NetworkStatusInfo) => void) => () => void;
  isOnline: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronNetwork?: ElectronNetworkAPI;
  }
}
