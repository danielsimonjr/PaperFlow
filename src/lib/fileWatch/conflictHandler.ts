/**
 * Conflict Handler
 *
 * Handles conflicts when both local and external changes exist,
 * with merge strategies and user prompts.
 */

import type { ChangeSummary } from './changeDetector';
import type { DocumentDiff } from './documentDiff';
import type { UnsavedChanges } from './smartReload';

export type MergeStrategy =
  | 'keep-local'
  | 'keep-external'
  | 'merge-prefer-local'
  | 'merge-prefer-external'
  | 'manual';

export type ConflictType =
  | 'annotation-overlap'
  | 'annotation-on-changed-page'
  | 'form-value-conflict'
  | 'signature-overlap'
  | 'text-edit-conflict'
  | 'page-structure-conflict';

export interface Conflict {
  id: string;
  type: ConflictType;
  pageNumber: number;
  description: string;
  localData?: unknown;
  externalData?: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedStrategy: MergeStrategy;
  resolution?: {
    strategy: MergeStrategy;
    timestamp: number;
    auto: boolean;
  };
}

export interface ConflictResolutionResult {
  resolved: boolean;
  conflicts: Conflict[];
  resolvedConflicts: number;
  unresolvedConflicts: number;
  appliedStrategy: MergeStrategy;
  mergedData: {
    annotations: UnsavedChanges['annotations'];
    formValues: UnsavedChanges['formValues'];
    signatures: UnsavedChanges['signatures'];
  };
  warnings: string[];
}

let conflictIdCounter = 0;
const generateConflictId = () => `conflict-${Date.now()}-${++conflictIdCounter}`;

/**
 * Detect conflicts between local changes and external modifications
 */
export function detectConflicts(
  localChanges: UnsavedChanges,
  changeSummary: ChangeSummary,
  diff: DocumentDiff
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check for annotations on changed pages
  for (const annotation of localChanges.annotations) {
    const pageChange = diff.pageChanges.find(
      (c) => c.pageNumber === annotation.pageNumber
    );

    if (pageChange && pageChange.changeTypes.includes('content')) {
      conflicts.push({
        id: generateConflictId(),
        type: 'annotation-on-changed-page',
        pageNumber: annotation.pageNumber,
        description: `Annotation exists on a page whose content has changed`,
        localData: annotation,
        severity: 'medium',
        recommendedStrategy: 'merge-prefer-local',
      });
    }
  }

  // Check for annotations on removed pages
  for (const annotation of localChanges.annotations) {
    if (diff.pagesRemoved.includes(annotation.pageNumber)) {
      conflicts.push({
        id: generateConflictId(),
        type: 'page-structure-conflict',
        pageNumber: annotation.pageNumber,
        description: `Annotation exists on a page that was removed`,
        localData: annotation,
        severity: 'critical',
        recommendedStrategy: 'manual',
      });
    }
  }

  // Check for signatures on changed pages
  for (const signature of localChanges.signatures) {
    const pageChange = diff.pageChanges.find(
      (c) => c.pageNumber === signature.pageNumber
    );

    if (pageChange && pageChange.changeTypes.includes('content')) {
      conflicts.push({
        id: generateConflictId(),
        type: 'signature-overlap',
        pageNumber: signature.pageNumber,
        description: `Signature exists on a page whose content has changed`,
        localData: signature,
        severity: 'high',
        recommendedStrategy: 'manual',
      });
    }
  }

  // Check form field conflicts
  if (changeSummary.changes.some((c) => c.type === 'form-fields-changed')) {
    if (Object.keys(localChanges.formValues).length > 0) {
      conflicts.push({
        id: generateConflictId(),
        type: 'form-value-conflict',
        pageNumber: 0, // Form-wide conflict
        description: 'Form fields have changed and local form values may not apply',
        localData: localChanges.formValues,
        severity: 'medium',
        recommendedStrategy: 'merge-prefer-local',
      });
    }
  }

  // Check text edit conflicts
  for (const edit of localChanges.textEdits) {
    const pageChange = diff.pageChanges.find(
      (c) => c.pageNumber === edit.pageNumber
    );

    if (pageChange && pageChange.changeTypes.includes('content')) {
      conflicts.push({
        id: generateConflictId(),
        type: 'text-edit-conflict',
        pageNumber: edit.pageNumber,
        description: 'Text edit on a page whose content has changed',
        localData: edit,
        severity: 'high',
        recommendedStrategy: 'manual',
      });
    }
  }

  return conflicts;
}

/**
 * Automatically resolve conflicts based on strategy
 */
export function autoResolveConflicts(
  conflicts: Conflict[],
  strategy: MergeStrategy
): Conflict[] {
  return conflicts.map((conflict) => {
    // Critical conflicts should not be auto-resolved
    if (conflict.severity === 'critical') {
      return conflict;
    }

    // Apply strategy
    const effectiveStrategy =
      strategy === 'manual' ? conflict.recommendedStrategy : strategy;

    return {
      ...conflict,
      resolution: {
        strategy: effectiveStrategy,
        timestamp: Date.now(),
        auto: true,
      },
    };
  });
}

/**
 * Apply conflict resolutions to merge local and external changes
 */
export function applyConflictResolutions(
  localChanges: UnsavedChanges,
  conflicts: Conflict[],
  defaultStrategy: MergeStrategy
): ConflictResolutionResult {
  const warnings: string[] = [];
  const resolvedConflicts = conflicts.filter((c) => c.resolution);
  const unresolvedConflicts = conflicts.filter((c) => !c.resolution);

  // Prepare merged data
  const mergedData: ConflictResolutionResult['mergedData'] = {
    annotations: [],
    formValues: {},
    signatures: [],
  };

  // If keep-external strategy and no conflicts, discard all local changes
  if (defaultStrategy === 'keep-external') {
    warnings.push('All local changes discarded in favor of external version');
    return {
      resolved: true,
      conflicts: [],
      resolvedConflicts: 0,
      unresolvedConflicts: 0,
      appliedStrategy: defaultStrategy,
      mergedData,
      warnings,
    };
  }

  // Process annotations
  for (const annotation of localChanges.annotations) {
    const conflict = conflicts.find(
      (c) =>
        (c.type === 'annotation-on-changed-page' ||
          c.type === 'page-structure-conflict') &&
        c.pageNumber === annotation.pageNumber &&
        c.localData === annotation
    );

    if (conflict) {
      const strategy = conflict.resolution?.strategy ?? defaultStrategy;

      switch (strategy) {
        case 'keep-local':
        case 'merge-prefer-local':
          mergedData.annotations.push(annotation);
          break;
        case 'keep-external':
          // Skip annotation
          warnings.push(
            `Annotation on page ${annotation.pageNumber} was not preserved`
          );
          break;
        case 'merge-prefer-external':
          // Include but mark as potentially invalid
          mergedData.annotations.push({ ...annotation, isModified: true });
          warnings.push(
            `Annotation on page ${annotation.pageNumber} may need manual adjustment`
          );
          break;
        case 'manual':
          // Skip and warn
          warnings.push(
            `Annotation on page ${annotation.pageNumber} requires manual resolution`
          );
          break;
      }
    } else {
      // No conflict, include annotation
      mergedData.annotations.push(annotation);
    }
  }

  // Process form values
  const formConflict = conflicts.find((c) => c.type === 'form-value-conflict');
  const formStrategy = formConflict?.resolution?.strategy ?? defaultStrategy;

  if (formStrategy === 'keep-local' || formStrategy === 'merge-prefer-local') {
    mergedData.formValues = { ...localChanges.formValues };
  } else if (formStrategy === 'merge-prefer-external') {
    // Would need external form values - for now keep local
    mergedData.formValues = { ...localChanges.formValues };
    warnings.push('Form values preserved but may not apply to new form structure');
  }

  // Process signatures
  for (const signature of localChanges.signatures) {
    const conflict = conflicts.find(
      (c) =>
        c.type === 'signature-overlap' &&
        c.pageNumber === signature.pageNumber
    );

    if (conflict) {
      const strategy = conflict.resolution?.strategy ?? defaultStrategy;

      switch (strategy) {
        case 'keep-local':
        case 'merge-prefer-local':
          mergedData.signatures.push(signature);
          warnings.push(
            `Signature on page ${signature.pageNumber} preserved but position may need adjustment`
          );
          break;
        case 'keep-external':
        case 'merge-prefer-external':
          warnings.push(
            `Signature on page ${signature.pageNumber} was not preserved`
          );
          break;
        case 'manual':
          warnings.push(
            `Signature on page ${signature.pageNumber} requires manual resolution`
          );
          break;
      }
    } else {
      mergedData.signatures.push(signature);
    }
  }

  return {
    resolved: unresolvedConflicts.length === 0,
    conflicts,
    resolvedConflicts: resolvedConflicts.length,
    unresolvedConflicts: unresolvedConflicts.length,
    appliedStrategy: defaultStrategy,
    mergedData,
    warnings,
  };
}

/**
 * Get a human-readable description of a conflict
 */
export function getConflictDescription(conflict: Conflict): {
  title: string;
  detail: string;
  suggestion: string;
} {
  switch (conflict.type) {
    case 'annotation-on-changed-page':
      return {
        title: 'Annotation on Changed Page',
        detail: `Page ${conflict.pageNumber} has been modified. Your annotation may no longer align correctly with the page content.`,
        suggestion: 'Review the annotation position after reload.',
      };

    case 'page-structure-conflict':
      return {
        title: 'Page Removed',
        detail: `Page ${conflict.pageNumber} has been removed from the document. Your changes on this page cannot be preserved.`,
        suggestion: 'You may need to recreate your changes on a different page.',
      };

    case 'signature-overlap':
      return {
        title: 'Signature Position Conflict',
        detail: `The page containing your signature has changed. The signature position may no longer be correct.`,
        suggestion: 'Verify and adjust the signature position after reload.',
      };

    case 'form-value-conflict':
      return {
        title: 'Form Structure Changed',
        detail: 'The form fields have changed. Some of your entered values may not apply to the new form structure.',
        suggestion: 'Review and re-enter form values as needed.',
      };

    case 'text-edit-conflict':
      return {
        title: 'Text Edit on Changed Page',
        detail: `Page ${conflict.pageNumber} content has changed. Your text edits may not align correctly.`,
        suggestion: 'Review and adjust text edits after reload.',
      };

    case 'annotation-overlap':
      return {
        title: 'Annotation Overlap',
        detail: `Multiple annotations overlap at the same position on page ${conflict.pageNumber}.`,
        suggestion: 'Review and reorganize annotations.',
      };

    default:
      return {
        title: 'Conflict Detected',
        detail: conflict.description,
        suggestion: 'Review the changes manually.',
      };
  }
}

/**
 * Sort conflicts by severity
 */
export function sortConflictsBySeverity(conflicts: Conflict[]): Conflict[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...conflicts].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Get conflicts that need user attention
 */
export function getUnresolvedConflicts(conflicts: Conflict[]): Conflict[] {
  return conflicts.filter(
    (c) => !c.resolution || c.severity === 'critical'
  );
}
