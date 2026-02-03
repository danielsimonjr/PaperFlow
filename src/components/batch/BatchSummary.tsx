/**
 * BatchSummary - Summary view after batch completion
 */

import React, { useMemo } from 'react';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import { Button } from '@/components/ui/Button';

export interface BatchSummaryProps {
  /** Job ID to show summary for */
  jobId: string;
  /** Callback when summary is closed */
  onClose?: () => void;
  /** Callback to retry failed files */
  onRetry?: () => void;
  /** Callback to export report */
  onExportReport?: (format: 'text' | 'csv' | 'json') => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BatchSummary({
  jobId,
  onClose,
  onRetry,
  onExportReport,
}: BatchSummaryProps): React.ReactElement {
  const getJob = useNativeBatchStore((state) => state.getJob);
  const job = getJob(jobId);

  const stats = useMemo(() => {
    if (!job) {
      return {
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        totalTime: 0,
        totalInputSize: 0,
        totalOutputSize: 0,
        successRate: 0,
      };
    }

    const completedFiles = job.files.filter((f) => f.status === 'completed');
    const failedFiles = job.files.filter((f) => f.status === 'failed');
    const skippedFiles = job.files.filter((f) => f.status === 'cancelled');

    const totalInputSize = job.files.reduce((sum, f) => sum + f.size, 0);
    const totalOutputSize = completedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    const totalTime = job.completedAt && job.startedAt
      ? job.completedAt - job.startedAt
      : 0;

    return {
      totalFiles: job.files.length,
      completedFiles: completedFiles.length,
      failedFiles: failedFiles.length,
      skippedFiles: skippedFiles.length,
      totalTime,
      totalInputSize,
      totalOutputSize,
      successRate: job.files.length > 0
        ? Math.round((completedFiles.length / job.files.length) * 100)
        : 0,
    };
  }, [job]);

  if (!job) {
    return (
      <div className="batch-summary p-6 text-center">
        <p className="text-gray-500">Job not found</p>
        {onClose && (
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  const isSuccess = job.status === 'completed' && stats.failedFiles === 0;
  const isPartialSuccess = job.status === 'completed' && stats.failedFiles > 0;
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';

  return (
    <div className="batch-summary max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isSuccess
              ? 'bg-green-100'
              : isPartialSuccess
              ? 'bg-yellow-100'
              : isFailed
              ? 'bg-red-100'
              : 'bg-gray-100'
          }`}
        >
          {isSuccess && (
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isPartialSuccess && (
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {isFailed && (
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {isCancelled && (
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-semibold mb-2">
          {isSuccess && 'Batch Complete'}
          {isPartialSuccess && 'Batch Complete with Errors'}
          {isFailed && 'Batch Failed'}
          {isCancelled && 'Batch Cancelled'}
        </h2>
        <p className="text-gray-600">{job.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completedFiles}</p>
          <p className="text-sm text-gray-600">Successful</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failedFiles}</p>
          <p className="text-sm text-gray-600">Failed</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.skippedFiles}</p>
          <p className="text-sm text-gray-600">Skipped</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{stats.successRate}%</p>
          <p className="text-sm text-gray-600">Success Rate</p>
        </div>
      </div>

      {/* Time and size stats */}
      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Time</p>
            <p className="text-lg font-medium">{formatDuration(stats.totalTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Input Size</p>
            <p className="text-lg font-medium">{formatFileSize(stats.totalInputSize)}</p>
          </div>
          {stats.totalOutputSize > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-600">Total Output Size</p>
                <p className="text-lg font-medium">{formatFileSize(stats.totalOutputSize)}</p>
              </div>
              {job.type === 'compress' && (
                <div>
                  <p className="text-sm text-gray-600">Compression</p>
                  <p className="text-lg font-medium">
                    {Math.round((1 - stats.totalOutputSize / stats.totalInputSize) * 100)}%
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* File results */}
      <div className="mb-8">
        <h3 className="font-medium mb-3">Results</h3>
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {job.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                {file.outputPath && (
                  <p className="text-sm text-gray-500 truncate">
                    Output: {file.outputPath}
                  </p>
                )}
                {file.error && (
                  <p className="text-sm text-red-600">{file.error}</p>
                )}
              </div>
              <div className="ml-3">
                {file.status === 'completed' && (
                  <span className="text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {file.status === 'failed' && (
                  <span className="text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {file.status === 'cancelled' && (
                  <span className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {stats.failedFiles > 0 && onRetry && (
          <Button onClick={onRetry}>Retry Failed</Button>
        )}
        {onExportReport && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onExportReport('text')}>
              Export TXT
            </Button>
            <Button variant="outline" onClick={() => onExportReport('csv')}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => onExportReport('json')}>
              Export JSON
            </Button>
          </div>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
