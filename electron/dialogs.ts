/**
 * Native Dialogs Module
 *
 * Provides native dialog functionality for the Electron app.
 * Includes message boxes, error dialogs, confirmation dialogs, etc.
 */

import { dialog, BrowserWindow, app } from 'electron';

/**
 * Dialog types
 */
export type DialogType = 'none' | 'info' | 'error' | 'question' | 'warning';

/**
 * Message box options
 */
export interface MessageBoxOptions {
  /** Dialog type (affects icon) */
  type?: DialogType;
  /** Dialog title */
  title?: string;
  /** Main message text */
  message: string;
  /** Additional detail text */
  detail?: string;
  /** Button labels */
  buttons?: string[];
  /** Index of the default button */
  defaultId?: number;
  /** Index of the cancel button */
  cancelId?: number;
  /** Whether to use custom checkbox */
  checkboxLabel?: string;
  /** Initial state of checkbox */
  checkboxChecked?: boolean;
  /** Custom icon path */
  icon?: string;
  /** Normalize keyboard access on buttons (macOS) */
  normalizeAccessKeys?: boolean;
  /** Don't block the main process */
  noLink?: boolean;
}

/**
 * Message box result
 */
export interface MessageBoxResult {
  /** Index of the button that was clicked */
  response: number;
  /** State of the checkbox (if used) */
  checkboxChecked: boolean;
}

/**
 * Error dialog options
 */
export interface ErrorDialogOptions {
  /** Dialog title */
  title?: string;
  /** Error message */
  content: string;
}

/**
 * Open file dialog options
 */
export interface OpenDialogOptions {
  /** Dialog title */
  title?: string;
  /** Default path */
  defaultPath?: string;
  /** Button label */
  buttonLabel?: string;
  /** File filters */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Dialog properties */
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
    | 'dontAddToRecent'
  >;
  /** Security scoped bookmarks (macOS) */
  securityScopedBookmarks?: boolean;
}

/**
 * Open file dialog result
 */
export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
  bookmarks?: string[];
}

/**
 * Save file dialog options
 */
export interface SaveDialogOptions {
  /** Dialog title */
  title?: string;
  /** Default path */
  defaultPath?: string;
  /** Button label */
  buttonLabel?: string;
  /** File filters */
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Properties */
  properties?: Array<
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'treatPackageAsDirectory'
    | 'showOverwriteConfirmation'
    | 'dontAddToRecent'
  >;
  /** Security scoped bookmarks (macOS) */
  securityScopedBookmarks?: boolean;
}

/**
 * Save file dialog result
 */
export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
  bookmark?: string;
}

/**
 * Certificate trust dialog options (macOS/Windows)
 */
export interface CertificateTrustDialogOptions {
  certificate: Electron.Certificate;
  message: string;
}

/**
 * Show a message box dialog
 *
 * @param window - Parent window (or null for no parent)
 * @param options - Dialog options
 */
export async function showMessageBox(
  window: BrowserWindow | null,
  options: MessageBoxOptions
): Promise<MessageBoxResult> {
  const dialogOptions: Electron.MessageBoxOptions = {
    type: options.type || 'info',
    title: options.title || app.getName(),
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK'],
    defaultId: options.defaultId ?? 0,
    cancelId: options.cancelId,
    checkboxLabel: options.checkboxLabel,
    checkboxChecked: options.checkboxChecked,
    normalizeAccessKeys: options.normalizeAccessKeys,
    noLink: options.noLink,
  };

  if (window) {
    return dialog.showMessageBox(window, dialogOptions);
  }

  return dialog.showMessageBox(dialogOptions);
}

/**
 * Show a synchronous message box (blocks)
 *
 * @param window - Parent window (or null for no parent)
 * @param options - Dialog options
 */
export function showMessageBoxSync(
  window: BrowserWindow | null,
  options: MessageBoxOptions
): number {
  const dialogOptions: Electron.MessageBoxOptions = {
    type: options.type || 'info',
    title: options.title || app.getName(),
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK'],
    defaultId: options.defaultId ?? 0,
    cancelId: options.cancelId,
    checkboxLabel: options.checkboxLabel,
    checkboxChecked: options.checkboxChecked,
    normalizeAccessKeys: options.normalizeAccessKeys,
    noLink: options.noLink,
  };

  if (window) {
    return dialog.showMessageBoxSync(window, dialogOptions);
  }

  return dialog.showMessageBoxSync(dialogOptions);
}

/**
 * Show an error dialog
 *
 * @param options - Error dialog options
 */
export function showErrorBox(options: ErrorDialogOptions): void {
  dialog.showErrorBox(options.title || 'Error', options.content);
}

/**
 * Show an info dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 */
export async function showInfoDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  await showMessageBox(window, {
    type: 'info',
    title,
    message,
    detail,
    buttons: ['OK'],
  });
}

/**
 * Show a warning dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 */
export async function showWarningDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  await showMessageBox(window, {
    type: 'warning',
    title,
    message,
    detail,
    buttons: ['OK'],
  });
}

/**
 * Show an error dialog with OK button
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 */
export async function showErrorDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  await showMessageBox(window, {
    type: 'error',
    title,
    message,
    detail,
    buttons: ['OK'],
  });
}

/**
 * Show a confirmation dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 * @param confirmLabel - Label for confirm button
 * @param cancelLabel - Label for cancel button
 * @returns True if confirmed, false if cancelled
 */
export async function showConfirmDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string,
  confirmLabel: string = 'OK',
  cancelLabel: string = 'Cancel'
): Promise<boolean> {
  const result = await showMessageBox(window, {
    type: 'question',
    title,
    message,
    detail,
    buttons: [confirmLabel, cancelLabel],
    defaultId: 0,
    cancelId: 1,
  });

  return result.response === 0;
}

/**
 * Show a Yes/No dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 * @returns True if Yes, false if No
 */
export async function showYesNoDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string
): Promise<boolean> {
  return showConfirmDialog(window, title, message, detail, 'Yes', 'No');
}

/**
 * Show a Yes/No/Cancel dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param message - Message text
 * @param detail - Optional detail text
 * @returns 0 for Yes, 1 for No, 2 for Cancel
 */
export async function showYesNoCancelDialog(
  window: BrowserWindow | null,
  title: string,
  message: string,
  detail?: string
): Promise<number> {
  const result = await showMessageBox(window, {
    type: 'question',
    title,
    message,
    detail,
    buttons: ['Yes', 'No', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  });

  return result.response;
}

/**
 * Show an open file dialog
 *
 * @param window - Parent window
 * @param options - Dialog options
 */
export async function showOpenDialog(
  window: BrowserWindow | null,
  options: OpenDialogOptions = {}
): Promise<OpenDialogResult> {
  const dialogOptions: Electron.OpenDialogOptions = {
    title: options.title,
    defaultPath: options.defaultPath,
    buttonLabel: options.buttonLabel,
    filters: options.filters,
    properties: options.properties || ['openFile'],
    securityScopedBookmarks: options.securityScopedBookmarks,
  };

  if (window) {
    return dialog.showOpenDialog(window, dialogOptions);
  }

  return dialog.showOpenDialog(dialogOptions);
}

/**
 * Show a save file dialog
 *
 * @param window - Parent window
 * @param options - Dialog options
 */
export async function showSaveDialog(
  window: BrowserWindow | null,
  options: SaveDialogOptions = {}
): Promise<SaveDialogResult> {
  const dialogOptions: Electron.SaveDialogOptions = {
    title: options.title,
    defaultPath: options.defaultPath,
    buttonLabel: options.buttonLabel,
    filters: options.filters,
    properties: options.properties,
    securityScopedBookmarks: options.securityScopedBookmarks,
  };

  if (window) {
    return dialog.showSaveDialog(window, dialogOptions);
  }

  return dialog.showSaveDialog(dialogOptions);
}

/**
 * Show a folder picker dialog
 *
 * @param window - Parent window
 * @param title - Dialog title
 * @param defaultPath - Default path
 */
export async function showFolderPicker(
  window: BrowserWindow | null,
  title?: string,
  defaultPath?: string
): Promise<string | null> {
  const result = await showOpenDialog(window, {
    title: title || 'Select Folder',
    defaultPath,
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

/**
 * Show unsaved changes dialog
 *
 * @param window - Parent window
 * @param fileName - Name of the file with unsaved changes
 * @returns 'save', 'discard', or 'cancel'
 */
export async function showUnsavedChangesDialog(
  window: BrowserWindow | null,
  fileName: string
): Promise<'save' | 'discard' | 'cancel'> {
  const result = await showMessageBox(window, {
    type: 'question',
    title: 'Unsaved Changes',
    message: `Do you want to save the changes you made to "${fileName}"?`,
    detail: "Your changes will be lost if you don't save them.",
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
  });

  switch (result.response) {
    case 0:
      return 'save';
    case 1:
      return 'discard';
    default:
      return 'cancel';
  }
}

/**
 * Show delete confirmation dialog
 *
 * @param window - Parent window
 * @param itemName - Name of the item to delete
 * @param itemType - Type of item (e.g., 'file', 'page', 'annotation')
 */
export async function showDeleteConfirmDialog(
  window: BrowserWindow | null,
  itemName: string,
  itemType: string = 'item'
): Promise<boolean> {
  return showConfirmDialog(
    window,
    `Delete ${itemType}`,
    `Are you sure you want to delete "${itemName}"?`,
    'This action cannot be undone.',
    'Delete',
    'Cancel'
  );
}
