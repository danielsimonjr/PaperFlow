/**
 * Worker Manager
 * High-level manager for coordinating batch processing with worker pools.
 */

import { EventEmitter } from 'events';
import { WorkerPool, createWorkerPool } from './workerPool';
import type { WorkerTask, WorkerPoolConfig } from './workerPool';

/**
 * Batch processing task
 */
export interface BatchProcessingTask {
  jobId: string;
  fileId: string;
  operationType: string;
  inputPath: string;
  outputPath: string;
  options: unknown;
  priority: number;
}

/**
 * Task progress update
 */
export interface TaskProgressUpdate {
  jobId: string;
  fileId: string;
  progress: number;
  message?: string;
}

/**
 * Task completion result
 */
export interface TaskCompletionResult {
  jobId: string;
  fileId: string;
  success: boolean;
  outputPath?: string;
  outputSize?: number;
  processingTime: number;
  error?: string;
}

/**
 * Manager configuration
 */
export interface WorkerManagerConfig {
  pool: Partial<WorkerPoolConfig>;
  maxConcurrentJobs: number;
  enableResourceMonitoring: boolean;
}

/**
 * Default manager configuration
 */
const DEFAULT_MANAGER_CONFIG: WorkerManagerConfig = {
  pool: {},
  maxConcurrentJobs: 3,
  enableResourceMonitoring: true,
};

/**
 * Worker Manager class
 */
export class WorkerManager extends EventEmitter {
  private config: WorkerManagerConfig;
  private pool: WorkerPool | null = null;
  private activeJobs: Map<string, Set<string>> = new Map(); // jobId -> fileIds
  private isInitialized = false;
  private resourceMonitorInterval?: NodeJS.Timeout;

  constructor(config: Partial<WorkerManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_MANAGER_CONFIG, ...config };
  }

  /**
   * Initialize the manager and worker pool
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.pool = createWorkerPool(this.config.pool);

    // Forward pool events
    this.pool.on('workerSpawned', (data) => this.emit('workerSpawned', data));
    this.pool.on('workerError', (data) => this.emit('workerError', data));
    this.pool.on('workerExited', (data) => this.emit('workerExited', data));
    this.pool.on('workerTerminated', (data) => this.emit('workerTerminated', data));
    this.pool.on('taskStarted', (data) => this.emit('taskStarted', data));
    this.pool.on('taskProgress', (data) => this.handleTaskProgress(data));

    await this.pool.initialize();

    // Start resource monitoring
    if (this.config.enableResourceMonitoring) {
      this.startResourceMonitoring();
    }

    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Handle task progress from pool
   */
  private handleTaskProgress(data: { taskId: string; progress: number }): void {
    // Parse taskId to extract jobId and fileId
    const parts = data.taskId.split('_');
    if (parts.length >= 4) {
      // taskId format: task_timestamp_counter
      // We need to look up the original mapping
      this.emit('taskProgress', {
        taskId: data.taskId,
        progress: data.progress,
      });
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = setInterval(() => {
      const stats = this.getStats();
      const memUsage = process.memoryUsage();

      this.emit('resourceUpdate', {
        workers: stats,
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
        },
      });
    }, 5000);
  }

  /**
   * Submit a batch processing task
   */
  async submitTask(task: BatchProcessingTask): Promise<TaskCompletionResult> {
    if (!this.pool) {
      throw new Error('Worker manager not initialized');
    }

    // Track active task
    if (!this.activeJobs.has(task.jobId)) {
      this.activeJobs.set(task.jobId, new Set());
    }
    this.activeJobs.get(task.jobId)!.add(task.fileId);

    try {
      const workerTask: Omit<WorkerTask, 'id'> = {
        type: task.operationType,
        payload: {
          inputPath: task.inputPath,
          outputPath: task.outputPath,
          options: task.options,
        },
        priority: task.priority,
      };

      const result = await this.pool.submitTask(workerTask);

      // Remove from active tracking
      this.activeJobs.get(task.jobId)?.delete(task.fileId);
      if (this.activeJobs.get(task.jobId)?.size === 0) {
        this.activeJobs.delete(task.jobId);
      }

      const completionResult: TaskCompletionResult = {
        jobId: task.jobId,
        fileId: task.fileId,
        success: result.success,
        outputPath: result.success ? task.outputPath : undefined,
        outputSize: result.result ? (result.result as { size?: number }).size : undefined,
        processingTime: result.processingTime,
        error: result.error,
      };

      this.emit('taskCompleted', completionResult);
      return completionResult;
    } catch (error) {
      // Remove from active tracking
      this.activeJobs.get(task.jobId)?.delete(task.fileId);
      if (this.activeJobs.get(task.jobId)?.size === 0) {
        this.activeJobs.delete(task.jobId);
      }

      const errorResult: TaskCompletionResult = {
        jobId: task.jobId,
        fileId: task.fileId,
        success: false,
        processingTime: 0,
        error: error instanceof Error ? error.message : String(error),
      };

      this.emit('taskFailed', errorResult);
      throw error;
    }
  }

  /**
   * Submit multiple tasks for a job
   */
  async submitBatch(
    tasks: BatchProcessingTask[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<TaskCompletionResult[]> {
    const results: TaskCompletionResult[] = [];
    let completed = 0;

    // Process tasks with controlled concurrency
    const promises: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = this.submitTask(task)
        .then((result) => {
          results.push(result);
          completed++;
          onProgress?.(completed, tasks.length);
        })
        .catch((error) => {
          results.push({
            jobId: task.jobId,
            fileId: task.fileId,
            success: false,
            processingTime: 0,
            error: error instanceof Error ? error.message : String(error),
          });
          completed++;
          onProgress?.(completed, tasks.length);
        });

      promises.push(promise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * Cancel tasks for a job
   */
  cancelJob(jobId: string): void {
    const fileIds = this.activeJobs.get(jobId);
    if (fileIds) {
      // Note: actual task cancellation requires worker cooperation
      // For now, we just remove tracking
      this.activeJobs.delete(jobId);
      this.emit('jobCancelled', { jobId, cancelledFiles: fileIds.size });
    }
  }

  /**
   * Get manager statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queuedTasks: number;
    totalTasksCompleted: number;
    activeJobs: number;
    activeTasks: number;
  } {
    const poolStats = this.pool?.getStats() || {
      totalWorkers: 0,
      busyWorkers: 0,
      idleWorkers: 0,
      queuedTasks: 0,
      totalTasksCompleted: 0,
    };

    let activeTasks = 0;
    for (const files of this.activeJobs.values()) {
      activeTasks += files.size;
    }

    return {
      ...poolStats,
      activeJobs: this.activeJobs.size,
      activeTasks,
    };
  }

  /**
   * Check if manager has capacity for more tasks
   */
  hasCapacity(): boolean {
    if (!this.pool) return false;

    const stats = this.pool.getStats();
    return (
      stats.idleWorkers > 0 || stats.totalWorkers < this.config.pool.maxWorkers!
    );
  }

  /**
   * Shutdown the manager
   */
  async shutdown(): Promise<void> {
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
    }

    if (this.pool) {
      await this.pool.shutdown();
    }

    this.activeJobs.clear();
    this.isInitialized = false;
    this.emit('shutdown');
  }
}

/**
 * Create a worker manager instance
 */
export function createWorkerManager(
  config?: Partial<WorkerManagerConfig>
): WorkerManager {
  return new WorkerManager(config);
}

// Singleton instance
let workerManagerInstance: WorkerManager | null = null;

/**
 * Get or create singleton worker manager
 */
export function getWorkerManager(): WorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = createWorkerManager();
  }
  return workerManagerInstance;
}

/**
 * Initialize the global worker manager
 */
export async function initializeWorkerManager(
  config?: Partial<WorkerManagerConfig>
): Promise<WorkerManager> {
  if (!workerManagerInstance) {
    workerManagerInstance = createWorkerManager(config);
  }
  await workerManagerInstance.initialize();
  return workerManagerInstance;
}

/**
 * Shutdown the global worker manager
 */
export async function shutdownWorkerManager(): Promise<void> {
  if (workerManagerInstance) {
    await workerManagerInstance.shutdown();
    workerManagerInstance = null;
  }
}
