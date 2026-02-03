/**
 * State Preserver
 *
 * Utilities for capturing and restoring document state during reloads.
 */

import type { Annotation } from '@/types/index';
import type { UserState, UnsavedChanges } from './smartReload';

export interface DocumentStateSnapshot {
  // User state
  userState: UserState;

  // Document state
  documentPath: string;
  documentHash: string;
  lastModified: number;

  // Unsaved changes
  unsavedChanges: UnsavedChanges;

  // UI state
  selectedElements: {
    annotationIds: string[];
    pageNumbers: number[];
  };

  // Timestamp
  capturedAt: number;
}

export interface StatePreserverOptions {
  includeAnnotations: boolean;
  includeFormValues: boolean;
  includeSignatures: boolean;
  includeTextEdits: boolean;
  includeUIState: boolean;
}

const DEFAULT_OPTIONS: StatePreserverOptions = {
  includeAnnotations: true,
  includeFormValues: true,
  includeSignatures: true,
  includeTextEdits: true,
  includeUIState: true,
};

// In-memory state storage
const stateSnapshots: Map<string, DocumentStateSnapshot> = new Map();

/**
 * Capture the current state of a document
 */
export function captureDocumentState(
  documentPath: string,
  userState: UserState,
  annotations: Annotation[],
  formValues: Record<string, unknown>,
  signatures: UnsavedChanges['signatures'],
  textEdits: UnsavedChanges['textEdits'],
  pageRotations: Record<number, number>,
  options: Partial<StatePreserverOptions> = {}
): DocumentStateSnapshot {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const unsavedChanges: UnsavedChanges = {
    annotations: opts.includeAnnotations
      ? annotations.map((a) => ({
          id: a.id,
          pageNumber: a.pageIndex + 1, // Convert 0-indexed to 1-indexed
          type: a.type,
          data: a,
          isNew: true, // Would need actual tracking
          isModified: false,
          isDeleted: false,
        }))
      : [],
    textEdits: opts.includeTextEdits ? textEdits : [],
    formValues: opts.includeFormValues ? formValues : {},
    signatures: opts.includeSignatures ? signatures : [],
    pageRotations,
  };

  const snapshot: DocumentStateSnapshot = {
    userState,
    documentPath,
    documentHash: '', // Would need to compute actual hash
    lastModified: Date.now(),
    unsavedChanges,
    selectedElements: {
      annotationIds: [],
      pageNumbers: [userState.currentPage],
    },
    capturedAt: Date.now(),
  };

  // Store snapshot
  stateSnapshots.set(documentPath, snapshot);

  return snapshot;
}

/**
 * Retrieve a stored state snapshot
 */
export function getStoredState(documentPath: string): DocumentStateSnapshot | null {
  return stateSnapshots.get(documentPath) ?? null;
}

/**
 * Clear a stored state snapshot
 */
export function clearStoredState(documentPath: string): boolean {
  return stateSnapshots.delete(documentPath);
}

/**
 * Clear all stored state snapshots
 */
export function clearAllStoredStates(): void {
  stateSnapshots.clear();
}

/**
 * Check if a state snapshot exists for a document
 */
export function hasStoredState(documentPath: string): boolean {
  return stateSnapshots.has(documentPath);
}

/**
 * Get the age of a stored state in milliseconds
 */
export function getStateAge(documentPath: string): number | null {
  const snapshot = stateSnapshots.get(documentPath);
  if (!snapshot) return null;
  return Date.now() - snapshot.capturedAt;
}

/**
 * Calculate scroll position for a specific page
 */
export function calculateScrollPositionForPage(
  pageNumber: number,
  pageHeight: number,
  _containerHeight: number,
  viewMode: 'single' | 'continuous' | 'spread'
): { x: number; y: number } {
  if (viewMode === 'single') {
    // Single page mode - just reset to top
    return { x: 0, y: 0 };
  }

  // Continuous mode - calculate based on page position
  const pageGap = 20; // Gap between pages
  const y = (pageNumber - 1) * (pageHeight + pageGap);

  return { x: 0, y };
}

/**
 * Adjust annotation positions for page changes
 */
export function adjustAnnotationPositions(
  annotations: UnsavedChanges['annotations'],
  pageMapping: Map<number, number>
): UnsavedChanges['annotations'] {
  return annotations
    .filter((a) => {
      // Remove annotations on deleted pages
      return pageMapping.has(a.pageNumber);
    })
    .map((a) => ({
      ...a,
      pageNumber: pageMapping.get(a.pageNumber) ?? a.pageNumber,
    }));
}

/**
 * Merge local annotations with external document
 */
export function mergeAnnotations(
  localAnnotations: UnsavedChanges['annotations'],
  externalAnnotationCount: number[],
  conflictResolution: 'keep-local' | 'keep-external' | 'merge'
): {
  merged: UnsavedChanges['annotations'];
  conflicts: Array<{ pageNumber: number; localCount: number; externalCount: number }>;
} {
  const merged: UnsavedChanges['annotations'] = [];
  const conflicts: Array<{
    pageNumber: number;
    localCount: number;
    externalCount: number;
  }> = [];

  // Group local annotations by page
  const localByPage = new Map<number, typeof localAnnotations>();
  for (const annotation of localAnnotations) {
    const pageAnnotations = localByPage.get(annotation.pageNumber) ?? [];
    pageAnnotations.push(annotation);
    localByPage.set(annotation.pageNumber, pageAnnotations);
  }

  // Check for conflicts
  for (let i = 0; i < externalAnnotationCount.length; i++) {
    const pageNumber = i + 1;
    const localCount = localByPage.get(pageNumber)?.length ?? 0;
    const externalCount = externalAnnotationCount[i] ?? 0;

    if (localCount > 0 && externalCount > 0) {
      conflicts.push({ pageNumber, localCount, externalCount });
    }
  }

  // Apply conflict resolution
  switch (conflictResolution) {
    case 'keep-local':
      merged.push(...localAnnotations);
      break;

    case 'keep-external':
      // Don't add local annotations for pages with external annotations
      for (const [pageNumber, pageAnnotations] of localByPage) {
        if (externalAnnotationCount[pageNumber - 1] === 0) {
          merged.push(...pageAnnotations);
        }
      }
      break;

    case 'merge':
      // Add all local annotations
      merged.push(...localAnnotations);
      break;
  }

  return { merged, conflicts };
}

/**
 * Serialize state for storage
 */
export function serializeState(snapshot: DocumentStateSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    capturedAt: snapshot.capturedAt,
  });
}

/**
 * Deserialize state from storage
 */
export function deserializeState(serialized: string): DocumentStateSnapshot | null {
  try {
    const parsed = JSON.parse(serialized);
    return {
      ...parsed,
      capturedAt: parsed.capturedAt || Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Export state snapshot to IndexedDB or localStorage
 */
export async function persistState(
  documentPath: string,
  snapshot: DocumentStateSnapshot
): Promise<boolean> {
  try {
    const serialized = serializeState(snapshot);
    localStorage.setItem(`paperflow-state-${documentPath}`, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Import state snapshot from IndexedDB or localStorage
 */
export async function loadPersistedState(
  documentPath: string
): Promise<DocumentStateSnapshot | null> {
  try {
    const serialized = localStorage.getItem(`paperflow-state-${documentPath}`);
    if (!serialized) return null;
    return deserializeState(serialized);
  } catch {
    return null;
  }
}

/**
 * Remove persisted state
 */
export async function removePersistedState(documentPath: string): Promise<boolean> {
  try {
    localStorage.removeItem(`paperflow-state-${documentPath}`);
    return true;
  } catch {
    return false;
  }
}
