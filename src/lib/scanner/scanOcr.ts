/**
 * Scan OCR Integration
 *
 * Integrates Tesseract.js OCR to create searchable PDFs
 * from scanned documents.
 */

import { createWorker, Worker, OEM, PSM, Page } from 'tesseract.js';
import type { ScanResult } from './types';

/**
 * Internal OCR settings (different from scanner types)
 */
interface InternalOCRSettings {
  language: string;
  confidence: number;
  preserveLayout: boolean;
}

/**
 * Default OCR settings
 */
const DEFAULT_OCR_SETTINGS: InternalOCRSettings = {
  language: 'eng',
  confidence: 60,
  preserveLayout: true,
};

/**
 * OCR result with positioning for PDF text layer
 */
export interface OCRTextItem {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  baseline: number;
  fontSize: number;
}

/**
 * Page OCR result
 */
export interface PageOCRResult {
  text: string;
  confidence: number;
  words: OCRTextItem[];
  lines: OCRTextItem[];
  paragraphs: OCRTextItem[];
  width: number;
  height: number;
}

/**
 * Scan OCR Service
 */
export class ScanOCR {
  private worker: Worker | null = null;
  private isInitialized = false;
  private currentLanguage: string = 'eng';

  /**
   * Initialize OCR worker
   */
  async initialize(language: string = 'eng'): Promise<void> {
    if (this.isInitialized && this.currentLanguage === language) {
      return;
    }

    // Terminate existing worker if switching languages
    if (this.worker) {
      await this.worker.terminate();
    }

    this.worker = await createWorker(language, OEM.LSTM_ONLY, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Could emit progress events here
        }
      },
    });

    await this.worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    this.currentLanguage = language;
    this.isInitialized = true;
  }

  /**
   * Perform OCR on a scan result
   */
  async recognize(
    scan: ScanResult,
    settings: Partial<InternalOCRSettings> = {}
  ): Promise<PageOCRResult> {
    const opts = { ...DEFAULT_OCR_SETTINGS, ...settings };

    await this.initialize(opts.language);

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    if (!scan.dataUrl) {
      throw new Error('Scan has no image data');
    }

    const result = await this.worker.recognize(scan.dataUrl);
    const data = result.data as Page;

    // Extract words with positioning
    const words: OCRTextItem[] = ((data as unknown as { words?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number }; baseline: { y1: number } }> }).words || []).map((word) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
      baseline: word.baseline.y1,
      fontSize: word.bbox.y1 - word.bbox.y0,
    }));

    // Extract lines
    const lines: OCRTextItem[] = ((data as unknown as { lines?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number }; baseline: { y1: number } }> }).lines || []).map((line) => ({
      text: line.text,
      confidence: line.confidence,
      bbox: line.bbox,
      baseline: line.baseline.y1,
      fontSize: line.bbox.y1 - line.bbox.y0,
    }));

    // Extract paragraphs
    const paragraphs: OCRTextItem[] = ((data as unknown as { paragraphs?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> }).paragraphs || []).map((para) => ({
      text: para.text,
      confidence: para.confidence,
      bbox: para.bbox,
      baseline: para.bbox.y1,
      fontSize: para.bbox.y1 - para.bbox.y0,
    }));

    return {
      text: data.text,
      confidence: data.confidence,
      words: words.filter((w) => w.confidence >= opts.confidence),
      lines: lines.filter((l) => l.confidence >= opts.confidence),
      paragraphs,
      width: scan.width || 0,
      height: scan.height || 0,
    };
  }

  /**
   * Perform OCR on multiple scans
   */
  async recognizeBatch(
    scans: ScanResult[],
    settings: Partial<InternalOCRSettings> = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<PageOCRResult[]> {
    const results: PageOCRResult[] = [];

    for (let i = 0; i < scans.length; i++) {
      const scan = scans[i];
      if (!scan) continue;
      const result = await this.recognize(scan, settings);
      results.push(result);
      onProgress?.(i + 1, scans.length);
    }

    return results;
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'eng', name: 'English' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'spa', name: 'Spanish' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'nld', name: 'Dutch' },
      { code: 'pol', name: 'Polish' },
      { code: 'rus', name: 'Russian' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'chi_tra', name: 'Chinese (Traditional)' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
    ];
  }

  /**
   * Create invisible text layer for PDF
   */
  static createTextLayer(
    ocrResult: PageOCRResult,
    pdfWidth: number,
    pdfHeight: number
  ): { text: string; x: number; y: number; fontSize: number }[] {
    const scaleX = pdfWidth / ocrResult.width;
    const scaleY = pdfHeight / ocrResult.height;

    return ocrResult.words.map((word) => ({
      text: word.text,
      x: word.bbox.x0 * scaleX,
      // PDF coordinates are from bottom-left
      y: pdfHeight - word.bbox.y1 * scaleY,
      fontSize: Math.max(1, word.fontSize * scaleY * 0.8),
    }));
  }

  /**
   * Preprocess image for better OCR results
   */
  static async preprocessForOCR(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        // Draw original
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const gray = r * 0.299 + g * 0.587 + b * 0.114;

          // Increase contrast
          const contrast = 1.3;
          const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));

          data[i] = adjusted;
          data[i + 1] = adjusted;
          data[i + 2] = adjusted;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  }

  /**
   * Estimate OCR quality based on image properties
   */
  static estimateQuality(scan: ScanResult): 'excellent' | 'good' | 'fair' | 'poor' {
    const resolution = scan.resolution || 150;
    const isColor = scan.colorMode === 'color';

    if (resolution >= 300) {
      return 'excellent';
    } else if (resolution >= 200) {
      return isColor ? 'fair' : 'good';
    } else if (resolution >= 150) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Get OCR recommendations based on scan quality
   */
  static getRecommendations(scan: ScanResult): string[] {
    const recommendations: string[] = [];
    const quality = this.estimateQuality(scan);

    if (quality === 'poor' || quality === 'fair') {
      if ((scan.resolution || 0) < 200) {
        recommendations.push('Increase scan resolution to 300 DPI for better OCR results');
      }
      if (scan.colorMode === 'color') {
        recommendations.push('Use grayscale or black & white mode for text documents');
      }
    }

    return recommendations;
  }

  /**
   * Terminate OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let instance: ScanOCR | null = null;

export function getScanOCR(): ScanOCR {
  if (!instance) {
    instance = new ScanOCR();
  }
  return instance;
}

export default ScanOCR;
