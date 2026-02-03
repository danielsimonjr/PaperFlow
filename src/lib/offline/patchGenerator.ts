/**
 * Patch Generator
 *
 * Generates efficient patches for document updates,
 * supporting both binary and structured data.
 */

import type { EditHistoryEntry, DeltaOperation } from '@/types/offline';
import type { Annotation } from '@/types/index';
import { calculateDelta } from './deltaSync';
import { v4 as uuidv4 } from 'uuid';

/**
 * Patch types
 */
export type PatchType = 'binary' | 'annotation' | 'form' | 'metadata' | 'mixed';

/**
 * Patch interface
 */
export interface Patch {
  id: string;
  documentId: string;
  fromVersion: number;
  toVersion: number;
  type: PatchType;
  operations: PatchOperation[];
  createdAt: Date;
  size: number;
  checksum: string;
}

/**
 * Patch operation types
 */
export interface PatchOperation {
  type: 'add' | 'update' | 'delete' | 'binary';
  target: 'annotation' | 'form' | 'metadata' | 'data';
  id?: string;
  path?: string;
  value?: unknown;
  delta?: DeltaOperation[];
}

/**
 * Patch generator class
 */
class PatchGenerator {
  /**
   * Generate patch for annotation changes
   */
  generateAnnotationPatch(
    documentId: string,
    fromVersion: number,
    oldAnnotations: Annotation[],
    newAnnotations: Annotation[]
  ): Patch {
    const operations: PatchOperation[] = [];
    const oldMap = new Map(oldAnnotations.map((a) => [a.id, a]));
    const newMap = new Map(newAnnotations.map((a) => [a.id, a]));

    // Find added annotations
    for (const [id, annotation] of newMap) {
      if (!oldMap.has(id)) {
        operations.push({
          type: 'add',
          target: 'annotation',
          id,
          value: annotation,
        });
      }
    }

    // Find deleted annotations
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        operations.push({
          type: 'delete',
          target: 'annotation',
          id,
        });
      }
    }

    // Find updated annotations
    for (const [id, newAnnotation] of newMap) {
      const oldAnnotation = oldMap.get(id);
      if (oldAnnotation && JSON.stringify(oldAnnotation) !== JSON.stringify(newAnnotation)) {
        operations.push({
          type: 'update',
          target: 'annotation',
          id,
          value: newAnnotation,
        });
      }
    }

    return this.createPatch(
      documentId,
      fromVersion,
      fromVersion + 1,
      'annotation',
      operations
    );
  }

  /**
   * Generate patch for form value changes
   */
  generateFormPatch(
    documentId: string,
    fromVersion: number,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
  ): Patch {
    const operations: PatchOperation[] = [];

    // Find added/updated fields
    for (const [key, value] of Object.entries(newValues)) {
      if (!(key in oldValues)) {
        operations.push({
          type: 'add',
          target: 'form',
          path: key,
          value,
        });
      } else if (JSON.stringify(oldValues[key]) !== JSON.stringify(value)) {
        operations.push({
          type: 'update',
          target: 'form',
          path: key,
          value,
        });
      }
    }

    // Find deleted fields
    for (const key of Object.keys(oldValues)) {
      if (!(key in newValues)) {
        operations.push({
          type: 'delete',
          target: 'form',
          path: key,
        });
      }
    }

    return this.createPatch(documentId, fromVersion, fromVersion + 1, 'form', operations);
  }

  /**
   * Generate patch for metadata changes
   */
  generateMetadataPatch(
    documentId: string,
    fromVersion: number,
    oldMetadata: Record<string, unknown>,
    newMetadata: Record<string, unknown>
  ): Patch {
    const operations: PatchOperation[] = [];

    for (const [key, value] of Object.entries(newMetadata)) {
      if (JSON.stringify(oldMetadata[key]) !== JSON.stringify(value)) {
        operations.push({
          type: 'update',
          target: 'metadata',
          path: key,
          value,
        });
      }
    }

    return this.createPatch(documentId, fromVersion, fromVersion + 1, 'metadata', operations);
  }

  /**
   * Generate binary patch for PDF data
   */
  generateBinaryPatch(
    documentId: string,
    fromVersion: number,
    oldData: ArrayBuffer,
    newData: ArrayBuffer
  ): Patch {
    const delta = calculateDelta(oldData, newData);

    const operations: PatchOperation[] = [
      {
        type: 'binary',
        target: 'data',
        delta,
      },
    ];

    return this.createPatch(documentId, fromVersion, fromVersion + 1, 'binary', operations);
  }

  /**
   * Generate mixed patch from edit history
   */
  generateFromHistory(
    documentId: string,
    fromVersion: number,
    history: EditHistoryEntry[]
  ): Patch {
    const operations: PatchOperation[] = history.map((entry) => ({
      type: entry.action as 'add' | 'update' | 'delete',
      target: entry.type as 'annotation' | 'form' | 'metadata' | 'data',
      value: entry.payload,
    }));

    return this.createPatch(
      documentId,
      fromVersion,
      fromVersion + history.length,
      'mixed',
      operations
    );
  }

  /**
   * Create a patch object
   */
  private createPatch(
    documentId: string,
    fromVersion: number,
    toVersion: number,
    type: PatchType,
    operations: PatchOperation[]
  ): Patch {
    const content = JSON.stringify(operations);

    return {
      id: uuidv4(),
      documentId,
      fromVersion,
      toVersion,
      type,
      operations,
      createdAt: new Date(),
      size: content.length,
      checksum: this.generateChecksum(content),
    };
  }

  /**
   * Generate checksum for content
   */
  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate patch checksum
   */
  validatePatch(patch: Patch): boolean {
    const content = JSON.stringify(patch.operations);
    return this.generateChecksum(content) === patch.checksum;
  }

  /**
   * Apply annotation operations
   */
  applyAnnotationOperations(
    annotations: Annotation[],
    operations: PatchOperation[]
  ): Annotation[] {
    let result = [...annotations];

    for (const op of operations) {
      if (op.target !== 'annotation') continue;

      switch (op.type) {
        case 'add':
          if (op.value) {
            result.push(op.value as Annotation);
          }
          break;

        case 'delete':
          result = result.filter((a) => a.id !== op.id);
          break;

        case 'update':
          result = result.map((a) =>
            a.id === op.id ? (op.value as Annotation) : a
          );
          break;
      }
    }

    return result;
  }

  /**
   * Apply form operations
   */
  applyFormOperations(
    values: Record<string, unknown>,
    operations: PatchOperation[]
  ): Record<string, unknown> {
    const result = { ...values };

    for (const op of operations) {
      if (op.target !== 'form' || !op.path) continue;

      switch (op.type) {
        case 'add':
        case 'update':
          result[op.path] = op.value;
          break;

        case 'delete':
          delete result[op.path];
          break;
      }
    }

    return result;
  }

  /**
   * Apply metadata operations
   */
  applyMetadataOperations(
    metadata: Record<string, unknown>,
    operations: PatchOperation[]
  ): Record<string, unknown> {
    const result = { ...metadata };

    for (const op of operations) {
      if (op.target !== 'metadata' || !op.path) continue;

      if (op.type === 'update') {
        result[op.path] = op.value;
      }
    }

    return result;
  }

  /**
   * Merge multiple patches
   */
  mergePatches(patches: Patch[]): Patch | null {
    if (patches.length === 0) return null;
    const firstPatch = patches[0];
    if (!firstPatch) return null;
    if (patches.length === 1) return firstPatch;

    // Sort by version
    const sorted = [...patches].sort((a, b) => a.fromVersion - b.fromVersion);

    // Verify continuity
    for (let i = 1; i < sorted.length; i++) {
      const currentPatch = sorted[i];
      const previousPatch = sorted[i - 1];
      if (currentPatch && previousPatch && currentPatch.fromVersion !== previousPatch.toVersion) {
        throw new Error('Patches are not continuous');
      }
    }

    // Combine operations
    const allOperations: PatchOperation[] = [];
    for (const patch of sorted) {
      allOperations.push(...patch.operations);
    }

    // Determine combined type
    const types = new Set(sorted.map((p) => p.type));
    const sortedFirst = sorted[0];
    const sortedLast = sorted[sorted.length - 1];
    if (!sortedFirst || !sortedLast) return null;
    const combinedType: PatchType = types.size > 1 ? 'mixed' : sortedFirst.type;

    return this.createPatch(
      sortedFirst.documentId,
      sortedFirst.fromVersion,
      sortedLast.toVersion,
      combinedType,
      allOperations
    );
  }

  /**
   * Optimize patch by removing redundant operations
   */
  optimizePatch(patch: Patch): Patch {
    const operationsByTarget = new Map<string, PatchOperation[]>();

    // Group operations by target and id/path
    for (const op of patch.operations) {
      const key = `${op.target}:${op.id || op.path || ''}`;
      if (!operationsByTarget.has(key)) {
        operationsByTarget.set(key, []);
      }
      operationsByTarget.get(key)!.push(op);
    }

    // Keep only the final state for each target
    const optimizedOps: PatchOperation[] = [];

    for (const [, ops] of operationsByTarget) {
      const lastOp = ops[ops.length - 1];
      if (!lastOp) continue;

      // If the sequence ends with delete, only keep delete
      if (lastOp.type === 'delete') {
        // Check if there was an add before delete - they cancel out
        const hasAdd = ops.some((op) => op.type === 'add');
        if (!hasAdd) {
          optimizedOps.push(lastOp);
        }
      } else {
        // Keep the final add or update
        optimizedOps.push(lastOp);
      }
    }

    return this.createPatch(
      patch.documentId,
      patch.fromVersion,
      patch.toVersion,
      patch.type,
      optimizedOps
    );
  }

  /**
   * Calculate patch size savings
   */
  calculateSavings(
    fullDataSize: number,
    patchSize: number
  ): { savedBytes: number; savedPercent: number } {
    const savedBytes = fullDataSize - patchSize;
    const savedPercent = (savedBytes / fullDataSize) * 100;

    return {
      savedBytes: Math.max(0, savedBytes),
      savedPercent: Math.max(0, savedPercent),
    };
  }
}

// Export singleton instance
export const patchGenerator = new PatchGenerator();
