/**
 * Tests for Batch Job Queue System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  JobQueue,
  createJobQueue,
  createBatchJob,
  createBatchFile,
  updateJobStatus,
  updateFileStatus,
  updateJobProgress,
  getJobStatistics,
  isJobComplete,
  hasJobFailures,
  getNextPendingFile,
  generateJobId,
  generateFileId,
} from '@/lib/batch/jobQueue';
import type { BatchJobOptions } from '@/types/batch';

const defaultOptions: BatchJobOptions = {
  errorStrategy: 'skip',
  maxRetries: 2,
  parallelism: 2,
};

describe('Job Queue - ID Generation', () => {
  it('should generate unique job IDs', () => {
    const id1 = generateJobId();
    const id2 = generateJobId();

    expect(id1).toMatch(/^job_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^job_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique file IDs', () => {
    const id1 = generateFileId();
    const id2 = generateFileId();

    expect(id1).toMatch(/^file_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^file_\d+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});

describe('Job Queue - Batch File', () => {
  it('should create a batch file', () => {
    const file = createBatchFile('test.pdf', '/path/to/test.pdf', 1024, 10);

    expect(file.id).toMatch(/^file_/);
    expect(file.name).toBe('test.pdf');
    expect(file.path).toBe('/path/to/test.pdf');
    expect(file.size).toBe(1024);
    expect(file.pageCount).toBe(10);
    expect(file.status).toBe('pending');
    expect(file.progress).toBe(0);
    expect(file.retryCount).toBe(0);
  });

  it('should create a batch file without page count', () => {
    const file = createBatchFile('test.pdf', '/path/to/test.pdf', 1024);

    expect(file.pageCount).toBeUndefined();
  });
});

describe('Job Queue - Batch Job', () => {
  it('should create a batch job', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];

    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    expect(job.id).toMatch(/^job_/);
    expect(job.type).toBe('compress');
    expect(job.name).toBe('Test Job');
    expect(job.files).toHaveLength(2);
    expect(job.status).toBe('pending');
    expect(job.priority).toBe('normal');
    expect(job.progress.totalFiles).toBe(2);
    expect(job.progress.completedFiles).toBe(0);
    expect(job.progress.failedFiles).toBe(0);
    expect(job.createdAt).toBeGreaterThan(0);
  });

  it('should create a job with custom priority', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'High Priority Job', files, defaultOptions, 'high');

    expect(job.priority).toBe('high');
  });

  it('should create a job with template ID', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Template Job', files, defaultOptions, 'normal', 'tpl_123');

    expect(job.templateId).toBe('tpl_123');
  });
});

describe('Job Queue - Update Functions', () => {
  it('should update job status', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    const updatedJob = updateJobStatus(job, 'processing');

    expect(updatedJob.status).toBe('processing');
    expect(updatedJob.startedAt).toBeGreaterThan(0);
    expect(updatedJob.completedAt).toBeUndefined();
  });

  it('should set completedAt when job completes', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);
    const processingJob = updateJobStatus(job, 'processing');

    const completedJob = updateJobStatus(processingJob, 'completed');

    expect(completedJob.status).toBe('completed');
    expect(completedJob.completedAt).toBeGreaterThan(0);
  });

  it('should update file status within a job', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    const updatedJob = updateFileStatus(job, files[0]!.id, {
      status: 'completed',
      progress: 100,
      outputPath: '/output/file1.pdf',
    });

    expect(updatedJob.files[0]!.status).toBe('completed');
    expect(updatedJob.files[0]!.progress).toBe(100);
    expect(updatedJob.files[0]!.outputPath).toBe('/output/file1.pdf');
    expect(updatedJob.files[1]!.status).toBe('pending');
  });

  it('should update job progress', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    const updatedJob = updateJobProgress(job, {
      completedFiles: 1,
      currentFile: 'file2.pdf',
      currentFileProgress: 50,
      startTime: Date.now() - 5000,
    });

    expect(updatedJob.progress.completedFiles).toBe(1);
    expect(updatedJob.progress.currentFile).toBe('file2.pdf');
    expect(updatedJob.progress.currentFileProgress).toBe(50);
    expect(updatedJob.progress.overallProgress).toBeGreaterThan(0);
  });
});

describe('Job Queue - Helper Functions', () => {
  it('should get job statistics', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
      createBatchFile('file3.pdf', '/path/file3.pdf', 3072),
    ];
    let job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    // Update file statuses
    job = updateFileStatus(job, files[0]!.id, { status: 'completed' });
    job = updateFileStatus(job, files[1]!.id, { status: 'failed' });

    const stats = getJobStatistics(job);

    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.processing).toBe(0);
    expect(stats.cancelled).toBe(0);
  });

  it('should check if job is complete', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    let job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    expect(isJobComplete(job)).toBe(false);

    job = updateFileStatus(job, files[0]!.id, { status: 'completed' });
    expect(isJobComplete(job)).toBe(false);

    job = updateFileStatus(job, files[1]!.id, { status: 'failed' });
    expect(isJobComplete(job)).toBe(true);
  });

  it('should check if job has failures', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    let job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    expect(hasJobFailures(job)).toBe(false);

    job = updateFileStatus(job, files[0]!.id, { status: 'failed' });
    expect(hasJobFailures(job)).toBe(true);
  });

  it('should get next pending file', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    let job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    let nextFile = getNextPendingFile(job);
    expect(nextFile?.name).toBe('file1.pdf');

    job = updateFileStatus(job, files[0]!.id, { status: 'completed' });
    nextFile = getNextPendingFile(job);
    expect(nextFile?.name).toBe('file2.pdf');

    job = updateFileStatus(job, files[1]!.id, { status: 'completed' });
    nextFile = getNextPendingFile(job);
    expect(nextFile).toBeUndefined();
  });
});

describe('JobQueue Class', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = createJobQueue();
  });

  it('should create an empty queue', () => {
    expect(queue.getQueueLength()).toBe(0);
    expect(queue.getPendingCount()).toBe(0);
    expect(queue.getAllJobs()).toHaveLength(0);
  });

  it('should add a job to the queue', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);

    expect(queue.getQueueLength()).toBe(1);
    expect(queue.getJob(job.id)).toBeDefined();
    expect(queue.getJob(job.id)?.status).toBe('queued');
  });

  it('should remove a job from the queue', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);
    const removed = queue.removeJob(job.id);

    expect(removed).toBe(true);
    expect(queue.getQueueLength()).toBe(0);
  });

  it('should get next job by priority', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];

    const lowJob = createBatchJob('compress', 'Low', files, defaultOptions, 'low');
    const highJob = createBatchJob('compress', 'High', files, defaultOptions, 'high');
    const normalJob = createBatchJob('compress', 'Normal', files, defaultOptions, 'normal');

    queue.addJob(lowJob);
    queue.addJob(normalJob);
    queue.addJob(highJob);

    const nextJob = queue.getNextJob();
    expect(nextJob?.priority).toBe('high');
  });

  it('should get jobs by status', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];

    const job1 = createBatchJob('compress', 'Job 1', files, defaultOptions);
    const job2 = createBatchJob('compress', 'Job 2', files, defaultOptions);

    queue.addJob(job1);
    queue.addJob(job2);

    const queuedJobs = queue.getJobsByStatus('queued');
    expect(queuedJobs).toHaveLength(2);
  });

  it('should clear completed jobs', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];

    const job1 = createBatchJob('compress', 'Job 1', files, defaultOptions);
    const job2 = createBatchJob('compress', 'Job 2', files, defaultOptions);

    queue.addJob(job1);
    queue.addJob(job2);

    // Mark job1 as completed
    queue.updateJob({ ...queue.getJob(job1.id)!, status: 'completed' });

    const cleared = queue.clearCompletedJobs();

    expect(cleared).toBe(1);
    expect(queue.getQueueLength()).toBe(1);
  });

  it('should change job priority', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions, 'low');

    queue.addJob(job);
    const changed = queue.changePriority(job.id, 'critical');

    expect(changed).toBe(true);
    expect(queue.getJob(job.id)?.priority).toBe('critical');
  });

  it('should pause and resume a job', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);
    queue.updateJob({ ...queue.getJob(job.id)!, status: 'processing' });

    const paused = queue.pauseJob(job.id);
    expect(paused).toBe(true);
    expect(queue.getJob(job.id)?.status).toBe('paused');

    const resumed = queue.resumeJob(job.id);
    expect(resumed).toBe(true);
    expect(queue.getJob(job.id)?.status).toBe('queued');
  });

  it('should cancel a job', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);
    const cancelled = queue.cancelJob(job.id);

    expect(cancelled).toBe(true);
    expect(queue.getJob(job.id)?.status).toBe('cancelled');
  });

  it('should retry failed files', () => {
    const files = [
      createBatchFile('file1.pdf', '/path/file1.pdf', 1024),
      createBatchFile('file2.pdf', '/path/file2.pdf', 2048),
    ];
    let job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);

    // Mark files as failed
    job = queue.getJob(job.id)!;
    job = updateFileStatus(job, job.files[0]!.id, { status: 'failed', error: 'Error' });
    job = updateFileStatus(job, job.files[1]!.id, { status: 'failed', error: 'Error' });
    job.status = 'failed';
    queue.updateJob(job);

    const retried = queue.retryFailedFiles(job.id);

    expect(retried).toBe(true);
    const retriedJob = queue.getJob(job.id)!;
    expect(retriedJob.files[0]!.status).toBe('pending');
    expect(retriedJob.files[0]!.retryCount).toBe(1);
  });

  it('should export and import state', () => {
    const files = [createBatchFile('file1.pdf', '/path/file1.pdf', 1024)];
    const job = createBatchJob('compress', 'Test Job', files, defaultOptions);

    queue.addJob(job);

    const state = queue.exportState();
    expect(state.jobs).toHaveLength(1);

    // Create new queue and import
    const newQueue = createJobQueue();
    newQueue.importState(state);

    expect(newQueue.getQueueLength()).toBe(1);
    expect(newQueue.getJob(job.id)?.name).toBe('Test Job');
  });
});
