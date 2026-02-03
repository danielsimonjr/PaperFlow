/**
 * Scan to PDF Conversion
 *
 * Converts scanned images to PDF with multi-page support,
 * compression, and metadata.
 */

import { PDFDocument, PDFPage } from 'pdf-lib';
import type { ScanResult, PDFConversionOptions } from './types';

/**
 * Default PDF conversion options
 */
const DEFAULT_OPTIONS: PDFConversionOptions = {
  quality: 85,
  title: 'Scanned Document',
  author: 'PaperFlow',
};

/**
 * Scan to PDF converter
 */
export class ScanToPDF {
  /**
   * Convert a single scan to PDF
   */
  static async convertSingle(
    scan: ScanResult,
    options: PDFConversionOptions = {}
  ): Promise<Uint8Array> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!scan.success || !scan.dataUrl) {
      throw new Error('Invalid scan result');
    }

    const pdfDoc = await PDFDocument.create();

    // Set metadata
    if (opts.title) pdfDoc.setTitle(opts.title);
    if (opts.author) pdfDoc.setAuthor(opts.author);
    if (opts.subject) pdfDoc.setSubject(opts.subject);
    if (opts.keywords) pdfDoc.setKeywords(opts.keywords);
    pdfDoc.setProducer('PaperFlow');
    pdfDoc.setCreator('PaperFlow');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Add page with scan
    await this.addScanPage(pdfDoc, scan, opts);

    // Save PDF
    return pdfDoc.save();
  }

  /**
   * Convert multiple scans to a single PDF
   */
  static async convertMultiple(
    scans: ScanResult[],
    options: PDFConversionOptions = {}
  ): Promise<Uint8Array> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (scans.length === 0) {
      throw new Error('No scans to convert');
    }

    const pdfDoc = await PDFDocument.create();

    // Set metadata
    if (opts.title) pdfDoc.setTitle(opts.title);
    if (opts.author) pdfDoc.setAuthor(opts.author);
    if (opts.subject) pdfDoc.setSubject(opts.subject);
    if (opts.keywords) pdfDoc.setKeywords(opts.keywords);
    pdfDoc.setProducer('PaperFlow');
    pdfDoc.setCreator('PaperFlow');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Add each scan as a page
    for (const scan of scans) {
      if (scan.success && scan.dataUrl) {
        await this.addScanPage(pdfDoc, scan, opts);
      }
    }

    // Save PDF
    return pdfDoc.save();
  }

  /**
   * Add a scan as a page to the PDF
   */
  // Note: options parameter reserved for future quality/compression settings
  private static async addScanPage(
    pdfDoc: PDFDocument,
    scan: ScanResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: PDFConversionOptions
  ): Promise<PDFPage> {
    if (!scan.dataUrl) {
      throw new Error('Scan has no data');
    }

    // Determine image type
    const isPng = scan.dataUrl.startsWith('data:image/png');
    const isJpeg =
      scan.dataUrl.startsWith('data:image/jpeg') ||
      scan.dataUrl.startsWith('data:image/jpg');

    // Convert data URL to bytes
    const imageBytes = this.dataUrlToBytes(scan.dataUrl);

    // Embed image
    let image;
    if (isPng) {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (isJpeg) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Unsupported image format');
    }

    // Calculate page size based on image dimensions and DPI
    const dpi = scan.resolution || 300;
    const pageWidth = (image.width / dpi) * 72; // Convert to points
    const pageHeight = (image.height / dpi) * 72;

    // Add page
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw image
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    return page;
  }

  /**
   * Convert data URL to byte array
   */
  private static dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1] ?? '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Estimate output PDF size
   */
  static estimateSize(
    scans: ScanResult[],
    options: PDFConversionOptions = {}
  ): number {
    const quality = options.quality || 85;
    let totalSize = 0;

    for (const scan of scans) {
      if (scan.width && scan.height) {
        // Rough estimate: pixels * bytes per pixel * quality factor
        const pixels = scan.width * scan.height;
        const bytesPerPixel = scan.colorMode === 'color' ? 3 : 1;
        const compressionFactor = quality / 100 * 0.3; // JPEG-like compression
        totalSize += pixels * bytesPerPixel * compressionFactor;
      }
    }

    // Add PDF overhead
    totalSize += 10000;

    return Math.round(totalSize);
  }

  /**
   * Get recommended quality based on usage
   */
  static getRecommendedQuality(
    usage: 'archive' | 'email' | 'print' | 'web'
  ): number {
    switch (usage) {
      case 'archive':
        return 95;
      case 'print':
        return 90;
      case 'email':
        return 75;
      case 'web':
        return 60;
      default:
        return 85;
    }
  }
}

export default ScanToPDF;
