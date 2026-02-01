/**
 * Batch Processor
 * Core batch processing engine for PDF operations.
 */

import type {
  BatchOperation,
  BatchOperationType,
  BatchOperationStatus,
  BatchProgress,
  BatchResult,
  WatermarkOptions,
  HeaderFooterOptions,
} from './types';

/**
 * Generate unique ID for batch operation
 */
function generateOperationId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new batch operation
 */
export function createBatchOperation(
  type: BatchOperationType,
  options: WatermarkOptions | HeaderFooterOptions | Record<string, unknown>
): BatchOperation {
  return {
    id: generateOperationId(),
    type,
    options,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
  };
}

/**
 * Update operation status
 */
export function updateOperationStatus(
  operation: BatchOperation,
  status: BatchOperationStatus,
  progress?: number,
  error?: string
): BatchOperation {
  return {
    ...operation,
    status,
    progress: progress !== undefined ? progress : operation.progress,
    error,
    startedAt: status === 'processing' && !operation.startedAt ? Date.now() : operation.startedAt,
    completedAt: status === 'completed' || status === 'failed' ? Date.now() : operation.completedAt,
  };
}

/**
 * Calculate batch progress
 */
export function calculateBatchProgress(operations: BatchOperation[]): BatchProgress {
  const total = operations.length;
  const completed = operations.filter((op) => op.status === 'completed').length;
  const failed = operations.filter((op) => op.status === 'failed').length;
  const processing = operations.find((op) => op.status === 'processing');

  // Calculate estimated time remaining based on completed operations
  let estimatedTimeRemaining: number | undefined;

  if (completed > 0) {
    const completedOps = operations.filter((op) => op.status === 'completed' && op.startedAt && op.completedAt);
    if (completedOps.length > 0) {
      const avgTime = completedOps.reduce((sum, op) => sum + (op.completedAt! - op.startedAt!), 0) / completedOps.length;
      const remaining = total - completed - failed;
      estimatedTimeRemaining = avgTime * remaining;
    }
  }

  return {
    total,
    completed,
    failed,
    currentOperation: processing?.id,
    estimatedTimeRemaining,
  };
}

/**
 * Sort operations by priority (for queue ordering)
 */
export function sortOperationsByPriority(operations: BatchOperation[]): BatchOperation[] {
  const typeOrder: Record<BatchOperationType, number> = {
    'watermark': 1,
    'header-footer': 2,
    'bates-number': 3,
    'flatten': 4, // Flatten should be last as it's destructive
  };

  return [...operations].sort((a, b) => {
    const orderA = typeOrder[a.type] || 99;
    const orderB = typeOrder[b.type] || 99;
    return orderA - orderB;
  });
}

/**
 * Get next pending operation
 */
export function getNextPendingOperation(operations: BatchOperation[]): BatchOperation | undefined {
  return operations.find((op) => op.status === 'pending');
}

/**
 * Check if batch is complete
 */
export function isBatchComplete(operations: BatchOperation[]): boolean {
  return operations.every(
    (op) => op.status === 'completed' || op.status === 'failed' || op.status === 'cancelled'
  );
}

/**
 * Check if any operation failed
 */
export function hasFailedOperations(operations: BatchOperation[]): boolean {
  return operations.some((op) => op.status === 'failed');
}

/**
 * Get failed operations
 */
export function getFailedOperations(operations: BatchOperation[]): BatchOperation[] {
  return operations.filter((op) => op.status === 'failed');
}

/**
 * Create batch result from operation
 */
export function createBatchResult(
  operation: BatchOperation,
  success: boolean,
  error?: string,
  outputPath?: string
): BatchResult {
  const processingTime = operation.completedAt && operation.startedAt
    ? operation.completedAt - operation.startedAt
    : 0;

  return {
    operationId: operation.id,
    success,
    error,
    outputPath,
    processingTime,
  };
}

/**
 * Validate operation options based on type
 */
export function validateOperationOptions(
  type: BatchOperationType,
  options: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'watermark':
      if (!options.content) {
        errors.push('Watermark content is required');
      }
      if (typeof options.opacity === 'number' && (options.opacity < 0 || options.opacity > 1)) {
        errors.push('Opacity must be between 0 and 1');
      }
      break;

    case 'header-footer':
      if (!options.header && !options.footer) {
        errors.push('At least one of header or footer is required');
      }
      break;

    case 'bates-number':
      if (typeof options.startNumber === 'number' && options.startNumber < 0) {
        errors.push('Start number must be non-negative');
      }
      if (typeof options.digits === 'number' && (options.digits < 1 || options.digits > 15)) {
        errors.push('Digits must be between 1 and 15');
      }
      break;

    case 'flatten':
      // No specific validation needed
      break;

    default:
      errors.push(`Unknown operation type: ${type}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Estimate operation time (in milliseconds)
 */
export function estimateOperationTime(
  type: BatchOperationType,
  pageCount: number
): number {
  // Rough estimates based on operation complexity
  const timePerPage: Record<BatchOperationType, number> = {
    'watermark': 50,
    'header-footer': 30,
    'bates-number': 20,
    'flatten': 100,
  };

  return (timePerPage[type] || 50) * pageCount;
}

/**
 * Generate operation summary
 */
export function generateOperationSummary(operations: BatchOperation[]): {
  total: number;
  byType: Record<BatchOperationType, number>;
  byStatus: Record<BatchOperationStatus, number>;
  estimatedTime: number;
} {
  const byType: Record<BatchOperationType, number> = {
    'watermark': 0,
    'header-footer': 0,
    'bates-number': 0,
    'flatten': 0,
  };

  const byStatus: Record<BatchOperationStatus, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };

  let estimatedTime = 0;

  for (const op of operations) {
    byType[op.type] = (byType[op.type] || 0) + 1;
    byStatus[op.status] = (byStatus[op.status] || 0) + 1;

    if (op.status === 'pending' || op.status === 'processing') {
      // Assume 10 pages average if we don't know
      estimatedTime += estimateOperationTime(op.type, 10);
    }
  }

  return {
    total: operations.length,
    byType,
    byStatus,
    estimatedTime,
  };
}

/**
 * Cancel pending operations
 */
export function cancelPendingOperations(
  operations: BatchOperation[]
): BatchOperation[] {
  return operations.map((op) =>
    op.status === 'pending'
      ? { ...op, status: 'cancelled' as BatchOperationStatus }
      : op
  );
}

/**
 * Reset failed operations to pending (for retry)
 */
export function resetFailedOperations(
  operations: BatchOperation[]
): BatchOperation[] {
  return operations.map((op) =>
    op.status === 'failed'
      ? {
          ...op,
          status: 'pending' as BatchOperationStatus,
          error: undefined,
          progress: 0,
          startedAt: undefined,
          completedAt: undefined,
        }
      : op
  );
}

/**
 * Group operations by type
 */
export function groupOperationsByType(
  operations: BatchOperation[]
): Map<BatchOperationType, BatchOperation[]> {
  const groups = new Map<BatchOperationType, BatchOperation[]>();

  for (const op of operations) {
    const existing = groups.get(op.type) || [];
    existing.push(op);
    groups.set(op.type, existing);
  }

  return groups;
}
