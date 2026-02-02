/**
 * Recent Files Store (Electron)
 *
 * Zustand store for managing recent files in the Electron desktop app.
 * Syncs with the native recent files list maintained by the main process.
 */

import { create } from 'zustand';
import { isElectron } from '@lib/electron/platform';
import type { RecentFile } from '@/types/electronTypes';

interface RecentFilesState {
  // State
  recentFiles: RecentFile[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRecentFiles: () => Promise<void>;
  addRecentFile: (filePath: string) => Promise<void>;
  removeRecentFile: (filePath: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;
  openRecentFile: (file: RecentFile) => Promise<void>;
}

export const useRecentFilesStore = create<RecentFilesState>((set, get) => ({
  recentFiles: [],
  isLoading: false,
  error: null,

  loadRecentFiles: async () => {
    if (!isElectron() || !window.electron) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const files = await window.electron.getRecentFiles();
      set({ recentFiles: files, isLoading: false });
    } catch (error) {
      console.error('Failed to load recent files:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load recent files',
        isLoading: false,
      });
    }
  },

  addRecentFile: async (filePath: string) => {
    if (!isElectron() || !window.electron) {
      return;
    }

    try {
      await window.electron.addRecentFile(filePath);
      // Reload to get updated list
      await get().loadRecentFiles();
    } catch (error) {
      console.error('Failed to add recent file:', error);
    }
  },

  removeRecentFile: async (filePath: string) => {
    if (!isElectron() || !window.electron) {
      return;
    }

    try {
      await window.electron.removeRecentFile(filePath);
      // Update local state immediately
      set((state) => ({
        recentFiles: state.recentFiles.filter((f) => f.path !== filePath),
      }));
    } catch (error) {
      console.error('Failed to remove recent file:', error);
    }
  },

  clearRecentFiles: async () => {
    if (!isElectron() || !window.electron) {
      return;
    }

    try {
      await window.electron.clearRecentFiles();
      set({ recentFiles: [] });
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  },

  openRecentFile: async (file: RecentFile) => {
    if (!isElectron() || !window.electron) {
      return;
    }

    try {
      // Check if file still exists
      const exists = await window.electron.fileExists(file.path);
      if (!exists) {
        // Remove from recent files if it no longer exists
        await get().removeRecentFile(file.path);
        throw new Error('File no longer exists');
      }

      // Read file content
      const result = await window.electron.readFile(file.path);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to read file');
      }

      // The document store will be used to load the file
      // This is handled by the component that calls openRecentFile
    } catch (error) {
      console.error('Failed to open recent file:', error);
      throw error;
    }
  },
}));

/**
 * Initialize recent files on app startup
 */
export async function initializeRecentFiles(): Promise<void> {
  const { loadRecentFiles } = useRecentFilesStore.getState();
  await loadRecentFiles();
}

/**
 * Subscribe to file opened events from Electron
 */
export function subscribeToFileOpenedEvents(): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  const { addRecentFile } = useRecentFilesStore.getState();

  return window.electron.onFileOpened((filePath: string) => {
    addRecentFile(filePath);
  });
}
