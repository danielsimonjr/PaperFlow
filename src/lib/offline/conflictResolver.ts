/**
 * Conflict Resolver
 *
 * Utilities for detecting and resolving sync conflicts
 * with various resolution strategies.
 */

import type {
  SyncConflict,
  ConflictResolutionStrategy,
  DocumentVersion,
  EditHistoryEntry,
  MergeDetails,
} from '@/types/offline';
import type { Annotation } from '@/types/index';

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: SyncConflict['conflictType'];
  details?: string;
}

/**
 * Merge result
 */
export interface MergeResult<T> {
  merged: T;
  details: MergeDetails;
  conflicts: Array<{
    path: string;
    localValue: unknown;
    remoteValue: unknown;
  }>;
}

/**
 * Detect if there's a conflict between two versions
 */
export function detectConflict(
  local: DocumentVersion,
  remote: DocumentVersion
): ConflictDetectionResult {
  // Same checksum means no conflict
  if (local.checksum === remote.checksum) {
    return { hasConflict: false };
  }

  // Check if one is clearly newer (no overlap in changes)
  const localLatestChange = getLatestChangeTimestamp(local.changes);
  const remoteLatestChange = getLatestChangeTimestamp(remote.changes);
  const localEarliestChange = getEarliestChangeTimestamp(local.changes);
  const remoteEarliestChange = getEarliestChangeTimestamp(remote.changes);

  // If local changes all happened after remote changes, no conflict
  if (localEarliestChange && remoteLatestChange && localEarliestChange > remoteLatestChange) {
    return { hasConflict: false };
  }

  // If remote changes all happened after local changes, no conflict
  if (remoteEarliestChange && localLatestChange && remoteEarliestChange > localLatestChange) {
    return { hasConflict: false };
  }

  // Determine conflict type
  const conflictType = determineConflictType(local.changes, remote.changes);

  return {
    hasConflict: true,
    conflictType,
    details: `Local version ${local.version} conflicts with remote version ${remote.version}`,
  };
}

/**
 * Get the latest change timestamp from history
 */
function getLatestChangeTimestamp(changes: EditHistoryEntry[]): Date | null {
  if (changes.length === 0) return null;
  const firstChange = changes[0];
  if (!firstChange) return null;
  return changes.reduce((latest, change) => {
    const timestamp = new Date(change.timestamp);
    return timestamp > latest ? timestamp : latest;
  }, new Date(firstChange.timestamp));
}

/**
 * Get the earliest change timestamp from history
 */
function getEarliestChangeTimestamp(changes: EditHistoryEntry[]): Date | null {
  if (changes.length === 0) return null;
  const firstChange = changes[0];
  if (!firstChange) return null;
  return changes.reduce((earliest, change) => {
    const timestamp = new Date(change.timestamp);
    return timestamp < earliest ? timestamp : earliest;
  }, new Date(firstChange.timestamp));
}

/**
 * Determine the type of conflict based on changes
 */
function determineConflictType(
  localChanges: EditHistoryEntry[],
  remoteChanges: EditHistoryEntry[]
): SyncConflict['conflictType'] {
  const localTypes = new Set(localChanges.map((c) => c.type));
  const remoteTypes = new Set(remoteChanges.map((c) => c.type));

  // Check for overlapping change types
  const hasAnnotationConflict = localTypes.has('annotation') && remoteTypes.has('annotation');
  const hasFormConflict = localTypes.has('form') && remoteTypes.has('form');
  const hasPageConflict = localTypes.has('page') && remoteTypes.has('page');
  const hasTextConflict = localTypes.has('text') && remoteTypes.has('text');

  if (hasAnnotationConflict) return 'annotation';
  if (hasFormConflict) return 'form';
  if (hasPageConflict || hasTextConflict) return 'content';

  return 'metadata';
}

/**
 * Get recommended resolution strategy based on conflict
 */
export function getRecommendedStrategy(
  conflict: SyncConflict
): ConflictResolutionStrategy {
  // If one version is significantly newer, prefer it
  const timeDiff = Math.abs(
    conflict.localVersion.modifiedAt.getTime() -
    conflict.remoteVersion.modifiedAt.getTime()
  );

  // If more than 1 hour apart, use newest
  if (timeDiff > 60 * 60 * 1000) {
    return 'newest-wins';
  }

  // For annotation conflicts, try to merge
  if (conflict.conflictType === 'annotation') {
    return 'merge';
  }

  // For form conflicts, prefer local (user's recent input)
  if (conflict.conflictType === 'form') {
    return 'local-wins';
  }

  // Default to manual for content conflicts
  return 'manual';
}

/**
 * Merge annotations from two versions
 */
export function mergeAnnotations(
  localAnnotations: Annotation[],
  remoteAnnotations: Annotation[]
): MergeResult<Annotation[]> {
  const merged: Annotation[] = [];
  const conflicts: MergeResult<Annotation[]>['conflicts'] = [];
  const localMap = new Map(localAnnotations.map((a) => [a.id, a]));
  const remoteMap = new Map(remoteAnnotations.map((a) => [a.id, a]));

  let localChangesKept = 0;
  let remoteChangesKept = 0;
  let conflictingChanges = 0;

  // Process all unique annotation IDs
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (local && !remote) {
      // Local only - keep local
      merged.push(local);
      localChangesKept++;
    } else if (!local && remote) {
      // Remote only - keep remote
      merged.push(remote);
      remoteChangesKept++;
    } else if (local && remote) {
      // Both exist - check for conflict
      if (JSON.stringify(local) === JSON.stringify(remote)) {
        // Identical - use either
        merged.push(local);
      } else {
        // Different - use newest
        const localTime = new Date(local.updatedAt).getTime();
        const remoteTime = new Date(remote.updatedAt).getTime();

        if (localTime >= remoteTime) {
          merged.push(local);
          localChangesKept++;
        } else {
          merged.push(remote);
          remoteChangesKept++;
        }

        conflictingChanges++;
        conflicts.push({
          path: `annotations[${id}]`,
          localValue: local,
          remoteValue: remote,
        });
      }
    }
  }

  return {
    merged,
    details: {
      localChangesKept,
      remoteChangesKept,
      conflictingChanges,
      autoMerged: true,
    },
    conflicts,
  };
}

/**
 * Merge form values from two versions
 */
export function mergeFormValues(
  localValues: Record<string, unknown>,
  remoteValues: Record<string, unknown>,
  localModified: Date,
  remoteModified: Date
): MergeResult<Record<string, unknown>> {
  const merged: Record<string, unknown> = {};
  const conflicts: MergeResult<Record<string, unknown>>['conflicts'] = [];

  let localChangesKept = 0;
  let remoteChangesKept = 0;
  let conflictingChanges = 0;

  const allKeys = new Set([...Object.keys(localValues), ...Object.keys(remoteValues)]);

  for (const key of allKeys) {
    const localValue = localValues[key];
    const remoteValue = remoteValues[key];

    if (localValue !== undefined && remoteValue === undefined) {
      merged[key] = localValue;
      localChangesKept++;
    } else if (localValue === undefined && remoteValue !== undefined) {
      merged[key] = remoteValue;
      remoteChangesKept++;
    } else if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
      merged[key] = localValue;
    } else {
      // Conflict - use the newest version's value
      if (localModified >= remoteModified) {
        merged[key] = localValue;
        localChangesKept++;
      } else {
        merged[key] = remoteValue;
        remoteChangesKept++;
      }

      conflictingChanges++;
      conflicts.push({
        path: `formValues.${key}`,
        localValue,
        remoteValue,
      });
    }
  }

  return {
    merged,
    details: {
      localChangesKept,
      remoteChangesKept,
      conflictingChanges,
      autoMerged: true,
    },
    conflicts,
  };
}

/**
 * Merge edit histories
 */
export function mergeEditHistories(
  localHistory: EditHistoryEntry[],
  remoteHistory: EditHistoryEntry[]
): EditHistoryEntry[] {
  // Combine and sort by timestamp
  const combined = [...localHistory, ...remoteHistory];

  // Remove duplicates based on ID
  const uniqueById = new Map<string, EditHistoryEntry>();
  for (const entry of combined) {
    if (!uniqueById.has(entry.id)) {
      uniqueById.set(entry.id, entry);
    }
  }

  // Sort by timestamp
  return Array.from(uniqueById.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Generate conflict summary
 */
export function generateConflictSummary(conflict: SyncConflict): string {
  const lines: string[] = [];

  lines.push(`Conflict detected for document ${conflict.documentId}`);
  lines.push(`Type: ${conflict.conflictType}`);
  lines.push(`Local version: ${conflict.localVersion.version} (modified ${conflict.localVersion.modifiedAt.toLocaleString()})`);
  lines.push(`Remote version: ${conflict.remoteVersion.version} (modified ${conflict.remoteVersion.modifiedAt.toLocaleString()})`);
  lines.push(`Local changes: ${conflict.localVersion.changes.length}`);
  lines.push(`Remote changes: ${conflict.remoteVersion.changes.length}`);

  return lines.join('\n');
}

/**
 * Create conflict from versions
 */
export function createConflict(
  documentId: string,
  localVersion: DocumentVersion,
  remoteVersion: DocumentVersion
): SyncConflict {
  const detection = detectConflict(localVersion, remoteVersion);

  return {
    id: `conflict-${documentId}-${Date.now()}`,
    documentId,
    localVersion,
    remoteVersion,
    conflictType: detection.conflictType ?? 'content',
    detectedAt: new Date(),
  };
}
