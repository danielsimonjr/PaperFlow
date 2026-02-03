/**
 * Virtual PDF Printer
 *
 * Creates a virtual printer option that saves output as PDF
 * with configurable settings.
 */

import type { PrintSettings } from '@stores/printStore';

/**
 * Virtual printer options
 */
export interface VirtualPrinterOptions {
  /** Output file path */
  outputPath: string;
  /** File name pattern (supports placeholders) */
  fileNamePattern?: string;
  /** Overwrite existing files */
  overwriteExisting?: boolean;
  /** Open file after saving */
  openAfterSave?: boolean;
  /** PDF settings */
  pdfSettings?: PDFOutputSettings;
}

/**
 * PDF output settings
 */
export interface PDFOutputSettings {
  /** PDF version */
  version?: '1.4' | '1.5' | '1.6' | '1.7';
  /** Embed fonts */
  embedFonts?: boolean;
  /** Compress content */
  compress?: boolean;
  /** PDF/A compliance */
  pdfaCompliance?: boolean;
  /** Add metadata */
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  };
}

/**
 * Virtual print result
 */
export interface VirtualPrintResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Virtual printer name
 */
export const VIRTUAL_PRINTER_NAME = 'PaperFlow PDF Printer';

/**
 * Virtual printer info
 */
export const VIRTUAL_PRINTER_INFO = {
  name: VIRTUAL_PRINTER_NAME,
  displayName: 'Save as PDF',
  description: 'Save document as PDF file',
  isDefault: false,
  status: 'idle' as const,
  colorCapable: true,
  duplexCapable: false,
};

/**
 * Virtual PDF Printer
 */
export class VirtualPrinter {
  private options: VirtualPrinterOptions;

  constructor(options: VirtualPrinterOptions) {
    this.options = {
      fileNamePattern: '{documentName}_{timestamp}.pdf',
      overwriteExisting: false,
      openAfterSave: false,
      pdfSettings: {
        version: '1.7',
        embedFonts: true,
        compress: true,
        pdfaCompliance: false,
      },
      ...options,
    };
  }

  /**
   * Print to PDF file
   */
  // Note: settings parameter provided for API compatibility with physical printers
  async print(
    pdfData: Uint8Array | ArrayBuffer,
    documentName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _settings: PrintSettings
  ): Promise<VirtualPrintResult> {
    try {
      // Generate file name
      const fileName = this.generateFileName(documentName);
      const filePath = this.options.outputPath
        ? `${this.options.outputPath}/${fileName}`
        : fileName;

      // In Electron context, we'd use the file system API
      // For now, we'll use the browser download API as fallback
      let blobData: BlobPart;
      if (pdfData instanceof ArrayBuffer) {
        blobData = pdfData;
      } else {
        // Create a copy to ensure we have a proper ArrayBuffer
        blobData = new Uint8Array(pdfData).buffer as ArrayBuffer;
      }
      const blob = new Blob([blobData], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      return {
        success: true,
        filePath,
        fileSize: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save PDF',
      };
    }
  }

  /**
   * Generate file name from pattern
   */
  private generateFileName(documentName: string): string {
    const pattern = this.options.fileNamePattern || '{documentName}.pdf';
    const now = new Date();

    const replacements: Record<string, string> = {
      '{documentName}': this.sanitizeFileName(documentName.replace(/\.pdf$/i, '')),
      '{timestamp}': now.getTime().toString(),
      '{date}': now.toISOString().split('T')[0] ?? '',
      '{time}': (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-'),
      '{year}': now.getFullYear().toString(),
      '{month}': String(now.getMonth() + 1).padStart(2, '0'),
      '{day}': String(now.getDate()).padStart(2, '0'),
    };

    let fileName = pattern;
    for (const [placeholder, value] of Object.entries(replacements)) {
      fileName = fileName.replace(new RegExp(placeholder, 'g'), value);
    }

    // Ensure .pdf extension
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      fileName += '.pdf';
    }

    return fileName;
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  /**
   * Get virtual printer info
   */
  static getInfo(): typeof VIRTUAL_PRINTER_INFO {
    return VIRTUAL_PRINTER_INFO;
  }

  /**
   * Check if a printer name is the virtual printer
   */
  static isVirtualPrinter(name: string): boolean {
    return name === VIRTUAL_PRINTER_NAME || name === 'Save as PDF';
  }

  /**
   * Update options
   */
  setOptions(options: Partial<VirtualPrinterOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): VirtualPrinterOptions {
    return { ...this.options };
  }
}

export default VirtualPrinter;
