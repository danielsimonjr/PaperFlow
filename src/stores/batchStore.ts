/**
 * Batch Processing Store
 * Manages state for batch operations.
 */

import { create } from 'zustand';
import type {
  BatchOperation,
  BatchOperationType,
  BatchProgress,
  BatchResult,
  WatermarkOptions,
  HeaderFooterOptions,
} from '@/lib/batch/types';
import {
  createBatchOperation,
  updateOperationStatus,
  calculateBatchProgress,
  sortOperationsByPriority,
  getNextPendingOperation,
  isBatchComplete,
  createBatchResult,
  cancelPendingOperations,
  resetFailedOperations,
  generateOperationSummary,
} from '@/lib/batch';

interface BatchState {
  // State
  operations: BatchOperation[];
  results: BatchResult[];
  isProcessing: boolean;
  isPaused: boolean;
  progress: BatchProgress;
  error: string | null;

  // Actions
  addOperation: (
    type: BatchOperationType,
    options: WatermarkOptions | HeaderFooterOptions | Record<string, unknown>
  ) => string;
  removeOperation: (id: string) => void;
  clearOperations: () => void;
  reorderOperations: (fromIndex: number, toIndex: number) => void;
  startBatch: () => void;
  pauseBatch: () => void;
  resumeBatch: () => void;
  cancelBatch: () => void;
  retryFailed: () => void;

  // Progress updates
  updateProgress: (operationId: string, progress: number) => void;
  completeOperation: (operationId: string, success: boolean, error?: string) => void;

  // Getters
  getPendingOperations: () => BatchOperation[];
  getCompletedOperations: () => BatchOperation[];
  getFailedOperations: () => BatchOperation[];
  getSummary: () => ReturnType<typeof generateOperationSummary>;
}

export const useBatchStore = create<BatchState>((set, get) => ({
  // Initial state
  operations: [],
  results: [],
  isProcessing: false,
  isPaused: false,
  progress: {
    total: 0,
    completed: 0,
    failed: 0,
  },
  error: null,

  addOperation: (type, options) => {
    const operation = createBatchOperation(type, options);
    set((state) => {
      const newOperations = [...state.operations, operation];
      return {
        operations: sortOperationsByPriority(newOperations),
        progress: calculateBatchProgress(newOperations),
      };
    });
    return operation.id;
  },

  removeOperation: (id) => {
    set((state) => {
      const newOperations = state.operations.filter((op) => op.id !== id);
      return {
        operations: newOperations,
        progress: calculateBatchProgress(newOperations),
      };
    });
  },

  clearOperations: () => {
    set({
      operations: [],
      results: [],
      progress: { total: 0, completed: 0, failed: 0 },
      error: null,
    });
  },

  reorderOperations: (fromIndex, toIndex) => {
    set((state) => {
      const newOperations = [...state.operations];
      const [removed] = newOperations.splice(fromIndex, 1);
      if (removed) {
        newOperations.splice(toIndex, 0, removed);
      }
      return { operations: newOperations };
    });
  },

  startBatch: () => {
    const { operations } = get();
    if (operations.length === 0) return;

    set({ isProcessing: true, isPaused: false, error: null });

    // Mark first pending operation as processing
    const nextOp = getNextPendingOperation(operations);
    if (nextOp) {
      set((state) => ({
        operations: state.operations.map((op) =>
          op.id === nextOp.id
            ? updateOperationStatus(op, 'processing', 0)
            : op
        ),
      }));
    }
  },

  pauseBatch: () => {
    set({ isPaused: true });
  },

  resumeBatch: () => {
    set({ isPaused: false });
  },

  cancelBatch: () => {
    set((state) => {
      const newOperations = cancelPendingOperations(state.operations);
      // Also cancel any processing operation
      const finalOperations = newOperations.map((op) =>
        op.status === 'processing'
          ? updateOperationStatus(op, 'cancelled')
          : op
      );
      return {
        operations: finalOperations,
        isProcessing: false,
        isPaused: false,
        progress: calculateBatchProgress(finalOperations),
      };
    });
  },

  retryFailed: () => {
    set((state) => {
      const newOperations = resetFailedOperations(state.operations);
      return {
        operations: newOperations,
        progress: calculateBatchProgress(newOperations),
        error: null,
      };
    });
  },

  updateProgress: (operationId, progress) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, progress }
          : op
      ),
    }));
  },

  completeOperation: (operationId, success, error) => {
    set((state) => {
      const operation = state.operations.find((op) => op.id === operationId);
      if (!operation) return state;

      const updatedOperation = updateOperationStatus(
        operation,
        success ? 'completed' : 'failed',
        100,
        error
      );

      const result = createBatchResult(updatedOperation, success, error);

      const newOperations = state.operations.map((op) =>
        op.id === operationId ? updatedOperation : op
      );

      // Start next operation if not paused
      if (!state.isPaused) {
        const nextOp = getNextPendingOperation(newOperations);
        if (nextOp) {
          const withNextStarted = newOperations.map((op) =>
            op.id === nextOp.id
              ? updateOperationStatus(op, 'processing', 0)
              : op
          );
          return {
            operations: withNextStarted,
            results: [...state.results, result],
            progress: calculateBatchProgress(withNextStarted),
            isProcessing: !isBatchComplete(withNextStarted),
          };
        }
      }

      return {
        operations: newOperations,
        results: [...state.results, result],
        progress: calculateBatchProgress(newOperations),
        isProcessing: !isBatchComplete(newOperations) && !state.isPaused,
      };
    });
  },

  getPendingOperations: () => {
    return get().operations.filter((op) => op.status === 'pending');
  },

  getCompletedOperations: () => {
    return get().operations.filter((op) => op.status === 'completed');
  },

  getFailedOperations: () => {
    return get().operations.filter((op) => op.status === 'failed');
  },

  getSummary: () => {
    return generateOperationSummary(get().operations);
  },
}));
