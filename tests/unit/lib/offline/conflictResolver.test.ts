/**
 * Conflict Resolver Tests
 *
 * Tests for sync conflict detection and resolution utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  detectConflict,
  getRecommendedStrategy,
  mergeAnnotations,
  mergeFormValues,
  mergeEditHistories,
  generateConflictSummary,
  createConflict,
} from '@/lib/offline/conflictResolver';
import type { DocumentVersion, EditHistoryEntry, SyncConflict } from '@/types/offline';
import type { Annotation } from '@/types/index';

describe('conflictResolver', () => {
  describe('detectConflict', () => {
    it('should detect no conflict when checksums match', () => {
      const local: DocumentVersion = {
        version: 1,
        modifiedAt: new Date('2024-01-01'),
        checksum: 'same123',
        changes: [],
      };

      const remote: DocumentVersion = {
        version: 1,
        modifiedAt: new Date('2024-01-01'),
        checksum: 'same123',
        changes: [],
      };

      const result = detectConflict(local, remote);
      expect(result.hasConflict).toBe(false);
    });

    it('should detect conflict when checksums differ', () => {
      // Both versions have changes at overlapping times, creating a conflict
      const local: DocumentVersion = {
        version: 1,
        modifiedAt: new Date('2024-01-01T10:30:00'),
        checksum: 'local123',
        changes: [
          {
            id: '1',
            timestamp: new Date('2024-01-01T10:00:00'),
            type: 'annotation',
            action: 'add',
            payload: {},
          },
          {
            id: '3',
            timestamp: new Date('2024-01-01T10:30:00'),
            type: 'annotation',
            action: 'update',
            payload: {},
          },
        ],
      };

      const remote: DocumentVersion = {
        version: 1,
        modifiedAt: new Date('2024-01-01T10:20:00'),
        checksum: 'remote456',
        changes: [
          {
            id: '2',
            timestamp: new Date('2024-01-01T10:05:00'),
            type: 'annotation',
            action: 'add',
            payload: {},
          },
          {
            id: '4',
            timestamp: new Date('2024-01-01T10:20:00'),
            type: 'annotation',
            action: 'update',
            payload: {},
          },
        ],
      };

      const result = detectConflict(local, remote);
      expect(result.hasConflict).toBe(true);
    });
  });

  describe('getRecommendedStrategy', () => {
    it('should recommend newest-wins for large time differences', () => {
      const conflict: SyncConflict = {
        id: 'conflict-1',
        documentId: 'doc-1',
        localVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T10:00:00'),
          checksum: 'local',
          changes: [],
        },
        remoteVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T15:00:00'), // 5 hours later
          checksum: 'remote',
          changes: [],
        },
        conflictType: 'content',
        detectedAt: new Date(),
      };

      const strategy = getRecommendedStrategy(conflict);
      expect(strategy).toBe('newest-wins');
    });

    it('should recommend merge for annotation conflicts', () => {
      const conflict: SyncConflict = {
        id: 'conflict-2',
        documentId: 'doc-2',
        localVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T10:00:00'),
          checksum: 'local',
          changes: [],
        },
        remoteVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T10:30:00'),
          checksum: 'remote',
          changes: [],
        },
        conflictType: 'annotation',
        detectedAt: new Date(),
      };

      const strategy = getRecommendedStrategy(conflict);
      expect(strategy).toBe('merge');
    });

    it('should recommend local-wins for form conflicts', () => {
      const conflict: SyncConflict = {
        id: 'conflict-3',
        documentId: 'doc-3',
        localVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T10:00:00'),
          checksum: 'local',
          changes: [],
        },
        remoteVersion: {
          version: 1,
          modifiedAt: new Date('2024-01-01T10:30:00'),
          checksum: 'remote',
          changes: [],
        },
        conflictType: 'form',
        detectedAt: new Date(),
      };

      const strategy = getRecommendedStrategy(conflict);
      expect(strategy).toBe('local-wins');
    });
  });

  describe('mergeAnnotations', () => {
    it('should merge non-overlapping annotations', () => {
      const now = new Date();
      const localAnnotations: Annotation[] = [
        {
          id: 'ann-1',
          type: 'highlight',
          pageIndex: 0,
          rects: [],
          color: '#FFEB3B',
          opacity: 0.5,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const remoteAnnotations: Annotation[] = [
        {
          id: 'ann-2',
          type: 'note',
          pageIndex: 1,
          rects: [],
          color: '#FF9800',
          opacity: 1,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const result = mergeAnnotations(localAnnotations, remoteAnnotations);

      expect(result.merged).toHaveLength(2);
      expect(result.details.localChangesKept).toBe(1);
      expect(result.details.remoteChangesKept).toBe(1);
      expect(result.details.conflictingChanges).toBe(0);
    });

    it('should use newest for overlapping annotations', () => {
      const older = new Date('2024-01-01T10:00:00');
      const newer = new Date('2024-01-01T12:00:00');

      const localAnnotations: Annotation[] = [
        {
          id: 'ann-same',
          type: 'highlight',
          pageIndex: 0,
          rects: [],
          color: '#FFEB3B',
          opacity: 0.5,
          content: 'local content',
          createdAt: older,
          updatedAt: older,
        },
      ];

      const remoteAnnotations: Annotation[] = [
        {
          id: 'ann-same',
          type: 'highlight',
          pageIndex: 0,
          rects: [],
          color: '#4CAF50',
          opacity: 0.7,
          content: 'remote content',
          createdAt: older,
          updatedAt: newer,
        },
      ];

      const result = mergeAnnotations(localAnnotations, remoteAnnotations);

      expect(result.merged).toHaveLength(1);
      expect(result.merged[0].content).toBe('remote content');
      expect(result.details.conflictingChanges).toBe(1);
    });
  });

  describe('mergeFormValues', () => {
    it('should merge non-overlapping form values', () => {
      const localValues = {
        name: 'John',
        email: 'john@example.com',
      };

      const remoteValues = {
        phone: '555-1234',
        address: '123 Main St',
      };

      const result = mergeFormValues(
        localValues,
        remoteValues,
        new Date(),
        new Date()
      );

      expect(result.merged).toEqual({
        name: 'John',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
      });
      expect(result.details.conflictingChanges).toBe(0);
    });

    it('should use newer value for conflicts', () => {
      const older = new Date('2024-01-01T10:00:00');
      const newer = new Date('2024-01-01T12:00:00');

      const localValues = {
        name: 'Local Name',
        shared: 'local value',
      };

      const remoteValues = {
        name: 'Remote Name',
        shared: 'remote value',
      };

      const result = mergeFormValues(localValues, remoteValues, older, newer);

      expect(result.merged.shared).toBe('remote value');
      expect(result.details.conflictingChanges).toBeGreaterThan(0);
    });
  });

  describe('mergeEditHistories', () => {
    it('should combine and sort histories', () => {
      const localHistory: EditHistoryEntry[] = [
        {
          id: 'edit-1',
          timestamp: new Date('2024-01-01T10:00:00'),
          type: 'annotation',
          action: 'add',
          payload: {},
        },
        {
          id: 'edit-3',
          timestamp: new Date('2024-01-01T14:00:00'),
          type: 'form',
          action: 'update',
          payload: {},
        },
      ];

      const remoteHistory: EditHistoryEntry[] = [
        {
          id: 'edit-2',
          timestamp: new Date('2024-01-01T12:00:00'),
          type: 'text',
          action: 'update',
          payload: {},
        },
      ];

      const merged = mergeEditHistories(localHistory, remoteHistory);

      expect(merged).toHaveLength(3);
      expect(merged[0].id).toBe('edit-1');
      expect(merged[1].id).toBe('edit-2');
      expect(merged[2].id).toBe('edit-3');
    });

    it('should remove duplicate entries by ID', () => {
      const history: EditHistoryEntry[] = [
        {
          id: 'same-id',
          timestamp: new Date('2024-01-01T10:00:00'),
          type: 'annotation',
          action: 'add',
          payload: {},
        },
      ];

      const merged = mergeEditHistories(history, history);

      expect(merged).toHaveLength(1);
    });
  });

  describe('generateConflictSummary', () => {
    it('should generate readable summary', () => {
      const conflict: SyncConflict = {
        id: 'summary-test',
        documentId: 'doc-summary',
        localVersion: {
          version: 2,
          modifiedAt: new Date('2024-01-01T10:00:00'),
          checksum: 'local',
          changes: [
            { id: '1', timestamp: new Date(), type: 'annotation', action: 'add', payload: {} },
          ],
        },
        remoteVersion: {
          version: 3,
          modifiedAt: new Date('2024-01-01T12:00:00'),
          checksum: 'remote',
          changes: [
            { id: '2', timestamp: new Date(), type: 'form', action: 'update', payload: {} },
            { id: '3', timestamp: new Date(), type: 'form', action: 'update', payload: {} },
          ],
        },
        conflictType: 'content',
        detectedAt: new Date(),
      };

      const summary = generateConflictSummary(conflict);

      expect(summary).toContain('doc-summary');
      expect(summary).toContain('content');
      expect(summary).toContain('Local version: 2');
      expect(summary).toContain('Remote version: 3');
      expect(summary).toContain('Local changes: 1');
      expect(summary).toContain('Remote changes: 2');
    });
  });

  describe('createConflict', () => {
    it('should create conflict object with correct type', () => {
      const localVersion: DocumentVersion = {
        version: 1,
        modifiedAt: new Date(),
        checksum: 'local',
        changes: [
          { id: '1', timestamp: new Date(), type: 'annotation', action: 'add', payload: {} },
        ],
      };

      const remoteVersion: DocumentVersion = {
        version: 1,
        modifiedAt: new Date(),
        checksum: 'remote',
        changes: [
          { id: '2', timestamp: new Date(), type: 'annotation', action: 'update', payload: {} },
        ],
      };

      const conflict = createConflict('doc-create', localVersion, remoteVersion);

      expect(conflict.documentId).toBe('doc-create');
      expect(conflict.id).toContain('conflict-doc-create');
      expect(conflict.conflictType).toBe('annotation');
      expect(conflict.resolvedAt).toBeUndefined();
    });
  });
});
