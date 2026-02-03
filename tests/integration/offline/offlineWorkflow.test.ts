/**
 * Offline Workflow Integration Tests
 *
 * Tests for complete offline scenarios including storage, sync, and conflict resolution.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Setup fake IndexedDB globals before importing modules that use it
vi.stubGlobal('indexedDB', indexedDB);
vi.stubGlobal('IDBKeyRange', IDBKeyRange);

import { offlineStorage } from '@/lib/offline/offlineStorage';
import { offlineQueue } from '@/lib/offline/offlineQueue';
import { queueProcessor } from '@/lib/offline/queueProcessor';
import { calculateDelta, applyDelta } from '@/lib/offline/deltaSync';
import type { OfflineDocument } from '@/types/offline';

describe('Offline Workflow Integration', () => {
  beforeEach(async () => {
    // Clear all storage
    await offlineStorage.clearAll();
    await offlineQueue.clearAll();
  });

  afterEach(() => {
    offlineStorage.close();
    offlineQueue.close();
    queueProcessor.stop();
  });

  describe('Document Lifecycle', () => {
    it('should handle complete document lifecycle offline', async () => {
      // 1. Save a document
      const document: OfflineDocument = {
        id: 'lifecycle-doc',
        metadata: {
          id: 'lifecycle-doc',
          fileName: 'lifecycle.pdf',
          fileSize: 500,
          pageCount: 3,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'initial',
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(500),
        annotations: [],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      // 2. Add an annotation
      const annotation = {
        id: 'ann-lifecycle',
        type: 'highlight' as const,
        pageIndex: 0,
        rects: [{ x: 10, y: 20, width: 100, height: 15 }],
        color: '#FFEB3B',
        opacity: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await offlineStorage.addAnnotation('lifecycle-doc', annotation);

      // 3. Retrieve and verify
      const retrieved = await offlineStorage.getDocument('lifecycle-doc');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.annotations).toHaveLength(1);
      expect(retrieved!.annotations[0].id).toBe('ann-lifecycle');

      // 4. Update the annotation
      const updatedAnnotation = {
        ...annotation,
        color: '#4CAF50',
        updatedAt: new Date(),
      };
      await offlineStorage.updateAnnotation('lifecycle-doc', updatedAnnotation);

      // 5. Verify update
      const afterUpdate = await offlineStorage.getDocument('lifecycle-doc');
      expect(afterUpdate!.annotations[0].color).toBe('#4CAF50');

      // 6. Delete the annotation
      await offlineStorage.deleteAnnotation('ann-lifecycle');

      // 7. Verify deletion
      const afterDelete = await offlineStorage.getDocument('lifecycle-doc');
      expect(afterDelete!.annotations).toHaveLength(0);

      // 8. Delete the document
      await offlineStorage.deleteDocument('lifecycle-doc');

      // 9. Verify document deletion
      const final = await offlineStorage.getDocument('lifecycle-doc');
      expect(final).toBeNull();
    });
  });

  describe('Offline Queue Processing', () => {
    it('should queue operations when offline', async () => {
      // Queue several operations
      await offlineQueue.enqueue('create', 'doc-1', { name: 'test.pdf' });
      await offlineQueue.enqueue('update', 'doc-1', { page: 1 });
      await offlineQueue.enqueue('delete', 'doc-2', { id: 'doc-2' });

      // Check queue stats
      const stats = await offlineQueue.getStats();
      expect(stats.pending).toBe(3);
      expect(stats.total).toBe(3);
    });

    it('should process queue items in priority order', async () => {
      await offlineQueue.enqueue('sync', 'doc-low', {}, 'low');
      await offlineQueue.enqueue('sync', 'doc-high', {}, 'high');
      await offlineQueue.enqueue('sync', 'doc-normal', {}, 'normal');

      const pending = await offlineQueue.getPendingItems();

      expect(pending[0].documentId).toBe('doc-high');
      expect(pending[1].documentId).toBe('doc-normal');
      expect(pending[2].documentId).toBe('doc-low');
    });

    it('should handle retry logic', async () => {
      const item = await offlineQueue.enqueue('sync', 'retry-doc', {});

      // Simulate failure
      await offlineQueue.updateStatus(item.id, 'processing');
      const canRetry = await offlineQueue.incrementRetry(item.id);

      expect(canRetry).toBe(true);

      // Check status is back to pending
      const updated = await offlineQueue.getPendingItems();
      const retryItem = updated.find((i) => i.id === item.id);
      expect(retryItem?.status).toBe('pending');
      expect(retryItem?.retryCount).toBe(1);
    });

    it('should mark as failed after max retries', async () => {
      const item = await offlineQueue.enqueue('sync', 'fail-doc', {});

      // Exhaust retries
      for (let i = 0; i < item.maxRetries; i++) {
        await offlineQueue.incrementRetry(item.id);
      }

      const stats = await offlineQueue.getStats();
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(0);
    });
  });

  describe('Delta Sync', () => {
    it('should calculate and apply delta for small changes', () => {
      const original = new TextEncoder().encode('Hello World').buffer;
      const modified = new TextEncoder().encode('Hello Universe').buffer;

      const delta = calculateDelta(original, modified);
      expect(delta.length).toBeGreaterThan(0);

      // Apply delta to original
      const result = applyDelta(original, delta);
      const resultText = new TextDecoder().decode(result);

      expect(resultText).toBe('Hello Universe');
    });

    it('should handle insertions', () => {
      const original = new TextEncoder().encode('ABC').buffer;
      const modified = new TextEncoder().encode('ABXYZC').buffer;

      const delta = calculateDelta(original, modified);
      const result = applyDelta(original, delta);
      const resultText = new TextDecoder().decode(result);

      expect(resultText).toBe('ABXYZC');
    });

    it('should handle deletions', () => {
      const original = new TextEncoder().encode('ABCDEF').buffer;
      const modified = new TextEncoder().encode('ACF').buffer;

      const delta = calculateDelta(original, modified);
      const result = applyDelta(original, delta);
      const resultText = new TextDecoder().decode(result);

      expect(resultText).toBe('ACF');
    });
  });

  describe('Storage Statistics', () => {
    it('should track storage correctly across operations', async () => {
      // Initial state
      let stats = await offlineStorage.getStorageStats();
      expect(stats.totalDocuments).toBe(0);
      expect(stats.totalSize).toBe(0);

      // Add documents
      const createDoc = (id: string, size: number): OfflineDocument => ({
        id,
        metadata: {
          id,
          fileName: `${id}.pdf`,
          fileSize: size,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: id,
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(size),
        annotations: [],
        editHistory: [],
      });

      await offlineStorage.saveDocument(createDoc('stats-1', 1000));
      await offlineStorage.saveDocument(createDoc('stats-2', 2000));

      stats = await offlineStorage.getStorageStats();
      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalSize).toBe(3000);

      // Remove one
      await offlineStorage.deleteDocument('stats-1');

      stats = await offlineStorage.getStorageStats();
      expect(stats.totalDocuments).toBe(1);
      expect(stats.totalSize).toBe(2000);
    });
  });

  describe('Edit History Tracking', () => {
    it('should track edit history', async () => {
      const document: OfflineDocument = {
        id: 'history-doc',
        metadata: {
          id: 'history-doc',
          fileName: 'history.pdf',
          fileSize: 100,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'hist',
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      // Add history entries
      await offlineStorage.addEditHistoryEntry('history-doc', {
        id: 'edit-1',
        timestamp: new Date(),
        type: 'annotation',
        action: 'add',
        payload: { annotationId: 'ann-1' },
      });

      await offlineStorage.addEditHistoryEntry('history-doc', {
        id: 'edit-2',
        timestamp: new Date(),
        type: 'form',
        action: 'update',
        payload: { field: 'name', value: 'John' },
      });

      const retrieved = await offlineStorage.getDocument('history-doc');
      expect(retrieved!.editHistory).toHaveLength(2);
    });
  });

  describe('Multiple Documents Workflow', () => {
    it('should handle multiple documents independently', async () => {
      // Create multiple documents
      const docs = ['multi-1', 'multi-2', 'multi-3'].map((id) => ({
        id,
        metadata: {
          id,
          fileName: `${id}.pdf`,
          fileSize: 100,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: id,
          isAvailableOffline: true,
          priority: 'normal' as const,
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      }));

      for (const doc of docs) {
        await offlineStorage.saveDocument(doc);
      }

      // Add annotations to different documents
      await offlineStorage.addAnnotation('multi-1', {
        id: 'ann-m1',
        type: 'highlight',
        pageIndex: 0,
        rects: [],
        color: '#FFEB3B',
        opacity: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await offlineStorage.addAnnotation('multi-2', {
        id: 'ann-m2',
        type: 'note',
        pageIndex: 0,
        rects: [],
        color: '#FF9800',
        opacity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify each document has correct annotations
      const doc1 = await offlineStorage.getDocument('multi-1');
      const doc2 = await offlineStorage.getDocument('multi-2');
      const doc3 = await offlineStorage.getDocument('multi-3');

      expect(doc1!.annotations).toHaveLength(1);
      expect(doc1!.annotations[0].type).toBe('highlight');

      expect(doc2!.annotations).toHaveLength(1);
      expect(doc2!.annotations[0].type).toBe('note');

      expect(doc3!.annotations).toHaveLength(0);

      // Delete one document shouldn't affect others
      await offlineStorage.deleteDocument('multi-2');

      const afterDelete1 = await offlineStorage.getDocument('multi-1');
      const afterDelete2 = await offlineStorage.getDocument('multi-2');
      const afterDelete3 = await offlineStorage.getDocument('multi-3');

      expect(afterDelete1).not.toBeNull();
      expect(afterDelete2).toBeNull();
      expect(afterDelete3).not.toBeNull();
    });
  });
});
