/**
 * Batch OCR Progress Component
 * Shows progress for multi-page OCR processing with pause/resume/cancel.
 */

import { useState, useEffect, useMemo } from 'react';
import { Pause, Play, X, Check, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/utils/cn';
import type { BatchProgress, BatchPageStatus } from '@/lib/ocr/batchOCR';

interface BatchOCRProgressProps {
  progress: BatchProgress;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry?: () => void;
}

export function BatchOCRProgress({
  progress,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: BatchOCRProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time
  useEffect(() => {
    if (progress.status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - progress.startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [progress.status, progress.startTime]);

  // Calculate statistics
  const stats = useMemo(() => {
    let completed = 0;
    let errors = 0;
    let pending = 0;
    let processing = 0;

    for (const [, status] of progress.pageStatuses) {
      switch (status) {
        case 'complete':
          completed++;
          break;
        case 'error':
          errors++;
          break;
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
      }
    }

    return { completed, errors, pending, processing };
  }, [progress.pageStatuses]);

  const progressPercent =
    progress.totalPages > 0
      ? Math.round((progress.completedPages / progress.totalPages) * 100)
      : 0;

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (status: BatchPageStatus): string => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500 animate-pulse';
      case 'pending':
        return 'bg-gray-300 dark:bg-gray-600';
      case 'skipped':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Batch OCR Processing</span>
        </div>
        <span className="text-sm text-gray-500">
          {progress.status === 'processing' && 'Processing...'}
          {progress.status === 'paused' && 'Paused'}
          {progress.status === 'complete' && 'Complete'}
          {progress.status === 'cancelled' && 'Cancelled'}
        </span>
      </div>

      {/* Main Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            {progress.completedPages} of {progress.totalPages} pages
          </span>
          <span className="font-medium">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} max={100} />
      </div>

      {/* Page Grid */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-1">
          {Array.from(progress.pageStatuses.entries())
            .sort(([a], [b]) => a - b)
            .map(([pageIndex, status]) => (
              <div
                key={pageIndex}
                className={cn(
                  'w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium',
                  getStatusColor(status)
                )}
                title={`Page ${pageIndex + 1}: ${status}`}
              >
                {status === 'complete' && <Check className="h-3 w-3" />}
                {status === 'error' && <AlertCircle className="h-3 w-3" />}
                {status === 'processing' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
                {status === 'pending' && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {pageIndex + 1}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="font-bold text-blue-600 dark:text-blue-400">
            {stats.processing}
          </div>
          <div className="text-xs text-gray-500">Processing</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="font-bold text-gray-600 dark:text-gray-400">
            {stats.pending}
          </div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="font-bold text-red-600 dark:text-red-400">
            {stats.errors}
          </div>
          <div className="text-xs text-gray-500">Errors</div>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>Elapsed: {formatTime(elapsedTime)}</span>
        {progress.estimatedTimeRemaining && progress.status === 'processing' && (
          <span>
            Remaining: ~{formatTime(progress.estimatedTimeRemaining)}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        {stats.errors > 0 && progress.status === 'complete' && onRetry && (
          <Button
            variant="secondary"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Failed ({stats.errors})
          </Button>
        )}

        {(progress.status === 'processing' || progress.status === 'paused') && (
          <>
            {progress.status === 'processing' ? (
              <Button
                variant="secondary"
                onClick={onPause}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={onResume}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}

            <Button
              variant="danger"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
