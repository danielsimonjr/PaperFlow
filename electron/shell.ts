/**
 * Shell Integration Module
 *
 * Provides shell integration features for the Electron app.
 * Includes Show in Folder, Open with Default App, Open URL, etc.
 */

import { shell, app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';

/**
 * Shell operation result
 */
export interface ShellResult {
  success: boolean;
  error?: string;
}

/**
 * Show a file in the system file manager
 *
 * @param filePath - Path to the file to show
 */
export function showItemInFolder(filePath: string): void {
  shell.showItemInFolder(filePath);
}

/**
 * Open a file with the system default application
 *
 * @param filePath - Path to the file to open
 * @returns Error message if failed, empty string if successful
 */
export async function openWithDefaultApp(filePath: string): Promise<string> {
  return shell.openPath(filePath);
}

/**
 * Open a URL in the default browser
 *
 * @param url - URL to open
 */
export async function openExternalUrl(url: string): Promise<void> {
  // Validate URL protocol
  const parsed = new URL(url);
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`Protocol ${parsed.protocol} is not allowed`);
  }

  await shell.openExternal(url);
}

/**
 * Move a file to the system trash/recycle bin
 *
 * @param filePath - Path to the file to trash
 */
export async function trashItem(filePath: string): Promise<void> {
  await shell.trashItem(filePath);
}

/**
 * Play the system beep sound
 */
export function beep(): void {
  shell.beep();
}

/**
 * Get the path to a special folder
 *
 * @param name - Name of the special folder
 */
export function getSpecialFolderPath(
  name:
    | 'home'
    | 'appData'
    | 'userData'
    | 'sessionData'
    | 'temp'
    | 'exe'
    | 'module'
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
    | 'recent'
    | 'logs'
    | 'crashDumps'
): string {
  return app.getPath(name);
}

/**
 * Read shortcut/alias file (Windows .lnk, macOS .alias)
 * Note: This is primarily useful on Windows
 *
 * @param shortcutPath - Path to the shortcut file
 */
export function readShortcutLink(shortcutPath: string): Electron.ShortcutDetails | null {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    return shell.readShortcutLink(shortcutPath);
  } catch {
    return null;
  }
}

/**
 * Create a shortcut (Windows only)
 *
 * @param shortcutPath - Path where to create the shortcut
 * @param options - Shortcut options
 */
export function createShortcut(
  shortcutPath: string,
  options: {
    target: string;
    args?: string;
    cwd?: string;
    description?: string;
    icon?: string;
    iconIndex?: number;
  }
): boolean {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    return shell.writeShortcutLink(shortcutPath, 'create', {
      target: options.target,
      args: options.args,
      cwd: options.cwd,
      description: options.description,
      icon: options.icon,
      iconIndex: options.iconIndex,
    });
  } catch {
    return false;
  }
}

/**
 * Open the folder containing the app executable
 */
export function showAppInFolder(): void {
  const appPath = app.isPackaged
    ? process.execPath
    : path.join(app.getAppPath(), 'node_modules', 'electron', 'dist', 'electron.exe');

  shell.showItemInFolder(appPath);
}

/**
 * Open the user data folder
 */
export function showUserDataFolder(): void {
  const userDataPath = app.getPath('userData');
  shell.openPath(userDataPath);
}

/**
 * Open the logs folder
 */
export function showLogsFolder(): void {
  const logsPath = app.getPath('logs');
  shell.openPath(logsPath);
}

/**
 * Reveal file in file manager and select it
 * Works across platforms (Explorer, Finder, Nautilus)
 *
 * @param filePath - Path to the file to reveal
 */
export function revealInFileManager(filePath: string): ShellResult {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reveal file',
    };
  }
}

/**
 * Open containing folder of a file
 *
 * @param filePath - Path to the file
 */
export async function openContainingFolder(filePath: string): Promise<ShellResult> {
  try {
    const folderPath = path.dirname(filePath);
    const error = await shell.openPath(folderPath);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open folder',
    };
  }
}

/**
 * Check if a file exists
 *
 * @param filePath - Path to check
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Open multiple files with their default apps
 *
 * @param filePaths - Array of file paths
 */
export async function openMultipleFiles(
  filePaths: string[]
): Promise<{ path: string; error?: string }[]> {
  const results: { path: string; error?: string }[] = [];

  for (const filePath of filePaths) {
    const error = await shell.openPath(filePath);
    results.push({
      path: filePath,
      error: error || undefined,
    });
  }

  return results;
}

/**
 * Open app's about page (macOS specific)
 */
export function showAboutPanel(): void {
  app.showAboutPanel();
}

/**
 * Set about panel options (macOS)
 */
export function setAboutPanelOptions(options: {
  applicationName?: string;
  applicationVersion?: string;
  version?: string;
  copyright?: string;
  credits?: string;
  website?: string;
  iconPath?: string;
}): void {
  app.setAboutPanelOptions(options);
}

/**
 * Focus the window and bring to front
 */
export function focusWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
}

/**
 * Get file info for display
 */
export async function getFileInfo(filePath: string): Promise<{
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
  isFile: boolean;
  isDirectory: boolean;
} | null> {
  try {
    const stats = await fs.stat(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch {
    return null;
  }
}
