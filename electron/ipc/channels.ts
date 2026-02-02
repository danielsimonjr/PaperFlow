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
  FILE_EXISTS: 'file-exists',
  FILE_GET_RECENT: 'file-get-recent',
  FILE_ADD_RECENT: 'file-add-recent',
  FILE_CLEAR_RECENT: 'file-clear-recent',

  // Dialog operations
  DIALOG_OPEN_FILE: 'dialog-open-file',
  DIALOG_SAVE_FILE: 'dialog-save-file',
  DIALOG_MESSAGE: 'dialog-message',

  // Window operations
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  WINDOW_IS_MAXIMIZED: 'window-is-maximized',
  WINDOW_SET_TITLE: 'window-set-title',
  WINDOW_GET_BOUNDS: 'window-get-bounds',
  WINDOW_SET_BOUNDS: 'window-set-bounds',

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
} as const;

/**
 * IPC Events (main -> renderer)
 */
export const IPC_EVENTS = {
  // File events
  FILE_OPENED: 'file-opened',
  FILE_SAVED: 'file-saved',

  // Window events
  WINDOW_FOCUS: 'window-focus',
  WINDOW_BLUR: 'window-blur',
  WINDOW_ENTER_FULLSCREEN: 'window-enter-fullscreen',
  WINDOW_LEAVE_FULLSCREEN: 'window-leave-fullscreen',

  // App events
  APP_BEFORE_QUIT: 'app-before-quit',
  APP_SECOND_INSTANCE: 'app-second-instance',

  // Menu events
  MENU_FILE_NEW: 'menu-file-new',
  MENU_FILE_OPEN: 'menu-file-open',
  MENU_FILE_SAVE: 'menu-file-save',
  MENU_FILE_SAVE_AS: 'menu-file-save-as',
  MENU_EDIT_UNDO: 'menu-edit-undo',
  MENU_EDIT_REDO: 'menu-edit-redo',
  MENU_VIEW_ZOOM_IN: 'menu-view-zoom-in',
  MENU_VIEW_ZOOM_OUT: 'menu-view-zoom-out',
  MENU_VIEW_ZOOM_RESET: 'menu-view-zoom-reset',
  MENU_VIEW_FULLSCREEN: 'menu-view-fullscreen',
} as const;

/**
 * Channel type for TypeScript
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
export type IpcEvent = (typeof IPC_EVENTS)[keyof typeof IPC_EVENTS];
