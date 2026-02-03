/**
 * Smart Reload System
 *
 * Intelligent reload that preserves user state (scroll position, annotations,
 * unsaved edits) while incorporating external changes.
 */

import type { ChangeSummary } from './changeDetector';
import type { DocumentDiff } from './documentDiff';

export interface UserState {
  currentPage: number;
  scrollPosition: { x: number; y: number };
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  selectedAnnotationId?: string;
  activeToolId?: string;
  sidebarOpen: boolean;
  sidebarTab?: string;
}

export interface UnsavedChanges {
  annotations: Array<{
    id: string;
    pageNumber: number;
    type: string;
    data: unknown;
    isNew: boolean;
    isModified: boolean;
    isDeleted: boolean;
  }>;
  textEdits: Array<{
    id: string;
    pageNumber: number;
    content: string;
    position: { x: number; y: number };
  }>;
  formValues: Record<string, unknown>;
  signatures: Array<{
    id: string;
    pageNumber: number;
    position: { x: number; y: number; width: number; height: number };
    imageData: string;
  }>;
  pageRotations: Record<number, number>;
}

export interface ReloadOptions {
  preserveScrollPosition: boolean;
  preserveZoom: boolean;
  preserveAnnotations: boolean;
  preserveFormValues: boolean;
  preserveSignatures: boolean;
  mergeAnnotations: boolean;
  promptOnConflict: boolean;
}

export interface ReloadResult {
  success: boolean;
  preservedState: Partial<UserState>;
  mergedChanges: {
    annotationsPreserved: number;
    annotationsLost: number;
    formValuesPreserved: number;
    signaturesPreserved: number;
  };
  conflicts: Array<{
    type: 'annotation' | 'form' | 'signature' | 'text';
    pageNumber: number;
    description: string;
    resolution: 'kept-local' | 'kept-external' | 'merged';
  }>;
  warnings: string[];
}

const DEFAULT_RELOAD_OPTIONS: ReloadOptions = {
  preserveScrollPosition: true,
  preserveZoom: true,
  preserveAnnotations: true,
  preserveFormValues: true,
  preserveSignatures: true,
  mergeAnnotations: true,
  promptOnConflict: true,
};

/**
 * Capture current user state before reload
 */
export function captureUserState(
  currentPage: number,
  scrollElement: HTMLElement | null,
  zoom: number,
  viewMode: 'single' | 'continuous' | 'spread',
  sidebarOpen: boolean
): UserState {
  return {
    currentPage,
    scrollPosition: scrollElement
      ? { x: scrollElement.scrollLeft, y: scrollElement.scrollTop }
      : { x: 0, y: 0 },
    zoom,
    viewMode,
    sidebarOpen,
  };
}

/**
 * Adjust page number after pages have been added or removed
 */
export function adjustPageNumber(
  originalPage: number,
  diff: DocumentDiff
): number {
  let adjustedPage = originalPage;

  // Adjust for removed pages before the current page
  for (const removedPage of diff.pagesRemoved) {
    if (removedPage < originalPage) {
      adjustedPage--;
    }
  }

  // Adjust for added pages before the current page
  // (assuming new pages are added at the end for simplicity)
  // In a real implementation, you'd need to track insertion positions

  // Ensure page is within valid range
  const maxPage = diff.summary.affectedPages.length > 0
    ? Math.max(...diff.summary.affectedPages)
    : adjustedPage;

  return Math.max(1, Math.min(adjustedPage, maxPage || 1));
}

/**
 * Determine which unsaved changes can be preserved after reload
 */
export function filterPreservableChanges(
  unsavedChanges: UnsavedChanges,
  diff: DocumentDiff
): {
  preservable: UnsavedChanges;
  lost: UnsavedChanges;
  conflicts: Array<{
    type: string;
    pageNumber: number;
    reason: string;
  }>;
} {
  const preservable: UnsavedChanges = {
    annotations: [],
    textEdits: [],
    formValues: {},
    signatures: [],
    pageRotations: {},
  };

  const lost: UnsavedChanges = {
    annotations: [],
    textEdits: [],
    formValues: {},
    signatures: [],
    pageRotations: {},
  };

  const conflicts: Array<{
    type: string;
    pageNumber: number;
    reason: string;
  }> = [];

  // Filter annotations
  for (const annotation of unsavedChanges.annotations) {
    const isPageRemoved = diff.pagesRemoved.includes(annotation.pageNumber);
    const isPageHeavilyModified = diff.pageChanges.some(
      (c) =>
        c.pageNumber === annotation.pageNumber &&
        c.changeTypes.includes('content')
    );

    if (isPageRemoved) {
      lost.annotations.push(annotation);
      conflicts.push({
        type: 'annotation',
        pageNumber: annotation.pageNumber,
        reason: 'Page was removed',
      });
    } else if (isPageHeavilyModified && !annotation.isNew) {
      // Preserve new annotations, but flag modified existing ones
      conflicts.push({
        type: 'annotation',
        pageNumber: annotation.pageNumber,
        reason: 'Page content changed - annotation position may be incorrect',
      });
      preservable.annotations.push(annotation);
    } else {
      preservable.annotations.push(annotation);
    }
  }

  // Filter text edits
  for (const edit of unsavedChanges.textEdits) {
    const isPageRemoved = diff.pagesRemoved.includes(edit.pageNumber);

    if (isPageRemoved) {
      lost.textEdits.push(edit);
    } else {
      preservable.textEdits.push(edit);
    }
  }

  // Form values are generally safe to preserve unless form structure changed
  if (diff.summary.changes.some((c) => c.type === 'form-fields-changed')) {
    conflicts.push({
      type: 'form',
      pageNumber: 0,
      reason: 'Form structure changed - some values may not apply',
    });
  }
  preservable.formValues = { ...unsavedChanges.formValues };

  // Filter signatures
  for (const signature of unsavedChanges.signatures) {
    const isPageRemoved = diff.pagesRemoved.includes(signature.pageNumber);

    if (isPageRemoved) {
      lost.signatures.push(signature);
      conflicts.push({
        type: 'signature',
        pageNumber: signature.pageNumber,
        reason: 'Page was removed',
      });
    } else {
      preservable.signatures.push(signature);
    }
  }

  // Filter page rotations
  for (const [pageStr, rotation] of Object.entries(unsavedChanges.pageRotations)) {
    const pageNumber = parseInt(pageStr, 10);
    if (!diff.pagesRemoved.includes(pageNumber)) {
      preservable.pageRotations[pageNumber] = rotation;
    }
  }

  return { preservable, lost, conflicts };
}

/**
 * Create a reload plan based on changes and options
 */
export function createReloadPlan(
  userState: UserState,
  unsavedChanges: UnsavedChanges,
  changeSummary: ChangeSummary,
  diff: DocumentDiff,
  options: Partial<ReloadOptions> = {}
): {
  strategy: 'full-reload' | 'smart-reload' | 'partial-refresh';
  preservedState: Partial<UserState>;
  preservedChanges: Partial<UnsavedChanges>;
  actions: string[];
  warnings: string[];
} {
  const opts = { ...DEFAULT_RELOAD_OPTIONS, ...options };
  const actions: string[] = [];
  const warnings: string[] = [];

  // Determine strategy
  let strategy: 'full-reload' | 'smart-reload' | 'partial-refresh';

  if (changeSummary.requiresFullReload) {
    strategy = 'full-reload';
    actions.push('Performing full document reload due to structural changes');
  } else if (changeSummary.majorChanges > 0) {
    strategy = 'smart-reload';
    actions.push('Performing smart reload to preserve user state');
  } else {
    strategy = 'partial-refresh';
    actions.push('Refreshing only changed pages');
  }

  // Determine what state to preserve
  const preservedState: Partial<UserState> = {};

  if (opts.preserveZoom) {
    preservedState.zoom = userState.zoom;
    actions.push('Zoom level will be preserved');
  }

  preservedState.viewMode = userState.viewMode;
  preservedState.sidebarOpen = userState.sidebarOpen;
  preservedState.sidebarTab = userState.sidebarTab;

  if (opts.preserveScrollPosition) {
    // Adjust current page if needed
    preservedState.currentPage = adjustPageNumber(userState.currentPage, diff);
    preservedState.scrollPosition = userState.scrollPosition;

    if (preservedState.currentPage !== userState.currentPage) {
      warnings.push(
        `Current page adjusted from ${userState.currentPage} to ${preservedState.currentPage}`
      );
    }
    actions.push('Scroll position will be restored');
  }

  // Filter preservable changes
  const { preservable, lost, conflicts } = filterPreservableChanges(
    unsavedChanges,
    diff
  );

  const preservedChanges: Partial<UnsavedChanges> = {};

  if (opts.preserveAnnotations && preservable.annotations.length > 0) {
    preservedChanges.annotations = preservable.annotations;
    actions.push(`${preservable.annotations.length} annotation(s) will be preserved`);
  }

  if (lost.annotations.length > 0) {
    warnings.push(`${lost.annotations.length} annotation(s) cannot be preserved`);
  }

  if (opts.preserveFormValues && Object.keys(preservable.formValues).length > 0) {
    preservedChanges.formValues = preservable.formValues;
    actions.push('Form values will be preserved');
  }

  if (opts.preserveSignatures && preservable.signatures.length > 0) {
    preservedChanges.signatures = preservable.signatures;
    actions.push(`${preservable.signatures.length} signature(s) will be preserved`);
  }

  if (lost.signatures.length > 0) {
    warnings.push(`${lost.signatures.length} signature(s) cannot be preserved`);
  }

  // Add conflict warnings
  for (const conflict of conflicts) {
    warnings.push(`${conflict.type} on page ${conflict.pageNumber}: ${conflict.reason}`);
  }

  return {
    strategy,
    preservedState,
    preservedChanges,
    actions,
    warnings,
  };
}

/**
 * Execute a reload with state preservation
 */
export async function executeSmartReload(
  loadNewDocument: () => Promise<void>,
  restoreState: (state: Partial<UserState>) => void,
  restoreChanges: (changes: Partial<UnsavedChanges>) => void,
  plan: ReturnType<typeof createReloadPlan>
): Promise<ReloadResult> {
  const result: ReloadResult = {
    success: false,
    preservedState: plan.preservedState,
    mergedChanges: {
      annotationsPreserved: 0,
      annotationsLost: 0,
      formValuesPreserved: 0,
      signaturesPreserved: 0,
    },
    conflicts: [],
    warnings: plan.warnings,
  };

  try {
    // Load the new document
    await loadNewDocument();

    // Restore preserved state
    restoreState(plan.preservedState);

    // Restore preserved changes
    if (plan.preservedChanges) {
      restoreChanges(plan.preservedChanges);
      result.mergedChanges.annotationsPreserved =
        plan.preservedChanges.annotations?.length ?? 0;
      result.mergedChanges.formValuesPreserved =
        Object.keys(plan.preservedChanges.formValues ?? {}).length;
      result.mergedChanges.signaturesPreserved =
        plan.preservedChanges.signatures?.length ?? 0;
    }

    result.success = true;
  } catch (error) {
    result.success = false;
    result.warnings.push(
      `Reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}
