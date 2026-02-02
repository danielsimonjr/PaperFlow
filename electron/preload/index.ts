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
  FileWriteResult,
  FileStats,
  FolderDialogOptions,
  FolderDialogResult,
  FolderListOptions,
  FolderEntry,
  FileWatcherEvent,
  AutoSaveOptions,
  RecoveryFileInfo,
  BackupInfo,
  BackupOptions,
  UpdateState,
  UpdateSettings,
  UpdateCheckResult,
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
  writeFile: (filePath: string, data: Uint8Array) =>
    invoke<FileWriteResult>(IPC_CHANNELS.FILE_WRITE, filePath, data),
  fileExists: (filePath: string) => invoke<boolean>(IPC_CHANNELS.FILE_EXISTS, filePath),
  getFileStats: (filePath: string) => invoke<FileStats | null>(IPC_CHANNELS.FILE_GET_STATS, filePath),
  deleteFile: (filePath: string) => invoke<boolean>(IPC_CHANNELS.FILE_DELETE, filePath),
  copyFile: (src: string, dest: string) => invoke<boolean>(IPC_CHANNELS.FILE_COPY, src, dest),
  moveFile: (src: string, dest: string) => invoke<boolean>(IPC_CHANNELS.FILE_MOVE, src, dest),

  // Recent files
  getRecentFiles: () => invoke<RecentFile[]>(IPC_CHANNELS.FILE_GET_RECENT),
  addRecentFile: (filePath: string) => invoke<void>(IPC_CHANNELS.FILE_ADD_RECENT, filePath),
  removeRecentFile: (filePath: string) => invoke<void>(IPC_CHANNELS.FILE_REMOVE_RECENT, filePath),
  clearRecentFiles: () => invoke<void>(IPC_CHANNELS.FILE_CLEAR_RECENT),

  // Folder operations
  pickFolder: (options?: FolderDialogOptions) =>
    invoke<FolderDialogResult>(IPC_CHANNELS.FOLDER_PICK, options),
  listFolder: (folderPath: string, options?: FolderListOptions) =>
    invoke<FolderEntry[]>(IPC_CHANNELS.FOLDER_LIST, folderPath, options),
  createFolder: (folderPath: string) => invoke<boolean>(IPC_CHANNELS.FOLDER_CREATE, folderPath),

  // Dialog operations
  showOpenDialog: (options?: FileDialogOptions) =>
    invoke<FileDialogResult>(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
  showSaveDialog: (options?: SaveDialogOptions) =>
    invoke<SaveDialogResult>(IPC_CHANNELS.DIALOG_SAVE_FILE, options),
  showMessageDialog: (options: MessageDialogOptions) =>
    invoke<MessageDialogResult>(IPC_CHANNELS.DIALOG_MESSAGE, options),

  // File watcher
  watchFile: (filePath: string) => invoke<boolean>(IPC_CHANNELS.WATCHER_START, filePath),
  unwatchFile: (filePath: string) => invoke<boolean>(IPC_CHANNELS.WATCHER_STOP, filePath),
  unwatchAll: () => invoke<void>(IPC_CHANNELS.WATCHER_STOP_ALL),

  // Auto-save
  enableAutoSave: (options: AutoSaveOptions) =>
    invoke<boolean>(IPC_CHANNELS.AUTOSAVE_ENABLE, options),
  disableAutoSave: (filePath: string) => invoke<boolean>(IPC_CHANNELS.AUTOSAVE_DISABLE, filePath),
  getRecoveryFiles: () => invoke<RecoveryFileInfo[]>(IPC_CHANNELS.AUTOSAVE_GET_RECOVERY),
  clearRecoveryFile: (recoveryPath: string) =>
    invoke<boolean>(IPC_CHANNELS.AUTOSAVE_CLEAR_RECOVERY, recoveryPath),

  // Backup
  createBackup: (filePath: string, options?: BackupOptions) =>
    invoke<BackupInfo | null>(IPC_CHANNELS.BACKUP_CREATE, filePath, options),
  listBackups: (filePath: string) => invoke<BackupInfo[]>(IPC_CHANNELS.BACKUP_LIST, filePath),
  restoreBackup: (backupId: string) => invoke<boolean>(IPC_CHANNELS.BACKUP_RESTORE, backupId),
  deleteBackup: (backupId: string) => invoke<boolean>(IPC_CHANNELS.BACKUP_DELETE, backupId),

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
  setDocumentEdited: (edited: boolean) => {
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_DOCUMENT_EDITED, edited);
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

  // Auto-update operations
  getUpdateState: () => invoke<UpdateState>(IPC_CHANNELS.UPDATE_GET_STATE),
  getUpdateSettings: () => invoke<UpdateSettings>(IPC_CHANNELS.UPDATE_GET_SETTINGS),
  setUpdateSettings: (settings: Partial<UpdateSettings>) =>
    invoke<UpdateSettings>(IPC_CHANNELS.UPDATE_SET_SETTINGS, settings),
  checkForUpdates: () => invoke<UpdateCheckResult>(IPC_CHANNELS.UPDATE_CHECK_FOR_UPDATES),
  downloadUpdate: () => invoke<{ success: boolean; error?: string }>(IPC_CHANNELS.UPDATE_DOWNLOAD),
  cancelDownload: () =>
    invoke<{ success: boolean; error?: string }>(IPC_CHANNELS.UPDATE_CANCEL_DOWNLOAD),
  installAndRestart: () => {
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL_AND_RESTART);
  },
  installLater: () => invoke<{ success: boolean }>(IPC_CHANNELS.UPDATE_INSTALL_LATER),
  getReleaseNotes: () => invoke<string | null>(IPC_CHANNELS.UPDATE_GET_RELEASE_NOTES),

  // Event listeners
  onFileOpened: (callback: (filePath: string) => void) =>
    createListener(IPC_EVENTS.FILE_OPENED, callback as (...args: unknown[]) => void),
  onFileChanged: (callback: (event: FileWatcherEvent) => void) =>
    createListener(IPC_EVENTS.FILE_CHANGED, callback as (...args: unknown[]) => void),
  onFileDeleted: (callback: (filePath: string) => void) =>
    createListener(IPC_EVENTS.FILE_DELETED, callback as (...args: unknown[]) => void),
  onCloseRequested: (callback: () => Promise<boolean>) => {
    const listener = async () => {
      const canClose = await callback();
      ipcRenderer.send('close-response', canClose);
    };
    ipcRenderer.on(IPC_EVENTS.WINDOW_CLOSE_REQUESTED, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.WINDOW_CLOSE_REQUESTED, listener);
    };
  },
  onAutoSaveTriggered: (callback: (filePath: string) => void) =>
    createListener(IPC_EVENTS.AUTOSAVE_TRIGGERED, callback as (...args: unknown[]) => void),
  onRecoveryAvailable: (callback: (files: RecoveryFileInfo[]) => void) =>
    createListener(IPC_EVENTS.RECOVERY_AVAILABLE, callback as (...args: unknown[]) => void),
  onMenuFileNew: (callback: () => void) => createListener(IPC_EVENTS.MENU_FILE_NEW, callback),
  onMenuFileOpen: (callback: () => void) => createListener(IPC_EVENTS.MENU_FILE_OPEN, callback),
  onMenuFileSave: (callback: () => void) => createListener(IPC_EVENTS.MENU_FILE_SAVE, callback),
  onMenuFileSaveAs: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_FILE_SAVE_AS, callback),
  onMenuFileClose: (callback: () => void) => createListener(IPC_EVENTS.MENU_FILE_CLOSE, callback),
  onMenuEditUndo: (callback: () => void) => createListener(IPC_EVENTS.MENU_EDIT_UNDO, callback),
  onMenuEditRedo: (callback: () => void) => createListener(IPC_EVENTS.MENU_EDIT_REDO, callback),
  onMenuViewZoomIn: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_IN, callback),
  onMenuViewZoomOut: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_OUT, callback),
  onMenuViewZoomReset: (callback: () => void) =>
    createListener(IPC_EVENTS.MENU_VIEW_ZOOM_RESET, callback),
  onBeforeQuit: (callback: () => Promise<boolean>) => {
    const listener = async () => {
      const canQuit = await callback();
      ipcRenderer.send('quit-response', canQuit);
    };
    ipcRenderer.on(IPC_EVENTS.APP_BEFORE_QUIT, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.APP_BEFORE_QUIT, listener);
    };
  },

  // Update event listeners
  onUpdateStateChanged: (callback: (state: UpdateState) => void) =>
    createListener(IPC_EVENTS.UPDATE_STATE_CHANGED, callback as (...args: unknown[]) => void),
  onUpdateAvailable: (callback: (version: string) => void) =>
    createListener(IPC_EVENTS.UPDATE_AVAILABLE, callback as (...args: unknown[]) => void),
  onUpdateDownloaded: (callback: (version: string) => void) =>
    createListener(IPC_EVENTS.UPDATE_DOWNLOADED, callback as (...args: unknown[]) => void),
  onUpdateError: (callback: (error: string) => void) =>
    createListener(IPC_EVENTS.UPDATE_ERROR, callback as (...args: unknown[]) => void),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Log that preload script has loaded (development only)
if (process.env['NODE_ENV'] === 'development') {
  console.log('[Preload] Electron API exposed to renderer');
}
