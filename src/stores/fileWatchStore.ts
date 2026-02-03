/**
 * File Watch Store
 *
 * Zustand store to track watched files, their status, and pending reload operations.
 * Syncs with the Electron watcher service.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isElectron } from '@lib/electron/platform';
import type { FileWatcherEvent, FileStats } from '@/types/electronTypes';

export type FileWatchStatus = 'watching' | 'changed' | 'deleted' | 'locked' | 'error';

export type ReloadAction = 'reload' | 'ignore' | 'compare' | 'pending';

export interface WatchedFile {
  path: string;
  status: FileWatchStatus;
  lastModified: number;
  lastChecked: number;
  changeCount: number;
  isLocked: boolean;
  error?: string;
  stats?: FileStats;
  pendingAction: ReloadAction;
}

export interface ExternalChange {
  id: string;
  path: string;
  timestamp: number;
  type: 'change' | 'add' | 'unlink';
  stats?: FileStats;
  dismissed: boolean;
}

export interface FileWatchSettings {
  enabled: boolean;
  autoReload: boolean;
  showNotifications: boolean;
  notificationStyle: 'banner' | 'dialog' | 'toast';
  defaultAction: ReloadAction;
  checkInterval: number; // ms
}

interface FileWatchState {
  // State
  watchedFiles: Map<string, WatchedFile>;
  externalChanges: ExternalChange[];
  settings: FileWatchSettings;
  isInitialized: boolean;
  isEnabled: boolean;

  // Actions
  initialize: () => Promise<void>;
  watchFile: (path: string) => Promise<boolean>;
  unwatchFile: (path: string) => Promise<boolean>;
  unwatchAll: () => Promise<void>;
  handleFileChange: (event: FileWatcherEvent) => void;
  setFileStatus: (path: string, status: FileWatchStatus, error?: string) => void;
  setPendingAction: (path: string, action: ReloadAction) => void;
  dismissChange: (changeId: string) => void;
  dismissAllChanges: () => void;
  clearExternalChanges: (path?: string) => void;
  updateSettings: (settings: Partial<FileWatchSettings>) => void;
  setEnabled: (enabled: boolean) => void;
  getWatchedFile: (path: string) => WatchedFile | undefined;
  getPendingChanges: () => ExternalChange[];
  checkFileForChanges: (path: string) => Promise<boolean>;
}

const DEFAULT_SETTINGS: FileWatchSettings = {
  enabled: true,
  autoReload: false,
  showNotifications: true,
  notificationStyle: 'banner',
  defaultAction: 'pending',
  checkInterval: 5000,
};

// Generate unique ID for changes
let changeIdCounter = 0;
const generateChangeId = () => `change-${Date.now()}-${++changeIdCounter}`;

export const useFileWatchStore = create<FileWatchState>()(
  persist(
    (set, get) => ({
      watchedFiles: new Map(),
      externalChanges: [],
      settings: { ...DEFAULT_SETTINGS },
      isInitialized: false,
      isEnabled: true,

      initialize: async () => {
        if (!isElectron() || !window.electron) {
          return;
        }

        // Subscribe to file change events
        const unsubscribe = window.electron.onFileChanged((event: FileWatcherEvent) => {
          get().handleFileChange(event);
        });

        // Store unsubscribe function for cleanup
        (window as unknown as { __fileWatchUnsubscribe?: () => void }).__fileWatchUnsubscribe = unsubscribe;

        set({ isInitialized: true });
        console.log('[FileWatchStore] Initialized');
      },

      watchFile: async (path: string) => {
        if (!isElectron() || !window.electron) {
          return false;
        }

        const { settings, isEnabled } = get();
        if (!settings.enabled || !isEnabled) {
          return false;
        }

        try {
          const success = await window.electron.watchFile(path);
          if (success) {
            const watchedFile: WatchedFile = {
              path,
              status: 'watching',
              lastModified: Date.now(),
              lastChecked: Date.now(),
              changeCount: 0,
              isLocked: false,
              pendingAction: 'pending',
            };

            set((state) => {
              const newMap = new Map(state.watchedFiles);
              newMap.set(path, watchedFile);
              return { watchedFiles: newMap };
            });

            console.log('[FileWatchStore] Started watching:', path);
          }
          return success;
        } catch (error) {
          console.error('[FileWatchStore] Failed to watch file:', error);
          return false;
        }
      },

      unwatchFile: async (path: string) => {
        if (!isElectron() || !window.electron) {
          return false;
        }

        try {
          const success = await window.electron.unwatchFile(path);
          if (success) {
            set((state) => {
              const newMap = new Map(state.watchedFiles);
              newMap.delete(path);
              return {
                watchedFiles: newMap,
                externalChanges: state.externalChanges.filter((c) => c.path !== path),
              };
            });

            console.log('[FileWatchStore] Stopped watching:', path);
          }
          return success;
        } catch (error) {
          console.error('[FileWatchStore] Failed to unwatch file:', error);
          return false;
        }
      },

      unwatchAll: async () => {
        if (!isElectron() || !window.electron) {
          return;
        }

        try {
          await window.electron.unwatchAll();
          set({
            watchedFiles: new Map(),
            externalChanges: [],
          });
          console.log('[FileWatchStore] Stopped all file watching');
        } catch (error) {
          console.error('[FileWatchStore] Failed to unwatch all:', error);
        }
      },

      handleFileChange: (event: FileWatcherEvent) => {
        const { settings, watchedFiles } = get();

        // Find or create watched file entry
        let watchedFile = watchedFiles.get(event.path);
        if (!watchedFile) {
          // File might be in a watched folder
          watchedFile = {
            path: event.path,
            status: 'watching',
            lastModified: Date.now(),
            lastChecked: Date.now(),
            changeCount: 0,
            isLocked: false,
            pendingAction: settings.defaultAction,
          };
        }

        const newStatus: FileWatchStatus =
          event.type === 'unlink'
            ? 'deleted'
            : event.type === 'error'
            ? 'error'
            : 'changed';

        const updatedFile: WatchedFile = {
          ...watchedFile,
          status: newStatus,
          lastModified: event.stats?.modified ?? Date.now(),
          lastChecked: Date.now(),
          changeCount: watchedFile.changeCount + 1,
          stats: event.stats,
          error: event.error,
          pendingAction: settings.autoReload ? 'reload' : settings.defaultAction,
        };

        // Create external change record
        const change: ExternalChange = {
          id: generateChangeId(),
          path: event.path,
          timestamp: Date.now(),
          type: event.type as 'change' | 'add' | 'unlink',
          stats: event.stats,
          dismissed: false,
        };

        set((state) => {
          const newMap = new Map(state.watchedFiles);
          newMap.set(event.path, updatedFile);
          return {
            watchedFiles: newMap,
            externalChanges: [...state.externalChanges, change].slice(-100), // Keep last 100 changes
          };
        });

        console.log('[FileWatchStore] File change detected:', event.path, event.type);
      },

      setFileStatus: (path: string, status: FileWatchStatus, error?: string) => {
        set((state) => {
          const watchedFile = state.watchedFiles.get(path);
          if (!watchedFile) return state;

          const newMap = new Map(state.watchedFiles);
          newMap.set(path, {
            ...watchedFile,
            status,
            error,
            lastChecked: Date.now(),
          });
          return { watchedFiles: newMap };
        });
      },

      setPendingAction: (path: string, action: ReloadAction) => {
        set((state) => {
          const watchedFile = state.watchedFiles.get(path);
          if (!watchedFile) return state;

          const newMap = new Map(state.watchedFiles);
          newMap.set(path, {
            ...watchedFile,
            pendingAction: action,
          });
          return { watchedFiles: newMap };
        });
      },

      dismissChange: (changeId: string) => {
        set((state) => ({
          externalChanges: state.externalChanges.map((c) =>
            c.id === changeId ? { ...c, dismissed: true } : c
          ),
        }));
      },

      dismissAllChanges: () => {
        set((state) => ({
          externalChanges: state.externalChanges.map((c) => ({ ...c, dismissed: true })),
        }));
      },

      clearExternalChanges: (path?: string) => {
        set((state) => ({
          externalChanges: path
            ? state.externalChanges.filter((c) => c.path !== path)
            : [],
        }));
      },

      updateSettings: (newSettings: Partial<FileWatchSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
      },

      getWatchedFile: (path: string) => {
        return get().watchedFiles.get(path);
      },

      getPendingChanges: () => {
        return get().externalChanges.filter((c) => !c.dismissed);
      },

      checkFileForChanges: async (path: string) => {
        if (!isElectron() || !window.electron) {
          return false;
        }

        try {
          const stats = await window.electron.getFileStats(path);
          if (!stats) return false;

          const watchedFile = get().watchedFiles.get(path);
          if (!watchedFile) return false;

          const hasChanged = stats.modified !== watchedFile.lastModified;
          if (hasChanged) {
            get().handleFileChange({
              type: 'change',
              path,
              stats,
            });
          }

          return hasChanged;
        } catch (error) {
          console.error('[FileWatchStore] Failed to check file:', error);
          return false;
        }
      },
    }),
    {
      name: 'paperflow-file-watch',
      partialize: (state) => ({
        settings: state.settings,
        isEnabled: state.isEnabled,
      }),
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

/**
 * Initialize file watch store on app startup
 */
export async function initializeFileWatch(): Promise<void> {
  const { initialize } = useFileWatchStore.getState();
  await initialize();
}

/**
 * Cleanup file watch store
 */
export function cleanupFileWatch(): void {
  const unsubscribe = (window as unknown as { __fileWatchUnsubscribe?: () => void }).__fileWatchUnsubscribe;
  if (unsubscribe) {
    unsubscribe();
  }
}
