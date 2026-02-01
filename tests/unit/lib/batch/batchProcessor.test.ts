/**
 * Tests for Batch Processor Module
 */

import { describe, it, expect } from 'vitest';
import {
  createBatchOperation,
  updateOperationStatus,
  calculateBatchProgress,
  sortOperationsByPriority,
  getNextPendingOperation,
  isBatchComplete,
  hasFailedOperations,
  getFailedOperations,
  createBatchResult,
  validateOperationOptions,
  estimateOperationTime,
  generateOperationSummary,
  cancelPendingOperations,
  resetFailedOperations,
  groupOperationsByType,
} from '@/lib/batch/batchProcessor';
import type { BatchOperation, BatchOperationType } from '@/lib/batch/types';

describe('Batch Processor Module', () => {
  describe('createBatchOperation', () => {
    it('should create a watermark operation', () => {
      const op = createBatchOperation('watermark', { content: 'DRAFT' });

      expect(op.id).toBeDefined();
      expect(op.type).toBe('watermark');
      expect(op.status).toBe('pending');
      expect(op.progress).toBe(0);
      expect(op.createdAt).toBeDefined();
    });

    it('should create a header-footer operation', () => {
      const op = createBatchOperation('header-footer', {
        footer: { center: '{{page}}' },
      });

      expect(op.type).toBe('header-footer');
    });

    it('should generate unique IDs', () => {
      const op1 = createBatchOperation('watermark', {});
      const op2 = createBatchOperation('watermark', {});

      expect(op1.id).not.toBe(op2.id);
    });
  });

  describe('updateOperationStatus', () => {
    it('should update status', () => {
      const op = createBatchOperation('watermark', {});
      const updated = updateOperationStatus(op, 'processing');

      expect(updated.status).toBe('processing');
      expect(updated.startedAt).toBeDefined();
    });

    it('should update progress', () => {
      const op = createBatchOperation('watermark', {});
      const updated = updateOperationStatus(op, 'processing', 50);

      expect(updated.progress).toBe(50);
    });

    it('should set error on failure', () => {
      const op = createBatchOperation('watermark', {});
      const updated = updateOperationStatus(op, 'failed', undefined, 'Test error');

      expect(updated.status).toBe('failed');
      expect(updated.error).toBe('Test error');
      expect(updated.completedAt).toBeDefined();
    });

    it('should set completedAt on completion', () => {
      const op = createBatchOperation('watermark', {});
      const updated = updateOperationStatus(op, 'completed', 100);

      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('calculateBatchProgress', () => {
    it('should calculate progress for empty batch', () => {
      const progress = calculateBatchProgress([]);

      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.failed).toBe(0);
    });

    it('should calculate progress correctly', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'failed' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
      ];

      const progress = calculateBatchProgress(operations);

      expect(progress.total).toBe(4);
      expect(progress.completed).toBe(2);
      expect(progress.failed).toBe(1);
    });

    it('should identify current operation', () => {
      const processingOp = { ...createBatchOperation('watermark', {}), status: 'processing' as const };
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        processingOp,
      ];

      const progress = calculateBatchProgress(operations);

      expect(progress.currentOperation).toBe(processingOp.id);
    });
  });

  describe('sortOperationsByPriority', () => {
    it('should sort operations by type priority', () => {
      const flatten = createBatchOperation('flatten', {});
      const watermark = createBatchOperation('watermark', {});
      const headerFooter = createBatchOperation('header-footer', {});
      const bates = createBatchOperation('bates-number', {});

      const sorted = sortOperationsByPriority([flatten, bates, headerFooter, watermark]);

      expect(sorted[0]!.type).toBe('watermark');
      expect(sorted[1]!.type).toBe('header-footer');
      expect(sorted[2]!.type).toBe('bates-number');
      expect(sorted[3]!.type).toBe('flatten');
    });
  });

  describe('getNextPendingOperation', () => {
    it('should return first pending operation', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
      ];

      const next = getNextPendingOperation(operations);

      expect(next).toBeDefined();
      expect(next!.status).toBe('pending');
    });

    it('should return undefined when no pending operations', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
      ];

      const next = getNextPendingOperation(operations);

      expect(next).toBeUndefined();
    });
  });

  describe('isBatchComplete', () => {
    it('should return true when all operations are done', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'failed' },
      ];

      expect(isBatchComplete(operations)).toBe(true);
    });

    it('should return false when operations are pending', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
      ];

      expect(isBatchComplete(operations)).toBe(false);
    });

    it('should return false when operations are processing', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'processing' },
      ];

      expect(isBatchComplete(operations)).toBe(false);
    });
  });

  describe('hasFailedOperations', () => {
    it('should return true when any operation failed', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'failed' },
      ];

      expect(hasFailedOperations(operations)).toBe(true);
    });

    it('should return false when no failures', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
      ];

      expect(hasFailedOperations(operations)).toBe(false);
    });
  });

  describe('getFailedOperations', () => {
    it('should return only failed operations', () => {
      const failedOp = { ...createBatchOperation('watermark', {}), status: 'failed' as const };
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        failedOp,
      ];

      const failed = getFailedOperations(operations);

      expect(failed).toHaveLength(1);
      expect(failed[0]!.id).toBe(failedOp.id);
    });
  });

  describe('createBatchResult', () => {
    it('should create success result', () => {
      const op: BatchOperation = {
        ...createBatchOperation('watermark', {}),
        status: 'completed',
        startedAt: Date.now() - 1000,
        completedAt: Date.now(),
      };

      const result = createBatchResult(op, true);

      expect(result.success).toBe(true);
      expect(result.operationId).toBe(op.id);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should create failure result with error', () => {
      const op: BatchOperation = {
        ...createBatchOperation('watermark', {}),
        status: 'failed',
        startedAt: Date.now() - 500,
        completedAt: Date.now(),
      };

      const result = createBatchResult(op, false, 'Test error');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('validateOperationOptions', () => {
    it('should validate watermark options', () => {
      const result = validateOperationOptions('watermark', { content: 'DRAFT' });
      expect(result.valid).toBe(true);
    });

    it('should reject watermark without content', () => {
      const result = validateOperationOptions('watermark', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Watermark content is required');
    });

    it('should reject invalid opacity', () => {
      const result = validateOperationOptions('watermark', {
        content: 'DRAFT',
        opacity: 2,
      });
      expect(result.valid).toBe(false);
    });

    it('should validate header-footer options', () => {
      const result = validateOperationOptions('header-footer', {
        footer: { center: '{{page}}' },
      });
      expect(result.valid).toBe(true);
    });

    it('should reject header-footer without header or footer', () => {
      const result = validateOperationOptions('header-footer', {});
      expect(result.valid).toBe(false);
    });

    it('should validate bates-number options', () => {
      const result = validateOperationOptions('bates-number', {
        startNumber: 1,
        digits: 6,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject unknown operation type', () => {
      const result = validateOperationOptions('unknown' as BatchOperationType, {});
      expect(result.valid).toBe(false);
    });
  });

  describe('estimateOperationTime', () => {
    it('should estimate watermark time', () => {
      const time = estimateOperationTime('watermark', 10);
      expect(time).toBe(500);
    });

    it('should estimate flatten time as highest', () => {
      const watermarkTime = estimateOperationTime('watermark', 10);
      const flattenTime = estimateOperationTime('flatten', 10);
      expect(flattenTime).toBeGreaterThan(watermarkTime);
    });
  });

  describe('generateOperationSummary', () => {
    it('should generate summary', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
        { ...createBatchOperation('header-footer', {}), status: 'failed' },
      ];

      const summary = generateOperationSummary(operations);

      expect(summary.total).toBe(3);
      expect(summary.byType.watermark).toBe(2);
      expect(summary.byType['header-footer']).toBe(1);
      expect(summary.byStatus.completed).toBe(1);
      expect(summary.byStatus.pending).toBe(1);
      expect(summary.byStatus.failed).toBe(1);
    });
  });

  describe('cancelPendingOperations', () => {
    it('should cancel pending operations', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
        { ...createBatchOperation('watermark', {}), status: 'pending' },
      ];

      const cancelled = cancelPendingOperations(operations);

      expect(cancelled.filter((op) => op.status === 'cancelled')).toHaveLength(2);
      expect(cancelled.filter((op) => op.status === 'completed')).toHaveLength(1);
    });
  });

  describe('resetFailedOperations', () => {
    it('should reset failed operations to pending', () => {
      const operations: BatchOperation[] = [
        { ...createBatchOperation('watermark', {}), status: 'completed' },
        {
          ...createBatchOperation('watermark', {}),
          status: 'failed',
          error: 'Test error',
        },
      ];

      const reset = resetFailedOperations(operations);

      expect(reset[1]!.status).toBe('pending');
      expect(reset[1]!.error).toBeUndefined();
      expect(reset[1]!.progress).toBe(0);
    });
  });

  describe('groupOperationsByType', () => {
    it('should group operations by type', () => {
      const operations: BatchOperation[] = [
        createBatchOperation('watermark', {}),
        createBatchOperation('watermark', {}),
        createBatchOperation('header-footer', {}),
      ];

      const groups = groupOperationsByType(operations);

      expect(groups.get('watermark')).toHaveLength(2);
      expect(groups.get('header-footer')).toHaveLength(1);
    });
  });
});
