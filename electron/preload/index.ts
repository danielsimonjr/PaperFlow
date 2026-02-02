/**
 * Preload Script
 *
 * This script runs in a sandboxed context with access to both
 * the renderer DOM and a limited subset of Node.js APIs.
 *
 * It uses contextBridge to expose a secure API to the renderer process.
 * This is the only way the renderer can communicate with the main process.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS } from '../ipc/channels';
import type {
  ElectronAPI,
  FileDialogOptions,
  SaveDialogOptions,
  MessageDialogOptions,
  FileReadOptions,
  NotificationOptions,
  WindowBounds,
  PlatformInfo,
  AppPathInfo,
  RecentFile,
  MemoryInfo,
  FileDialogResult,
  SaveDialogResult,
  MessageDialogResult,
  FileReadResult,
} from '../ipc/types';

/**
 * Create a typed wrapper for ipcRenderer.invoke
 */
function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * Create an event listener that returns an unsubscribe function
 */
function createListener(channel: string, callback: (...args: unknown[]) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
    callback(...args);
  };
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

/**
 * Electron API exposed to renderer
 */
const electronAPI: ElectronAPI = {
  // Platform info
  getPlatformInfo: () => invoke<PlatformInfo>(IPC_CHANNELS.GET_PLATFORM_INFO),
  getAppPath: () => invoke<AppPathInfo>(IPC_CHANNELS.GET_APP_PATH),
  getAppVersion: () => invoke<string>(IPC_CHANNELS.GET_APP_VERSION),

  // File operations
  openFile: () => invoke<FileDialogResult>(IPC_CHANNELS.DIALOG_OPEN_FILE),
  saveFile: async (data: Uint8Array, defaultPath?: string) => {
    const result = await invoke<SaveDialogResult>(IPC_CHANNELS.DIALOG_SAVE_FILE, { defaultPath });
    if (!result.canceled && result.filePath) {
      await invoke(IPC_CHANNELS.FILE_SAVE, result.filePath, data);
    }
    return result;
  },
  saveFileAs: async (data: Uint8Array, defaultPath?: string) => {
    const result = await invoke<SaveDialogResult>(IPC_CHANNELS.DIALOG_SAVE_FILE, { defaultPath });
    if (!result.canceled && result.filePath) {
      await invoke(IPC_CHANNELS.FILE_SAVE, result.filePath, data);
    }
    return result;
  },
  readFile: (filePath: string, options?: FileReadOptions) =>
    invoke<FileReadResult>(IPC_CHANNELS.FILE_READ, filePath, options),
  fileExists: (filePath: string) => invoke<boolean>(IPC_CHANNELS.FILE_EXISTS, filePath),
  getRecentFiles: () => invoke<RecentFile[]>(IPC_CHANNELS.FILE_GET_RECENT),
  addRecentFile: (filePath: string) => invoke<void>(IPC_CHANNELS.FILE_ADD_RECENT, filePath),
  clearRecentFiles: () => invoke<void>(IPC_CHANNELS.FILE_CLEAR_RECENT),

  // Dialog operations
  showOpenDialog: (options?: FileDialogOptions) =>
    invoke<FileDialogResult>(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
  showSaveDialog: (options?: SaveDialogOptions) =>
    invoke<SaveDialogResult>(IPC_CHANNELS.DIALOG_SAVE_FILE, options),
  showMessageDialog: (options: MessageDialogOptions) =>
    invoke<MessageDialogResult>(IPC_CHANNELS.DIALOG_MESSAGE, options),

  // Window operations
  minimizeWindow: () => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE);
  },
  maximizeWindow: () => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE);
  },
  closeWindow: () => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE);
  },
  isWindowMaximized: () => invoke<boolean>(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  setWindowTitle: (title: string) => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_TITLE, title);
  },
  getWindowBounds: () => invoke<WindowBounds>(IPC_CHANNELS.WINDOW_GET_BOUNDS),
  setWindowBounds: (bounds: Partial<WindowBounds>) => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_BOUNDS, bounds);
  },

  // Shell operations
  openExternal: (url: string) => invoke<void>(IPC_CHANNELS.SHELL_OPEN_EXTERNAL, url),
  openPath: (path: string) => invoke<string>(IPC_CHANNELS.SHELL_OPEN_PATH, path),
  showItemInFolder: (path: string) => {
    ipcRenderer.invoke(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, path);
  },
  trashItem: (path: string) => invoke<void>(IPC_CHANNELS.SHELL_TRASH_ITEM, path),

  // Clipboard operations
  readClipboardText: () => invoke<string>(IPC_CHANNELS.CLIPBOARD_READ_TEXT),
  writeClipboardText: (text: string) => {
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT, text);
  },
  readClipboardImage: () => invoke<string | null>(IPC_CHANNELS.CLIPBOARD_READ_IMAGE),
  writeClipboardImage: (dataUrl: string) => {
    ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE_IMAGE, dataUrl);
  },

  // Notification
  showNotification: (options: NotificationOptions) => {
    ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_SHOW, options);
  },

  // System info
  getMemoryInfo: () => invoke<MemoryInfo>(IPC_CHANNELS.SYSTEM_GET_MEMORY_INFO),

  // Event listeners
  onFileOpened: (callback: (filePath: string) => void) =>
    createListener(IPC_EVENTS.FILE_OPENED, callback as (...args: unknown[]) => void),
  onMenuFileNew: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_FILE_NEW, callback),
  onMenuFileOpen: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_FILE_OPEN, callback),
  onMenuFileSave: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_FILE_SAVE, callback),
  onMenuFileSaveAs: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_FILE_SAVE_AS, callback),
  onMenuEditUndo: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_EDIT_UNDO, callback),
  onMenuEditRedo: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_EDIT_REDO, callback),
  onMenuViewZoomIn: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_IN, callback),
  onMenuViewZoomOut: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_OUT, callback),
  onMenuViewZoomReset: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_RESET, callback),
  onBeforeQuit: (callback: () => void) =>
    createListener(IPC_EVENTS.APP_BEFORE_QUIT, callback),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Log that preload script has loaded (development only)
if (process.env['NODE_ENV'] === 'development') {
  console.log('[Preload] Electron API exposed to renderer');
}
