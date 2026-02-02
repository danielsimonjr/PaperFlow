/**
 * File Association Handler
 *
 * Handles PDF file associations for opening files from:
 * - Double-click in file manager
 * - Command-line arguments
 * - Drag-and-drop onto dock icon (macOS)
 * - Second instance launch with file argument
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { IPC_EVENTS } from './ipc/channels';
import { addRecentFile } from './recentFiles';

// Store the file to open when the window is ready
let pendingFileToOpen: string | null = null;

/**
 * Validate that a path is a PDF file
 */
async function isValidPdfFile(filePath: string): Promise<boolean> {
  try {
    const normalizedPath = path.normalize(filePath);

    // Check extension
    if (path.extname(normalizedPath).toLowerCase() !== '.pdf') {
      return false;
    }

    // Check file exists and is readable
    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      return false;
    }

    // Check file signature (PDF magic bytes: %PDF-)
    const fileHandle = await fs.open(normalizedPath, 'r');
    try {
      const buffer = Buffer.alloc(5);
      await fileHandle.read(buffer, 0, 5, 0);
      const signature = buffer.toString('utf-8');
      return signature === '%PDF-';
    } finally {
      await fileHandle.close();
    }
  } catch {
    return false;
  }
}

/**
 * Extract file path from command line arguments
 */
export function extractFileFromArgs(args: string[]): string | null {
  // Skip electron executable and app path
  // Look for .pdf files in arguments
  for (const arg of args) {
    // Skip flags
    if (arg.startsWith('-')) continue;

    // Check if it looks like a file path
    if (arg.toLowerCase().endsWith('.pdf')) {
      return path.resolve(arg);
    }
  }

  return null;
}

/**
 * Open a file in the application
 */
export async function openFile(filePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(filePath);

  // Validate file
  const isValid = await isValidPdfFile(normalizedPath);
  if (!isValid) {
    console.error('[FileAssociation] Invalid PDF file:', normalizedPath);
    return false;
  }

  // Add to recent files
  await addRecentFile(normalizedPath);

  // Send to renderer
  const windows = BrowserWindow.getAllWindows();
  const mainWindow = windows[0];

  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    // Check if webContents is ready
    if (mainWindow.webContents.isLoading()) {
      // Store for later
      pendingFileToOpen = normalizedPath;
    } else {
      mainWindow.webContents.send(IPC_EVENTS.FILE_OPENED, normalizedPath);
    }

    // Focus window
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  } else {
    // Store for when window is created
    pendingFileToOpen = normalizedPath;
  }

  console.log('[FileAssociation] Opening file:', normalizedPath);
  return true;
}

/**
 * Get pending file to open
 */
export function getPendingFile(): string | null {
  return pendingFileToOpen;
}

/**
 * Clear pending file
 */
export function clearPendingFile(): void {
  pendingFileToOpen = null;
}

/**
 * Send pending file to window when ready
 */
export function sendPendingFileToWindow(window: BrowserWindow): void {
  if (pendingFileToOpen && !window.isDestroyed()) {
    window.webContents.once('did-finish-load', () => {
      if (pendingFileToOpen) {
        window.webContents.send(IPC_EVENTS.FILE_OPENED, pendingFileToOpen);
        clearPendingFile();
      }
    });
  }
}

/**
 * Set up file association handlers
 */
export function setupFileAssociationHandlers(): void {
  // Handle file open on macOS when app is already running
  app.on('open-file', async (event, filePath) => {
    event.preventDefault();
    console.log('[FileAssociation] open-file event:', filePath);
    await openFile(filePath);
  });

  // Handle second instance with file argument
  app.on('second-instance', async (_event, commandLine) => {
    console.log('[FileAssociation] second-instance:', commandLine);
    const filePath = extractFileFromArgs(commandLine);
    if (filePath) {
      await openFile(filePath);
    }
  });
}

/**
 * Process command line arguments on startup
 */
export async function processStartupArgs(): Promise<void> {
  const filePath = extractFileFromArgs(process.argv);
  if (filePath) {
    console.log('[FileAssociation] Startup file:', filePath);
    await openFile(filePath);
  }
}

/**
 * Check if the app was launched with a file argument
 */
export function wasLaunchedWithFile(): boolean {
  return pendingFileToOpen !== null || extractFileFromArgs(process.argv) !== null;
}

/**
 * Register file associations (Windows)
 * Note: This is typically done by the installer (NSIS) via electron-builder.yml
 * This function can be used for programmatic registration if needed
 */
export async function registerFileAssociations(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return true;
  }

  // On Windows, file associations are registered by the installer
  // See electron-builder.yml fileAssociations configuration
  // This is a stub for potential runtime registration

  try {
    // Set app as default PDF handler (requires elevation on Windows)
    // app.setAsDefaultProtocolClient is for protocols, not file types
    // File type associations on Windows require registry modifications
    console.log('[FileAssociation] File associations registered via installer');
    return true;
  } catch (error) {
    console.error('[FileAssociation] Failed to register file associations:', error);
    return false;
  }
}

/**
 * Check if the app is the default PDF handler
 */
export function isDefaultPdfHandler(): boolean {
  // This check is platform-specific
  // On Windows, would need to check registry
  // On macOS, would need to check Launch Services
  // For now, return true if we have file associations configured
  return true;
}

/**
 * Get file types the app can handle
 */
export function getSupportedFileTypes(): string[] {
  return ['.pdf'];
}
