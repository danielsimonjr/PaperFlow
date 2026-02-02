/**
 * Print Module
 *
 * Handles native printing functionality for the Electron app.
 * Supports PDF printing with system print dialog and various options.
 */

import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

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
  data?: Buffer;
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
 * Paper size definitions in inches
 */
const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 8.27, height: 11.69 },
  Letter: { width: 8.5, height: 11 },
  Legal: { width: 8.5, height: 14 },
  Tabloid: { width: 11, height: 17 },
};

/**
 * Get list of available printers
 */
export async function getPrinters(window: BrowserWindow): Promise<PrinterInfo[]> {
  try {
    const printers = window.webContents.getPrintersAsync
      ? await window.webContents.getPrintersAsync()
      : window.webContents.getPrinters();

    return printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description,
      status: printer.status,
      isDefault: printer.isDefault,
    }));
  } catch (error) {
    console.error('[Print] Failed to get printers:', error);
    return [];
  }
}

/**
 * Get the default printer
 */
export async function getDefaultPrinter(window: BrowserWindow): Promise<PrinterInfo | null> {
  const printers = await getPrinters(window);
  return printers.find((p) => p.isDefault) || printers[0] || null;
}

/**
 * Convert page ranges string to array of objects
 */
function parsePageRanges(rangesStr: string): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  const parts = rangesStr.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        ranges.push({ from: start, to: end });
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page)) {
        ranges.push({ from: page, to: page });
      }
    }
  }

  return ranges;
}

/**
 * Build Electron print options from our options
 */
function buildPrintOptions(options: PrintOptions): Electron.WebContentsPrintOptions {
  const printOptions: Electron.WebContentsPrintOptions = {
    silent: options.silent ?? false,
    printBackground: options.printBackground ?? true,
    color: options.color ?? true,
    copies: options.copies ?? 1,
    landscape: options.landscape ?? false,
  };

  // Paper size
  if (options.paperSize && PAPER_SIZES[options.paperSize]) {
    const size = PAPER_SIZES[options.paperSize];
    printOptions.pageSize = {
      width: size.width * 25400, // Convert to microns
      height: size.height * 25400,
    };
  }

  // Scale factor
  if (options.scaleFactor) {
    printOptions.scaleFactor = Math.max(0.5, Math.min(2.0, options.scaleFactor)) * 100;
  }

  // Margins
  if (options.margins) {
    printOptions.margins = {
      marginType: 'custom',
      top: options.margins.top ?? 0.5,
      bottom: options.margins.bottom ?? 0.5,
      left: options.margins.left ?? 0.5,
      right: options.margins.right ?? 0.5,
    };
  }

  // Header/Footer
  if (options.printHeaderFooter) {
    printOptions.printHeaderFooter = true;
    if (options.headerTemplate) {
      printOptions.headerTemplate = options.headerTemplate;
    }
    if (options.footerTemplate) {
      printOptions.footerTemplate = options.footerTemplate;
    }
  }

  // Printer name
  if (options.deviceName) {
    printOptions.deviceName = options.deviceName;
  }

  // Page ranges
  if (options.pageRanges) {
    printOptions.pageRanges = parsePageRanges(options.pageRanges);
  }

  // DPI
  if (options.dpi) {
    printOptions.dpi = options.dpi;
  }

  return printOptions;
}

/**
 * Print the current page using native print dialog
 */
export async function printWithDialog(
  window: BrowserWindow,
  options: PrintOptions = {}
): Promise<PrintResult> {
  return new Promise((resolve) => {
    const printOptions = buildPrintOptions({ ...options, silent: false });

    window.webContents.print(printOptions, (success, errorType) => {
      if (success) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: errorType || 'Print failed',
        });
      }
    });
  });
}

/**
 * Silent print (no dialog)
 */
export async function printSilent(
  window: BrowserWindow,
  options: PrintOptions = {}
): Promise<PrintResult> {
  return new Promise((resolve) => {
    const printOptions = buildPrintOptions({ ...options, silent: true });

    if (!options.deviceName) {
      // Get default printer
      getDefaultPrinter(window).then((printer) => {
        if (!printer) {
          resolve({ success: false, error: 'No printers available' });
          return;
        }
        printOptions.deviceName = printer.name;

        window.webContents.print(printOptions, (success, errorType) => {
          resolve({
            success,
            error: success ? undefined : errorType || 'Print failed',
          });
        });
      });
    } else {
      window.webContents.print(printOptions, (success, errorType) => {
        resolve({
          success,
          error: success ? undefined : errorType || 'Print failed',
        });
      });
    }
  });
}

/**
 * Generate print preview as PDF
 */
export async function generatePrintPreview(
  window: BrowserWindow,
  options: PrintOptions = {}
): Promise<PrintPreviewResult> {
  try {
    const pdfOptions: Electron.PrintToPDFOptions = {
      printBackground: options.printBackground ?? true,
      landscape: options.landscape ?? false,
    };

    // Paper size
    if (options.paperSize && PAPER_SIZES[options.paperSize]) {
      const size = PAPER_SIZES[options.paperSize];
      pdfOptions.pageSize = {
        width: size.width,
        height: size.height,
      };
    }

    // Scale
    if (options.scaleFactor) {
      pdfOptions.scale = Math.max(0.5, Math.min(2.0, options.scaleFactor));
    }

    // Margins
    if (options.margins) {
      pdfOptions.margins = {
        top: options.margins.top ?? 0.5,
        bottom: options.margins.bottom ?? 0.5,
        left: options.margins.left ?? 0.5,
        right: options.margins.right ?? 0.5,
      };
    }

    // Header/Footer
    if (options.printHeaderFooter) {
      pdfOptions.displayHeaderFooter = true;
      if (options.headerTemplate) {
        pdfOptions.headerTemplate = options.headerTemplate;
      }
      if (options.footerTemplate) {
        pdfOptions.footerTemplate = options.footerTemplate;
      }
    }

    // Page ranges
    if (options.pageRanges) {
      pdfOptions.pageRanges = options.pageRanges;
    }

    const data = await window.webContents.printToPDF(pdfOptions);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Print] Failed to generate print preview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate preview',
    };
  }
}

/**
 * Save print preview as PDF file
 */
export async function savePrintPreview(
  window: BrowserWindow,
  options: PrintOptions = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const preview = await generatePrintPreview(window, options);

    if (!preview.success || !preview.data) {
      return { success: false, error: preview.error };
    }

    const result = await dialog.showSaveDialog(window, {
      title: 'Save Print Preview',
      defaultPath: path.join(os.homedir(), 'print-preview.pdf'),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' };
    }

    await fs.writeFile(result.filePath, preview.data);

    return { success: true, filePath: result.filePath };
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
  window: BrowserWindow,
  pdfPath: string,
  options: PrintOptions = {}
): Promise<PrintResult> {
  try {
    // Verify the PDF file exists
    await fs.access(pdfPath);

    // Create a temporary window to load the PDF
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        plugins: true,
      },
    });

    try {
      // Load the PDF
      await printWindow.loadURL(`file://${pdfPath}`);

      // Print
      return new Promise((resolve) => {
        const printOptions = buildPrintOptions({ ...options, silent: false });

        printWindow.webContents.print(printOptions, (success, errorType) => {
          printWindow.close();
          resolve({
            success,
            error: success ? undefined : errorType || 'Print failed',
          });
        });
      });
    } catch (loadError) {
      printWindow.close();
      throw loadError;
    }
  } catch (error) {
    console.error('[Print] Failed to print PDF file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to print PDF',
    };
  }
}

/**
 * Print PDF from base64 data
 */
export async function printPDFData(
  window: BrowserWindow,
  base64Data: string,
  options: PrintOptions = {}
): Promise<PrintResult> {
  try {
    // Create temporary file
    const tempPath = path.join(os.tmpdir(), `paperflow-print-${Date.now()}.pdf`);
    const pdfData = Buffer.from(base64Data, 'base64');
    await fs.writeFile(tempPath, pdfData);

    try {
      const result = await printPDFFile(window, tempPath, options);
      return result;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('[Print] Failed to print PDF data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to print PDF',
    };
  }
}
