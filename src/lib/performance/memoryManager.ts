/**
 * Memory management for large PDF documents.
 * Monitors memory usage and provides utilities for releasing unused resources.
 */

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  usedPercent: number;
  message: string;
}

const MB = 1024 * 1024;
const MEMORY_THRESHOLDS = {
  low: 0.5,     // 50% used
  medium: 0.7,  // 70% used
  high: 0.85,   // 85% used
  critical: 0.95, // 95% used
};

/**
 * Check if the Performance.memory API is available (Chrome only).
 */
export function isMemoryApiAvailable(): boolean {
  return typeof performance !== 'undefined' &&
    'memory' in performance;
}

/**
 * Get current memory usage information.
 * Returns null if the Performance.memory API is not available.
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (!isMemoryApiAvailable()) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}

/**
 * Get the current memory usage level.
 */
export function getMemoryWarning(): MemoryWarning | null {
  const info = getMemoryInfo();
  if (!info) return null;

  const usedPercent = info.usedJSHeapSize / info.jsHeapSizeLimit;

  if (usedPercent >= MEMORY_THRESHOLDS.critical) {
    return {
      level: 'critical',
      usedPercent,
      message: `Critical memory usage: ${formatMemory(info.usedJSHeapSize)} of ${formatMemory(info.jsHeapSizeLimit)}`,
    };
  }
  if (usedPercent >= MEMORY_THRESHOLDS.high) {
    return {
      level: 'high',
      usedPercent,
      message: `High memory usage: ${formatMemory(info.usedJSHeapSize)} of ${formatMemory(info.jsHeapSizeLimit)}`,
    };
  }
  if (usedPercent >= MEMORY_THRESHOLDS.medium) {
    return {
      level: 'medium',
      usedPercent,
      message: `Moderate memory usage: ${formatMemory(info.usedJSHeapSize)}`,
    };
  }
  if (usedPercent >= MEMORY_THRESHOLDS.low) {
    return {
      level: 'low',
      usedPercent,
      message: `Normal memory usage: ${formatMemory(info.usedJSHeapSize)}`,
    };
  }

  return null;
}

/**
 * Format bytes as a human-readable memory string.
 */
export function formatMemory(bytes: number): string {
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

/**
 * Estimate memory needed for a document based on page count and average page size.
 */
export function estimateDocumentMemory(
  pageCount: number,
  avgPageSizeKB: number = 200
): { estimated: number; isLargeDocument: boolean; warning: string | null } {
  const estimated = pageCount * avgPageSizeKB * 1024;
  const isLargeDocument = pageCount > 100 || estimated > 100 * MB;

  let warning: string | null = null;
  if (pageCount > 500) {
    warning = `This document has ${pageCount} pages and may use significant memory. Consider using page-at-a-time viewing.`;
  } else if (estimated > 200 * MB) {
    warning = `This document is estimated to use ${formatMemory(estimated)} of memory.`;
  }

  return { estimated, isLargeDocument, warning };
}

/**
 * Track and manage disposable canvas elements to free memory.
 */
export class CanvasDisposer {
  private canvases: Map<string, HTMLCanvasElement> = new Map();

  register(id: string, canvas: HTMLCanvasElement): void {
    this.canvases.set(id, canvas);
  }

  dispose(id: string): void {
    const canvas = this.canvases.get(id);
    if (canvas) {
      // Clear canvas to release GPU memory
      canvas.width = 0;
      canvas.height = 0;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, 0, 0);
      this.canvases.delete(id);
    }
  }

  disposeAll(): void {
    for (const id of this.canvases.keys()) {
      this.dispose(id);
    }
  }

  get count(): number {
    return this.canvases.size;
  }
}
