/**
 * Document Sync Engine
 *
 * Handles bidirectional sync between local storage and cloud,
 * with conflict detection and resolution strategies.
 */

import { offlineStorage, generateChecksum } from './offlineStorage';
import { offlineQueue } from './offlineQueue';
import { useOfflineStore } from '@/stores/offlineStore';
import type {
  OfflineDocument,
  OfflineDocumentMetadata,
  SyncConflict,
  DocumentVersion,
  ConflictResolutionStrategy,
  SyncProgress,
} from '@/types/offline';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sync engine options
 */
export interface SyncEngineOptions {
  maxConcurrentSyncs?: number;
  syncTimeout?: number;
  autoResolveConflicts?: boolean;
  defaultResolutionStrategy?: ConflictResolutionStrategy;
  onProgress?: (progress: SyncProgress) => void;
  onConflict?: (conflict: SyncConflict) => void;
  onError?: (error: Error, documentId?: string) => void;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  syncedDocuments: number;
  failedDocuments: number;
  conflicts: SyncConflict[];
  errors: Array<{ documentId: string; error: string }>;
  duration: number;
}

/**
 * Remote sync adapter interface
 * Implement this to connect to your cloud storage
 */
export interface RemoteSyncAdapter {
  getDocumentMetadata(documentId: string): Promise<OfflineDocumentMetadata | null>;
  getDocument(documentId: string): Promise<OfflineDocument | null>;
  saveDocument(document: OfflineDocument): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  listDocuments(): Promise<OfflineDocumentMetadata[]>;
  getDocumentVersion(documentId: string): Promise<DocumentVersion | null>;
}

/**
 * Sync engine class
 */
class SyncEngine {
  private options: Required<SyncEngineOptions>;
  private isSyncing = false;
  private adapter: RemoteSyncAdapter | null = null;
  private abortController: AbortController | null = null;

  constructor(options: SyncEngineOptions = {}) {
    this.options = {
      maxConcurrentSyncs: options.maxConcurrentSyncs ?? 3,
      syncTimeout: options.syncTimeout ?? 60000,
      autoResolveConflicts: options.autoResolveConflicts ?? false,
      defaultResolutionStrategy: options.defaultResolutionStrategy ?? 'newest-wins',
      onProgress: options.onProgress ?? (() => {}),
      onConflict: options.onConflict ?? (() => {}),
      onError: options.onError ?? (() => {}),
    };
  }

  /**
   * Set the remote sync adapter
   */
  setAdapter(adapter: RemoteSyncAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Start a full sync
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!this.adapter) {
      throw new Error('No sync adapter configured');
    }

    this.isSyncing = true;
    this.abortController = new AbortController();

    const startTime = Date.now();
    const store = useOfflineStore.getState();
    store.setSyncStatus('syncing');

    const result: SyncResult = {
      success: true,
      syncedDocuments: 0,
      failedDocuments: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    try {
      // Get all local documents
      const localDocs = await offlineStorage.getAllDocumentMetadata();
      const remoteDocs = await this.adapter.listDocuments();

      // Create maps for easy lookup
      const localMap = new Map(localDocs.map((d) => [d.id, d]));
      const remoteMap = new Map(remoteDocs.map((d) => [d.id, d]));

      // Find all unique document IDs
      const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

      // Track progress
      const progress: SyncProgress = {
        documentsTotal: allIds.size,
        documentsSynced: 0,
        bytesTotal: 0,
        bytesTransferred: 0,
        startedAt: new Date(),
      };

      // Calculate total bytes
      for (const id of allIds) {
        const local = localMap.get(id);
        const remote = remoteMap.get(id);
        progress.bytesTotal += Math.max(local?.fileSize ?? 0, remote?.fileSize ?? 0);
      }

      this.options.onProgress(progress);
      store.setSyncProgress(progress);

      // Process each document
      for (const id of allIds) {
        if (this.abortController.signal.aborted) {
          break;
        }

        progress.currentDocument = id;
        this.options.onProgress(progress);

        try {
          const local = localMap.get(id);
          const remote = remoteMap.get(id);

          await this.syncDocument(id, local, remote, result);

          progress.documentsSynced++;
          progress.bytesTransferred += Math.max(local?.fileSize ?? 0, remote?.fileSize ?? 0);
          store.setSyncProgress(progress);
        } catch (error) {
          result.failedDocuments++;
          result.errors.push({
            documentId: id,
            error: error instanceof Error ? error.message : String(error),
          });
          this.options.onError(error instanceof Error ? error : new Error(String(error)), id);
        }
      }

      // Process offline queue
      const queueStats = await offlineQueue.getStats();
      store.setPendingOperationsCount(queueStats.pending);
      store.setFailedOperationsCount(queueStats.failed);

      result.duration = Date.now() - startTime;
      result.success = result.failedDocuments === 0 && result.conflicts.length === 0;

      store.setLastSyncAt(new Date());
      store.setSyncStatus(result.success ? 'idle' : 'error');
      store.setSyncProgress(null);

      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      store.setSyncStatus('error');
      store.setSyncError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.isSyncing = false;
      this.abortController = null;
    }
  }

  /**
   * Sync a single document
   */
  private async syncDocument(
    id: string,
    local: OfflineDocumentMetadata | undefined,
    remote: OfflineDocumentMetadata | undefined,
    result: SyncResult
  ): Promise<void> {
    if (!this.adapter) return;

    // Case 1: Local only - upload to remote
    if (local && !remote) {
      const doc = await offlineStorage.getDocument(id);
      if (doc) {
        await this.adapter.saveDocument(doc);
        await offlineStorage.updateMetadata(id, { syncedAt: new Date() });
        result.syncedDocuments++;
      }
      return;
    }

    // Case 2: Remote only - download to local
    if (!local && remote) {
      const doc = await this.adapter.getDocument(id);
      if (doc) {
        await offlineStorage.saveDocument(doc);
        result.syncedDocuments++;
      }
      return;
    }

    // Case 3: Both exist - check for conflicts
    if (local && remote) {
      // Get versions for comparison
      const localVersion = await this.getLocalVersion(id);
      const remoteVersion = await this.adapter.getDocumentVersion(id);

      if (!localVersion || !remoteVersion) {
        // Can't determine versions, use timestamps
        if (local.modifiedAt > remote.modifiedAt) {
          // Local is newer
          const doc = await offlineStorage.getDocument(id);
          if (doc) {
            await this.adapter.saveDocument(doc);
          }
        } else if (remote.modifiedAt > local.modifiedAt) {
          // Remote is newer
          const doc = await this.adapter.getDocument(id);
          if (doc) {
            await offlineStorage.saveDocument(doc);
          }
        }
        // If same time, no sync needed
        await offlineStorage.updateMetadata(id, { syncedAt: new Date() });
        result.syncedDocuments++;
        return;
      }

      // Check for conflict
      if (
        localVersion.checksum !== remoteVersion.checksum &&
        local.modifiedAt.getTime() !== remote.modifiedAt.getTime()
      ) {
        // We have a conflict
        const conflict: SyncConflict = {
          id: uuidv4(),
          documentId: id,
          localVersion,
          remoteVersion,
          conflictType: 'content',
          detectedAt: new Date(),
        };

        if (this.options.autoResolveConflicts) {
          await this.resolveConflict(conflict, this.options.defaultResolutionStrategy);
        } else {
          result.conflicts.push(conflict);
          useOfflineStore.getState().addConflict(conflict);
          this.options.onConflict(conflict);
        }
        return;
      }

      // No conflict, sync based on version
      if (localVersion.version > remoteVersion.version) {
        const doc = await offlineStorage.getDocument(id);
        if (doc) {
          await this.adapter.saveDocument(doc);
        }
      } else if (remoteVersion.version > localVersion.version) {
        const doc = await this.adapter.getDocument(id);
        if (doc) {
          await offlineStorage.saveDocument(doc);
        }
      }

      await offlineStorage.updateMetadata(id, { syncedAt: new Date() });
      result.syncedDocuments++;
    }
  }

  /**
   * Get local document version
   */
  private async getLocalVersion(documentId: string): Promise<DocumentVersion | null> {
    const doc = await offlineStorage.getDocument(documentId);
    if (!doc) return null;

    return {
      version: doc.metadata.version,
      modifiedAt: doc.metadata.modifiedAt,
      checksum: doc.metadata.checksum,
      changes: doc.editHistory,
    };
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): Promise<void> {
    if (!this.adapter) return;

    const store = useOfflineStore.getState();

    switch (strategy) {
      case 'local-wins': {
        // Upload local version to remote
        const localDoc = await offlineStorage.getDocument(conflict.documentId);
        if (localDoc) {
          await this.adapter.saveDocument(localDoc);
        }
        break;
      }

      case 'remote-wins': {
        // Download remote version to local
        const remoteDoc = await this.adapter.getDocument(conflict.documentId);
        if (remoteDoc) {
          await offlineStorage.saveDocument(remoteDoc);
        }
        break;
      }

      case 'newest-wins':
        if (conflict.localVersion.modifiedAt > conflict.remoteVersion.modifiedAt) {
          const doc = await offlineStorage.getDocument(conflict.documentId);
          if (doc) {
            await this.adapter.saveDocument(doc);
          }
        } else {
          const doc = await this.adapter.getDocument(conflict.documentId);
          if (doc) {
            await offlineStorage.saveDocument(doc);
          }
        }
        break;

      case 'merge':
        // Merge changes - this is complex and depends on the type of changes
        await this.mergeConflict(conflict);
        break;

      case 'manual':
        // Don't auto-resolve, let user decide
        return;
    }

    // Mark conflict as resolved
    store.resolveConflict(conflict.id, strategy);
    await offlineStorage.updateMetadata(conflict.documentId, { syncedAt: new Date() });
  }

  /**
   * Merge conflicting changes
   */
  private async mergeConflict(conflict: SyncConflict): Promise<void> {
    if (!this.adapter) return;

    const localDoc = await offlineStorage.getDocument(conflict.documentId);
    const remoteDoc = await this.adapter.getDocument(conflict.documentId);

    if (!localDoc || !remoteDoc) return;

    // Simple merge strategy: combine non-overlapping annotations
    const mergedAnnotations = [...localDoc.annotations];
    const localAnnotationIds = new Set(localDoc.annotations.map((a) => a.id));

    for (const annotation of remoteDoc.annotations) {
      if (!localAnnotationIds.has(annotation.id)) {
        mergedAnnotations.push(annotation);
      }
    }

    // Merge edit history
    const mergedHistory = [...localDoc.editHistory, ...remoteDoc.editHistory];
    mergedHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Use local document data (could be smarter here)
    const mergedDoc: OfflineDocument = {
      ...localDoc,
      annotations: mergedAnnotations,
      editHistory: mergedHistory,
      metadata: {
        ...localDoc.metadata,
        version: Math.max(
          conflict.localVersion.version,
          conflict.remoteVersion.version
        ) + 1,
        modifiedAt: new Date(),
        checksum: await generateChecksum(localDoc.data),
      },
    };

    // Save merged document both locally and remotely
    await offlineStorage.saveDocument(mergedDoc);
    await this.adapter.saveDocument(mergedDoc);
  }

  /**
   * Sync a specific document by ID
   */
  async syncSingleDocument(documentId: string): Promise<void> {
    if (!this.adapter) {
      throw new Error('No sync adapter configured');
    }

    const local = await offlineStorage.getDocumentMetadata(documentId);
    const remote = await this.adapter.getDocumentMetadata(documentId);

    const result: SyncResult = {
      success: true,
      syncedDocuments: 0,
      failedDocuments: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    await this.syncDocument(documentId, local ?? undefined, remote ?? undefined, result);
  }

  /**
   * Cancel ongoing sync
   */
  cancelSync(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): SyncConflict[] {
    return useOfflineStore.getState().conflicts.filter((c) => !c.resolvedAt);
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();

/**
 * Create a mock adapter for testing
 */
export function createMockAdapter(): RemoteSyncAdapter {
  const documents = new Map<string, OfflineDocument>();

  return {
    async getDocumentMetadata(documentId: string): Promise<OfflineDocumentMetadata | null> {
      const doc = documents.get(documentId);
      return doc?.metadata ?? null;
    },

    async getDocument(documentId: string): Promise<OfflineDocument | null> {
      return documents.get(documentId) ?? null;
    },

    async saveDocument(document: OfflineDocument): Promise<void> {
      documents.set(document.id, document);
    },

    async deleteDocument(documentId: string): Promise<void> {
      documents.delete(documentId);
    },

    async listDocuments(): Promise<OfflineDocumentMetadata[]> {
      return Array.from(documents.values()).map((d) => d.metadata);
    },

    async getDocumentVersion(documentId: string): Promise<DocumentVersion | null> {
      const doc = documents.get(documentId);
      if (!doc) return null;

      return {
        version: doc.metadata.version,
        modifiedAt: doc.metadata.modifiedAt,
        checksum: doc.metadata.checksum,
        changes: doc.editHistory,
      };
    },
  };
}
