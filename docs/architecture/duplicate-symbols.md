<!-- repo-map:no-verification -->
<!-- GENERATED FILE -- do not edit by hand.
     Regenerate with `repo-tools map`. -->

# Duplicate Symbols

Names that are OWN-DEFINED (not merely re-exported) by >= 2 distinct files across the monorepo, then CLASSIFIED (see `DupEntryTag`) so the actionable subset is clear: `TRUE_DUPLICATE` (real merge targets) vs `DISPATCH_VARIANT` (>=2 `mathTyped(...)` registrations of the same public name — distinct dispatch surfaces, Bucket C delegation candidates, not copy-paste bodies), `ALIAS_DELEGATION` (a `const X = importedY` forward, excluded once <2 real bodies remain), and `ALLOWLISTED` (matches `duplicate-allowlist.json`: hot-path `is*` guards, AssemblyScript mirrors, per-package `VERSION` strings).

> **Note:** This report groups names by OWN definition, not by call graph, then classifies each flagged name (see DupEntryTag): TRUE_DUPLICATE (the actionable merge targets), DISPATCH_VARIANT (>=2 mathTyped(...) registrations of the same public name — distinct dispatch surfaces, Bucket C delegation candidates, not copy-paste bodies), ALIAS_DELEGATION (a const-alias forward to an imported symbol, not an independent body — excluded once fewer than 2 real bodies remain), and ALLOWLISTED (matches duplicate-allowlist.json: hot-path is* guards, AssemblyScript mirrors, per-package VERSION strings). NOT detected: same-file typed-dispatch overload polymorphism for different argument shapes within one registration — a human still triages TRUE_DUPLICATE entries using the defining files + public flags before merging anything.

## Summary — runtime (function/constant/class)

| Category | Count |
| --- | --: |
| **TRUE_DUPLICATE** (actionable) | 76 |
| DISPATCH_VARIANT | 0 |
| ALIAS_DELEGATION | 0 |
| ALLOWLISTED | 0 |
| _Total flagged names_ | 76 |

## Summary — types (interface/type/enum)

| Category | Count |
| --- | --: |
| **TRUE_DUPLICATE** (actionable) | 98 |
| DISPATCH_VARIANT | 0 |
| ALIAS_DELEGATION | 0 |
| ALLOWLISTED | 0 |
| _Total flagged names_ | 98 |

## Runtime duplicates

### TRUE_DUPLICATE — actionable merge targets

| Name | Category | Defining files (package, public?, sub-tag) | Canonical hint |
| --- | --- | --- | --- |
| `OptionalModulePanel` | function | `src/modules/optional/entries/batch.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/comparison.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/enterprise.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/fileWatch.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/kiosk.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/lan.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/license.tsx` (unknown, internal, PLAIN)<br>`src/modules/optional/entries/scanner.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `exportToJSON` | function | `src/lib/comparison/reportGenerator.ts` (unknown, internal, PLAIN)<br>`src/lib/forms/exportImport.ts` (unknown, internal, PLAIN)<br>`src/lib/ocr/exportFormats.ts` (unknown, internal, PLAIN) | `internal-only` |
| `isFeatureAvailable` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/lib/license/featureGating.ts` (unknown, internal, PLAIN)<br>`src/lib/license/licenseValidator.ts` (unknown, internal, PLAIN) | `internal-only` |
| `mergeAnnotations` | function | `src/lib/annotations/serializer.ts` (unknown, internal, PLAIN)<br>`src/lib/fileWatch/statePreserver.ts` (unknown, internal, PLAIN)<br>`src/lib/offline/conflictResolver.ts` (unknown, internal, PLAIN) | `internal-only` |
| `unwatchAll` | function | `electron/fileWatcher.ts` (unknown, internal, PLAIN)<br>`electron/main/watcherService.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `unwatchFile` | function | `electron/fileWatcher.ts` (unknown, internal, PLAIN)<br>`electron/main/watcherService.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `watchFile` | function | `electron/fileWatcher.ts` (unknown, internal, PLAIN)<br>`electron/main/watcherService.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `Checkbox` | constant+function | `src/components/forms/Checkbox.tsx` (unknown, internal, PLAIN)<br>`src/components/ui/Checkbox.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `DRAWING_COLORS` | constant | `src/components/annotations/drawingColors.ts` (unknown, internal, PLAIN)<br>`src/constants/tools.ts` (unknown, internal, PLAIN) | `internal-only` |
| `HIGHLIGHT_COLORS` | constant | `src/components/annotations/SelectionPopup.tsx` (unknown, internal, PLAIN)<br>`src/constants/tools.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NOTE_COLORS` | constant | `src/components/annotations/StickyNote.tsx` (unknown, internal, PLAIN)<br>`src/constants/tools.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PageRangeSelector` | function | `src/components/ocr/PageRangeSelector.tsx` (unknown, internal, PLAIN)<br>`src/components/print/PageRangeSelector.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `PrintDialog` | class+function | `electron/main/print/printDialog.ts` (unknown, internal, PLAIN)<br>`src/components/print/PrintDialog.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `PrintPresetsManager` | class+function | `src/components/print/PrintPresetsManager.tsx` (unknown, internal, PLAIN)<br>`src/lib/print/presets.ts` (unknown, internal, PLAIN) | `internal-only` |
| `TemplateManager` | class+function | `src/components/batch/TemplateManager.tsx` (unknown, internal, PLAIN)<br>`src/lib/batch/templates.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateNotification` | function | `src/components/update/UpdateNotification.tsx` (unknown, internal, PLAIN)<br>`src/components/updates/UpdateNotification.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `addRecentFile` | function | `electron/recentFiles.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `bounceDock` | function | `electron/dock.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `canvasToBlob` | function | `src/lib/export/imageExport.ts` (unknown, internal, PLAIN)<br>`src/lib/signatures/imageProcessor.ts` (unknown, internal, PLAIN) | `internal-only` |
| `clearDockBadge` | function | `electron/dock.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `clearRecentFiles` | function | `electron/recentFiles.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `clearRecoveryFile` | function | `electron/autoSave.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `createBackup` | function | `electron/backup.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `decodeLicenseKey` | function | `src/lib/license/licenseFormat.ts` (unknown, internal, PLAIN)<br>`src/lib/license/licenseValidator.ts` (unknown, internal, PLAIN) | `internal-only` |
| `deleteBackup` | function | `electron/backup.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `disableAutoSave` | function | `electron/autoSave.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `downloadReport` | function | `src/lib/batch/errorReporter.ts` (unknown, internal, PLAIN)<br>`src/lib/comparison/reportGenerator.ts` (unknown, internal, PLAIN) | `internal-only` |
| `enableAutoSave` | function | `electron/autoSave.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `exportToHTML` | function | `src/lib/comparison/reportGenerator.ts` (unknown, internal, PLAIN)<br>`src/lib/ocr/exportFormats.ts` (unknown, internal, PLAIN) | `internal-only` |
| `fileExists` | function | `electron/shell.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `formatDate` | function | `src/lib/forms/formatting.ts` (unknown, internal, PLAIN)<br>`src/lib/signatures/dateUtils.ts` (unknown, internal, PLAIN) | `internal-only` |
| `formatShortcut` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/utils/platform.ts` (unknown, internal, PLAIN) | `internal-only` |
| `generateFileId` | function | `src/lib/batch/jobQueue.ts` (unknown, internal, PLAIN)<br>`src/lib/storage/fileHandler.ts` (unknown, internal, PLAIN) | `internal-only` |
| `generateReport` | function | `src/lib/comparison/reportGenerator.ts` (unknown, internal, PLAIN)<br>`src/lib/redaction/redactionEngine.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getAltKey` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/utils/platform.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getCrashDumpsDirectory` | function | `electron/crashReporter.ts` (unknown, internal, PLAIN)<br>`electron/windowsCrashReporter.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getDefaultPrinter` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getLocalCrashDumps` | function | `electron/crashReporter.ts` (unknown, internal, PLAIN)<br>`electron/windowsCrashReporter.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getPlatformInfo` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/utils/platform.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getPrinters` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getRecentFiles` | function | `electron/recentFiles.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getRecoveryFiles` | function | `electron/autoSave.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `getWatchedFiles` | function | `electron/fileWatcher.ts` (unknown, internal, PLAIN)<br>`electron/main/watcherService.ts` (unknown, internal, PLAIN) | `internal-only` |
| `isElectron` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/utils/platform.ts` (unknown, internal, PLAIN) | `internal-only` |
| `isMacOS` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/lib/enterprise/macPreferences.ts` (unknown, internal, PLAIN) | `internal-only` |
| `isWatching` | function | `electron/fileWatcher.ts` (unknown, internal, PLAIN)<br>`electron/main/watcherService.ts` (unknown, internal, PLAIN) | `internal-only` |
| `isWindows` | function | `src/lib/electron/platform.ts` (unknown, internal, PLAIN)<br>`src/lib/enterprise/registryAccess.ts` (unknown, internal, PLAIN) | `internal-only` |
| `listBackups` | function | `electron/backup.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `mergePdfs` | function | `src/lib/batch/operations/batchMerge.ts` (unknown, internal, PLAIN)<br>`src/lib/pages/mergePdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `openPdfFile` | function | `src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN)<br>`src/lib/storage/fileHandler.ts` (unknown, internal, PLAIN) | `internal-only` |
| `openWithDefaultApp` | function | `electron/shell.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `parseJSON` | function | `src/lib/enterprise/configParser.ts` (unknown, internal, PLAIN)<br>`src/lib/forms/exportImport.ts` (unknown, internal, PLAIN) | `internal-only` |
| `parsePageRange` | function | `src/lib/pages/splitPdf.ts` (unknown, internal, PLAIN)<br>`src/lib/print/pageRange.ts` (unknown, internal, PLAIN) | `internal-only` |
| `printPDFData` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `printPDFFile` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `printSilent` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `printWithDialog` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `removeRecentFile` | function | `electron/recentFiles.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `renderPageToCanvas` | function | `src/lib/export/imageExport.ts` (unknown, internal, PLAIN)<br>`src/lib/ocr/imagePreprocessor.ts` (unknown, internal, PLAIN) | `internal-only` |
| `restoreBackup` | function | `electron/backup.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN) | `internal-only` |
| `savePdfFile` | function | `src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN)<br>`src/lib/storage/fileHandler.ts` (unknown, internal, PLAIN) | `internal-only` |
| `savePdfFileAs` | function | `src/lib/electron/fileSystem.ts` (unknown, internal, PLAIN)<br>`src/lib/storage/fileHandler.ts` (unknown, internal, PLAIN) | `internal-only` |
| `savePrintPreview` | function | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `setDockBadge` | function | `electron/dock.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showBatchOperationNotification` | function | `electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showFileOperationNotification` | function | `electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showFolderPicker` | function | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showMessageBox` | function | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showNotification` | function | `electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/notifications.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showOpenDialog` | function | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `showSaveDialog` | function | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `updateJobStatus` | function | `src/lib/batch/jobPersistence.ts` (unknown, internal, PLAIN)<br>`src/lib/batch/jobQueue.ts` (unknown, internal, PLAIN) | `internal-only` |
| `useConnectionStatus` | function | `src/hooks/useConnectionStatus.ts` (unknown, internal, PLAIN)<br>`src/stores/lanStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `useFeatureEnabled` | function | `src/stores/enterprisePolicyStore.ts` (unknown, internal, PLAIN)<br>`src/stores/licenseStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `validateWatermarkOptions` | function | `src/lib/batch/operations/batchWatermark.ts` (unknown, internal, PLAIN)<br>`src/lib/batch/watermark.ts` (unknown, internal, PLAIN) | `internal-only` |
| `verifyChecksum` | function | `src/lib/license/licenseFormat.ts` (unknown, internal, PLAIN)<br>`src/lib/license/licenseValidator.ts` (unknown, internal, PLAIN) | `internal-only` |

### DISPATCH_VARIANT — distinct public typed-dispatch surfaces (Bucket C candidates)

_None._

### ALIAS_DELEGATION — const-alias forwards (not independent bodies)

_None._

### ALLOWLISTED — accepted layering (see duplicate-allowlist.json)

_None._

## Type duplicates (lower priority)

### TRUE_DUPLICATE

| Name | Category | Defining files (package, public?, sub-tag) | Canonical hint |
| --- | --- | --- | --- |
| `UpdateChannel` | type | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/main/updater.ts` (unknown, internal, PLAIN)<br>`server/update/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN)<br>`src/types/enterpriseConfig.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MergeResult` | interface | `src/lib/batch/operations/batchMerge.ts` (unknown, internal, PLAIN)<br>`src/lib/enterprise/configMerger.ts` (unknown, internal, PLAIN)<br>`src/lib/fileWatch/mergeStrategy.ts` (unknown, internal, PLAIN)<br>`src/lib/offline/conflictResolver.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/print/executePrint.ts` (unknown, internal, PLAIN) | `internal-only` |
| `Rect` | interface | `src/lib/comparison/types.ts` (unknown, internal, PLAIN)<br>`src/lib/redaction/types.ts` (unknown, internal, PLAIN)<br>`src/stores/formDesignerStore.ts` (unknown, internal, PLAIN)<br>`src/utils/coordinates.ts` (unknown, internal, PLAIN) | `internal-only` |
| `SaveDialogOptions` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `SaveDialogResult` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `CompressionResult` | interface | `src/lib/batch/operations/batchCompress.ts` (unknown, internal, PLAIN)<br>`src/lib/export/compressPdf.ts` (unknown, internal, PLAIN)<br>`src/lib/scanner/imageCompression.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ExtendedNotificationOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MemoryInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/lib/performance/memoryManager.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NotificationAction` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NotificationPreferences` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NotificationType` | type | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PageRange` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/batch/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PlatformInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN)<br>`src/utils/platform.ts` (unknown, internal, PLAIN) | `internal-only` |
| `Point` | interface | `src/lib/scanner/types.ts` (unknown, internal, PLAIN)<br>`src/stores/formDesignerStore.ts` (unknown, internal, PLAIN)<br>`src/utils/coordinates.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrinterInfo` | interface | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `QuietHoursConfig` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/notifications.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `RecentFile` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/lib/storage/indexeddb.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `TrayStatus` | type | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/tray.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateCheckFrequency` | type | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/main/updater.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateSettings` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/main/updater.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateState` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`electron/main/updater.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `AppPathInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `AutoSaveOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BackupInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BackupOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BatchOperationType` | type | `src/lib/batch/types.ts` (unknown, internal, PLAIN)<br>`src/types/batch.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BatchProgress` | interface | `src/lib/batch/types.ts` (unknown, internal, PLAIN)<br>`src/lib/ocr/batchOCR.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BindingEdge` | type | `src/components/print/BindingOptions.tsx` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BindingType` | type | `src/components/print/BindingOptions.tsx` (unknown, internal, PLAIN)<br>`src/lib/print/bookletLayout.ts` (unknown, internal, PLAIN) | `internal-only` |
| `BookletOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `CacheEntryMetadata` | interface | `src/lib/enterprise/configCache.ts` (unknown, internal, PLAIN)<br>`src/types/offline.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ChangeType` | type | `src/lib/comparison/types.ts` (unknown, internal, PLAIN)<br>`src/lib/fileWatch/changeDetector.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ConfigSource` | interface+type | `src/lib/enterprise/configDiscovery.ts` (unknown, internal, PLAIN)<br>`src/types/enterpriseConfig.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ConnectionStatus` | type | `src/stores/lanStore.ts` (unknown, internal, PLAIN)<br>`src/types/offline.ts` (unknown, internal, PLAIN) | `internal-only` |
| `DialogType` | type | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `DiscoveryOptions` | interface | `src/lib/enterprise/configDiscovery.ts` (unknown, internal, PLAIN)<br>`src/lib/lan/serviceDiscovery.ts` (unknown, internal, PLAIN) | `internal-only` |
| `DrawingPath` | interface | `src/types/annotations.ts` (unknown, internal, PLAIN)<br>`src/types/index.ts` (unknown, internal, PLAIN) | `internal-only` |
| `DuplexMode` | type | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ElectronAPI` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `EncryptionOptions` | interface | `src/lib/enterprise/configEncryption.ts` (unknown, internal, PLAIN)<br>`src/lib/security/hardwareEncryption.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FeatureId` | type | `src/lib/license/featureGating.ts` (unknown, internal, PLAIN)<br>`src/types/license.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileDialogOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileDialogResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileReadOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileReadResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileStats` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileWatcherEvent` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FileWriteResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FlattenOptions` | interface | `src/lib/batch/flatten.ts` (unknown, internal, PLAIN)<br>`src/lib/export/flattenPdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FolderDialogOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FolderDialogResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FolderEntry` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FolderListOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `FormField` | interface+type | `src/types/forms.ts` (unknown, internal, PLAIN)<br>`src/types/index.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ImpositionResult` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `KioskConfig` | interface | `src/types/enterpriseConfig.ts` (unknown, internal, PLAIN)<br>`src/types/kioskConfig.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MergeOptions` | interface | `src/lib/enterprise/configMerger.ts` (unknown, internal, PLAIN)<br>`src/lib/fileWatch/mergeStrategy.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MergeProgressCallback` | type | `src/lib/batch/operations/batchMerge.ts` (unknown, internal, PLAIN)<br>`src/lib/pages/mergePdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MessageBoxOptions` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MessageBoxResult` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MessageDialogOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `MessageDialogResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NUpOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NotificationHistory` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `NotificationOptions` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `OCRLanguage` | interface+type | `src/lib/ocr/types.ts` (unknown, internal, PLAIN)<br>`src/lib/scanner/types.ts` (unknown, internal, PLAIN) | `internal-only` |
| `OpenDialogOptions` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `OpenDialogResult` | interface | `electron/dialogs.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/dialogs.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PDFTextItem` | interface | `src/lib/fonts/fontMatcher.ts` (unknown, internal, PLAIN)<br>`src/types/pdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PagePosition` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PageRangeType` | type | `src/components/ocr/PageRangeSelector.tsx` (unknown, internal, PLAIN)<br>`src/components/print/PageRangeSelector.tsx` (unknown, internal, PLAIN) | `internal-only` |
| `PosterOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/imposition.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintAccessibilityOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/accessibility.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintJob` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintJobStatus` | type | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintMargins` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintPreset` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/stores/printStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintPreviewResult` | interface | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintRenderOptions` | interface | `src/lib/print/pdfRenderer.ts` (unknown, internal, PLAIN)<br>`src/lib/print/printRenderer.ts` (unknown, internal, PLAIN) | `internal-only` |
| `PrintResult` | interface | `electron/print.ts` (unknown, internal, PLAIN)<br>`src/lib/electron/print.ts` (unknown, internal, PLAIN) | `internal-only` |
| `QueueStatistics` | interface | `src/lib/print/printQueue.ts` (unknown, internal, PLAIN)<br>`src/types/batch.ts` (unknown, internal, PLAIN) | `internal-only` |
| `RecoveryFileInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `Release` | interface | `server/update/types.ts` (unknown, internal, PLAIN)<br>`src/lib/update/updateClient.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ReleaseFile` | interface | `server/update/types.ts` (unknown, internal, PLAIN)<br>`src/lib/update/updateClient.ts` (unknown, internal, PLAIN) | `internal-only` |
| `SafeStorageAPI` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ShortcutDefinition` | interface | `electron/shortcuts.ts` (unknown, internal, PLAIN)<br>`src/stores/shortcutsStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `SplitProgressCallback` | type | `src/lib/batch/operations/batchSplit.ts` (unknown, internal, PLAIN)<br>`src/lib/pages/splitPdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `SplitResult` | interface | `src/lib/batch/operations/batchSplit.ts` (unknown, internal, PLAIN)<br>`src/lib/pages/splitPdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `StampType` | type | `src/constants/stamps.ts` (unknown, internal, PLAIN)<br>`src/stores/annotationStore.ts` (unknown, internal, PLAIN) | `internal-only` |
| `TrayStatusInfo` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateCheckRequest` | interface | `server/update/types.ts` (unknown, internal, PLAIN)<br>`src/lib/update/updateClient.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateCheckResponse` | interface | `server/update/types.ts` (unknown, internal, PLAIN)<br>`src/lib/update/updateClient.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateCheckResult` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `UpdateDownloadProgress` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |
| `ViewMode` | type | `src/types/enterpriseConfig.ts` (unknown, internal, PLAIN)<br>`src/types/pdf.ts` (unknown, internal, PLAIN) | `internal-only` |
| `VirtualPrinterOptions` | interface | `electron/main/print/types.ts` (unknown, internal, PLAIN)<br>`src/lib/print/virtualPrinter.ts` (unknown, internal, PLAIN) | `internal-only` |
| `WindowBounds` | interface | `electron/ipc/types.ts` (unknown, internal, PLAIN)<br>`src/types/electronTypes.ts` (unknown, internal, PLAIN) | `internal-only` |

### DISPATCH_VARIANT

_None._

### ALIAS_DELEGATION

_None._

### ALLOWLISTED

_None._
