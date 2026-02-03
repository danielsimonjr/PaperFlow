/**
 * Silent Printing API
 *
 * Provides silent printing (no dialog) for automated
 * and scheduled print jobs.
 */

import { BrowserWindow, WebContents } from 'electron';
import type { PrintOptions, PrintDialogResult } from './types';
import { PrinterManager } from './printerManager';

/**
 * Silent print options
 */
export interface SilentPrintOptions extends PrintOptions {
  /** Printer name (uses default if not specified) */
  printerName?: string;
  /** Page range (e.g., "1-5" or "1,3,5") */
  pageRange?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Silent print result
 */
export interface SilentPrintResult extends PrintDialogResult {
  /** Printer used */
  printerName?: string;
  /** Time taken in milliseconds */
  duration?: number;
}

/**
 * Silent print service
 */
export class SilentPrint {
  /**
   * Print silently using default printer
   */
  static async printToDefault(
    webContents: WebContents,
    options: Omit<SilentPrintOptions, 'printerName'> = {}
  ): Promise<SilentPrintResult> {
    const window = BrowserWindow.fromWebContents(webContents);
    if (!window) {
      return { success: false, error: 'No window found' };
    }

    const defaultPrinter = await PrinterManager.getDefaultPrinter(window);
    if (!defaultPrinter) {
      return { success: false, error: 'No default printer found' };
    }

    return this.print(webContents, {
      ...options,
      printerName: defaultPrinter.name,
    });
  }

  /**
   * Print silently to specified printer
   */
  static async print(
    webContents: WebContents,
    options: SilentPrintOptions = {}
  ): Promise<SilentPrintResult> {
    const startTime = Date.now();

    const {
      printerName,
      timeout = 60000,
      pageRange,
      ...printOptions
    } = options;

    // Validate printer exists
    if (printerName) {
      const window = BrowserWindow.fromWebContents(webContents);
      if (window) {
        const printer = await PrinterManager.getPrinter(printerName, window);
        if (!printer) {
          return {
            success: false,
            error: `Printer "${printerName}" not found`,
          };
        }

        // Check printer status
        if (printer.statusInfo?.status === 'offline') {
          return {
            success: false,
            error: `Printer "${printerName}" is offline`,
          };
        }

        if (printer.statusInfo?.status === 'error') {
          return {
            success: false,
            error: `Printer "${printerName}" has an error`,
          };
        }
      }
    }

    // Parse page range
    const pageRanges = pageRange ? this.parsePageRange(pageRange) : undefined;

    return new Promise((resolve) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: 'Print operation timed out',
          printerName,
          duration: Date.now() - startTime,
        });
      }, timeout);

      webContents.print(
        {
          silent: true,
          printBackground: printOptions.printBackground ?? true,
          deviceName: printerName,
          color: printOptions.color ?? true,
          margins: printOptions.margins
            ? { marginType: printOptions.margins.marginType ?? 'default' }
            : undefined,
          landscape: printOptions.landscape ?? false,
          scaleFactor: printOptions.scaleFactor ?? 100,
          pagesPerSheet: printOptions.pagesPerSheet ?? 1,
          collate: printOptions.collate ?? true,
          copies: printOptions.copies ?? 1,
          pageRanges,
          duplexMode: printOptions.duplexMode,
          dpi: printOptions.dpi,
          header: printOptions.header,
          footer: printOptions.footer,
        },
        (success, failureReason) => {
          clearTimeout(timeoutId);

          resolve({
            success,
            error: success ? undefined : failureReason || 'Print failed',
            printerName,
            duration: Date.now() - startTime,
          });
        }
      );
    });
  }

  /**
   * Print multiple documents silently
   */
  static async printBatch(
    jobs: Array<{
      webContents: WebContents;
      options: SilentPrintOptions;
    }>
  ): Promise<SilentPrintResult[]> {
    const results: SilentPrintResult[] = [];

    for (const job of jobs) {
      const result = await this.print(job.webContents, job.options);
      results.push(result);

      // Small delay between jobs to avoid overwhelming the spooler
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Schedule a print job
   */
  static schedulePrint(
    webContents: WebContents,
    options: SilentPrintOptions,
    delayMs: number
  ): { cancel: () => void; promise: Promise<SilentPrintResult> } {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const promise = new Promise<SilentPrintResult>((resolve) => {
      timeoutId = setTimeout(async () => {
        if (cancelled) {
          resolve({ success: false, error: 'Print job cancelled' });
          return;
        }

        const result = await this.print(webContents, options);
        resolve(result);
      }, delayMs);
    });

    return {
      cancel: () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      },
      promise,
    };
  }

  /**
   * Parse page range string into array of ranges
   */
  private static parsePageRange(
    range: string
  ): Array<{ from: number; to: number }> | undefined {
    const ranges: Array<{ from: number; to: number }> = [];

    const parts = range.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [from, to] = part.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(from) && !isNaN(to) && from <= to) {
          ranges.push({ from, to });
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page)) {
          ranges.push({ from: page, to: page });
        }
      }
    }

    return ranges.length > 0 ? ranges : undefined;
  }

  /**
   * Validate printer is available for silent printing
   */
  static async validatePrinter(
    printerName: string,
    window?: BrowserWindow
  ): Promise<{ valid: boolean; error?: string }> {
    const win = window || BrowserWindow.getAllWindows()[0];
    if (!win) {
      return { valid: false, error: 'No window available' };
    }

    const printer = await PrinterManager.getPrinter(printerName, win);
    if (!printer) {
      return { valid: false, error: `Printer "${printerName}" not found` };
    }

    if (printer.statusInfo?.status === 'offline') {
      return { valid: false, error: 'Printer is offline' };
    }

    if (printer.statusInfo?.status === 'error') {
      return { valid: false, error: 'Printer has an error' };
    }

    return { valid: true };
  }

  /**
   * Get recommended settings for silent printing
   */
  static getRecommendedSettings(): SilentPrintOptions {
    return {
      silent: true,
      printBackground: true,
      color: true,
      copies: 1,
      collate: true,
      scaleFactor: 100,
      timeout: 60000,
    };
  }
}

export default SilentPrint;
