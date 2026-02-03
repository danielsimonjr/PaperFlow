/**
 * Change Detector Tests
 *
 * Tests for document change detection functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  detectChanges,
  getChangeDescription,
  getRecommendedAction,
  type DocumentSnapshot,
} from '@lib/fileWatch/changeDetector';

// Mock document snapshots
const createSnapshot = (overrides: Partial<DocumentSnapshot> = {}): DocumentSnapshot => ({
  pageCount: 5,
  pageHashes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5'],
  pageRotations: [0, 0, 0, 0, 0],
  pageSizes: [
    { width: 595, height: 842 },
    { width: 595, height: 842 },
    { width: 595, height: 842 },
    { width: 595, height: 842 },
    { width: 595, height: 842 },
  ],
  annotationCounts: [0, 0, 0, 0, 0],
  formFieldCount: 0,
  hasAttachments: false,
  metadata: {},
  createdAt: Date.now(),
  ...overrides,
});

describe('detectChanges', () => {
  it('should detect no changes when snapshots are identical', () => {
    const oldSnapshot = createSnapshot();
    const newSnapshot = createSnapshot();

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(false);
    expect(result.totalChanges).toBe(0);
    expect(result.changes).toHaveLength(0);
  });

  it('should detect page additions', () => {
    const oldSnapshot = createSnapshot({ pageCount: 5 });
    const newSnapshot = createSnapshot({
      pageCount: 7,
      pageHashes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6', 'hash7'],
      pageRotations: [0, 0, 0, 0, 0, 0, 0],
      pageSizes: [
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
      ],
      annotationCounts: [0, 0, 0, 0, 0, 0, 0],
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'pages-added')).toBe(true);
    expect(result.majorChanges).toBeGreaterThan(0);
  });

  it('should detect page removals', () => {
    const oldSnapshot = createSnapshot({ pageCount: 5 });
    const newSnapshot = createSnapshot({
      pageCount: 3,
      pageHashes: ['hash1', 'hash2', 'hash3'],
      pageRotations: [0, 0, 0],
      pageSizes: [
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
      ],
      annotationCounts: [0, 0, 0],
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'pages-removed')).toBe(true);
    expect(result.requiresFullReload).toBe(true);
  });

  it('should detect page content changes', () => {
    const oldSnapshot = createSnapshot();
    const newSnapshot = createSnapshot({
      pageHashes: ['hash1', 'modified_hash', 'hash3', 'hash4', 'hash5'],
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'page-content-changed')).toBe(true);

    const contentChange = result.changes.find((c) => c.type === 'page-content-changed');
    expect(contentChange?.pageNumbers).toContain(2);
  });

  it('should detect annotation changes', () => {
    const oldSnapshot = createSnapshot({
      annotationCounts: [0, 0, 0, 0, 0],
    });
    const newSnapshot = createSnapshot({
      annotationCounts: [0, 2, 0, 1, 0],
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'annotations-changed')).toBe(true);

    const annotChange = result.changes.find((c) => c.type === 'annotations-changed');
    expect(annotChange?.pageNumbers).toContain(2);
    expect(annotChange?.pageNumbers).toContain(4);
  });

  it('should detect form field changes', () => {
    const oldSnapshot = createSnapshot({ formFieldCount: 5 });
    const newSnapshot = createSnapshot({ formFieldCount: 8 });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'form-fields-changed')).toBe(true);
  });

  it('should detect metadata changes', () => {
    const oldSnapshot = createSnapshot({
      metadata: { title: 'Old Title', author: 'Author' },
    });
    const newSnapshot = createSnapshot({
      metadata: { title: 'New Title', author: 'Author' },
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.hasChanges).toBe(true);
    expect(result.changes.some((c) => c.type === 'metadata-changed')).toBe(true);
    expect(result.minorChanges).toBeGreaterThan(0);
  });

  it('should correctly categorize change severities', () => {
    const oldSnapshot = createSnapshot({
      pageCount: 5,
      pageHashes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5'],
    });
    const newSnapshot = createSnapshot({
      pageCount: 6,
      pageHashes: ['hash1', 'modified', 'hash3', 'hash4', 'hash5', 'hash6'],
      pageRotations: [0, 0, 0, 0, 0, 0],
      pageSizes: [
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
        { width: 595, height: 842 },
      ],
      annotationCounts: [0, 0, 0, 0, 0, 0],
      metadata: { title: 'New Title' },
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.majorChanges).toBeGreaterThan(0); // pages-added
    expect(result.moderateChanges).toBeGreaterThan(0); // page-content-changed
    expect(result.minorChanges).toBeGreaterThan(0); // metadata-changed
  });

  it('should track affected pages', () => {
    const oldSnapshot = createSnapshot();
    const newSnapshot = createSnapshot({
      pageHashes: ['hash1', 'modified1', 'hash3', 'modified2', 'hash5'],
      annotationCounts: [1, 0, 0, 0, 0],
    });

    const result = detectChanges(oldSnapshot, newSnapshot);

    expect(result.affectedPages).toContain(1); // annotation added
    expect(result.affectedPages).toContain(2); // content changed
    expect(result.affectedPages).toContain(4); // content changed
  });
});

describe('getChangeDescription', () => {
  it('should return "No changes detected" for empty summary', () => {
    const summary = detectChanges(createSnapshot(), createSnapshot());
    const description = getChangeDescription(summary);

    expect(description).toBe('No changes detected');
  });

  it('should return single change description', () => {
    const summary = detectChanges(
      createSnapshot(),
      createSnapshot({
        metadata: { title: 'New Title' },
      })
    );
    const description = getChangeDescription(summary);

    expect(description).toBe('Document metadata changed');
  });

  it('should combine multiple changes with "and"', () => {
    const summary = detectChanges(
      createSnapshot({ formFieldCount: 5, metadata: { title: 'Old' } }),
      createSnapshot({ formFieldCount: 8, metadata: { title: 'New' } })
    );
    const description = getChangeDescription(summary);

    expect(description).toContain(' and ');
  });
});

describe('getRecommendedAction', () => {
  it('should recommend ignore when no changes', () => {
    const summary = detectChanges(createSnapshot(), createSnapshot());
    const action = getRecommendedAction(summary, false);

    expect(action).toBe('ignore');
  });

  it('should recommend reload for major changes without local changes', () => {
    const summary = detectChanges(
      createSnapshot({ pageCount: 5 }),
      createSnapshot({
        pageCount: 6,
        pageHashes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6'],
        pageRotations: [0, 0, 0, 0, 0, 0],
        pageSizes: Array(6).fill({ width: 595, height: 842 }),
        annotationCounts: [0, 0, 0, 0, 0, 0],
      })
    );
    const action = getRecommendedAction(summary, false);

    expect(action).toBe('reload');
  });

  it('should recommend prompt for major changes with local changes', () => {
    const summary = detectChanges(
      createSnapshot({ pageCount: 5 }),
      createSnapshot({
        pageCount: 6,
        pageHashes: ['hash1', 'hash2', 'hash3', 'hash4', 'hash5', 'hash6'],
        pageRotations: [0, 0, 0, 0, 0, 0],
        pageSizes: Array(6).fill({ width: 595, height: 842 }),
        annotationCounts: [0, 0, 0, 0, 0, 0],
      })
    );
    const action = getRecommendedAction(summary, true);

    expect(action).toBe('prompt');
  });

  it('should recommend merge for moderate changes with local changes', () => {
    const summary = detectChanges(
      createSnapshot({ formFieldCount: 5 }),
      createSnapshot({ formFieldCount: 8 })
    );
    const action = getRecommendedAction(summary, true);

    expect(action).toBe('merge');
  });
});
