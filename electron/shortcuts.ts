/**
 * Global Keyboard Shortcuts Module
 *
 * Manages global keyboard shortcuts that work even when the app is not focused.
 * Also provides shortcut customization and conflict detection.
 */

import { globalShortcut, BrowserWindow, app, IpcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC_CHANNELS, IPC_EVENTS } from './ipc/channels';

/**
 * Platform detection
 */
const isMac = process.platform === 'darwin';

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
 * Shortcut configuration file path
 */
const SHORTCUTS_CONFIG_PATH = path.join(app.getPath('userData'), 'shortcuts.json');

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
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
    id: 'edit-find-next',
    name: 'Find Next',
    description: 'Find next occurrence',
    defaultAccelerator: 'CmdOrCtrl+G',
    category: 'edit',
    isGlobal: false,
  },
  {
    id: 'edit-find-previous',
    name: 'Find Previous',
    description: 'Find previous occurrence',
    defaultAccelerator: 'CmdOrCtrl+Shift+G',
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
    id: 'view-fit-width',
    name: 'Fit to Width',
    description: 'Fit page to window width',
    defaultAccelerator: 'CmdOrCtrl+1',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-fit-page',
    name: 'Fit to Page',
    description: 'Fit entire page in window',
    defaultAccelerator: 'CmdOrCtrl+2',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-single-page',
    name: 'Single Page View',
    description: 'View one page at a time',
    defaultAccelerator: 'CmdOrCtrl+Alt+1',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-continuous',
    name: 'Continuous View',
    description: 'View pages in continuous scroll',
    defaultAccelerator: 'CmdOrCtrl+Alt+2',
    category: 'view',
    isGlobal: false,
  },
  {
    id: 'view-spread',
    name: 'Spread View',
    description: 'View two pages side by side',
    defaultAccelerator: 'CmdOrCtrl+Alt+3',
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
    id: 'view-toggle-toolbar',
    name: 'Toggle Toolbar',
    description: 'Show or hide the toolbar',
    defaultAccelerator: 'CmdOrCtrl+Shift+T',
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
    id: 'document-first-page',
    name: 'First Page',
    description: 'Go to first page',
    defaultAccelerator: 'CmdOrCtrl+Home',
    category: 'document',
    isGlobal: false,
  },
  {
    id: 'document-last-page',
    name: 'Last Page',
    description: 'Go to last page',
    defaultAccelerator: 'CmdOrCtrl+End',
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
  {
    id: 'document-rotate-left',
    name: 'Rotate Left',
    description: 'Rotate page counter-clockwise',
    defaultAccelerator: 'CmdOrCtrl+Shift+L',
    category: 'document',
    isGlobal: false,
  },
  {
    id: 'document-rotate-right',
    name: 'Rotate Right',
    description: 'Rotate page clockwise',
    defaultAccelerator: 'CmdOrCtrl+Shift+R',
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
    id: 'annotation-drawing',
    name: 'Drawing Tool',
    description: 'Activate drawing tool',
    defaultAccelerator: 'D',
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

  // Navigation shortcuts
  {
    id: 'nav-page-up',
    name: 'Page Up',
    description: 'Scroll up one page',
    defaultAccelerator: 'PageUp',
    category: 'navigation',
    isGlobal: false,
  },
  {
    id: 'nav-page-down',
    name: 'Page Down',
    description: 'Scroll down one page',
    defaultAccelerator: 'PageDown',
    category: 'navigation',
    isGlobal: false,
  },

  // Global shortcuts (work when app is in background)
  {
    id: 'global-quick-open',
    name: 'Quick Open',
    description: 'Bring PaperFlow to front and open file dialog',
    defaultAccelerator: 'CmdOrCtrl+Shift+P',
    category: 'global',
    isGlobal: true,
  },
  {
    id: 'global-bring-to-front',
    name: 'Bring to Front',
    description: 'Bring PaperFlow to front',
    defaultAccelerator: 'CmdOrCtrl+Shift+F',
    category: 'global',
    isGlobal: true,
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
 * Currently registered global shortcuts
 */
const registeredGlobalShortcuts: Map<string, string> = new Map();

/**
 * Custom shortcut overrides
 */
let customShortcuts: Map<string, string> = new Map();

/**
 * Load custom shortcuts from file
 */
export async function loadCustomShortcuts(): Promise<void> {
  try {
    const data = await fs.readFile(SHORTCUTS_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(data) as Record<string, string>;
    customShortcuts = new Map(Object.entries(parsed));
  } catch {
    // File doesn't exist or is invalid, use defaults
    customShortcuts = new Map();
  }
}

/**
 * Save custom shortcuts to file
 */
export async function saveCustomShortcuts(): Promise<void> {
  const data = Object.fromEntries(customShortcuts);
  await fs.writeFile(SHORTCUTS_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get the accelerator for a shortcut (custom or default)
 */
export function getAccelerator(shortcutId: string): string | undefined {
  const definition = DEFAULT_SHORTCUTS.find((s) => s.id === shortcutId);
  if (!definition) return undefined;

  return customShortcuts.get(shortcutId) || definition.defaultAccelerator;
}

/**
 * Set a custom accelerator for a shortcut
 */
export async function setCustomAccelerator(
  shortcutId: string,
  accelerator: string | null
): Promise<boolean> {
  const definition = DEFAULT_SHORTCUTS.find((s) => s.id === shortcutId);
  if (!definition) return false;

  if (accelerator === null) {
    // Reset to default
    customShortcuts.delete(shortcutId);
  } else {
    // Check for conflicts
    const conflict = checkAcceleratorConflict(shortcutId, accelerator);
    if (conflict) {
      return false;
    }
    customShortcuts.set(shortcutId, accelerator);
  }

  await saveCustomShortcuts();

  // Re-register global shortcuts if needed
  if (definition.isGlobal) {
    await registerGlobalShortcuts();
  }

  return true;
}

/**
 * Check if an accelerator conflicts with another shortcut
 */
export function checkAcceleratorConflict(
  shortcutId: string,
  accelerator: string
): ShortcutDefinition | null {
  const normalizedAccelerator = normalizeAccelerator(accelerator);

  for (const definition of DEFAULT_SHORTCUTS) {
    if (definition.id === shortcutId) continue;

    const currentAccelerator = customShortcuts.get(definition.id) || definition.defaultAccelerator;
    if (normalizeAccelerator(currentAccelerator) === normalizedAccelerator) {
      return definition;
    }
  }

  return null;
}

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
 * Get all shortcuts with their current accelerators
 */
export function getAllShortcuts(): ShortcutDefinition[] {
  return DEFAULT_SHORTCUTS.map((def) => ({
    ...def,
    customAccelerator: customShortcuts.get(def.id),
  }));
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  category: ShortcutDefinition['category']
): ShortcutDefinition[] {
  return getAllShortcuts().filter((s) => s.category === category);
}

/**
 * Reset all shortcuts to defaults
 */
export async function resetAllShortcuts(): Promise<void> {
  customShortcuts.clear();
  await saveCustomShortcuts();
  await registerGlobalShortcuts();
}

/**
 * Register global shortcuts
 */
export async function registerGlobalShortcuts(): Promise<void> {
  // Unregister existing global shortcuts
  unregisterAllGlobalShortcuts();

  // Register global shortcuts
  const globalShortcutDefinitions = DEFAULT_SHORTCUTS.filter((s) => s.isGlobal);

  for (const definition of globalShortcutDefinitions) {
    const accelerator = getAccelerator(definition.id);
    if (!accelerator) continue;

    // Convert CmdOrCtrl to platform-specific
    const platformAccelerator = accelerator.replace(
      /CmdOrCtrl/g,
      isMac ? 'Command' : 'Control'
    );

    try {
      const success = globalShortcut.register(platformAccelerator, () => {
        handleGlobalShortcut(definition.id);
      });

      if (success) {
        registeredGlobalShortcuts.set(definition.id, platformAccelerator);
        console.log(`[Shortcuts] Registered global shortcut: ${definition.id} (${platformAccelerator})`);
      } else {
        console.warn(
          `[Shortcuts] Failed to register global shortcut: ${definition.id} (${platformAccelerator}) - may be in use by another application`
        );
      }
    } catch (error) {
      console.error(`[Shortcuts] Error registering global shortcut: ${definition.id}`, error);
    }
  }
}

/**
 * Unregister all global shortcuts
 */
export function unregisterAllGlobalShortcuts(): void {
  for (const [id, accelerator] of registeredGlobalShortcuts) {
    try {
      globalShortcut.unregister(accelerator);
      console.log(`[Shortcuts] Unregistered global shortcut: ${id}`);
    } catch (error) {
      console.error(`[Shortcuts] Error unregistering global shortcut: ${id}`, error);
    }
  }
  registeredGlobalShortcuts.clear();
}

/**
 * Handle global shortcut activation
 */
function handleGlobalShortcut(shortcutId: string): void {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows[0];

  switch (shortcutId) {
    case 'global-quick-open':
      // Bring window to front and trigger file open
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.webContents.send(IPC_EVENTS.MENU_FILE_OPEN);
      }
      break;

    case 'global-bring-to-front':
      // Just bring window to front
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
      break;

    default:
      console.log(`[Shortcuts] Unknown global shortcut: ${shortcutId}`);
  }
}

/**
 * Initialize shortcuts system
 */
export async function initializeShortcuts(): Promise<void> {
  // Load custom shortcuts
  await loadCustomShortcuts();

  // Register global shortcuts
  await registerGlobalShortcuts();

  // Clean up on app quit
  app.on('will-quit', () => {
    unregisterAllGlobalShortcuts();
  });
}

/**
 * Set up IPC handlers for shortcuts
 */
export function setupShortcutHandlers(ipc: IpcMain): void {
  // Get all shortcuts
  ipc.handle(IPC_CHANNELS.SHORTCUTS_GET_CUSTOM, () => {
    return getAllShortcuts();
  });

  // Set custom shortcut
  ipc.handle(
    IPC_CHANNELS.SHORTCUTS_SET_CUSTOM,
    async (_event, shortcutId: string, accelerator: string | null) => {
      return setCustomAccelerator(shortcutId, accelerator);
    }
  );

  // Reset to defaults
  ipc.handle(IPC_CHANNELS.SHORTCUTS_RESET_DEFAULTS, async () => {
    await resetAllShortcuts();
    return getAllShortcuts();
  });

  // Register a global shortcut
  ipc.handle(
    IPC_CHANNELS.SHORTCUTS_REGISTER_GLOBAL,
    async (_event, shortcutId: string, accelerator: string) => {
      const definition = DEFAULT_SHORTCUTS.find((s) => s.id === shortcutId);
      if (!definition || !definition.isGlobal) return false;

      return setCustomAccelerator(shortcutId, accelerator);
    }
  );

  // Unregister a global shortcut
  ipc.handle(IPC_CHANNELS.SHORTCUTS_UNREGISTER_GLOBAL, async (_event, shortcutId: string) => {
    const definition = DEFAULT_SHORTCUTS.find((s) => s.id === shortcutId);
    if (!definition || !definition.isGlobal) return false;

    // We don't actually unregister, just reset to default
    return setCustomAccelerator(shortcutId, null);
  });
}

/**
 * Check if a global shortcut is registered
 */
export function isGlobalShortcutRegistered(accelerator: string): boolean {
  const platformAccelerator = accelerator.replace(
    /CmdOrCtrl/g,
    isMac ? 'Command' : 'Control'
  );
  return globalShortcut.isRegistered(platformAccelerator);
}

