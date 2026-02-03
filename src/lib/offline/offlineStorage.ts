/**
 * Offline Document Storage
 *
 * IndexedDB schema and operations for storing complete PDF documents
 * with metadata, annotations, and edit history for offline access.
 */

import type {
  OfflineDocument,
  OfflineDocumentMetadata,
  OfflineStorageStats,
  OfflineAvailabilitySettings,
  EditHistoryEntry,
  SyncPriority,
} from '@/types/offline';
import type { Annotation } from '@/types/index';

const DB_NAME = 'paperflow-offline';
const DB_VERSION = 1;

/**
 * Store names
 */
const STORES = {
  DOCUMENTS: 'documents',
  METADATA: 'metadata',
  ANNOTATIONS: 'annotations',
  EDIT_HISTORY: 'editHistory',
  SETTINGS: 'settings',
} as const;

/**
 * OfflineStorage class for managing offline document storage
 */
class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new Error('Failed to open offline storage database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Documents store - stores PDF ArrayBuffer data
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        }

        // Metadata store - stores document metadata
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          const metadataStore = db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
          metadataStore.createIndex('fileName', 'fileName', { unique: false });
          metadataStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
          metadataStore.createIndex('syncedAt', 'syncedAt', { unique: false });
          metadataStore.createIndex('priority', 'priority', { unique: false });
          metadataStore.createIndex('isAvailableOffline', 'isAvailableOffline', { unique: false });
        }

        // Annotations store - stores annotations per document
        if (!db.objectStoreNames.contains(STORES.ANNOTATIONS)) {
          const annotationsStore = db.createObjectStore(STORES.ANNOTATIONS, { keyPath: 'id' });
          annotationsStore.createIndex('documentId', 'documentId', { unique: false });
        }

        // Edit history store - stores edit history per document
        if (!db.objectStoreNames.contains(STORES.EDIT_HISTORY)) {
          const historyStore = db.createObjectStore(STORES.EDIT_HISTORY, { keyPath: 'id' });
          historyStore.createIndex('documentId', 'documentId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Settings store - stores offline availability settings
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'documentId' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save a document for offline access
   */
  async saveDocument(document: OfflineDocument): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.DOCUMENTS, STORES.METADATA, STORES.ANNOTATIONS, STORES.EDIT_HISTORY],
        'readwrite'
      );

      transaction.onerror = () => reject(new Error('Failed to save document'));
      transaction.oncomplete = () => resolve();

      // Save document data
      const documentsStore = transaction.objectStore(STORES.DOCUMENTS);
      documentsStore.put({
        id: document.id,
        data: document.data,
        formValues: document.formValues,
      });

      // Save metadata
      const metadataStore = transaction.objectStore(STORES.METADATA);
      metadataStore.put(document.metadata);

      // Save annotations
      const annotationsStore = transaction.objectStore(STORES.ANNOTATIONS);
      for (const annotation of document.annotations) {
        annotationsStore.put({
          ...annotation,
          documentId: document.id,
        });
      }

      // Save edit history
      const historyStore = transaction.objectStore(STORES.EDIT_HISTORY);
      for (const entry of document.editHistory) {
        historyStore.put({
          ...entry,
          documentId: document.id,
        });
      }
    });
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<OfflineDocument | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.DOCUMENTS, STORES.METADATA, STORES.ANNOTATIONS, STORES.EDIT_HISTORY],
        'readonly'
      );

      const documentsStore = transaction.objectStore(STORES.DOCUMENTS);
      const metadataStore = transaction.objectStore(STORES.METADATA);
      const annotationsStore = transaction.objectStore(STORES.ANNOTATIONS);
      const historyStore = transaction.objectStore(STORES.EDIT_HISTORY);

      const docRequest = documentsStore.get(id);
      const metaRequest = metadataStore.get(id);

      docRequest.onerror = () => reject(new Error('Failed to get document'));
      metaRequest.onerror = () => reject(new Error('Failed to get metadata'));

      let doc: { id: string; data: ArrayBuffer; formValues?: Record<string, unknown> } | null = null;
      let metadata: OfflineDocumentMetadata | null = null;
      const annotations: Annotation[] = [];
      const editHistory: EditHistoryEntry[] = [];

      docRequest.onsuccess = () => {
        doc = docRequest.result ?? null;
      };

      metaRequest.onsuccess = () => {
        metadata = metaRequest.result ?? null;
      };

      // Get annotations for this document
      const annotationsIndex = annotationsStore.index('documentId');
      const annotationsRequest = annotationsIndex.openCursor(IDBKeyRange.only(id));

      annotationsRequest.onsuccess = () => {
        const cursor = annotationsRequest.result;
        if (cursor) {
          const { documentId: _, ...annotation } = cursor.value;
          void _; // Explicitly mark as intentionally unused
          annotations.push(annotation as Annotation);
          cursor.continue();
        }
      };

      // Get edit history for this document
      const historyIndex = historyStore.index('documentId');
      const historyRequest = historyIndex.openCursor(IDBKeyRange.only(id));

      historyRequest.onsuccess = () => {
        const cursor = historyRequest.result;
        if (cursor) {
          const { documentId: _, ...entry } = cursor.value;
          void _; // Explicitly mark as intentionally unused
          editHistory.push(entry as EditHistoryEntry);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        if (!doc || !metadata) {
          resolve(null);
          return;
        }

        resolve({
          id: doc.id,
          metadata,
          data: doc.data,
          annotations,
          editHistory,
          formValues: doc.formValues,
        });
      };
    });
  }

  /**
   * Get document metadata only
   */
  async getDocumentMetadata(id: string): Promise<OfflineDocumentMetadata | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.METADATA], 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get metadata'));
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  /**
   * Get all document metadata
   */
  async getAllDocumentMetadata(): Promise<OfflineDocumentMetadata[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.METADATA], 'readonly');
      const store = transaction.objectStore(STORES.METADATA);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get all metadata'));
      request.onsuccess = () => resolve(request.result ?? []);
    });
  }

  /**
   * Get documents available offline
   */
  async getOfflineAvailableDocuments(): Promise<OfflineDocumentMetadata[]> {
    // Get all metadata and filter by isAvailableOffline
    // (IndexedDB doesn't support boolean keys directly)
    const allMetadata = await this.getAllDocumentMetadata();
    return allMetadata.filter((meta) => meta.isAvailableOffline);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.DOCUMENTS, STORES.METADATA, STORES.ANNOTATIONS, STORES.EDIT_HISTORY, STORES.SETTINGS],
        'readwrite'
      );

      transaction.onerror = () => reject(new Error('Failed to delete document'));
      transaction.oncomplete = () => resolve();

      // Delete document data
      transaction.objectStore(STORES.DOCUMENTS).delete(id);

      // Delete metadata
      transaction.objectStore(STORES.METADATA).delete(id);

      // Delete settings
      transaction.objectStore(STORES.SETTINGS).delete(id);

      // Delete annotations
      const annotationsStore = transaction.objectStore(STORES.ANNOTATIONS);
      const annotationsIndex = annotationsStore.index('documentId');
      const annotationsRequest = annotationsIndex.openCursor(IDBKeyRange.only(id));
      annotationsRequest.onsuccess = () => {
        const cursor = annotationsRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete edit history
      const historyStore = transaction.objectStore(STORES.EDIT_HISTORY);
      const historyIndex = historyStore.index('documentId');
      const historyRequest = historyIndex.openCursor(IDBKeyRange.only(id));
      historyRequest.onsuccess = () => {
        const cursor = historyRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    });
  }

  /**
   * Update document metadata
   */
  async updateMetadata(
    id: string,
    updates: Partial<OfflineDocumentMetadata>
  ): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);

      const getRequest = store.get(id);
      getRequest.onerror = () => reject(new Error('Failed to get metadata'));
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Document not found'));
          return;
        }

        const updated = { ...existing, ...updates };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(new Error('Failed to update metadata'));
        putRequest.onsuccess = () => resolve();
      };
    });
  }

  /**
   * Add annotation to document
   */
  async addAnnotation(documentId: string, annotation: Annotation): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ANNOTATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.ANNOTATIONS);
      const request = store.put({ ...annotation, documentId });

      request.onerror = () => reject(new Error('Failed to add annotation'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update annotation
   */
  async updateAnnotation(documentId: string, annotation: Annotation): Promise<void> {
    return this.addAnnotation(documentId, annotation);
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ANNOTATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.ANNOTATIONS);
      const request = store.delete(annotationId);

      request.onerror = () => reject(new Error('Failed to delete annotation'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Add edit history entry
   */
  async addEditHistoryEntry(documentId: string, entry: EditHistoryEntry): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.EDIT_HISTORY], 'readwrite');
      const store = transaction.objectStore(STORES.EDIT_HISTORY);
      const request = store.put({ ...entry, documentId });

      request.onerror = () => reject(new Error('Failed to add edit history'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get offline availability settings
   */
  async getOfflineSettings(documentId: string): Promise<OfflineAvailabilitySettings | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(documentId);

      request.onerror = () => reject(new Error('Failed to get settings'));
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  /**
   * Save offline availability settings
   */
  async saveOfflineSettings(settings: OfflineAvailabilitySettings): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put(settings);

      request.onerror = () => reject(new Error('Failed to save settings'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<OfflineStorageStats> {
    const metadata = await this.getAllDocumentMetadata();

    let totalSize = 0;
    let oldestDocument: OfflineDocumentMetadata | undefined;
    let newestDocument: OfflineDocumentMetadata | undefined;

    for (const doc of metadata) {
      totalSize += doc.fileSize;

      if (!oldestDocument || doc.createdAt < oldestDocument.createdAt) {
        oldestDocument = doc;
      }

      if (!newestDocument || doc.createdAt > newestDocument.createdAt) {
        newestDocument = doc;
      }
    }

    // Get storage estimate
    let availableSpace = 0;
    let usedSpace = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
      usedSpace = estimate.usage || 0;
    }

    const quota = usedSpace + availableSpace;
    const quotaUsagePercent = quota > 0 ? (usedSpace / quota) * 100 : 0;

    return {
      totalDocuments: metadata.length,
      totalSize,
      availableSpace,
      usedSpace,
      quotaUsagePercent,
      oldestDocument,
      newestDocument,
    };
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();

    const stores = [
      STORES.DOCUMENTS,
      STORES.METADATA,
      STORES.ANNOTATIONS,
      STORES.EDIT_HISTORY,
      STORES.SETTINGS,
    ];

    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
        request.onsuccess = () => resolve();
      });
    }
  }

  /**
   * Cleanup documents not accessed for a long time
   */
  async cleanupOldDocuments(maxAgeDays: number): Promise<number> {
    const metadata = await this.getAllDocumentMetadata();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let deletedCount = 0;

    for (const doc of metadata) {
      if (doc.modifiedAt < cutoffDate && !doc.isAvailableOffline) {
        await this.deleteDocument(doc.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Check if document exists
   */
  async hasDocument(id: string): Promise<boolean> {
    const metadata = await this.getDocumentMetadata(id);
    return metadata !== null;
  }

  /**
   * Get total document count
   */
  async getDocumentCount(): Promise<number> {
    const metadata = await this.getAllDocumentMetadata();
    return metadata.length;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

/**
 * Generate checksum for data
 */
export async function generateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create metadata from file
 */
export function createDocumentMetadata(
  id: string,
  fileName: string,
  data: ArrayBuffer,
  pageCount: number,
  checksum: string
): OfflineDocumentMetadata {
  const now = new Date();
  return {
    id,
    fileName,
    fileSize: data.byteLength,
    pageCount,
    createdAt: now,
    modifiedAt: now,
    syncedAt: null,
    version: 1,
    checksum,
    isAvailableOffline: false,
    priority: 'normal' as SyncPriority,
  };
}
