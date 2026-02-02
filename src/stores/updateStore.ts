/**
 * Update Store
 *
 * Zustand store for managing auto-update state in the renderer process.
 * Syncs with the main process via IPC.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UpdateState,
  UpdateSettings,
  UpdateChannel,
  UpdateCheckFrequency,
} from '../../electron/ipc/types';

/**
 * Update store state interface
 */
interface UpdateStoreState {
  // Current update state (synced from main process)
  state: UpdateState;

  // Update settings (persisted locally)
  settings: UpdateSettings;

  // UI state
  isNotificationVisible: boolean;
  isProgressDialogVisible: boolean;
  isReleaseNotesVisible: boolean;
  isCheckingManually: boolean;

  // Actions
  setState: (newState: Partial<UpdateState>) => void;
  setSettings: (newSettings: Partial<UpdateSettings>) => void;
  setChannel: (channel: UpdateChannel) => void;
  setCheckFrequency: (frequency: UpdateCheckFrequency) => void;
  setAutoUpdate: (enabled: boolean) => void;

  // UI actions
  showNotification: () => void;
  hideNotification: () => void;
  showProgressDialog: () => void;
  hideProgressDialog: () => void;
  showReleaseNotes: () => void;
  hideReleaseNotes: () => void;
  setCheckingManually: (checking: boolean) => void;

  // Async actions (call IPC)
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  installAndRestart: () => void;
  installLater: () => Promise<void>;
  syncWithMain: () => Promise<void>;
}

const defaultState: UpdateState = {
  status: 'idle',
  currentVersion: '1.0.0',
};

const defaultSettings: UpdateSettings = {
  autoUpdate: true,
  channel: 'stable',
  checkFrequency: 'daily',
  allowPrerelease: false,
  allowDowngrade: false,
};

export const useUpdateStore = create<UpdateStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      state: defaultState,
      settings: defaultSettings,

      // UI state
      isNotificationVisible: false,
      isProgressDialogVisible: false,
      isReleaseNotesVisible: false,
      isCheckingManually: false,

      // State actions
      setState: (newState) => {
        set((state) => ({
          state: { ...state.state, ...newState },
        }));
      },

      setSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));

        // Sync with main process
        if (window.electron) {
          window.electron.setUpdateSettings(newSettings);
        }
      },

      setChannel: (channel) => {
        const { setSettings } = get();
        setSettings({ channel, allowPrerelease: channel !== 'stable' });
      },

      setCheckFrequency: (frequency) => {
        const { setSettings } = get();
        setSettings({ checkFrequency: frequency });
      },

      setAutoUpdate: (enabled) => {
        const { setSettings } = get();
        setSettings({ autoUpdate: enabled });
      },

      // UI actions
      showNotification: () => set({ isNotificationVisible: true }),
      hideNotification: () => set({ isNotificationVisible: false }),
      showProgressDialog: () => set({ isProgressDialogVisible: true }),
      hideProgressDialog: () => set({ isProgressDialogVisible: false }),
      showReleaseNotes: () => set({ isReleaseNotesVisible: true }),
      hideReleaseNotes: () => set({ isReleaseNotesVisible: false }),
      setCheckingManually: (checking) => set({ isCheckingManually: checking }),

      // Async actions
      checkForUpdates: async () => {
        if (!window.electron) return;

        set({ isCheckingManually: true });
        try {
          const result = await window.electron.checkForUpdates();
          if (!result.success) {
            set((state) => ({
              state: { ...state.state, status: 'error', error: result.error },
            }));
          }
        } catch (error) {
          set((state) => ({
            state: {
              ...state.state,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }));
        } finally {
          set({ isCheckingManually: false });
        }
      },

      downloadUpdate: async () => {
        if (!window.electron) return;

        set({ isProgressDialogVisible: true });
        try {
          const result = await window.electron.downloadUpdate();
          if (!result.success) {
            set((state) => ({
              state: { ...state.state, status: 'error', error: result.error },
            }));
          }
        } catch (error) {
          set((state) => ({
            state: {
              ...state.state,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }));
        }
      },

      cancelDownload: async () => {
        if (!window.electron) return;

        try {
          await window.electron.cancelDownload();
          set({ isProgressDialogVisible: false });
        } catch (error) {
          console.error('Failed to cancel download:', error);
        }
      },

      installAndRestart: () => {
        if (!window.electron) return;
        window.electron.installAndRestart();
      },

      installLater: async () => {
        if (!window.electron) return;

        await window.electron.installLater();
        set({
          isProgressDialogVisible: false,
          isNotificationVisible: false,
        });
      },

      syncWithMain: async () => {
        if (!window.electron) return;

        try {
          const [state, settings] = await Promise.all([
            window.electron.getUpdateState(),
            window.electron.getUpdateSettings(),
          ]);

          set({ state, settings });
        } catch (error) {
          console.error('Failed to sync update state:', error);
        }
      },
    }),
    {
      name: 'paperflow-update-settings',
      partialize: (state: UpdateStoreState) => ({
        settings: state.settings,
      }),
    }
  )
);

/**
 * Initialize update store and set up event listeners
 */
export function initializeUpdateStore(): () => void {
  const { syncWithMain, setState, showNotification } = useUpdateStore.getState();

  // Initial sync
  syncWithMain();

  // Set up event listeners
  const unsubscribers: (() => void)[] = [];

  if (window.electron) {
    unsubscribers.push(
      window.electron.onUpdateStateChanged((newState) => {
        setState(newState);

        // Show notification when update is available
        if (newState.status === 'available') {
          showNotification();
        }
      })
    );

    unsubscribers.push(
      window.electron.onUpdateAvailable((version) => {
        setState({ status: 'available', availableVersion: version });
        showNotification();
      })
    );

    unsubscribers.push(
      window.electron.onUpdateDownloaded((version) => {
        setState({ status: 'downloaded', availableVersion: version });
        showNotification();
      })
    );

    unsubscribers.push(
      window.electron.onUpdateError((error) => {
        setState({ status: 'error', error });
      })
    );
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * Hook to format download progress
 */
export function formatDownloadProgress(
  progress: UpdateState['downloadProgress']
): {
  percent: string;
  speed: string;
  transferred: string;
  total: string;
} {
  if (!progress) {
    return {
      percent: '0%',
      speed: '0 B/s',
      transferred: '0 B',
      total: '0 B',
    };
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return {
    percent: `${progress.percent.toFixed(1)}%`,
    speed: `${formatBytes(progress.bytesPerSecond)}/s`,
    transferred: formatBytes(progress.transferred),
    total: formatBytes(progress.total),
  };
}
