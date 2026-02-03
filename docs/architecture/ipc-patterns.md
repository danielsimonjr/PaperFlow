# IPC Communication Patterns

This document describes the Inter-Process Communication (IPC) patterns used in PaperFlow's Electron desktop application.

## Overview

PaperFlow uses Electron's IPC system to enable communication between the main process (Node.js) and renderer process (React app). All communication is type-safe and goes through the preload script using `contextBridge`.

## Architecture

```
+-------------------+     +-------------------+     +-------------------+
|  Renderer Process |     |   Preload Script  |     |   Main Process    |
|  (React App)      |     |   (contextBridge) |     |   (Node.js)       |
+-------------------+     +-------------------+     +-------------------+
         |                        |                        |
         |  window.electron.xxx() |                        |
         |----------------------->|                        |
         |                        |  ipcRenderer.invoke()  |
         |                        |----------------------->|
         |                        |                        |
         |                        |    ipcMain.handle()    |
         |                        |        Process         |
         |                        |                        |
         |                        |<-----------------------|
         |<-----------------------|       Response         |
         |                        |                        |
```

## Channel Types

### 1. Request-Response (invoke/handle)

For operations that return a result:

```typescript
// Main process (ipc/handlers.ts)
ipcMain.handle('file:read', async (event, filePath: string) => {
  const data = await fs.promises.readFile(filePath);
  return { success: true, data: data.buffer };
});

// Preload (preload/index.ts)
contextBridge.exposeInMainWorld('electron', {
  readFile: (filePath: string) =>
    ipcRenderer.invoke('file:read', filePath),
});

// Renderer usage
const result = await window.electron.readFile('/path/to/file.pdf');
```

### 2. One-Way Events (send/on)

For notifications from main to renderer:

```typescript
// Main process
mainWindow.webContents.send('update:available', version);

// Preload
contextBridge.exposeInMainWorld('electron', {
  onUpdateAvailable: (callback: (version: string) => void) => {
    const listener = (_event: IpcRendererEvent, version: string) => {
      callback(version);
    };
    ipcRenderer.on('update:available', listener);
    return () => ipcRenderer.removeListener('update:available', listener);
  },
});

// Renderer usage
const unsubscribe = window.electron.onUpdateAvailable((version) => {
  console.log('Update available:', version);
});
// Later: unsubscribe();
```

### 3. Bidirectional with Confirmation

For operations requiring renderer confirmation:

```typescript
// Main process
ipcMain.on('close-response', (event, canClose: boolean) => {
  if (canClose) {
    mainWindow.destroy();
  }
});

// When closing is requested
mainWindow.webContents.send('window:closeRequested');

// Preload
contextBridge.exposeInMainWorld('electron', {
  onCloseRequested: (callback: () => Promise<boolean>) => {
    const listener = async () => {
      const canClose = await callback();
      ipcRenderer.send('close-response', canClose);
    };
    ipcRenderer.on('window:closeRequested', listener);
    return () => ipcRenderer.removeListener('window:closeRequested', listener);
  },
});
```

## Channel Naming Convention

Channels follow a `category:action` pattern:

```typescript
export const IPC_CHANNELS = {
  // File operations
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_SAVE: 'file:save',
  FILE_EXISTS: 'file:exists',
  FILE_DELETE: 'file:delete',
  FILE_COPY: 'file:copy',
  FILE_MOVE: 'file:move',
  FILE_GET_STATS: 'file:getStats',
  FILE_GET_RECENT: 'file:getRecent',
  FILE_ADD_RECENT: 'file:addRecent',
  FILE_REMOVE_RECENT: 'file:removeRecent',
  FILE_CLEAR_RECENT: 'file:clearRecent',

  // Dialog operations
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',
  DIALOG_MESSAGE: 'dialog:message',

  // Folder operations
  FOLDER_PICK: 'folder:pick',
  FOLDER_LIST: 'folder:list',
  FOLDER_CREATE: 'folder:create',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',
  WINDOW_SET_TITLE: 'window:setTitle',
  WINDOW_GET_BOUNDS: 'window:getBounds',
  WINDOW_SET_BOUNDS: 'window:setBounds',
  WINDOW_SET_DOCUMENT_EDITED: 'window:setDocumentEdited',

  // File watcher
  WATCHER_START: 'watcher:start',
  WATCHER_STOP: 'watcher:stop',
  WATCHER_STOP_ALL: 'watcher:stopAll',

  // Auto-save
  AUTOSAVE_ENABLE: 'autosave:enable',
  AUTOSAVE_DISABLE: 'autosave:disable',
  AUTOSAVE_GET_RECOVERY: 'autosave:getRecovery',
  AUTOSAVE_CLEAR_RECOVERY: 'autosave:clearRecovery',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_LIST: 'backup:list',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_DELETE: 'backup:delete',

  // Shell operations
  SHELL_OPEN_EXTERNAL: 'shell:openExternal',
  SHELL_OPEN_PATH: 'shell:openPath',
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell:showItemInFolder',
  SHELL_TRASH_ITEM: 'shell:trashItem',

  // Clipboard
  CLIPBOARD_READ_TEXT: 'clipboard:readText',
  CLIPBOARD_WRITE_TEXT: 'clipboard:writeText',
  CLIPBOARD_READ_IMAGE: 'clipboard:readImage',
  CLIPBOARD_WRITE_IMAGE: 'clipboard:writeImage',

  // Notifications
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_SHOW_EXTENDED: 'notification:showExtended',
  NOTIFICATION_SHOW_SIMPLE: 'notification:showSimple',
  NOTIFICATION_FILE_OPERATION: 'notification:fileOperation',
  NOTIFICATION_BATCH_OPERATION: 'notification:batchOperation',
  NOTIFICATION_CLOSE: 'notification:close',
  NOTIFICATION_CLOSE_ALL: 'notification:closeAll',
  NOTIFICATION_GET_PREFERENCES: 'notification:getPreferences',
  NOTIFICATION_SET_PREFERENCES: 'notification:setPreferences',
  NOTIFICATION_GET_HISTORY: 'notification:getHistory',
  NOTIFICATION_GET_UNREAD_COUNT: 'notification:getUnreadCount',
  NOTIFICATION_MARK_READ: 'notification:markRead',
  NOTIFICATION_MARK_ALL_READ: 'notification:markAllRead',
  NOTIFICATION_CLEAR_HISTORY: 'notification:clearHistory',

  // System tray
  TRAY_GET_STATUS: 'tray:getStatus',
  TRAY_SET_STATUS: 'tray:setStatus',
  TRAY_SET_PROGRESS: 'tray:setProgress',
  TRAY_SET_TOOLTIP: 'tray:setTooltip',
  TRAY_FLASH: 'tray:flash',

  // Dock (macOS)
  DOCK_SET_BADGE: 'dock:setBadge',
  DOCK_CLEAR_BADGE: 'dock:clearBadge',
  DOCK_BOUNCE: 'dock:bounce',
  DOCK_GET_BADGE: 'dock:getBadge',

  // Menu
  MENU_UPDATE_STATE: 'menu:updateState',
  MENU_GET_STATE: 'menu:getState',
  CONTEXT_MENU_SHOW_DOCUMENT: 'contextMenu:showDocument',
  CONTEXT_MENU_SHOW_ANNOTATION: 'contextMenu:showAnnotation',

  // Shortcuts
  SHORTCUTS_GET_CUSTOM: 'shortcuts:getCustom',
  SHORTCUTS_SET_CUSTOM: 'shortcuts:setCustom',
  SHORTCUTS_RESET_DEFAULTS: 'shortcuts:resetDefaults',

  // Auto-update
  UPDATE_GET_STATE: 'update:getState',
  UPDATE_GET_SETTINGS: 'update:getSettings',
  UPDATE_SET_SETTINGS: 'update:setSettings',
  UPDATE_CHECK_FOR_UPDATES: 'update:checkForUpdates',
  UPDATE_DOWNLOAD: 'update:download',
  UPDATE_CANCEL_DOWNLOAD: 'update:cancelDownload',
  UPDATE_INSTALL_AND_RESTART: 'update:installAndRestart',
  UPDATE_INSTALL_LATER: 'update:installLater',
  UPDATE_GET_RELEASE_NOTES: 'update:getReleaseNotes',

  // Platform info
  GET_PLATFORM_INFO: 'platform:getInfo',
  GET_APP_PATH: 'app:getPath',
  GET_APP_VERSION: 'app:getVersion',

  // System info
  SYSTEM_GET_MEMORY_INFO: 'system:getMemoryInfo',
} as const;
```

## Event Channel Names

Events from main process to renderer:

```typescript
export const IPC_EVENTS = {
  // File events
  FILE_OPENED: 'file:opened',
  FILE_CHANGED: 'file:changed',
  FILE_DELETED: 'file:deleted',

  // Window events
  WINDOW_CLOSE_REQUESTED: 'window:closeRequested',
  WINDOW_HIDDEN: 'window:hidden',
  WINDOW_SHOWN: 'window:shown',

  // Auto-save events
  AUTOSAVE_TRIGGERED: 'autosave:triggered',
  RECOVERY_AVAILABLE: 'recovery:available',

  // Menu events
  MENU_FILE_NEW: 'menu:file:new',
  MENU_FILE_OPEN: 'menu:file:open',
  MENU_FILE_SAVE: 'menu:file:save',
  MENU_FILE_SAVE_AS: 'menu:file:saveAs',
  MENU_FILE_CLOSE: 'menu:file:close',
  MENU_FILE_PRINT: 'menu:file:print',
  MENU_EDIT_UNDO: 'menu:edit:undo',
  MENU_EDIT_REDO: 'menu:edit:redo',
  MENU_EDIT_FIND: 'menu:edit:find',
  MENU_VIEW_ZOOM_IN: 'menu:view:zoomIn',
  MENU_VIEW_ZOOM_OUT: 'menu:view:zoomOut',
  MENU_VIEW_ZOOM_RESET: 'menu:view:zoomReset',
  MENU_VIEW_FIT_WIDTH: 'menu:view:fitWidth',
  MENU_VIEW_FIT_PAGE: 'menu:view:fitPage',
  MENU_VIEW_MODE: 'menu:view:mode',
  MENU_VIEW_TOGGLE_SIDEBAR: 'menu:view:toggleSidebar',
  MENU_VIEW_TOGGLE_TOOLBAR: 'menu:view:toggleToolbar',
  MENU_DOCUMENT_GO_TO_PAGE: 'menu:document:goToPage',
  MENU_DOCUMENT_FIRST_PAGE: 'menu:document:firstPage',
  MENU_DOCUMENT_PREVIOUS_PAGE: 'menu:document:previousPage',
  MENU_DOCUMENT_NEXT_PAGE: 'menu:document:nextPage',
  MENU_DOCUMENT_LAST_PAGE: 'menu:document:lastPage',
  MENU_DOCUMENT_ROTATE_LEFT: 'menu:document:rotateLeft',
  MENU_DOCUMENT_ROTATE_RIGHT: 'menu:document:rotateRight',
  MENU_DOCUMENT_PROPERTIES: 'menu:document:properties',
  MENU_ANNOTATION_HIGHLIGHT: 'menu:annotation:highlight',
  MENU_ANNOTATION_UNDERLINE: 'menu:annotation:underline',
  MENU_ANNOTATION_STRIKETHROUGH: 'menu:annotation:strikethrough',
  MENU_ANNOTATION_NOTE: 'menu:annotation:note',
  MENU_ANNOTATION_DRAWING: 'menu:annotation:drawing',
  MENU_HELP_SHORTCUTS: 'menu:help:shortcuts',
  MENU_HELP_ABOUT: 'menu:help:about',
  MENU_PREFERENCES: 'menu:preferences',

  // Context menu events
  CONTEXT_MENU_DOCUMENT: 'contextMenu:document',
  CONTEXT_MENU_ANNOTATION: 'contextMenu:annotation',

  // Update events
  UPDATE_STATE_CHANGED: 'update:stateChanged',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',

  // Notification events
  NOTIFICATION_CLICKED: 'notification:clicked',
  NOTIFICATION_CLOSED: 'notification:closed',
  NOTIFICATION_ACTION: 'notification:action',

  // Tray events
  TRAY_CLICKED: 'tray:clicked',
  TRAY_DOUBLE_CLICKED: 'tray:doubleClicked',
  TRAY_RIGHT_CLICKED: 'tray:rightClicked',

  // App lifecycle
  APP_BEFORE_QUIT: 'app:beforeQuit',
} as const;
```

## Type Definitions

All IPC operations use TypeScript types for safety:

```typescript
// ipc/types.ts

export interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  version: string;
  isPackaged: boolean;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

export interface AppPathInfo {
  appPath: string;
  userData: string;
  temp: string;
  documents: string;
  downloads: string;
}

export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
}

export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
  data?: ArrayBuffer;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface FileReadResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

export interface FileWriteResult {
  success: boolean;
  error?: string;
}

export interface FileStats {
  size: number;
  created: number;
  modified: number;
  accessed: number;
  isFile: boolean;
  isDirectory: boolean;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
}

export interface FileWatcherEvent {
  type: 'change' | 'delete' | 'rename';
  path: string;
  newPath?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
}

export interface ExtendedNotificationOptions extends NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error';
  actions?: Array<{ id: string; title: string }>;
  urgency?: 'normal' | 'critical' | 'low';
  timeout?: number;
}

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';
  version?: string;
  releaseNotes?: string;
  progress?: {
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  };
  error?: string;
}

export interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  checkInterval: 'hourly' | 'daily' | 'weekly';
  channel: 'stable' | 'beta' | 'alpha';
}

// Complete API interface
export interface ElectronAPI {
  // Platform info
  getPlatformInfo: () => Promise<PlatformInfo>;
  getAppPath: () => Promise<AppPathInfo>;
  getAppVersion: () => Promise<string>;

  // File operations
  openFile: () => Promise<FileDialogResult>;
  saveFile: (data: Uint8Array, defaultPath?: string) => Promise<SaveDialogResult>;
  saveFileAs: (data: Uint8Array, defaultPath?: string) => Promise<SaveDialogResult>;
  readFile: (filePath: string, options?: FileReadOptions) => Promise<FileReadResult>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<FileWriteResult>;
  fileExists: (filePath: string) => Promise<boolean>;
  getFileStats: (filePath: string) => Promise<FileStats | null>;
  deleteFile: (filePath: string) => Promise<boolean>;
  copyFile: (src: string, dest: string) => Promise<boolean>;
  moveFile: (src: string, dest: string) => Promise<boolean>;

  // Recent files
  getRecentFiles: () => Promise<RecentFile[]>;
  addRecentFile: (filePath: string) => Promise<void>;
  removeRecentFile: (filePath: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;

  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  setWindowTitle: (title: string) => void;
  setDocumentEdited: (edited: boolean) => void;

  // ... many more methods

  // Event listeners (all return unsubscribe function)
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onFileChanged: (callback: (event: FileWatcherEvent) => void) => () => void;
  onMenuFileNew: (callback: () => void) => () => void;
  onMenuFileSave: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  // ... many more event listeners
}
```

## Best Practices

### 1. Always Return Unsubscribe Functions

```typescript
// In preload
onSomeEvent: (callback: (data: T) => void) => {
  const listener = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on('some:event', listener);
  return () => ipcRenderer.removeListener('some:event', listener);
},

// In React component
useEffect(() => {
  const unsubscribe = window.electron.onSomeEvent(handleEvent);
  return () => unsubscribe();
}, []);
```

### 2. Use Type Guards in Handlers

```typescript
ipcMain.handle('file:read', async (event, filePath: unknown) => {
  if (typeof filePath !== 'string') {
    return { success: false, error: 'Invalid file path' };
  }
  // Process...
});
```

### 3. Validate Paths for Security

```typescript
import path from 'path';

function isPathAllowed(filePath: string, allowedDirs: string[]): boolean {
  const normalized = path.normalize(filePath);
  return allowedDirs.some(dir => normalized.startsWith(dir));
}
```

### 4. Handle Errors Gracefully

```typescript
ipcMain.handle('file:read', async (event, filePath: string) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return { success: true, data: data.buffer };
  } catch (error) {
    console.error('Failed to read file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});
```

### 5. Use Consistent Response Formats

```typescript
interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// All handlers return same shape
ipcMain.handle('operation', async () => {
  try {
    const result = await doOperation();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## Debugging IPC

Enable IPC logging in development:

```typescript
// main/index.ts
if (isDev) {
  const originalHandle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = function (channel: string, listener) {
    return originalHandle(channel, async (event, ...args) => {
      console.log(`[IPC] ${channel}`, args);
      const result = await listener(event, ...args);
      console.log(`[IPC] ${channel} -> `, result);
      return result;
    });
  };
}
```
