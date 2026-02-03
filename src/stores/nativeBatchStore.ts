/**
 * Native Batch Processing Store
 * Manages state for native batch operations with worker thread support.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BatchJob,
  BatchJobOptions,
  BatchOperationType,
  JobPriority,
  JobStatus,
  BatchJobProgress,
  BatchTemplate,
  ResourceUsage,
  QueueStatistics,
} from '@/types/batch';
import {
  createBatchJob,
  createBatchFile,
  getJobStatistics,
} from '@/lib/batch/jobQueue';

/**
 * Store state interface
 */
interface NativeBatchState {
  // Queue
  jobs: BatchJob[];
  currentJobId: string | null;

  // Processing state
  isProcessing: boolean;
  isPaused: boolean;

  // Templates
  templates: BatchTemplate[];

  // Statistics
  queueStats: QueueStatistics;
  resourceUsage: ResourceUsage | null;

  // Error state
  lastError: string | null;

  // Actions - Job Management
  addJob: (
    type: BatchOperationType,
    name: string,
    files: Array<{ name: string; path: string; size: number; pageCount?: number }>,
    options: BatchJobOptions,
    priority?: JobPriority,
    templateId?: string
  ) => string;
  removeJob: (jobId: string) => void;
  clearCompletedJobs: () => number;
  clearAllJobs: () => void;
  getJob: (jobId: string) => BatchJob | undefined;

  // Actions - Job Control
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  changePriority: (jobId: string, priority: JobPriority) => void;

  // Actions - Progress Updates
  updateJobProgress: (jobId: string, progress: Partial<BatchJobProgress>) => void;
  updateFileStatus: (
    jobId: string,
    fileId: string,
    status: JobStatus,
    error?: string,
    outputPath?: string
  ) => void;
  completeJob: (jobId: string, success: boolean, error?: string) => void;

  // Actions - Templates
  addTemplate: (template: BatchTemplate) => void;
  removeTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string, jobId: string) => void;

  // Actions - Resource Management
  updateResourceUsage: (usage: ResourceUsage) => void;
  updateQueueStats: (stats: QueueStatistics) => void;

  // Actions - Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Selectors
  getPendingJobs: () => BatchJob[];
  getProcessingJobs: () => BatchJob[];
  getCompletedJobs: () => BatchJob[];
  getFailedJobs: () => BatchJob[];
  getJobsByType: (type: BatchOperationType) => BatchJob[];
  getTotalProgress: () => number;
}

/**
 * Initial statistics
 */
const initialQueueStats: QueueStatistics = {
  totalJobs: 0,
  pendingJobs: 0,
  processingJobs: 0,
  completedJobs: 0,
  failedJobs: 0,
  averageWaitTime: 0,
  averageProcessingTime: 0,
};

/**
 * Native batch store
 */
export const useNativeBatchStore = create<NativeBatchState>()(
  persist(
    (set, get) => ({
      // Initial state
      jobs: [],
      currentJobId: null,
      isProcessing: false,
      isPaused: false,
      templates: [],
      queueStats: initialQueueStats,
      resourceUsage: null,
      lastError: null,

      // Job Management
      addJob: (type, name, files, options, priority = 'normal', templateId) => {
        const batchFiles = files.map((f) =>
          createBatchFile(f.name, f.path, f.size, f.pageCount)
        );

        const job = createBatchJob(type, name, batchFiles, options, priority, templateId);

        set((state) => {
          const newJobs = [...state.jobs, job].sort((a, b) => {
            // Sort by priority then creation time
            const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
          });

          return {
            jobs: newJobs,
            queueStats: {
              ...state.queueStats,
              totalJobs: newJobs.length,
              pendingJobs: newJobs.filter((j) => j.status === 'pending' || j.status === 'queued').length,
            },
          };
        });

        return job.id;
      },

      removeJob: (jobId) => {
        set((state) => {
          const newJobs = state.jobs.filter((j) => j.id !== jobId);
          return {
            jobs: newJobs,
            currentJobId: state.currentJobId === jobId ? null : state.currentJobId,
            queueStats: {
              ...state.queueStats,
              totalJobs: newJobs.length,
              pendingJobs: newJobs.filter((j) => j.status === 'pending' || j.status === 'queued').length,
            },
          };
        });
      },

      clearCompletedJobs: () => {
        const { jobs } = get();
        const completedCount = jobs.filter(
          (j) => j.status === 'completed' || j.status === 'cancelled'
        ).length;

        set((state) => ({
          jobs: state.jobs.filter(
            (j) => j.status !== 'completed' && j.status !== 'cancelled'
          ),
        }));

        return completedCount;
      },

      clearAllJobs: () => {
        set({
          jobs: [],
          currentJobId: null,
          isProcessing: false,
          queueStats: initialQueueStats,
        });
      },

      getJob: (jobId) => {
        return get().jobs.find((j) => j.id === jobId);
      },

      // Job Control
      startProcessing: () => {
        const { jobs, isProcessing } = get();
        if (isProcessing) return;

        // Find first pending job
        const pendingJob = jobs.find(
          (j) => j.status === 'pending' || j.status === 'queued'
        );

        if (pendingJob) {
          set((state) => ({
            isProcessing: true,
            isPaused: false,
            currentJobId: pendingJob.id,
            jobs: state.jobs.map((j) =>
              j.id === pendingJob.id
                ? {
                    ...j,
                    status: 'processing' as JobStatus,
                    startedAt: Date.now(),
                    progress: { ...j.progress, startTime: Date.now() },
                  }
                : j
            ),
          }));
        }
      },

      pauseProcessing: () => {
        set((state) => ({
          isPaused: true,
          jobs: state.jobs.map((j) =>
            j.id === state.currentJobId && j.status === 'processing'
              ? { ...j, status: 'paused' as JobStatus }
              : j
          ),
        }));
      },

      resumeProcessing: () => {
        set((state) => ({
          isPaused: false,
          jobs: state.jobs.map((j) =>
            j.id === state.currentJobId && j.status === 'paused'
              ? { ...j, status: 'processing' as JobStatus }
              : j
          ),
        }));
      },

      cancelJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId && !['completed', 'cancelled'].includes(j.status)
              ? {
                  ...j,
                  status: 'cancelled' as JobStatus,
                  completedAt: Date.now(),
                  files: j.files.map((f) =>
                    f.status === 'pending' || f.status === 'queued'
                      ? { ...f, status: 'cancelled' as JobStatus }
                      : f
                  ),
                }
              : j
          ),
          currentJobId: state.currentJobId === jobId ? null : state.currentJobId,
          isProcessing: state.currentJobId === jobId ? false : state.isProcessing,
        }));
      },

      retryJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId && j.status === 'failed'
              ? {
                  ...j,
                  status: 'pending' as JobStatus,
                  error: undefined,
                  startedAt: undefined,
                  completedAt: undefined,
                  files: j.files.map((f) =>
                    f.status === 'failed' && f.retryCount < j.options.maxRetries
                      ? {
                          ...f,
                          status: 'pending' as JobStatus,
                          error: undefined,
                          retryCount: f.retryCount + 1,
                        }
                      : f
                  ),
                  progress: {
                    ...j.progress,
                    failedFiles: 0,
                    overallProgress: 0,
                    currentFileProgress: 0,
                  },
                }
              : j
          ),
        }));
      },

      changePriority: (jobId, priority) => {
        set((state) => {
          const newJobs = state.jobs
            .map((j) => (j.id === jobId ? { ...j, priority } : j))
            .sort((a, b) => {
              const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
              const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
              if (priorityDiff !== 0) return priorityDiff;
              return a.createdAt - b.createdAt;
            });

          return { jobs: newJobs };
        });
      },

      // Progress Updates
      updateJobProgress: (jobId, progress) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? { ...j, progress: { ...j.progress, ...progress } }
              : j
          ),
        }));
      },

      updateFileStatus: (jobId, fileId, status, error, outputPath) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  files: j.files.map((f) =>
                    f.id === fileId
                      ? {
                          ...f,
                          status,
                          error,
                          outputPath,
                          progress: status === 'completed' ? 100 : f.progress,
                        }
                      : f
                  ),
                }
              : j
          ),
        }));
      },

      completeJob: (jobId, success, error) => {
        set((state) => {
          const job = state.jobs.find((j) => j.id === jobId);
          if (!job) return state;

          const stats = getJobStatistics(job);

          // Find next pending job
          const nextJob = state.jobs.find(
            (j) => j.id !== jobId && (j.status === 'pending' || j.status === 'queued')
          );

          return {
            jobs: state.jobs.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: success ? ('completed' as JobStatus) : ('failed' as JobStatus),
                    error,
                    completedAt: Date.now(),
                    progress: {
                      ...j.progress,
                      overallProgress: 100,
                      completedFiles: stats.completed,
                      failedFiles: stats.failed,
                    },
                  }
                : j
            ),
            currentJobId: nextJob?.id || null,
            isProcessing: !!nextJob && !state.isPaused,
            queueStats: {
              ...state.queueStats,
              completedJobs: state.queueStats.completedJobs + (success ? 1 : 0),
              failedJobs: state.queueStats.failedJobs + (success ? 0 : 1),
              pendingJobs: state.queueStats.pendingJobs - 1,
            },
          };
        });
      },

      // Templates
      addTemplate: (template) => {
        set((state) => ({
          templates: [...state.templates, template],
        }));
      },

      removeTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }));
      },

      applyTemplate: (templateId, jobId) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) return;

        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  options: { ...j.options, ...template.options },
                  templateId,
                }
              : j
          ),
        }));
      },

      // Resource Management
      updateResourceUsage: (usage) => {
        set({ resourceUsage: usage });
      },

      updateQueueStats: (stats) => {
        set({ queueStats: stats });
      },

      // Error Handling
      setError: (error) => {
        set({ lastError: error });
      },

      clearError: () => {
        set({ lastError: null });
      },

      // Selectors
      getPendingJobs: () => {
        return get().jobs.filter(
          (j) => j.status === 'pending' || j.status === 'queued'
        );
      },

      getProcessingJobs: () => {
        return get().jobs.filter((j) => j.status === 'processing');
      },

      getCompletedJobs: () => {
        return get().jobs.filter((j) => j.status === 'completed');
      },

      getFailedJobs: () => {
        return get().jobs.filter((j) => j.status === 'failed');
      },

      getJobsByType: (type) => {
        return get().jobs.filter((j) => j.type === type);
      },

      getTotalProgress: () => {
        const { jobs } = get();
        if (jobs.length === 0) return 0;

        const totalProgress = jobs.reduce((sum, job) => {
          return sum + job.progress.overallProgress;
        }, 0);

        return Math.round(totalProgress / jobs.length);
      },
    }),
    {
      name: 'paperflow-native-batch',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        templates: state.templates,
      }),
    }
  )
);
