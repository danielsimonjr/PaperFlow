/**
 * Merge Strategy
 *
 * Defines and implements various strategies for merging local
 * and external document changes.
 */

import type { MergeStrategy, Conflict } from './conflictHandler';
import type { UnsavedChanges } from './smartReload';
import type { ChangeSummary } from './changeDetector';

export interface MergeStrategyConfig {
  strategy: MergeStrategy;
  label: string;
  description: string;
  icon: string;
  priority: number;
  applicableWhen: string[];
  risks: string[];
}

export interface MergeOptions {
  strategy: MergeStrategy;
  preserveAllLocal: boolean;
  preserveAllExternal: boolean;
  conflictPageNumbers: number[];
  skipPages: number[];
}

export interface MergeResult {
  success: boolean;
  strategy: MergeStrategy;
  merged: {
    annotations: UnsavedChanges['annotations'];
    formValues: UnsavedChanges['formValues'];
    signatures: UnsavedChanges['signatures'];
    textEdits: UnsavedChanges['textEdits'];
  };
  skipped: {
    annotations: number;
    formValues: number;
    signatures: number;
    textEdits: number;
  };
  messages: string[];
}

/**
 * Available merge strategies with metadata
 */
export const MERGE_STRATEGIES: MergeStrategyConfig[] = [
  {
    strategy: 'keep-local',
    label: 'Keep My Changes',
    description: 'Discard external changes and keep all your local edits',
    icon: 'upload',
    priority: 1,
    applicableWhen: [
      'Your changes are more important',
      'External changes are irrelevant',
    ],
    risks: [
      'External changes will be lost',
      'Document may become out of sync',
    ],
  },
  {
    strategy: 'keep-external',
    label: 'Keep External Changes',
    description: 'Accept external changes and discard your local edits',
    icon: 'download',
    priority: 2,
    applicableWhen: [
      'External changes are authoritative',
      'Your changes can be redone',
    ],
    risks: ['Your local edits will be lost'],
  },
  {
    strategy: 'merge-prefer-local',
    label: 'Merge (Prefer My Changes)',
    description:
      'Combine both changes, preferring your edits when conflicts occur',
    icon: 'git-merge',
    priority: 3,
    applicableWhen: [
      'Both changes are important',
      'Your changes take precedence',
    ],
    risks: ['Some external changes may be overwritten'],
  },
  {
    strategy: 'merge-prefer-external',
    label: 'Merge (Prefer External)',
    description:
      'Combine both changes, preferring external edits when conflicts occur',
    icon: 'git-pull-request',
    priority: 4,
    applicableWhen: [
      'Both changes are important',
      'External changes take precedence',
    ],
    risks: ['Some local changes may be overwritten'],
  },
  {
    strategy: 'manual',
    label: 'Review Manually',
    description: 'Review each conflict and decide individually',
    icon: 'eye',
    priority: 5,
    applicableWhen: [
      'Conflicts are complex',
      'Changes need careful review',
    ],
    risks: ['Takes more time', 'Requires user attention'],
  },
];

/**
 * Get strategy configuration by ID
 */
export function getStrategyConfig(strategy: MergeStrategy): MergeStrategyConfig {
  const found = MERGE_STRATEGIES.find((s) => s.strategy === strategy);
  // Default to manual strategy if not found
  return found ?? MERGE_STRATEGIES[4]!;
}

/**
 * Recommend a merge strategy based on the changes
 */
export function recommendStrategy(
  changeSummary: ChangeSummary,
  localChanges: UnsavedChanges,
  conflicts: Conflict[]
): MergeStrategy {
  const hasLocalAnnotations = localChanges.annotations.length > 0;
  const hasLocalSignatures = localChanges.signatures.length > 0;
  const hasLocalFormValues = Object.keys(localChanges.formValues).length > 0;
  const hasCriticalConflicts = conflicts.some((c) => c.severity === 'critical');
  const hasHighConflicts = conflicts.some((c) => c.severity === 'high');

  // Critical conflicts require manual review
  if (hasCriticalConflicts) {
    return 'manual';
  }

  // No local changes - just accept external
  if (!hasLocalAnnotations && !hasLocalSignatures && !hasLocalFormValues) {
    return 'keep-external';
  }

  // Signatures with conflicts should be reviewed
  if (hasLocalSignatures && hasHighConflicts) {
    return 'manual';
  }

  // Minor changes with local edits - merge prefer local
  if (changeSummary.minorChanges > 0 && changeSummary.majorChanges === 0) {
    return 'merge-prefer-local';
  }

  // Major external changes with local edits - prompt user
  if (changeSummary.majorChanges > 0 && hasLocalAnnotations) {
    return 'manual';
  }

  // Default to merge prefer local
  return 'merge-prefer-local';
}

/**
 * Execute a merge strategy
 */
export function executeMerge(
  localChanges: UnsavedChanges,
  conflicts: Conflict[],
  options: MergeOptions
): MergeResult {
  const result: MergeResult = {
    success: true,
    strategy: options.strategy,
    merged: {
      annotations: [],
      formValues: {},
      signatures: [],
      textEdits: [],
    },
    skipped: {
      annotations: 0,
      formValues: 0,
      signatures: 0,
      textEdits: 0,
    },
    messages: [],
  };

  // Process based on strategy
  switch (options.strategy) {
    case 'keep-local':
      // Keep all local changes
      result.merged.annotations = [...localChanges.annotations];
      result.merged.formValues = { ...localChanges.formValues };
      result.merged.signatures = [...localChanges.signatures];
      result.merged.textEdits = [...localChanges.textEdits];
      result.messages.push('All local changes preserved');
      break;

    case 'keep-external':
      // Discard all local changes
      result.skipped.annotations = localChanges.annotations.length;
      result.skipped.signatures = localChanges.signatures.length;
      result.skipped.textEdits = localChanges.textEdits.length;
      result.skipped.formValues = Object.keys(localChanges.formValues).length;
      result.messages.push('All local changes discarded');
      break;

    case 'merge-prefer-local':
      // Include all local, skip conflicting external
      result.merged.annotations = localChanges.annotations.filter(
        (a) => !options.skipPages.includes(a.pageNumber)
      );
      result.merged.formValues = { ...localChanges.formValues };
      result.merged.signatures = localChanges.signatures.filter(
        (s) => !options.skipPages.includes(s.pageNumber)
      );
      result.merged.textEdits = localChanges.textEdits.filter(
        (t) => !options.skipPages.includes(t.pageNumber)
      );

      result.skipped.annotations =
        localChanges.annotations.length - result.merged.annotations.length;
      result.skipped.signatures =
        localChanges.signatures.length - result.merged.signatures.length;
      result.skipped.textEdits =
        localChanges.textEdits.length - result.merged.textEdits.length;

      if (result.skipped.annotations > 0 || result.skipped.signatures > 0) {
        result.messages.push(
          `Skipped changes on pages: ${options.skipPages.join(', ')}`
        );
      }
      break;

    case 'merge-prefer-external': {
      // Include local only for non-conflicting pages
      const conflictPages = new Set(options.conflictPageNumbers);

      result.merged.annotations = localChanges.annotations.filter(
        (a) => !conflictPages.has(a.pageNumber)
      );
      result.merged.signatures = localChanges.signatures.filter(
        (s) => !conflictPages.has(s.pageNumber)
      );
      result.merged.textEdits = localChanges.textEdits.filter(
        (t) => !conflictPages.has(t.pageNumber)
      );
      // Form values are tricky - keep if no form structure change
      if (!conflicts.some((c) => c.type === 'form-value-conflict')) {
        result.merged.formValues = { ...localChanges.formValues };
      }

      result.skipped.annotations =
        localChanges.annotations.length - result.merged.annotations.length;
      result.skipped.signatures =
        localChanges.signatures.length - result.merged.signatures.length;
      result.skipped.textEdits =
        localChanges.textEdits.length - result.merged.textEdits.length;

      result.messages.push(
        `Local changes on conflict pages were discarded in favor of external`
      );
      break;
    }

    case 'manual':
      // For manual, we don't auto-merge anything
      result.success = false;
      result.messages.push('Manual merge required - no automatic changes applied');
      break;
  }

  return result;
}

/**
 * Create merge options from conflicts
 */
export function createMergeOptions(
  strategy: MergeStrategy,
  conflicts: Conflict[]
): MergeOptions {
  const conflictPageNumbers = [
    ...new Set(conflicts.map((c) => c.pageNumber).filter((p) => p > 0)),
  ];

  // Determine which pages to skip based on strategy and conflicts
  let skipPages: number[] = [];

  if (strategy === 'keep-external') {
    // Skip all pages with local changes
    skipPages = [...conflictPageNumbers];
  } else if (strategy === 'merge-prefer-external') {
    // Skip pages with high/critical conflicts
    skipPages = conflicts
      .filter((c) => c.severity === 'high' || c.severity === 'critical')
      .map((c) => c.pageNumber)
      .filter((p) => p > 0);
  }

  return {
    strategy,
    preserveAllLocal: strategy === 'keep-local',
    preserveAllExternal: strategy === 'keep-external',
    conflictPageNumbers,
    skipPages: [...new Set(skipPages)],
  };
}

/**
 * Get a summary of what will happen with a given strategy
 */
export function previewMerge(
  localChanges: UnsavedChanges,
  conflicts: Conflict[],
  strategy: MergeStrategy
): {
  willPreserve: { annotations: number; formValues: number; signatures: number };
  willDiscard: { annotations: number; formValues: number; signatures: number };
  requiresReview: number;
} {
  const options = createMergeOptions(strategy, conflicts);

  const willPreserve = {
    annotations: 0,
    formValues: 0,
    signatures: 0,
  };

  const willDiscard = {
    annotations: 0,
    formValues: 0,
    signatures: 0,
  };

  switch (strategy) {
    case 'keep-local':
      willPreserve.annotations = localChanges.annotations.length;
      willPreserve.formValues = Object.keys(localChanges.formValues).length;
      willPreserve.signatures = localChanges.signatures.length;
      break;

    case 'keep-external':
      willDiscard.annotations = localChanges.annotations.length;
      willDiscard.formValues = Object.keys(localChanges.formValues).length;
      willDiscard.signatures = localChanges.signatures.length;
      break;

    case 'merge-prefer-local':
    case 'merge-prefer-external': {
      const skipSet = new Set(options.skipPages);

      willPreserve.annotations = localChanges.annotations.filter(
        (a) => !skipSet.has(a.pageNumber)
      ).length;
      willDiscard.annotations = localChanges.annotations.length - willPreserve.annotations;

      willPreserve.signatures = localChanges.signatures.filter(
        (s) => !skipSet.has(s.pageNumber)
      ).length;
      willDiscard.signatures = localChanges.signatures.length - willPreserve.signatures;

      willPreserve.formValues = Object.keys(localChanges.formValues).length;
      break;
    }
  }

  const requiresReview = strategy === 'manual' ? conflicts.length : 0;

  return { willPreserve, willDiscard, requiresReview };
}
