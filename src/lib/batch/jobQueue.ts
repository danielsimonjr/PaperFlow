/**
 * Batch Job Queue System
 * Priority queue for batch jobs with persistence, status tracking, and pause/resume capabilities.
 */

import type {
  BatchJob,
  BatchFile,
  JobStatus,
  JobPriority,
  BatchJobProgress,
  BatchJobOptions,
  BatchOperationType,
} from '@/types/batch';

/**
 * Generate unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique file ID
 */
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Priority weights for job ordering
 */
const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  critical: 1000,
  high: 100,
  normal: 10,
  low: 1,
};

/**
 * Create initial progress for a job
 */
export function createInitialProgress(totalFiles: number): BatchJobProgress {
  return {
    totalFiles,
    completedFiles: 0,
    failedFiles: 0,
    currentFileProgress: 0,
    overallProgress: 0,
  };
}

/**
 * Create a new batch file entry
 */
export function createBatchFile(
  name: string,
  path: string,
  size: number,
  pageCount?: number
): BatchFile {
  return {
    id: generateFileId(),
    name,
    path,
    size,
    pageCount,
    status: 'pending',
    progress: 0,
    retryCount: 0,
  };
}

/**
 * Create a new batch job
 */
export function createBatchJob(
  type: BatchOperationType,
  name: string,
  files: BatchFile[],
  options: BatchJobOptions,
  priority: JobPriority = 'normal',
  templateId?: string
): BatchJob {
  return {
    id: generateJobId(),
    type,
    name,
    files,
    options,
    status: 'pending',
    priority,
    progress: createInitialProgress(files.length),
    createdAt: Date.now(),
    templateId,
  };
}

/**
 * Update job status
 */
export function updateJobStatus(
  job: BatchJob,
  status: JobStatus,
  error?: string
): BatchJob {
  const now = Date.now();
  return {
    ...job,
    status,
    error,
    startedAt: status === 'processing' && !job.startedAt ? now : job.startedAt,
    completedAt: ['completed', 'failed', 'cancelled'].includes(status) ? now : job.completedAt,
  };
}

/**
 * Update file status within a job
 */
export function updateFileStatus(
  job: BatchJob,
  fileId: string,
  updates: Partial<BatchFile>
): BatchJob {
  return {
    ...job,
    files: job.files.map((file) =>
      file.id === fileId ? { ...file, ...updates } : file
    ),
  };
}

/**
 * Update job progress
 */
export function updateJobProgress(
  job: BatchJob,
  progressUpdates: Partial<BatchJobProgress>
): BatchJob {
  const progress = { ...job.progress, ...progressUpdates };

  // Calculate overall progress
  if (progress.totalFiles > 0) {
    const fileProgress =
      (progress.completedFiles + progress.failedFiles) / progress.totalFiles;
    const currentProgress = progress.currentFileProgress / 100 / progress.totalFiles;
    progress.overallProgress = Math.min(
      100,
      Math.round((fileProgress + currentProgress) * 100)
    );
  }

  // Calculate estimated time remaining
  if (progress.startTime && progress.completedFiles > 0) {
    const elapsed = Date.now() - progress.startTime;
    const avgTimePerFile = elapsed / progress.completedFiles;
    const remainingFiles =
      progress.totalFiles - progress.completedFiles - progress.failedFiles;
    progress.estimatedTimeRemaining = avgTimePerFile * remainingFiles;
    progress.processingSpeed = progress.completedFiles / (elapsed / 1000);
  }

  return { ...job, progress };
}

/**
 * Get next file to process in a job
 */
export function getNextPendingFile(job: BatchJob): BatchFile | undefined {
  return job.files.find((file) => file.status === 'pending');
}

/**
 * Check if job is complete
 */
export function isJobComplete(job: BatchJob): boolean {
  return job.files.every(
    (file) =>
      file.status === 'completed' ||
      file.status === 'failed' ||
      file.status === 'cancelled'
  );
}

/**
 * Check if job has any failures
 */
export function hasJobFailures(job: BatchJob): boolean {
  return job.files.some((file) => file.status === 'failed');
}

/**
 * Get job statistics
 */
export function getJobStatistics(job: BatchJob): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
} {
  return {
    total: job.files.length,
    pending: job.files.filter((f) => f.status === 'pending').length,
    processing: job.files.filter((f) => f.status === 'processing').length,
    completed: job.files.filter((f) => f.status === 'completed').length,
    failed: job.files.filter((f) => f.status === 'failed').length,
    cancelled: job.files.filter((f) => f.status === 'cancelled').length,
  };
}

/**
 * Batch Job Queue class
 */
export class JobQueue {
  private jobs: Map<string, BatchJob> = new Map();
  private priorityOrder: string[] = [];

  /**
   * Add a job to the queue
   */
  addJob(job: BatchJob): void {
    this.jobs.set(job.id, { ...job, status: 'queued' });
    this.reorderQueue();
  }

  /**
   * Remove a job from the queue
   */
  removeJob(jobId: string): boolean {
    const removed = this.jobs.delete(jobId);
    if (removed) {
      this.priorityOrder = this.priorityOrder.filter((id) => id !== jobId);
    }
    return removed;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update a job
   */
  updateJob(job: BatchJob): void {
    if (this.jobs.has(job.id)) {
      this.jobs.set(job.id, job);
    }
  }

  /**
   * Get next job to process
   */
  getNextJob(): BatchJob | undefined {
    for (const jobId of this.priorityOrder) {
      const job = this.jobs.get(jobId);
      if (job && (job.status === 'queued' || job.status === 'pending')) {
        return job;
      }
    }
    return undefined;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): BatchJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.jobs.size;
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'queued' || job.status === 'pending'
    ).length;
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs(): number {
    let count = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'cancelled') {
        this.jobs.delete(jobId);
        count++;
      }
    }
    this.priorityOrder = this.priorityOrder.filter((id) => this.jobs.has(id));
    return count;
  }

  /**
   * Clear all jobs
   */
  clearAllJobs(): void {
    this.jobs.clear();
    this.priorityOrder = [];
  }

  /**
   * Reorder queue based on priority and creation time
   */
  private reorderQueue(): void {
    this.priorityOrder = Array.from(this.jobs.keys()).sort((a, b) => {
      const jobA = this.jobs.get(a)!;
      const jobB = this.jobs.get(b)!;

      // First sort by priority
      const priorityDiff =
        PRIORITY_WEIGHTS[jobB.priority] - PRIORITY_WEIGHTS[jobA.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time (older first)
      return jobA.createdAt - jobB.createdAt;
    });
  }

  /**
   * Change job priority
   */
  changePriority(jobId: string, priority: JobPriority): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    this.jobs.set(jobId, { ...job, priority });
    this.reorderQueue();
    return true;
  }

  /**
   * Pause a job
   */
  pauseJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') return false;

    this.jobs.set(jobId, { ...job, status: 'paused' });
    return true;
  }

  /**
   * Resume a paused job
   */
  resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') return false;

    this.jobs.set(jobId, { ...job, status: 'queued' });
    this.reorderQueue();
    return true;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (['completed', 'cancelled'].includes(job.status)) return false;

    const cancelledFiles = job.files.map((file) =>
      file.status === 'pending' || file.status === 'queued'
        ? { ...file, status: 'cancelled' as JobStatus }
        : file
    );

    this.jobs.set(jobId, {
      ...job,
      status: 'cancelled',
      files: cancelledFiles,
      completedAt: Date.now(),
    });

    return true;
  }

  /**
   * Retry failed files in a job
   */
  retryFailedFiles(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const hasFailedFiles = job.files.some((f) => f.status === 'failed');
    if (!hasFailedFiles) return false;

    const retriedFiles = job.files.map((file) =>
      file.status === 'failed' && file.retryCount < job.options.maxRetries
        ? {
            ...file,
            status: 'pending' as JobStatus,
            error: undefined,
            retryCount: file.retryCount + 1,
          }
        : file
    );

    const retriedCount = retriedFiles.filter(
      (f, i) => f.status !== job.files[i]?.status
    ).length;

    if (retriedCount > 0) {
      this.jobs.set(jobId, {
        ...job,
        files: retriedFiles,
        status: 'queued',
        progress: {
          ...job.progress,
          failedFiles: job.progress.failedFiles - retriedCount,
        },
      });
      this.reorderQueue();
      return true;
    }

    return false;
  }

  /**
   * Export queue state for persistence
   */
  exportState(): { jobs: BatchJob[]; priorityOrder: string[] } {
    return {
      jobs: Array.from(this.jobs.values()),
      priorityOrder: this.priorityOrder,
    };
  }

  /**
   * Import queue state from persistence
   */
  importState(state: { jobs: BatchJob[]; priorityOrder: string[] }): void {
    this.jobs.clear();
    for (const job of state.jobs) {
      this.jobs.set(job.id, job);
    }
    this.priorityOrder = state.priorityOrder.filter((id) => this.jobs.has(id));
  }
}

/**
 * Create a new job queue
 */
export function createJobQueue(): JobQueue {
  return new JobQueue();
}
