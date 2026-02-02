/**
 * App Lifecycle Management
 *
 * Handles application lifecycle events including single instance lock,
 * platform-specific quit behavior, and startup options.
 */

import { App, BrowserWindow } from 'electron';
import { WindowManager } from './windowManager';

/**
 * Request single instance lock to prevent multiple app instances
 *
 * @param app - Electron app instance
 * @param onSecondInstance - Callback when a second instance is attempted
 * @returns true if lock was obtained, false if another instance exists
 */
export function requestSingleInstanceLock(
  app: App,
  onSecondInstance: (commandLine: string[], workingDirectory: string) => void
): boolean {
  const gotLock = app.requestSingleInstanceLock();

  if (!gotLock) {
    // Another instance is already running
    return false;
  }

  // Handle second instance attempt
  app.on('second-instance', (_event, commandLine, workingDirectory) => {
    onSecondInstance(commandLine, workingDirectory);

    // If command line includes a file path, handle file open
    const filePath = parseFilePathFromArgs(commandLine);
    if (filePath) {
      handleFileOpen(filePath);
    }
  });

  return true;
}

/**
 * Set up app lifecycle event handlers
 *
 * @param app - Electron app instance
 * @param windowManager - Window manager instance
 */
export function setupLifecycle(app: App, windowManager: WindowManager | null): void {
  // Handle window-all-closed event
  app.on('window-all-closed', () => {
    // On macOS, keep the app running even when all windows are closed
    // Users typically expect to re-open via dock icon
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Handle before-quit event for cleanup
  app.on('before-quit', () => {
    // Perform any necessary cleanup before quitting
    if (windowManager) {
      // Save state for all windows
      const windows = windowManager.getAllWindows();
      for (const window of windows) {
        if (!window.isDestroyed()) {
          // Trigger close event to save state
          window.close();
        }
      }
    }
  });

  // Handle will-quit event
  app.on('will-quit', () => {
    // Final cleanup before quit
    // Add any cleanup logic here (e.g., closing database connections)
  });

  // Handle open-file event (macOS)
  app.on('open-file', (_event, filePath) => {
    handleFileOpen(filePath);
  });

  // Handle open-url event (macOS, for custom protocol)
  app.on('open-url', (_event, url) => {
    handleOpenUrl(url);
  });
}

/**
 * Handle file open request
 *
 * @param filePath - Path to the file to open
 */
export function handleFileOpen(filePath: string): void {
  // Get the focused window or the first window
  const windows = BrowserWindow.getAllWindows();
  const targetWindow = BrowserWindow.getFocusedWindow() || windows[0];

  if (targetWindow) {
    // Send file path to renderer process
    targetWindow.webContents.send('file-open', filePath);
  } else {
    // Queue file path for when a window is created
    // This is handled in the main process initialization
    global.pendingFilePath = filePath;
  }
}

/**
 * Handle URL open request (custom protocol)
 *
 * @param url - URL to handle
 */
export function handleOpenUrl(url: string): void {
  const windows = BrowserWindow.getAllWindows();
  const targetWindow = BrowserWindow.getFocusedWindow() || windows[0];

  if (targetWindow) {
    targetWindow.webContents.send('url-open', url);
  } else {
    global.pendingUrl = url;
  }
}

/**
 * Parse file path from command line arguments
 *
 * @param args - Command line arguments
 * @returns File path if found, undefined otherwise
 */
function parseFilePathFromArgs(args: string[]): string | undefined {
  // Skip the first argument (app path) and look for .pdf files
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && !arg.startsWith('-') && arg.toLowerCase().endsWith('.pdf')) {
      return arg;
    }
  }
  return undefined;
}

/**
 * Check if app should run in kiosk mode
 */
export function isKioskMode(): boolean {
  return process.argv.includes('--kiosk');
}

/**
 * Check if app should start minimized
 */
export function shouldStartMinimized(): boolean {
  return process.argv.includes('--minimized');
}

/**
 * Check if app should start with DevTools open
 */
export function shouldOpenDevTools(): boolean {
  return process.argv.includes('--devtools') || process.env['NODE_ENV'] === 'development';
}

// Extend global namespace for pending file/url handling
declare global {
  var pendingFilePath: string | undefined;
  var pendingUrl: string | undefined;
}

// Initialize global variables
global.pendingFilePath = undefined;
global.pendingUrl = undefined;
