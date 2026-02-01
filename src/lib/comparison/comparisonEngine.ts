/**
 * Comparison Engine
 * Core logic for comparing two PDF documents.
 */

import type {
  ComparisonResult,
  ComparisonOptions,
  ComparisonSummary,
  PageComparison,
  TextChange,
  DocumentInfo,
  Rect,
  ChangeType,
} from './types';
import { DEFAULT_COMPARISON_OPTIONS } from './types';
import {
  diffWords,
  diffLines,
  calculateSimilarity,
  normalizeText,
} from './textDiff';

/**
 * Generate unique ID for comparison
 */
function generateComparisonId(): string {
  return `comparison_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique ID for text change
 */
function generateChangeId(): string {
  return `change_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Compare two documents
 */
export function compareDocuments(
  doc1Text: string[],
  doc2Text: string[],
  doc1Info: DocumentInfo,
  doc2Info: DocumentInfo,
  options: Partial<ComparisonOptions> = {}
): ComparisonResult {
  const opts = { ...DEFAULT_COMPARISON_OPTIONS, ...options };
  const pages: PageComparison[] = [];

  // Determine page ranges to compare
  const range1 = opts.pageRange1 || { start: 0, end: doc1Text.length - 1 };
  const range2 = opts.pageRange2 || { start: 0, end: doc2Text.length - 1 };

  const pagesToCompare = Math.max(
    range1.end - range1.start + 1,
    range2.end - range2.start + 1
  );

  for (let i = 0; i < pagesToCompare; i++) {
    const page1Idx = range1.start + i;
    const page2Idx = range2.start + i;

    const text1 = page1Idx < doc1Text.length ? doc1Text[page1Idx]! : '';
    const text2 = page2Idx < doc2Text.length ? doc2Text[page2Idx]! : '';

    const pageComparison = comparePage(text1, text2, i, opts);
    pages.push(pageComparison);
  }

  const summary = calculateSummary(pages, doc1Info.pageCount, doc2Info.pageCount);

  return {
    id: generateComparisonId(),
    document1: doc1Info,
    document2: doc2Info,
    pages,
    summary,
    comparedAt: Date.now(),
  };
}

/**
 * Compare a single page
 */
export function comparePage(
  text1: string,
  text2: string,
  pageIndex: number,
  options: ComparisonOptions
): PageComparison {
  const normalizedText1 = options.ignoreWhitespace || options.ignoreCase
    ? normalizeText(text1, options)
    : text1;
  const normalizedText2 = options.ignoreWhitespace || options.ignoreCase
    ? normalizeText(text2, options)
    : text2;

  const textChanges: TextChange[] = [];

  if (options.granularity === 'line' || options.granularity === 'paragraph') {
    const lineDiffs = diffLines(normalizedText1, normalizedText2, options.ignoreCase);

    let lineY = 0;
    const lineHeight = 20; // Approximate line height

    for (const diff of lineDiffs) {
      if (diff.type !== 'equal') {
        const changeType: ChangeType =
          diff.type === 'added' ? 'added' :
          diff.type === 'removed' ? 'removed' : 'modified';

        textChanges.push({
          id: generateChangeId(),
          type: changeType,
          text: diff.content2 || diff.content1 || '',
          originalText: diff.type === 'modified' ? diff.content1 : undefined,
          location: {
            x: 50, // Approximate margin
            y: lineY,
            width: 500, // Approximate page width
            height: lineHeight,
          },
          pageIndex,
          lineNumber: diff.lineNumber1 || diff.lineNumber2,
        });
      }
      lineY += lineHeight;
    }
  } else {
    // Word or character level
    const tokens = diffWords(normalizedText1, normalizedText2, options.ignoreCase);

    let position = 0;
    let wordIndex = 0;

    for (const token of tokens) {
      if (token.type !== 'equal') {
        const changeType: ChangeType = token.type === 'insert' ? 'added' : 'removed';

        textChanges.push({
          id: generateChangeId(),
          type: changeType,
          text: token.value,
          location: estimateTextLocation(position, token.value.length),
          pageIndex,
          wordIndex,
        });
      }
      position += token.value.length;
      wordIndex++;
    }
  }

  const similarity = calculateSimilarity(normalizedText1, normalizedText2);

  return {
    pageNumber: pageIndex + 1,
    textChanges,
    visualChanges: [], // Visual comparison not implemented in this sprint
    similarity,
    text1,
    text2,
  };
}

/**
 * Estimate text location on page (simplified)
 */
function estimateTextLocation(charPosition: number, length: number): Rect {
  const charsPerLine = 80;
  const lineHeight = 20;
  const charWidth = 8;
  const marginLeft = 50;
  const marginTop = 50;

  const line = Math.floor(charPosition / charsPerLine);
  const charInLine = charPosition % charsPerLine;

  return {
    x: marginLeft + charInLine * charWidth,
    y: marginTop + line * lineHeight,
    width: Math.min(length * charWidth, (charsPerLine - charInLine) * charWidth),
    height: lineHeight,
  };
}

/**
 * Calculate comparison summary
 */
export function calculateSummary(
  pages: PageComparison[],
  totalPages1: number,
  totalPages2: number
): ComparisonSummary {
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let movedCount = 0;
  let totalTextChanges = 0;
  let similaritySum = 0;

  for (const page of pages) {
    for (const change of page.textChanges) {
      totalTextChanges++;
      switch (change.type) {
        case 'added':
          addedCount++;
          break;
        case 'removed':
          removedCount++;
          break;
        case 'modified':
          modifiedCount++;
          break;
        case 'moved':
          movedCount++;
          break;
      }
    }
    similaritySum += page.similarity;
  }

  const overallSimilarity = pages.length > 0 ? Math.round(similaritySum / pages.length) : 100;

  return {
    totalPages1,
    totalPages2,
    pagesCompared: pages.length,
    totalTextChanges,
    addedCount,
    removedCount,
    modifiedCount,
    movedCount,
    overallSimilarity,
  };
}

/**
 * Get changes for a specific page
 */
export function getPageChanges(
  result: ComparisonResult,
  pageIndex: number
): TextChange[] {
  const page = result.pages[pageIndex];
  return page ? page.textChanges : [];
}

/**
 * Get all changes across all pages
 */
export function getAllChanges(result: ComparisonResult): TextChange[] {
  return result.pages.flatMap((page) => page.textChanges);
}

/**
 * Filter changes by type
 */
export function filterChangesByType(
  changes: TextChange[],
  type: ChangeType
): TextChange[] {
  return changes.filter((change) => change.type === type);
}

/**
 * Get change at index
 */
export function getChangeAtIndex(
  result: ComparisonResult,
  index: number
): TextChange | undefined {
  const allChanges = getAllChanges(result);
  return allChanges[index];
}

/**
 * Navigate to next/previous change
 */
export function getAdjacentChange(
  result: ComparisonResult,
  currentChangeId: string | null,
  direction: 'next' | 'previous'
): TextChange | undefined {
  const allChanges = getAllChanges(result);

  if (allChanges.length === 0) return undefined;

  if (!currentChangeId) {
    return direction === 'next' ? allChanges[0] : allChanges[allChanges.length - 1];
  }

  const currentIndex = allChanges.findIndex((c) => c.id === currentChangeId);
  if (currentIndex === -1) {
    return allChanges[0];
  }

  if (direction === 'next') {
    return currentIndex < allChanges.length - 1
      ? allChanges[currentIndex + 1]
      : allChanges[0]; // Wrap around
  } else {
    return currentIndex > 0
      ? allChanges[currentIndex - 1]
      : allChanges[allChanges.length - 1]; // Wrap around
  }
}

/**
 * Check if documents are identical
 */
export function areDocumentsIdentical(result: ComparisonResult): boolean {
  return result.summary.totalTextChanges === 0;
}

/**
 * Get pages with changes
 */
export function getPagesWithChanges(result: ComparisonResult): number[] {
  return result.pages
    .filter((page) => page.textChanges.length > 0)
    .map((page) => page.pageNumber);
}
