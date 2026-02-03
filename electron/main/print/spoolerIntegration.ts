/**
 * Print Spooler Integration
 *
 * Integrates with the OS print spooler for job management,
 * status tracking, and error handling.
 */

import { WebContents } from 'electron';
import type {
  PrintOptions,
  PrintJobStatus,
  PrintQueueEntry,
} from './types';

/**
 * Spooler event types
 */
export type SpoolerEvent =
  | 'jobQueued'
  | 'jobStarted'
  | 'jobProgress'
  | 'jobCompleted'
  | 'jobFailed'
  | 'jobCancelled'
  | 'spoolerError';

/**
 * Spooler event callback
 */
export type SpoolerCallback = (
  event: SpoolerEvent,
  data: SpoolerEventData
) => void;

/**
 * Spooler event data
 */
export interface SpoolerEventData {
  jobId: string;
  status?: PrintJobStatus;
  progress?: number;
  error?: string;
  printerName?: string;
}

/**
 * Print spooler integration
 */
export class SpoolerIntegration {
  private static jobs: Map<string, PrintQueueEntry> = new Map();
  private static listeners: Map<SpoolerEvent, SpoolerCallback[]> = new Map();
  private static jobIdCounter = 0;

  /**
   * Submit a print job to the spooler
   */
  static async submitJob(
    webContents: WebContents,
    documentName: string,
    options: PrintOptions
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    const jobId = `spooler-${++this.jobIdCounter}-${Date.now()}`;

    // Create queue entry
    const entry: PrintQueueEntry = {
      id: jobId,
      documentPath: '',
      documentName,
      printerName: options.deviceName || 'default',
      options,
      status: 'pending',
      createdAt: Date.now(),
      pagesPrinted: 0,
      totalPages: 0, // Will be updated
    };

    this.jobs.set(jobId, entry);
    this.emit('jobQueued', { jobId, status: 'pending', printerName: entry.printerName });

    return new Promise((resolve) => {
      // Update status to printing
      entry.status = 'printing';
      entry.startedAt = Date.now();
      this.emit('jobStarted', { jobId, status: 'printing' });

      webContents.print(
        {
          silent: options.silent ?? false,
          printBackground: options.printBackground ?? true,
          deviceName: options.deviceName,
          color: options.color ?? true,
          margins: options.margins
            ? { marginType: options.margins.marginType ?? 'default' }
            : undefined,
          landscape: options.landscape ?? false,
          scaleFactor: options.scaleFactor ?? 100,
          pagesPerSheet: options.pagesPerSheet ?? 1,
          collate: options.collate ?? true,
          copies: options.copies ?? 1,
          pageRanges: options.pageRanges,
          duplexMode: options.duplexMode,
          dpi: options.dpi,
          header: options.header,
          footer: options.footer,
        },
        (success, failureReason) => {
          if (success) {
            entry.status = 'completed';
            entry.completedAt = Date.now();
            this.emit('jobCompleted', { jobId, status: 'completed' });
            resolve({ success: true, jobId });
          } else {
            entry.status = 'error';
            entry.error = failureReason || 'Print failed';
            this.emit('jobFailed', { jobId, status: 'error', error: entry.error });
            resolve({ success: false, jobId, error: entry.error });
          }
        }
      );
    });
  }

  /**
   * Cancel a print job
   */
  static cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'cancelled') {
      return false;
    }

    // Note: Electron doesn't provide direct job cancellation
    // We can only mark it as cancelled locally
    job.status = 'cancelled';
    this.emit('jobCancelled', { jobId, status: 'cancelled' });

    return true;
  }

  /**
   * Get job status
   */
  static getJobStatus(jobId: string): PrintQueueEntry | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  static getAllJobs(): PrintQueueEntry[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get pending jobs
   */
  static getPendingJobs(): PrintQueueEntry[] {
    return this.getAllJobs().filter((j) => j.status === 'pending');
  }

  /**
   * Get active jobs (currently printing)
   */
  static getActiveJobs(): PrintQueueEntry[] {
    return this.getAllJobs().filter((j) => j.status === 'printing');
  }

  /**
   * Clear completed jobs
   */
  static clearCompletedJobs(): void {
    for (const [id, job] of this.jobs) {
      if (
        job.status === 'completed' ||
        job.status === 'cancelled' ||
        job.status === 'error'
      ) {
        this.jobs.delete(id);
      }
    }
  }

  /**
   * Subscribe to spooler events
   */
  static on(event: SpoolerEvent, callback: SpoolerCallback): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Unsubscribe from spooler events
   */
  static off(event: SpoolerEvent, callback: SpoolerCallback): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.listeners.set(event, callbacks);
    }
  }

  /**
   * Emit spooler event
   */
  private static emit(event: SpoolerEvent, data: SpoolerEventData): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Spooler callback error:', error);
      }
    }
  }

  /**
   * Get spooler statistics
   */
  static getStatistics(): {
    totalJobs: number;
    pendingJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    const jobs = this.getAllJobs();
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === 'pending').length,
      activeJobs: jobs.filter((j) => j.status === 'printing').length,
      completedJobs: jobs.filter((j) => j.status === 'completed').length,
      failedJobs: jobs.filter((j) => j.status === 'error').length,
    };
  }

  /**
   * Handle spooler error
   */
  static handleSpoolerError(error: Error): void {
    this.emit('spoolerError', {
      jobId: '',
      error: error.message,
    });
  }
}

export default SpoolerIntegration;
