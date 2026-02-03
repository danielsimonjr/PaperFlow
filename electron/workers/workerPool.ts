/**
 * Worker Pool Manager
 * Manages Node.js worker threads for parallel PDF processing.
 */

import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Worker task
 */
export interface WorkerTask {
  id: string;
  type: string;
  payload: unknown;
  priority: number;
  timeout?: number;
}

/**
 * Worker task result
 */
export interface WorkerTaskResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  processingTime: number;
}

/**
 * Pool configuration
 */
export interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  idleTimeout: number; // ms before idle worker is terminated
  taskTimeout: number; // ms before task is considered failed
  workerScript: string;
}

/**
 * Worker state
 */
interface ManagedWorker {
  id: string;
  worker: Worker;
  busy: boolean;
  currentTask?: WorkerTask;
  taskStartTime?: number;
  createdAt: number;
  tasksCompleted: number;
  lastActivity: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: WorkerPoolConfig = {
  minWorkers: 1,
  maxWorkers: Math.max(1, cpus().length - 1),
  idleTimeout: 30000, // 30 seconds
  taskTimeout: 300000, // 5 minutes
  workerScript: path.join(__dirname, 'pdfWorker.js'),
};

/**
 * Worker Pool class
 */
export class WorkerPool extends EventEmitter {
  private config: WorkerPoolConfig;
  private workers: Map<string, ManagedWorker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private taskCallbacks: Map<string, {
    resolve: (result: WorkerTaskResult) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private idleCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;
  private taskCounter = 0;

  constructor(config: Partial<WorkerPoolConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the pool with minimum workers
   */
  async initialize(): Promise<void> {
    // Spawn minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      await this.spawnWorker();
    }

    // Start idle worker cleanup
    this.idleCheckInterval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, this.config.idleTimeout / 2);
  }

  /**
   * Spawn a new worker
   */
  private async spawnWorker(): Promise<ManagedWorker> {
    const workerId = `worker_${Date.now()}_${this.workers.size}`;

    const worker = new Worker(this.config.workerScript, {
      workerData: { workerId },
    });

    const managedWorker: ManagedWorker = {
      id: workerId,
      worker,
      busy: false,
      createdAt: Date.now(),
      tasksCompleted: 0,
      lastActivity: Date.now(),
    };

    // Handle worker messages
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });

    // Handle worker errors
    worker.on('error', (error) => {
      this.handleWorkerError(workerId, error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      this.handleWorkerExit(workerId, code);
    });

    this.workers.set(workerId, managedWorker);
    this.emit('workerSpawned', { workerId });

    return managedWorker;
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerId: string, message: {
    type: string;
    taskId?: string;
    result?: unknown;
    error?: string;
    progress?: number;
  }): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.lastActivity = Date.now();

    switch (message.type) {
      case 'result':
        if (message.taskId) {
          const callback = this.taskCallbacks.get(message.taskId);
          if (callback) {
            const processingTime = worker.taskStartTime
              ? Date.now() - worker.taskStartTime
              : 0;

            callback.resolve({
              taskId: message.taskId,
              success: !message.error,
              result: message.result,
              error: message.error,
              processingTime,
            });

            this.taskCallbacks.delete(message.taskId);
          }

          // Mark worker as available
          worker.busy = false;
          worker.currentTask = undefined;
          worker.taskStartTime = undefined;
          worker.tasksCompleted++;

          // Process next task
          this.processNextTask();
        }
        break;

      case 'progress':
        if (message.taskId) {
          this.emit('taskProgress', {
            taskId: message.taskId,
            progress: message.progress,
          });
        }
        break;
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: string, error: Error): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    console.error(`Worker ${workerId} error:`, error);

    // Fail current task
    if (worker.currentTask) {
      const callback = this.taskCallbacks.get(worker.currentTask.id);
      if (callback) {
        callback.reject(error);
        this.taskCallbacks.delete(worker.currentTask.id);
      }
    }

    // Remove worker
    this.workers.delete(workerId);

    // Spawn replacement if below minimum
    if (!this.isShuttingDown && this.workers.size < this.config.minWorkers) {
      this.spawnWorker().catch(console.error);
    }

    this.emit('workerError', { workerId, error: error.message });
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: string, code: number): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    // Fail current task if any
    if (worker.currentTask) {
      const callback = this.taskCallbacks.get(worker.currentTask.id);
      if (callback) {
        callback.reject(new Error(`Worker exited with code ${code}`));
        this.taskCallbacks.delete(worker.currentTask.id);
      }
    }

    this.workers.delete(workerId);

    // Spawn replacement if below minimum and not shutting down
    if (!this.isShuttingDown && this.workers.size < this.config.minWorkers) {
      this.spawnWorker().catch(console.error);
    }

    this.emit('workerExited', { workerId, code });
  }

  /**
   * Submit a task to the pool
   */
  submitTask(task: Omit<WorkerTask, 'id'>): Promise<WorkerTaskResult> {
    return new Promise((resolve, reject) => {
      if (this.isShuttingDown) {
        reject(new Error('Pool is shutting down'));
        return;
      }

      const taskId = `task_${Date.now()}_${++this.taskCounter}`;
      const fullTask: WorkerTask = {
        ...task,
        id: taskId,
      };

      this.taskCallbacks.set(taskId, { resolve, reject });

      // Add to queue with priority sorting
      this.taskQueue.push(fullTask);
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      // Set timeout
      const timeout = task.timeout || this.config.taskTimeout;
      setTimeout(() => {
        const callback = this.taskCallbacks.get(taskId);
        if (callback) {
          callback.reject(new Error('Task timeout'));
          this.taskCallbacks.delete(taskId);

          // Remove from queue if still there
          const queueIndex = this.taskQueue.findIndex((t) => t.id === taskId);
          if (queueIndex !== -1) {
            this.taskQueue.splice(queueIndex, 1);
          }
        }
      }, timeout);

      // Try to process immediately
      this.processNextTask();
    });
  }

  /**
   * Process next task from queue
   */
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Find available worker
    let availableWorker: ManagedWorker | undefined;
    for (const worker of this.workers.values()) {
      if (!worker.busy) {
        availableWorker = worker;
        break;
      }
    }

    // Spawn new worker if needed and possible
    if (!availableWorker && this.workers.size < this.config.maxWorkers) {
      try {
        availableWorker = await this.spawnWorker();
      } catch (error) {
        console.error('Failed to spawn worker:', error);
      }
    }

    if (!availableWorker) return;

    // Get next task
    const task = this.taskQueue.shift();
    if (!task) return;

    // Assign task to worker
    availableWorker.busy = true;
    availableWorker.currentTask = task;
    availableWorker.taskStartTime = Date.now();

    // Send task to worker
    availableWorker.worker.postMessage({
      type: 'task',
      task,
    });

    this.emit('taskStarted', { taskId: task.id, workerId: availableWorker.id });
  }

  /**
   * Clean up idle workers
   */
  private cleanupIdleWorkers(): void {
    if (this.isShuttingDown) return;

    const now = Date.now();

    for (const [workerId, worker] of this.workers.entries()) {
      if (
        !worker.busy &&
        this.workers.size > this.config.minWorkers &&
        now - worker.lastActivity > this.config.idleTimeout
      ) {
        worker.worker.terminate();
        this.workers.delete(workerId);
        this.emit('workerTerminated', { workerId, reason: 'idle' });
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queuedTasks: number;
    totalTasksCompleted: number;
  } {
    let busyWorkers = 0;
    let totalTasksCompleted = 0;

    for (const worker of this.workers.values()) {
      if (worker.busy) busyWorkers++;
      totalTasksCompleted += worker.tasksCompleted;
    }

    return {
      totalWorkers: this.workers.size,
      busyWorkers,
      idleWorkers: this.workers.size - busyWorkers,
      queuedTasks: this.taskQueue.length,
      totalTasksCompleted,
    };
  }

  /**
   * Shutdown the pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Clear interval
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }

    // Cancel queued tasks
    for (const task of this.taskQueue) {
      const callback = this.taskCallbacks.get(task.id);
      if (callback) {
        callback.reject(new Error('Pool shutdown'));
        this.taskCallbacks.delete(task.id);
      }
    }
    this.taskQueue = [];

    // Terminate all workers
    const terminationPromises: Promise<number>[] = [];
    for (const worker of this.workers.values()) {
      terminationPromises.push(worker.worker.terminate());
    }

    await Promise.all(terminationPromises);
    this.workers.clear();

    this.emit('shutdown');
  }
}

/**
 * Create a worker pool
 */
export function createWorkerPool(config?: Partial<WorkerPoolConfig>): WorkerPool {
  return new WorkerPool(config);
}
