/**
 * System Tray Context Menu
 *
 * Creates and manages the context menu for the system tray icon.
 * Includes common actions and recent files submenu.
 */

import { Menu, MenuItem, BrowserWindow, app } from 'electron';
import { getRecentFiles, openRecentFile } from './recentFiles';
import { IPC_EVENTS } from './ipc/channels';
import type { TrayManager } from './tray';
import type { RecentFile } from './ipc/types';

/**
 * Tray menu configuration
 */
export interface TrayMenuConfig {
  onShowWindow?: () => void;
  onNewWindow?: () => void;
  onOpenFile?: () => void;
  onPreferences?: () => void;
  onAbout?: () => void;
  onQuit?: () => void;
}

/**
 * Recent file display limit
 */
const MAX_RECENT_FILES_IN_TRAY = 5;

/**
 * Create the tray context menu
 */
export async function createTrayMenu(
  trayManager: TrayManager,
  config: TrayMenuConfig = {}
): Promise<Menu> {
  const recentFiles = await getRecentFiles();

  const template: (Electron.MenuItemConstructorOptions | MenuItem)[] = [
    // Show/Hide Window
    {
      label: 'Show PaperFlow',
      click: () => {
        if (config.onShowWindow) {
          config.onShowWindow();
        } else {
          showMainWindow();
        }
      },
    },
    { type: 'separator' },

    // File operations
    {
      label: 'New Window',
      click: () => {
        if (config.onNewWindow) {
          config.onNewWindow();
        } else {
          const windows = BrowserWindow.getAllWindows();
          if (windows[0]) {
            windows[0].webContents.send(IPC_EVENTS.MENU_FILE_NEW);
          }
        }
      },
    },
    {
      label: 'Open File...',
      click: () => {
        if (config.onOpenFile) {
          config.onOpenFile();
        } else {
          showMainWindow();
          const windows = BrowserWindow.getAllWindows();
          if (windows[0]) {
            windows[0].webContents.send(IPC_EVENTS.MENU_FILE_OPEN);
          }
        }
      },
    },
    { type: 'separator' },

    // Recent Files Submenu
    {
      label: 'Recent Files',
      submenu: createRecentFilesSubmenu(recentFiles),
    },
    { type: 'separator' },

    // Preferences
    {
      label: 'Preferences...',
      click: () => {
        if (config.onPreferences) {
          config.onPreferences();
        }
      },
    },
    { type: 'separator' },

    // About (macOS puts this in app menu, but useful for Windows/Linux)
    ...(process.platform !== 'darwin'
      ? [
          {
            label: 'About PaperFlow',
            click: () => {
              if (config.onAbout) {
                config.onAbout();
              }
            },
          },
          { type: 'separator' as const },
        ]
      : []),

    // Quit
    {
      label: 'Quit PaperFlow',
      click: () => {
        if (config.onQuit) {
          config.onQuit();
        } else {
          app.quit();
        }
      },
    },
  ];

  return Menu.buildFromTemplate(template);
}

/**
 * Create recent files submenu
 */
function createRecentFilesSubmenu(
  files: RecentFile[]
): Electron.MenuItemConstructorOptions[] {
  if (files.length === 0) {
    return [
      {
        label: 'No Recent Files',
        enabled: false,
      },
    ];
  }

  const items: Electron.MenuItemConstructorOptions[] = files
    .slice(0, MAX_RECENT_FILES_IN_TRAY)
    .map((file, index) => ({
      label: truncateFileName(file.name, 40),
      sublabel: truncatePath(file.path, 50),
      accelerator: index < 9 ? `CmdOrCtrl+${index + 1}` : undefined,
      click: () => {
        openRecentFile(file.path);
      },
    }));

  // Add "More..." if there are more files
  if (files.length > MAX_RECENT_FILES_IN_TRAY) {
    items.push(
      { type: 'separator' },
      {
        label: `${files.length - MAX_RECENT_FILES_IN_TRAY} more files...`,
        click: () => {
          // Show main window and open recent files panel
          showMainWindow();
        },
      }
    );
  }

  return items;
}

/**
 * Show and focus the main window
 */
function showMainWindow(): void {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows[0];

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
  }
}

/**
 * Truncate a file name for display
 */
function truncateFileName(name: string, maxLength: number): string {
  if (name.length <= maxLength) {
    return name;
  }

  const extension = name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.')) : '';
  const baseName = name.slice(0, name.length - extension.length);

  const truncatedLength = maxLength - extension.length - 3; // 3 for "..."
  return baseName.slice(0, truncatedLength) + '...' + extension;
}

/**
 * Truncate a path for display
 */
function truncatePath(filePath: string, maxLength: number): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  const separator = process.platform === 'win32' ? '\\' : '/';
  const parts = filePath.split(separator);

  if (parts.length <= 3) {
    return '...' + filePath.slice(filePath.length - maxLength + 3);
  }

  // Keep first and last parts, truncate middle
  const first = parts[0] || '';
  const last = parts.slice(-2).join(separator);

  const available = maxLength - first.length - last.length - 5; // 5 for ".../" or "...\\"

  if (available <= 0) {
    return '...' + separator + last;
  }

  return first + separator + '...' + separator + last;
}

/**
 * TrayMenuManager class for managing the tray context menu
 */
export class TrayMenuManager {
  private trayManager: TrayManager;
  private config: TrayMenuConfig;
  private currentMenu: Menu | null = null;

  constructor(trayManager: TrayManager, config: TrayMenuConfig = {}) {
    this.trayManager = trayManager;
    this.config = config;
  }

  /**
   * Update the tray menu configuration
   */
  setConfig(config: Partial<TrayMenuConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Build and get the menu
   */
  async getMenu(): Promise<Menu> {
    this.currentMenu = await createTrayMenu(this.trayManager, this.config);
    return this.currentMenu;
  }

  /**
   * Show the context menu at current pointer position
   */
  async showMenu(): Promise<void> {
    const menu = await this.getMenu();
    const tray = this.trayManager.getTray();
    if (tray) {
      tray.popUpContextMenu(menu);
    }
  }

  /**
   * Refresh the menu (call when recent files change)
   */
  async refreshMenu(): Promise<void> {
    const tray = this.trayManager.getTray();
    if (tray) {
      const menu = await this.getMenu();
      tray.setContextMenu(menu);
    }
  }

  /**
   * Set the menu as the persistent context menu
   */
  async setPersistentMenu(): Promise<void> {
    const tray = this.trayManager.getTray();
    if (tray) {
      const menu = await this.getMenu();
      tray.setContextMenu(menu);
    }
  }
}

/**
 * Create a TrayMenuManager instance
 */
export function createTrayMenuManager(
  trayManager: TrayManager,
  config?: TrayMenuConfig
): TrayMenuManager {
  return new TrayMenuManager(trayManager, config);
}
