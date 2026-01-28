/**
 * LRU cache for page thumbnails.
 * Caches rendered thumbnail data URLs to avoid re-rendering.
 */
export class ThumbnailCache {
  private cache: Map<string, string>;
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  private makeKey(documentId: string, pageNumber: number, scale: number): string {
    return `${documentId}:${pageNumber}:${scale}`;
  }

  get(documentId: string, pageNumber: number, scale: number): string | null {
    const key = this.makeKey(documentId, pageNumber, scale);
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }

    return null;
  }

  set(documentId: string, pageNumber: number, scale: number, dataUrl: string): void {
    const key = this.makeKey(documentId, pageNumber, scale);

    // Remove if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, dataUrl);
  }

  has(documentId: string, pageNumber: number, scale: number): boolean {
    return this.cache.has(this.makeKey(documentId, pageNumber, scale));
  }

  invalidate(documentId: string): void {
    const prefix = `${documentId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global singleton instance
export const thumbnailCache = new ThumbnailCache(200);
