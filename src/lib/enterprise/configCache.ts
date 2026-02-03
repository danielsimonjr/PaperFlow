/**
 * Configuration Cache (Sprint 20)
 *
 * Caches configuration data for offline support and performance.
 */

import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  key: string;
  source: string;
  cachedAt: number;
  expiresAt: number;
  etag?: string;
  hash?: string;
  size: number;
}

/**
 * Cache entry
 */
export interface CacheEntry {
  metadata: CacheEntryMetadata;
  config: EnterpriseConfig;
}

/**
 * Cache options
 */
export interface ConfigCacheOptions {
  /** Maximum cache entries */
  maxEntries?: number;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Storage key prefix */
  storagePrefix?: string;
  /** Use localStorage (vs memory only) */
  persistent?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: ConfigCacheOptions = {
  maxEntries: 10,
  defaultTTL: 300000, // 5 minutes
  storagePrefix: 'paperflow-config-cache',
  persistent: true,
};

/**
 * Configuration cache class
 */
export class ConfigCache {
  private options: ConfigCacheOptions;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats = { hits: 0, misses: 0 };

  constructor(options: ConfigCacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.loadFromStorage();
  }

  /**
   * Get a cached configuration
   */
  get(key: string): CacheEntry | null {
    // Try memory cache first
    let entry: CacheEntry | undefined = this.memoryCache.get(key);

    // Try persistent storage
    if (!entry && this.options.persistent) {
      const loaded = this.loadEntryFromStorage(key);
      if (loaded) {
        entry = loaded;
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiry
    if (Date.now() > entry.metadata.expiresAt) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry;
  }

  /**
   * Set a cached configuration
   */
  set(
    key: string,
    config: EnterpriseConfig,
    options: {
      source?: string;
      ttl?: number;
      etag?: string;
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl ?? this.options.defaultTTL ?? 300000;

    const configString = JSON.stringify(config);
    const entry: CacheEntry = {
      metadata: {
        key,
        source: options.source || 'unknown',
        cachedAt: now,
        expiresAt: now + ttl,
        etag: options.etag,
        hash: this.hashString(configString),
        size: configString.length,
      },
      config,
    };

    // Evict if necessary
    if (this.memoryCache.size >= (this.options.maxEntries ?? 10)) {
      this.evictOldest();
    }

    this.memoryCache.set(key, entry);

    // Persist
    if (this.options.persistent) {
      this.saveEntryToStorage(key, entry);
    }
  }

  /**
   * Delete a cached entry
   */
  delete(key: string): boolean {
    const existed = this.memoryCache.delete(key);

    if (this.options.persistent) {
      this.deleteFromStorage(key);
    }

    return existed;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.memoryCache.clear();

    if (this.options.persistent) {
      this.clearStorage();
    }
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.metadata.size;
    }

    const total = this.stats.hits + this.stats.misses;
    return {
      entries: this.memoryCache.size,
      totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Get all cached keys
   */
  keys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * Get metadata for all entries
   */
  getAllMetadata(): CacheEntryMetadata[] {
    return Array.from(this.memoryCache.values()).map((entry) => entry.metadata);
  }

  /**
   * Refresh TTL for an entry
   */
  touch(key: string, newTTL?: number): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    const ttl = newTTL ?? this.options.defaultTTL ?? 300000;
    entry.metadata.expiresAt = Date.now() + ttl;

    if (this.options.persistent) {
      this.saveEntryToStorage(key, entry);
    }

    return true;
  }

  /**
   * Get entry if hash matches (for conditional updates)
   */
  getIfMatch(key: string, hash: string): CacheEntry | null {
    const entry = this.get(key);
    if (entry && entry.metadata.hash === hash) {
      return entry;
    }
    return null;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache) {
      if (entry.metadata.cachedAt < oldestTime) {
        oldestTime = entry.metadata.cachedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Load all entries from storage
   */
  private loadFromStorage(): void {
    if (!this.options.persistent) return;

    try {
      const indexKey = `${this.options.storagePrefix}-index`;
      const indexJson = localStorage.getItem(indexKey);

      if (!indexJson) return;

      const index: string[] = JSON.parse(indexJson);

      for (const key of index) {
        const entry = this.loadEntryFromStorage(key);
        if (entry && Date.now() <= entry.metadata.expiresAt) {
          this.memoryCache.set(key, entry);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load a single entry from storage
   */
  private loadEntryFromStorage(key: string): CacheEntry | null {
    try {
      const storageKey = `${this.options.storagePrefix}-${key}`;
      const json = localStorage.getItem(storageKey);

      if (!json) return null;

      return JSON.parse(json) as CacheEntry;
    } catch {
      return null;
    }
  }

  /**
   * Save entry to storage
   */
  private saveEntryToStorage(key: string, entry: CacheEntry): void {
    try {
      const storageKey = `${this.options.storagePrefix}-${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));

      // Update index
      this.updateStorageIndex();
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }

  /**
   * Delete from storage
   */
  private deleteFromStorage(key: string): void {
    try {
      const storageKey = `${this.options.storagePrefix}-${key}`;
      localStorage.removeItem(storageKey);
      this.updateStorageIndex();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Clear storage
   */
  private clearStorage(): void {
    try {
      const prefix = this.options.storagePrefix || 'paperflow-config-cache';

      // Remove all entries with prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Update storage index
   */
  private updateStorageIndex(): void {
    try {
      const indexKey = `${this.options.storagePrefix}-index`;
      const keys = Array.from(this.memoryCache.keys());
      localStorage.setItem(indexKey, JSON.stringify(keys));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Create a configuration cache
 */
export function createConfigCache(options?: ConfigCacheOptions): ConfigCache {
  return new ConfigCache(options);
}

/**
 * Global cache instance
 */
let globalCache: ConfigCache | null = null;

/**
 * Get global cache instance
 */
export function getGlobalCache(): ConfigCache {
  if (!globalCache) {
    globalCache = new ConfigCache();
  }
  return globalCache;
}

export default ConfigCache;
