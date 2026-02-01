/**
 * Tests for Batch Processing Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBatchStore } from '@/stores/batchStore';

// Mock the batch library functions
vi.mock('@/lib/batch', () => ({
  createBatchOperation: vi.fn((type, options) => ({
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    options,
    status: 'pending',
    progress: 0,
    priority: 1,
    createdAt: new Date(),
  })),
  updateOperationStatus: vi.fn((op, status, progress = 0, error) => ({
    ...op,
    status,
    progress,
    error,
  })),
  calculateBatchProgress: vi.fn((operations) => ({
    total: operations.length,
    completed: operations.filter((op: { status: string }) => op.status === 'completed').length,
    failed: operations.filter((op: { status: string }) => op.status === 'failed').length,
  })),
  sortOperationsByPriority: vi.fn((operations) => operations),
  getNextPendingOperation: vi.fn((operations) =>
    operations.find((op: { status: string }) => op.status === 'pending')
  ),
  isBatchComplete: vi.fn((operations) =>
    operations.every((op: { status: string }) => ['completed', 'failed', 'cancelled'].includes(op.status))
  ),
  createBatchResult: vi.fn((operation, success, error) => ({
    operationId: operation.id,
    success,
    error,
    completedAt: new Date(),
  })),
  cancelPendingOperations: vi.fn((operations) =>
    operations.map((op: { status: string }) =>
      op.status === 'pending' ? { ...op, status: 'cancelled' } : op
    )
  ),
  resetFailedOperations: vi.fn((operations) =>
    operations.map((op: { status: string }) =>
      op.status === 'failed' ? { ...op, status: 'pending', progress: 0, error: undefined } : op
    )
  ),
  generateOperationSummary: vi.fn((operations) => ({
    total: operations.length,
    pending: operations.filter((op: { status: string }) => op.status === 'pending').length,
    processing: operations.filter((op: { status: string }) => op.status === 'processing').length,
    completed: operations.filter((op: { status: string }) => op.status === 'completed').length,
    failed: operations.filter((op: { status: string }) => op.status === 'failed').length,
    cancelled: operations.filter((op: { status: string }) => op.status === 'cancelled').length,
  })),
}));

describe('Batch Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBatchStore.setState({
      operations: [],
      results: [],
      isProcessing: false,
      isPaused: false,
      progress: { total: 0, completed: 0, failed: 0 },
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useBatchStore.getState();
      expect(state.operations).toEqual([]);
      expect(state.results).toEqual([]);
      expect(state.isProcessing).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.progress).toEqual({ total: 0, completed: 0, failed: 0 });
      expect(state.error).toBeNull();
    });
  });

  describe('operation management', () => {
    it('should add an operation', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });

      const state = useBatchStore.getState();
      expect(state.operations).toHaveLength(1);
      expect(state.operations[0]?.id).toBe(id);
      expect(state.operations[0]?.type).toBe('watermark');
      expect(state.operations[0]?.status).toBe('pending');
    });

    it('should add multiple operations', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.addOperation('flatten', {});

      const state = useBatchStore.getState();
      expect(state.operations).toHaveLength(3);
      expect(state.progress.total).toBe(3);
    });

    it('should remove an operation', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      const id2 = store.addOperation('compress', { quality: 0.8 });

      store.removeOperation(id1);

      const state = useBatchStore.getState();
      expect(state.operations).toHaveLength(1);
      expect(state.operations[0]?.id).toBe(id2);
    });

    it('should clear all operations', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });

      store.clearOperations();

      const state = useBatchStore.getState();
      expect(state.operations).toHaveLength(0);
      expect(state.results).toHaveLength(0);
      expect(state.progress).toEqual({ total: 0, completed: 0, failed: 0 });
      expect(state.error).toBeNull();
    });

    it('should reorder operations', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      const id2 = store.addOperation('compress', { quality: 0.8 });
      const id3 = store.addOperation('flatten', {});

      store.reorderOperations(0, 2);

      const state = useBatchStore.getState();
      expect(state.operations[0]?.id).toBe(id2);
      expect(state.operations[1]?.id).toBe(id3);
      expect(state.operations[2]?.id).toBe(id1);
    });
  });

  describe('batch processing', () => {
    it('should start batch processing', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });

      store.startBatch();

      const state = useBatchStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should not start batch when no operations', () => {
      const store = useBatchStore.getState();

      store.startBatch();

      const state = useBatchStore.getState();
      expect(state.isProcessing).toBe(false);
    });

    it('should mark first pending operation as processing', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });

      store.startBatch();

      const state = useBatchStore.getState();
      expect(state.operations[0]?.status).toBe('processing');
    });

    it('should pause batch processing', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();

      store.pauseBatch();

      const state = useBatchStore.getState();
      expect(state.isPaused).toBe(true);
    });

    it('should resume batch processing', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();
      store.pauseBatch();

      store.resumeBatch();

      const state = useBatchStore.getState();
      expect(state.isPaused).toBe(false);
    });

    it('should cancel batch processing', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.startBatch();

      store.cancelBatch();

      const state = useBatchStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.isPaused).toBe(false);
    });
  });

  describe('progress tracking', () => {
    it('should update operation progress', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();

      store.updateProgress(id, 50);

      const state = useBatchStore.getState();
      expect(state.operations[0]?.progress).toBe(50);
    });

    it('should complete an operation successfully', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();

      store.completeOperation(id, true);

      const state = useBatchStore.getState();
      expect(state.operations[0]?.status).toBe('completed');
      expect(state.operations[0]?.progress).toBe(100);
      expect(state.results).toHaveLength(1);
      expect(state.results[0]?.success).toBe(true);
    });

    it('should complete an operation with failure', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();

      store.completeOperation(id, false, 'Processing error');

      const state = useBatchStore.getState();
      expect(state.operations[0]?.status).toBe('failed');
      expect(state.results).toHaveLength(1);
      expect(state.results[0]?.success).toBe(false);
      expect(state.results[0]?.error).toBe('Processing error');
    });

    it('should not update progress for non-existent operation', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });

      store.updateProgress('non-existent', 50);

      const state = useBatchStore.getState();
      expect(state.operations[0]?.progress).toBe(0);
    });
  });

  describe('retry functionality', () => {
    it('should retry failed operations', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();
      store.completeOperation(id, false, 'Error');

      store.retryFailed();

      const state = useBatchStore.getState();
      expect(state.operations[0]?.status).toBe('pending');
      expect(state.operations[0]?.progress).toBe(0);
      expect(state.operations[0]?.error).toBeUndefined();
      expect(state.error).toBeNull();
    });
  });

  describe('getter methods', () => {
    it('should get pending operations', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });

      const pending = store.getPendingOperations();

      expect(pending).toHaveLength(2);
      expect(pending.every((op) => op.status === 'pending')).toBe(true);
    });

    it('should get completed operations', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.startBatch();
      store.completeOperation(id1, true);

      const completed = store.getCompletedOperations();

      expect(completed).toHaveLength(1);
      expect(completed[0]?.id).toBe(id1);
    });

    it('should get failed operations', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.startBatch();
      store.completeOperation(id1, false, 'Error');

      const failed = store.getFailedOperations();

      expect(failed).toHaveLength(1);
      expect(failed[0]?.id).toBe(id1);
    });

    it('should get operation summary', () => {
      const store = useBatchStore.getState();
      store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });

      const summary = store.getSummary();

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('pending');
      expect(summary).toHaveProperty('completed');
      expect(summary).toHaveProperty('failed');
    });
  });

  describe('batch completion', () => {
    it('should set isProcessing to false when batch is complete', () => {
      const store = useBatchStore.getState();
      const id = store.addOperation('watermark', { text: 'DRAFT' });
      store.startBatch();

      store.completeOperation(id, true);

      const state = useBatchStore.getState();
      expect(state.isProcessing).toBe(false);
    });

    it('should start next operation after completing one', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.startBatch();

      store.completeOperation(id1, true);

      const state = useBatchStore.getState();
      // Second operation should now be processing
      expect(state.operations[1]?.status).toBe('processing');
    });

    it('should not start next operation when paused', () => {
      const store = useBatchStore.getState();
      const id1 = store.addOperation('watermark', { text: 'DRAFT' });
      store.addOperation('compress', { quality: 0.8 });
      store.startBatch();
      store.pauseBatch();

      store.completeOperation(id1, true);

      const state = useBatchStore.getState();
      // Second operation should still be pending
      expect(state.operations[1]?.status).toBe('pending');
    });
  });
});
