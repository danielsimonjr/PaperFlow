/**
 * Print IPC Handlers
 *
 * Handles IPC communication for printing operations.
 */

import { IpcMain, BrowserWindow } from 'electron';
import {
  printWithDialog,
  printSilent,
  generatePrintPreview,
  savePrintPreview,
  printPDFFile,
  printPDFData,
  getPrinters,
  getDefaultPrinter,
  type PrintOptions,
} from '../print';

/**
 * Print IPC channel names
 */
export const PRINT_CHANNELS = {
  PRINT_WITH_DIALOG: 'print-with-dialog',
  PRINT_SILENT: 'print-silent',
  PRINT_GET_PREVIEW: 'print-get-preview',
  PRINT_SAVE_PREVIEW: 'print-save-preview',
  PRINT_PDF_FILE: 'print-pdf-file',
  PRINT_PDF_DATA: 'print-pdf-data',
  PRINT_GET_PRINTERS: 'print-get-printers',
  PRINT_GET_DEFAULT_PRINTER: 'print-get-default-printer',
} as const;

/**
 * Helper to get current window from event
 */
function getCurrentWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/**
 * Set up print IPC handlers
 */
export function setupPrintHandlers(ipcMain: IpcMain): void {
  // Print with native dialog
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_WITH_DIALOG,
    async (event, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      return printWithDialog(window, options);
    }
  );

  // Silent print
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_SILENT,
    async (event, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      return printSilent(window, options);
    }
  );

  // Get print preview as PDF buffer
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_GET_PREVIEW,
    async (event, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      const result = await generatePrintPreview(window, options);
      // Convert Buffer to base64 for IPC transfer
      if (result.success && result.data) {
        return {
          success: true,
          data: result.data.toString('base64'),
        };
      }
      return result;
    }
  );

  // Save print preview to file
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_SAVE_PREVIEW,
    async (event, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      return savePrintPreview(window, options);
    }
  );

  // Print PDF file
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_PDF_FILE,
    async (event, pdfPath: string, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      return printPDFFile(window, pdfPath, options);
    }
  );

  // Print PDF from base64 data
  ipcMain.handle(
    PRINT_CHANNELS.PRINT_PDF_DATA,
    async (event, base64Data: string, options?: PrintOptions) => {
      const window = getCurrentWindow(event);
      if (!window) {
        return { success: false, error: 'No window available' };
      }
      return printPDFData(window, base64Data, options);
    }
  );

  // Get available printers
  ipcMain.handle(PRINT_CHANNELS.PRINT_GET_PRINTERS, async (event) => {
    const window = getCurrentWindow(event);
    if (!window) {
      return [];
    }
    return getPrinters(window);
  });

  // Get default printer
  ipcMain.handle(PRINT_CHANNELS.PRINT_GET_DEFAULT_PRINTER, async (event) => {
    const window = getCurrentWindow(event);
    if (!window) {
      return null;
    }
    return getDefaultPrinter(window);
  });
}
