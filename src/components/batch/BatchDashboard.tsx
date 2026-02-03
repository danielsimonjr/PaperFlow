/**
 * BatchDashboard - Real-time dashboard showing batch job progress
 */

import React from 'react';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import type { BatchJob, JobStatus } from '@/types/batch';
import { Button } from '@/components/ui/Button';

export interface BatchDashboardProps {
  /** Show only active jobs */
  activeOnly?: boolean;
  /** Callback when a job is selected */
  onJobSelect?: (jobId: string) => void;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-gray-200 text-gray-700',
  queued: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  retrying: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  processing: 'Processing',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  retrying: 'Retrying',
};

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

function JobCard({
  job,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onSelect,
}: {
  job: BatchJob;
  onCancel: () => void;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
  onSelect?: () => void;
}): React.ReactElement {
  const progress = job.progress;
  const isActive = job.status === 'processing';
  const canCancel = ['pending', 'queued', 'processing', 'paused'].includes(job.status);
  const canRetry = job.status === 'failed';
  const canPause = job.status === 'processing';
  const canResume = job.status === 'paused';

  return (
    <div
      className={`border rounded-lg p-4 ${isActive ? 'border-primary-500 shadow-sm' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{job.name}</h4>
          <p className="text-sm text-gray-500 capitalize">{job.type}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[job.status]}`}
        >
          {STATUS_LABELS[job.status]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>
            {progress.completedFiles + progress.failedFiles} / {progress.totalFiles} files
          </span>
          <span>{progress.overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              job.status === 'failed'
                ? 'bg-red-500'
                : job.status === 'completed'
                ? 'bg-green-500'
                : 'bg-primary-500'
            }`}
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Current file info */}
      {isActive && progress.currentFile && (
        <div className="text-sm text-gray-600 mb-3">
          <p className="truncate">Processing: {progress.currentFile}</p>
          {progress.estimatedTimeRemaining && (
            <p>ETA: {formatDuration(progress.estimatedTimeRemaining)}</p>
          )}
        </div>
      )}

      {/* Error message */}
      {job.error && (
        <div className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded">
          {job.error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
        <div>
          <span className="text-green-600">{progress.completedFiles}</span> completed
        </div>
        <div>
          <span className="text-red-600">{progress.failedFiles}</span> failed
        </div>
        <div>
          <span className="text-gray-600">
            {progress.totalFiles - progress.completedFiles - progress.failedFiles}
          </span>{' '}
          pending
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {canPause && (
          <Button size="sm" variant="outline" onClick={onPause}>
            Pause
          </Button>
        )}
        {canResume && (
          <Button size="sm" variant="outline" onClick={onResume}>
            Resume
          </Button>
        )}
        {canRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
        {canCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function ResourceMonitor({
  usage,
}: {
  usage: {
    cpuPercent: number;
    memoryUsed: number;
    memoryTotal: number;
    activeWorkers: number;
    maxWorkers: number;
  } | null;
}): React.ReactElement {
  if (!usage) return <></>;

  const memoryPercent = (usage.memoryUsed / usage.memoryTotal) * 100;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-3">Resource Usage</h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>CPU</span>
            <span>{usage.cpuPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${usage.cpuPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Memory</span>
            <span>
              {formatFileSize(usage.memoryUsed)} / {formatFileSize(usage.memoryTotal)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${memoryPercent > 80 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${memoryPercent}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span>Workers</span>
          <span>
            {usage.activeWorkers} / {usage.maxWorkers}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BatchDashboard({
  activeOnly = false,
  onJobSelect,
}: BatchDashboardProps): React.ReactElement {
  const {
    jobs,
    isProcessing,
    isPaused,
    resourceUsage,
    queueStats,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    cancelJob,
    retryJob,
    clearCompletedJobs,
  } = useNativeBatchStore();

  const displayJobs = activeOnly
    ? jobs.filter((j) => ['pending', 'queued', 'processing', 'paused'].includes(j.status))
    : jobs;

  const hasPendingJobs = jobs.some((j) => ['pending', 'queued'].includes(j.status));
  const hasCompletedJobs = jobs.some((j) =>
    ['completed', 'cancelled'].includes(j.status)
  );

  return (
    <div className="batch-dashboard p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Batch Processing</h2>
          <p className="text-sm text-gray-500">
            {queueStats.pendingJobs} pending, {queueStats.processingJobs} processing,{' '}
            {queueStats.completedJobs} completed
          </p>
        </div>
        <div className="flex gap-2">
          {!isProcessing && hasPendingJobs && (
            <Button onClick={startProcessing}>Start Processing</Button>
          )}
          {isProcessing && !isPaused && (
            <Button variant="outline" onClick={pauseProcessing}>
              Pause All
            </Button>
          )}
          {isProcessing && isPaused && (
            <Button onClick={resumeProcessing}>Resume All</Button>
          )}
          {hasCompletedJobs && (
            <Button variant="ghost" onClick={clearCompletedJobs}>
              Clear Completed
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Job list */}
        <div className="lg:col-span-3">
          {displayJobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No batch jobs</p>
              <p className="text-sm text-gray-400 mt-1">
                Use the wizard to create a new batch job
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCancel={() => cancelJob(job.id)}
                  onRetry={() => retryJob(job.id)}
                  onPause={pauseProcessing}
                  onResume={resumeProcessing}
                  onSelect={() => onJobSelect?.(job.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ResourceMonitor usage={resourceUsage} />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Queue Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Jobs</span>
                <span className="font-medium">{queueStats.totalJobs}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-medium">{queueStats.pendingJobs}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing</span>
                <span className="font-medium">{queueStats.processingJobs}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed</span>
                <span className="font-medium text-green-600">
                  {queueStats.completedJobs}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Failed</span>
                <span className="font-medium text-red-600">{queueStats.failedJobs}</span>
              </div>
              {queueStats.averageProcessingTime > 0 && (
                <div className="flex justify-between pt-2 border-t">
                  <span>Avg. Time</span>
                  <span className="font-medium">
                    {formatDuration(queueStats.averageProcessingTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
