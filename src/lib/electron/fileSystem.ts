/**
 * File System Integration for Electron
 *
 * High-level wrapper for native file system operations.
 * Provides easy-to-use APIs for opening, saving, and managing PDF files.
 */

import { isElectron } from './platform';
import type {
  FileDialogOptions,
  SaveDialogOptions,
  FolderDialogOptions,
  FolderListOptions,
  FolderEntry,
  FileStats,
  AutoSaveOptions,
  RecoveryFileInfo,
  BackupInfo,
  BackupOptions,
  FileWatcherEvent,
  RecentFile,
} from '@/types/electronTypes';

/**
 * Open a PDF file using native dialog
 */
export async function openPdfFile(options?: FileDialogOptions): Promise<{
  path: string;
  data: Uint8Array;
} | null> {
  if (!isElectron()) {
    return null;
  }

  const result = await window.electron!.showOpenDialog({
    ...options,
    filters: options?.filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  if (!filePath) {
    return null;
  }

  const fileResult = await window.electron!.readFile(filePath);

  if (!fileResult.success || !fileResult.data) {
    throw new Error(fileResult.error || 'Failed to read file');
  }

  // Add to recent files
  await window.electron!.addRecentFile(filePath);

  // Convert to Uint8Array - handle both string and Buffer types from IPC
  const fileData = fileResult.data;
  let data: Uint8Array;

  if (typeof fileData === 'string') {
    data = new TextEncoder().encode(fileData);
  } else {
    // fileData is Buffer or ArrayBuffer-like
    data = new Uint8Array(fileData as unknown as ArrayBuffer);
  }

  return { path: filePath, data };
}

/**
 * Open multiple PDF files using native dialog
 */
export async function openMultiplePdfFiles(options?: FileDialogOptions): Promise<Array<{
  path: string;
  data: Uint8Array;
}>> {
  if (!isElectron()) {
    return [];
  }

  const result = await window.electron!.showOpenDialog({
    ...options,
    multiSelections: true,
    filters: options?.filters || [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const files: Array<{ path: string; data: Uint8Array }> = [];

  for (const filePath of result.filePaths) {
    try {
      const fileResult = await window.electron!.readFile(filePath);
      if (fileResult.success && fileResult.data) {
        const fileData = fileResult.data;
        let data: Uint8Array;

        if (typeof fileData === 'string') {
          data = new TextEncoder().encode(fileData);
        } else {
          // fileData is Buffer or ArrayBuffer-like
          data = new Uint8Array(fileData as unknown as ArrayBuffer);
        }

        files.push({ path: filePath, data });
        await window.electron!.addRecentFile(filePath);
      }
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`, error);
    }
  }

  return files;
}

/**
 * Save PDF data to a specific file path
 */
export async function savePdfFile(
  data: Uint8Array,
  filePath: string,
  createBackup: boolean = true
): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  try {
    // Create backup before overwriting
    if (createBackup) {
      const exists = await window.electron!.fileExists(filePath);
      if (exists) {
        await window.electron!.createBackup(filePath);
      }
    }

    // Write the file
    const result = await window.electron!.writeFile(filePath, data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save file');
    }

    // Add to recent files
    await window.electron!.addRecentFile(filePath);

    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
}

/**
 * Save PDF data using a save dialog
 */
export async function savePdfFileAs(
  data: Uint8Array,
  options?: SaveDialogOptions
): Promise<string | null> {
  if (!isElectron()) {
    return null;
  }

  const result = await window.electron!.showSaveDialog({
    ...options,
    filters: options?.filters || [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  await savePdfFile(data, result.filePath, false);
  return result.filePath;
}

/**
 * Read a file from disk
 */
export async function readFile(filePath: string): Promise<Uint8Array | null> {
  if (!isElectron()) {
    return null;
  }

  const result = await window.electron!.readFile(filePath);
  if (!result.success || !result.data) {
    return null;
  }

  const fileData = result.data;
  if (typeof fileData === 'string') {
    return new TextEncoder().encode(fileData);
  } else {
    // fileData is Buffer or ArrayBuffer-like
    return new Uint8Array(fileData as unknown as ArrayBuffer);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.fileExists(filePath);
}

/**
 * Get file statistics
 */
export async function getFileStats(filePath: string): Promise<FileStats | null> {
  if (!isElectron()) {
    return null;
  }

  return window.electron!.getFileStats(filePath);
}

/**
 * Delete a file
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.deleteFile(filePath);
}

/**
 * Move a file to trash
 */
export async function trashFile(filePath: string): Promise<void> {
  if (!isElectron()) {
    return;
  }

  await window.electron!.trashItem(filePath);
}

/**
 * Pick a folder using native dialog
 */
export async function pickFolder(options?: FolderDialogOptions): Promise<string | null> {
  if (!isElectron()) {
    return null;
  }

  const result = await window.electron!.pickFolder(options);
  return result.canceled ? null : result.folderPath ?? null;
}

/**
 * List files in a folder
 */
export async function listFolder(
  folderPath: string,
  options?: FolderListOptions
): Promise<FolderEntry[]> {
  if (!isElectron()) {
    return [];
  }

  return window.electron!.listFolder(folderPath, options);
}

/**
 * List PDF files in a folder
 */
export async function listPdfFiles(
  folderPath: string,
  recursive: boolean = false
): Promise<FolderEntry[]> {
  return listFolder(folderPath, {
    extensions: ['pdf'],
    recursive,
  });
}

/**
 * Create a folder
 */
export async function createFolder(folderPath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.createFolder(folderPath);
}

// === Recent Files ===

/**
 * Get recent files list
 */
export async function getRecentFiles(): Promise<RecentFile[]> {
  if (!isElectron()) {
    return [];
  }

  return window.electron!.getRecentFiles();
}

/**
 * Add file to recent files
 */
export async function addRecentFile(filePath: string): Promise<void> {
  if (!isElectron()) {
    return;
  }

  await window.electron!.addRecentFile(filePath);
}

/**
 * Remove file from recent files
 */
export async function removeRecentFile(filePath: string): Promise<void> {
  if (!isElectron()) {
    return;
  }

  await window.electron!.removeRecentFile(filePath);
}

/**
 * Clear all recent files
 */
export async function clearRecentFiles(): Promise<void> {
  if (!isElectron()) {
    return;
  }

  await window.electron!.clearRecentFiles();
}

// === File Watching ===

/**
 * Start watching a file for external changes
 */
export async function watchFile(filePath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.watchFile(filePath);
}

/**
 * Stop watching a file
 */
export async function unwatchFile(filePath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.unwatchFile(filePath);
}

/**
 * Stop watching all files
 */
export async function unwatchAll(): Promise<void> {
  if (!isElectron()) {
    return;
  }

  await window.electron!.unwatchAll();
}

/**
 * Subscribe to file change events
 */
export function onFileChanged(
  callback: (event: FileWatcherEvent) => void
): () => void {
  if (!isElectron()) {
    return () => {};
  }

  return window.electron!.onFileChanged(callback);
}

/**
 * Subscribe to file deletion events
 */
export function onFileDeleted(callback: (filePath: string) => void): () => void {
  if (!isElectron()) {
    return () => {};
  }

  return window.electron!.onFileDeleted(callback);
}

// === Auto-Save ===

/**
 * Enable auto-save for a document
 */
export async function enableAutoSave(options: AutoSaveOptions): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.enableAutoSave(options);
}

/**
 * Disable auto-save for a document
 */
export async function disableAutoSave(filePath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.disableAutoSave(filePath);
}

/**
 * Get list of recovery files
 */
export async function getRecoveryFiles(): Promise<RecoveryFileInfo[]> {
  if (!isElectron()) {
    return [];
  }

  return window.electron!.getRecoveryFiles();
}

/**
 * Clear a recovery file
 */
export async function clearRecoveryFile(recoveryPath: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.clearRecoveryFile(recoveryPath);
}

/**
 * Subscribe to auto-save trigger events
 */
export function onAutoSaveTriggered(
  callback: (filePath: string) => void
): () => void {
  if (!isElectron()) {
    return () => {};
  }

  return window.electron!.onAutoSaveTriggered(callback);
}

/**
 * Subscribe to recovery available events
 */
export function onRecoveryAvailable(
  callback: (files: RecoveryFileInfo[]) => void
): () => void {
  if (!isElectron()) {
    return () => {};
  }

  return window.electron!.onRecoveryAvailable(callback);
}

// === Backup ===

/**
 * Create a backup of a file
 */
export async function createBackup(
  filePath: string,
  options?: BackupOptions
): Promise<BackupInfo | null> {
  if (!isElectron()) {
    return null;
  }

  return window.electron!.createBackup(filePath, options);
}

/**
 * List backups for a file
 */
export async function listBackups(filePath: string): Promise<BackupInfo[]> {
  if (!isElectron()) {
    return [];
  }

  return window.electron!.listBackups(filePath);
}

/**
 * Restore a backup
 */
export async function restoreBackup(backupId: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.restoreBackup(backupId);
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<boolean> {
  if (!isElectron()) {
    return false;
  }

  return window.electron!.deleteBackup(backupId);
}

// === Shell Operations ===

/**
 * Show file in folder (Explorer/Finder)
 */
export function showInFolder(filePath: string): void {
  if (!isElectron()) {
    return;
  }

  window.electron!.showItemInFolder(filePath);
}

/**
 * Open file with default application
 */
export async function openWithDefaultApp(filePath: string): Promise<string> {
  if (!isElectron()) {
    return 'Not supported in browser';
  }

  return window.electron!.openPath(filePath);
}

// === Path Utilities ===

/**
 * Get the file name from a path
 */
export function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
}

/**
 * Get the directory from a path
 */
export function getDirectory(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  parts.pop();
  return parts.join('/');
}

/**
 * Get the file extension from a path
 */
export function getExtension(filePath: string): string {
  const fileName = getFileName(filePath);
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * Check if a path is a PDF file
 */
export function isPdfFile(filePath: string): boolean {
  return getExtension(filePath) === 'pdf';
}

/**
 * Truncate a file path for display
 */
export function truncatePath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  const fileName = getFileName(filePath);
  if (fileName.length >= maxLength - 3) {
    return '...' + fileName.slice(-(maxLength - 3));
  }

  const remaining = maxLength - fileName.length - 4; // 4 for ".../"
  const dir = getDirectory(filePath);
  return dir.slice(0, remaining) + '.../' + fileName;
}
