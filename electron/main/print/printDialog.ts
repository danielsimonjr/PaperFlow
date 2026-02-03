/**
 * Native Print Dialog Integration
 *
 * Implements Electron native print dialog with full access to system printers,
 * paper sizes, and print options.
 */

import { BrowserWindow, WebContents, PrinterInfo } from 'electron';
import type { PrintOptions, PrintDialogOptions, PrintDialogResult, PrintJob } from './types';

/**
 * Default print options
 */
const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  silent: false,
  printBackground: true,
  deviceName: '',
  color: true,
  margins: {
    marginType: 'default',
  },
  landscape: false,
  scaleFactor: 100,
  pagesPerSheet: 1,
  collate: true,
  copies: 1,
  pageRanges: [],
  duplexMode: undefined,
  dpi: { horizontal: 0, vertical: 0 },
  header: '',
  footer: '',
  pageSize: 'Letter',
};

/**
 * Print dialog manager
 */
export class PrintDialog {
  private static activeDialogs: Map<number, PrintJob> = new Map();
  private static jobCounter = 0;

  /**
   * Show native print dialog and print
   */
  static async showPrintDialog(
    webContents: WebContents,
    options: PrintDialogOptions = {}
  ): Promise<PrintDialogResult> {
    const jobId = ++this.jobCounter;
    const printOptions = this.mergeOptions(options);

    return new Promise((resolve) => {
      const job: PrintJob = {
        id: jobId,
        status: 'pending',
        startTime: Date.now(),
        options: printOptions,
      };
      this.activeDialogs.set(jobId, job);

      webContents.print(printOptions, (success, failureReason) => {
        this.activeDialogs.delete(jobId);

        if (success) {
          resolve({
            success: true,
            jobId,
          });
        } else {
          resolve({
            success: false,
            error: failureReason || 'Print failed',
            jobId,
          });
        }
      });
    });
  }

  /**
   * Show print preview dialog
   */
  static async showPrintPreview(
    window: BrowserWindow,
    options: PrintDialogOptions = {}
  ): Promise<PrintDialogResult> {
    // In Electron, print preview is handled by the print dialog itself
    // We can customize the preview by using custom print styles
    return this.showPrintDialog(window.webContents, {
      ...options,
      silent: false, // Ensure dialog is shown
    });
  }

  /**
   * Silent print without dialog
   */
  static async silentPrint(
    webContents: WebContents,
    options: PrintDialogOptions = {}
  ): Promise<PrintDialogResult> {
    return this.showPrintDialog(webContents, {
      ...options,
      silent: true,
    });
  }

  /**
   * Print to PDF
   */
  static async printToPDF(
    webContents: WebContents,
    options: Electron.PrintToPDFOptions = {}
  ): Promise<Buffer> {
    const pdfOptions: Electron.PrintToPDFOptions = {
      printBackground: options.printBackground ?? true,
      landscape: options.landscape ?? false,
      pageSize: options.pageSize ?? 'Letter',
      margins: options.margins ?? { top: 0, bottom: 0, left: 0, right: 0 },
      scale: options.scale ?? 1,
      headerTemplate: options.headerTemplate ?? '',
      footerTemplate: options.footerTemplate ?? '',
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      preferCSSPageSize: options.preferCSSPageSize ?? false,
      generateTaggedPDF: options.generateTaggedPDF ?? false,
      generateDocumentOutline: options.generateDocumentOutline ?? false,
    };

    return webContents.printToPDF(pdfOptions);
  }

  /**
   * Get active print jobs
   */
  static getActiveJobs(): PrintJob[] {
    return Array.from(this.activeDialogs.values());
  }

  /**
   * Cancel a print job
   */
  static cancelJob(jobId: number): boolean {
    const job = this.activeDialogs.get(jobId);
    if (job) {
      job.status = 'cancelled';
      this.activeDialogs.delete(jobId);
      return true;
    }
    return false;
  }

  /**
   * Merge user options with defaults
   */
  private static mergeOptions(options: PrintDialogOptions): PrintOptions {
    return {
      ...DEFAULT_PRINT_OPTIONS,
      ...options,
      margins: {
        ...DEFAULT_PRINT_OPTIONS.margins,
        ...(options.margins || {}),
      },
    };
  }

  /**
   * Convert paper size name to dimensions
   */
  static getPaperDimensions(
    paperSize: string
  ): { width: number; height: number } | null {
    const sizes: Record<string, { width: number; height: number }> = {
      Letter: { width: 612, height: 792 },
      Legal: { width: 612, height: 1008 },
      Tabloid: { width: 792, height: 1224 },
      Ledger: { width: 1224, height: 792 },
      A0: { width: 2384, height: 3370 },
      A1: { width: 1684, height: 2384 },
      A2: { width: 1191, height: 1684 },
      A3: { width: 842, height: 1191 },
      A4: { width: 595, height: 842 },
      A5: { width: 420, height: 595 },
      A6: { width: 297, height: 420 },
    };

    return sizes[paperSize] || null;
  }

  /**
   * Format printer info for display
   */
  static formatPrinterInfo(printer: PrinterInfo): {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
  } {
    return {
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || '',
      status: printer.status,
      isDefault: printer.isDefault,
    };
  }
}

export default PrintDialog;
