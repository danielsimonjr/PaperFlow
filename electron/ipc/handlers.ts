/**
 * IPC Handlers
 *
 * Main process IPC handlers for communication with renderer process.
 * All handlers are registered in the main process and invoked from the preload script.
 */

import { IpcMain, dialog, shell, clipboard, nativeImage, BrowserWindow, Notification, app } from 'electron';
import { IPC_CHANNELS } from './channels';
import type {
  MessageDialogOptions,
  NotificationOptions,
  WindowBounds,
} from './types';
import { setupFileHandlers } from './fileHandlers';

/**
 * Set up all IPC handlers
 *
 * @param ipcMain - Electron IpcMain instance
 */
export function setupIpcHandlers(ipcMain: IpcMain): void {
  // Helper to get current window
  const getCurrentWindow = (event: Electron.IpcMainInvokeEvent): BrowserWindow | null => {
    return BrowserWindow.fromWebContents(event.sender);
  };

  // Set up file system handlers (dialogs, read/write, watch, autosave, backup)
  setupFileHandlers(ipcMain);

  // Message dialog (kept here for non-file-related dialogs)
  ipcMain.handle(
    IPC_CHANNELS.DIALOG_MESSAGE,
    async (event, options: MessageDialogOptions) => {
      const window = getCurrentWindow(event);
      if (!window) return { response: -1 };

      const result = await dialog.showMessageBox(window, {
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        detail: options.detail,
        buttons: options.buttons || ['OK'],
        defaultId: options.defaultId,
        cancelId: options.cancelId,
      });

      return { response: result.response };
    }
  );

  // Window operations
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const window = getCurrentWindow(event);
    if (window) window.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const window = getCurrentWindow(event);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const window = getCurrentWindow(event);
    if (window) window.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    const window = getCurrentWindow(event);
    return window ? window.isMaximized() : false;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_TITLE, (event, title: string) => {
    const window = getCurrentWindow(event);
    if (window) window.setTitle(title);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_BOUNDS, (event): WindowBounds | null => {
    const window = getCurrentWindow(event);
    if (!window) return null;
    const bounds = window.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_BOUNDS, (event, bounds: Partial<WindowBounds>) => {
    const window = getCurrentWindow(event);
    if (window) {
      const current = window.getBounds();
      window.setBounds({
        x: bounds.x ?? current.x,
        y: bounds.y ?? current.y,
        width: bounds.width ?? current.width,
        height: bounds.height ?? current.height,
      });
    }
  });

  // Shell operations
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, async (_event, url: string) => {
    // Validate URL before opening
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
        await shell.openExternal(url);
      } else {
        throw new Error('Invalid URL protocol');
      }
    } catch (error) {
      throw new Error(`Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_PATH, async (_event, filePath: string) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.SHELL_TRASH_ITEM, async (_event, filePath: string) => {
    await shell.trashItem(filePath);
  });

  // Clipboard operations
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_TEXT, () => {
    return clipboard.readText();
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT, (_event, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ_IMAGE, () => {
    const image = clipboard.readImage();
    if (image.isEmpty()) {
      return null;
    }
    return image.toDataURL();
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE_IMAGE, (_event, dataUrl: string) => {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
  });

  // Notification
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SHOW, (_event, options: NotificationOptions) => {
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent,
    });
    notification.show();
  });

  // System info
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_MEMORY_INFO, () => {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    };
  });

  // App version
  ipcMain.handle(IPC_CHANNELS.GET_APP_VERSION, () => {
    return app.getVersion();
  });
}
