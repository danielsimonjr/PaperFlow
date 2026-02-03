/**
 * Selective Offline Availability
 *
 * Allows users to mark specific documents as 'available offline'
 * and manage offline storage space.
 */

import { offlineStorage, generateChecksum, createDocumentMetadata } from './offlineStorage';
import { useOfflineStore } from '@/stores/offlineStore';
import type {
  OfflineDocument,
  OfflineDocumentMetadata,
  OfflineAvailabilitySettings,
  OfflineStorageStats,
  SyncPriority,
} from '@/types/offline';
import type { Annotation } from '@/types/index';

/**
 * Storage quota warning threshold (80%)
 */
const QUOTA_WARNING_THRESHOLD = 0.8;

/**
 * Default max documents for offline storage
 */
const DEFAULT_MAX_OFFLINE_DOCUMENTS = 50;

/**
 * Offline availability manager
 */
class OfflineAvailabilityManager {
  private maxOfflineDocuments = DEFAULT_MAX_OFFLINE_DOCUMENTS;

  /**
   * Mark a document as available offline
   */
  async makeAvailableOffline(
    documentId: string,
    data: ArrayBuffer,
    metadata: {
      fileName: string;
      pageCount: number;
      annotations?: Annotation[];
      formValues?: Record<string, unknown>;
    },
    options: Partial<OfflineAvailabilitySettings> = {}
  ): Promise<void> {
    // Check storage quota
    const stats = await offlineStorage.getStorageStats();
    const newSize = data.byteLength;

    if (stats.quotaUsagePercent > QUOTA_WARNING_THRESHOLD * 100) {
      // Try to free up space
      await this.freeUpSpace(newSize);
    }

    // Check document count
    const currentCount = await offlineStorage.getDocumentCount();
    if (currentCount >= this.maxOfflineDocuments) {
      // Remove lowest priority document
      await this.removeLowestPriorityDocument();
    }

    // Generate checksum
    const checksum = await generateChecksum(data);

    // Create document metadata
    const docMetadata = createDocumentMetadata(
      documentId,
      metadata.fileName,
      data,
      metadata.pageCount,
      checksum
    );

    docMetadata.isAvailableOffline = true;
    docMetadata.priority = options.priority ?? 'normal';

    // Create offline document
    const offlineDoc: OfflineDocument = {
      id: documentId,
      metadata: docMetadata,
      data,
      annotations: metadata.annotations ?? [],
      editHistory: [],
      formValues: metadata.formValues,
    };

    // Save to storage
    await offlineStorage.saveDocument(offlineDoc);

    // Save settings
    await offlineStorage.saveOfflineSettings({
      documentId,
      isAvailableOffline: true,
      priority: options.priority ?? 'normal',
      syncAnnotations: options.syncAnnotations ?? true,
      syncFormData: options.syncFormData ?? true,
      maxSyncAge: options.maxSyncAge,
    });

    // Update store
    useOfflineStore.getState().setStorageStats(await offlineStorage.getStorageStats());
  }

  /**
   * Remove a document from offline storage
   */
  async removeFromOffline(documentId: string): Promise<void> {
    await offlineStorage.deleteDocument(documentId);

    // Update store
    useOfflineStore.getState().setStorageStats(await offlineStorage.getStorageStats());
  }

  /**
   * Check if a document is available offline
   */
  async isAvailableOffline(documentId: string): Promise<boolean> {
    const metadata = await offlineStorage.getDocumentMetadata(documentId);
    return metadata?.isAvailableOffline ?? false;
  }

  /**
   * Get offline availability settings for a document
   */
  async getSettings(documentId: string): Promise<OfflineAvailabilitySettings | null> {
    return offlineStorage.getOfflineSettings(documentId);
  }

  /**
   * Update offline availability settings
   */
  async updateSettings(
    documentId: string,
    updates: Partial<OfflineAvailabilitySettings>
  ): Promise<void> {
    const current = await offlineStorage.getOfflineSettings(documentId);
    if (!current) {
      throw new Error('Document not found in offline storage');
    }

    await offlineStorage.saveOfflineSettings({
      ...current,
      ...updates,
    });

    // Update metadata if priority changed
    if (updates.priority !== undefined) {
      await offlineStorage.updateMetadata(documentId, {
        priority: updates.priority,
      });
    }

    // Update metadata if availability changed
    if (updates.isAvailableOffline !== undefined) {
      await offlineStorage.updateMetadata(documentId, {
        isAvailableOffline: updates.isAvailableOffline,
      });
    }
  }

  /**
   * Set document priority
   */
  async setPriority(documentId: string, priority: SyncPriority): Promise<void> {
    await this.updateSettings(documentId, { priority });
  }

  /**
   * Get all documents available offline
   */
  async getOfflineDocuments(): Promise<OfflineDocumentMetadata[]> {
    return offlineStorage.getOfflineAvailableDocuments();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<OfflineStorageStats> {
    return offlineStorage.getStorageStats();
  }

  /**
   * Free up space by removing low-priority documents
   */
  async freeUpSpace(requiredBytes: number): Promise<number> {
    const docs = await offlineStorage.getAllDocumentMetadata();
    let freedBytes = 0;

    // Sort by priority (low first) and then by age (oldest first)
    const priorityOrder: Record<SyncPriority, number> = {
      low: 0,
      normal: 1,
      high: 2,
    };

    const sortedDocs = [...docs]
      .filter((d) => d.isAvailableOffline)
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      });

    for (const doc of sortedDocs) {
      if (freedBytes >= requiredBytes) break;

      // Skip high priority documents
      if (doc.priority === 'high') continue;

      await offlineStorage.deleteDocument(doc.id);
      freedBytes += doc.fileSize;
    }

    return freedBytes;
  }

  /**
   * Remove the lowest priority document
   */
  private async removeLowestPriorityDocument(): Promise<void> {
    const docs = await offlineStorage.getAllDocumentMetadata();

    const priorityOrder: Record<SyncPriority, number> = {
      low: 0,
      normal: 1,
      high: 2,
    };

    // Find lowest priority, oldest document
    const sortedDocs = [...docs]
      .filter((d) => d.isAvailableOffline && d.priority !== 'high')
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      });

    const lowestPriorityDoc = sortedDocs[0];
    if (lowestPriorityDoc) {
      await offlineStorage.deleteDocument(lowestPriorityDoc.id);
    }
  }

  /**
   * Clean up old documents based on maxSyncAge
   */
  async cleanupOldDocuments(): Promise<number> {
    const docs = await offlineStorage.getAllDocumentMetadata();
    let removedCount = 0;
    const now = new Date();

    for (const doc of docs) {
      const settings = await offlineStorage.getOfflineSettings(doc.id);
      if (!settings?.maxSyncAge) continue;

      const maxAge = settings.maxSyncAge * 24 * 60 * 60 * 1000; // Convert days to ms
      const docAge = now.getTime() - new Date(doc.modifiedAt).getTime();

      if (docAge > maxAge) {
        await offlineStorage.deleteDocument(doc.id);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Calculate if a document can be stored offline
   */
  async canStoreOffline(sizeBytes: number): Promise<{
    canStore: boolean;
    reason?: string;
    availableSpace: number;
    requiredSpace: number;
  }> {
    const stats = await offlineStorage.getStorageStats();

    if (stats.availableSpace < sizeBytes) {
      return {
        canStore: false,
        reason: 'Not enough storage space',
        availableSpace: stats.availableSpace,
        requiredSpace: sizeBytes,
      };
    }

    const currentCount = await offlineStorage.getDocumentCount();
    if (currentCount >= this.maxOfflineDocuments) {
      // Check if we can remove a low-priority document
      const docs = await offlineStorage.getAllDocumentMetadata();
      const removableDocs = docs.filter(
        (d) => d.isAvailableOffline && d.priority !== 'high'
      );

      if (removableDocs.length === 0) {
        return {
          canStore: false,
          reason: 'Maximum offline documents reached',
          availableSpace: stats.availableSpace,
          requiredSpace: sizeBytes,
        };
      }
    }

    return {
      canStore: true,
      availableSpace: stats.availableSpace,
      requiredSpace: sizeBytes,
    };
  }

  /**
   * Set maximum number of offline documents
   */
  setMaxOfflineDocuments(max: number): void {
    this.maxOfflineDocuments = max;
  }

  /**
   * Get maximum number of offline documents
   */
  getMaxOfflineDocuments(): number {
    return this.maxOfflineDocuments;
  }

  /**
   * Estimate storage used by priority level
   */
  async getStorageByPriority(): Promise<Record<SyncPriority, number>> {
    const docs = await offlineStorage.getAllDocumentMetadata();

    const byPriority: Record<SyncPriority, number> = {
      high: 0,
      normal: 0,
      low: 0,
    };

    for (const doc of docs) {
      if (doc.isAvailableOffline) {
        byPriority[doc.priority] += doc.fileSize;
      }
    }

    return byPriority;
  }
}

// Export singleton instance
export const offlineAvailability = new OfflineAvailabilityManager();
