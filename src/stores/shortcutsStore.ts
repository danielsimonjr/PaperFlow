/**
 * Shortcuts Store
 *
 * Zustand store for managing keyboard shortcuts in the renderer process.
 * Syncs with the main process for global shortcuts and persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Shortcut definition
 */
export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  defaultAccelerator: string;
  customAccelerator?: string;
  category: 'file' | 'edit' | 'view' | 'document' | 'annotation' | 'navigation' | 'global';
  isGlobal: boolean;
}

/**
 * Shortcut conflict information
 */
export interface ShortcutConflict {
  shortcutId: string;
  conflictWith: ShortcutDefinition;
}

/**
 * Shortcuts store state
 */
interface ShortcutsState {
  // State
  shortcuts: ShortcutDefinition[];
  isLoading: boolean;
  error: string | null;
  pendingChanges: Map<string, string | null>;

  // Actions
  loadShortcuts: () => Promise<void>;
  setShortcut: (shortcutId: string, accelerator: string | null) => Promise<boolean>;
  resetShortcut: (shortcutId: string) => Promise<void>;
  resetAllShortcuts: () => Promise<void>;
  checkConflict: (shortcutId: string, accelerator: string) => ShortcutConflict | null;
  getShortcut: (shortcutId: string) => ShortcutDefinition | undefined;
  getAccelerator: (shortcutId: string) => string | undefined;
  getShortcutsByCategory: (category: ShortcutDefinition['category']) => ShortcutDefinition[];
}

/**
 * Platform detection
 */
const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

/**
 * Default shortcuts (fallback when not running in Electron)
 */
const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // File operations
  {
    id: 'file-new-window',
    name: 'New Window',
    description: 'Open a new window',
    defaultAccelerator: 'CmdOrCtrl+Shift+N',
    category: 'file',
    isGlobal: false,
  },
  {
    id: 'file-open',
    name: 'Open',
    description: 'Open a PDF file',
    defaultAccelerator: 'CmdOrCtrl+O',
    category: 'file',
    isGlobal: false,
  },
  {
    id: 'file-save',
    name: 'Save',
    description: 'Save the current document',
    defaultAccelerator: 'CmdOrCtrl+S',
    category: 'file',
    isGlobal: false,
  },
  {
    id: 'file-save-as',
    name: 'Save As',
    description: 'Save as a new file',
    defaultAccelerator: 'CmdOrCtrl+Shift+S',
    category: 'file',
    isGlobal: false,
  },
  {
    id: 'file-close',
    name: 'Close',
    description: 'Close the current document',
    defaultAccelerator: 'CmdOrCtrl+W',
    category: 'file',
    isGlobal: false,
  },
  {
    id: 'file-print',
    name: 'Print',
    description: 'Print the document',
    defaultAccelerator: 'CmdOrCtrl+P',
    category: 'file',
    isGlobal: false,
  },

  // Edit operations
  {
    id: 'edit-undo',
    name: 'Undo',
    description: 'Undo the last action',
    defaultAccelerator: 'CmdOrCtrl+Z',
    category: 'edit',
    isGlobal: false,
  },
  {
    id: 'edit-redo',
    name: 'Redo',
    description: 'Redo the last undone action',
    defaultAccelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
    category: 'edit',
    isGlobal: false,
  },
  {
    id: 'edit-find',
    name: 'Find',
    description: 'Search in document',
    defaultAccelerator: 'CmdOrCtrl+F',
    category: 'edit',
    isGlobal: false,
  },
  {
    id: 'edit-preferences',
    name: 'Preferences',
    description: 'Open preferences',
    defaultAccelerator: 'CmdOrCtrl+,',
    category: 'edit',
    isGlobal: false,
  },

  // View operations
  {
    id: 'view-zoom-in',
    name: 'Zoom In',
    description: 'Increase zoom level',
    defaultAccelerator: 'CmdOrCtrl+Plus',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-zoom-out',
    name: 'Zoom Out',
    description: 'Decrease zoom level',
    defaultAccelerator: 'CmdOrCtrl+-',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-zoom-reset',
    name: 'Reset Zoom',
    description: 'Reset to 100% zoom',
    defaultAccelerator: 'CmdOrCtrl+0',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    defaultAccelerator: 'CmdOrCtrl+B',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-fullscreen',
    name: 'Full Screen',
    description: 'Toggle full screen mode',
    defaultAccelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
    category: 'view',
    isGlobal: false,
  },

  // Document operations
  {
    id: 'document-go-to-page',
    name: 'Go to Page',
    description: 'Jump to a specific page',
    defaultAccelerator: 'CmdOrCtrl+J',
    category: 'document',
    isGlobal: false,
  },
  {
    id: 'document-previous-page',
    name: 'Previous Page',
    description: 'Go to previous page',
    defaultAccelerator: 'CmdOrCtrl+Up',
    category: 'document',
    isGlobal: false,
  },
  {
    id: 'document-next-page',
    name: 'Next Page',
    description: 'Go to next page',
    defaultAccelerator: 'CmdOrCtrl+Down',
    category: 'document',
    isGlobal: false,
  },

  // Annotation shortcuts
  {
    id: 'annotation-highlight',
    name: 'Highlight',
    description: 'Add highlight annotation',
    defaultAccelerator: 'H',
    category: 'annotation',
    isGlobal: false,
  },
  {
    id: 'annotation-underline',
    name: 'Underline',
    description: 'Add underline annotation',
    defaultAccelerator: 'U',
    category: 'annotation',
    isGlobal: false,
  },
  {
    id: 'annotation-strikethrough',
    name: 'Strikethrough',
    description: 'Add strikethrough annotation',
    defaultAccelerator: 'S',
    category: 'annotation',
    isGlobal: false,
  },
  {
    id: 'annotation-note',
    name: 'Sticky Note',
    description: 'Add sticky note',
    defaultAccelerator: 'N',
    category: 'annotation',
    isGlobal: false,
  },
  {
    id: 'annotation-select',
    name: 'Select Tool',
    description: 'Activate selection tool',
    defaultAccelerator: 'V',
    category: 'annotation',
    isGlobal: false,
  },

  // Help
  {
    id: 'help-shortcuts',
    name: 'Keyboard Shortcuts',
    description: 'Show keyboard shortcuts dialog',
    defaultAccelerator: 'CmdOrCtrl+/',
    category: 'navigation',
    isGlobal: false,
  },
];

/**
 * Normalize accelerator for comparison
 */
function normalizeAccelerator(accelerator: string): string {
  return accelerator
    .toLowerCase()
    .replace(/cmdorctrl/g, isMac ? 'cmd' : 'ctrl')
    .split('+')
    .sort()
    .join('+');
}

/**
 * Format accelerator for display
 */
export function formatAccelerator(accelerator: string): string {
  if (isMac) {
    return accelerator
      .replace(/CmdOrCtrl/g, '\u2318')
      .replace(/Cmd/g, '\u2318')
      .replace(/Ctrl/g, '\u2303')
      .replace(/Alt/g, '\u2325')
      .replace(/Shift/g, '\u21E7')
      .replace(/\+/g, '');
  }
  return accelerator.replace(/CmdOrCtrl/g, 'Ctrl');
}

/**
 * Create the shortcuts store
 */
export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,
      isLoading: false,
      error: null,
      pendingChanges: new Map(),

      loadShortcuts: async () => {
        set({ isLoading: true, error: null });

        try {
          // If running in Electron, fetch from main process
          if (window.electron) {
            const shortcuts = await (window.electron as unknown as {
              invoke: (channel: string) => Promise<ShortcutDefinition[]>;
            }).invoke('shortcuts-get-custom');
            set({ shortcuts, isLoading: false });
          } else {
            // Use defaults in browser
            set({ shortcuts: DEFAULT_SHORTCUTS, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load shortcuts',
            isLoading: false,
          });
        }
      },

      setShortcut: async (shortcutId: string, accelerator: string | null) => {
        // Check for conflicts
        if (accelerator) {
          const conflict = get().checkConflict(shortcutId, accelerator);
          if (conflict) {
            set({ error: `Shortcut conflicts with "${conflict.conflictWith.name}"` });
            return false;
          }
        }

        set({ error: null });

        // Update locally
        const shortcuts = get().shortcuts.map((s) =>
          s.id === shortcutId
            ? { ...s, customAccelerator: accelerator || undefined }
            : s
        );
        set({ shortcuts });

        // Sync with main process if in Electron
        if (window.electron) {
          try {
            const result = await (window.electron as unknown as {
              invoke: (channel: string, ...args: unknown[]) => Promise<boolean>;
            }).invoke('shortcuts-set-custom', shortcutId, accelerator);
            return result;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to save shortcut',
            });
            return false;
          }
        }

        return true;
      },

      resetShortcut: async (shortcutId: string) => {
        await get().setShortcut(shortcutId, null);
      },

      resetAllShortcuts: async () => {
        set({ isLoading: true, error: null });

        try {
          if (window.electron) {
            const shortcuts = await (window.electron as unknown as {
              invoke: (channel: string) => Promise<ShortcutDefinition[]>;
            }).invoke('shortcuts-reset-defaults');
            set({ shortcuts, isLoading: false });
          } else {
            set({
              shortcuts: DEFAULT_SHORTCUTS.map((s) => ({
                ...s,
                customAccelerator: undefined,
              })),
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reset shortcuts',
            isLoading: false,
          });
        }
      },

      checkConflict: (shortcutId: string, accelerator: string) => {
        const normalized = normalizeAccelerator(accelerator);
        const shortcuts = get().shortcuts;

        for (const shortcut of shortcuts) {
          if (shortcut.id === shortcutId) continue;

          const currentAccelerator =
            shortcut.customAccelerator || shortcut.defaultAccelerator;
          if (normalizeAccelerator(currentAccelerator) === normalized) {
            return {
              shortcutId,
              conflictWith: shortcut,
            };
          }
        }

        return null;
      },

      getShortcut: (shortcutId: string) => {
        return get().shortcuts.find((s) => s.id === shortcutId);
      },

      getAccelerator: (shortcutId: string) => {
        const shortcut = get().shortcuts.find((s) => s.id === shortcutId);
        if (!shortcut) return undefined;
        return shortcut.customAccelerator || shortcut.defaultAccelerator;
      },

      getShortcutsByCategory: (category: ShortcutDefinition['category']) => {
        return get().shortcuts.filter((s) => s.category === category);
      },
    }),
    {
      name: 'paperflow-shortcuts',
      partialize: (state) => ({
        // Only persist custom accelerators
        shortcuts: state.shortcuts.map((s) => ({
          id: s.id,
          customAccelerator: s.customAccelerator,
        })),
      }),
    }
  )
);

// Utility functions are exported directly above where they are defined
