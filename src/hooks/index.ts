/**
 * Hooks Barrel Export
 *
 * Central export for all custom React hooks.
 */

// File & Document Hooks
export { useFileSystem } from './useFileSystem';
export { useAutoSave, useAutoSaveRecovery } from './useAutoSave';
export { useDropZone } from './useDropZone';
export { useBeforeUnload, useBeforeUnloadCallback } from './useBeforeUnload';
export { useUnsavedChanges } from './useUnsavedChanges';

// Viewer & Navigation Hooks
export { useVirtualization } from './useVirtualization';
export { useVisiblePages } from './useVisiblePages';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useTouchGestures } from './useTouchGestures';
export { useSearch } from './useSearch';

// Annotation Hooks
export { useAnnotationShortcuts } from './useAnnotationShortcuts';
export { useHighlightTool } from './useHighlightTool';
export { useTextSelection } from './useTextSelection';
export { usePointerInput } from './usePointerInput';

// Form Hooks
export { useFormFields } from './useFormFields';
export { useFormNavigation } from './useFormNavigation';

// Signature Hooks
export { useSignatureInput } from './useSignatureInput';

// Page Management Hooks
export { usePageSelection } from './usePageSelection';
export { usePageDrag } from './usePageDrag';
export { useThumbnails } from './useThumbnails';

// Utility Hooks
export { useClipboard, copyToClipboard } from './useClipboard';
export { useAnnounce } from './useAnnounce';
export { usePlatform } from './usePlatform';

// Offline Hooks (Phase 3)
export { useOfflineSync } from './useOfflineSync';
export { useOfflineData } from './useOfflineData';
export {
  useConnectionStatus,
  useIsOnline,
  useOnReconnect,
  useOnDisconnect,
} from './useConnectionStatus';
