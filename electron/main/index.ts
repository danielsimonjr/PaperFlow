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
import { initializeUpdater, cleanupUpdater } from './updater';
import {
  setupFileAssociationHandlers,
  processStartupArgs,
  sendPendingFileToWindow,
} from '../fileAssociation';
import { initializeAutoSave, disableAllAutoSave } from '../autoSave';
import { unwatchAll } from '../fileWatcher';
import { initializeMenu } from '../menu';
import { initializeShortcuts } from '../shortcuts';
import { initializeTray, destroyTray } from '../tray';
import { createTrayMenuManager, TrayMenuManager } from '../trayMenu';
import { initializeNotifications } from '../notifications';
import { setupAllNotificationHandlers } from '../ipc/notificationHandlers';
import { setupPrintHandlers } from '../ipc/printHandlers';
import { setupShellHandlers } from '../ipc/shellHandlers';
import { setupDialogHandlers } from '../ipc/dialogHandlers';
import { setupClipboardHandlers } from '../ipc/clipboardHandlers';
import { setupStorageHandlers } from '../ipc/storageHandlers';
import { initializeProtocol, registerAsDefaultProtocolClient, setProtocolCallback, setupProtocolHandlers } from '../protocol';
import { initializeStartup } from '../startup';
import { stopAllBlockers } from '../powerSave';
import { IPC_EVENTS } from '../ipc/channels';

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
let trayMenuManager: TrayMenuManager | null = null;

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
  // Initialize protocol handling early (before app.whenReady)
  initializeProtocol();

  // Set up file association handlers early (before app.whenReady)
  setupFileAssociationHandlers();

  // Initialize startup settings
  initializeStartup();

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

  // Set up notification and tray IPC handlers
  setupAllNotificationHandlers(ipcMain);

  // Set up additional IPC handlers for Sprint 6 features
  setupPrintHandlers(ipcMain);
  setupShellHandlers(ipcMain);
  setupDialogHandlers(ipcMain);
  setupClipboardHandlers(ipcMain);
  setupStorageHandlers(ipcMain);

  // Set up protocol handlers
  setupProtocolHandlers();
  registerAsDefaultProtocolClient();

  // Initialize menu system
  await initializeMenu();

  // Initialize keyboard shortcuts
  await initializeShortcuts();

  // Create the main window
  const mainWindow = await createMainWindow();

  // Initialize system tray
  await initializeTraySystem(mainWindow);

  // Initialize notification system
  initializeNotifications();

  // Send pending file if app was launched with a file argument
  sendPendingFileToWindow(mainWindow);

  // Process startup arguments (command-line file opening)
  await processStartupArgs();

  // Initialize auto-save recovery system
  await initializeAutoSave();

  // Initialize auto-updater (only in production)
  if (app.isPackaged) {
    initializeUpdater();
  }

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = await createMainWindow();
      sendPendingFileToWindow(newWindow);
    }
  });

  // Set up protocol callback to handle deep links
  setProtocolCallback((result) => {
    console.log('[Main] Protocol callback:', result);
    if (result.filePath && windowManager) {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send(IPC_EVENTS.FILE_OPENED, result.filePath);
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Clean up on quit
  app.on('will-quit', async () => {
    cleanupUpdater();
    disableAllAutoSave();
    destroyTray();
    stopAllBlockers();
    await unwatchAll();
  });
}

/**
 * Initialize the system tray with menu and event handlers
 */
async function initializeTraySystem(mainWindow: BrowserWindow): Promise<void> {
  try {
    // Initialize tray with event handlers
    const trayManager = await initializeTray({
      onTrayClick: () => {
        // Show/hide window on click
        if (mainWindow.isVisible()) {
          if (mainWindow.isFocused()) {
            mainWindow.hide();
            mainWindow.webContents.send(IPC_EVENTS.WINDOW_HIDDEN);
          } else {
            mainWindow.focus();
          }
        } else {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send(IPC_EVENTS.WINDOW_SHOWN);
        }
      },
      onTrayDoubleClick: () => {
        // Always show and focus on double-click
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.webContents.send(IPC_EVENTS.WINDOW_SHOWN);
      },
      onTrayRightClick: () => {
        // Show context menu on right-click
        if (trayMenuManager) {
          trayMenuManager.showMenu();
        }
      },
    });

    // Create tray menu manager
    trayMenuManager = createTrayMenuManager(trayManager, {
      onShowWindow: () => {
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.webContents.send(IPC_EVENTS.WINDOW_SHOWN);
      },
      onNewWindow: () => {
        mainWindow.webContents.send(IPC_EVENTS.MENU_FILE_NEW);
      },
      onOpenFile: () => {
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
        mainWindow.webContents.send(IPC_EVENTS.MENU_FILE_OPEN);
      },
      onQuit: () => {
        app.quit();
      },
    });

    // Set the persistent context menu (for platforms that support it)
    await trayMenuManager.setPersistentMenu();

    console.log('[Main] System tray initialized');
  } catch (error) {
    console.error('[Main] Failed to initialize system tray:', error);
  }
}

// Start the application
initialize().catch((error) => {
  console.error('Failed to initialize application:', error);
  app.quit();
});

export { createMainWindow, windowManager };
