/**
 * Recent Files Management
 *
 * Manages the list of recently opened files with persistence.
 * Integrates with the system menu for recent files display.
 */

import fs from 'fs/promises';
import path from 'path';
import { app, Menu, MenuItem, BrowserWindow } from 'electron';
import { IPC_EVENTS } from './ipc/channels';
import type { RecentFile } from './ipc/types';

// Configuration
const MAX_RECENT_FILES = 10;
const RECENT_FILES_PATH = path.join(app.getPath('userData'), 'recent-files.json');

// Cache of recent files
let recentFilesCache: RecentFile[] | null = null;

/**
 * Load recent files from storage
 */
export async function loadRecentFiles(): Promise<RecentFile[]> {
  if (recentFilesCache) {
    return recentFilesCache;
  }

  try {
    const data = await fs.readFile(RECENT_FILES_PATH, 'utf-8');
    const parsed = JSON.parse(data) as unknown;
    if (Array.isArray(parsed)) {
      // Validate and filter entries
      recentFilesCache = parsed.filter((item): item is RecentFile => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.path === 'string' &&
          typeof item.name === 'string' &&
          typeof item.timestamp === 'number'
        );
      });
      return recentFilesCache;
    }
  } catch {
    // File doesn't exist or is invalid
  }

  recentFilesCache = [];
  return recentFilesCache;
}

/**
 * Save recent files to storage
 */
export async function saveRecentFiles(files: RecentFile[]): Promise<void> {
  recentFilesCache = files;
  await fs.writeFile(RECENT_FILES_PATH, JSON.stringify(files, null, 2), 'utf-8');
}

/**
 * Add a file to recent files list
 */
export async function addRecentFile(filePath: string): Promise<void> {
  const normalizedPath = path.normalize(filePath);
  const files = await loadRecentFiles();

  // Check if file exists
  try {
    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      return;
    }

    // Remove if already exists
    const filtered = files.filter((f) => path.normalize(f.path) !== normalizedPath);

    // Add to front with file info
    filtered.unshift({
      path: normalizedPath,
      name: path.basename(normalizedPath),
      timestamp: Date.now(),
      size: stats.size,
    });

    // Limit to max
    const limited = filtered.slice(0, MAX_RECENT_FILES);

    await saveRecentFiles(limited);

    // Add to app's recent documents (OS integration)
    app.addRecentDocument(normalizedPath);

    // Update menu
    await updateRecentFilesMenu();
  } catch (error) {
    console.error('[RecentFiles] Failed to add recent file:', error);
  }
}

/**
 * Remove a file from recent files list
 */
export async function removeRecentFile(filePath: string): Promise<void> {
  const normalizedPath = path.normalize(filePath);
  const files = await loadRecentFiles();

  const filtered = files.filter((f) => path.normalize(f.path) !== normalizedPath);

  if (filtered.length !== files.length) {
    await saveRecentFiles(filtered);
    await updateRecentFilesMenu();
  }
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  await saveRecentFiles([]);

  // Clear app's recent documents
  app.clearRecentDocuments();

  // Update menu
  await updateRecentFilesMenu();
}

/**
 * Get list of recent files
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  const files = await loadRecentFiles();

  // Validate that files still exist
  const validFiles: RecentFile[] = [];
  for (const file of files) {
    try {
      await fs.access(file.path);
      validFiles.push(file);
    } catch {
      // File no longer exists, skip it
    }
  }

  // If some files were removed, update storage
  if (validFiles.length !== files.length) {
    await saveRecentFiles(validFiles);
  }

  return validFiles;
}

/**
 * Open a recent file
 */
export function openRecentFile(filePath: string): void {
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows[0];

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC_EVENTS.FILE_OPENED, filePath);

    // Focus and restore window
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
}

/**
 * Create recent files menu items
 */
export async function createRecentFilesMenuItems(): Promise<MenuItem[]> {
  const files = await getRecentFiles();

  if (files.length === 0) {
    return [
      new MenuItem({
        label: 'No Recent Files',
        enabled: false,
      }),
    ];
  }

  const items: MenuItem[] = files.map((file, index) => {
    const accelerator = index < 9 ? `CmdOrCtrl+${index + 1}` : undefined;
    return new MenuItem({
      label: file.name,
      sublabel: file.path,
      accelerator,
      click: () => openRecentFile(file.path),
    });
  });

  // Add separator and clear option
  items.push(
    new MenuItem({ type: 'separator' }),
    new MenuItem({
      label: 'Clear Recent Files',
      click: async () => {
        await clearRecentFiles();
      },
    })
  );

  return items;
}

/**
 * Update the recent files submenu in the application menu
 */
export async function updateRecentFilesMenu(): Promise<void> {
  try {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    // Find File menu
    const fileMenu = menu.items.find((item) => item.label === 'File');
    if (!fileMenu || !fileMenu.submenu) return;

    // Find Open Recent submenu
    const openRecentItem = fileMenu.submenu.items.find(
      (item) => item.label === 'Open Recent'
    );

    if (openRecentItem && openRecentItem.submenu) {
      // Note: Electron doesn't support dynamic menu updates well,
      // so we need to rebuild the entire menu
      await rebuildApplicationMenu();
    }
  } catch (error) {
    console.error('[RecentFiles] Failed to update menu:', error);
  }
}

/**
 * Rebuild the application menu with updated recent files
 * This is called when recent files change
 */
async function rebuildApplicationMenu(): Promise<void> {
  // This function would rebuild the entire application menu
  // For now, we'll emit an event that the main process can handle
  // The actual menu building is done in the menu module
  console.log('[RecentFiles] Menu rebuild requested');
}

/**
 * Clear cache (for testing)
 */
export function clearCache(): void {
  recentFilesCache = null;
}

/**
 * Get max recent files limit
 */
export function getMaxRecentFiles(): number {
  return MAX_RECENT_FILES;
}
