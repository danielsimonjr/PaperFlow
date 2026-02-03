/**
 * Sync Conflict Resolution Dialog
 *
 * Dialog for resolving sync conflicts with side-by-side comparison,
 * version selection, and merge options.
 */

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Monitor,
  Cloud,
  Clock,
  Check,
  GitMerge,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOfflineStore } from '@/stores/offlineStore';
import { syncEngine } from '@/lib/offline/syncEngine';
import { getRecommendedStrategy } from '@/lib/offline/conflictResolver';
import { VersionCompare } from './VersionCompare';
import { cn } from '@/utils/cn';
import type { SyncConflict, ConflictResolutionStrategy } from '@/types/offline';

export interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflict?: SyncConflict;
}

/**
 * Resolution option
 */
interface ResolutionOption {
  strategy: ConflictResolutionStrategy;
  label: string;
  description: string;
  icon: React.ElementType;
  recommended?: boolean;
}

export function ConflictDialog({ isOpen, onClose, conflict }: ConflictDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const resolveConflict = useOfflineStore((state) => state.resolveConflict);

  if (!isOpen || !conflict) {
    return null;
  }

  const recommendedStrategy = getRecommendedStrategy(conflict);

  const resolutionOptions: ResolutionOption[] = [
    {
      strategy: 'local-wins',
      label: 'Keep Local',
      description: 'Use the version from this device and discard cloud changes',
      icon: Monitor,
      recommended: recommendedStrategy === 'local-wins',
    },
    {
      strategy: 'remote-wins',
      label: 'Keep Cloud',
      description: 'Use the version from the cloud and discard local changes',
      icon: Cloud,
      recommended: recommendedStrategy === 'remote-wins',
    },
    {
      strategy: 'newest-wins',
      label: 'Keep Newest',
      description: 'Automatically select the most recently modified version',
      icon: Clock,
      recommended: recommendedStrategy === 'newest-wins',
    },
    {
      strategy: 'merge',
      label: 'Merge Changes',
      description: 'Combine changes from both versions (annotations only)',
      icon: GitMerge,
      recommended: recommendedStrategy === 'merge',
    },
  ];

  const handleResolve = async () => {
    if (!selectedStrategy) return;

    setIsResolving(true);
    try {
      await syncEngine.resolveConflict(conflict, selectedStrategy);
      resolveConflict(conflict.id, selectedStrategy);
      onClose();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sync Conflict Detected
              </h2>
              <p className="text-sm text-gray-500">
                {conflict.conflictType} conflict requires resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Version Summary */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                <Monitor className="h-4 w-4" />
                <span className="font-medium">Local Version</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Version: {conflict.localVersion.version}</p>
                <p>Modified: {formatDate(conflict.localVersion.modifiedAt)}</p>
                <p>Changes: {conflict.localVersion.changes.length}</p>
              </div>
            </div>

            {/* Remote Version */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                <Cloud className="h-4 w-4" />
                <span className="font-medium">Cloud Version</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Version: {conflict.remoteVersion.version}</p>
                <p>Modified: {formatDate(conflict.remoteVersion.modifiedAt)}</p>
                <p>Changes: {conflict.remoteVersion.changes.length}</p>
              </div>
            </div>
          </div>

          {/* View Comparison Button */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mb-6 flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
          >
            {showComparison ? 'Hide comparison' : 'View detailed comparison'}
            <ArrowRight className={cn('h-4 w-4 transition-transform', showComparison && 'rotate-90')} />
          </button>

          {/* Comparison View */}
          {showComparison && (
            <div className="mb-6">
              <VersionCompare
                localVersion={conflict.localVersion}
                remoteVersion={conflict.remoteVersion}
                conflictType={conflict.conflictType}
              />
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-3">
            <p className="font-medium text-gray-900 dark:text-white">
              Choose how to resolve this conflict:
            </p>

            {resolutionOptions.map((option) => (
              <button
                key={option.strategy}
                onClick={() => setSelectedStrategy(option.strategy)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors',
                  selectedStrategy === option.strategy
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                    selectedStrategy === option.strategy
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  )}
                >
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    {option.recommended && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                {selectedStrategy === option.strategy && (
                  <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleResolve}
            disabled={!selectedStrategy || isResolving}
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </Button>
        </div>
      </div>
    </div>
  );
}
