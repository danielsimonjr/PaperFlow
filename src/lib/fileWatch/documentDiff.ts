/**
 * Document Diff
 *
 * Creates detailed diffs between two PDF documents for comparison view.
 */

import type { DocumentSnapshot, ChangeSummary } from './changeDetector';

export interface PageDiff {
  pageNumber: number;
  hasChanges: boolean;
  changeTypes: Array<'content' | 'rotation' | 'size' | 'annotations'>;
  oldSize?: { width: number; height: number };
  newSize?: { width: number; height: number };
  oldRotation?: number;
  newRotation?: number;
  annotationDelta?: number;
}

export interface DocumentDiff {
  summary: ChangeSummary;
  pagesAdded: number[];
  pagesRemoved: number[];
  pageChanges: PageDiff[];
  metadataChanges: Array<{
    field: string;
    oldValue?: string;
    newValue?: string;
  }>;
  structuralChanges: boolean;
  totalAffectedPages: number;
}

/**
 * Create a detailed diff between two document snapshots
 */
export function createDocumentDiff(
  oldSnapshot: DocumentSnapshot,
  newSnapshot: DocumentSnapshot,
  changeSummary: ChangeSummary
): DocumentDiff {
  const pagesAdded: number[] = [];
  const pagesRemoved: number[] = [];
  const pageChanges: PageDiff[] = [];
  const metadataChanges: Array<{
    field: string;
    oldValue?: string;
    newValue?: string;
  }> = [];

  // Identify added pages
  if (newSnapshot.pageCount > oldSnapshot.pageCount) {
    for (let i = oldSnapshot.pageCount; i < newSnapshot.pageCount; i++) {
      pagesAdded.push(i + 1);
    }
  }

  // Identify removed pages
  if (newSnapshot.pageCount < oldSnapshot.pageCount) {
    for (let i = newSnapshot.pageCount; i < oldSnapshot.pageCount; i++) {
      pagesRemoved.push(i + 1);
    }
  }

  // Compare existing pages
  const minPages = Math.min(oldSnapshot.pageCount, newSnapshot.pageCount);

  for (let i = 0; i < minPages; i++) {
    const pageNumber = i + 1;
    const changeTypes: PageDiff['changeTypes'] = [];

    // Check content hash
    if (oldSnapshot.pageHashes[i] !== newSnapshot.pageHashes[i]) {
      changeTypes.push('content');
    }

    // Check rotation
    if (oldSnapshot.pageRotations[i] !== newSnapshot.pageRotations[i]) {
      changeTypes.push('rotation');
    }

    // Check size
    const oldSize = oldSnapshot.pageSizes[i];
    const newSize = newSnapshot.pageSizes[i];
    if (oldSize && newSize && (oldSize.width !== newSize.width || oldSize.height !== newSize.height)) {
      changeTypes.push('size');
    }

    // Check annotations
    const oldAnnotCount = oldSnapshot.annotationCounts[i] ?? 0;
    const newAnnotCount = newSnapshot.annotationCounts[i] ?? 0;
    const annotationDelta = newAnnotCount - oldAnnotCount;
    if (annotationDelta !== 0) {
      changeTypes.push('annotations');
    }

    if (changeTypes.length > 0) {
      pageChanges.push({
        pageNumber,
        hasChanges: true,
        changeTypes,
        oldSize,
        newSize,
        oldRotation: oldSnapshot.pageRotations[i],
        newRotation: newSnapshot.pageRotations[i],
        annotationDelta,
      });
    }
  }

  // Check metadata changes
  if (oldSnapshot.metadata.title !== newSnapshot.metadata.title) {
    metadataChanges.push({
      field: 'title',
      oldValue: oldSnapshot.metadata.title,
      newValue: newSnapshot.metadata.title,
    });
  }

  if (oldSnapshot.metadata.author !== newSnapshot.metadata.author) {
    metadataChanges.push({
      field: 'author',
      oldValue: oldSnapshot.metadata.author,
      newValue: newSnapshot.metadata.author,
    });
  }

  if (oldSnapshot.metadata.subject !== newSnapshot.metadata.subject) {
    metadataChanges.push({
      field: 'subject',
      oldValue: oldSnapshot.metadata.subject,
      newValue: newSnapshot.metadata.subject,
    });
  }

  // Determine if there are structural changes
  const structuralChanges =
    pagesAdded.length > 0 ||
    pagesRemoved.length > 0 ||
    pageChanges.some((p) => p.changeTypes.includes('size'));

  return {
    summary: changeSummary,
    pagesAdded,
    pagesRemoved,
    pageChanges,
    metadataChanges,
    structuralChanges,
    totalAffectedPages:
      pagesAdded.length + pagesRemoved.length + pageChanges.length,
  };
}

/**
 * Get a visual representation of page changes
 */
export function getPageChangeIndicator(
  pageNumber: number,
  diff: DocumentDiff
): {
  status: 'unchanged' | 'modified' | 'added' | 'removed';
  changeTypes: PageDiff['changeTypes'];
  severity: 'none' | 'minor' | 'moderate' | 'major';
} {
  // Check if page was added
  if (diff.pagesAdded.includes(pageNumber)) {
    return {
      status: 'added',
      changeTypes: [],
      severity: 'major',
    };
  }

  // Check if page was removed
  if (diff.pagesRemoved.includes(pageNumber)) {
    return {
      status: 'removed',
      changeTypes: [],
      severity: 'major',
    };
  }

  // Check for modifications
  const pageChange = diff.pageChanges.find((p) => p.pageNumber === pageNumber);
  if (pageChange) {
    const severity =
      pageChange.changeTypes.includes('content') ||
      pageChange.changeTypes.includes('size')
        ? 'moderate'
        : 'minor';

    return {
      status: 'modified',
      changeTypes: pageChange.changeTypes,
      severity,
    };
  }

  return {
    status: 'unchanged',
    changeTypes: [],
    severity: 'none',
  };
}

/**
 * Create a navigation list of changes
 */
export function createChangeNavigationList(diff: DocumentDiff): Array<{
  pageNumber: number;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}> {
  const items: Array<{
    pageNumber: number;
    description: string;
    severity: 'minor' | 'moderate' | 'major';
  }> = [];

  // Add page additions
  for (const pageNum of diff.pagesAdded) {
    items.push({
      pageNumber: pageNum,
      description: 'New page added',
      severity: 'major',
    });
  }

  // Add page changes
  for (const change of diff.pageChanges) {
    const descriptions: string[] = [];

    if (change.changeTypes.includes('content')) {
      descriptions.push('content modified');
    }
    if (change.changeTypes.includes('annotations')) {
      const delta = change.annotationDelta ?? 0;
      descriptions.push(
        delta > 0 ? `${delta} annotation(s) added` : `${Math.abs(delta)} annotation(s) removed`
      );
    }
    if (change.changeTypes.includes('rotation')) {
      descriptions.push(`rotated to ${change.newRotation}°`);
    }
    if (change.changeTypes.includes('size')) {
      descriptions.push('page size changed');
    }

    items.push({
      pageNumber: change.pageNumber,
      description: descriptions.join(', '),
      severity:
        change.changeTypes.includes('content') || change.changeTypes.includes('size')
          ? 'moderate'
          : 'minor',
    });
  }

  // Sort by page number
  return items.sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Get summary statistics for a diff
 */
export function getDiffStatistics(diff: DocumentDiff): {
  totalPages: number;
  unchangedPages: number;
  modifiedPages: number;
  addedPages: number;
  removedPages: number;
  changePercentage: number;
} {
  const addedPages = diff.pagesAdded.length;
  const removedPages = diff.pagesRemoved.length;
  const modifiedPages = diff.pageChanges.length;
  const totalPages = Math.max(
    diff.summary.totalChanges > 0
      ? diff.summary.affectedPages.length + modifiedPages
      : modifiedPages,
    1
  );
  const unchangedPages = Math.max(
    totalPages - modifiedPages - addedPages - removedPages,
    0
  );

  const changePercentage =
    totalPages > 0 ? Math.round(((modifiedPages + addedPages + removedPages) / totalPages) * 100) : 0;

  return {
    totalPages,
    unchangedPages,
    modifiedPages,
    addedPages,
    removedPages,
    changePercentage,
  };
}
