/**
 * Redaction Engine
 * Core logic for creating, managing, and applying redactions.
 */

import type {
  RedactionMark,
  RedactionOptions,
  Rect,
  RedactionType,
  AuditLogEntry,
  RedactionReport,
} from './types';
import { DEFAULT_REDACTION_OPTIONS } from './types';

/**
 * Generate unique ID for redaction marks
 */
function generateMarkId(): string {
  return `redact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new redaction mark for an area
 */
export function createAreaMark(
  pageIndex: number,
  bounds: Rect,
  options: Partial<RedactionOptions> = {}
): RedactionMark {
  const opts = { ...DEFAULT_REDACTION_OPTIONS, ...options };

  return {
    id: generateMarkId(),
    pageIndex,
    bounds,
    type: 'area',
    overlayText: opts.overlayText,
    overlayColor: opts.overlayColor,
    status: 'marked',
    createdAt: Date.now(),
  };
}

/**
 * Create a new redaction mark for selected text
 */
export function createTextMark(
  pageIndex: number,
  bounds: Rect,
  matchedText: string,
  options: Partial<RedactionOptions> = {}
): RedactionMark {
  const opts = { ...DEFAULT_REDACTION_OPTIONS, ...options };

  return {
    id: generateMarkId(),
    pageIndex,
    bounds,
    type: 'text',
    matchedText,
    overlayText: opts.overlayText,
    overlayColor: opts.overlayColor,
    status: 'marked',
    createdAt: Date.now(),
  };
}

/**
 * Create redaction marks for pattern matches
 */
export function createPatternMarks(
  pageIndex: number,
  matches: Array<{ text: string; bounds: Rect }>,
  pattern: string,
  patternName: string,
  options: Partial<RedactionOptions> = {}
): RedactionMark[] {
  const opts = { ...DEFAULT_REDACTION_OPTIONS, ...options };

  return matches.map((match) => ({
    id: generateMarkId(),
    pageIndex,
    bounds: match.bounds,
    type: 'pattern' as RedactionType,
    pattern,
    patternName,
    matchedText: match.text,
    overlayText: opts.overlayText,
    overlayColor: opts.overlayColor,
    status: 'marked' as const,
    createdAt: Date.now(),
  }));
}

/**
 * Update redaction mark options
 */
export function updateMarkOptions(
  mark: RedactionMark,
  options: Partial<Pick<RedactionMark, 'overlayText' | 'overlayColor'>>
): RedactionMark {
  return {
    ...mark,
    ...options,
  };
}

/**
 * Mark redactions as applied
 */
export function markAsApplied(marks: RedactionMark[]): RedactionMark[] {
  return marks.map((mark) => ({
    ...mark,
    status: 'applied' as const,
  }));
}

/**
 * Group marks by page
 */
export function groupMarksByPage(marks: RedactionMark[]): Map<number, RedactionMark[]> {
  const grouped = new Map<number, RedactionMark[]>();

  for (const mark of marks) {
    const pageMarks = grouped.get(mark.pageIndex) || [];
    pageMarks.push(mark);
    grouped.set(mark.pageIndex, pageMarks);
  }

  return grouped;
}

/**
 * Sort marks by position (top to bottom, left to right)
 */
export function sortMarksByPosition(marks: RedactionMark[]): RedactionMark[] {
  return [...marks].sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) {
      return a.pageIndex - b.pageIndex;
    }
    if (Math.abs(a.bounds.y - b.bounds.y) > 10) {
      return a.bounds.y - b.bounds.y;
    }
    return a.bounds.x - b.bounds.x;
  });
}

/**
 * Check if two rectangles overlap
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Merge overlapping marks on the same page
 */
export function mergeOverlappingMarks(marks: RedactionMark[]): RedactionMark[] {
  const result: RedactionMark[] = [];
  const grouped = groupMarksByPage(marks);

  for (const [_pageIndex, pageMarks] of grouped) {
    const merged: RedactionMark[] = [];
    const sorted = sortMarksByPosition(pageMarks);

    for (const mark of sorted) {
      let wasMerged = false;

      for (let i = 0; i < merged.length; i++) {
        if (rectsOverlap(merged[i]!.bounds, mark.bounds)) {
          // Merge the rectangles
          const existing = merged[i]!;
          const minX = Math.min(existing.bounds.x, mark.bounds.x);
          const minY = Math.min(existing.bounds.y, mark.bounds.y);
          const maxX = Math.max(
            existing.bounds.x + existing.bounds.width,
            mark.bounds.x + mark.bounds.width
          );
          const maxY = Math.max(
            existing.bounds.y + existing.bounds.height,
            mark.bounds.y + mark.bounds.height
          );

          merged[i] = {
            ...existing,
            bounds: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
            },
            matchedText: existing.matchedText
              ? `${existing.matchedText}, ${mark.matchedText || ''}`
              : mark.matchedText,
          };
          wasMerged = true;
          break;
        }
      }

      if (!wasMerged) {
        merged.push({ ...mark });
      }
    }

    result.push(...merged);
  }

  return result;
}

/**
 * Create an audit log entry
 */
export function createAuditEntry(
  action: AuditLogEntry['action'],
  details: Partial<Omit<AuditLogEntry, 'action' | 'timestamp'>>
): AuditLogEntry {
  return {
    action,
    timestamp: Date.now(),
    ...details,
  };
}

/**
 * Generate a redaction report
 */
export function generateReport(
  documentName: string,
  marks: RedactionMark[],
  auditLog: AuditLogEntry[]
): RedactionReport {
  const appliedMarks = marks.filter((m) => m.status === 'applied');
  const marksByPage: Record<number, number> = {};
  const patternsUsed = new Set<string>();

  let textCount = 0;
  let areaCount = 0;
  let patternCount = 0;

  for (const mark of marks) {
    // Count by page
    marksByPage[mark.pageIndex] = (marksByPage[mark.pageIndex] || 0) + 1;

    // Count by type
    switch (mark.type) {
      case 'text':
        textCount++;
        break;
      case 'area':
        areaCount++;
        break;
      case 'pattern':
        patternCount++;
        if (mark.patternName) {
          patternsUsed.add(mark.patternName);
        }
        break;
    }
  }

  return {
    documentName,
    generatedAt: Date.now(),
    totalMarks: marks.length,
    appliedMarks: appliedMarks.length,
    marksByType: {
      text: textCount,
      area: areaCount,
      pattern: patternCount,
    },
    marksByPage,
    patternsUsed: Array.from(patternsUsed),
    auditLog,
  };
}

/**
 * Export redaction marks as JSON for persistence
 */
export function exportMarksToJSON(marks: RedactionMark[]): string {
  return JSON.stringify(marks, null, 2);
}

/**
 * Import redaction marks from JSON
 */
export function importMarksFromJSON(json: string): RedactionMark[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: expected array');
    }

    // Validate each mark
    return parsed.map((item) => {
      if (!item.id || !item.pageIndex === undefined || !item.bounds || !item.type) {
        throw new Error('Invalid mark format');
      }
      return {
        ...item,
        status: item.status || 'marked',
        createdAt: item.createdAt || Date.now(),
      } as RedactionMark;
    });
  } catch (error) {
    throw new Error(
      `Failed to import redaction marks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calculate statistics for redaction marks
 */
export function calculateMarkStatistics(marks: RedactionMark[]): {
  total: number;
  pending: number;
  applied: number;
  byType: Record<RedactionType, number>;
  pageCount: number;
} {
  const byType: Record<RedactionType, number> = {
    text: 0,
    area: 0,
    pattern: 0,
  };

  let pending = 0;
  let applied = 0;
  const pages = new Set<number>();

  for (const mark of marks) {
    byType[mark.type]++;
    pages.add(mark.pageIndex);

    if (mark.status === 'marked') {
      pending++;
    } else {
      applied++;
    }
  }

  return {
    total: marks.length,
    pending,
    applied,
    byType,
    pageCount: pages.size,
  };
}
