/**
 * Stores Barrel Export
 *
 * Central export for all Zustand stores organized by phase.
 */

// Core Stores (Phase 1)
export { useDocumentStore } from './documentStore';
export { useAnnotationStore } from './annotationStore';
export { useHistoryStore } from './historyStore';
export { useUIStore } from './uiStore';
export { useSettingsStore } from './settingsStore';
export { useFormStore } from './formStore';
export { useSignatureStore } from './signatureStore';
export { useTextStore } from './textStore';

// Advanced Stores (Phase 2)
export { useOCRStore } from './ocrStore';
export { useFormDesignerStore } from './formDesignerStore';
export { useRedactionStore } from './redactionStore';

// Desktop Stores (Phase 3)
export { useRecentFilesStore } from './recentFilesStore';
export { useUpdateStore } from './updateStore';
export { useShortcutsStore } from './shortcutsStore';
export { useOfflineStore, initializeOfflineListeners } from './offlineStore';
export { usePrintStore } from './printStore';
export { useSecurityStore } from './securityStore';

// Optional modules (enterprise, license, kiosk, LAN, scanner, batch,
// comparison, file watch) load from src/modules/optional when a setting enables them.
