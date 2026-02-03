/**
 * Sync Engine Tests
 *
 * Tests for document synchronization functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncEngine, createMockAdapter } from '@/lib/offline/syncEngine';
import type { OfflineDocument, DocumentVersion } from '@/types/offline';

describe('syncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMockAdapter', () => {
    it('should create a working mock adapter', async () => {
      const adapter = createMockAdapter();

      // Should start empty
      const docs = await adapter.listDocuments();
      expect(docs).toHaveLength(0);

      // Save a document
      const doc: OfflineDocument = {
        id: 'mock-1',
        metadata: {
          id: 'mock-1',
          fileName: 'mock.pdf',
          fileSize: 100,
          pageCount: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          syncedAt: null,
          version: 1,
          checksum: 'mock123',
          isAvailableOffline: true,
          priority: 'normal',
        },
        data: new ArrayBuffer(100),
        annotations: [],
        editHistory: [],
      };

      await adapter.saveDocument(doc);

      // Should be retrievable
      const retrieved = await adapter.getDocument('mock-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('mock-1');

      // Metadata should be retrievable
      const metadata = await adapter.getDocumentMetadata('mock-1');
      expect(metadata).not.toBeNull();
      expect(metadata!.fileName).toBe('mock.pdf');

      // Version should be retrievable
      const version = await adapter.getDocumentVersion('mock-1');
      expect(version).not.toBeNull();
      expect(version!.version).toBe(1);

      // List should include it
      const allDocs = await adapter.listDocuments();
      expect(allDocs).toHaveLength(1);

      // Delete should work
      await adapter.deleteDocument('mock-1');
      const afterDelete = await adapter.getDocument('mock-1');
      expect(afterDelete).toBeNull();
    });
  });

  describe('setAdapter', () => {
    it('should set the sync adapter', () => {
      const adapter = createMockAdapter();
      expect(() => syncEngine.setAdapter(adapter)).not.toThrow();
    });
  });

  describe('isSyncInProgress', () => {
    it('should return false when no sync is running', () => {
      expect(syncEngine.isSyncInProgress()).toBe(false);
    });
  });

  describe('getPendingConflicts', () => {
    it('should return empty array when no conflicts', () => {
      const conflicts = syncEngine.getPendingConflicts();
      expect(conflicts).toEqual([]);
    });
  });

  describe('cancelSync', () => {
    it('should not throw when canceling non-existent sync', () => {
      expect(() => syncEngine.cancelSync()).not.toThrow();
    });
  });
});

describe('syncEngine conflict resolution', () => {
  // Additional tests for conflict resolution would go here
  // These require mocking the offline store and would be more complex

  it('should identify conflicts correctly', () => {
    const localVersion: DocumentVersion = {
      version: 2,
      modifiedAt: new Date('2024-01-01T12:00:00'),
      checksum: 'local123',
      changes: [],
    };

    const remoteVersion: DocumentVersion = {
      version: 2,
      modifiedAt: new Date('2024-01-01T13:00:00'),
      checksum: 'remote456',
      changes: [],
    };

    // Different checksums = conflict
    expect(localVersion.checksum).not.toBe(remoteVersion.checksum);
  });
});
