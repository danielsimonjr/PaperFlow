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

  // Notification - Basic
  NOTIFICATION_SHOW: 'notification-show',

  // Notification - Extended
  NOTIFICATION_SHOW_EXTENDED: 'notification-show-extended',
  NOTIFICATION_SHOW_SIMPLE: 'notification-show-simple',
  NOTIFICATION_FILE_OPERATION: 'notification-file-operation',
  NOTIFICATION_BATCH_OPERATION: 'notification-batch-operation',
  NOTIFICATION_CLOSE: 'notification-close',
  NOTIFICATION_CLOSE_ALL: 'notification-close-all',
  NOTIFICATION_GET_PREFERENCES: 'notification-get-preferences',
  NOTIFICATION_SET_PREFERENCES: 'notification-set-preferences',
  NOTIFICATION_GET_HISTORY: 'notification-get-history',
  NOTIFICATION_GET_UNREAD_COUNT: 'notification-get-unread-count',
  NOTIFICATION_MARK_READ: 'notification-mark-read',
  NOTIFICATION_MARK_ALL_READ: 'notification-mark-all-read',
  NOTIFICATION_CLEAR_HISTORY: 'notification-clear-history',

  // System Tray
  TRAY_GET_STATUS: 'tray-get-status',
  TRAY_SET_STATUS: 'tray-set-status',
  TRAY_SET_PROGRESS: 'tray-set-progress',
  TRAY_SET_TOOLTIP: 'tray-set-tooltip',
  TRAY_FLASH: 'tray-flash',

  // Dock (macOS)
  DOCK_SET_BADGE: 'dock-set-badge',
  DOCK_CLEAR_BADGE: 'dock-clear-badge',
  DOCK_BOUNCE: 'dock-bounce',
  DOCK_GET_BADGE: 'dock-get-badge',

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

  // Menu state
  MENU_UPDATE_STATE: 'menu-update-state',
  MENU_GET_STATE: 'menu-get-state',

  // Context menu
  CONTEXT_MENU_SHOW_DOCUMENT: 'context-menu-show-document',
  CONTEXT_MENU_SHOW_ANNOTATION: 'context-menu-show-annotation',

  // Global shortcuts
  SHORTCUTS_REGISTER_GLOBAL: 'shortcuts-register-global',
  SHORTCUTS_UNREGISTER_GLOBAL: 'shortcuts-unregister-global',
  SHORTCUTS_GET_CUSTOM: 'shortcuts-get-custom',
  SHORTCUTS_SET_CUSTOM: 'shortcuts-set-custom',
  SHORTCUTS_RESET_DEFAULTS: 'shortcuts-reset-defaults',
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

  // Menu events - File
  MENU_FILE_NEW: 'menu-file-new',
  MENU_FILE_NEW_WINDOW: 'menu-file-new-window',
  MENU_FILE_OPEN: 'menu-file-open',
  MENU_FILE_SAVE: 'menu-file-save',
  MENU_FILE_SAVE_AS: 'menu-file-save-as',
  MENU_FILE_CLOSE: 'menu-file-close',
  MENU_FILE_PRINT: 'menu-file-print',
  MENU_FILE_EXPORT_IMAGES: 'menu-file-export-images',
  MENU_FILE_EXPORT_TEXT: 'menu-file-export-text',

  // Menu events - Edit
  MENU_EDIT_UNDO: 'menu-edit-undo',
  MENU_EDIT_REDO: 'menu-edit-redo',
  MENU_EDIT_FIND: 'menu-edit-find',
  MENU_EDIT_FIND_NEXT: 'menu-edit-find-next',
  MENU_EDIT_FIND_PREVIOUS: 'menu-edit-find-previous',

  // Menu events - View
  MENU_VIEW_ZOOM_IN: 'menu-view-zoom-in',
  MENU_VIEW_ZOOM_OUT: 'menu-view-zoom-out',
  MENU_VIEW_ZOOM_RESET: 'menu-view-zoom-reset',
  MENU_VIEW_FIT_WIDTH: 'menu-view-fit-width',
  MENU_VIEW_FIT_PAGE: 'menu-view-fit-page',
  MENU_VIEW_MODE: 'menu-view-mode',
  MENU_VIEW_TOGGLE_SIDEBAR: 'menu-view-toggle-sidebar',
  MENU_VIEW_TOGGLE_TOOLBAR: 'menu-view-toggle-toolbar',
  MENU_VIEW_FULLSCREEN: 'menu-view-fullscreen',

  // Menu events - Document
  MENU_DOCUMENT_GO_TO_PAGE: 'menu-document-go-to-page',
  MENU_DOCUMENT_FIRST_PAGE: 'menu-document-first-page',
  MENU_DOCUMENT_PREVIOUS_PAGE: 'menu-document-previous-page',
  MENU_DOCUMENT_NEXT_PAGE: 'menu-document-next-page',
  MENU_DOCUMENT_LAST_PAGE: 'menu-document-last-page',
  MENU_DOCUMENT_ROTATE_LEFT: 'menu-document-rotate-left',
  MENU_DOCUMENT_ROTATE_RIGHT: 'menu-document-rotate-right',
  MENU_DOCUMENT_INSERT_PAGE: 'menu-document-insert-page',
  MENU_DOCUMENT_DELETE_PAGE: 'menu-document-delete-page',
  MENU_DOCUMENT_EXTRACT_PAGES: 'menu-document-extract-pages',
  MENU_DOCUMENT_PROPERTIES: 'menu-document-properties',

  // Menu events - Annotations
  MENU_ANNOTATION_HIGHLIGHT: 'menu-annotation-highlight',
  MENU_ANNOTATION_UNDERLINE: 'menu-annotation-underline',
  MENU_ANNOTATION_STRIKETHROUGH: 'menu-annotation-strikethrough',
  MENU_ANNOTATION_NOTE: 'menu-annotation-note',
  MENU_ANNOTATION_DRAWING: 'menu-annotation-drawing',
  MENU_ANNOTATION_SHAPE: 'menu-annotation-shape',

  // Menu events - Help
  MENU_HELP_SHORTCUTS: 'menu-help-shortcuts',
  MENU_HELP_RELEASE_NOTES: 'menu-help-release-notes',
  MENU_HELP_CHECK_UPDATES: 'menu-help-check-updates',
  MENU_HELP_ABOUT: 'menu-help-about',

  // Menu events - Preferences
  MENU_PREFERENCES: 'menu-preferences',

  // Context menu events
  CONTEXT_MENU_SHOW: 'context-menu-show',
  CONTEXT_MENU_DOCUMENT: 'context-menu-document',
  CONTEXT_MENU_ANNOTATION: 'context-menu-annotation',

  // Update events
  UPDATE_STATE_CHANGED: 'update-state-changed',
  UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_NOT_AVAILABLE: 'update-not-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
  UPDATE_ERROR: 'update-error',

  // Notification events
  NOTIFICATION_CLICKED: 'notification-clicked',
  NOTIFICATION_CLOSED: 'notification-closed',
  NOTIFICATION_ACTION: 'notification-action',

  // Tray events
  TRAY_CLICKED: 'tray-clicked',
  TRAY_DOUBLE_CLICKED: 'tray-double-clicked',
  TRAY_RIGHT_CLICKED: 'tray-right-clicked',

  // Window visibility events
  WINDOW_HIDDEN: 'window-hidden',
  WINDOW_SHOWN: 'window-shown',
} as const;

/**
 * Channel type for TypeScript
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
export type IpcEvent = (typeof IPC_EVENTS)[keyof typeof IPC_EVENTS];
