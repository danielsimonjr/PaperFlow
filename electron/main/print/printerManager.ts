/**
 * Printer Manager
 *
 * Manages system printers, their capabilities, and print operations.
 */

import { BrowserWindow, PrinterInfo } from 'electron';
import type {
  PrinterCapabilities,
  PrinterStatus,
  PrinterStatusInfo,
  ExtendedPrinterInfo,
  PaperSizeInfo,
} from './types';

/**
 * Standard paper sizes in points (1/72 inch)
 */
const STANDARD_PAPER_SIZES: PaperSizeInfo[] = [
  { name: 'Letter', displayName: 'Letter (8.5" x 11")', width: 612, height: 792, unit: 'points' },
  { name: 'Legal', displayName: 'Legal (8.5" x 14")', width: 612, height: 1008, unit: 'points' },
  { name: 'Tabloid', displayName: 'Tabloid (11" x 17")', width: 792, height: 1224, unit: 'points' },
  { name: 'A3', displayName: 'A3 (297mm x 420mm)', width: 842, height: 1191, unit: 'points' },
  { name: 'A4', displayName: 'A4 (210mm x 297mm)', width: 595, height: 842, unit: 'points' },
  { name: 'A5', displayName: 'A5 (148mm x 210mm)', width: 420, height: 595, unit: 'points' },
  { name: 'B4', displayName: 'B4 (250mm x 353mm)', width: 709, height: 1001, unit: 'points' },
  { name: 'B5', displayName: 'B5 (176mm x 250mm)', width: 499, height: 709, unit: 'points' },
  { name: 'Executive', displayName: 'Executive (7.25" x 10.5")', width: 522, height: 756, unit: 'points' },
  { name: 'Folio', displayName: 'Folio (8.5" x 13")', width: 612, height: 936, unit: 'points' },
];

/**
 * Printer manager class
 */
export class PrinterManager {
  private static printerCache: Map<string, ExtendedPrinterInfo> = new Map();
  private static lastRefresh = 0;
  private static cacheTimeout = 30000; // 30 seconds

  /**
   * Get all available printers
   */
  static async getPrinters(window?: BrowserWindow): Promise<ExtendedPrinterInfo[]> {
    const now = Date.now();
    if (now - this.lastRefresh > this.cacheTimeout) {
      await this.refreshPrinters(window);
    }
    return Array.from(this.printerCache.values());
  }

  /**
   * Refresh printer list
   */
  static async refreshPrinters(window?: BrowserWindow): Promise<void> {
    const win = window || BrowserWindow.getAllWindows()[0];
    if (!win) {
      return;
    }

    const printers = win.webContents.getPrinters();
    this.printerCache.clear();

    for (const printer of printers) {
      const extendedInfo: ExtendedPrinterInfo = {
        ...printer,
        capabilities: this.getDefaultCapabilities(printer),
        statusInfo: this.getDefaultStatusInfo(printer),
      };
      this.printerCache.set(printer.name, extendedInfo);
    }

    this.lastRefresh = Date.now();
  }

  /**
   * Get a specific printer by name
   */
  static async getPrinter(
    name: string,
    window?: BrowserWindow
  ): Promise<ExtendedPrinterInfo | null> {
    const printers = await this.getPrinters(window);
    return printers.find((p) => p.name === name) || null;
  }

  /**
   * Get the default printer
   */
  static async getDefaultPrinter(
    window?: BrowserWindow
  ): Promise<ExtendedPrinterInfo | null> {
    const printers = await this.getPrinters(window);
    return printers.find((p) => p.isDefault) || printers[0] || null;
  }

  /**
   * Get printer capabilities
   */
  static async getPrinterCapabilities(
    name: string,
    window?: BrowserWindow
  ): Promise<PrinterCapabilities | null> {
    const printer = await this.getPrinter(name, window);
    return printer?.capabilities || null;
  }

  /**
   * Get printer status
   */
  static async getPrinterStatus(
    name: string,
    window?: BrowserWindow
  ): Promise<PrinterStatusInfo | null> {
    const printer = await this.getPrinter(name, window);
    if (!printer) {
      return null;
    }

    // Update status based on printer.status
    const statusInfo = this.getDefaultStatusInfo(printer);
    return statusInfo;
  }

  /**
   * Check if printer is available
   */
  static async isPrinterAvailable(
    name: string,
    window?: BrowserWindow
  ): Promise<boolean> {
    const status = await this.getPrinterStatus(name, window);
    return status !== null && status.status !== 'offline' && status.status !== 'error';
  }

  /**
   * Get supported paper sizes for a printer
   */
  // Note: printerName and window parameters are provided for future platform-specific implementations
  static async getSupportedPaperSizes(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    printerName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    window?: BrowserWindow
  ): Promise<PaperSizeInfo[]> {
    // Electron doesn't provide paper size info directly
    // Return standard sizes
    return STANDARD_PAPER_SIZES;
  }

  /**
   * Get default capabilities for a printer
   */
  private static getDefaultCapabilities(printer: PrinterInfo): PrinterCapabilities {
    // Map Electron printer status to our status type
    const status = this.mapPrinterStatus(printer.status);

    return {
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || '',
      isDefault: printer.isDefault,
      status,
      paperSizes: STANDARD_PAPER_SIZES,
      colorCapable: true, // Assume color capable by default
      duplexCapable: true, // Assume duplex capable by default
      maxCopies: 999,
      maxDPI: { horizontal: 600, vertical: 600 },
      supportedMediaTypes: ['plain', 'glossy', 'matte', 'transparency', 'labels'],
      isNetworkPrinter: printer.name.includes('\\\\') || printer.description?.includes('network'),
      location: '',
    };
  }

  /**
   * Get default status info for a printer
   */
  private static getDefaultStatusInfo(printer: PrinterInfo): PrinterStatusInfo {
    const status = this.mapPrinterStatus(printer.status);

    return {
      name: printer.name,
      status,
      jobCount: 0,
      paperStatus: 'ok',
      inkStatus: [
        { color: 'black', level: 100, type: 'ink' },
        { color: 'cyan', level: 100, type: 'ink' },
        { color: 'magenta', level: 100, type: 'ink' },
        { color: 'yellow', level: 100, type: 'ink' },
      ],
    };
  }

  /**
   * Map Electron printer status to our status type
   */
  private static mapPrinterStatus(status: number): PrinterStatus {
    // Electron printer status values:
    // 0 = Idle, 1 = Processing, 2 = Paused, 3 = Error, etc.
    switch (status) {
      case 0:
        return 'idle';
      case 1:
        return 'printing';
      case 2:
        return 'paused';
      case 3:
        return 'error';
      case 4:
      case 5:
        return 'offline';
      default:
        return 'unknown';
    }
  }

  /**
   * Clear printer cache
   */
  static clearCache(): void {
    this.printerCache.clear();
    this.lastRefresh = 0;
  }

  /**
   * Set cache timeout
   */
  static setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }
}

export default PrinterManager;
