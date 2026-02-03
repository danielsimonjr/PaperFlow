/**
 * Version Compare Component
 *
 * Side-by-side comparison of document versions for conflict resolution.
 */

import { useMemo } from 'react';
import { Plus, Minus, Edit, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { DocumentVersion, EditHistoryEntry, SyncConflict } from '@/types/offline';

export interface VersionCompareProps {
  localVersion: DocumentVersion;
  remoteVersion: DocumentVersion;
  conflictType: SyncConflict['conflictType'];
}

/**
 * Change display item
 */
interface ChangeItem {
  id: string;
  type: EditHistoryEntry['type'];
  action: EditHistoryEntry['action'];
  timestamp: Date;
  description: string;
  source: 'local' | 'remote' | 'both';
}

export function VersionCompare({
  localVersion,
  remoteVersion,
}: VersionCompareProps) {
  // Merge and sort changes from both versions
  const allChanges = useMemo(() => {
    const changes: ChangeItem[] = [];

    // Process local changes
    for (const entry of localVersion.changes) {
      changes.push({
        id: `local-${entry.id}`,
        type: entry.type,
        action: entry.action,
        timestamp: new Date(entry.timestamp),
        description: formatChangeDescription(entry),
        source: 'local',
      });
    }

    // Process remote changes
    for (const entry of remoteVersion.changes) {
      // Check if this change exists in local
      const existsInLocal = localVersion.changes.some((c) => c.id === entry.id);

      changes.push({
        id: `remote-${entry.id}`,
        type: entry.type,
        action: entry.action,
        timestamp: new Date(entry.timestamp),
        description: formatChangeDescription(entry),
        source: existsInLocal ? 'both' : 'remote',
      });
    }

    // Sort by timestamp
    changes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return changes;
  }, [localVersion, remoteVersion]);

  // Group changes by type
  const groupedChanges = useMemo(() => {
    const groups: Record<string, ChangeItem[]> = {};

    for (const change of allChanges) {
      if (!groups[change.type]) {
        groups[change.type] = [];
      }
      groups[change.type]!.push(change);
    }

    return groups;
  }, [allChanges]);

  const formatTime = (date: Date): string => {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: EditHistoryEntry['action']) => {
    switch (action) {
      case 'add':
        return <Plus className="h-4 w-4" />;
      case 'delete':
        return <Minus className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionColor = (action: EditHistoryEntry['action']) => {
    switch (action) {
      case 'add':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'delete':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'update':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceBadge = (source: ChangeItem['source']) => {
    switch (source) {
      case 'local':
        return (
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Local
          </span>
        );
      case 'remote':
        return (
          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Cloud
          </span>
        );
      case 'both':
        return (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            Both
          </span>
        );
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Change Comparison
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          {allChanges.length} total changes across both versions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-semibold text-blue-600">
            {allChanges.filter((c) => c.source === 'local').length}
          </p>
          <p className="text-sm text-gray-500">Local Only</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-purple-600">
            {allChanges.filter((c) => c.source === 'remote').length}
          </p>
          <p className="text-sm text-gray-500">Cloud Only</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-600">
            {allChanges.filter((c) => c.source === 'both').length}
          </p>
          <p className="text-sm text-gray-500">Common</p>
        </div>
      </div>

      {/* Changes by Type */}
      <div className="max-h-64 overflow-y-auto p-4">
        {Object.entries(groupedChanges).map(([type, changes]) => (
          <div key={type} className="mb-4 last:mb-0">
            <h5 className="mb-2 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
              {type} Changes ({changes.length})
            </h5>
            <div className="space-y-2">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded',
                      getActionColor(change.action)
                    )}
                  >
                    {getActionIcon(change.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-900 dark:text-white">
                      {change.description}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTime(change.timestamp)}
                    </div>
                  </div>
                  {getSourceBadge(change.source)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {allChanges.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            No changes to compare
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Format a change description from edit history entry
 */
function formatChangeDescription(entry: EditHistoryEntry): string {
  const actionLabels: Record<string, string> = {
    add: 'Added',
    update: 'Updated',
    delete: 'Deleted',
  };

  const typeLabels: Record<string, string> = {
    annotation: 'annotation',
    form: 'form field',
    page: 'page',
    text: 'text',
    signature: 'signature',
  };

  const action = actionLabels[entry.action] || entry.action;
  const type = typeLabels[entry.type] || entry.type;

  // Try to extract more details from payload
  if (entry.payload && typeof entry.payload === 'object') {
    const payload = entry.payload as Record<string, unknown>;
    if ('name' in payload) {
      return `${action} ${type}: ${payload.name}`;
    }
    if ('id' in payload) {
      return `${action} ${type} (${String(payload.id).slice(0, 8)}...)`;
    }
  }

  return `${action} ${type}`;
}
