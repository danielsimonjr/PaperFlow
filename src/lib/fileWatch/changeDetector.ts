/**
 * Change Detector
 *
 * Detects what changed in a document (pages, annotations, text) to enable smart reloading.
 */

import { PDFDocument } from 'pdf-lib';

export type ChangeType =
  | 'pages-added'
  | 'pages-removed'
  | 'pages-reordered'
  | 'page-content-changed'
  | 'annotations-changed'
  | 'form-fields-changed'
  | 'metadata-changed'
  | 'attachments-changed'
  | 'bookmarks-changed'
  | 'security-changed';

export interface DocumentChange {
  type: ChangeType;
  pageNumbers?: number[];
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface ChangeSummary {
  hasChanges: boolean;
  changes: DocumentChange[];
  totalChanges: number;
  majorChanges: number;
  moderateChanges: number;
  minorChanges: number;
  affectedPages: number[];
  requiresFullReload: boolean;
  changeTimestamp: number;
}

export interface DocumentSnapshot {
  pageCount: number;
  pageHashes: string[];
  pageRotations: number[];
  pageSizes: Array<{ width: number; height: number }>;
  annotationCounts: number[];
  formFieldCount: number;
  hasAttachments: boolean;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    modificationDate?: string;
  };
  createdAt: number;
}

/**
 * Simple hash function for quick comparison
 */
function simpleHash(data: Uint8Array): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]!;
    hash = ((hash << 5) - hash + byte) | 0;
  }
  return hash.toString(36);
}

/**
 * Create a snapshot of a document for comparison
 */
export async function createDocumentSnapshot(pdfData: ArrayBuffer): Promise<DocumentSnapshot> {
  const pdfDoc = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const pageHashes: string[] = [];
  const pageRotations: number[] = [];
  const pageSizes: Array<{ width: number; height: number }> = [];
  const annotationCounts: number[] = [];

  for (const page of pages) {
    // Get page size and rotation
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    pageSizes.push({ width, height });
    pageRotations.push(rotation);

    // Create a simple hash based on page properties
    // In a real implementation, you'd hash the actual content stream
    const pageData = new Uint8Array([
      width & 0xff,
      (width >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
      rotation,
    ]);
    pageHashes.push(simpleHash(pageData));

    // Count annotations (simplified)
    const annots = page.node.get(pdfDoc.context.obj('Annots'));
    annotationCounts.push(annots ? 1 : 0);
  }

  // Get form field count
  const form = pdfDoc.getForm();
  let formFieldCount = 0;
  try {
    formFieldCount = form.getFields().length;
  } catch {
    // Form may not exist
  }

  // Get metadata
  const metadata = {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    modificationDate: pdfDoc.getModificationDate()?.toISOString(),
  };

  // Check for attachments (simplified)
  const hasAttachments = false; // Would need to check EmbeddedFiles

  return {
    pageCount: pages.length,
    pageHashes,
    pageRotations,
    pageSizes,
    annotationCounts,
    formFieldCount,
    hasAttachments,
    metadata,
    createdAt: Date.now(),
  };
}

/**
 * Detect changes between two document snapshots
 */
export function detectChanges(
  oldSnapshot: DocumentSnapshot,
  newSnapshot: DocumentSnapshot
): ChangeSummary {
  const changes: DocumentChange[] = [];
  const affectedPages = new Set<number>();

  // Check page count changes
  if (newSnapshot.pageCount > oldSnapshot.pageCount) {
    const addedPages: number[] = [];
    for (let i = oldSnapshot.pageCount; i < newSnapshot.pageCount; i++) {
      addedPages.push(i + 1);
      affectedPages.add(i + 1);
    }
    changes.push({
      type: 'pages-added',
      pageNumbers: addedPages,
      description: `${addedPages.length} page(s) added`,
      severity: 'major',
    });
  } else if (newSnapshot.pageCount < oldSnapshot.pageCount) {
    const removedCount = oldSnapshot.pageCount - newSnapshot.pageCount;
    changes.push({
      type: 'pages-removed',
      description: `${removedCount} page(s) removed`,
      severity: 'major',
    });
  }

  // Check for page content changes (comparing hashes)
  const minPages = Math.min(oldSnapshot.pageCount, newSnapshot.pageCount);
  const changedPages: number[] = [];

  for (let i = 0; i < minPages; i++) {
    if (oldSnapshot.pageHashes[i] !== newSnapshot.pageHashes[i]) {
      changedPages.push(i + 1);
      affectedPages.add(i + 1);
    }
  }

  if (changedPages.length > 0) {
    changes.push({
      type: 'page-content-changed',
      pageNumbers: changedPages,
      description: `Content changed on ${changedPages.length} page(s)`,
      severity: changedPages.length > 5 ? 'major' : 'moderate',
    });
  }

  // Check for rotation changes
  for (let i = 0; i < minPages; i++) {
    if (oldSnapshot.pageRotations[i] !== newSnapshot.pageRotations[i]) {
      affectedPages.add(i + 1);
    }
  }

  // Check annotation changes
  const annotationChangedPages: number[] = [];
  for (let i = 0; i < minPages; i++) {
    if (oldSnapshot.annotationCounts[i] !== newSnapshot.annotationCounts[i]) {
      annotationChangedPages.push(i + 1);
      affectedPages.add(i + 1);
    }
  }

  if (annotationChangedPages.length > 0) {
    changes.push({
      type: 'annotations-changed',
      pageNumbers: annotationChangedPages,
      description: `Annotations changed on ${annotationChangedPages.length} page(s)`,
      severity: 'moderate',
    });
  }

  // Check form field changes
  if (oldSnapshot.formFieldCount !== newSnapshot.formFieldCount) {
    changes.push({
      type: 'form-fields-changed',
      description: `Form fields changed (${oldSnapshot.formFieldCount} -> ${newSnapshot.formFieldCount})`,
      severity: 'moderate',
    });
  }

  // Check metadata changes
  if (
    oldSnapshot.metadata.title !== newSnapshot.metadata.title ||
    oldSnapshot.metadata.author !== newSnapshot.metadata.author ||
    oldSnapshot.metadata.subject !== newSnapshot.metadata.subject
  ) {
    changes.push({
      type: 'metadata-changed',
      description: 'Document metadata changed',
      severity: 'minor',
    });
  }

  // Count severities
  let majorChanges = 0;
  let moderateChanges = 0;
  let minorChanges = 0;

  for (const change of changes) {
    switch (change.severity) {
      case 'major':
        majorChanges++;
        break;
      case 'moderate':
        moderateChanges++;
        break;
      case 'minor':
        minorChanges++;
        break;
    }
  }

  // Determine if full reload is required
  const requiresFullReload =
    majorChanges > 0 ||
    affectedPages.size > minPages * 0.5 ||
    changes.some((c) => c.type === 'pages-added' || c.type === 'pages-removed');

  return {
    hasChanges: changes.length > 0,
    changes,
    totalChanges: changes.length,
    majorChanges,
    moderateChanges,
    minorChanges,
    affectedPages: Array.from(affectedPages).sort((a, b) => a - b),
    requiresFullReload,
    changeTimestamp: Date.now(),
  };
}

/**
 * Get a human-readable description of changes
 */
export function getChangeDescription(summary: ChangeSummary): string {
  if (!summary.hasChanges) {
    return 'No changes detected';
  }

  const descriptions = summary.changes.map((c) => c.description);

  if (descriptions.length === 1) {
    return descriptions[0] ?? 'Document changed';
  }

  if (descriptions.length === 2) {
    return descriptions.join(' and ');
  }

  return `${descriptions.slice(0, -1).join(', ')}, and ${descriptions[descriptions.length - 1]}`;
}

/**
 * Determine the recommended action based on changes
 */
export function getRecommendedAction(
  summary: ChangeSummary,
  hasLocalChanges: boolean
): 'reload' | 'merge' | 'prompt' | 'ignore' {
  if (!summary.hasChanges) {
    return 'ignore';
  }

  if (hasLocalChanges && summary.majorChanges > 0) {
    return 'prompt';
  }

  if (hasLocalChanges && summary.moderateChanges > 0) {
    return 'merge';
  }

  if (summary.majorChanges > 0 || summary.requiresFullReload) {
    return 'reload';
  }

  return 'reload';
}
