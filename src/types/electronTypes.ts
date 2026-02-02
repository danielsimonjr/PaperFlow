/**
 * Electron Type Definitions for Renderer Process
 *
 * These types are duplicated from electron/ipc/types.ts to avoid
 * import path issues between the Electron and web codebases.
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
  size?: number;
  thumbnail?: string;
}

/**
 * File stats
 */
export interface FileStats {
  size: number;
  created: number;
  modified: number;
  accessed: number;
  isFile: boolean;
  isDirectory: boolean;
}

/**
 * Folder dialog options
 */
export interface FolderDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
}

/**
 * Folder dialog result
 */
export interface FolderDialogResult {
  canceled: boolean;
  folderPath?: string;
}

/**
 * Folder list options
 */
export interface FolderListOptions {
  extensions?: string[];
  recursive?: boolean;
}

/**
 * Folder list entry
 */
export interface FolderEntry {
  name: string;
  path: string;
  isFile: boolean;
  isDirectory: boolean;
  size?: number;
  modified?: number;
}

/**
 * File watcher event
 */
export interface FileWatcherEvent {
  type: 'change' | 'add' | 'unlink' | 'error';
  path: string;
  stats?: FileStats;
  error?: string;
}

/**
 * Auto-save options
 */
export interface AutoSaveOptions {
  filePath: string;
  interval?: number;
  backupPath?: string;
}

/**
 * Recovery file info
 */
export interface RecoveryFileInfo {
  originalPath: string;
  recoveryPath: string;
  timestamp: number;
  size: number;
}

/**
 * Backup info
 */
export interface BackupInfo {
  id: string;
  originalPath: string;
  backupPath: string;
  timestamp: number;
  size: number;
}

/**
 * Backup options
 */
export interface BackupOptions {
  maxBackups?: number;
  backupDir?: string;
}

/**
 * File write result
 */
export interface FileWriteResult {
  success: boolean;
  error?: string;
}

/**
 * Notification options (basic)
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
}

/**
 * Notification type
 */
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'file-operation'
  | 'batch-operation'
  | 'update';

/**
 * Notification action
 */
export interface NotificationAction {
  id: string;
  text: string;
  type?: 'button';
}

/**
 * Extended notification options
 */
export interface ExtendedNotificationOptions {
  id?: string;
  type?: NotificationType;
  title: string;
  body: string;
  subtitle?: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
  timeoutType?: 'default' | 'never';
  actions?: NotificationAction[];
  closeButtonText?: string;
  hasReply?: boolean;
  replyPlaceholder?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Quiet hours configuration
 */
export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  quietHours: QuietHoursConfig;
  enabledTypes: NotificationType[];
  showWhenFocused: boolean;
  groupSimilar: boolean;
}

/**
 * Notification history entry
 */
export interface NotificationHistory {
  id: string;
  options: ExtendedNotificationOptions;
  timestamp: number;
  read: boolean;
}

/**
 * Tray status types
 */
export type TrayStatus = 'idle' | 'busy' | 'notification' | 'error';

/**
 * Tray status info
 */
export interface TrayStatusInfo {
  status: TrayStatus;
  notificationCount: number;
  isReady: boolean;
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
 * Memory info
 */
export interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

/**
 * Update channel types
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha';

/**
 * Update check frequency
 */
export type UpdateCheckFrequency = 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Update download progress
 */
export interface UpdateDownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

/**
 * Update state
 */
export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadProgress?: UpdateDownloadProgress;
  error?: string;
  lastCheckTime?: number;
}

/**
 * Update settings
 */
export interface UpdateSettings {
  autoUpdate: boolean;
  channel: UpdateChannel;
  checkFrequency: UpdateCheckFrequency;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  success: boolean;
  result?: unknown;
  error?: string;
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

  // Folder operations
  pickFolder: (options?: FolderDialogOptions) => Promise<FolderDialogResult>;
  listFolder: (folderPath: string, options?: FolderListOptions) => Promise<FolderEntry[]>;
  createFolder: (folderPath: string) => Promise<boolean>;

  // Dialog operations
  showOpenDialog: (options?: FileDialogOptions) => Promise<FileDialogResult>;
  showSaveDialog: (options?: SaveDialogOptions) => Promise<SaveDialogResult>;
  showMessageDialog: (options: MessageDialogOptions) => Promise<MessageDialogResult>;

  // File watcher
  watchFile: (filePath: string) => Promise<boolean>;
  unwatchFile: (filePath: string) => Promise<boolean>;
  unwatchAll: () => Promise<void>;

  // Auto-save
  enableAutoSave: (options: AutoSaveOptions) => Promise<boolean>;
  disableAutoSave: (filePath: string) => Promise<boolean>;
  getRecoveryFiles: () => Promise<RecoveryFileInfo[]>;
  clearRecoveryFile: (recoveryPath: string) => Promise<boolean>;

  // Backup
  createBackup: (filePath: string, options?: BackupOptions) => Promise<BackupInfo | null>;
  listBackups: (filePath: string) => Promise<BackupInfo[]>;
  restoreBackup: (backupId: string) => Promise<boolean>;
  deleteBackup: (backupId: string) => Promise<boolean>;

  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isWindowMaximized: () => Promise<boolean>;
  setWindowTitle: (title: string) => void;
  getWindowBounds: () => Promise<WindowBounds>;
  setWindowBounds: (bounds: Partial<WindowBounds>) => void;
  setDocumentEdited: (edited: boolean) => void;

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

  // Notification - Basic
  showNotification: (options: NotificationOptions) => void;

  // Notification - Extended
  showExtendedNotification: (
    options: ExtendedNotificationOptions
  ) => Promise<{ id: string | null }>;
  showSimpleNotification: (
    title: string,
    body: string,
    type?: string
  ) => Promise<{ id: string | null }>;
  showFileOperationNotification: (
    operation: 'save' | 'export' | 'import' | 'open',
    fileName: string,
    success: boolean,
    error?: string
  ) => Promise<{ id: string | null }>;
  showBatchOperationNotification: (
    operation: string,
    successCount: number,
    totalCount: number
  ) => Promise<{ id: string | null }>;
  closeNotification: (id: string) => Promise<{ success: boolean }>;
  closeAllNotifications: () => Promise<{ success: boolean }>;
  getNotificationPreferences: () => Promise<NotificationPreferences>;
  setNotificationPreferences: (
    preferences: Partial<NotificationPreferences>
  ) => Promise<NotificationPreferences>;
  getNotificationHistory: () => Promise<NotificationHistory[]>;
  getUnreadNotificationCount: () => Promise<number>;
  markNotificationRead: (id: string) => Promise<{ success: boolean }>;
  markAllNotificationsRead: () => Promise<{ success: boolean }>;
  clearNotificationHistory: () => Promise<{ success: boolean }>;

  // System Tray
  getTrayStatus: () => Promise<TrayStatusInfo>;
  setTrayStatus: (status: TrayStatus) => Promise<{ success: boolean }>;
  setTrayProgress: (
    operation: string | null,
    percent?: number,
    detail?: string
  ) => Promise<{ success: boolean }>;
  setTrayTooltip: (text: string) => Promise<{ success: boolean }>;
  flashTray: (duration?: number) => Promise<{ success: boolean }>;

  // Dock (macOS)
  setDockBadge: (count: number) => Promise<{ success: boolean; error?: string }>;
  clearDockBadge: () => Promise<{ success: boolean; error?: string }>;
  bounceDock: (type?: 'critical' | 'informational') => Promise<{ success: boolean; error?: string }>;
  getDockBadge: () => Promise<{ count: number }>;

  // System info
  getMemoryInfo: () => Promise<MemoryInfo>;

  // Event listeners
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onFileChanged: (callback: (event: FileWatcherEvent) => void) => () => void;
  onFileDeleted: (callback: (filePath: string) => void) => () => void;
  onCloseRequested: (callback: () => Promise<boolean>) => () => void;
  onAutoSaveTriggered: (callback: (filePath: string) => void) => () => void;
  onRecoveryAvailable: (callback: (files: RecoveryFileInfo[]) => void) => () => void;
  onMenuFileNew: (callback: () => void) => () => void;
  onMenuFileOpen: (callback: () => void) => () => void;
  onMenuFileSave: (callback: () => void) => () => void;
  onMenuFileSaveAs: (callback: () => void) => () => void;
  onMenuFileClose: (callback: () => void) => () => void;
  onMenuEditUndo: (callback: () => void) => () => void;
  onMenuEditRedo: (callback: () => void) => () => void;
  onMenuViewZoomIn: (callback: () => void) => () => void;
  onMenuViewZoomOut: (callback: () => void) => () => void;
  onMenuViewZoomReset: (callback: () => void) => () => void;
  onBeforeQuit: (callback: () => Promise<boolean>) => () => void;

  // Auto-update operations
  getUpdateState: () => Promise<UpdateState>;
  getUpdateSettings: () => Promise<UpdateSettings>;
  setUpdateSettings: (settings: Partial<UpdateSettings>) => Promise<UpdateSettings>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  cancelDownload: () => Promise<{ success: boolean; error?: string }>;
  installAndRestart: () => void;
  installLater: () => Promise<{ success: boolean }>;
  getReleaseNotes: () => Promise<string | null>;

  // Update event listeners
  onUpdateStateChanged: (callback: (state: UpdateState) => void) => () => void;
  onUpdateAvailable: (callback: (version: string) => void) => () => void;
  onUpdateDownloaded: (callback: (version: string) => void) => () => void;
  onUpdateError: (callback: (error: string) => void) => () => void;

  // Notification event listeners
  onNotificationClicked: (callback: (id: string) => void) => () => void;
  onNotificationClosed: (callback: (id: string) => void) => () => void;
  onNotificationAction: (callback: (id: string, actionId: string) => void) => () => void;

  // Tray event listeners
  onTrayClicked: (callback: () => void) => () => void;
  onTrayDoubleClicked: (callback: () => void) => () => void;
  onTrayRightClicked: (callback: () => void) => () => void;

  // Window visibility event listeners
  onWindowHidden: (callback: () => void) => () => void;
  onWindowShown: (callback: () => void) => () => void;
}

/**
 * Augment the Window interface to include Electron API
 */
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
