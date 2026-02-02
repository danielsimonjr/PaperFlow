/**
 * IPC Channel Definitions
 *
 * Centralized definitions for all IPC channels used in the application.
 * This ensures type safety and prevents typos in channel names.
 */

/**
 * IPC Channels for main process handlers
 */
export const IPC_CHANNELS = {
  // Platform and app info
  GET_PLATFORM_INFO: 'get-platform-info',
  GET_APP_PATH: 'get-app-path',
  GET_APP_VERSION: 'get-app-version',

  // File operations
  FILE_OPEN: 'file-open',
  FILE_SAVE: 'file-save',
  FILE_SAVE_AS: 'file-save-as',
  FILE_READ: 'file-read',
  FILE_WRITE: 'file-write',
  FILE_EXISTS: 'file-exists',
  FILE_GET_STATS: 'file-get-stats',
  FILE_DELETE: 'file-delete',
  FILE_COPY: 'file-copy',
  FILE_MOVE: 'file-move',
  FILE_GET_RECENT: 'file-get-recent',
  FILE_ADD_RECENT: 'file-add-recent',
  FILE_REMOVE_RECENT: 'file-remove-recent',
  FILE_CLEAR_RECENT: 'file-clear-recent',

  // Folder operations
  FOLDER_PICK: 'folder-pick',
  FOLDER_LIST: 'folder-list',
  FOLDER_CREATE: 'folder-create',

  // Dialog operations
  DIALOG_OPEN_FILE: 'dialog-open-file',
  DIALOG_SAVE_FILE: 'dialog-save-file',
  DIALOG_MESSAGE: 'dialog-message',

  // File watcher operations
  WATCHER_START: 'watcher-start',
  WATCHER_STOP: 'watcher-stop',
  WATCHER_STOP_ALL: 'watcher-stop-all',

  // Auto-save operations
  AUTOSAVE_ENABLE: 'autosave-enable',
  AUTOSAVE_DISABLE: 'autosave-disable',
  AUTOSAVE_GET_RECOVERY: 'autosave-get-recovery',
  AUTOSAVE_CLEAR_RECOVERY: 'autosave-clear-recovery',

  // Backup operations
  BACKUP_CREATE: 'backup-create',
  BACKUP_LIST: 'backup-list',
  BACKUP_RESTORE: 'backup-restore',
  BACKUP_DELETE: 'backup-delete',

  // Window operations
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  WINDOW_IS_MAXIMIZED: 'window-is-maximized',
  WINDOW_SET_TITLE: 'window-set-title',
  WINDOW_GET_BOUNDS: 'window-get-bounds',
  WINDOW_SET_BOUNDS: 'window-set-bounds',
  WINDOW_SET_DOCUMENT_EDITED: 'window-set-document-edited',

  // Shell operations
  SHELL_OPEN_EXTERNAL: 'shell-open-external',
  SHELL_OPEN_PATH: 'shell-open-path',
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell-show-item-in-folder',
  SHELL_TRASH_ITEM: 'shell-trash-item',

  // Clipboard operations
  CLIPBOARD_READ_TEXT: 'clipboard-read-text',
  CLIPBOARD_WRITE_TEXT: 'clipboard-write-text',
  CLIPBOARD_READ_IMAGE: 'clipboard-read-image',
  CLIPBOARD_WRITE_IMAGE: 'clipboard-write-image',

  // Notification
  NOTIFICATION_SHOW: 'notification-show',

  // System
  SYSTEM_GET_MEMORY_INFO: 'system-get-memory-info',
  SYSTEM_GET_CPU_USAGE: 'system-get-cpu-usage',

  // Auto-updater
  UPDATE_GET_STATE: 'update-get-state',
  UPDATE_GET_SETTINGS: 'update-get-settings',
  UPDATE_SET_SETTINGS: 'update-set-settings',
  UPDATE_CHECK_FOR_UPDATES: 'update-check-for-updates',
  UPDATE_DOWNLOAD: 'update-download',
  UPDATE_CANCEL_DOWNLOAD: 'update-cancel-download',
  UPDATE_INSTALL_AND_RESTART: 'update-install-and-restart',
  UPDATE_INSTALL_LATER: 'update-install-later',
  UPDATE_GET_RELEASE_NOTES: 'update-get-release-notes',
} as const;

/**
 * IPC Events (main -> renderer)
 */
export const IPC_EVENTS = {
  // File events
  FILE_OPENED: 'file-opened',
  FILE_SAVED: 'file-saved',
  FILE_CHANGED: 'file-changed',
  FILE_DELETED: 'file-deleted',
  FILE_ERROR: 'file-error',

  // Window events
  WINDOW_FOCUS: 'window-focus',
  WINDOW_BLUR: 'window-blur',
  WINDOW_ENTER_FULLSCREEN: 'window-enter-fullscreen',
  WINDOW_LEAVE_FULLSCREEN: 'window-leave-fullscreen',
  WINDOW_CLOSE_REQUESTED: 'window-close-requested',

  // App events
  APP_BEFORE_QUIT: 'app-before-quit',
  APP_SECOND_INSTANCE: 'app-second-instance',

  // Auto-save events
  AUTOSAVE_TRIGGERED: 'autosave-triggered',
  AUTOSAVE_COMPLETED: 'autosave-completed',
  AUTOSAVE_FAILED: 'autosave-failed',
  RECOVERY_AVAILABLE: 'recovery-available',

  // Menu events
  MENU_FILE_NEW: 'menu-file-new',
  MENU_FILE_OPEN: 'menu-file-open',
  MENU_FILE_SAVE: 'menu-file-save',
  MENU_FILE_SAVE_AS: 'menu-file-save-as',
  MENU_FILE_CLOSE: 'menu-file-close',
  MENU_EDIT_UNDO: 'menu-edit-undo',
  MENU_EDIT_REDO: 'menu-edit-redo',
  MENU_VIEW_ZOOM_IN: 'menu-view-zoom-in',
  MENU_VIEW_ZOOM_OUT: 'menu-view-zoom-out',
  MENU_VIEW_ZOOM_RESET: 'menu-view-zoom-reset',
  MENU_VIEW_FULLSCREEN: 'menu-view-fullscreen',

  // Update events
  UPDATE_STATE_CHANGED: 'update-state-changed',
  UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_ERROR: 'update-error',
} as const;

/**
 * Channel type for TypeScript
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
export type IpcEvent = (typeof IPC_EVENTS)[keyof typeof IPC_EVENTS];
