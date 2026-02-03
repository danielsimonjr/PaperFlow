/**
 * File Watch Module
 *
 * Exports all file watching functionality for document change detection,
 * smart reload, and conflict resolution.
 */

// Change detection
export {
  createDocumentSnapshot,
  detectChanges,
  getChangeDescription,
  getRecommendedAction,
  type ChangeType,
  type DocumentChange,
  type ChangeSummary,
  type DocumentSnapshot,
} from './changeDetector';

// Document diff
export {
  createDocumentDiff,
  getPageChangeIndicator,
  createChangeNavigationList,
  getDiffStatistics,
  type PageDiff,
  type DocumentDiff,
} from './documentDiff';

// Smart reload
export {
  captureUserState,
  adjustPageNumber,
  filterPreservableChanges,
  createReloadPlan,
  executeSmartReload,
  type UserState,
  type UnsavedChanges,
  type ReloadOptions,
  type ReloadResult,
} from './smartReload';

// State preserver
export {
  captureDocumentState,
  getStoredState,
  clearStoredState,
  clearAllStoredStates,
  hasStoredState,
  getStateAge,
  calculateScrollPositionForPage,
  adjustAnnotationPositions,
  mergeAnnotations,
  serializeState,
  deserializeState,
  persistState,
  loadPersistedState,
  removePersistedState,
  type DocumentStateSnapshot,
  type StatePreserverOptions,
} from './statePreserver';

// Conflict handler
export {
  detectConflicts,
  autoResolveConflicts,
  applyConflictResolutions,
  getConflictDescription,
  sortConflictsBySeverity,
  getUnresolvedConflicts,
  type MergeStrategy,
  type ConflictType,
  type Conflict,
  type ConflictResolutionResult,
} from './conflictHandler';

// Merge strategy
export {
  MERGE_STRATEGIES,
  getStrategyConfig,
  recommendStrategy,
  executeMerge,
  createMergeOptions,
  previewMerge,
  type MergeStrategyConfig,
  type MergeOptions,
  type MergeResult,
} from './mergeStrategy';

// Watch queue
export {
  initializeQueue,
  enqueueEvent,
  getQueueStats,
  getEventsForPath,
  cancelEventsForPath,
  cancelAllEvents,
  clearProcessedEvents,
  updateQueueConfig,
  getQueueConfig,
  pauseQueue,
  resumeQueue,
  shutdownQueue,
  isQueueEmpty,
  flushQueue,
  type EventPriority,
  type QueuedEvent,
  type EventBatch,
  type QueueConfig,
} from './watchQueue';
