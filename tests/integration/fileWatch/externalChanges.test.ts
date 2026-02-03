/**
 * External Changes Integration Tests
 *
 * Integration tests simulating external file changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFileWatchStore } from '@stores/fileWatchStore';
import {
  initializeQueue,
  enqueueEvent,
  getQueueStats,
  shutdownQueue,
  flushQueue,
} from '@lib/fileWatch/watchQueue';
import {
  detectConflicts,
  autoResolveConflicts,
  applyConflictResolutions,
} from '@lib/fileWatch/conflictHandler';
import {
  detectChanges,
  type DocumentSnapshot,
} from '@lib/fileWatch/changeDetector';
import { createDocumentDiff } from '@lib/fileWatch/documentDiff';
import type { UnsavedChanges } from '@lib/fileWatch/smartReload';

// Mock electron
vi.mock('@lib/electron/platform', () => ({
  isElectron: () => false,
}));

// Helper to create snapshots
const createSnapshot = (overrides: Partial<DocumentSnapshot> = {}): DocumentSnapshot => ({
  pageCount: 5,
  pageHashes: ['h1', 'h2', 'h3', 'h4', 'h5'],
  pageRotations: [0, 0, 0, 0, 0],
  pageSizes: Array(5).fill({ width: 595, height: 842 }),
  annotationCounts: [0, 0, 0, 0, 0],
  formFieldCount: 0,
  hasAttachments: false,
  metadata: {},
  createdAt: Date.now(),
  ...overrides,
});

describe('External Changes Integration', () => {
  beforeEach(() => {
    // Reset store state
    useFileWatchStore.setState({
      watchedFiles: new Map(),
      externalChanges: [],
      isInitialized: false,
      isEnabled: true,
    });
  });

  afterEach(() => {
    shutdownQueue();
  });

  describe('Watch Queue Processing', () => {
    it('should enqueue and process file change events', async () => {
      const processedEvents: unknown[] = [];

      initializeQueue(async (events) => {
        processedEvents.push(...events);
      });

      enqueueEvent('/path/to/file.pdf', 'change');
      enqueueEvent('/path/to/file.pdf', 'change');

      // Wait for batch processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(processedEvents.length).toBeGreaterThan(0);
    });

    it('should batch related events together', async () => {
      let batchCount = 0;

      initializeQueue(async (events) => {
        batchCount++;
        // All events for same path should come in one batch
        expect(events.every((e) => e.path === '/path/to/file.pdf')).toBe(true);
      });

      // Enqueue multiple events for same file quickly
      enqueueEvent('/path/to/file.pdf', 'change');
      enqueueEvent('/path/to/file.pdf', 'change');
      enqueueEvent('/path/to/file.pdf', 'change');

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should have processed in at least one batch
      expect(batchCount).toBeGreaterThanOrEqual(1);
    });

    it('should prioritize critical events', async () => {
      const processOrder: string[] = [];

      initializeQueue(
        async (events) => {
          processOrder.push(...events.map((e) => `${e.priority}-${e.type}`));
        },
        { batchDelayMs: 50 }
      );

      // Enqueue low priority first
      enqueueEvent('/path/low.pdf', 'change', undefined, false);
      // Enqueue critical (active document deletion)
      enqueueEvent('/path/active.pdf', 'unlink', undefined, true);

      await flushQueue();

      // Critical event should be processed first (active document deletion is critical)
      expect(processOrder[0]).toContain('critical');
    });

    it('should report correct queue stats', () => {
      initializeQueue(async () => {});

      enqueueEvent('/path/file1.pdf', 'change');
      enqueueEvent('/path/file2.pdf', 'add');
      enqueueEvent('/path/file3.pdf', 'unlink');

      const stats = getQueueStats();

      expect(stats.pendingEvents).toBe(3);
      expect(stats.eventsByType.change).toBe(1);
      expect(stats.eventsByType.add).toBe(1);
      expect(stats.eventsByType.unlink).toBe(1);
    });
  });

  describe('Change Detection Pipeline', () => {
    it('should detect and classify document changes correctly', () => {
      const oldDoc = createSnapshot();
      const newDoc = createSnapshot({
        pageCount: 6,
        pageHashes: ['h1', 'h2-modified', 'h3', 'h4', 'h5', 'h6'],
        pageRotations: [0, 0, 0, 0, 0, 0],
        pageSizes: [...Array(6).fill({ width: 595, height: 842 })],
        annotationCounts: [0, 0, 0, 0, 0, 0],
      });

      const summary = detectChanges(oldDoc, newDoc);
      const diff = createDocumentDiff(oldDoc, newDoc, summary);

      expect(summary.hasChanges).toBe(true);
      expect(diff.pagesAdded).toContain(6);
      expect(diff.pageChanges.some((c) => c.pageNumber === 2)).toBe(true);
    });

    it('should handle complete workflow from detection to resolution', async () => {
      // 1. Create old and new document states
      const oldDoc = createSnapshot();
      const newDoc = createSnapshot({
        pageHashes: ['h1', 'h2-modified', 'h3', 'h4', 'h5'],
        annotationCounts: [0, 1, 0, 0, 0], // External annotation added
      });

      // 2. Detect changes
      const summary = detectChanges(oldDoc, newDoc);
      expect(summary.hasChanges).toBe(true);

      // 3. Create diff
      const diff = createDocumentDiff(oldDoc, newDoc, summary);
      expect(diff.pageChanges.length).toBeGreaterThan(0);

      // 4. Simulate local unsaved changes
      const localChanges: UnsavedChanges = {
        annotations: [
          {
            id: '1',
            pageNumber: 2, // Same page that was modified externally
            type: 'highlight',
            data: {},
            isNew: true,
            isModified: false,
            isDeleted: false,
          },
        ],
        textEdits: [],
        formValues: {},
        signatures: [],
        pageRotations: {},
      };

      // 5. Detect conflicts
      const conflicts = detectConflicts(localChanges, summary, diff);
      expect(conflicts.length).toBeGreaterThan(0);

      // 6. Auto-resolve conflicts
      const resolvedConflicts = autoResolveConflicts(conflicts, 'merge-prefer-local');

      // 7. Apply resolutions
      const result = applyConflictResolutions(localChanges, resolvedConflicts, 'merge-prefer-local');

      expect(result.resolved).toBe(true);
      expect(result.mergedData.annotations.length).toBe(1);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect annotation conflicts on modified pages', () => {
      const oldDoc = createSnapshot();
      const newDoc = createSnapshot({
        pageHashes: ['h1', 'h2-modified', 'h3', 'h4', 'h5'],
      });

      const summary = detectChanges(oldDoc, newDoc);
      const diff = createDocumentDiff(oldDoc, newDoc, summary);

      const localChanges: UnsavedChanges = {
        annotations: [
          {
            id: '1',
            pageNumber: 2,
            type: 'highlight',
            data: {},
            isNew: true,
            isModified: false,
            isDeleted: false,
          },
        ],
        textEdits: [],
        formValues: {},
        signatures: [],
        pageRotations: {},
      };

      const conflicts = detectConflicts(localChanges, summary, diff);

      expect(conflicts.some((c) => c.type === 'annotation-on-changed-page')).toBe(true);
    });

    it('should detect critical conflicts for removed pages', () => {
      const summary = {
        hasChanges: true,
        changes: [{ type: 'pages-removed' as const, description: '1 page removed', severity: 'major' as const }],
        totalChanges: 1,
        majorChanges: 1,
        moderateChanges: 0,
        minorChanges: 0,
        affectedPages: [] as number[],
        requiresFullReload: true,
        changeTimestamp: Date.now(),
      };

      const diff = {
        summary,
        pagesAdded: [] as number[],
        pagesRemoved: [3],
        pageChanges: [] as Array<{ pageNumber: number; hasChanges: boolean; changeTypes: Array<'content' | 'rotation' | 'size' | 'annotations'> }>,
        metadataChanges: [] as Array<{ field: string; oldValue?: string; newValue?: string }>,
        structuralChanges: true,
        totalAffectedPages: 1,
      };

      const localChanges: UnsavedChanges = {
        annotations: [
          {
            id: '1',
            pageNumber: 3, // This page will be removed
            type: 'note',
            data: {},
            isNew: true,
            isModified: false,
            isDeleted: false,
          },
        ],
        textEdits: [],
        formValues: {},
        signatures: [],
        pageRotations: {},
      };

      const conflicts = detectConflicts(localChanges, summary, diff);

      expect(conflicts.some((c) => c.severity === 'critical')).toBe(true);
    });

    it('should preserve local changes with keep-local strategy', () => {
      const localChanges: UnsavedChanges = {
        annotations: [
          {
            id: '1',
            pageNumber: 2,
            type: 'highlight',
            data: { text: 'important' },
            isNew: true,
            isModified: false,
            isDeleted: false,
          },
        ],
        textEdits: [],
        formValues: { field1: 'my value' },
        signatures: [],
        pageRotations: {},
      };

      const conflicts = [
        {
          id: 'c1',
          type: 'annotation-on-changed-page' as const,
          pageNumber: 2,
          description: 'Annotation on modified page',
          severity: 'medium' as const,
          recommendedStrategy: 'merge-prefer-local' as const,
        },
      ];

      const result = applyConflictResolutions(localChanges, conflicts, 'keep-local');

      expect(result.mergedData.annotations).toHaveLength(1);
      expect(result.mergedData.formValues).toEqual({ field1: 'my value' });
    });

    it('should discard local changes with keep-external strategy', () => {
      const localChanges: UnsavedChanges = {
        annotations: [
          {
            id: '1',
            pageNumber: 2,
            type: 'highlight',
            data: {},
            isNew: true,
            isModified: false,
            isDeleted: false,
          },
        ],
        textEdits: [],
        formValues: {},
        signatures: [],
        pageRotations: {},
      };

      const result = applyConflictResolutions(localChanges, [], 'keep-external');

      expect(result.mergedData.annotations).toHaveLength(0);
    });
  });

  describe('File Watch Store', () => {
    it('should handle file change events', () => {
      const store = useFileWatchStore.getState();

      // Simulate a file change event
      store.handleFileChange({
        type: 'change',
        path: '/test/document.pdf',
        stats: {
          size: 12345,
          created: Date.now(),
          modified: Date.now(),
          accessed: Date.now(),
          isFile: true,
          isDirectory: false,
        },
      });

      const { externalChanges } = useFileWatchStore.getState();

      expect(externalChanges).toHaveLength(1);
      expect(externalChanges[0].type).toBe('change');
      expect(externalChanges[0].path).toBe('/test/document.pdf');
    });

    it('should track pending changes', () => {
      const store = useFileWatchStore.getState();

      // Add some changes
      store.handleFileChange({ type: 'change', path: '/file1.pdf' });
      store.handleFileChange({ type: 'change', path: '/file2.pdf' });

      const pending = store.getPendingChanges();

      expect(pending).toHaveLength(2);
    });

    it('should dismiss changes correctly', () => {
      const store = useFileWatchStore.getState();

      store.handleFileChange({ type: 'change', path: '/file.pdf' });

      const { externalChanges } = useFileWatchStore.getState();
      const changeId = externalChanges[0].id;

      store.dismissChange(changeId);

      const pending = useFileWatchStore.getState().getPendingChanges();
      expect(pending).toHaveLength(0);
    });

    it('should update settings correctly', () => {
      const store = useFileWatchStore.getState();

      store.updateSettings({
        autoReload: true,
        showNotifications: false,
      });

      const { settings } = useFileWatchStore.getState();

      expect(settings.autoReload).toBe(true);
      expect(settings.showNotifications).toBe(false);
    });
  });
});
