# Unused Files and Exports Analysis

**Generated**: 2026-02-03

## Summary

- **Potentially unused files**: 137
- **Potentially unused exports**: 265

## Potentially Unused Files

These files are not imported by any other file in the codebase:

- `src/components/lazy/index.ts`
- `src/constants/config.ts`
- `src/constants/shortcuts.ts`
- `src/constants/stamps.ts`
- `src/constants/tools.ts`
- `src/constants/version.ts`
- `src/hooks/useAnnotationShortcuts.ts`
- `src/hooks/useAnnounce.ts`
- `src/hooks/useAutoSave.ts`
- `src/hooks/useBeforeUnload.ts`
- `src/hooks/useClipboard.ts`
- `src/hooks/useConnectionStatus.ts`
- `src/hooks/useDropZone.ts`
- `src/hooks/useFileSystem.ts`
- `src/hooks/useFormFields.ts`
- `src/hooks/useFormNavigation.ts`
- `src/hooks/useHighlightTool.ts`
- `src/hooks/useKeyboardNavigation.ts`
- `src/hooks/useOfflineData.ts`
- `src/hooks/useOfflineSync.ts`
- `src/hooks/usePageDrag.ts`
- `src/hooks/usePageSelection.ts`
- `src/hooks/usePlatform.ts`
- `src/hooks/usePointerInput.ts`
- `src/hooks/useSearch.ts`
- `src/hooks/useSignatureInput.ts`
- `src/hooks/useTextSelection.ts`
- `src/hooks/useThumbnails.ts`
- `src/hooks/useTouchGestures.ts`
- `src/hooks/useUnsavedChanges.ts`
- `src/hooks/useVirtualization.ts`
- `src/hooks/useVisiblePages.ts`
- `src/lib/annotations/drawingSerializer.ts`
- `src/lib/annotations/serializer.ts`
- `src/lib/batch/errorReporter.ts`
- `src/lib/batch/jobQueue.ts`
- `src/lib/batch/templates.ts`
- `src/lib/dev/hotReload.ts`
- `src/lib/electron/dialogs.ts`
- `src/lib/electron/print.ts`
- `src/lib/enterprise/configCache.ts`
- `src/lib/enterprise/configDiscovery.ts`
- `src/lib/enterprise/configEncryption.ts`
- `src/lib/enterprise/configPrecedence.ts`
- `src/lib/enterprise/configWatcher.ts`
- `src/lib/enterprise/envExpansion.ts`
- `src/lib/enterprise/policyMerger.ts`
- `src/lib/enterprise/remoteConfigLoader.ts`
- `src/lib/enterprise/secretsManager.ts`
- `src/lib/kiosk/kioskMode.ts`
- `src/lib/lan/serviceDiscovery.ts`
- `src/lib/license/expiryHandler.ts`
- `src/lib/license/featureGating.ts`
- `src/lib/license/licenseStorage.ts`
- `src/lib/license/licenseValidator.ts`
- `src/lib/license/signatureVerifier.ts`
- `src/lib/monitoring/releaseMetrics.ts`
- `src/lib/offline/backgroundSync.ts`
- `src/lib/offline/conflictResolver.ts`
- `src/lib/offline/offlineAvailability.ts`
- `src/lib/offline/patchGenerator.ts`
- `src/lib/offline/syncEngine.ts`
- `src/lib/pdf/renderer.ts`
- `src/lib/pdf/saver.ts`
- `src/lib/pdf/signatureEmbed.ts`
- `src/lib/pdf/textSaver.ts`
- `src/lib/print/accessibility.ts`
- `src/lib/print/bookletLayout.ts`
- `src/lib/print/colorManagement.ts`
- `src/lib/print/nupLayout.ts`
- `src/lib/print/pdfRenderer.ts`
- `src/lib/print/presets.ts`
- `src/lib/print/printQueue.ts`
- `src/lib/print/virtualPrinter.ts`
- `src/lib/scanner/documentDetection.ts`
- `src/lib/scanner/imageCompression.ts`
- `src/lib/scanner/perspectiveCorrection.ts`
- `src/lib/scanner/scannerProvider.ts`
- `src/lib/scanner/scanOcr.ts`
- `src/lib/scanner/scanProfiles.ts`
- `src/lib/scanner/scanToPdf.ts`
- `src/lib/security/assertion.ts`
- `src/lib/security/attestation.ts`
- `src/lib/security/fido2Server.ts`
- `src/lib/security/hardwareEncryption.ts`
- `src/lib/security/keyWrapping.ts`
- `src/lib/security/webauthnClient.ts`
- `src/lib/signatures/dateUtils.ts`
- `src/lib/signatures/fieldAlignment.ts`
- `src/lib/signatures/imageProcessor.ts`
- `src/lib/storage/fileHandler.ts`
- `src/lib/storage/formStorage.ts`
- `src/lib/storage/indexeddb.ts`
- `src/lib/storage/signatureStorage.ts`
- `src/lib/storage/stampStorage.ts`
- `src/lib/update/updateClient.ts`
- `src/stores/annotationStore.ts`
- `src/stores/batchStore.ts`
- `src/stores/comparisonStore.ts`
- `src/stores/documentStore.ts`
- `src/stores/enterprisePolicyStore.ts`
- `src/stores/fileWatchStore.ts`
- `src/stores/formDesignerStore.ts`
- `src/stores/formStore.ts`
- `src/stores/kioskStore.ts`
- `src/stores/lanStore.ts`
- `src/stores/licenseStore.ts`
- `src/stores/nativeBatchStore.ts`
- `src/stores/ocrStore.ts`
- `src/stores/offlineStore.ts`
- `src/stores/printStore.ts`
- `src/stores/recentFilesStore.ts`
- `src/stores/redactionStore.ts`
- `src/stores/scannerStore.ts`
- `src/stores/securityStore.ts`
- `src/stores/settingsStore.ts`
- `src/stores/shortcutsStore.ts`
- `src/stores/signatureStore.ts`
- `src/stores/textStore.ts`
- `src/stores/uiStore.ts`
- `src/stores/updateStore.ts`
- `src/sw.ts`
- `src/types/annotations.ts`
- `src/types/batch.ts`
- `src/types/electronTypes.ts`
- `src/types/enterpriseConfig.ts`
- `src/types/forms.ts`
- `src/types/kioskConfig.ts`
- `src/types/license.ts`
- `src/types/pdf.ts`
- `src/types/text.ts`
- `src/types/webauthn.ts`
- `src/utils/cn.ts`
- `src/utils/coordinates.ts`
- `src/utils/platform.ts`
- `src/vite-env.d.ts`
- `src/workers/thumbnailWorkerScript.ts`

## Potentially Unused Exports

These exports are not imported by any other file in the codebase:

### `src/lib/batch/batesNumber.ts`

- `BatesNumberOptions` (interface)
- `BatesState` (interface)
- `BatesPosition` (type)

### `src/lib/batch/errorHandler.ts`

- `isRecoverableError` (function)
- `parseError` (function)
- `createBatchFileError` (function)
- `handleError` (function)
- `calculateRetryDelay` (function)
- `createErrorCollector` (function)
- `BatchErrorCollector` (class)
- `ERROR_CODES` (constant)

### `src/lib/batch/flatten.ts`

- `FlattenOptions` (interface)
- `PageFlattenResult` (interface)
- `FlattenStats` (interface)
- `FlattenTarget` (type)

### `src/lib/batch/jobPersistence.ts`

- `saveJob` (function)
- `loadJob` (function)
- `loadAllJobs` (function)
- `loadJobsByStatus` (function)
- `deleteJob` (function)
- `deleteJobsByStatus` (function)
- `clearAllJobs` (function)
- `loadTemplate` (function)
- `loadTemplatesByType` (function)
- `isDatabaseAvailable` (function)
- `getDatabaseStats` (function)
- `loadIncompleteJobs` (function)
- `updateJobStatus` (function)

### `src/lib/batch/operations/batchCompress.ts`

- `CompressionResult` (interface)
- `CompressProgressCallback` (type)

### `src/lib/batch/operations/batchMerge.ts`

- `MergeResult` (interface)
- `MergeProgressCallback` (type)

### `src/lib/batch/operations/batchOCR.ts`

- `OCRFileResult` (interface)
- `OCRProgressCallback` (type)

### `src/lib/batch/operations/batchSplit.ts`

- `SplitResult` (interface)
- `SplitProgressCallback` (type)

### `src/lib/batch/operations/batchWatermark.ts`

- `WatermarkResult` (interface)
- `WatermarkProgressCallback` (type)

### `src/lib/batch/types.ts`

- `WatermarkPosition` (interface)
- `WatermarkTemplate` (interface)
- `WatermarkType` (type)

### `src/lib/comparison/types.ts`

- `VisualChange` (interface)
- `ComparisonViewMode` (type)
- `DiffTokenType` (type)

### `src/lib/enterprise/configMerger.ts`

- `createConfigMerger` (function)
- `mergeConfigs` (function)
- `ConfigMerger` (class)
- `TrackedConfig` (interface)
- `MergeOptions` (interface)
- `MergeResult` (interface)
- `MergeConflict` (interface)

### `src/lib/enterprise/configParser.ts`

- `parseYAML` (function)

### `src/lib/enterprise/gpoReader.ts`

- `GPOPolicyValue` (interface)
- `GPOApplicationSettings` (interface)
- `GPOSecuritySettings` (interface)
- `GPOFeatureSettings` (interface)
- `GPOUpdateSettings` (interface)
- `GPONetworkSettings` (interface)
- `GPOPerformanceSettings` (interface)

### `src/lib/enterprise/jsonConfigLoader.ts`

- `isJsonContent` (function)
- `extractJson` (function)
- `JsonLoaderOptions` (interface)
- `JsonLoadResult` (interface)
- `LoadError` (interface)
- `LoadWarning` (interface)

### `src/lib/enterprise/macPreferences.ts`

- `setMockPreferenceValue` (function)
- `getMockPreferenceValue` (function)
- `clearMockPreferences` (function)
- `setMockPreferences` (function)
- `PreferenceValue` (interface)
- `PREFERENCES_DOMAIN` (constant)

### `src/lib/enterprise/mdmReader.ts`

- `MDMPolicyValue` (interface)
- `MDMApplicationSettings` (interface)
- `MDMSecuritySettings` (interface)
- `MDMFeatureSettings` (interface)
- `MDMUpdateSettings` (interface)
- `MDMNetworkSettings` (interface)
- `MDMPerformanceSettings` (interface)
- `MDMAdminSettings` (interface)

### `src/lib/enterprise/registryAccess.ts`

- `setMockRegistryValue` (function)
- `getMockRegistryValue` (function)
- `clearMockRegistryValues` (function)
- `setMockRegistryValues` (function)
- `convertRegistryValue` (function)
- `RegistryValue` (interface)
- `RegistryReadOptions` (interface)
- `RegistryValueType` (type)

### `src/lib/enterprise/yamlConfigLoader.ts`

- `YamlLoaderOptions` (interface)
- `YamlLoadResult` (interface)
- `YamlLoadError` (interface)
- `YamlLoadWarning` (interface)

### `src/lib/export/compressPdf.ts`

- `CompressOptions` (interface)
- `CompressionResult` (interface)

### `src/lib/export/flattenPdf.ts`

- `FlattenOptions` (interface)

### `src/lib/export/imageExport.ts`

- `ImageExportOptions` (interface)
- `PageRenderer` (interface)
- `ImageFormat` (type)
- `ImageDpi` (type)

### `src/lib/export/pdfExport.ts`

- `PdfExportOptions` (interface)

### `src/lib/fileWatch/changeDetector.ts`

- `DocumentChange` (interface)
- `ChangeType` (type)

### `src/lib/fileWatch/conflictHandler.ts`

- `ConflictResolutionResult` (interface)
- `ConflictType` (type)

### `src/lib/fileWatch/documentDiff.ts`

- `PageDiff` (interface)

### `src/lib/fileWatch/mergeStrategy.ts`

- `MergeStrategyConfig` (interface)
- `MergeOptions` (interface)
- `MergeResult` (interface)

### `src/lib/fileWatch/smartReload.ts`

- `ReloadOptions` (interface)
- `ReloadResult` (interface)

### `src/lib/fileWatch/statePreserver.ts`

- `DocumentStateSnapshot` (interface)
- `StatePreserverOptions` (interface)

### `src/lib/fileWatch/watchQueue.ts`

- `QueuedEvent` (interface)
- `EventBatch` (interface)
- `QueueConfig` (interface)
- `EventPriority` (type)

### `src/lib/fonts/fontMatcher.ts`

- `PDFTextItem` (interface)
- `FontInfo` (interface)

### `src/lib/forms/calculations.ts`

- `CalculationDefinition` (interface)
- `CalculationResult` (interface)
- `CalculationOperator` (type)

### `src/lib/forms/conditionalLogic.ts`

- `Condition` (interface)
- `ConditionGroup` (interface)
- `ConditionalRule` (interface)
- `ActionDefinition` (interface)
- `ConditionalResult` (interface)
- `FieldStateChange` (interface)
- `ComparisonOperator` (type)
- `LogicalOperator` (type)
- `ConditionalAction` (type)

### `src/lib/forms/formActions.ts`

- `FormAction` (interface)
- `ActionContext` (interface)
- `ActionResult` (interface)
- `FieldChange` (interface)
- `ActionTrigger` (type)
- `BuiltInActionType` (type)

### `src/lib/forms/formatting.ts`

- `NumberFormatOptions` (interface)
- `DateFormatOptions` (interface)
- `TextFormatOptions` (interface)
- `NumberFormat` (type)
- `DateFormat` (type)
- `TextCase` (type)

### `src/lib/forms/formSubmit.ts`

- `SubmitConfig` (interface)
- `SubmitResult` (interface)
- `SubmitFieldValue` (interface)
- `PreSubmitValidation` (interface)
- `ResetConfig` (interface)
- `PrintConfig` (interface)
- `SubmitFormat` (type)
- `SubmitMethod` (type)

### `src/lib/forms/importData.ts`

- `ImportFormat` (type)

### `src/lib/forms/validation.ts`

- `FieldValidationResult` (interface)
- `FormValidationResult` (interface)

### `src/lib/license/hardwareFingerprint.ts`

- `serializeFingerprint` (function)
- `deserializeFingerprint` (function)
- `getShortFingerprintId` (function)
- `hasSignificantChange` (function)

### `src/lib/license/licenseBinding.ts`

- `generateBindingId` (function)
- `createLocalBinding` (function)
- `verifyLocalBinding` (function)
- `createActivationManager` (function)
- `ActivationManager` (class)
- `BindingResult` (interface)
- `ActivationResult` (interface)

### `src/lib/license/licenseFormat.ts`

- `encodeNumber` (function)
- `decodeNumber` (function)
- `calculateChecksum` (function)
- `verifyChecksum` (function)
- `formatLicenseKey` (function)
- `parseLicenseKey` (function)
- `encodeExpiry` (function)
- `decodeExpiry` (function)
- `encodeSeats` (function)
- `decodeSeats` (function)
- `generateSerialNumber` (function)
- `encodeLicenseData` (function)
- `getEditionFeatures` (function)
- `DecodedLicenseData` (interface)
- `LICENSE_PREFIXES` (constant)
- `LICENSE_TYPE_CODES` (constant)

### `src/lib/ocr/batchOCR.ts`

- `BatchPageResult` (interface)
- `BatchProgress` (interface)
- `BatchConfig` (interface)
- `BatchPageStatus` (type)
- `BatchProgressCallback` (type)
- `PageCompleteCallback` (type)

### `src/lib/ocr/exportFormats.ts`

- `ExportOptions` (interface)

### `src/lib/ocr/layoutAnalyzer.ts`

- `Column` (interface)
- `TableCell` (interface)
- `TextRegion` (interface)
- `ImageRegion` (interface)
- `Region` (interface)
- `LayoutConfig` (interface)

### `src/lib/ocr/textLayerEmbed.ts`

- `EmbedOptions` (interface)
- `EmbedResult` (interface)

### `src/lib/ocr/types.ts`

- `OCRStatus` (type)

### `src/lib/offline/deltaSync.ts`

- `applyDelta` (function)
- `createDeltaChunk` (function)
- `validateDeltaChunk` (function)
- `estimateDeltaSize` (function)
- `isDeltaSyncEfficient` (function)
- `splitDeltaIntoChunks` (function)
- `applyDeltaChunks` (function)
- `calculateSavings` (function)
- `DeltaSyncOptions` (interface)
- `PatchResult` (interface)

### `src/lib/offline/queueProcessor.ts`

- `QueueProcessorOptions` (interface)
- `QueueProcessorState` (interface)
- `OperationHandler` (type)

### `src/lib/offline/serviceWorkerConfig.ts`

- `generateCacheKey` (function)
- `getCacheEntryMetadata` (function)
- `getCacheStorageUsage` (function)
- `RouteConfig` (interface)
- `CachingStrategy` (type)
- `CACHE_EXPIRATION` (constant)
- `MAX_CACHE_ENTRIES` (constant)
- `URL_PATTERNS` (constant)

### `src/lib/performance/memoryManager.ts`

- `MemoryInfo` (interface)
- `MemoryWarning` (interface)

### `src/lib/print/executePrint.ts`

- `PrintOptions` (interface)

### `src/lib/print/imposition.ts`

- `PagePosition` (interface)
- `SheetSide` (interface)
- `ImpositionResult` (interface)
- `PosterOptions` (interface)
- `ImpositionType` (type)
- `BindingEdge` (type)
- `PageOrder` (type)

### `src/lib/redaction/types.ts`

- `RedactionStatus` (type)

### `src/lib/scanner/types.ts`

- `ScannerCapabilities` (interface)
- `ImageEnhancementOptions` (interface)
- `OCRSettings` (interface)
- `ScanColorMode` (type)
- `ScanResolution` (type)
- `ScanPaperSize` (type)
- `OCRLanguage` (type)

### `src/lib/security/webauthn.ts`

- `isConditionalMediationAvailable` (function)

### `src/types/index.ts`

- `DrawingPath` (interface)
- `PDFDocument` (interface)
- `Signature` (interface)
- `FormField` (interface)
- `HistoryEntry` (interface)
- `AnnotationType` (type)

### `src/types/offline.ts`

- `OfflineDocumentMetadata` (interface)
- `OfflineDocument` (interface)
- `EditHistoryEntry` (interface)
- `OfflineQueueItem` (interface)
- `SyncConflict` (interface)
- `DocumentVersion` (interface)
- `ConflictResolution` (interface)
- `MergeDetails` (interface)
- `DeltaSyncChunk` (interface)
- `DeltaOperation` (interface)
- `SyncProgress` (interface)
- `OfflineStorageStats` (interface)
- `OfflineAvailabilitySettings` (interface)
- `BackgroundSyncRegistration` (interface)
- `CacheEntryMetadata` (interface)
- `NetworkStatusInfo` (interface)
- `ConnectionStatus` (type)
- `SyncStatus` (type)
- `ConflictResolutionStrategy` (type)
- `SyncPriority` (type)
- `OfflineOperationType` (type)

### `src/workers/thumbnailWorker.ts`

- `createThumbnailWorkerClient` (function)
- `ThumbnailResponse` (interface)
- `ThumbnailWorkerMessage` (type)

