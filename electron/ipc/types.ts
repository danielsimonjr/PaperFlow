/**
 * IPC Type Definitions
 *
 * TypeScript types for IPC communication between main and renderer processes.
 * These types are used by both the preload script and the renderer process.
 */

/**
 * Platform information returned by getPlatformInfo
 */
export interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  version: string;
  isPackaged: boolean;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

/**
 * App path information returned by getAppPath
 */
export interface AppPathInfo {
  appPath: string;
  userData: string;
  temp: string;
  documents: string;
  downloads: string;
}

/**
 * File dialog options
 */
export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  multiSelections?: boolean;
}

/**
 * File dialog result
 */
export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

/**
 * Save dialog options
 */
export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/**
 * Save dialog result
 */
export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

/**
 * Message dialog options
 */
export interface MessageDialogOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

/**
 * Message dialog result
 */
export interface MessageDialogResult {
  response: number;
}

/**
 * Window bounds
 */
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Recent file entry
 */
export interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
}

/**
 * Notification options
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
}

/**
 * File read options
 */
export interface FileReadOptions {
  encoding?: BufferEncoding;
}

/**
 * File read result
 */
export interface FileReadResult {
  success: boolean;
  data?: string | Buffer;
  error?: string;
}

/**
 * File write options
 */
export interface FileWriteOptions {
  encoding?: BufferEncoding;
}

/**
 * File write result
 */
export interface FileWriteResult {
  success: boolean;
  error?: string;
}

/**
 * Memory info
 */
export interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

/**
 * Electron API exposed to renderer via contextBridge
 */
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
  fileExists: (filePath: string) => Promise<boolean>;
  getRecentFiles: () => Promise<RecentFile[]>;
  addRecentFile: (filePath: string) => Promise<void>;
  clearRecentFiles: () => Promise<void>;

  // Dialog operations
  showOpenDialog: (options?: FileDialogOptions) => Promise<FileDialogResult>;
  showSaveDialog: (options?: SaveDialogOptions) => Promise<SaveDialogResult>;
  showMessageDialog: (options: MessageDialogOptions) => Promise<MessageDialogResult>;

  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  setWindowTitle: (title: string) => void;
  getWindowBounds: () => Promise<WindowBounds>;
  setWindowBounds: (bounds: Partial<WindowBounds>) => void;

  // Shell operations
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<string>;
  showItemInFolder: (path: string) => void;
  trashItem: (path: string) => Promise<void>;

  // Clipboard operations
  readClipboardText: () => Promise<string>;
  writeClipboardText: (text: string) => void;
  readClipboardImage: () => Promise<string | null>;
  writeClipboardImage: (dataUrl: string) => void;

  // Notification
  showNotification: (options: NotificationOptions) => void;

  // System info
  getMemoryInfo: () => Promise<MemoryInfo>;

  // Event listeners
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onMenuFileNew: (callback: () => void) => () => void;
  onMenuFileOpen: (callback: () => void) => () => void;
  onMenuFileSave: (callback: () => void) => () => void;
  onMenuFileSaveAs: (callback: () => void) => () => void;
  onMenuEditUndo: (callback: () => void) => () => void;
  onMenuEditRedo: (callback: () => void) => () => void;
  onMenuViewZoomIn: (callback: () => void) => () => void;
  onMenuViewZoomOut: (callback: () => void) => () => void;
  onMenuViewZoomReset: (callback: () => void) => () => void;
  onBeforeQuit: (callback: () => void) => () => void;
}

/**
 * Augment the Window interface to include Electron API
 */
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
