/**
 * Native Dialogs Module (Renderer)
 *
 * Provides native dialog functionality from the renderer process.
 * Falls back to browser dialogs when not in Electron.
 */

import { isElectron } from './platform';

/**
 * Dialog types
 */
export type DialogType = 'none' | 'info' | 'error' | 'question' | 'warning';

/**
 * Message box options
 */
export interface MessageBoxOptions {
  type?: DialogType;
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
}

/**
 * Message box result
 */
export interface MessageBoxResult {
  response: number;
  checkboxChecked: boolean;
}

/**
 * Open dialog options
 */
export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
  >;
}

/**
 * Open dialog result
 */
export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

/**
 * Save dialog options
 */
export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * Save dialog result
 */
export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

/**
 * Dialog IPC channel names
 */
const DIALOG_CHANNELS = {
  DIALOG_MESSAGE_BOX: 'dialog-message-box',
  DIALOG_INFO: 'dialog-info',
  DIALOG_WARNING: 'dialog-warning',
  DIALOG_ERROR: 'dialog-error',
  DIALOG_CONFIRM: 'dialog-confirm',
  DIALOG_YES_NO: 'dialog-yes-no',
  DIALOG_YES_NO_CANCEL: 'dialog-yes-no-cancel',
  DIALOG_OPEN: 'dialog-open',
  DIALOG_SAVE: 'dialog-save',
  DIALOG_FOLDER_PICKER: 'dialog-folder-picker',
  DIALOG_UNSAVED_CHANGES: 'dialog-unsaved-changes',
  DIALOG_DELETE_CONFIRM: 'dialog-delete-confirm',
} as const;

/**
 * Invoke IPC channel for dialog operations
 */
async function invokeDialog<T>(channel: string, ...args: unknown[]): Promise<T> {
  if (!isElectron()) {
    throw new Error('Native dialogs require Electron');
  }
  const { ipcRenderer } = window.require?.('electron') || {};
  if (ipcRenderer) {
    return ipcRenderer.invoke(channel, ...args);
  }
  throw new Error('IPC not available');
}

/**
 * Show a message box dialog
 */
export async function showMessageBox(options: MessageBoxOptions): Promise<MessageBoxResult> {
  if (!isElectron()) {
    // Fallback to browser confirm
    const confirmed = window.confirm(options.message);
    return {
      response: confirmed ? 0 : 1,
      checkboxChecked: false,
    };
  }

  return invokeDialog<MessageBoxResult>(DIALOG_CHANNELS.DIALOG_MESSAGE_BOX, options);
}

/**
 * Show an info dialog
 */
export async function showInfo(
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  if (!isElectron()) {
    window.alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
    return;
  }

  await invokeDialog(DIALOG_CHANNELS.DIALOG_INFO, title, message, detail);
}

/**
 * Show a warning dialog
 */
export async function showWarning(
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  if (!isElectron()) {
    window.alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
    return;
  }

  await invokeDialog(DIALOG_CHANNELS.DIALOG_WARNING, title, message, detail);
}

/**
 * Show an error dialog
 */
export async function showError(
  title: string,
  message: string,
  detail?: string
): Promise<void> {
  if (!isElectron()) {
    window.alert(`Error: ${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
    return;
  }

  await invokeDialog(DIALOG_CHANNELS.DIALOG_ERROR, title, message, detail);
}

/**
 * Show a confirmation dialog
 */
export async function confirm(
  title: string,
  message: string,
  detail?: string,
  confirmLabel?: string,
  cancelLabel?: string
): Promise<boolean> {
  if (!isElectron()) {
    return window.confirm(`${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
  }

  const result = await invokeDialog<{ confirmed: boolean }>(
    DIALOG_CHANNELS.DIALOG_CONFIRM,
    title,
    message,
    detail,
    confirmLabel,
    cancelLabel
  );

  return result.confirmed;
}

/**
 * Show a Yes/No dialog
 */
export async function askYesNo(
  title: string,
  message: string,
  detail?: string
): Promise<boolean> {
  if (!isElectron()) {
    return window.confirm(`${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
  }

  const result = await invokeDialog<{ yes: boolean }>(
    DIALOG_CHANNELS.DIALOG_YES_NO,
    title,
    message,
    detail
  );

  return result.yes;
}

/**
 * Show a Yes/No/Cancel dialog
 * @returns 0 for Yes, 1 for No, 2 for Cancel
 */
export async function askYesNoCancel(
  title: string,
  message: string,
  detail?: string
): Promise<number> {
  if (!isElectron()) {
    // Browser doesn't have a three-way dialog, simulate with two prompts
    const yes = window.confirm(`${title}\n\n${message}${detail ? `\n\n${detail}` : ''}`);
    return yes ? 0 : 2; // Yes or Cancel (no way to express "No" in browser confirm)
  }

  const result = await invokeDialog<{ response: number }>(
    DIALOG_CHANNELS.DIALOG_YES_NO_CANCEL,
    title,
    message,
    detail
  );

  return result.response;
}

/**
 * Show an open file dialog
 */
export async function showOpenDialog(
  options?: OpenDialogOptions
): Promise<OpenDialogResult> {
  if (!isElectron()) {
    // Use browser file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.properties?.includes('multiSelections') || false;

      if (options?.filters?.[0]?.extensions) {
        input.accept = options.filters[0].extensions.map((ext) => `.${ext}`).join(',');
      }

      input.onchange = () => {
        if (input.files && input.files.length > 0) {
          resolve({
            canceled: false,
            filePaths: Array.from(input.files).map((f) => f.name),
          });
        } else {
          resolve({ canceled: true, filePaths: [] });
        }
      };

      input.oncancel = () => {
        resolve({ canceled: true, filePaths: [] });
      };

      input.click();
    });
  }

  return invokeDialog<OpenDialogResult>(DIALOG_CHANNELS.DIALOG_OPEN, options);
}

/**
 * Show a save file dialog
 */
export async function showSaveDialog(
  options?: SaveDialogOptions
): Promise<SaveDialogResult> {
  if (!isElectron()) {
    // Browser doesn't have a native save dialog
    // Return a simulated result - actual saving would use download
    const fileName = options?.defaultPath || 'document';
    return {
      canceled: false,
      filePath: fileName,
    };
  }

  return invokeDialog<SaveDialogResult>(DIALOG_CHANNELS.DIALOG_SAVE, options);
}

/**
 * Show a folder picker dialog
 */
export async function showFolderPicker(
  title?: string,
  defaultPath?: string
): Promise<string | null> {
  if (!isElectron()) {
    // Browser doesn't support folder picker universally
    console.warn('Folder picker not supported in browser');
    return null;
  }

  const result = await invokeDialog<{ folderPath: string | null }>(
    DIALOG_CHANNELS.DIALOG_FOLDER_PICKER,
    title,
    defaultPath
  );

  return result.folderPath;
}

/**
 * Show unsaved changes dialog
 * @returns 'save', 'discard', or 'cancel'
 */
export async function showUnsavedChanges(
  fileName: string
): Promise<'save' | 'discard' | 'cancel'> {
  if (!isElectron()) {
    const save = window.confirm(
      `Do you want to save the changes you made to "${fileName}"?\n\nYour changes will be lost if you don't save them.`
    );
    return save ? 'save' : 'discard';
  }

  const result = await invokeDialog<{ result: 'save' | 'discard' | 'cancel' }>(
    DIALOG_CHANNELS.DIALOG_UNSAVED_CHANGES,
    fileName
  );

  return result.result;
}

/**
 * Show delete confirmation dialog
 */
export async function confirmDelete(
  itemName: string,
  itemType: string = 'item'
): Promise<boolean> {
  if (!isElectron()) {
    return window.confirm(
      `Are you sure you want to delete "${itemName}"?\n\nThis action cannot be undone.`
    );
  }

  const result = await invokeDialog<{ confirmed: boolean }>(
    DIALOG_CHANNELS.DIALOG_DELETE_CONFIRM,
    itemName,
    itemType
  );

  return result.confirmed;
}

/**
 * Check if native dialogs are available
 */
export function isNativeDialogsAvailable(): boolean {
  return isElectron();
}
