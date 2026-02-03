# Offline-First Architecture

This document describes the offline-first architecture implemented in PaperFlow, enabling full functionality without an internet connection.

## Overview

PaperFlow implements a comprehensive offline-first architecture that allows users to:
- View and edit PDF documents without internet connectivity
- Queue changes for synchronization when back online
- Resolve conflicts when local and remote changes collide
- Manage offline storage space efficiently

## Architecture Components

### 1. Service Worker (`src/sw.ts`)

The enhanced service worker provides intelligent caching strategies:

```
Request Type    | Strategy                | Cache Name
----------------|-------------------------|------------------
Static Assets   | Stale-While-Revalidate  | paperflow-static-v1
PDF Documents   | Cache-First             | paperflow-pdfs-v1
Images          | Cache-First             | paperflow-images-v1
Fonts           | Cache-First             | paperflow-fonts-v1
API Calls       | Network-First           | paperflow-api-v1
```

**Configuration:** `src/lib/offline/serviceWorkerConfig.ts`

### 2. Offline Storage (`src/lib/offline/offlineStorage.ts`)

IndexedDB-based storage for complete document persistence:

```
Store           | Purpose
----------------|----------------------------------
documents       | PDF binary data
metadata        | Document metadata (name, size, etc.)
annotations     | Annotations per document
editHistory     | Edit history for sync
settings        | Offline availability settings
```

**Schema Version:** 1

### 3. Offline Queue (`src/lib/offline/offlineQueue.ts`)

Queues operations when offline for later processing:

- **Priority Levels:** high, normal, low
- **Retry Logic:** Exponential backoff (1s, 5s, 15s, 1m, 5m)
- **Max Retries:** 5 (configurable)

### 4. Background Sync (`src/lib/offline/backgroundSync.ts`)

Uses the Background Sync API with fallback polling:

```javascript
// Register for background sync
await backgroundSync.registerSync('paperflow-sync');

// Fallback polling interval: 60 seconds
```

### 5. Sync Engine (`src/lib/offline/syncEngine.ts`)

Handles bidirectional synchronization:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Local     │────▶│   Sync      │────▶│   Remote    │
│   Storage   │◀────│   Engine    │◀────│   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Conflict  │
                    │   Resolver  │
                    └─────────────┘
```

### 6. Delta Sync (`src/lib/offline/deltaSync.ts`)

Efficient incremental sync for large documents:

- Only transfers changed portions
- Binary diff calculation
- Patch application with validation

## Data Flow

### Going Offline

```
1. Navigator fires 'offline' event
2. offlineStore updates connection status
3. OfflineBanner appears (if not dismissed)
4. Queue processor pauses network operations
5. All changes stored locally
```

### Coming Back Online

```
1. Navigator fires 'online' event
2. offlineStore updates connection status
3. If syncOnReconnect enabled:
   a. Background sync triggered
   b. Queue processor resumes
   c. Conflicts detected and queued for resolution
4. UI updates to show sync progress
```

### Sync Conflict Resolution

```
1. Conflict detected (checksums differ, concurrent edits)
2. Create SyncConflict object
3. If autoResolve enabled:
   a. Apply default strategy (newest-wins)
   b. Update both local and remote
4. Else:
   a. Add to conflicts queue
   b. Show ConflictDialog to user
   c. User selects resolution strategy
   d. Apply selected strategy
```

## State Management

### Offline Store (`src/stores/offlineStore.ts`)

```typescript
interface OfflineState {
  connectionStatus: 'online' | 'offline' | 'connecting';
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'paused';
  syncProgress: SyncProgress | null;
  pendingOperationsCount: number;
  conflicts: SyncConflict[];
  autoSync: boolean;
  syncOnReconnect: boolean;
}
```

## React Hooks

### useConnectionStatus

```typescript
const { isOnline, wasOffline, connectionType } = useConnectionStatus({
  onOffline: () => console.log('Went offline'),
  onOnline: () => console.log('Back online'),
});
```

### useOfflineSync

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

```typescript
const { data, isLoading, isStale, refetch } = useOfflineData({
  key: 'document-123',
  fetcher: () => fetchFromNetwork(),
  getCached: () => getFromStorage(),
});
```

## UI Components

### OfflineIndicator

Status bar indicator showing:
- Connection status (online/offline)
- Sync progress
- Pending operations count
- Conflict warnings

### OfflineBanner

Full-width banner explaining:
- Current offline status
- Available features
- Limited features
- How changes will sync

### ConflictDialog

Resolution interface providing:
- Side-by-side version comparison
- Resolution strategy selection
- Merge preview
- Apply/cancel actions

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

| Item | Default | Notes |
|------|---------|-------|
| Max offline documents | 50 | Configurable |
| Quota warning | 80% | Shows warning banner |
| Cache expiration (assets) | 30 days | |
| Cache expiration (PDFs) | 90 days | |

## Electron Integration

### Network Status (`electron/main/networkStatus.ts`)

More reliable connectivity detection:
- Electron `net.isOnline()`
- DNS resolution check
- HTTP connectivity probe

### Preload (`electron/preload/networkPreload.ts`)

Exposes network API to renderer:
```typescript
window.electronNetwork.getStatus()
window.electronNetwork.subscribe(callback)
```

## Troubleshooting

### Documents Not Syncing

1. Check connection status in OfflineIndicator
2. Verify no unresolved conflicts
3. Check queue for failed operations
4. Try manual sync via SyncStatusPanel

### Storage Full

1. Check storage stats in OfflineSettings
2. Remove low-priority offline documents
3. Clear old documents (Settings > Clear Old)
4. Reduce max offline documents

### Conflicts Not Resolving

1. Check for JavaScript errors
2. Verify sync adapter is configured
3. Try "newest-wins" strategy
4. Manual resolution in ConflictDialog

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

1. **Always check connection before network operations**
2. **Use appropriate priority for queue items**
3. **Handle sync errors gracefully**
4. **Show clear UI feedback for offline state**
5. **Test offline scenarios regularly**
6. **Monitor storage usage**
7. **Implement conflict resolution for collaborative features**
