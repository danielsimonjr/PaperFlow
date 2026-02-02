/**
 * Dialog IPC Handlers
 *
 * Handles IPC communication for native dialog operations.
 */

import { IpcMain, BrowserWindow } from 'electron';
import {
  showMessageBox,
  showMessageBoxSync,
  showErrorBox,
  showInfoDialog,
  showWarningDialog,
  showErrorDialog,
  showConfirmDialog,
  showYesNoDialog,
  showYesNoCancelDialog,
  showOpenDialog,
  showSaveDialog,
  showFolderPicker,
  showUnsavedChangesDialog,
  showDeleteConfirmDialog,
  type MessageBoxOptions,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type ErrorDialogOptions,
} from '../dialogs';

/**
 * Dialog IPC channel names
 */
export const DIALOG_CHANNELS = {
  DIALOG_MESSAGE_BOX: 'dialog-message-box',
  DIALOG_MESSAGE_BOX_SYNC: 'dialog-message-box-sync',
  DIALOG_ERROR_BOX: 'dialog-error-box',
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
 * Helper to get current window from event
 */
function getCurrentWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/**
 * Set up dialog IPC handlers
 */
export function setupDialogHandlers(ipcMain: IpcMain): void {
  // Generic message box
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_MESSAGE_BOX,
    async (event, options: MessageBoxOptions) => {
      const window = getCurrentWindow(event);
      return showMessageBox(window, options);
    }
  );

  // Synchronous message box
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_MESSAGE_BOX_SYNC,
    (event, options: MessageBoxOptions) => {
      const window = getCurrentWindow(event);
      const response = showMessageBoxSync(window, options);
      return { response };
    }
  );

  // Error box
  ipcMain.handle(DIALOG_CHANNELS.DIALOG_ERROR_BOX, (_event, options: ErrorDialogOptions) => {
    showErrorBox(options);
    return { success: true };
  });

  // Info dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_INFO,
    async (event, title: string, message: string, detail?: string) => {
      const window = getCurrentWindow(event);
      await showInfoDialog(window, title, message, detail);
      return { success: true };
    }
  );

  // Warning dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_WARNING,
    async (event, title: string, message: string, detail?: string) => {
      const window = getCurrentWindow(event);
      await showWarningDialog(window, title, message, detail);
      return { success: true };
    }
  );

  // Error dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_ERROR,
    async (event, title: string, message: string, detail?: string) => {
      const window = getCurrentWindow(event);
      await showErrorDialog(window, title, message, detail);
      return { success: true };
    }
  );

  // Confirm dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_CONFIRM,
    async (
      event,
      title: string,
      message: string,
      detail?: string,
      confirmLabel?: string,
      cancelLabel?: string
    ) => {
      const window = getCurrentWindow(event);
      const confirmed = await showConfirmDialog(
        window,
        title,
        message,
        detail,
        confirmLabel,
        cancelLabel
      );
      return { confirmed };
    }
  );

  // Yes/No dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_YES_NO,
    async (event, title: string, message: string, detail?: string) => {
      const window = getCurrentWindow(event);
      const yes = await showYesNoDialog(window, title, message, detail);
      return { yes };
    }
  );

  // Yes/No/Cancel dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_YES_NO_CANCEL,
    async (event, title: string, message: string, detail?: string) => {
      const window = getCurrentWindow(event);
      const response = await showYesNoCancelDialog(window, title, message, detail);
      return { response };
    }
  );

  // Open dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_OPEN,
    async (event, options?: OpenDialogOptions) => {
      const window = getCurrentWindow(event);
      return showOpenDialog(window, options);
    }
  );

  // Save dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_SAVE,
    async (event, options?: SaveDialogOptions) => {
      const window = getCurrentWindow(event);
      return showSaveDialog(window, options);
    }
  );

  // Folder picker
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_FOLDER_PICKER,
    async (event, title?: string, defaultPath?: string) => {
      const window = getCurrentWindow(event);
      const folderPath = await showFolderPicker(window, title, defaultPath);
      return { folderPath };
    }
  );

  // Unsaved changes dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_UNSAVED_CHANGES,
    async (event, fileName: string) => {
      const window = getCurrentWindow(event);
      const result = await showUnsavedChangesDialog(window, fileName);
      return { result };
    }
  );

  // Delete confirm dialog
  ipcMain.handle(
    DIALOG_CHANNELS.DIALOG_DELETE_CONFIRM,
    async (event, itemName: string, itemType?: string) => {
      const window = getCurrentWindow(event);
      const confirmed = await showDeleteConfirmDialog(window, itemName, itemType);
      return { confirmed };
    }
  );
}
