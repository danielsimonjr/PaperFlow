/**
 * Print Queue Manager
 *
 * Manages print jobs with status tracking, cancellation,
 * and queue management.
 */

import type { PrintSettings, PrintJob, PrintJobStatus } from '@stores/printStore';

/**
 * Queue event types
 */
export type PrintQueueEvent =
  | 'jobAdded'
  | 'jobStarted'
  | 'jobProgress'
  | 'jobCompleted'
  | 'jobCancelled'
  | 'jobError'
  | 'queueCleared';

/**
 * Queue event callback
 */
export type PrintQueueCallback = (
  event: PrintQueueEvent,
  job: PrintJob | null
) => void;

/**
 * Print job request
 */
export interface PrintJobRequest {
  documentName: string;
  documentPath?: string;
  printerName: string;
  totalPages: number;
  settings: PrintSettings;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Queue statistics
 */
export interface QueueStatistics {
  totalJobs: number;
  pendingJobs: number;
  printingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalPagesPrinted: number;
  averageJobTime: number;
}

/**
 * Print queue manager
 */
export class PrintQueue {
  private jobs: Map<string, PrintJob> = new Map();
  private listeners: Map<string, PrintQueueCallback[]> = new Map();
  private isProcessing = false;
  private jobIdCounter = 0;
  private completedJobTimes: number[] = [];

  /**
   * Add a job to the queue
   */
  addJob(request: PrintJobRequest): string {
    const id = `print-job-${++this.jobIdCounter}-${Date.now()}`;

    const job: PrintJob = {
      id,
      documentName: request.documentName,
      printerName: request.printerName,
      status: 'pending',
      createdAt: Date.now(),
      pagesPrinted: 0,
      totalPages: request.totalPages,
      settings: request.settings,
    };

    this.jobs.set(id, job);
    this.emit('jobAdded', job);

    // Start processing if not already
    if (!this.isProcessing) {
      this.processNext();
    }

    return id;
  }

  /**
   * Get a job by ID
   */
  getJob(id: string): PrintJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): PrintJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: PrintJobStatus): PrintJob[] {
    return this.getAllJobs().filter((job) => job.status === status);
  }

  /**
   * Get pending jobs
   */
  getPendingJobs(): PrintJob[] {
    return this.getJobsByStatus('pending');
  }

  /**
   * Get active job (currently printing)
   */
  getActiveJob(): PrintJob | undefined {
    return this.getJobsByStatus('printing')[0];
  }

  /**
   * Update job progress
   */
  updateProgress(id: string, pagesPrinted: number): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.pagesPrinted = pagesPrinted;
    this.emit('jobProgress', job);

    return true;
  }

  /**
   * Mark job as started
   */
  startJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status !== 'pending') return false;

    job.status = 'printing';
    job.startedAt = Date.now();
    this.emit('jobStarted', job);

    return true;
  }

  /**
   * Mark job as completed
   */
  completeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status !== 'printing') return false;

    job.status = 'completed';
    job.completedAt = Date.now();
    job.pagesPrinted = job.totalPages;

    // Track completion time
    if (job.startedAt) {
      this.completedJobTimes.push(job.completedAt - job.startedAt);
      // Keep only last 50 times
      if (this.completedJobTimes.length > 50) {
        this.completedJobTimes.shift();
      }
    }

    this.emit('jobCompleted', job);
    this.processNext();

    return true;
  }

  /**
   * Cancel a job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'cancelled') {
      return false;
    }

    // Check if this was the active job before changing status
    const wasActive = job.status === 'printing';

    job.status = 'cancelled';
    this.emit('jobCancelled', job);

    // If this was the active job, process next
    if (wasActive) {
      this.processNext();
    }

    return true;
  }

  /**
   * Mark job as failed
   */
  failJob(id: string, error: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.status = 'error';
    job.error = error;
    this.emit('jobError', job);
    this.processNext();

    return true;
  }

  /**
   * Remove a job from the queue
   */
  removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    // Can't remove a job that's printing
    if (job.status === 'printing') {
      return false;
    }

    return this.jobs.delete(id);
  }

  /**
   * Clear completed and cancelled jobs
   */
  clearFinishedJobs(): void {
    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' || job.status === 'cancelled' || job.status === 'error') {
        this.jobs.delete(id);
      }
    }
    this.emit('queueCleared', null);
  }

  /**
   * Clear all jobs (including pending)
   */
  clearAllJobs(): void {
    // Cancel any active job
    const activeJob = this.getActiveJob();
    if (activeJob) {
      this.cancelJob(activeJob.id);
    }

    this.jobs.clear();
    this.emit('queueCleared', null);
  }

  /**
   * Get queue statistics
   */
  getStatistics(): QueueStatistics {
    const jobs = this.getAllJobs();

    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
    const printingJobs = jobs.filter((j) => j.status === 'printing').length;
    const completedJobs = jobs.filter((j) => j.status === 'completed').length;
    const failedJobs = jobs.filter((j) => j.status === 'error').length;

    const totalPagesPrinted = jobs
      .filter((j) => j.status === 'completed')
      .reduce((sum, j) => sum + j.totalPages, 0);

    const averageJobTime =
      this.completedJobTimes.length > 0
        ? this.completedJobTimes.reduce((a, b) => a + b, 0) / this.completedJobTimes.length
        : 0;

    return {
      totalJobs,
      pendingJobs,
      printingJobs,
      completedJobs,
      failedJobs,
      totalPagesPrinted,
      averageJobTime,
    };
  }

  /**
   * Estimate wait time for a new job
   */
  estimateWaitTime(): number {
    const pendingJobs = this.getPendingJobs().length;
    const stats = this.getStatistics();

    if (stats.averageJobTime === 0) {
      // Assume 5 seconds per page if no history
      const totalPendingPages = this.getPendingJobs().reduce(
        (sum, j) => sum + j.totalPages,
        0
      );
      return totalPendingPages * 5000;
    }

    return pendingJobs * stats.averageJobTime;
  }

  /**
   * Subscribe to events
   */
  on(event: PrintQueueEvent, callback: PrintQueueCallback): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Unsubscribe from events
   */
  off(event: PrintQueueEvent, callback: PrintQueueCallback): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.listeners.set(event, callbacks);
    }
  }

  /**
   * Process the next job in queue
   */
  private processNext(): void {
    const pendingJobs = this.getPendingJobs();
    if (pendingJobs.length === 0) {
      this.isProcessing = false;
      return;
    }

    // Check if there's already an active job
    const activeJob = this.getActiveJob();
    if (activeJob) {
      return;
    }

    this.isProcessing = true;

    // Get next job (first pending)
    const nextJob = pendingJobs[0];
    if (nextJob) {
      this.startJob(nextJob.id);
    }

    // Note: Actual printing is handled by the caller
    // They should call updateProgress, completeJob, or failJob
  }

  /**
   * Emit event
   */
  private emit(event: PrintQueueEvent, job: PrintJob | null): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback(event, job);
      } catch (error) {
        console.error('Print queue callback error:', error);
      }
    }
  }
}

// Export singleton instance
export const printQueue = new PrintQueue();

export default PrintQueue;
