/**
 * Enhanced Service Worker Configuration
 *
 * Workbox configuration for advanced caching strategies including
 * stale-while-revalidate for assets, cache-first for PDFs, and
 * network-first for API calls.
 */

import type { CacheEntryMetadata } from '@/types/offline';

/**
 * Cache names for different content types
 */
export const CACHE_NAMES = {
  STATIC_ASSETS: 'paperflow-static-v1',
  RUNTIME_ASSETS: 'paperflow-runtime-v1',
  PDF_DOCUMENTS: 'paperflow-pdfs-v1',
  IMAGES: 'paperflow-images-v1',
  FONTS: 'paperflow-fonts-v1',
  API_RESPONSES: 'paperflow-api-v1',
} as const;

/**
 * Cache expiration settings (in seconds)
 */
export const CACHE_EXPIRATION = {
  STATIC_ASSETS: 30 * 24 * 60 * 60, // 30 days
  RUNTIME_ASSETS: 7 * 24 * 60 * 60, // 7 days
  PDF_DOCUMENTS: 90 * 24 * 60 * 60, // 90 days
  IMAGES: 30 * 24 * 60 * 60, // 30 days
  FONTS: 365 * 24 * 60 * 60, // 1 year
  API_RESPONSES: 5 * 60, // 5 minutes
} as const;

/**
 * Maximum cache entries per cache
 */
export const MAX_CACHE_ENTRIES = {
  STATIC_ASSETS: 100,
  RUNTIME_ASSETS: 50,
  PDF_DOCUMENTS: 20,
  IMAGES: 100,
  FONTS: 20,
  API_RESPONSES: 50,
} as const;

/**
 * URL patterns for different caching strategies
 */
export const URL_PATTERNS = {
  STATIC_ASSETS: /\.(js|css|html)$/,
  IMAGES: /\.(png|jpg|jpeg|gif|svg|webp|ico)$/,
  FONTS: /\.(woff|woff2|ttf|otf|eot)$/,
  PDF_DOCUMENTS: /\.pdf$/,
  PDF_JS: /pdfjs-dist/,
  API: /\/api\//,
} as const;

/**
 * Caching strategy types
 */
export type CachingStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

/**
 * Route configuration for caching
 */
export interface RouteConfig {
  pattern: RegExp | string;
  strategy: CachingStrategy;
  cacheName: string;
  maxEntries: number;
  maxAgeSeconds: number;
  networkTimeoutSeconds?: number;
}

/**
 * Get all route configurations
 */
export function getRouteConfigs(): RouteConfig[] {
  return [
    // Static assets - stale-while-revalidate for fast loading with background updates
    {
      pattern: URL_PATTERNS.STATIC_ASSETS,
      strategy: 'stale-while-revalidate',
      cacheName: CACHE_NAMES.STATIC_ASSETS,
      maxEntries: MAX_CACHE_ENTRIES.STATIC_ASSETS,
      maxAgeSeconds: CACHE_EXPIRATION.STATIC_ASSETS,
    },
    // PDF.js library - cache-first for reliability
    {
      pattern: URL_PATTERNS.PDF_JS,
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.STATIC_ASSETS,
      maxEntries: MAX_CACHE_ENTRIES.STATIC_ASSETS,
      maxAgeSeconds: CACHE_EXPIRATION.STATIC_ASSETS,
    },
    // PDF documents - cache-first for offline access
    {
      pattern: URL_PATTERNS.PDF_DOCUMENTS,
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.PDF_DOCUMENTS,
      maxEntries: MAX_CACHE_ENTRIES.PDF_DOCUMENTS,
      maxAgeSeconds: CACHE_EXPIRATION.PDF_DOCUMENTS,
    },
    // Images - cache-first with background update
    {
      pattern: URL_PATTERNS.IMAGES,
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.IMAGES,
      maxEntries: MAX_CACHE_ENTRIES.IMAGES,
      maxAgeSeconds: CACHE_EXPIRATION.IMAGES,
    },
    // Fonts - cache-first (fonts rarely change)
    {
      pattern: URL_PATTERNS.FONTS,
      strategy: 'cache-first',
      cacheName: CACHE_NAMES.FONTS,
      maxEntries: MAX_CACHE_ENTRIES.FONTS,
      maxAgeSeconds: CACHE_EXPIRATION.FONTS,
    },
    // API calls - network-first with cache fallback
    {
      pattern: URL_PATTERNS.API,
      strategy: 'network-first',
      cacheName: CACHE_NAMES.API_RESPONSES,
      maxEntries: MAX_CACHE_ENTRIES.API_RESPONSES,
      maxAgeSeconds: CACHE_EXPIRATION.API_RESPONSES,
      networkTimeoutSeconds: 10,
    },
  ];
}

/**
 * Generate cache key for a request
 */
export function generateCacheKey(request: Request): string {
  const url = new URL(request.url);
  // Include method and essential query params in cache key
  return `${request.method}:${url.pathname}${url.search}`;
}

/**
 * Check if a request should be cached
 */
export function shouldCache(request: Request): boolean {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }

  const url = new URL(request.url);

  // Don't cache chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return false;
  }

  // Don't cache websocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return false;
  }

  return true;
}

/**
 * Get cache entry metadata
 */
export async function getCacheEntryMetadata(
  cache: Cache,
  request: Request
): Promise<CacheEntryMetadata | null> {
  const response = await cache.match(request);
  if (!response) {
    return null;
  }

  const cachedAt = response.headers.get('sw-cached-at');
  const contentLength = response.headers.get('content-length');

  return {
    url: request.url,
    cachedAt: cachedAt ? new Date(cachedAt) : new Date(),
    size: contentLength ? parseInt(contentLength, 10) : 0,
    etag: response.headers.get('etag') || undefined,
    contentType: response.headers.get('content-type') || undefined,
  };
}

/**
 * Add cache metadata to response
 */
export function addCacheMetadata(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', new Date().toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Calculate cache storage usage
 */
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return { usage: 0, quota: 0, percentUsed: 0 };
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);

  // Delete old cache versions
  await Promise.all(
    cacheNames
      .filter((name) => !currentCaches.includes(name as (typeof CACHE_NAMES)[keyof typeof CACHE_NAMES]))
      .map((name) => caches.delete(name))
  );
}

/**
 * Clean up cache entries exceeding limits
 */
export async function cleanupCacheEntries(
  cacheName: string,
  maxEntries: number,
  maxAgeSeconds: number
): Promise<void> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();

  const entries: Array<{ request: Request; cachedAt: number }> = [];

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const cachedAtHeader = response.headers.get('sw-cached-at');
      const cachedAt = cachedAtHeader ? new Date(cachedAtHeader).getTime() : 0;
      entries.push({ request, cachedAt });
    }
  }

  // Remove expired entries
  for (const entry of entries) {
    if (now - entry.cachedAt > maxAgeSeconds * 1000) {
      await cache.delete(entry.request);
    }
  }

  // Sort by age (oldest first) and remove excess entries
  entries.sort((a, b) => a.cachedAt - b.cachedAt);
  const validEntries = entries.filter((e) => now - e.cachedAt <= maxAgeSeconds * 1000);

  if (validEntries.length > maxEntries) {
    const toRemove = validEntries.slice(0, validEntries.length - maxEntries);
    for (const entry of toRemove) {
      await cache.delete(entry.request);
    }
  }
}

/**
 * Precache critical assets
 */
export function getPrecacheUrls(): string[] {
  return [
    '/',
    '/index.html',
    '/manifest.json',
    '/pdf.worker.min.js',
  ];
}

/**
 * Service worker version for cache busting
 */
export const SW_VERSION = '1.0.0';
