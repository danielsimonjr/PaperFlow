/**
 * Offline-First Architecture Types
 *
 * Type definitions for offline storage, sync, and conflict resolution.
 */

import type { Annotation } from './index';

/**
 * Connection status
 */
export type ConnectionStatus = 'online' | 'offline' | 'connecting';

/**
 * Sync status
 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'paused';

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy =
  | 'local-wins'
  | 'remote-wins'
  | 'newest-wins'
  | 'merge'
  | 'manual';

/**
 * Sync priority levels
 */
export type SyncPriority = 'high' | 'normal' | 'low';

/**
 * Operation types for offline queue
 */
export type OfflineOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'sync'
  | 'upload'
  | 'download';

/**
 * Offline document metadata
 */
export interface OfflineDocumentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  createdAt: Date;
  modifiedAt: Date;
  syncedAt: Date | null;
  version: number;
  checksum: string;
  isAvailableOffline: boolean;
  priority: SyncPriority;
  tags?: string[];
}

/**
 * Offline document with full data
 */
export interface OfflineDocument {
  id: string;
  metadata: OfflineDocumentMetadata;
  data: ArrayBuffer;
  annotations: Annotation[];
  editHistory: EditHistoryEntry[];
  formValues?: Record<string, unknown>;
}

/**
 * Edit history entry for tracking changes
 */
export interface EditHistoryEntry {
  id: string;
  timestamp: Date;
  type: 'annotation' | 'form' | 'page' | 'text' | 'signature';
  action: 'add' | 'update' | 'delete';
  payload: unknown;
  userId?: string;
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string;
  type: OfflineOperationType;
  documentId: string;
  payload: unknown;
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
  priority: SyncPriority;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
  lastAttempt?: Date;
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string;
  documentId: string;
  localVersion: DocumentVersion;
  remoteVersion: DocumentVersion;
  conflictType: 'content' | 'metadata' | 'annotation' | 'form';
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
}

/**
 * Document version for comparison
 */
export interface DocumentVersion {
  version: number;
  modifiedAt: Date;
  modifiedBy?: string;
  checksum: string;
  changes: EditHistoryEntry[];
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedBy?: string;
  resolvedAt: Date;
  resultingVersion: DocumentVersion;
  mergeDetails?: MergeDetails;
}

/**
 * Details about how a merge was performed
 */
export interface MergeDetails {
  localChangesKept: number;
  remoteChangesKept: number;
  conflictingChanges: number;
  autoMerged: boolean;
}

/**
 * Delta sync chunk for efficient updates
 */
export interface DeltaSyncChunk {
  id: string;
  documentId: string;
  fromVersion: number;
  toVersion: number;
  operations: DeltaOperation[];
  checksum: string;
  compressedSize: number;
  originalSize: number;
}

/**
 * Delta operation for incremental sync
 */
export interface DeltaOperation {
  type: 'insert' | 'delete' | 'replace' | 'move';
  path: string;
  offset?: number;
  length?: number;
  data?: unknown;
  timestamp: Date;
}

/**
 * Sync progress information
 */
export interface SyncProgress {
  documentsTotal: number;
  documentsSynced: number;
  bytesTotal: number;
  bytesTransferred: number;
  currentDocument?: string;
  startedAt: Date;
  estimatedCompletion?: Date;
}

/**
 * Offline storage statistics
 */
export interface OfflineStorageStats {
  totalDocuments: number;
  totalSize: number;
  availableSpace: number;
  usedSpace: number;
  quotaUsagePercent: number;
  oldestDocument?: OfflineDocumentMetadata;
  newestDocument?: OfflineDocumentMetadata;
}

/**
 * Offline availability settings for a document
 */
export interface OfflineAvailabilitySettings {
  documentId: string;
  isAvailableOffline: boolean;
  priority: SyncPriority;
  syncAnnotations: boolean;
  syncFormData: boolean;
  maxSyncAge?: number; // Max age in days before auto-removal
}

/**
 * Background sync registration
 */
export interface BackgroundSyncRegistration {
  tag: string;
  minInterval?: number;
  lastSync?: Date;
  nextSync?: Date;
}

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  url: string;
  cachedAt: Date;
  expiresAt?: Date;
  size: number;
  etag?: string;
  contentType?: string;
}

/**
 * Service worker message types
 */
export type ServiceWorkerMessageType =
  | 'SYNC_REQUESTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'CACHE_UPDATED'
  | 'OFFLINE_READY'
  | 'UPDATE_AVAILABLE';

/**
 * Service worker message
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  payload?: unknown;
  timestamp: Date;
}

/**
 * Network status information (for Electron)
 */
export interface NetworkStatusInfo {
  isOnline: boolean;
  connectionType?: 'wifi' | 'ethernet' | 'cellular' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  lastChecked: Date;
}
