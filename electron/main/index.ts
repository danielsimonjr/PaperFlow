/**
 * Electron Main Process Entry Point
 *
 * This is the main entry point for the Electron application.
 * It handles app lifecycle, window creation, and IPC setup.
 */

import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { WindowManager } from './windowManager';
import { setupLifecycle, requestSingleInstanceLock } from './lifecycle';
import { setupContentSecurityPolicy } from './security';
import { setupIpcHandlers } from '../ipc/handlers';
import { IPC_CHANNELS } from '../ipc/channels';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DIST_PATH = path.join(__dirname, '../../dist');
const PRELOAD_PATH = path.join(__dirname, '../preload/index.js');

// Environment flags
const isDev = !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// Global references
let windowManager: WindowManager | null = null;

/**
 * Creates the main application window
 */
async function createMainWindow(): Promise<BrowserWindow> {
  if (!windowManager) {
    windowManager = new WindowManager();
  }

  const mainWindow = windowManager.createWindow({
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Set up CSP
  setupContentSecurityPolicy(mainWindow, isDev);

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    await mainWindow.loadFile(path.join(DIST_PATH, 'index.html'));
  }

  return mainWindow;
}

/**
 * Sets up the main process IPC handlers
 */
function setupIpc(): void {
  // Set up all IPC handlers
  setupIpcHandlers(ipcMain);

  // Log IPC calls in development mode
  if (isDev) {
    const originalInvoke = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = function (channel: string, listener: Parameters<typeof ipcMain.handle>[1]) {
      return originalInvoke(channel, async (event, ...args) => {
        console.log(`[IPC] ${channel}`, args);
        return listener(event, ...args);
      });
    };
  }

  // Platform info handler
  ipcMain.handle(IPC_CHANNELS.GET_PLATFORM_INFO, () => ({
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
  }));

  // App path handler
  ipcMain.handle(IPC_CHANNELS.GET_APP_PATH, () => ({
    appPath: app.getAppPath(),
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
  }));
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
  // Request single instance lock
  const gotLock = requestSingleInstanceLock(app, () => {
    // Focus existing window when second instance is launched
    if (windowManager) {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    }
  });

  if (!gotLock) {
    app.quit();
    return;
  }

  // Set up app lifecycle handlers
  setupLifecycle(app, windowManager);

  // Wait for app ready
  await app.whenReady();

  // Set up security headers for all sessions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
      },
    });
  });

  // Set up IPC handlers
  setupIpc();

  // Create the main window
  await createMainWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
}

// Start the application
initialize().catch((error) => {
  console.error('Failed to initialize application:', error);
  app.quit();
});

export { createMainWindow, windowManager };
