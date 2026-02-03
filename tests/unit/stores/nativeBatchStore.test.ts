/**
 * Tests for Native Batch Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import type { BatchJobOptions } from '@/types/batch';

const defaultOptions: BatchJobOptions = {
  errorStrategy: 'skip',
  maxRetries: 2,
  parallelism: 2,
};

const testFiles = [
  { name: 'file1.pdf', path: '/path/file1.pdf', size: 1024 },
  { name: 'file2.pdf', path: '/path/file2.pdf', size: 2048 },
];

describe('Native Batch Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNativeBatchStore.setState({
      jobs: [],
      currentJobId: null,
      isProcessing: false,
      isPaused: false,
      templates: [],
      queueStats: {
        totalJobs: 0,
        pendingJobs: 0,
        processingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageWaitTime: 0,
        averageProcessingTime: 0,
      },
      resourceUsage: null,
      lastError: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useNativeBatchStore.getState();

      expect(state.jobs).toEqual([]);
      expect(state.currentJobId).toBeNull();
      expect(state.isProcessing).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.templates).toEqual([]);
      expect(state.queueStats.totalJobs).toBe(0);
      expect(state.resourceUsage).toBeNull();
      expect(state.lastError).toBeNull();
    });
  });

  describe('job management', () => {
    it('should add a job', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      const state = useNativeBatchStore.getState();
      expect(state.jobs).toHaveLength(1);
      expect(state.jobs[0]?.id).toBe(jobId);
      expect(state.jobs[0]?.name).toBe('Test Job');
      expect(state.jobs[0]?.type).toBe('compress');
      expect(state.jobs[0]?.files).toHaveLength(2);
      expect(state.queueStats.totalJobs).toBe(1);
      expect(state.queueStats.pendingJobs).toBe(1);
    });

    it('should add a job with custom priority', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'High Priority Job', testFiles, defaultOptions, 'high');

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.priority).toBe('high');
    });

    it('should remove a job', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      store.removeJob(jobId);

      const state = useNativeBatchStore.getState();
      expect(state.jobs).toHaveLength(0);
    });

    it('should get a job by ID', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      const job = store.getJob(jobId);
      expect(job?.id).toBe(jobId);
      expect(job?.name).toBe('Test Job');
    });

    it('should clear completed jobs', () => {
      const store = useNativeBatchStore.getState();
      const jobId1 = store.addJob('compress', 'Job 1', testFiles, defaultOptions);
      store.addJob('compress', 'Job 2', testFiles, defaultOptions);

      // Mark first job as completed
      useNativeBatchStore.setState((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === jobId1 ? { ...j, status: 'completed' as const } : j
        ),
      }));

      const cleared = store.clearCompletedJobs();

      const state = useNativeBatchStore.getState();
      expect(cleared).toBe(1);
      expect(state.jobs).toHaveLength(1);
    });

    it('should clear all jobs', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Job 1', testFiles, defaultOptions);
      store.addJob('compress', 'Job 2', testFiles, defaultOptions);

      store.clearAllJobs();

      const state = useNativeBatchStore.getState();
      expect(state.jobs).toHaveLength(0);
      expect(state.currentJobId).toBeNull();
      expect(state.isProcessing).toBe(false);
    });
  });

  describe('job control', () => {
    it('should start processing', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      store.startProcessing();

      const state = useNativeBatchStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.currentJobId).toBe(jobId);
      expect(state.jobs[0]?.status).toBe('processing');
    });

    it('should not start processing with no jobs', () => {
      const store = useNativeBatchStore.getState();
      store.startProcessing();

      const state = useNativeBatchStore.getState();
      expect(state.isProcessing).toBe(false);
    });

    it('should pause processing', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      store.pauseProcessing();

      const state = useNativeBatchStore.getState();
      expect(state.isPaused).toBe(true);
      expect(state.jobs[0]?.status).toBe('paused');
    });

    it('should resume processing', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();
      store.pauseProcessing();

      store.resumeProcessing();

      const state = useNativeBatchStore.getState();
      expect(state.isPaused).toBe(false);
      expect(state.jobs[0]?.status).toBe('processing');
    });

    it('should cancel a job', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      store.cancelJob(jobId);

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.status).toBe('cancelled');
      expect(state.currentJobId).toBeNull();
      expect(state.isProcessing).toBe(false);
    });

    it('should retry a failed job', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      // Mark job as failed with failed files
      useNativeBatchStore.setState((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'failed' as const,
                files: j.files.map((f) => ({ ...f, status: 'failed' as const })),
              }
            : j
        ),
      }));

      store.retryJob(jobId);

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.status).toBe('pending');
      expect(state.jobs[0]?.files.every((f) => f.status === 'pending')).toBe(true);
      expect(state.jobs[0]?.files[0]?.retryCount).toBe(1);
    });

    it('should change job priority', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions, 'low');

      store.changePriority(jobId, 'critical');

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.priority).toBe('critical');
    });
  });

  describe('progress tracking', () => {
    it('should update job progress', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      store.updateJobProgress(jobId, {
        completedFiles: 1,
        currentFile: 'file2.pdf',
        currentFileProgress: 50,
      });

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.progress.completedFiles).toBe(1);
      expect(state.jobs[0]?.progress.currentFile).toBe('file2.pdf');
      expect(state.jobs[0]?.progress.currentFileProgress).toBe(50);
    });

    it('should update file status', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      const fileId = store.getJob(jobId)!.files[0]!.id;

      store.updateFileStatus(jobId, fileId, 'completed', undefined, '/output/file1.pdf');

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.files[0]?.status).toBe('completed');
      expect(state.jobs[0]?.files[0]?.outputPath).toBe('/output/file1.pdf');
    });

    it('should complete a job successfully', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      // Mark files as completed
      useNativeBatchStore.setState((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                files: j.files.map((f) => ({ ...f, status: 'completed' as const })),
              }
            : j
        ),
      }));

      store.completeJob(jobId, true);

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.status).toBe('completed');
      expect(state.jobs[0]?.completedAt).toBeGreaterThan(0);
      expect(state.isProcessing).toBe(false);
    });

    it('should complete a job with failure', () => {
      const store = useNativeBatchStore.getState();
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      store.completeJob(jobId, false, 'Processing error');

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.status).toBe('failed');
      expect(state.jobs[0]?.error).toBe('Processing error');
    });
  });

  describe('templates', () => {
    it('should add a template', () => {
      const store = useNativeBatchStore.getState();
      const template = {
        id: 'tpl_1',
        name: 'Test Template',
        operationType: 'compress' as const,
        options: defaultOptions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      store.addTemplate(template);

      const state = useNativeBatchStore.getState();
      expect(state.templates).toHaveLength(1);
      expect(state.templates[0]?.name).toBe('Test Template');
    });

    it('should remove a template', () => {
      const store = useNativeBatchStore.getState();
      const template = {
        id: 'tpl_1',
        name: 'Test Template',
        operationType: 'compress' as const,
        options: defaultOptions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      store.addTemplate(template);

      store.removeTemplate('tpl_1');

      const state = useNativeBatchStore.getState();
      expect(state.templates).toHaveLength(0);
    });

    it('should apply a template to a job', () => {
      const store = useNativeBatchStore.getState();
      const template = {
        id: 'tpl_1',
        name: 'Test Template',
        operationType: 'compress' as const,
        options: { ...defaultOptions, parallelism: 4 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      store.addTemplate(template);
      const jobId = store.addJob('compress', 'Test Job', testFiles, defaultOptions);

      store.applyTemplate('tpl_1', jobId);

      const state = useNativeBatchStore.getState();
      expect(state.jobs[0]?.templateId).toBe('tpl_1');
      expect(state.jobs[0]?.options.parallelism).toBe(4);
    });
  });

  describe('selectors', () => {
    it('should get pending jobs', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Job 1', testFiles, defaultOptions);
      store.addJob('compress', 'Job 2', testFiles, defaultOptions);

      const pendingJobs = store.getPendingJobs();

      expect(pendingJobs).toHaveLength(2);
    });

    it('should get processing jobs', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Test Job', testFiles, defaultOptions);
      store.startProcessing();

      const processingJobs = store.getProcessingJobs();

      expect(processingJobs).toHaveLength(1);
    });

    it('should get jobs by type', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Compress Job', testFiles, defaultOptions);
      store.addJob('merge', 'Merge Job', testFiles, {
        ...defaultOptions,
        merge: { outputName: 'merged', strategy: 'append', addBookmarks: true, bookmarkLevel: 1 },
      });

      const compressJobs = store.getJobsByType('compress');

      expect(compressJobs).toHaveLength(1);
      expect(compressJobs[0]?.type).toBe('compress');
    });

    it('should get total progress', () => {
      const store = useNativeBatchStore.getState();
      store.addJob('compress', 'Job 1', testFiles, defaultOptions);
      store.addJob('compress', 'Job 2', testFiles, defaultOptions);

      // Update progress of first job
      useNativeBatchStore.setState((state) => ({
        jobs: state.jobs.map((j, i) =>
          i === 0
            ? { ...j, progress: { ...j.progress, overallProgress: 100 } }
            : j
        ),
      }));

      const totalProgress = store.getTotalProgress();

      expect(totalProgress).toBe(50); // (100 + 0) / 2
    });
  });

  describe('error handling', () => {
    it('should set error', () => {
      const store = useNativeBatchStore.getState();
      store.setError('Test error');

      const state = useNativeBatchStore.getState();
      expect(state.lastError).toBe('Test error');
    });

    it('should clear error', () => {
      const store = useNativeBatchStore.getState();
      store.setError('Test error');
      store.clearError();

      const state = useNativeBatchStore.getState();
      expect(state.lastError).toBeNull();
    });
  });

  describe('resource management', () => {
    it('should update resource usage', () => {
      const store = useNativeBatchStore.getState();
      const usage = {
        cpuPercent: 50,
        memoryUsed: 1024 * 1024 * 512,
        memoryTotal: 1024 * 1024 * 1024,
        activeWorkers: 2,
        maxWorkers: 4,
      };

      store.updateResourceUsage(usage);

      const state = useNativeBatchStore.getState();
      expect(state.resourceUsage).toEqual(usage);
    });

    it('should update queue stats', () => {
      const store = useNativeBatchStore.getState();
      const stats = {
        totalJobs: 10,
        pendingJobs: 3,
        processingJobs: 2,
        completedJobs: 4,
        failedJobs: 1,
        averageWaitTime: 5000,
        averageProcessingTime: 10000,
      };

      store.updateQueueStats(stats);

      const state = useNativeBatchStore.getState();
      expect(state.queueStats).toEqual(stats);
    });
  });
});
