/**
 * Smart Reload Tests
 *
 * Tests for intelligent reload functionality with state preservation.
 */

import { describe, it, expect } from 'vitest';
import {
  captureUserState,
  adjustPageNumber,
  filterPreservableChanges,
  createReloadPlan,
  type UserState,
  type UnsavedChanges,
} from '@lib/fileWatch/smartReload';
import type { DocumentDiff } from '@lib/fileWatch/documentDiff';
import type { ChangeSummary } from '@lib/fileWatch/changeDetector';

// Mock data factories
const createUserState = (overrides: Partial<UserState> = {}): UserState => ({
  currentPage: 1,
  scrollPosition: { x: 0, y: 100 },
  zoom: 100,
  viewMode: 'single',
  sidebarOpen: true,
  ...overrides,
});

const createUnsavedChanges = (
  overrides: Partial<UnsavedChanges> = {}
): UnsavedChanges => ({
  annotations: [],
  textEdits: [],
  formValues: {},
  signatures: [],
  pageRotations: {},
  ...overrides,
});

const createDocumentDiff = (overrides: Partial<DocumentDiff> = {}): DocumentDiff => ({
  summary: {
    hasChanges: false,
    changes: [],
    totalChanges: 0,
    majorChanges: 0,
    moderateChanges: 0,
    minorChanges: 0,
    affectedPages: [],
    requiresFullReload: false,
    changeTimestamp: Date.now(),
  },
  pagesAdded: [],
  pagesRemoved: [],
  pageChanges: [],
  metadataChanges: [],
  structuralChanges: false,
  totalAffectedPages: 0,
  ...overrides,
});

const createChangeSummary = (
  overrides: Partial<ChangeSummary> = {}
): ChangeSummary => ({
  hasChanges: false,
  changes: [],
  totalChanges: 0,
  majorChanges: 0,
  moderateChanges: 0,
  minorChanges: 0,
  affectedPages: [],
  requiresFullReload: false,
  changeTimestamp: Date.now(),
  ...overrides,
});

describe('captureUserState', () => {
  it('should capture basic user state', () => {
    const result = captureUserState(5, null, 150, 'continuous', true);

    expect(result.currentPage).toBe(5);
    expect(result.zoom).toBe(150);
    expect(result.viewMode).toBe('continuous');
    expect(result.sidebarOpen).toBe(true);
  });

  it('should capture scroll position from element', () => {
    const mockElement = {
      scrollLeft: 50,
      scrollTop: 200,
    } as HTMLElement;

    const result = captureUserState(1, mockElement, 100, 'single', false);

    expect(result.scrollPosition).toEqual({ x: 50, y: 200 });
  });

  it('should default scroll position to 0,0 when no element', () => {
    const result = captureUserState(1, null, 100, 'single', false);

    expect(result.scrollPosition).toEqual({ x: 0, y: 0 });
  });
});

describe('adjustPageNumber', () => {
  it('should return same page when no changes', () => {
    const diff = createDocumentDiff();
    const result = adjustPageNumber(5, diff);

    expect(result).toBe(5);
  });

  it('should adjust page number when earlier pages are removed', () => {
    const diff = createDocumentDiff({
      pagesRemoved: [1, 2],
    });

    const result = adjustPageNumber(5, diff);

    expect(result).toBe(3); // 5 - 2 removed pages before it
  });

  it('should not adjust when removed pages are after current page', () => {
    const diff = createDocumentDiff({
      pagesRemoved: [6, 7],
    });

    const result = adjustPageNumber(3, diff);

    expect(result).toBe(3);
  });

  it('should ensure page is at least 1', () => {
    const diff = createDocumentDiff({
      pagesRemoved: [1, 2, 3],
    });

    const result = adjustPageNumber(2, diff);

    expect(result).toBeGreaterThanOrEqual(1);
  });
});

describe('filterPreservableChanges', () => {
  it('should preserve annotations on unchanged pages', () => {
    const changes = createUnsavedChanges({
      annotations: [
        { id: '1', pageNumber: 3, type: 'highlight', data: {}, isNew: true, isModified: false, isDeleted: false },
        { id: '2', pageNumber: 5, type: 'note', data: {}, isNew: true, isModified: false, isDeleted: false },
      ],
    });

    const diff = createDocumentDiff({
      pageChanges: [{ pageNumber: 1, hasChanges: true, changeTypes: ['content'] }],
    });

    const result = filterPreservableChanges(changes, diff);

    expect(result.preservable.annotations).toHaveLength(2);
    expect(result.lost.annotations).toHaveLength(0);
  });

  it('should mark annotations on removed pages as lost', () => {
    const changes = createUnsavedChanges({
      annotations: [
        { id: '1', pageNumber: 3, type: 'highlight', data: {}, isNew: true, isModified: false, isDeleted: false },
        { id: '2', pageNumber: 5, type: 'note', data: {}, isNew: true, isModified: false, isDeleted: false },
      ],
    });

    const diff = createDocumentDiff({
      pagesRemoved: [3],
    });

    const result = filterPreservableChanges(changes, diff);

    expect(result.preservable.annotations).toHaveLength(1);
    expect(result.lost.annotations).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
  });

  it('should flag conflicts for annotations on heavily modified pages', () => {
    const changes = createUnsavedChanges({
      annotations: [
        { id: '1', pageNumber: 2, type: 'highlight', data: {}, isNew: false, isModified: true, isDeleted: false },
      ],
    });

    const diff = createDocumentDiff({
      pageChanges: [{ pageNumber: 2, hasChanges: true, changeTypes: ['content'] }],
    });

    const result = filterPreservableChanges(changes, diff);

    expect(result.preservable.annotations).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].reason).toContain('Page content changed');
  });

  it('should preserve signatures on unchanged pages', () => {
    const changes = createUnsavedChanges({
      signatures: [
        { id: '1', pageNumber: 2, position: { x: 100, y: 200, width: 150, height: 50 }, imageData: 'base64...' },
      ],
    });

    const diff = createDocumentDiff();

    const result = filterPreservableChanges(changes, diff);

    expect(result.preservable.signatures).toHaveLength(1);
  });

  it('should mark signatures on removed pages as lost', () => {
    const changes = createUnsavedChanges({
      signatures: [
        { id: '1', pageNumber: 5, position: { x: 100, y: 200, width: 150, height: 50 }, imageData: 'base64...' },
      ],
    });

    const diff = createDocumentDiff({
      pagesRemoved: [5],
    });

    const result = filterPreservableChanges(changes, diff);

    expect(result.lost.signatures).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
  });

  it('should preserve form values', () => {
    const changes = createUnsavedChanges({
      formValues: { field1: 'value1', field2: 'value2' },
    });

    const diff = createDocumentDiff();

    const result = filterPreservableChanges(changes, diff);

    expect(result.preservable.formValues).toEqual({ field1: 'value1', field2: 'value2' });
  });
});

describe('createReloadPlan', () => {
  it('should use full-reload strategy for structural changes', () => {
    const userState = createUserState();
    const unsavedChanges = createUnsavedChanges();
    const changeSummary = createChangeSummary({
      hasChanges: true,
      requiresFullReload: true,
      majorChanges: 1,
    });
    const diff = createDocumentDiff({
      summary: changeSummary,
      structuralChanges: true,
    });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff);

    expect(result.strategy).toBe('full-reload');
  });

  it('should use smart-reload strategy for major changes without structural changes', () => {
    const userState = createUserState();
    const unsavedChanges = createUnsavedChanges();
    const changeSummary = createChangeSummary({
      hasChanges: true,
      majorChanges: 1,
      requiresFullReload: false,
    });
    const diff = createDocumentDiff({
      summary: changeSummary,
    });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff);

    expect(result.strategy).toBe('smart-reload');
  });

  it('should use partial-refresh for minor changes', () => {
    const userState = createUserState();
    const unsavedChanges = createUnsavedChanges();
    const changeSummary = createChangeSummary({
      hasChanges: true,
      minorChanges: 1,
    });
    const diff = createDocumentDiff({
      summary: changeSummary,
    });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff);

    expect(result.strategy).toBe('partial-refresh');
  });

  it('should preserve zoom when option enabled', () => {
    const userState = createUserState({ zoom: 150 });
    const unsavedChanges = createUnsavedChanges();
    const changeSummary = createChangeSummary({ hasChanges: true });
    const diff = createDocumentDiff({ summary: changeSummary });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff, {
      preserveZoom: true,
    });

    expect(result.preservedState.zoom).toBe(150);
  });

  it('should preserve scroll position when option enabled', () => {
    const userState = createUserState({
      currentPage: 5,
      scrollPosition: { x: 50, y: 200 },
    });
    const unsavedChanges = createUnsavedChanges();
    const changeSummary = createChangeSummary({ hasChanges: true });
    const diff = createDocumentDiff({ summary: changeSummary });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff, {
      preserveScrollPosition: true,
    });

    expect(result.preservedState.currentPage).toBe(5);
    expect(result.preservedState.scrollPosition).toEqual({ x: 50, y: 200 });
  });

  it('should generate warnings for lost changes', () => {
    const userState = createUserState();
    const unsavedChanges = createUnsavedChanges({
      annotations: [
        { id: '1', pageNumber: 5, type: 'highlight', data: {}, isNew: true, isModified: false, isDeleted: false },
      ],
    });
    const changeSummary = createChangeSummary({
      hasChanges: true,
      majorChanges: 1,
    });
    const diff = createDocumentDiff({
      summary: changeSummary,
      pagesRemoved: [5],
    });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff);

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should include actions describing what will happen', () => {
    const userState = createUserState();
    const unsavedChanges = createUnsavedChanges({
      annotations: [
        { id: '1', pageNumber: 3, type: 'note', data: {}, isNew: true, isModified: false, isDeleted: false },
      ],
    });
    const changeSummary = createChangeSummary({ hasChanges: true });
    const diff = createDocumentDiff({ summary: changeSummary });

    const result = createReloadPlan(userState, unsavedChanges, changeSummary, diff);

    expect(result.actions.length).toBeGreaterThan(0);
  });
});
