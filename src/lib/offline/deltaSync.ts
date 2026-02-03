/**
 * Delta Sync for Large Documents
 *
 * Efficient delta sync that only transfers changed portions
 * of documents rather than full files.
 */

import type {
  DeltaSyncChunk,
  DeltaOperation,
} from '@/types/offline';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maximum chunk size in bytes (1MB)
 */
const MAX_CHUNK_SIZE = 1024 * 1024;

/**
 * Delta sync options
 */
export interface DeltaSyncOptions {
  maxChunkSize?: number;
  compressionEnabled?: boolean;
  checksumValidation?: boolean;
}

/**
 * Patch application result
 */
export interface PatchResult {
  success: boolean;
  newData?: ArrayBuffer;
  newVersion?: number;
  error?: string;
}

/**
 * Calculate delta between two ArrayBuffers
 */
export function calculateDelta(
  oldData: ArrayBuffer,
  newData: ArrayBuffer
): DeltaOperation[] {
  const operations: DeltaOperation[] = [];
  const oldView = new Uint8Array(oldData);
  const newView = new Uint8Array(newData);

  // Simple byte-by-byte comparison with run-length encoding
  let i = 0;
  let j = 0;

  while (i < oldView.length || j < newView.length) {
    if (i >= oldView.length) {
      // Remaining data is an insert at the end
      operations.push({
        type: 'insert',
        path: 'data',
        offset: i,
        data: Array.from(newView.slice(j)),
        timestamp: new Date(),
      });
      break;
    }

    if (j >= newView.length) {
      // Remaining old data needs to be deleted
      operations.push({
        type: 'delete',
        path: 'data',
        offset: i,
        length: oldView.length - i,
        timestamp: new Date(),
      });
      break;
    }

    if (oldView[i] === newView[j]) {
      // Bytes match, continue
      i++;
      j++;
      continue;
    }

    // Find the extent of the difference
    const diffStart = i;
    const newDiffStart = j;

    // Look ahead to find where they sync up again
    const syncPoint = findSyncPoint(oldView, newView, i, j);

    if (syncPoint) {
      // We found where they sync up
      const oldDiffEnd = syncPoint.oldIndex;
      const newDiffEnd = syncPoint.newIndex;

      if (newDiffEnd - newDiffStart > 0) {
        // There's new data to insert/replace
        if (oldDiffEnd - diffStart > 0) {
          // Replace operation
          operations.push({
            type: 'replace',
            path: 'data',
            offset: diffStart,
            length: oldDiffEnd - diffStart,
            data: Array.from(newView.slice(newDiffStart, newDiffEnd)),
            timestamp: new Date(),
          });
        } else {
          // Pure insert
          operations.push({
            type: 'insert',
            path: 'data',
            offset: diffStart,
            data: Array.from(newView.slice(newDiffStart, newDiffEnd)),
            timestamp: new Date(),
          });
        }
      } else if (oldDiffEnd - diffStart > 0) {
        // Pure delete
        operations.push({
          type: 'delete',
          path: 'data',
          offset: diffStart,
          length: oldDiffEnd - diffStart,
          timestamp: new Date(),
        });
      }

      i = oldDiffEnd;
      j = newDiffEnd;
    } else {
      // No sync point found, treat rest as replace
      operations.push({
        type: 'replace',
        path: 'data',
        offset: diffStart,
        length: oldView.length - diffStart,
        data: Array.from(newView.slice(newDiffStart)),
        timestamp: new Date(),
      });
      break;
    }
  }

  return operations;
}

/**
 * Find a sync point where old and new data match again
 */
function findSyncPoint(
  oldData: Uint8Array,
  newData: Uint8Array,
  oldStart: number,
  newStart: number
): { oldIndex: number; newIndex: number } | null {
  const WINDOW_SIZE = 8; // Look for 8 consecutive matching bytes
  const MAX_SEARCH = 1024; // Don't search more than 1KB ahead

  for (let i = oldStart + 1; i < Math.min(oldData.length, oldStart + MAX_SEARCH); i++) {
    for (let j = newStart + 1; j < Math.min(newData.length, newStart + MAX_SEARCH); j++) {
      let matches = true;
      for (let k = 0; k < WINDOW_SIZE && i + k < oldData.length && j + k < newData.length; k++) {
        if (oldData[i + k] !== newData[j + k]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return { oldIndex: i, newIndex: j };
      }
    }
  }

  return null;
}

/**
 * Apply delta operations to data
 */
export function applyDelta(
  data: ArrayBuffer,
  operations: DeltaOperation[]
): ArrayBuffer {
  let result = new Uint8Array(data);

  // Sort operations by offset in reverse order to apply from end to start
  // This prevents offset shifts from affecting later operations
  const sortedOps = [...operations].sort((a, b) => (b.offset ?? 0) - (a.offset ?? 0));

  for (const op of sortedOps) {
    const offset = op.offset ?? 0;

    switch (op.type) {
      case 'insert': {
        const insertData = new Uint8Array(op.data as number[]);
        const newResult = new Uint8Array(result.length + insertData.length);
        newResult.set(result.slice(0, offset));
        newResult.set(insertData, offset);
        newResult.set(result.slice(offset), offset + insertData.length);
        result = newResult;
        break;
      }

      case 'delete': {
        const length = op.length ?? 0;
        const newResult = new Uint8Array(result.length - length);
        newResult.set(result.slice(0, offset));
        newResult.set(result.slice(offset + length), offset);
        result = newResult;
        break;
      }

      case 'replace': {
        const length = op.length ?? 0;
        const replaceData = new Uint8Array(op.data as number[]);
        const newResult = new Uint8Array(result.length - length + replaceData.length);
        newResult.set(result.slice(0, offset));
        newResult.set(replaceData, offset);
        newResult.set(result.slice(offset + length), offset + replaceData.length);
        result = newResult;
        break;
      }

      case 'move': {
        // Move is delete + insert combined
        // Not implemented for binary data
        break;
      }
    }
  }

  return result.buffer;
}

/**
 * Create a delta sync chunk
 */
export function createDeltaChunk(
  documentId: string,
  fromVersion: number,
  toVersion: number,
  operations: DeltaOperation[]
): DeltaSyncChunk {
  const operationsJson = JSON.stringify(operations);
  const originalSize = operationsJson.length;

  // For now, we don't compress - could add compression later
  const compressedSize = originalSize;

  return {
    id: uuidv4(),
    documentId,
    fromVersion,
    toVersion,
    operations,
    checksum: generateSimpleChecksum(operationsJson),
    compressedSize,
    originalSize,
  };
}

/**
 * Generate a simple checksum
 */
function generateSimpleChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Validate delta chunk
 */
export function validateDeltaChunk(chunk: DeltaSyncChunk): boolean {
  const operationsJson = JSON.stringify(chunk.operations);
  const checksum = generateSimpleChecksum(operationsJson);
  return checksum === chunk.checksum;
}

/**
 * Estimate delta size
 */
export function estimateDeltaSize(
  oldData: ArrayBuffer,
  newData: ArrayBuffer
): number {
  const delta = calculateDelta(oldData, newData);
  return JSON.stringify(delta).length;
}

/**
 * Check if delta sync is efficient
 * Returns true if delta is smaller than full sync
 */
export function isDeltaSyncEfficient(
  oldData: ArrayBuffer,
  newData: ArrayBuffer,
  threshold: number = 0.5
): boolean {
  const deltaSize = estimateDeltaSize(oldData, newData);
  const fullSize = newData.byteLength;

  return deltaSize < fullSize * threshold;
}

/**
 * Split large delta into chunks
 */
export function splitDeltaIntoChunks(
  documentId: string,
  fromVersion: number,
  toVersion: number,
  operations: DeltaOperation[],
  maxChunkSize: number = MAX_CHUNK_SIZE
): DeltaSyncChunk[] {
  const chunks: DeltaSyncChunk[] = [];
  let currentOps: DeltaOperation[] = [];
  let currentSize = 0;
  let chunkFromVersion = fromVersion;

  for (const op of operations) {
    const opSize = JSON.stringify(op).length;

    if (currentSize + opSize > maxChunkSize && currentOps.length > 0) {
      // Create chunk from current operations
      const chunkToVersion = chunkFromVersion + 1;
      chunks.push(createDeltaChunk(documentId, chunkFromVersion, chunkToVersion, currentOps));

      // Reset for next chunk
      currentOps = [];
      currentSize = 0;
      chunkFromVersion = chunkToVersion;
    }

    currentOps.push(op);
    currentSize += opSize;
  }

  // Add final chunk
  if (currentOps.length > 0) {
    chunks.push(createDeltaChunk(documentId, chunkFromVersion, toVersion, currentOps));
  }

  return chunks;
}

/**
 * Apply multiple delta chunks
 */
export function applyDeltaChunks(
  data: ArrayBuffer,
  chunks: DeltaSyncChunk[]
): PatchResult {
  // Sort chunks by version
  const sortedChunks = [...chunks].sort((a, b) => a.fromVersion - b.fromVersion);

  let currentData = data;
  let currentVersion = sortedChunks[0]?.fromVersion ?? 0;

  for (const chunk of sortedChunks) {
    // Validate chunk
    if (!validateDeltaChunk(chunk)) {
      return {
        success: false,
        error: `Invalid checksum for chunk ${chunk.id}`,
      };
    }

    // Check version continuity
    if (chunk.fromVersion !== currentVersion) {
      return {
        success: false,
        error: `Version mismatch: expected ${currentVersion}, got ${chunk.fromVersion}`,
      };
    }

    try {
      currentData = applyDelta(currentData, chunk.operations);
      currentVersion = chunk.toVersion;
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply chunk ${chunk.id}: ${error}`,
      };
    }
  }

  return {
    success: true,
    newData: currentData,
    newVersion: currentVersion,
  };
}

/**
 * Calculate bandwidth savings
 */
export function calculateSavings(
  fullSize: number,
  deltaSize: number
): { savedBytes: number; savedPercent: number } {
  const savedBytes = fullSize - deltaSize;
  const savedPercent = (savedBytes / fullSize) * 100;

  return {
    savedBytes: Math.max(0, savedBytes),
    savedPercent: Math.max(0, savedPercent),
  };
}
