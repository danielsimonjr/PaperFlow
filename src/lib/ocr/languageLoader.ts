/**
 * Language Loader for OCR
 * Manages downloading and caching of Tesseract language data files.
 */

import type { OCRLanguage, OCRProgress } from './types';
import { SUPPORTED_LANGUAGES } from './types';

/**
 * Language data cache using IndexedDB
 */
const DB_NAME = 'paperflow-ocr';
const DB_VERSION = 1;
const STORE_NAME = 'language-data';

/**
 * Opens the IndexedDB database for language data caching
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'code' });
      }
    };
  });
}

/**
 * Language Loader class for managing OCR language data
 */
export class LanguageLoader {
  private downloadedLanguages: Set<string> = new Set();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_onProgress?: (progress: OCRProgress) => void) {
    // Progress callback reserved for future use (downloading language data)
  }

  /**
   * Gets list of available languages with download status
   */
  async getAvailableLanguages(): Promise<OCRLanguage[]> {
    const downloaded = await this.getDownloadedLanguages();

    return SUPPORTED_LANGUAGES.map((lang) => ({
      ...lang,
      isDownloaded: downloaded.has(lang.code),
    }));
  }

  /**
   * Gets the set of languages that have been downloaded
   */
  async getDownloadedLanguages(): Promise<Set<string>> {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => {
          const keys = request.result as string[];
          this.downloadedLanguages = new Set(keys);
          resolve(this.downloadedLanguages);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      // IndexedDB not available, return empty set
      return new Set();
    }
  }

  /**
   * Checks if a language is downloaded
   */
  async isLanguageDownloaded(languageCode: string): Promise<boolean> {
    const downloaded = await this.getDownloadedLanguages();
    return downloaded.has(languageCode);
  }

  /**
   * Gets the display name for a language code
   */
  getLanguageName(code: string): string {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang?.name ?? code;
  }

  /**
   * Marks a language as downloaded (called after successful Tesseract initialization)
   */
  async markLanguageDownloaded(languageCode: string): Promise<void> {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          code: languageCode,
          downloadedAt: new Date().toISOString(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.downloadedLanguages.add(languageCode);
    } catch (error) {
      console.warn('Failed to cache language download status:', error);
    }
  }

  /**
   * Removes a language from the download cache
   */
  async removeLanguage(languageCode: string): Promise<void> {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(languageCode);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.downloadedLanguages.delete(languageCode);
    } catch (error) {
      console.warn('Failed to remove language from cache:', error);
    }
  }

  /**
   * Clears all cached language data
   */
  async clearCache(): Promise<void> {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.downloadedLanguages.clear();
    } catch (error) {
      console.warn('Failed to clear language cache:', error);
    }
  }

  /**
   * Estimates the download size for a language
   * Language data files are typically 10-15MB for Latin scripts,
   * larger for CJK languages
   */
  estimateDownloadSize(languageCode: string): number {
    const cjkLanguages = ['jpn', 'chi_sim', 'chi_tra', 'kor'];
    const arabicScript = ['ara', 'hin'];

    if (cjkLanguages.includes(languageCode)) {
      return 25 * 1024 * 1024; // ~25MB for CJK
    }
    if (arabicScript.includes(languageCode)) {
      return 15 * 1024 * 1024; // ~15MB for Arabic/Indic
    }
    return 10 * 1024 * 1024; // ~10MB for Latin scripts
  }

  /**
   * Validates a language code
   */
  isValidLanguageCode(code: string): boolean {
    return SUPPORTED_LANGUAGES.some((l) => l.code === code);
  }

  /**
   * Gets multiple language codes as a combined string for Tesseract
   * (e.g., 'eng+fra+deu')
   */
  combineLanguages(codes: string[]): string {
    return codes.filter((c) => this.isValidLanguageCode(c)).join('+');
  }

  /**
   * Parses a combined language string back to array
   */
  parseLanguages(combined: string): string[] {
    return combined.split('+').filter((c) => this.isValidLanguageCode(c));
  }
}

/**
 * Singleton instance of the language loader
 */
let languageLoaderInstance: LanguageLoader | null = null;

/**
 * Gets the singleton language loader instance
 */
export function getLanguageLoader(
  onProgress?: (progress: OCRProgress) => void
): LanguageLoader {
  if (!languageLoaderInstance) {
    languageLoaderInstance = new LanguageLoader(onProgress);
  }
  return languageLoaderInstance;
}

/**
 * Checks browser support for OCR features
 */
export function checkOCRSupport(): {
  webWorkers: boolean;
  indexedDB: boolean;
  webAssembly: boolean;
  canvas: boolean;
} {
  return {
    webWorkers: typeof Worker !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
    canvas: typeof HTMLCanvasElement !== 'undefined',
  };
}

/**
 * Gets the total size of cached language data
 */
export async function getCacheSize(): Promise<number> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage ?? 0;
    }
  } catch {
    // Storage API not available
  }
  return 0;
}
