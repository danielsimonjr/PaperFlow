# Offline-First Architecture

The offline-first architecture lets the user view and edit PDF documents without an internet connection. This document describes the modules and the data flow. The section "Runtime Wiring" lists the parts that the running application does not start or call.

## Overview

The offline layer does these things:

- It stores PDF documents, annotations and metadata in IndexedDB.
- It queues operations for later processing.
- It detects conflicts between local and remote versions. It resolves a conflict with a selected strategy.
- It limits the number of offline documents. It frees storage space when a document is made available offline and quota usage is above 80%.

## Architecture Components

### 1. Service Worker

`vite-plugin-pwa` generates the service worker. `vite.config.ts` does not set the `strategies` option. The plugin uses its default, `generateSW`. The generated worker uses the `workbox` options in `vite.config.ts`.

The caching rules are in `workbox.runtimeCaching`:

| Request type | Strategy | Cache name | Maximum age |
|---|---|---|---|
| JavaScript and CSS files | StaleWhileRevalidate | paperflow-static-v1 | 30 days |
| PDF files (`.pdf`) | CacheFirst | paperflow-pdfs-v1 | 90 days |
| Image files | CacheFirst | paperflow-images-v1 | 30 days |
| Font files | CacheFirst | paperflow-fonts-v1 | 365 days |
| PDF.js library from unpkg.com | CacheFirst | paperflow-pdfjs-v1 | 30 days |
| API calls (`/api/`) | NetworkFirst | paperflow-api-v1 | 5 minutes |

The file `src/sw.ts` is a second service worker source file. No module imports it. `vite.config.ts` does not reference it, so the build does not use it. Its cache names come from `src/lib/offline/serviceWorkerConfig.ts`. Only `src/sw.ts` imports that file.

The generated worker has no `sync` event handler. `vite.config.ts` adds no background sync code.

### 2. Offline Storage (`src/lib/offline/offlineStorage.ts`)

The module stores data in the IndexedDB database `paperflow-offline`. It uses these object stores:

| Store | Purpose |
|---|---|
| documents | PDF binary data |
| metadata | Document metadata (name, size, etc.) |
| annotations | Annotations per document |
| editHistory | Edit history for sync |
| settings | Offline availability settings |

### 3. Offline Queue (`src/lib/offline/offlineQueue.ts`)

The queue stores operations for later processing. The queue uses these values:

- Operation types: `create`, `update`, `delete`, `sync`, `upload` and `download`.
- Priority levels: `high`, `normal` and `low`. The default is `normal`.
- Retry delays: 1 s, 5 s, 15 s, 1 min and 5 min. The last delay repeats for each further retry.
- Maximum retries: 5 for each new item. Each item stores its own maximum. Source: `DEFAULT_MAX_RETRIES` in `offlineQueue.ts`.

When `mutate` runs while offline, the hook `useOfflineData` adds an `update` operation to the queue.

### 4. Background Sync (`src/lib/offline/backgroundSync.ts`)

The `backgroundSync` object is an instance of `BackgroundSyncManager`. The class has two mechanisms:

- `registerSync()` registers a sync tag with the Background Sync API. The default tag is `paperflow-sync`. If the API is not supported, or the registration fails, the method calls `startFallbackSync()`.
- `startFallbackSync()` starts a poll. The default interval is 60 seconds. Each poll calls `performSync()` when `navigator.onLine` is true. The method also starts the queue processor and adds an `online` listener. The listener calls `performSync()`.

```javascript
// Register the sync tag. The default tag is 'paperflow-sync'.
await backgroundSync.registerSync('paperflow-sync');

// Start the fallback poll. The default interval is 60 seconds.
backgroundSync.startFallbackSync();
```

The method `requestSync()` calls `registerSync()` when the browser supports the Background Sync API. In that case, `requestSync()` does not call `performSync()`. Otherwise, `requestSync()` calls `performSync()`. The hook `useOfflineSync` and the component `SyncStatusPanel` call `requestSync()`.

### 5. Sync Engine (`src/lib/offline/syncEngine.ts`)

The sync engine compares the local and remote versions of each document. It reads and writes the remote side through a `RemoteSyncAdapter`. Conflict handling is part of the `SyncEngine` class. No separate conflict resolver module exists.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Local     │────▶│   Sync      │────▶│   Remote    │
│   Storage   │◀────│   Engine    │◀────│   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Conflict  │
                    │   Handling  │
                    └─────────────┘
```

Set the adapter with `setAdapter()`. Without an adapter, `sync()` throws the error `No sync adapter configured`. Without an adapter, `resolveConflict()` returns without effect.

### 6. Delta Sync (`src/lib/offline/deltaSync.ts`)

The module exports functions for the differences between two `ArrayBuffer` values:

- `calculateDelta()` returns the operations that change the old data into the new data.
- `applyDelta()` applies a delta.
- `splitDeltaIntoChunks()` splits a delta into chunks. `validateDeltaChunk()` checks one chunk.

Only `src/lib/offline/patchGenerator.ts` imports this module. The sync engine does not call these functions.

## Data Flow

### Going Offline

1. The browser fires the `offline` event.
2. The `offline` listener calls `setOnline(false)`, which sets the connection status to offline. The listener comes from `initializeOfflineListeners()` in `src/stores/offlineStore.ts`.
3. `showOfflineBanner` becomes true, unless the user dismissed the banner. `OfflineBanner` reads `showOfflineBanner`. No module renders `OfflineBanner`.
4. Queued operations stay in the queue until the queue processor runs.
5. Changes are stored locally.

### Coming Back Online

1. The browser fires the `online` event.
2. The `online` listener calls `setOnline(true)`, which sets the connection status to online. The store clears the banner dismissal.
3. The `syncOnReconnect` setting is read, but its branch is empty. The store does not start a sync.
4. In fallback mode, the `online` listener of `BackgroundSyncManager` calls `performSync()`.

### Sync Conflict Resolution

1. The sync engine finds a conflict. The checksums differ, and the modification times differ.
2. The engine creates a `SyncConflict` object.
3. If `autoResolveConflicts` is enabled, the engine applies the default strategy. The default strategy is `newest-wins`. The newer version overwrites the older version.
4. Otherwise, the engine adds the conflict to the `conflicts` list in `useOfflineStore`. The engine also calls the `onConflict` option.
5. A caller resolves the conflict with `syncEngine.resolveConflict(conflict, strategy)`. The method returns without effect when no adapter is set.

## State Management

### Offline Store (`src/stores/offlineStore.ts`)

The excerpt shows some fields of `OfflineState`, in source order. The full interface is in `src/stores/offlineStore.ts`.

```typescript
interface OfflineState {
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  pendingOperationsCount: number;
  conflicts: SyncConflict[];
  autoSync: boolean;
  syncOnReconnect: boolean;
}
```

## React Hooks

### useConnectionStatus

The hook returns the connection state. It calls `onOffline` when the browser goes offline. It calls `onOnline` when the browser comes back online after an offline period. The hook also calls `initializeOfflineListeners()` and updates the offline store through `setOnline()`.

```typescript
const { isOnline, wasOffline, connectionType } = useConnectionStatus({
  onOffline: () => console.log('Went offline'),
  onOnline: () => console.log('Back online'),
});
```

### useOfflineSync

The hook returns the sync state and the sync actions.

```typescript
const {
  isSyncing,
  pendingCount,
  conflicts,
  sync,
  resolveConflict
} = useOfflineSync();
```

### useOfflineData

The hook returns the data for a key. The hook returns the `refetch` and `mutate` functions.

```typescript
const { data, isLoading, isStale, refetch } = useOfflineData({
  key: 'document-123',
  fetcher: () => fetchFromNetwork(),
  getCached: () => getFromStorage(),
});
```

## UI Components

No module in `src/` renders the components in this section. See Runtime Wiring.

### OfflineIndicator

The component is a status bar indicator. It shows the pending operation count. It shows a conflict label when unresolved conflicts exist.

### OfflineBanner

The component is a banner with a `full` variant and a `compact` variant. The `full` variant shows the offline status. Its expanded view lists the features that work offline and the features with limits.

### ConflictDialog

The component is a dialog. No module imports it. It shows a side-by-side comparison of the local and remote versions. It offers four strategy buttons and a Cancel button:

| Button | Strategy |
|---|---|
| Keep Local | `local-wins` |
| Keep Cloud | `remote-wins` |
| Keep Newest | `newest-wins` |
| Merge Changes | `merge` |

## Configuration

### Vite PWA Plugin

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      // ... caching rules
    ],
  },
})
```

### Storage Limits

| Item | Default | Source |
|---|---|---|
| Maximum offline documents | 50 | `DEFAULT_MAX_OFFLINE_DOCUMENTS` in `src/lib/offline/offlineAvailability.ts`. `setMaxOfflineDocuments()` changes the value. When the limit is reached, `makeAvailableOffline()` removes the lowest-priority document. |
| Quota threshold | 80% of quota | `QUOTA_WARNING_THRESHOLD` in `offlineAvailability.ts`. When quota usage is above 80%, `makeAvailableOffline()` frees space before it stores a document. `OfflineSettings` shows a warning above 80%. |
| Static asset cache | 30 days | `paperflow-static-v1` in `vite.config.ts` |
| PDF cache | 90 days | `paperflow-pdfs-v1` in `vite.config.ts` |

## Electron Integration

### Network Status (`electron/main/networkStatus.ts`)

The module checks connectivity in three ways:

- Electron `net.isOnline()`.
- A DNS lookup.
- HTTPS requests to three connectivity check URLs.

### Preload (`electron/preload/networkPreload.ts`)

The preload script exposes the network API to the renderer as `window.electronNetwork`:

```typescript
window.electronNetwork.getStatus()
window.electronNetwork.subscribe(callback)
```

## Runtime Wiring

This section lists the parts that the running application does not start or call. Each row names its source.

| Part | Fact | Source |
|---|---|---|
| Sync adapter | No module under `src/` or `electron/` calls `setAdapter()`. Only a unit test does. `sync()` throws `No sync adapter configured`. | `src/lib/offline/syncEngine.ts`; `tests/unit/lib/offline/syncEngine.test.ts` |
| Queue processor | `queueProcessor.start()` runs only inside `startFallbackSync()`. `registerSync()` calls `startFallbackSync()` when Background Sync is not supported or the registration fails. | `src/lib/offline/backgroundSync.ts` |
| Background sync initialization | `BackgroundSyncManager.initialize()` has no caller. | `src/lib/offline/backgroundSync.ts` |
| Fallback sync | `requestSync()` calls `performSync()` only when the browser lacks Background Sync support. | `src/lib/offline/backgroundSync.ts` |
| Callers of `requestSync()` | `useOfflineSync` calls it. No module in `src/` calls `useOfflineSync`. `SyncStatusPanel` calls it. Only `OfflineIndicator` renders `SyncStatusPanel`, and no module renders `OfflineIndicator`. | `src/hooks/useOfflineSync.ts`; `src/components/offline/SyncStatusPanel.tsx` |
| Reconnect sync | The `syncOnReconnect` branch in `setOnline()` is empty. In fallback mode only, the `online` listener calls `performSync()`. | `src/stores/offlineStore.ts`; `src/lib/offline/backgroundSync.ts` |
| Background sync event | The generated service worker has no `sync` event handler. `src/sw.ts` has one at line 310, but the build does not use `src/sw.ts`. In a browser with Background Sync, `requestSync()` only registers the tag. | `vite.config.ts`; `src/sw.ts` |
| Service worker source | No module imports `src/sw.ts`. | Search of `src/` |
| Store listeners | No module calls `initializeOfflineListeners()`. The store does not receive browser `online` or `offline` events. | `src/stores/offlineStore.ts` |
| Hooks | No module in `src/` calls a hook from the React Hooks section. | `src/hooks/index.ts` |
| Offline UI | No module in `src/` renders `OfflineBanner`, `OfflineIndicator`, `OfflineSettings` or `ConflictDialog`. `SyncStatusPanel` is rendered only by `OfflineIndicator`. | `src/components/offline/` |

## Troubleshooting

### Documents Not Syncing

1. Call `syncEngine.sync()`. If it throws `No sync adapter configured`, call `syncEngine.setAdapter()` with a `RemoteSyncAdapter` first.
2. Read the `conflicts` list in `useOfflineStore`. A document with a conflict is not synced until the conflict is resolved.
3. Call `backgroundSync.requestSync()`. In a browser with Background Sync, this only registers a tag. The build has no `sync` event handler that processes the queue.

### Storage Full

1. Call `offlineStorage.getStorageStats()`. Check `quotaUsagePercent`.
2. `makeAvailableOffline()` frees space only when quota usage is above 80%. The function removes low-priority documents first.

### Conflicts Not Resolving

1. Check the browser console for JavaScript errors.
2. Check that a sync adapter is set with `setAdapter()`. No module in `src/` calls `setAdapter()`.
3. Call `syncEngine.resolveConflict(conflict, 'newest-wins')`. The call applies the `newest-wins` strategy.

## API Reference

### offlineStorage

```typescript
// Save document
await offlineStorage.saveDocument(document);

// Get document
const doc = await offlineStorage.getDocument(id);

// Delete document
await offlineStorage.deleteDocument(id);

// Get storage stats
const stats = await offlineStorage.getStorageStats();
```

### offlineQueue

```typescript
// Enqueue operation
await offlineQueue.enqueue('sync', docId, payload, 'high');

// Get pending items
const items = await offlineQueue.getPendingItems();

// Clear completed
await offlineQueue.removeCompleted();
```

### syncEngine

```typescript
// Full sync
const result = await syncEngine.sync();

// Resolve conflict
await syncEngine.resolveConflict(conflict, 'newest-wins');

// Cancel sync
syncEngine.cancelSync();
```

## Best Practices

1. Check the connection before network operations.
2. Use the appropriate priority for queue items.
3. Handle sync errors.
4. Show clear UI feedback for the offline state.
5. Test offline scenarios regularly.
6. Monitor storage usage.
7. Implement conflict resolution for collaborative features.

<!-- repo-map:no-verification -->
