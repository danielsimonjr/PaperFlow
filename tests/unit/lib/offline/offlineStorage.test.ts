/**
 * Offline Storage Tests
 *
 * Tests for IndexedDB offline document storage.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Setup fake IndexedDB globals before importing modules that use it
vi.stubGlobal('indexedDB', indexedDB);
vi.stubGlobal('IDBKeyRange', IDBKeyRange);

import { offlineStorage, generateChecksum, createDocumentMetadata } from '@/lib/offline/offlineStorage';
import type { OfflineDocument, OfflineDocumentMetadata } from '@/types/offline';

describe('offlineStorage', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await offlineStorage.clearAll();
  });

  afterEach(() => {
    offlineStorage.close();
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksums for same data', async () => {
      const data = new TextEncoder().encode('test data').buffer;
      const checksum1 = await generateChecksum(data);
      const checksum2 = await generateChecksum(data);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different data', async () => {
      const data1 = new TextEncoder().encode('test data 1').buffer;
      const data2 = new TextEncoder().encode('test data 2').buffer;

      const checksum1 = await generateChecksum(data1);
      const checksum2 = await generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('createDocumentMetadata', () => {
    it('should create metadata with correct values', () => {
      const data = new ArrayBuffer(1024);
      const metadata = createDocumentMetadata(
        'doc-1',
        'test.pdf',
        data,
        10,
        'abc123'
      );

      expect(metadata.id).toBe('doc-1');
      expect(metadata.fileName).toBe('test.pdf');
      expect(metadata.fileSize).toBe(1024);
      expect(metadata.pageCount).toBe(10);
      expect(metadata.checksum).toBe('abc123');
      expect(metadata.version).toBe(1);
      expect(metadata.isAvailableOffline).toBe(false);
      expect(metadata.priority).toBe('normal');
      expect(metadata.syncedAt).toBeNull();
    });
  });

  describe('saveDocument and getDocument', () => {
    it('should save and retrieve a document', async () => {
      const data = new TextEncoder().encode('PDF content').buffer;
      const metadata: OfflineDocumentMetadata = {
        id: 'doc-1',
        fileName: 'test.pdf',
        fileSize: data.byteLength,
        pageCount: 5,
        createdAt: new Date(),
        modifiedAt: new Date(),
        syncedAt: null,
        version: 1,
        checksum: 'abc123',
        isAvailableOffline: true,
        priority: 'high',
      };

      const document: OfflineDocument = {
        id: 'doc-1',
        metadata,
        data,
        annotations: [],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      const retrieved = await offlineStorage.getDocument('doc-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('doc-1');
      expect(retrieved!.metadata.fileName).toBe('test.pdf');
      expect(new Uint8Array(retrieved!.data)).toEqual(new Uint8Array(data));
    });

    it('should return null for non-existent document', async () => {
      const document = await offlineStorage.getDocument('non-existent');
      expect(document).toBeNull();
    });
  });

  describe('getDocumentMetadata', () => {
    it('should retrieve only metadata', async () => {
      const data = new ArrayBuffer(1000);
      const metadata: OfflineDocumentMetadata = {
        id: 'doc-2',
        fileName: 'metadata-test.pdf',
        fileSize: 1000,
        pageCount: 3,
        createdAt: new Date(),
        modifiedAt: new Date(),
        syncedAt: null,
        version: 1,
        checksum: 'xyz789',
        isAvailableOffline: false,
        priority: 'normal',
      };

      await offlineStorage.saveDocument({
        id: 'doc-2',
        metadata,
        data,
        annotations: [],
        editHistory: [],
      });

      const retrieved = await offlineStorage.getDocumentMetadata('doc-2');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.fileName).toBe('metadata-test.pdf');
      expect(retrieved!.pageCount).toBe(3);
    });
  });

  describe('getAllDocumentMetadata', () => {
    it('should return all document metadata', async () => {
      const createDoc = (id: string): OfflineDocument => ({
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
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      });

      await offlineStorage.saveDocument(createDoc('doc-a'));
      await offlineStorage.saveDocument(createDoc('doc-b'));
      await offlineStorage.saveDocument(createDoc('doc-c'));

      const allMetadata = await offlineStorage.getAllDocumentMetadata();

      expect(allMetadata).toHaveLength(3);
      expect(allMetadata.map((m) => m.id).sort()).toEqual(['doc-a', 'doc-b', 'doc-c']);
    });
  });

  describe('getOfflineAvailableDocuments', () => {
    it('should only return documents marked as available offline', async () => {
      const createDoc = (id: string, offline: boolean): OfflineDocument => ({
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
          isAvailableOffline: offline,
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      });

      await offlineStorage.saveDocument(createDoc('online-1', true));
      await offlineStorage.saveDocument(createDoc('offline-1', false));
      await offlineStorage.saveDocument(createDoc('online-2', true));

      const offlineDocs = await offlineStorage.getOfflineAvailableDocuments();

      expect(offlineDocs).toHaveLength(2);
      expect(offlineDocs.every((d) => d.isAvailableOffline)).toBe(true);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document and its related data', async () => {
      const document: OfflineDocument = {
        id: 'to-delete',
        metadata: {
          id: 'to-delete',
          fileName: 'delete-me.pdf',
          fileSize: 50,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'delete',
          isAvailableOffline: true,
          priority: 'low',
        },
        data: new ArrayBuffer(50),
        annotations: [
          {
            id: 'ann-1',
            type: 'highlight',
            pageIndex: 0,
            rects: [{ x: 0, y: 0, width: 100, height: 20 }],
            color: '#FFEB3B',
            opacity: 0.5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      let retrieved = await offlineStorage.getDocument('to-delete');
      expect(retrieved).not.toBeNull();

      await offlineStorage.deleteDocument('to-delete');

      retrieved = await offlineStorage.getDocument('to-delete');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateMetadata', () => {
    it('should update document metadata', async () => {
      const document: OfflineDocument = {
        id: 'update-test',
        metadata: {
          id: 'update-test',
          fileName: 'original.pdf',
          fileSize: 100,
          pageCount: 5,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'orig',
          isAvailableOffline: false,
          priority: 'low',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      await offlineStorage.updateMetadata('update-test', {
        isAvailableOffline: true,
        priority: 'high',
        version: 2,
      });

      const metadata = await offlineStorage.getDocumentMetadata('update-test');

      expect(metadata).not.toBeNull();
      expect(metadata!.isAvailableOffline).toBe(true);
      expect(metadata!.priority).toBe('high');
      expect(metadata!.version).toBe(2);
      expect(metadata!.fileName).toBe('original.pdf'); // Unchanged
    });
  });

  describe('getStorageStats', () => {
    it('should return correct storage statistics', async () => {
      const createDoc = (id: string, size: number): OfflineDocument => ({
        id,
        metadata: {
          id,
          fileName: `${id}.pdf`,
          fileSize: size,
          pageCount: 1,
          createdAt: new Date(Date.now() - parseInt(id.slice(-1)) * 86400000),
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

      await offlineStorage.saveDocument(createDoc('doc-1', 1000));
      await offlineStorage.saveDocument(createDoc('doc-2', 2000));
      await offlineStorage.saveDocument(createDoc('doc-3', 3000));

      const stats = await offlineStorage.getStorageStats();

      expect(stats.totalDocuments).toBe(3);
      expect(stats.totalSize).toBe(6000);
      expect(stats.oldestDocument).toBeDefined();
      expect(stats.newestDocument).toBeDefined();
    });
  });

  describe('hasDocument', () => {
    it('should correctly check if document exists', async () => {
      const document: OfflineDocument = {
        id: 'exists',
        metadata: {
          id: 'exists',
          fileName: 'exists.pdf',
          fileSize: 100,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'exists',
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      expect(await offlineStorage.hasDocument('exists')).toBe(true);
      expect(await offlineStorage.hasDocument('not-exists')).toBe(false);
    });
  });

  describe('annotations', () => {
    it('should save and retrieve annotations with document', async () => {
      const annotations = [
        {
          id: 'highlight-1',
          type: 'highlight' as const,
          pageIndex: 0,
          rects: [{ x: 10, y: 20, width: 100, height: 15 }],
          color: '#FFEB3B',
          opacity: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'note-1',
          type: 'note' as const,
          pageIndex: 1,
          rects: [{ x: 50, y: 100, width: 200, height: 100 }],
          color: '#FF9800',
          opacity: 1,
          content: 'Test note',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const document: OfflineDocument = {
        id: 'with-annotations',
        metadata: {
          id: 'with-annotations',
          fileName: 'annotated.pdf',
          fileSize: 200,
          pageCount: 5,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'ann',
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(200),
        annotations,
        editHistory: [],
      };

      await offlineStorage.saveDocument(document);

      const retrieved = await offlineStorage.getDocument('with-annotations');

      expect(retrieved!.annotations).toHaveLength(2);
      expect(retrieved!.annotations[0].id).toBe('highlight-1');
      expect(retrieved!.annotations[1].id).toBe('note-1');
    });
  });

  describe('clearAll', () => {
    it('should clear all data', async () => {
      const createDoc = (id: string): OfflineDocument => ({
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
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      });

      await offlineStorage.saveDocument(createDoc('clear-1'));
      await offlineStorage.saveDocument(createDoc('clear-2'));

      let count = await offlineStorage.getDocumentCount();
      expect(count).toBe(2);

      await offlineStorage.clearAll();

      count = await offlineStorage.getDocumentCount();
      expect(count).toBe(0);
    });
  });
});
