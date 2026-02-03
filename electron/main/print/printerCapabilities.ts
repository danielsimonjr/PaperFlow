/**
 * Printer Capabilities
 *
 * Retrieves and normalizes printer capabilities across different
 * printer types and operating systems.
 */

import type {
  PrinterCapabilities,
  PaperSizeInfo,
  PrintDPI,
} from './types';
import { PrinterManager } from './printerManager';
import { BrowserWindow } from 'electron';

/**
 * Common DPI values
 */
const COMMON_DPI_VALUES: PrintDPI[] = [
  { horizontal: 72, vertical: 72 },
  { horizontal: 150, vertical: 150 },
  { horizontal: 300, vertical: 300 },
  { horizontal: 600, vertical: 600 },
  { horizontal: 1200, vertical: 1200 },
  { horizontal: 2400, vertical: 2400 },
];

/**
 * Printer capabilities helper
 */
export class PrinterCapabilitiesHelper {
  /**
   * Get capabilities for a specific printer
   */
  static async getCapabilities(
    printerName: string,
    window?: BrowserWindow
  ): Promise<PrinterCapabilities | null> {
    return PrinterManager.getPrinterCapabilities(printerName, window);
  }

  /**
   * Get all paper sizes for a printer
   */
  static async getPaperSizes(
    printerName: string,
    window?: BrowserWindow
  ): Promise<PaperSizeInfo[]> {
    return PrinterManager.getSupportedPaperSizes(printerName, window);
  }

  /**
   * Check if printer supports a specific paper size
   */
  static async supportsPaperSize(
    printerName: string,
    paperSizeName: string,
    window?: BrowserWindow
  ): Promise<boolean> {
    const sizes = await this.getPaperSizes(printerName, window);
    return sizes.some((s) => s.name === paperSizeName);
  }

  /**
   * Get nearest paper size match
   */
  static async getNearestPaperSize(
    printerName: string,
    width: number,
    height: number,
    window?: BrowserWindow
  ): Promise<PaperSizeInfo | null> {
    const sizes = await this.getPaperSizes(printerName, window);

    let nearestSize: PaperSizeInfo | null = null;
    let minDiff = Infinity;

    for (const size of sizes) {
      // Check both orientations
      const diffNormal =
        Math.abs(size.width - width) + Math.abs(size.height - height);
      const diffRotated =
        Math.abs(size.height - width) + Math.abs(size.width - height);
      const diff = Math.min(diffNormal, diffRotated);

      if (diff < minDiff) {
        minDiff = diff;
        nearestSize = size;
      }
    }

    return nearestSize;
  }

  /**
   * Check if printer supports color
   */
  static async supportsColor(
    printerName: string,
    window?: BrowserWindow
  ): Promise<boolean> {
    const caps = await this.getCapabilities(printerName, window);
    return caps?.colorCapable ?? false;
  }

  /**
   * Check if printer supports duplex
   */
  static async supportsDuplex(
    printerName: string,
    window?: BrowserWindow
  ): Promise<boolean> {
    const caps = await this.getCapabilities(printerName, window);
    return caps?.duplexCapable ?? false;
  }

  /**
   * Get supported DPI values
   */
  static async getSupportedDPI(
    printerName: string,
    window?: BrowserWindow
  ): Promise<PrintDPI[]> {
    const caps = await this.getCapabilities(printerName, window);
    if (!caps) {
      return COMMON_DPI_VALUES;
    }

    // Filter DPI values based on max DPI
    return COMMON_DPI_VALUES.filter(
      (dpi) =>
        dpi.horizontal <= caps.maxDPI.horizontal &&
        dpi.vertical <= caps.maxDPI.vertical
    );
  }

  /**
   * Get max copies supported
   */
  static async getMaxCopies(
    printerName: string,
    window?: BrowserWindow
  ): Promise<number> {
    const caps = await this.getCapabilities(printerName, window);
    return caps?.maxCopies ?? 999;
  }

  /**
   * Get supported media types
   */
  static async getSupportedMediaTypes(
    printerName: string,
    window?: BrowserWindow
  ): Promise<string[]> {
    const caps = await this.getCapabilities(printerName, window);
    return caps?.supportedMediaTypes ?? [];
  }

  /**
   * Compare capabilities of two printers
   */
  static async compareCapabilities(
    printer1Name: string,
    printer2Name: string,
    window?: BrowserWindow
  ): Promise<{
    printer1: PrinterCapabilities | null;
    printer2: PrinterCapabilities | null;
    differences: string[];
  }> {
    const caps1 = await this.getCapabilities(printer1Name, window);
    const caps2 = await this.getCapabilities(printer2Name, window);

    const differences: string[] = [];

    if (caps1 && caps2) {
      if (caps1.colorCapable !== caps2.colorCapable) {
        differences.push('Color capability');
      }
      if (caps1.duplexCapable !== caps2.duplexCapable) {
        differences.push('Duplex capability');
      }
      if (caps1.maxCopies !== caps2.maxCopies) {
        differences.push('Max copies');
      }
      if (
        caps1.maxDPI.horizontal !== caps2.maxDPI.horizontal ||
        caps1.maxDPI.vertical !== caps2.maxDPI.vertical
      ) {
        differences.push('Max DPI');
      }
      if (caps1.paperSizes.length !== caps2.paperSizes.length) {
        differences.push('Paper sizes');
      }
    }

    return {
      printer1: caps1,
      printer2: caps2,
      differences,
    };
  }

  /**
   * Get recommended settings for document type
   */
  static getRecommendedSettings(
    documentType: 'text' | 'graphics' | 'photo' | 'draft',
    capabilities: PrinterCapabilities
  ): {
    color: boolean;
    dpi: PrintDPI;
    quality: 'draft' | 'normal' | 'high';
  } {
    switch (documentType) {
      case 'text':
        return {
          color: false,
          dpi: { horizontal: 300, vertical: 300 },
          quality: 'normal',
        };

      case 'graphics':
        return {
          color: capabilities.colorCapable,
          dpi: { horizontal: 600, vertical: 600 },
          quality: 'high',
        };

      case 'photo':
        return {
          color: capabilities.colorCapable,
          dpi: capabilities.maxDPI,
          quality: 'high',
        };

      case 'draft':
      default:
        return {
          color: false,
          dpi: { horizontal: 150, vertical: 150 },
          quality: 'draft',
        };
    }
  }

  /**
   * Validate print options against capabilities
   */
  static async validateOptions(
    printerName: string,
    options: {
      color?: boolean;
      duplex?: boolean;
      copies?: number;
      dpi?: PrintDPI;
      paperSize?: string;
    },
    window?: BrowserWindow
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const caps = await this.getCapabilities(printerName, window);
    const errors: string[] = [];

    if (!caps) {
      return { valid: false, errors: ['Printer not found'] };
    }

    if (options.color && !caps.colorCapable) {
      errors.push('Printer does not support color printing');
    }

    if (options.duplex && !caps.duplexCapable) {
      errors.push('Printer does not support duplex printing');
    }

    if (options.copies && options.copies > caps.maxCopies) {
      errors.push(`Max copies is ${caps.maxCopies}`);
    }

    if (options.dpi) {
      if (
        options.dpi.horizontal > caps.maxDPI.horizontal ||
        options.dpi.vertical > caps.maxDPI.vertical
      ) {
        errors.push(`Max DPI is ${caps.maxDPI.horizontal}x${caps.maxDPI.vertical}`);
      }
    }

    if (options.paperSize) {
      const supported = await this.supportsPaperSize(printerName, options.paperSize, window);
      if (!supported) {
        errors.push(`Paper size ${options.paperSize} is not supported`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default PrinterCapabilitiesHelper;
