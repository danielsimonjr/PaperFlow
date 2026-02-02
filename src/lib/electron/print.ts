/**
 * Print Module (Renderer)
 *
 * Provides print functionality from the renderer process.
 * Communicates with the main process via IPC for native printing.
 */

import { isElectron } from './platform';

/**
 * Print options for PDF printing
 */
export interface PrintOptions {
  /** Silent printing (no dialog) */
  silent?: boolean;
  /** Print in color or grayscale */
  color?: boolean;
  /** Number of copies */
  copies?: number;
  /** Page ranges to print (e.g., '1-3,5,7-9') */
  pageRanges?: string;
  /** Paper size */
  paperSize?: 'A4' | 'Letter' | 'Legal' | 'Tabloid';
  /** Print orientation */
  landscape?: boolean;
  /** Scale factor (0.5 - 2.0) */
  scaleFactor?: number;
  /** Print background graphics */
  printBackground?: boolean;
  /** Print header and footer */
  printHeaderFooter?: boolean;
  /** Header template (HTML) */
  headerTemplate?: string;
  /** Footer template (HTML) */
  footerTemplate?: string;
  /** Margins in inches */
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** Printer name (if silent printing) */
  deviceName?: string;
  /** DPI for printing */
  dpi?: {
    horizontal?: number;
    vertical?: number;
  };
}

/**
 * Print result
 */
export interface PrintResult {
  success: boolean;
  error?: string;
}

/**
 * Print preview result
 */
export interface PrintPreviewResult {
  success: boolean;
  data?: string; // base64 encoded PDF
  error?: string;
}

/**
 * Printer info
 */
export interface PrinterInfo {
  name: string;
  displayName: string;
  description?: string;
  status: number;
  isDefault: boolean;
}

/**
 * Print IPC channel names
 */
const PRINT_CHANNELS = {
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
 * Get the electron API from window
 */
function getElectronAPI() {
  if (!isElectron()) {
    throw new Error('Print functionality requires Electron');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).electron;
}

/**
 * Invoke IPC channel for print operations
 */
async function invokePrint<T>(channel: string, ...args: unknown[]): Promise<T> {
  const api = getElectronAPI();
  if (!api) {
    throw new Error('Electron API not available');
  }
  // Use generic IPC invocation
  const { ipcRenderer } = window.require?.('electron') || {};
  if (ipcRenderer) {
    return ipcRenderer.invoke(channel, ...args);
  }
  throw new Error('IPC not available');
}

/**
 * Print the current document using native print dialog
 */
export async function printWithDialog(options: PrintOptions = {}): Promise<PrintResult> {
  if (!isElectron()) {
    // Fallback to browser print
    window.print();
    return { success: true };
  }

  try {
    return await invokePrint<PrintResult>(PRINT_CHANNELS.PRINT_WITH_DIALOG, options);
  } catch (error) {
    console.error('[Print] Failed to print:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

/**
 * Print silently without showing dialog
 */
export async function printSilent(options: PrintOptions = {}): Promise<PrintResult> {
  if (!isElectron()) {
    return { success: false, error: 'Silent printing requires Electron' };
  }

  try {
    return await invokePrint<PrintResult>(PRINT_CHANNELS.PRINT_SILENT, options);
  } catch (error) {
    console.error('[Print] Failed to print silently:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

/**
 * Generate print preview as PDF
 */
export async function getPrintPreview(options: PrintOptions = {}): Promise<PrintPreviewResult> {
  if (!isElectron()) {
    return { success: false, error: 'Print preview requires Electron' };
  }

  try {
    return await invokePrint<PrintPreviewResult>(PRINT_CHANNELS.PRINT_GET_PREVIEW, options);
  } catch (error) {
    console.error('[Print] Failed to get print preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    };
  }
}

/**
 * Save print preview to file
 */
export async function savePrintPreview(
  options: PrintOptions = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!isElectron()) {
    return { success: false, error: 'Save preview requires Electron' };
  }

  try {
    return await invokePrint<{ success: boolean; filePath?: string; error?: string }>(
      PRINT_CHANNELS.PRINT_SAVE_PREVIEW,
      options
    );
  } catch (error) {
    console.error('[Print] Failed to save print preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save preview',
    };
  }
}

/**
 * Print a PDF file directly
 */
export async function printPDFFile(
  pdfPath: string,
  options: PrintOptions = {}
): Promise<PrintResult> {
  if (!isElectron()) {
    return { success: false, error: 'PDF file printing requires Electron' };
  }

  try {
    return await invokePrint<PrintResult>(PRINT_CHANNELS.PRINT_PDF_FILE, pdfPath, options);
  } catch (error) {
    console.error('[Print] Failed to print PDF file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

/**
 * Print PDF from base64 data
 */
export async function printPDFData(
  base64Data: string,
  options: PrintOptions = {}
): Promise<PrintResult> {
  if (!isElectron()) {
    return { success: false, error: 'PDF printing requires Electron' };
  }

  try {
    return await invokePrint<PrintResult>(PRINT_CHANNELS.PRINT_PDF_DATA, base64Data, options);
  } catch (error) {
    console.error('[Print] Failed to print PDF data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

/**
 * Get available printers
 */
export async function getPrinters(): Promise<PrinterInfo[]> {
  if (!isElectron()) {
    return [];
  }

  try {
    return await invokePrint<PrinterInfo[]>(PRINT_CHANNELS.PRINT_GET_PRINTERS);
  } catch (error) {
    console.error('[Print] Failed to get printers:', error);
    return [];
  }
}

/**
 * Get the default printer
 */
export async function getDefaultPrinter(): Promise<PrinterInfo | null> {
  if (!isElectron()) {
    return null;
  }

  try {
    return await invokePrint<PrinterInfo | null>(PRINT_CHANNELS.PRINT_GET_DEFAULT_PRINTER);
  } catch (error) {
    console.error('[Print] Failed to get default printer:', error);
    return null;
  }
}

/**
 * Check if native printing is available
 */
export function isNativePrintAvailable(): boolean {
  return isElectron();
}
