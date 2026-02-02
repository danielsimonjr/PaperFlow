/**
 * usePlatform Hook
 *
 * Provides reactive platform detection and feature availability
 * for React components.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  isElectron,
  isBrowser,
  isWindows,
  isMacOS,
  isLinux,
  getPlatformInfo,
  getAppVersion,
  isFeatureAvailable,
  getCommandKey,
  getAltKey,
  formatShortcut,
  initializePlatform,
  type PlatformFeature,
} from '@lib/electron/platform';
import type { PlatformInfo } from '@/types/electronTypes';

interface UsePlatformReturn {
  /** Whether running in Electron */
  isElectron: boolean;
  /** Whether running in a web browser */
  isBrowser: boolean;
  /** Whether running on Windows */
  isWindows: boolean;
  /** Whether running on macOS */
  isMacOS: boolean;
  /** Whether running on Linux */
  isLinux: boolean;
  /** Detailed platform info (Electron only) */
  platformInfo: PlatformInfo | null;
  /** App version (Electron only) */
  appVersion: string | null;
  /** Whether platform info is loading */
  isLoading: boolean;
  /** Check if a feature is available */
  hasFeature: (feature: PlatformFeature) => boolean;
  /** Get the command key name for the current platform */
  commandKey: string;
  /** Get the alt key name for the current platform */
  altKey: string;
  /** Format a keyboard shortcut for display */
  formatShortcut: (shortcut: string) => string;
}

/**
 * Hook for accessing platform information and feature detection
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isElectron, hasFeature, commandKey } = usePlatform();
 *
 *   return (
 *     <div>
 *       {isElectron && <WindowControls />}
 *       <span>Save: {commandKey}+S</span>
 *       {hasFeature('native-file-dialogs') && <OpenButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlatform(): UsePlatformReturn {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load platform info on mount
  useEffect(() => {
    let mounted = true;

    async function loadPlatformInfo() {
      try {
        // Initialize platform detection
        await initializePlatform();

        if (!mounted) return;

        // Get detailed info if in Electron
        if (isElectron()) {
          const [info, version] = await Promise.all([getPlatformInfo(), getAppVersion()]);
          if (mounted) {
            setPlatformInfo(info);
            setAppVersion(version);
          }
        }
      } catch (error) {
        console.error('Failed to load platform info:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadPlatformInfo();

    return () => {
      mounted = false;
    };
  }, []);

  // Memoize static values
  const staticValues = useMemo(
    () => ({
      isElectron: isElectron(),
      isBrowser: isBrowser(),
      isWindows: isWindows(),
      isMacOS: isMacOS(),
      isLinux: isLinux(),
      commandKey: getCommandKey(),
      altKey: getAltKey(),
    }),
    []
  );

  // Feature check function
  const hasFeature = useMemo(() => {
    return (feature: PlatformFeature) => isFeatureAvailable(feature);
  }, []);

  return {
    ...staticValues,
    platformInfo,
    appVersion,
    isLoading,
    hasFeature,
    formatShortcut,
  };
}

/**
 * Hook for subscribing to Electron menu events
 *
 * @example
 * ```tsx
 * function EditorComponent() {
 *   const { save } = useFileOperations();
 *
 *   useElectronMenuEvents({
 *     onFileSave: save,
 *     onEditUndo: () => historyStore.undo(),
 *   });
 * }
 * ```
 */
export interface ElectronMenuEventHandlers {
  onFileNew?: () => void;
  onFileOpen?: () => void;
  onFileSave?: () => void;
  onFileSaveAs?: () => void;
  onEditUndo?: () => void;
  onEditRedo?: () => void;
  onViewZoomIn?: () => void;
  onViewZoomOut?: () => void;
  onViewZoomReset?: () => void;
  onBeforeQuit?: () => void;
}

export function useElectronMenuEvents(handlers: ElectronMenuEventHandlers): void {
  useEffect(() => {
    if (!isElectron() || !window.electron) {
      return;
    }

    const unsubscribers: Array<() => void> = [];

    if (handlers.onFileNew) {
      unsubscribers.push(window.electron.onMenuFileNew(handlers.onFileNew));
    }
    if (handlers.onFileOpen) {
      unsubscribers.push(window.electron.onMenuFileOpen(handlers.onFileOpen));
    }
    if (handlers.onFileSave) {
      unsubscribers.push(window.electron.onMenuFileSave(handlers.onFileSave));
    }
    if (handlers.onFileSaveAs) {
      unsubscribers.push(window.electron.onMenuFileSaveAs(handlers.onFileSaveAs));
    }
    if (handlers.onEditUndo) {
      unsubscribers.push(window.electron.onMenuEditUndo(handlers.onEditUndo));
    }
    if (handlers.onEditRedo) {
      unsubscribers.push(window.electron.onMenuEditRedo(handlers.onEditRedo));
    }
    if (handlers.onViewZoomIn) {
      unsubscribers.push(window.electron.onMenuViewZoomIn(handlers.onViewZoomIn));
    }
    if (handlers.onViewZoomOut) {
      unsubscribers.push(window.electron.onMenuViewZoomOut(handlers.onViewZoomOut));
    }
    if (handlers.onViewZoomReset) {
      unsubscribers.push(window.electron.onMenuViewZoomReset(handlers.onViewZoomReset));
    }
    if (handlers.onBeforeQuit) {
      unsubscribers.push(window.electron.onBeforeQuit(handlers.onBeforeQuit));
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [handlers]);
}
