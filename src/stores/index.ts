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
export { useComparisonStore } from './comparisonStore';
export { useBatchStore } from './batchStore';

// Desktop Stores (Phase 3)
export { useRecentFilesStore } from './recentFilesStore';
export { useUpdateStore } from './updateStore';
export { useShortcutsStore } from './shortcutsStore';
export { useFileWatchStore } from './fileWatchStore';
export { useOfflineStore, initializeOfflineListeners } from './offlineStore';
export { useNativeBatchStore } from './nativeBatchStore';
export { usePrintStore } from './printStore';
export { useScannerStore } from './scannerStore';
export { useSecurityStore } from './securityStore';

// Enterprise Stores (Phase 3 Q4)
export { useEnterprisePolicyStore } from './enterprisePolicyStore';
export { useLicenseStore } from './licenseStore';
export { useLANStore } from './lanStore';
export { useKioskStore } from './kioskStore';
