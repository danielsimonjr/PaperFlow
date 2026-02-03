/**
 * Hot Reload for Development
 *
 * Development-only hot reload that instantly reflects code changes
 * without losing document state.
 */

import type { UserState, UnsavedChanges } from '@lib/fileWatch/smartReload';

// Only active in development mode
const isDevelopment = import.meta.env.DEV;

export interface HotReloadState {
  documentPath: string | null;
  userState: UserState | null;
  unsavedChanges: UnsavedChanges | null;
  timestamp: number;
}

// Storage key for hot reload state
const HOT_RELOAD_STORAGE_KEY = '__paperflow_hot_reload_state__';

/**
 * Save state before hot reload
 */
export function saveHotReloadState(
  documentPath: string | null,
  userState: UserState | null,
  unsavedChanges: UnsavedChanges | null
): void {
  if (!isDevelopment) return;

  const state: HotReloadState = {
    documentPath,
    userState,
    unsavedChanges,
    timestamp: Date.now(),
  };

  try {
    // Use sessionStorage for hot reload state (cleared when browser closes)
    sessionStorage.setItem(HOT_RELOAD_STORAGE_KEY, JSON.stringify(state));
    console.log('[HotReload] State saved');
  } catch (error) {
    console.warn('[HotReload] Failed to save state:', error);
  }
}

/**
 * Load state after hot reload
 */
export function loadHotReloadState(): HotReloadState | null {
  if (!isDevelopment) return null;

  try {
    const stored = sessionStorage.getItem(HOT_RELOAD_STORAGE_KEY);
    if (!stored) return null;

    const state: HotReloadState = JSON.parse(stored);

    // Check if state is recent (within last 30 seconds)
    if (Date.now() - state.timestamp > 30000) {
      clearHotReloadState();
      return null;
    }

    console.log('[HotReload] State loaded');
    return state;
  } catch (error) {
    console.warn('[HotReload] Failed to load state:', error);
    return null;
  }
}

/**
 * Clear hot reload state
 */
export function clearHotReloadState(): void {
  if (!isDevelopment) return;

  try {
    sessionStorage.removeItem(HOT_RELOAD_STORAGE_KEY);
    console.log('[HotReload] State cleared');
  } catch {
    // Ignore errors
  }
}

/**
 * Check if there's pending hot reload state
 */
export function hasHotReloadState(): boolean {
  if (!isDevelopment) return false;

  try {
    const stored = sessionStorage.getItem(HOT_RELOAD_STORAGE_KEY);
    if (!stored) return false;

    const state: HotReloadState = JSON.parse(stored);
    return Date.now() - state.timestamp <= 30000;
  } catch {
    return false;
  }
}

/**
 * Hook into Vite's HMR system
 */
export function setupHotReloadHook(
  getCurrentState: () => {
    documentPath: string | null;
    userState: UserState | null;
    unsavedChanges: UnsavedChanges | null;
  },
  restoreState: (state: HotReloadState) => void
): void {
  if (!isDevelopment) return;

  // Check for pending state on module load
  const pendingState = loadHotReloadState();
  if (pendingState) {
    // Clear state first to prevent loops
    clearHotReloadState();

    // Restore after a short delay to ensure components are mounted
    setTimeout(() => {
      restoreState(pendingState);
    }, 100);
  }

  // Hook into Vite HMR if available
  if (import.meta.hot) {
    import.meta.hot.on('vite:beforeUpdate', () => {
      const state = getCurrentState();
      saveHotReloadState(state.documentPath, state.userState, state.unsavedChanges);
    });

    import.meta.hot.accept(() => {
      console.log('[HotReload] Module updated');
    });
  }
}

/**
 * Create a wrapper for preserving React component state across HMR
 */
export function createHMRSafeStore<T>(
  key: string,
  initialValue: T
): {
  get: () => T;
  set: (value: T) => void;
  clear: () => void;
} {
  const storageKey = `__paperflow_hmr_${key}__`;

  return {
    get: (): T => {
      if (!isDevelopment) return initialValue;

      try {
        const stored = sessionStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : initialValue;
      } catch {
        return initialValue;
      }
    },

    set: (value: T): void => {
      if (!isDevelopment) return;

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // Ignore errors
      }
    },

    clear: (): void => {
      if (!isDevelopment) return;

      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore errors
      }
    },
  };
}

/**
 * Development-only logging for hot reload events
 */
export function logHotReloadEvent(event: string, data?: unknown): void {
  if (!isDevelopment) return;

  const timestamp = new Date().toISOString().split('T')[1]?.split('.')[0] ?? '';
  console.log(`[HotReload ${timestamp}] ${event}`, data || '');
}

/**
 * Error boundary support for development
 * Preserves state even when errors occur
 */
export function handleHotReloadError(error: Error): void {
  if (!isDevelopment) return;

  console.error('[HotReload] Error during reload:', error);

  // Don't clear state on error - let the next successful reload restore it
}

/**
 * Get hot reload statistics (development only)
 */
export function getHotReloadStats(): {
  reloadCount: number;
  lastReloadTime: number | null;
  averageReloadTime: number;
} | null {
  if (!isDevelopment) return null;

  try {
    const statsKey = '__paperflow_hmr_stats__';
    const stored = sessionStorage.getItem(statsKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
