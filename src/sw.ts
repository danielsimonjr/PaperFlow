/**
 * Enhanced Service Worker
 *
 * Implements advanced caching strategies with Workbox patterns,
 * background sync, and offline support.
 */

/// <reference lib="webworker" />

import {
  CACHE_NAMES,
  getRouteConfigs,
  shouldCache,
  addCacheMetadata,
  cleanupExpiredCaches,
  cleanupCacheEntries,
  getPrecacheUrls,
  SW_VERSION,
} from './lib/offline/serviceWorkerConfig';
import type { ServiceWorkerMessage, ServiceWorkerMessageType } from './types/offline';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Service worker version for debugging
console.log(`[SW] PaperFlow Service Worker v${SW_VERSION}`);

/**
 * Install event - precache critical assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAMES.STATIC_ASSETS);
      const precacheUrls = getPrecacheUrls();

      // Cache precache URLs
      await Promise.all(
        precacheUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, addCacheMetadata(response));
            }
          } catch (error) {
            console.warn(`[SW] Failed to precache: ${url}`, error);
          }
        })
      );

      // Take over immediately
      await self.skipWaiting();
      console.log('[SW] Installed successfully');
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      await cleanupExpiredCaches();

      // Claim all clients immediately
      await self.clients.claim();

      // Notify clients that SW is ready
      await notifyClients('OFFLINE_READY');

      console.log('[SW] Activated successfully');
    })()
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;

  // Skip non-cacheable requests
  if (!shouldCache(request)) {
    return;
  }

  // Find matching route config
  const routeConfigs = getRouteConfigs();
  const config = routeConfigs.find((c) => {
    if (typeof c.pattern === 'string') {
      return request.url.includes(c.pattern);
    }
    return c.pattern.test(request.url);
  });

  if (!config) {
    // Default: network-first for unmatched routes
    event.respondWith(networkFirst(request, CACHE_NAMES.RUNTIME_ASSETS));
    return;
  }

  // Apply configured strategy
  switch (config.strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(request, config.cacheName));
      break;
    case 'network-first':
      event.respondWith(
        networkFirst(request, config.cacheName, config.networkTimeoutSeconds)
      );
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(request, config.cacheName));
      break;
    case 'network-only':
      event.respondWith(fetch(request));
      break;
    case 'cache-only':
      event.respondWith(cacheOnly(request, config.cacheName));
      break;
    default:
      event.respondWith(networkFirst(request, config.cacheName));
  }
});

/**
 * Cache-first strategy
 * Returns cached response if available, otherwise fetches from network
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, addCacheMetadata(networkResponse.clone()));
    }
    return networkResponse;
  } catch {
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy
 * Tries network first, falls back to cache
 */
async function networkFirst(
  request: Request,
  cacheName: string,
  timeoutSeconds = 10
): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    // Race between network and timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), timeoutSeconds * 1000)
      ),
    ]);

    if (networkResponse.ok) {
      await cache.put(request, addCacheMetadata(networkResponse.clone()));
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, updates cache in background
 */
async function staleWhileRevalidate(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start network fetch in background
  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, addCacheMetadata(response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.warn('[SW] Background fetch failed:', error);
      return null;
    });

  // Return cached response if available, otherwise wait for network
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  return getOfflineFallback(request);
}

/**
 * Cache-only strategy
 */
async function cacheOnly(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  return getOfflineFallback(request);
}

/**
 * Get offline fallback response
 */
function getOfflineFallback(request: Request): Response {

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>PaperFlow - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f3f4f6;
              color: #374151;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 { margin-bottom: 0.5rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; }
            button {
              background: #3B82F6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #2563EB; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>PaperFlow requires an internet connection for this action.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // Return appropriate error for other requests
  return new Response(JSON.stringify({ error: 'Offline' }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Background sync handler
 */
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'paperflow-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

/**
 * Perform background sync
 */
async function performBackgroundSync(): Promise<void> {
  try {
    // Notify clients that sync is starting
    await notifyClients('SYNC_REQUESTED');

    // Get pending operations from IndexedDB
    const db = await openSyncDB();
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const items = await promisifyRequest(store.getAll());

    for (const item of items) {
      if (item.status === 'pending') {
        try {
          // Process the queued operation
          await processQueueItem(item);
        } catch (error) {
          console.error('[SW] Failed to process queue item:', error);
        }
      }
    }

    await notifyClients('SYNC_COMPLETED');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    await notifyClients('SYNC_FAILED', { error: String(error) });
  }
}

/**
 * Process a single queue item
 */
async function processQueueItem(item: unknown): Promise<void> {
  // This will be implemented by the queue processor
  // For now, just log the item
  console.log('[SW] Processing queue item:', item);
}

/**
 * Periodic sync handler (if supported)
 */
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'paperflow-periodic-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event: ExtendableMessageEventType) => {
  const { type, payload } = event.data as { type: string; payload?: unknown };

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_DOCUMENT':
      if (payload && typeof payload === 'object' && 'url' in payload) {
        event.waitUntil(cacheDocument(payload as { url: string; data: ArrayBuffer }));
      }
      break;
    case 'REMOVE_DOCUMENT':
      if (payload && typeof payload === 'object' && 'url' in payload) {
        event.waitUntil(removeFromCache((payload as { url: string }).url));
      }
      break;
    case 'GET_CACHE_STATUS':
      event.waitUntil(sendCacheStatus(event.source as Client));
      break;
    case 'CLEANUP_CACHES':
      event.waitUntil(cleanupAllCaches());
      break;
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

/**
 * Cache a document manually
 */
async function cacheDocument(doc: { url: string; data: ArrayBuffer }): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.PDF_DOCUMENTS);
  const response = new Response(doc.data, {
    headers: {
      'Content-Type': 'application/pdf',
      'sw-cached-at': new Date().toISOString(),
    },
  });
  await cache.put(doc.url, response);
  console.log('[SW] Document cached:', doc.url);
}

/**
 * Remove a document from cache
 */
async function removeFromCache(url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.PDF_DOCUMENTS);
  await cache.delete(url);
  console.log('[SW] Document removed from cache:', url);
}

/**
 * Send cache status to client
 */
async function sendCacheStatus(client: Client): Promise<void> {
  const cacheNames = await caches.keys();
  const status: Record<string, number> = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }

  client.postMessage({
    type: 'CACHE_STATUS',
    payload: status,
  });
}

/**
 * Clean up all caches
 */
async function cleanupAllCaches(): Promise<void> {
  await cleanupExpiredCaches();

  const routeConfigs = getRouteConfigs();
  for (const config of routeConfigs) {
    await cleanupCacheEntries(config.cacheName, config.maxEntries, config.maxAgeSeconds);
  }

  console.log('[SW] All caches cleaned up');
}

/**
 * Notify all clients
 */
async function notifyClients(
  type: ServiceWorkerMessageType,
  payload?: unknown
): Promise<void> {
  const clients = await self.clients.matchAll();
  const message: ServiceWorkerMessage = {
    type,
    payload,
    timestamp: new Date(),
  };

  for (const client of clients) {
    client.postMessage(message);
  }
}

/**
 * Open sync database
 */
function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('paperflow-sync', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Promisify IDBRequest
 */
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Type declarations for service worker events
interface SyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<unknown>): void;
}

interface PeriodicSyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<unknown>): void;
}

interface ExtendableMessageEventType extends Event {
  data: unknown;
  source: Client | ServiceWorker | MessagePort | null;
  waitUntil(promise: Promise<unknown>): void;
}

declare global {
  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
    periodicsync: PeriodicSyncEvent;
  }
}
