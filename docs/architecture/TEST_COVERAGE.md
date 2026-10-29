<!-- repo-map:no-verification -->
<!-- GENERATED FILE -- do not edit by hand.
     Regenerate with `repo-tools map`. -->

# Test Coverage Analysis

## Summary

| Metric | Count |
|--------|-------|
| Total Source Files | 561 |
| Total Test Files | 196 |
| Source Files with Tests | 14 |
| Source Files without Tests | 547 |
| Coverage (raw, direct-import) | **2.5%** |
---

## Source Files Without Test Coverage

The following 547 source files are not directly imported by any test file:

### root/

- `cli/config-schema-check.ts` → Expected test: `tests/unit/root/config-schema-check.test.ts`
- `cli/validate-config.ts` → Expected test: `tests/unit/root/validate-config.test.ts`
- `electron/attention.ts` → Expected test: `tests/unit/root/attention.test.ts`
- `electron/autoSave.ts` → Expected test: `tests/unit/root/autoSave.test.ts`
- `electron/backup.ts` → Expected test: `tests/unit/root/backup.test.ts`
- `electron/clipboard.ts` → Expected test: `tests/unit/root/clipboard.test.ts`
- `electron/crashReporter.ts` → Expected test: `tests/unit/root/crashReporter.test.ts`
- `electron/dialogs.ts` → Expected test: `tests/unit/root/dialogs.test.ts`
- `electron/dock.ts` → Expected test: `tests/unit/root/dock.test.ts`
- `electron/fileAssociation.ts` → Expected test: `tests/unit/root/fileAssociation.test.ts`
- `electron/fileWatcher.ts` → Expected test: `tests/unit/root/fileWatcher.test.ts`
- `electron/jumpList.ts` → Expected test: `tests/unit/root/jumpList.test.ts`
- `electron/linuxLauncher.ts` → Expected test: `tests/unit/root/linuxLauncher.test.ts`
- `electron/menu.ts` → Expected test: `tests/unit/root/menu.test.ts`
- `electron/powerSave.ts` → Expected test: `tests/unit/root/powerSave.test.ts`
- `electron/print.ts` → Expected test: `tests/unit/root/print.test.ts`
- `electron/protocol.ts` → Expected test: `tests/unit/root/protocol.test.ts`
- `electron/recentFiles.ts` → Expected test: `tests/unit/root/recentFiles.test.ts`
- `electron/secureStorage.ts` → Expected test: `tests/unit/root/secureStorage.test.ts`
- `electron/shell.ts` → Expected test: `tests/unit/root/shell.test.ts`
- `electron/startup.ts` → Expected test: `tests/unit/root/startup.test.ts`
- `electron/taskbarOverlay.ts` → Expected test: `tests/unit/root/taskbarOverlay.test.ts`
- `electron/taskbarProgress.ts` → Expected test: `tests/unit/root/taskbarProgress.test.ts`
- `electron/thumbnailToolbar.ts` → Expected test: `tests/unit/root/thumbnailToolbar.test.ts`
- `electron/trayMenu.ts` → Expected test: `tests/unit/root/trayMenu.test.ts`
- `electron/windowsCrashReporter.ts` → Expected test: `tests/unit/root/windowsCrashReporter.test.ts`
- `public/pdf.worker.min.js` → Expected test: `tests/unit/root/pdf.worker.min.js.test.ts`
- `src/App.tsx` → Expected test: `tests/unit/root/App.tsx.test.ts`
- `src/main.tsx` → Expected test: `tests/unit/root/main.tsx.test.ts`
- `src/sw.ts` → Expected test: `tests/unit/root/sw.test.ts`

### ipc/

- `electron/ipc/clipboardHandlers.ts` → Expected test: `tests/unit/ipc/clipboardHandlers.test.ts`
- `electron/ipc/dialogHandlers.ts` → Expected test: `tests/unit/ipc/dialogHandlers.test.ts`
- `electron/ipc/fileWatchIPC.ts` → Expected test: `tests/unit/ipc/fileWatchIPC.test.ts`
- `electron/ipc/handlers.ts` → Expected test: `tests/unit/ipc/handlers.test.ts`
- `electron/ipc/menuHandlers.ts` → Expected test: `tests/unit/ipc/menuHandlers.test.ts`
- `electron/ipc/notificationHandlers.ts` → Expected test: `tests/unit/ipc/notificationHandlers.test.ts`
- `electron/ipc/printHandlers.ts` → Expected test: `tests/unit/ipc/printHandlers.test.ts`
- `electron/ipc/shellHandlers.ts` → Expected test: `tests/unit/ipc/shellHandlers.test.ts`
- `electron/ipc/storageHandlers.ts` → Expected test: `tests/unit/ipc/storageHandlers.test.ts`

### main/

- `electron/main/fileLock.ts` → Expected test: `tests/unit/main/fileLock.test.ts`
- `electron/main/folderWatcher.ts` → Expected test: `tests/unit/main/folderWatcher.test.ts`
- `electron/main/index.ts` → Expected test: `tests/unit/main/index.test.ts`
- `electron/main/lifecycle.ts` → Expected test: `tests/unit/main/lifecycle.test.ts`
- `electron/main/networkStatus.ts` → Expected test: `tests/unit/main/networkStatus.test.ts`
- `electron/main/print/printDialog.ts` → Expected test: `tests/unit/main/printDialog.test.ts`
- `electron/main/print/printerCapabilities.ts` → Expected test: `tests/unit/main/printerCapabilities.test.ts`
- `electron/main/print/printerDiscovery.ts` → Expected test: `tests/unit/main/printerDiscovery.test.ts`
- `electron/main/print/printerManager.ts` → Expected test: `tests/unit/main/printerManager.test.ts`
- `electron/main/print/printerMonitor.ts` → Expected test: `tests/unit/main/printerMonitor.test.ts`
- `electron/main/print/silentPrint.ts` → Expected test: `tests/unit/main/silentPrint.test.ts`
- `electron/main/print/spoolerIntegration.ts` → Expected test: `tests/unit/main/spoolerIntegration.test.ts`
- `electron/main/print/types.ts` → Expected test: `tests/unit/main/types.test.ts`
- `electron/main/scanner/scannerBridge.ts` → Expected test: `tests/unit/main/scannerBridge.test.ts`
- `electron/main/security/webauthnBridge.ts` → Expected test: `tests/unit/main/webauthnBridge.test.ts`
- `electron/main/updater.ts` → Expected test: `tests/unit/main/updater.test.ts`
- `electron/main/updates/differential.ts` → Expected test: `tests/unit/main/differential.test.ts`
- `electron/main/watcherOptimizations.ts` → Expected test: `tests/unit/main/watcherOptimizations.test.ts`
- `electron/main/watcherService.ts` → Expected test: `tests/unit/main/watcherService.test.ts`

### preload/

- `electron/preload/index.ts` → Expected test: `tests/unit/preload/index.test.ts`
- `electron/preload/networkPreload.ts` → Expected test: `tests/unit/preload/networkPreload.test.ts`
- `electron/preload/webauthnPreload.ts` → Expected test: `tests/unit/preload/webauthnPreload.test.ts`

### touchbar/

- `electron/touchbar/touchBarManager.ts` → Expected test: `tests/unit/touchbar/touchBarManager.test.ts`

### workers/

- `electron/workers/pdfWorker.ts` → Expected test: `tests/unit/workers/pdfWorker.test.ts`
- `electron/workers/workerManager.ts` → Expected test: `tests/unit/workers/workerManager.test.ts`
- `electron/workers/workerPool.ts` → Expected test: `tests/unit/workers/workerPool.test.ts`
- `src/workers/thumbnailWorker.ts` → Expected test: `tests/unit/workers/thumbnailWorker.test.ts`
- `src/workers/thumbnailWorkerScript.ts` → Expected test: `tests/unit/workers/thumbnailWorkerScript.test.ts`

### update/

- `server/update/types.ts` → Expected test: `tests/unit/update/types.test.ts`

### components/

- `src/components/accessibility/AccessibilityPanel.tsx` → Expected test: `tests/unit/components/AccessibilityPanel.tsx.test.ts`
- `src/components/accessibility/AccessibilityReport.tsx` → Expected test: `tests/unit/components/AccessibilityReport.tsx.test.ts`
- `src/components/accessibility/IssueList.tsx` → Expected test: `tests/unit/components/IssueList.tsx.test.ts`
- `src/components/accessibility/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/annotations/AnnotationLayer.tsx` → Expected test: `tests/unit/components/AnnotationLayer.tsx.test.ts`
- `src/components/annotations/AnnotationProperties.tsx` → Expected test: `tests/unit/components/AnnotationProperties.tsx.test.ts`
- `src/components/annotations/ArrowTool.tsx` → Expected test: `tests/unit/components/ArrowTool.tsx.test.ts`
- `src/components/annotations/CustomStampDialog.tsx` → Expected test: `tests/unit/components/CustomStampDialog.tsx.test.ts`
- `src/components/annotations/DrawingAnnotation.tsx` → Expected test: `tests/unit/components/DrawingAnnotation.tsx.test.ts`
- `src/components/annotations/DrawingCanvas.tsx` → Expected test: `tests/unit/components/DrawingCanvas.tsx.test.ts`
- `src/components/annotations/DrawingToolOptions.tsx` → Expected test: `tests/unit/components/DrawingToolOptions.tsx.test.ts`
- `src/components/annotations/EllipseTool.tsx` → Expected test: `tests/unit/components/EllipseTool.tsx.test.ts`
- `src/components/annotations/EraserTool.tsx` → Expected test: `tests/unit/components/EraserTool.tsx.test.ts`
- `src/components/annotations/ExportImportDialog.tsx` → Expected test: `tests/unit/components/ExportImportDialog.tsx.test.ts`
- `src/components/annotations/Highlight.tsx` → Expected test: `tests/unit/components/Highlight.tsx.test.ts`
- `src/components/annotations/HighlightTool.tsx` → Expected test: `tests/unit/components/HighlightTool.tsx.test.ts`
- `src/components/annotations/LineTool.tsx` → Expected test: `tests/unit/components/LineTool.tsx.test.ts`
- `src/components/annotations/NoteReplies.tsx` → Expected test: `tests/unit/components/NoteReplies.tsx.test.ts`
- `src/components/annotations/NoteTool.tsx` → Expected test: `tests/unit/components/NoteTool.tsx.test.ts`
- `src/components/annotations/OpacitySlider.tsx` → Expected test: `tests/unit/components/OpacitySlider.tsx.test.ts`
- `src/components/annotations/RectangleTool.tsx` → Expected test: `tests/unit/components/RectangleTool.tsx.test.ts`
- `src/components/annotations/ResizeHandles.tsx` → Expected test: `tests/unit/components/ResizeHandles.tsx.test.ts`
- `src/components/annotations/RotationHandle.tsx` → Expected test: `tests/unit/components/RotationHandle.tsx.test.ts`
- `src/components/annotations/SelectionPopup.tsx` → Expected test: `tests/unit/components/SelectionPopup.tsx.test.ts`
- `src/components/annotations/ShapeAnnotation.tsx` → Expected test: `tests/unit/components/ShapeAnnotation.tsx.test.ts`
- `src/components/annotations/ShapeOptions.tsx` → Expected test: `tests/unit/components/ShapeOptions.tsx.test.ts`
- `src/components/annotations/ShapeOverlay.tsx` → Expected test: `tests/unit/components/ShapeOverlay.tsx.test.ts`
- `src/components/annotations/StampPicker.tsx` → Expected test: `tests/unit/components/StampPicker.tsx.test.ts`
- `src/components/annotations/StampTool.tsx` → Expected test: `tests/unit/components/StampTool.tsx.test.ts`
- `src/components/annotations/StampTransform.tsx` → Expected test: `tests/unit/components/StampTransform.tsx.test.ts`
- `src/components/annotations/StickyNote.tsx` → Expected test: `tests/unit/components/StickyNote.tsx.test.ts`
- `src/components/annotations/Strikethrough.tsx` → Expected test: `tests/unit/components/Strikethrough.tsx.test.ts`
- `src/components/annotations/Underline.tsx` → Expected test: `tests/unit/components/Underline.tsx.test.ts`
- `src/components/annotations/drawingColors.ts` → Expected test: `tests/unit/components/drawingColors.test.ts`
- `src/components/annotations/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/batch/BatchDashboard.tsx` → Expected test: `tests/unit/components/BatchDashboard.tsx.test.ts`
- `src/components/batch/BatchPanel.tsx` → Expected test: `tests/unit/components/BatchPanel.tsx.test.ts`
- `src/components/batch/BatchSummary.tsx` → Expected test: `tests/unit/components/BatchSummary.tsx.test.ts`
- `src/components/batch/BatchWizard.tsx` → Expected test: `tests/unit/components/BatchWizard.tsx.test.ts`
- `src/components/batch/BatesNumberDialog.tsx` → Expected test: `tests/unit/components/BatesNumberDialog.tsx.test.ts`
- `src/components/batch/FlattenDialog.tsx` → Expected test: `tests/unit/components/FlattenDialog.tsx.test.ts`
- `src/components/batch/HeaderFooterDialog.tsx` → Expected test: `tests/unit/components/HeaderFooterDialog.tsx.test.ts`
- `src/components/batch/TemplateManager.tsx` → Expected test: `tests/unit/components/TemplateManager.tsx.test.ts`
- `src/components/batch/WatermarkDialog.tsx` → Expected test: `tests/unit/components/WatermarkDialog.tsx.test.ts`
- `src/components/batch/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/comparison/ComparisonDialog.tsx` → Expected test: `tests/unit/components/ComparisonDialog.tsx.test.ts`
- `src/components/comparison/ComparisonReport.tsx` → Expected test: `tests/unit/components/ComparisonReport.tsx.test.ts`
- `src/components/comparison/OverlayView.tsx` → Expected test: `tests/unit/components/OverlayView.tsx.test.ts`
- `src/components/comparison/SideBySideView.tsx` → Expected test: `tests/unit/components/SideBySideView.tsx.test.ts`
- `src/components/comparison/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/editor/AlignmentPicker.tsx` → Expected test: `tests/unit/components/AlignmentPicker.tsx.test.ts`
- `src/components/editor/FontPicker.tsx` → Expected test: `tests/unit/components/FontPicker.tsx.test.ts`
- `src/components/editor/FontSizePicker.tsx` → Expected test: `tests/unit/components/FontSizePicker.tsx.test.ts`
- `src/components/editor/InlineTextEditor.tsx` → Expected test: `tests/unit/components/InlineTextEditor.tsx.test.ts`
- `src/components/editor/LineSpacing.tsx` → Expected test: `tests/unit/components/LineSpacing.tsx.test.ts`
- `src/components/editor/RichTextToolbar.tsx` → Expected test: `tests/unit/components/RichTextToolbar.tsx.test.ts`
- `src/components/editor/TextBoxTool.tsx` → Expected test: `tests/unit/components/TextBoxTool.tsx.test.ts`
- `src/components/editor/TextBoxTransform.tsx` → Expected test: `tests/unit/components/TextBoxTransform.tsx.test.ts`
- `src/components/editor/TextColorPicker.tsx` → Expected test: `tests/unit/components/TextColorPicker.tsx.test.ts`
- `src/components/editor/TextProperties.tsx` → Expected test: `tests/unit/components/TextProperties.tsx.test.ts`
- `src/components/editor/TextSelector.tsx` → Expected test: `tests/unit/components/TextSelector.tsx.test.ts`
- `src/components/editor/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/enterprise/ConfigExportDialog.tsx` → Expected test: `tests/unit/components/ConfigExportDialog.tsx.test.ts`
- `src/components/enterprise/ConfigSourceBadge.tsx` → Expected test: `tests/unit/components/ConfigSourceBadge.tsx.test.ts`
- `src/components/enterprise/ConfigurationViewer.tsx` → Expected test: `tests/unit/components/ConfigurationViewer.tsx.test.ts`
- `src/components/enterprise/LockedSettingBadge.tsx` → Expected test: `tests/unit/components/LockedSettingBadge.tsx.test.ts`
- `src/components/enterprise/PolicyStatusIndicator.tsx` → Expected test: `tests/unit/components/PolicyStatusIndicator.tsx.test.ts`
- `src/components/export/CompressDialog.tsx` → Expected test: `tests/unit/components/CompressDialog.tsx.test.ts`
- `src/components/export/ImageExportDialog.tsx` → Expected test: `tests/unit/components/ImageExportDialog.tsx.test.ts`
- `src/components/export/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/fileWatch/ChangePreview.tsx` → Expected test: `tests/unit/components/ChangePreview.tsx.test.ts`
- `src/components/fileWatch/DocumentCompare.tsx` → Expected test: `tests/unit/components/DocumentCompare.tsx.test.ts`
- `src/components/fileWatch/ExternalChangeNotification.tsx` → Expected test: `tests/unit/components/ExternalChangeNotification.tsx.test.ts`
- `src/components/fileWatch/FileLockNotification.tsx` → Expected test: `tests/unit/components/FileLockNotification.tsx.test.ts`
- `src/components/fileWatch/WatchStatusIndicator.tsx` → Expected test: `tests/unit/components/WatchStatusIndicator.tsx.test.ts`
- `src/components/forms/Checkbox.tsx` → Expected test: `tests/unit/components/Checkbox.tsx.test.ts`
- `src/components/forms/Dropdown.tsx` → Expected test: `tests/unit/components/Dropdown.tsx.test.ts`
- `src/components/forms/FieldError.tsx` → Expected test: `tests/unit/components/FieldError.tsx.test.ts`
- `src/components/forms/FormActions.tsx` → Expected test: `tests/unit/components/FormActions.tsx.test.ts`
- `src/components/forms/FormFieldRenderer.tsx` → Expected test: `tests/unit/components/FormFieldRenderer.tsx.test.ts`
- `src/components/forms/FormLayer.tsx` → Expected test: `tests/unit/components/FormLayer.tsx.test.ts`
- `src/components/forms/RadioButton.tsx` → Expected test: `tests/unit/components/RadioButton.tsx.test.ts`
- `src/components/forms/TextField.tsx` → Expected test: `tests/unit/components/TextField.tsx.test.ts`
- `src/components/forms/designer/DesignCanvas.tsx` → Expected test: `tests/unit/components/DesignCanvas.tsx.test.ts`
- `src/components/forms/designer/DesignerToolbar.tsx` → Expected test: `tests/unit/components/DesignerToolbar.tsx.test.ts`
- `src/components/forms/designer/FieldPalette.tsx` → Expected test: `tests/unit/components/FieldPalette.tsx.test.ts`
- `src/components/forms/designer/FieldPreview.tsx` → Expected test: `tests/unit/components/FieldPreview.tsx.test.ts`
- `src/components/forms/designer/FieldProperties.tsx` → Expected test: `tests/unit/components/FieldProperties.tsx.test.ts`
- `src/components/forms/designer/FormDesigner.tsx` → Expected test: `tests/unit/components/FormDesigner.tsx.test.ts`
- `src/components/forms/designer/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/forms/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/help/KeyboardShortcutsDialog.tsx` → Expected test: `tests/unit/components/KeyboardShortcutsDialog.tsx.test.ts`
- `src/components/home/RecentFiles.tsx` → Expected test: `tests/unit/components/RecentFiles.tsx.test.ts`
- `src/components/kiosk/KioskHeader.tsx` → Expected test: `tests/unit/components/KioskHeader.tsx.test.ts`
- `src/components/kiosk/KioskShell.tsx` → Expected test: `tests/unit/components/KioskShell.tsx.test.ts`
- `src/components/kiosk/KioskToolbar.tsx` → Expected test: `tests/unit/components/KioskToolbar.tsx.test.ts`
- `src/components/layout/AppLayout.tsx` → Expected test: `tests/unit/components/AppLayout.tsx.test.ts`
- `src/components/layout/Header.tsx` → Expected test: `tests/unit/components/Header.tsx.test.ts`
- `src/components/layout/MobileToolbar.tsx` → Expected test: `tests/unit/components/MobileToolbar.tsx.test.ts`
- `src/components/layout/Sidebar.tsx` → Expected test: `tests/unit/components/Sidebar.tsx.test.ts`
- `src/components/layout/TitleBar.tsx` → Expected test: `tests/unit/components/TitleBar.tsx.test.ts`
- `src/components/layout/Toolbar.tsx` → Expected test: `tests/unit/components/Toolbar.tsx.test.ts`
- `src/components/lazy/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/ocr/BatchOCRProgress.tsx` → Expected test: `tests/unit/components/BatchOCRProgress.tsx.test.ts`
- `src/components/ocr/LanguageSelector.tsx` → Expected test: `tests/unit/components/LanguageSelector.tsx.test.ts`
- `src/components/ocr/OCRDialog.tsx` → Expected test: `tests/unit/components/OCRDialog.tsx.test.ts`
- `src/components/ocr/OCRExportDialog.tsx` → Expected test: `tests/unit/components/OCRExportDialog.tsx.test.ts`
- `src/components/ocr/OCRProgress.tsx` → Expected test: `tests/unit/components/OCRProgress.tsx.test.ts`
- `src/components/ocr/OCRResultsPanel.tsx` → Expected test: `tests/unit/components/OCRResultsPanel.tsx.test.ts`
- `src/components/ocr/PageRangeSelector.tsx` → Expected test: `tests/unit/components/PageRangeSelector.tsx.test.ts`
- `src/components/ocr/PreprocessingOptions.tsx` → Expected test: `tests/unit/components/PreprocessingOptions.tsx.test.ts`
- `src/components/ocr/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/offline/ConflictDialog.tsx` → Expected test: `tests/unit/components/ConflictDialog.tsx.test.ts`
- `src/components/offline/OfflineBanner.tsx` → Expected test: `tests/unit/components/OfflineBanner.tsx.test.ts`
- `src/components/offline/OfflineIndicator.tsx` → Expected test: `tests/unit/components/OfflineIndicator.tsx.test.ts`
- `src/components/offline/OfflineSettings.tsx` → Expected test: `tests/unit/components/OfflineSettings.tsx.test.ts`
- `src/components/offline/SyncStatusPanel.tsx` → Expected test: `tests/unit/components/SyncStatusPanel.tsx.test.ts`
- `src/components/offline/VersionCompare.tsx` → Expected test: `tests/unit/components/VersionCompare.tsx.test.ts`
- `src/components/pages/DraggableThumbnail.tsx` → Expected test: `tests/unit/components/DraggableThumbnail.tsx.test.ts`
- `src/components/pages/InsertPageDialog.tsx` → Expected test: `tests/unit/components/InsertPageDialog.tsx.test.ts`
- `src/components/pages/MergeDialog.tsx` → Expected test: `tests/unit/components/MergeDialog.tsx.test.ts`
- `src/components/pages/MoveToDialog.tsx` → Expected test: `tests/unit/components/MoveToDialog.tsx.test.ts`
- `src/components/pages/PageContextMenu.tsx` → Expected test: `tests/unit/components/PageContextMenu.tsx.test.ts`
- `src/components/pages/RotateMenu.tsx` → Expected test: `tests/unit/components/RotateMenu.tsx.test.ts`
- `src/components/pages/SplitDialog.tsx` → Expected test: `tests/unit/components/SplitDialog.tsx.test.ts`
- `src/components/pages/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/print/AccessibilityOptions.tsx` → Expected test: `tests/unit/components/AccessibilityOptions.tsx.test.ts`
- `src/components/print/AdvancedPrintSettings.tsx` → Expected test: `tests/unit/components/AdvancedPrintSettings.tsx.test.ts`
- `src/components/print/BindingOptions.tsx` → Expected test: `tests/unit/components/BindingOptions.tsx.test.ts`
- `src/components/print/BookletWizard.tsx` → Expected test: `tests/unit/components/BookletWizard.tsx.test.ts`
- `src/components/print/MarginEditor.tsx` → Expected test: `tests/unit/components/MarginEditor.tsx.test.ts`
- `src/components/print/OrientationOptions.tsx` → Expected test: `tests/unit/components/OrientationOptions.tsx.test.ts`
- `src/components/print/PageLayout.tsx` → Expected test: `tests/unit/components/PageLayout.tsx.test.ts`
- `src/components/print/PageRangeSelector.tsx` → Expected test: `tests/unit/components/PageRangeSelector.tsx.test.ts`
- `src/components/print/PrintDialog.tsx` → Expected test: `tests/unit/components/PrintDialog.tsx.test.ts`
- `src/components/print/PrintPresetsManager.tsx` → Expected test: `tests/unit/components/PrintPresetsManager.tsx.test.ts`
- `src/components/print/PrintPreview.tsx` → Expected test: `tests/unit/components/PrintPreview.tsx.test.ts`
- `src/components/print/PrintPreviewEnhanced.tsx` → Expected test: `tests/unit/components/PrintPreviewEnhanced.tsx.test.ts`
- `src/components/print/PrintQualitySelector.tsx` → Expected test: `tests/unit/components/PrintQualitySelector.tsx.test.ts`
- `src/components/print/PrinterStatus.tsx` → Expected test: `tests/unit/components/PrinterStatus.tsx.test.ts`
- `src/components/print/ScaleOptions.tsx` → Expected test: `tests/unit/components/ScaleOptions.tsx.test.ts`
- `src/components/print/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/redaction/PatternSearchDialog.tsx` → Expected test: `tests/unit/components/PatternSearchDialog.tsx.test.ts`
- `src/components/redaction/RedactionToolbar.tsx` → Expected test: `tests/unit/components/RedactionToolbar.tsx.test.ts`
- `src/components/redaction/RedactionVerify.tsx` → Expected test: `tests/unit/components/RedactionVerify.tsx.test.ts`
- `src/components/redaction/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/scanner/BatchScanWorkflow.tsx` → Expected test: `tests/unit/components/BatchScanWorkflow.tsx.test.ts`
- `src/components/scanner/ColorModeSelector.tsx` → Expected test: `tests/unit/components/ColorModeSelector.tsx.test.ts`
- `src/components/scanner/CropTool.tsx` → Expected test: `tests/unit/components/CropTool.tsx.test.ts`
- `src/components/scanner/EnhancementTools.tsx` → Expected test: `tests/unit/components/EnhancementTools.tsx.test.ts`
- `src/components/scanner/PageOrganizer.tsx` → Expected test: `tests/unit/components/PageOrganizer.tsx.test.ts`
- `src/components/scanner/ProfileManager.tsx` → Expected test: `tests/unit/components/ProfileManager.tsx.test.ts`
- `src/components/scanner/ResolutionPicker.tsx` → Expected test: `tests/unit/components/ResolutionPicker.tsx.test.ts`
- `src/components/scanner/ScanPreview.tsx` → Expected test: `tests/unit/components/ScanPreview.tsx.test.ts`
- `src/components/scanner/ScanSettingsPanel.tsx` → Expected test: `tests/unit/components/ScanSettingsPanel.tsx.test.ts`
- `src/components/scanner/ScannerInfo.tsx` → Expected test: `tests/unit/components/ScannerInfo.tsx.test.ts`
- `src/components/scanner/ScannerSelectDialog.tsx` → Expected test: `tests/unit/components/ScannerSelectDialog.tsx.test.ts`
- `src/components/security/EnrollmentGuide.tsx` → Expected test: `tests/unit/components/EnrollmentGuide.tsx.test.ts`
- `src/components/security/HardwareKeyAuth.tsx` → Expected test: `tests/unit/components/HardwareKeyAuth.tsx.test.ts`
- `src/components/security/HardwareKeyEnrollment.tsx` → Expected test: `tests/unit/components/HardwareKeyEnrollment.tsx.test.ts`
- `src/components/security/KeyChallenge.tsx` → Expected test: `tests/unit/components/KeyChallenge.tsx.test.ts`
- `src/components/security/KeyManagement.tsx` → Expected test: `tests/unit/components/KeyManagement.tsx.test.ts`
- `src/components/settings/AutoReloadSettings.tsx` → Expected test: `tests/unit/components/AutoReloadSettings.tsx.test.ts`
- `src/components/settings/NotificationSettings.tsx` → Expected test: `tests/unit/components/NotificationSettings.tsx.test.ts`
- `src/components/settings/ShortcutSettings.tsx` → Expected test: `tests/unit/components/ShortcutSettings.tsx.test.ts`
- `src/components/sidebar/OutlinePanel.tsx` → Expected test: `tests/unit/components/OutlinePanel.tsx.test.ts`
- `src/components/sidebar/ThumbnailSidebar.tsx` → Expected test: `tests/unit/components/ThumbnailSidebar.tsx.test.ts`
- `src/components/signatures/CameraSignature.tsx` → Expected test: `tests/unit/components/CameraSignature.tsx.test.ts`
- `src/components/signatures/DateStamp.tsx` → Expected test: `tests/unit/components/DateStamp.tsx.test.ts`
- `src/components/signatures/DrawSignature.tsx` → Expected test: `tests/unit/components/DrawSignature.tsx.test.ts`
- `src/components/signatures/ImageSignature.tsx` → Expected test: `tests/unit/components/ImageSignature.tsx.test.ts`
- `src/components/signatures/InitialsModal.tsx` → Expected test: `tests/unit/components/InitialsModal.tsx.test.ts`
- `src/components/signatures/SignatureList.tsx` → Expected test: `tests/unit/components/SignatureList.tsx.test.ts`
- `src/components/signatures/SignatureModal.tsx` → Expected test: `tests/unit/components/SignatureModal.tsx.test.ts`
- `src/components/signatures/SignaturePlacer.tsx` → Expected test: `tests/unit/components/SignaturePlacer.tsx.test.ts`
- `src/components/signatures/SignatureResize.tsx` → Expected test: `tests/unit/components/SignatureResize.tsx.test.ts`
- `src/components/signatures/SignatureRotation.tsx` → Expected test: `tests/unit/components/SignatureRotation.tsx.test.ts`
- `src/components/signatures/TypeSignature.tsx` → Expected test: `tests/unit/components/TypeSignature.tsx.test.ts`
- `src/components/signatures/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/toolbar/AnnotationToolbar.tsx` → Expected test: `tests/unit/components/AnnotationToolbar.tsx.test.ts`
- `src/components/toolbar/SearchBar.tsx` → Expected test: `tests/unit/components/SearchBar.tsx.test.ts`
- `src/components/toolbar/ViewModeToggle.tsx` → Expected test: `tests/unit/components/ViewModeToggle.tsx.test.ts`
- `src/components/ui/AccessibleComponents.tsx` → Expected test: `tests/unit/components/AccessibleComponents.tsx.test.ts`
- `src/components/ui/Button.tsx` → Expected test: `tests/unit/components/Button.tsx.test.ts`
- `src/components/ui/Checkbox.tsx` → Expected test: `tests/unit/components/Checkbox.tsx.test.ts`
- `src/components/ui/Dialog.tsx` → Expected test: `tests/unit/components/Dialog.tsx.test.ts`
- `src/components/ui/Input.tsx` → Expected test: `tests/unit/components/Input.tsx.test.ts`
- `src/components/ui/LoadingIndicator.tsx` → Expected test: `tests/unit/components/LoadingIndicator.tsx.test.ts`
- `src/components/ui/Progress.tsx` → Expected test: `tests/unit/components/Progress.tsx.test.ts`
- `src/components/ui/Select.tsx` → Expected test: `tests/unit/components/Select.tsx.test.ts`
- `src/components/ui/Skeleton.tsx` → Expected test: `tests/unit/components/Skeleton.tsx.test.ts`
- `src/components/ui/ThemeToggle.tsx` → Expected test: `tests/unit/components/ThemeToggle.tsx.test.ts`
- `src/components/ui/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/update/InstallPrompt.tsx` → Expected test: `tests/unit/components/InstallPrompt.tsx.test.ts`
- `src/components/update/ReleaseNotes.tsx` → Expected test: `tests/unit/components/ReleaseNotes.tsx.test.ts`
- `src/components/update/UpdateNotification.tsx` → Expected test: `tests/unit/components/UpdateNotification.tsx.test.ts`
- `src/components/update/UpdateProgress.tsx` → Expected test: `tests/unit/components/UpdateProgress.tsx.test.ts`
- `src/components/update/UpdateSettings.tsx` → Expected test: `tests/unit/components/UpdateSettings.tsx.test.ts`
- `src/components/update/index.ts` → Expected test: `tests/unit/components/index.test.ts`
- `src/components/updates/UpdateNotification.tsx` → Expected test: `tests/unit/components/UpdateNotification.tsx.test.ts`
- `src/components/viewer/DropZone.tsx` → Expected test: `tests/unit/components/DropZone.tsx.test.ts`
- `src/components/viewer/PDFViewer.tsx` → Expected test: `tests/unit/components/PDFViewer.tsx.test.ts`
- `src/components/viewer/PageCanvas.tsx` → Expected test: `tests/unit/components/PageCanvas.tsx.test.ts`
- `src/components/viewer/PageNavigation.tsx` → Expected test: `tests/unit/components/PageNavigation.tsx.test.ts`
- `src/components/viewer/PageSkeleton.tsx` → Expected test: `tests/unit/components/PageSkeleton.tsx.test.ts`
- `src/components/viewer/TextLayer.tsx` → Expected test: `tests/unit/components/TextLayer.tsx.test.ts`
- `src/components/viewer/VirtualizedViewer.tsx` → Expected test: `tests/unit/components/VirtualizedViewer.tsx.test.ts`
- `src/components/viewer/ZoomControls.tsx` → Expected test: `tests/unit/components/ZoomControls.tsx.test.ts`
- `src/components/viewer/viewLayout.ts` → Expected test: `tests/unit/components/viewLayout.test.ts`

### constants/

- `src/constants/config.ts` → Expected test: `tests/unit/constants/config.test.ts`
- `src/constants/shortcuts.ts` → Expected test: `tests/unit/constants/shortcuts.test.ts`
- `src/constants/stamps.ts` → Expected test: `tests/unit/constants/stamps.test.ts`
- `src/constants/tools.ts` → Expected test: `tests/unit/constants/tools.test.ts`
- `src/constants/version.ts` → Expected test: `tests/unit/constants/version.test.ts`

### contexts/

- `src/contexts/PlatformContext.tsx` → Expected test: `tests/unit/contexts/PlatformContext.tsx.test.ts`

### core/

- `src/core/features.ts` → Expected test: `tests/unit/core/features.test.ts`

### hooks/

- `src/hooks/index.ts` → Expected test: `tests/unit/hooks/index.test.ts`
- `src/hooks/useAnnotationShortcuts.ts` → Expected test: `tests/unit/hooks/useAnnotationShortcuts.test.ts`
- `src/hooks/useAnnounce.ts` → Expected test: `tests/unit/hooks/useAnnounce.test.ts`
- `src/hooks/useAutoSave.ts` → Expected test: `tests/unit/hooks/useAutoSave.test.ts`
- `src/hooks/useBeforeUnload.ts` → Expected test: `tests/unit/hooks/useBeforeUnload.test.ts`
- `src/hooks/useClipboard.ts` → Expected test: `tests/unit/hooks/useClipboard.test.ts`
- `src/hooks/useConnectionStatus.ts` → Expected test: `tests/unit/hooks/useConnectionStatus.test.ts`
- `src/hooks/useDropZone.ts` → Expected test: `tests/unit/hooks/useDropZone.test.ts`
- `src/hooks/useFileSystem.ts` → Expected test: `tests/unit/hooks/useFileSystem.test.ts`
- `src/hooks/useFormFields.ts` → Expected test: `tests/unit/hooks/useFormFields.test.ts`
- `src/hooks/useFormNavigation.ts` → Expected test: `tests/unit/hooks/useFormNavigation.test.ts`
- `src/hooks/useHighlightTool.ts` → Expected test: `tests/unit/hooks/useHighlightTool.test.ts`
- `src/hooks/useKeyboardNavigation.ts` → Expected test: `tests/unit/hooks/useKeyboardNavigation.test.ts`
- `src/hooks/useOfflineData.ts` → Expected test: `tests/unit/hooks/useOfflineData.test.ts`
- `src/hooks/useOfflineSync.ts` → Expected test: `tests/unit/hooks/useOfflineSync.test.ts`
- `src/hooks/usePageDrag.ts` → Expected test: `tests/unit/hooks/usePageDrag.test.ts`
- `src/hooks/usePageSelection.ts` → Expected test: `tests/unit/hooks/usePageSelection.test.ts`
- `src/hooks/usePlatform.ts` → Expected test: `tests/unit/hooks/usePlatform.test.ts`
- `src/hooks/usePointerInput.ts` → Expected test: `tests/unit/hooks/usePointerInput.test.ts`
- `src/hooks/useSearch.ts` → Expected test: `tests/unit/hooks/useSearch.test.ts`
- `src/hooks/useSignatureInput.ts` → Expected test: `tests/unit/hooks/useSignatureInput.test.ts`
- `src/hooks/useTextSelection.ts` → Expected test: `tests/unit/hooks/useTextSelection.test.ts`
- `src/hooks/useThumbnails.ts` → Expected test: `tests/unit/hooks/useThumbnails.test.ts`
- `src/hooks/useTouchGestures.ts` → Expected test: `tests/unit/hooks/useTouchGestures.test.ts`
- `src/hooks/useUnsavedChanges.ts` → Expected test: `tests/unit/hooks/useUnsavedChanges.test.ts`
- `src/hooks/useVirtualization.ts` → Expected test: `tests/unit/hooks/useVirtualization.test.ts`
- `src/hooks/useVisiblePages.ts` → Expected test: `tests/unit/hooks/useVisiblePages.test.ts`

### lib/

- `src/lib/accessibility/checker.ts` → Expected test: `tests/unit/lib/checker.test.ts`
- `src/lib/accessibility/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/accessibility/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/annotations/drawingGeometry.ts` → Expected test: `tests/unit/lib/drawingGeometry.test.ts`
- `src/lib/annotations/drawingSerializer.ts` → Expected test: `tests/unit/lib/drawingSerializer.test.ts`
- `src/lib/annotations/serializer.ts` → Expected test: `tests/unit/lib/serializer.test.ts`
- `src/lib/batch/batchProcessor.ts` → Expected test: `tests/unit/lib/batchProcessor.test.ts`
- `src/lib/batch/batesNumber.ts` → Expected test: `tests/unit/lib/batesNumber.test.ts`
- `src/lib/batch/errorHandler.ts` → Expected test: `tests/unit/lib/errorHandler.test.ts`
- `src/lib/batch/errorReporter.ts` → Expected test: `tests/unit/lib/errorReporter.test.ts`
- `src/lib/batch/flatten.ts` → Expected test: `tests/unit/lib/flatten.test.ts`
- `src/lib/batch/headerFooter.ts` → Expected test: `tests/unit/lib/headerFooter.test.ts`
- `src/lib/batch/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/batch/jobPersistence.ts` → Expected test: `tests/unit/lib/jobPersistence.test.ts`
- `src/lib/batch/jobQueue.ts` → Expected test: `tests/unit/lib/jobQueue.test.ts`
- `src/lib/batch/operations/batchCompress.ts` → Expected test: `tests/unit/lib/batchCompress.test.ts`
- `src/lib/batch/operations/batchMerge.ts` → Expected test: `tests/unit/lib/batchMerge.test.ts`
- `src/lib/batch/operations/batchOCR.ts` → Expected test: `tests/unit/lib/batchOCR.test.ts`
- `src/lib/batch/operations/batchSplit.ts` → Expected test: `tests/unit/lib/batchSplit.test.ts`
- `src/lib/batch/operations/batchWatermark.ts` → Expected test: `tests/unit/lib/batchWatermark.test.ts`
- `src/lib/batch/operations/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/batch/templates.ts` → Expected test: `tests/unit/lib/templates.test.ts`
- `src/lib/batch/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/batch/watermark.ts` → Expected test: `tests/unit/lib/watermark.test.ts`
- `src/lib/comparison/comparisonEngine.ts` → Expected test: `tests/unit/lib/comparisonEngine.test.ts`
- `src/lib/comparison/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/comparison/reportGenerator.ts` → Expected test: `tests/unit/lib/reportGenerator.test.ts`
- `src/lib/comparison/textDiff.ts` → Expected test: `tests/unit/lib/textDiff.test.ts`
- `src/lib/comparison/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/dev/hotReload.ts` → Expected test: `tests/unit/lib/hotReload.test.ts`
- `src/lib/electron/dialogs.ts` → Expected test: `tests/unit/lib/dialogs.test.ts`
- `src/lib/electron/fileSystem.ts` → Expected test: `tests/unit/lib/fileSystem.test.ts`
- `src/lib/electron/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/electron/ipc.ts` → Expected test: `tests/unit/lib/ipc.test.ts`
- `src/lib/electron/notifications.ts` → Expected test: `tests/unit/lib/notifications.test.ts`
- `src/lib/electron/print.ts` → Expected test: `tests/unit/lib/print.test.ts`
- `src/lib/enterprise/configCache.ts` → Expected test: `tests/unit/lib/configCache.test.ts`
- `src/lib/enterprise/configDiscovery.ts` → Expected test: `tests/unit/lib/configDiscovery.test.ts`
- `src/lib/enterprise/configEncryption.ts` → Expected test: `tests/unit/lib/configEncryption.test.ts`
- `src/lib/enterprise/configMerger.ts` → Expected test: `tests/unit/lib/configMerger.test.ts`
- `src/lib/enterprise/configParser.ts` → Expected test: `tests/unit/lib/configParser.test.ts`
- `src/lib/enterprise/configPrecedence.ts` → Expected test: `tests/unit/lib/configPrecedence.test.ts`
- `src/lib/enterprise/configWatcher.ts` → Expected test: `tests/unit/lib/configWatcher.test.ts`
- `src/lib/enterprise/envExpansion.ts` → Expected test: `tests/unit/lib/envExpansion.test.ts`
- `src/lib/enterprise/gpoReader.ts` → Expected test: `tests/unit/lib/gpoReader.test.ts`
- `src/lib/enterprise/jsonConfigLoader.ts` → Expected test: `tests/unit/lib/jsonConfigLoader.test.ts`
- `src/lib/enterprise/macPreferences.ts` → Expected test: `tests/unit/lib/macPreferences.test.ts`
- `src/lib/enterprise/mdmReader.ts` → Expected test: `tests/unit/lib/mdmReader.test.ts`
- `src/lib/enterprise/policyMerger.ts` → Expected test: `tests/unit/lib/policyMerger.test.ts`
- `src/lib/enterprise/registryAccess.ts` → Expected test: `tests/unit/lib/registryAccess.test.ts`
- `src/lib/enterprise/remoteConfigLoader.ts` → Expected test: `tests/unit/lib/remoteConfigLoader.test.ts`
- `src/lib/enterprise/secretsManager.ts` → Expected test: `tests/unit/lib/secretsManager.test.ts`
- `src/lib/enterprise/ssrfGuard.ts` → Expected test: `tests/unit/lib/ssrfGuard.test.ts`
- `src/lib/enterprise/yamlConfigLoader.ts` → Expected test: `tests/unit/lib/yamlConfigLoader.test.ts`
- `src/lib/export/compressPdf.ts` → Expected test: `tests/unit/lib/compressPdf.test.ts`
- `src/lib/export/flattenPdf.ts` → Expected test: `tests/unit/lib/flattenPdf.test.ts`
- `src/lib/export/imageExport.ts` → Expected test: `tests/unit/lib/imageExport.test.ts`
- `src/lib/export/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/export/pdfExport.ts` → Expected test: `tests/unit/lib/pdfExport.test.ts`
- `src/lib/fileWatch/changeDetector.ts` → Expected test: `tests/unit/lib/changeDetector.test.ts`
- `src/lib/fileWatch/conflictHandler.ts` → Expected test: `tests/unit/lib/conflictHandler.test.ts`
- `src/lib/fileWatch/documentDiff.ts` → Expected test: `tests/unit/lib/documentDiff.test.ts`
- `src/lib/fileWatch/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/fileWatch/mergeStrategy.ts` → Expected test: `tests/unit/lib/mergeStrategy.test.ts`
- `src/lib/fileWatch/smartReload.ts` → Expected test: `tests/unit/lib/smartReload.test.ts`
- `src/lib/fileWatch/statePreserver.ts` → Expected test: `tests/unit/lib/statePreserver.test.ts`
- `src/lib/fileWatch/watchQueue.ts` → Expected test: `tests/unit/lib/watchQueue.test.ts`
- `src/lib/fonts/fontFallback.ts` → Expected test: `tests/unit/lib/fontFallback.test.ts`
- `src/lib/fonts/fontMatcher.ts` → Expected test: `tests/unit/lib/fontMatcher.test.ts`
- `src/lib/fonts/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/forms/calculations.ts` → Expected test: `tests/unit/lib/calculations.test.ts`
- `src/lib/forms/conditionalLogic.ts` → Expected test: `tests/unit/lib/conditionalLogic.test.ts`
- `src/lib/forms/exportImport.ts` → Expected test: `tests/unit/lib/exportImport.test.ts`
- `src/lib/forms/fdfExport.ts` → Expected test: `tests/unit/lib/fdfExport.test.ts`
- `src/lib/forms/formActions.ts` → Expected test: `tests/unit/lib/formActions.test.ts`
- `src/lib/forms/formParser.ts` → Expected test: `tests/unit/lib/formParser.test.ts`
- `src/lib/forms/formSubmit.ts` → Expected test: `tests/unit/lib/formSubmit.test.ts`
- `src/lib/forms/formatting.ts` → Expected test: `tests/unit/lib/formatting.test.ts`
- `src/lib/forms/importData.ts` → Expected test: `tests/unit/lib/importData.test.ts`
- `src/lib/forms/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/forms/validation.ts` → Expected test: `tests/unit/lib/validation.test.ts`
- `src/lib/forms/xfdfExport.ts` → Expected test: `tests/unit/lib/xfdfExport.test.ts`
- `src/lib/kiosk/kioskMode.ts` → Expected test: `tests/unit/lib/kioskMode.test.ts`
- `src/lib/lan/serviceDiscovery.ts` → Expected test: `tests/unit/lib/serviceDiscovery.test.ts`
- `src/lib/license/expiryHandler.ts` → Expected test: `tests/unit/lib/expiryHandler.test.ts`
- `src/lib/license/featureGating.ts` → Expected test: `tests/unit/lib/featureGating.test.ts`
- `src/lib/license/hardwareFingerprint.ts` → Expected test: `tests/unit/lib/hardwareFingerprint.test.ts`
- `src/lib/license/licenseBinding.ts` → Expected test: `tests/unit/lib/licenseBinding.test.ts`
- `src/lib/license/licenseFormat.ts` → Expected test: `tests/unit/lib/licenseFormat.test.ts`
- `src/lib/license/licenseStorage.ts` → Expected test: `tests/unit/lib/licenseStorage.test.ts`
- `src/lib/license/licenseValidator.ts` → Expected test: `tests/unit/lib/licenseValidator.test.ts`
- `src/lib/license/signatureVerifier.ts` → Expected test: `tests/unit/lib/signatureVerifier.test.ts`
- `src/lib/monitoring/analytics.ts` → Expected test: `tests/unit/lib/analytics.test.ts`
- `src/lib/monitoring/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/monitoring/releaseMetrics.ts` → Expected test: `tests/unit/lib/releaseMetrics.test.ts`
- `src/lib/monitoring/sentry.ts` → Expected test: `tests/unit/lib/sentry.test.ts`
- `src/lib/ocr/batchOCR.ts` → Expected test: `tests/unit/lib/batchOCR.test.ts`
- `src/lib/ocr/exportFormats.ts` → Expected test: `tests/unit/lib/exportFormats.test.ts`
- `src/lib/ocr/imagePreprocessor.ts` → Expected test: `tests/unit/lib/imagePreprocessor.test.ts`
- `src/lib/ocr/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/ocr/languageLoader.ts` → Expected test: `tests/unit/lib/languageLoader.test.ts`
- `src/lib/ocr/layoutAnalyzer.ts` → Expected test: `tests/unit/lib/layoutAnalyzer.test.ts`
- `src/lib/ocr/ocrEngine.ts` → Expected test: `tests/unit/lib/ocrEngine.test.ts`
- `src/lib/ocr/textLayerEmbed.ts` → Expected test: `tests/unit/lib/textLayerEmbed.test.ts`
- `src/lib/ocr/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/offline/backgroundSync.ts` → Expected test: `tests/unit/lib/backgroundSync.test.ts`
- `src/lib/offline/conflictResolver.ts` → Expected test: `tests/unit/lib/conflictResolver.test.ts`
- `src/lib/offline/deltaSync.ts` → Expected test: `tests/unit/lib/deltaSync.test.ts`
- `src/lib/offline/offlineAvailability.ts` → Expected test: `tests/unit/lib/offlineAvailability.test.ts`
- `src/lib/offline/offlineQueue.ts` → Expected test: `tests/unit/lib/offlineQueue.test.ts`
- `src/lib/offline/offlineStorage.ts` → Expected test: `tests/unit/lib/offlineStorage.test.ts`
- `src/lib/offline/patchGenerator.ts` → Expected test: `tests/unit/lib/patchGenerator.test.ts`
- `src/lib/offline/queueProcessor.ts` → Expected test: `tests/unit/lib/queueProcessor.test.ts`
- `src/lib/offline/serviceWorkerConfig.ts` → Expected test: `tests/unit/lib/serviceWorkerConfig.test.ts`
- `src/lib/offline/syncEngine.ts` → Expected test: `tests/unit/lib/syncEngine.test.ts`
- `src/lib/pages/extractPages.ts` → Expected test: `tests/unit/lib/extractPages.test.ts`
- `src/lib/pages/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/pages/mergePdf.ts` → Expected test: `tests/unit/lib/mergePdf.test.ts`
- `src/lib/pages/pageOperations.ts` → Expected test: `tests/unit/lib/pageOperations.test.ts`
- `src/lib/pages/splitPdf.ts` → Expected test: `tests/unit/lib/splitPdf.test.ts`
- `src/lib/pdf/contentDarkMode.ts` → Expected test: `tests/unit/lib/contentDarkMode.test.ts`
- `src/lib/pdf/renderer.ts` → Expected test: `tests/unit/lib/renderer.test.ts`
- `src/lib/pdf/saver.ts` → Expected test: `tests/unit/lib/saver.test.ts`
- `src/lib/pdf/signatureEmbed.ts` → Expected test: `tests/unit/lib/signatureEmbed.test.ts`
- `src/lib/pdf/textSaver.ts` → Expected test: `tests/unit/lib/textSaver.test.ts`
- `src/lib/performance/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/performance/memoryManager.ts` → Expected test: `tests/unit/lib/memoryManager.test.ts`
- `src/lib/print/accessibility.ts` → Expected test: `tests/unit/lib/accessibility.test.ts`
- `src/lib/print/bookletLayout.ts` → Expected test: `tests/unit/lib/bookletLayout.test.ts`
- `src/lib/print/colorManagement.ts` → Expected test: `tests/unit/lib/colorManagement.test.ts`
- `src/lib/print/executePrint.ts` → Expected test: `tests/unit/lib/executePrint.test.ts`
- `src/lib/print/imposition.ts` → Expected test: `tests/unit/lib/imposition.test.ts`
- `src/lib/print/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/print/nupLayout.ts` → Expected test: `tests/unit/lib/nupLayout.test.ts`
- `src/lib/print/pageRange.ts` → Expected test: `tests/unit/lib/pageRange.test.ts`
- `src/lib/print/pdfRenderer.ts` → Expected test: `tests/unit/lib/pdfRenderer.test.ts`
- `src/lib/print/presets.ts` → Expected test: `tests/unit/lib/presets.test.ts`
- `src/lib/print/printQueue.ts` → Expected test: `tests/unit/lib/printQueue.test.ts`
- `src/lib/print/printRenderer.ts` → Expected test: `tests/unit/lib/printRenderer.test.ts`
- `src/lib/print/virtualPrinter.ts` → Expected test: `tests/unit/lib/virtualPrinter.test.ts`
- `src/lib/redaction/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/redaction/patternMatcher.ts` → Expected test: `tests/unit/lib/patternMatcher.test.ts`
- `src/lib/redaction/redactionEngine.ts` → Expected test: `tests/unit/lib/redactionEngine.test.ts`
- `src/lib/redaction/redactionVerify.ts` → Expected test: `tests/unit/lib/redactionVerify.test.ts`
- `src/lib/redaction/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/scanner/documentDetection.ts` → Expected test: `tests/unit/lib/documentDetection.test.ts`
- `src/lib/scanner/imageCompression.ts` → Expected test: `tests/unit/lib/imageCompression.test.ts`
- `src/lib/scanner/perspectiveCorrection.ts` → Expected test: `tests/unit/lib/perspectiveCorrection.test.ts`
- `src/lib/scanner/scanOcr.ts` → Expected test: `tests/unit/lib/scanOcr.test.ts`
- `src/lib/scanner/scanProfiles.ts` → Expected test: `tests/unit/lib/scanProfiles.test.ts`
- `src/lib/scanner/scanToPdf.ts` → Expected test: `tests/unit/lib/scanToPdf.test.ts`
- `src/lib/scanner/scannerProvider.ts` → Expected test: `tests/unit/lib/scannerProvider.test.ts`
- `src/lib/scanner/types.ts` → Expected test: `tests/unit/lib/types.test.ts`
- `src/lib/security/assertion.ts` → Expected test: `tests/unit/lib/assertion.test.ts`
- `src/lib/security/attestation.ts` → Expected test: `tests/unit/lib/attestation.test.ts`
- `src/lib/security/fido2Server.ts` → Expected test: `tests/unit/lib/fido2Server.test.ts`
- `src/lib/security/hardwareEncryption.ts` → Expected test: `tests/unit/lib/hardwareEncryption.test.ts`
- `src/lib/security/keyWrapping.ts` → Expected test: `tests/unit/lib/keyWrapping.test.ts`
- `src/lib/security/webauthn.ts` → Expected test: `tests/unit/lib/webauthn.test.ts`
- `src/lib/security/webauthnClient.ts` → Expected test: `tests/unit/lib/webauthnClient.test.ts`
- `src/lib/share/copyLink.ts` → Expected test: `tests/unit/lib/copyLink.test.ts`
- `src/lib/share/emailShare.ts` → Expected test: `tests/unit/lib/emailShare.test.ts`
- `src/lib/share/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/signatures/cameraCorrection.ts` → Expected test: `tests/unit/lib/cameraCorrection.test.ts`
- `src/lib/signatures/dateUtils.ts` → Expected test: `tests/unit/lib/dateUtils.test.ts`
- `src/lib/signatures/fieldAlignment.ts` → Expected test: `tests/unit/lib/fieldAlignment.test.ts`
- `src/lib/signatures/imageProcessor.ts` → Expected test: `tests/unit/lib/imageProcessor.test.ts`
- `src/lib/storage/fileHandler.ts` → Expected test: `tests/unit/lib/fileHandler.test.ts`
- `src/lib/storage/formStorage.ts` → Expected test: `tests/unit/lib/formStorage.test.ts`
- `src/lib/storage/indexeddb.ts` → Expected test: `tests/unit/lib/indexeddb.test.ts`
- `src/lib/storage/signatureStorage.ts` → Expected test: `tests/unit/lib/signatureStorage.test.ts`
- `src/lib/storage/stampStorage.ts` → Expected test: `tests/unit/lib/stampStorage.test.ts`
- `src/lib/thumbnails/cache.ts` → Expected test: `tests/unit/lib/cache.test.ts`
- `src/lib/thumbnails/index.ts` → Expected test: `tests/unit/lib/index.test.ts`
- `src/lib/update/updateClient.ts` → Expected test: `tests/unit/lib/updateClient.test.ts`

### modules/

- `src/modules/optional/OptionalModuleCommands.tsx` → Expected test: `tests/unit/modules/OptionalModuleCommands.tsx.test.ts`
- `src/modules/optional/OptionalModuleHost.tsx` → Expected test: `tests/unit/modules/OptionalModuleHost.tsx.test.ts`
- `src/modules/optional/entries/batch.tsx` → Expected test: `tests/unit/modules/batch.tsx.test.ts`
- `src/modules/optional/entries/comparison.tsx` → Expected test: `tests/unit/modules/comparison.tsx.test.ts`
- `src/modules/optional/entries/enterprise.tsx` → Expected test: `tests/unit/modules/enterprise.tsx.test.ts`
- `src/modules/optional/entries/fileWatch.tsx` → Expected test: `tests/unit/modules/fileWatch.tsx.test.ts`
- `src/modules/optional/entries/kiosk.tsx` → Expected test: `tests/unit/modules/kiosk.tsx.test.ts`
- `src/modules/optional/entries/lan.tsx` → Expected test: `tests/unit/modules/lan.tsx.test.ts`
- `src/modules/optional/entries/license.tsx` → Expected test: `tests/unit/modules/license.tsx.test.ts`
- `src/modules/optional/entries/scanner.tsx` → Expected test: `tests/unit/modules/scanner.tsx.test.ts`
- `src/modules/optional/loadOptionalModule.ts` → Expected test: `tests/unit/modules/loadOptionalModule.test.ts`

### pages/

- `src/pages/Editor.tsx` → Expected test: `tests/unit/pages/Editor.tsx.test.ts`
- `src/pages/Home.tsx` → Expected test: `tests/unit/pages/Home.tsx.test.ts`
- `src/pages/NotFound.tsx` → Expected test: `tests/unit/pages/NotFound.tsx.test.ts`
- `src/pages/Privacy.tsx` → Expected test: `tests/unit/pages/Privacy.tsx.test.ts`
- `src/pages/Settings.tsx` → Expected test: `tests/unit/pages/Settings.tsx.test.ts`
- `src/pages/Terms.tsx` → Expected test: `tests/unit/pages/Terms.tsx.test.ts`

### stores/

- `src/stores/annotationStore.ts` → Expected test: `tests/unit/stores/annotationStore.test.ts`
- `src/stores/batchStore.ts` → Expected test: `tests/unit/stores/batchStore.test.ts`
- `src/stores/comparisonStore.ts` → Expected test: `tests/unit/stores/comparisonStore.test.ts`
- `src/stores/documentStore.ts` → Expected test: `tests/unit/stores/documentStore.test.ts`
- `src/stores/enterprisePolicyStore.ts` → Expected test: `tests/unit/stores/enterprisePolicyStore.test.ts`
- `src/stores/fileWatchStore.ts` → Expected test: `tests/unit/stores/fileWatchStore.test.ts`
- `src/stores/formDesignerStore.ts` → Expected test: `tests/unit/stores/formDesignerStore.test.ts`
- `src/stores/formStore.ts` → Expected test: `tests/unit/stores/formStore.test.ts`
- `src/stores/historyStore.ts` → Expected test: `tests/unit/stores/historyStore.test.ts`
- `src/stores/index.ts` → Expected test: `tests/unit/stores/index.test.ts`
- `src/stores/kioskStore.ts` → Expected test: `tests/unit/stores/kioskStore.test.ts`
- `src/stores/lanStore.ts` → Expected test: `tests/unit/stores/lanStore.test.ts`
- `src/stores/licenseStore.ts` → Expected test: `tests/unit/stores/licenseStore.test.ts`
- `src/stores/nativeBatchStore.ts` → Expected test: `tests/unit/stores/nativeBatchStore.test.ts`
- `src/stores/ocrStore.ts` → Expected test: `tests/unit/stores/ocrStore.test.ts`
- `src/stores/offlineStore.ts` → Expected test: `tests/unit/stores/offlineStore.test.ts`
- `src/stores/printStore.ts` → Expected test: `tests/unit/stores/printStore.test.ts`
- `src/stores/recentFilesStore.ts` → Expected test: `tests/unit/stores/recentFilesStore.test.ts`
- `src/stores/redactionStore.ts` → Expected test: `tests/unit/stores/redactionStore.test.ts`
- `src/stores/scannerStore.ts` → Expected test: `tests/unit/stores/scannerStore.test.ts`
- `src/stores/securityStore.ts` → Expected test: `tests/unit/stores/securityStore.test.ts`
- `src/stores/settingsStore.ts` → Expected test: `tests/unit/stores/settingsStore.test.ts`
- `src/stores/shortcutsStore.ts` → Expected test: `tests/unit/stores/shortcutsStore.test.ts`
- `src/stores/signatureStore.ts` → Expected test: `tests/unit/stores/signatureStore.test.ts`
- `src/stores/textStore.ts` → Expected test: `tests/unit/stores/textStore.test.ts`
- `src/stores/uiStore.ts` → Expected test: `tests/unit/stores/uiStore.test.ts`
- `src/stores/updateStore.ts` → Expected test: `tests/unit/stores/updateStore.test.ts`

### styles/

- `src/styles/theme.ts` → Expected test: `tests/unit/styles/theme.test.ts`

### types/

- `src/types/annotations.ts` → Expected test: `tests/unit/types/annotations.test.ts`
- `src/types/batch.ts` → Expected test: `tests/unit/types/batch.test.ts`
- `src/types/electronTypes.ts` → Expected test: `tests/unit/types/electronTypes.test.ts`
- `src/types/enterpriseConfig.ts` → Expected test: `tests/unit/types/enterpriseConfig.test.ts`
- `src/types/forms.ts` → Expected test: `tests/unit/types/forms.test.ts`
- `src/types/index.ts` → Expected test: `tests/unit/types/index.test.ts`
- `src/types/kioskConfig.ts` → Expected test: `tests/unit/types/kioskConfig.test.ts`
- `src/types/license.ts` → Expected test: `tests/unit/types/license.test.ts`
- `src/types/offline.ts` → Expected test: `tests/unit/types/offline.test.ts`
- `src/types/pdf.ts` → Expected test: `tests/unit/types/pdf.test.ts`
- `src/types/text.ts` → Expected test: `tests/unit/types/text.test.ts`
- `src/types/webauthn.ts` → Expected test: `tests/unit/types/webauthn.test.ts`

### utils/

- `src/utils/cn.ts` → Expected test: `tests/unit/utils/cn.test.ts`
- `src/utils/coordinates.ts` → Expected test: `tests/unit/utils/coordinates.test.ts`
- `src/utils/index.ts` → Expected test: `tests/unit/utils/index.test.ts`
- `src/utils/platform.ts` → Expected test: `tests/unit/utils/platform.test.ts`

---

## Source Files With Test Coverage

| Source File | Test Files |
|-------------|------------|
| `electron/contextMenu.ts` | `contextMenu.test.ts` |
| `ipc/channels.ts` | `ipc.test.ts`, `safeStorageBridge.test.ts` |
| `ipc/fileHandlers.ts` | `folderListRecursive.test.ts` |
| `ipc/pathSandbox.ts` | `pathSandbox.test.ts` |
| `ipc/safeStorageHandlers.ts` | `safeStorageBridge.test.ts` |
| `ipc/types.ts` | `updater.test.ts` |
| `main/security.ts` | `csp.test.ts`, `security.test.ts` |
| `main/windowManager.ts` | `windowManager.test.ts` |
| `main/windowState.ts` | `windowManager.test.ts` |
| `electron/menuTemplate.ts` | `menu.test.ts` |
| `electron/notifications.ts` | `notifications.test.ts` |
| `electron/shortcuts.ts` | `shortcuts.test.ts` |
| `electron/tray.ts` | `tray.test.ts` |
| `electron/platform.ts` | `platform.test.ts` |

---

## Test File Details

| Test File | Imports from Source |
|-----------|---------------------|
| `e2e/browser-test.spec.ts` | 0 files |
| `cross-platform/core-features.spec.ts` | 0 files |
| `cross-platform/editing.spec.ts` | 0 files |
| `e2e/full-feature-test.spec.ts` | 0 files |
| `mobile/responsive.spec.ts` | 0 files |
| `mobile/touch.spec.ts` | 0 files |
| `e2e/pdf-editor-test.spec.ts` | 0 files |
| `workflows/annotate-share.spec.ts` | 0 files |
| `workflows/form-fill.spec.ts` | 0 files |
| `workflows/open-edit-save.spec.ts` | 0 files |
| `e2e-electron/fileOperations.spec.ts` | 0 files |
| `e2e-electron/ipcContract.spec.ts` | 0 files |
| `e2e-electron/menuShortcuts.spec.ts` | 0 files |
| `e2e-electron/platformIntegration.spec.ts` | 0 files |
| `e2e-electron/updates.spec.ts` | 0 files |
| `electron/contextMenu.test.ts` | 1 files |
| `electron/csp.test.ts` | 1 files |
| `electron/fileHandlers.test.ts` | 0 files |
| `electron/fileWatcher.test.ts` | 0 files |
| `electron/folderListRecursive.test.ts` | 1 files |
| `electron/ipc.test.ts` | 1 files |
| `electron/menu.test.ts` | 1 files |
| `electron/notifications.test.ts` | 1 files |
| `electron/pathSandbox.test.ts` | 1 files |
| `electron/platform.test.ts` | 1 files |
| `electron/recentFiles.test.ts` | 0 files |
| `electron/safeStorageBridge.test.ts` | 2 files |
| `electron/security.test.ts` | 1 files |
| `electron/shortcuts.test.ts` | 1 files |
| `electron/tray.test.ts` | 1 files |
| `electron/updater.test.ts` | 1 files |
| `electron/windowManager.test.ts` | 2 files |
| `enterprise/configMerger.test.ts` | 0 files |
| `enterprise/configParser.test.ts` | 0 files |
| `enterprise/gpoReader.test.ts` | 0 files |
| `enterprise/registryAccess.test.ts` | 0 files |
| `enterprise/remoteConfig.test.ts` | 0 files |
| `accessibility/keyboardNavigation.test.tsx` | 0 files |
| `annotations/drawing.test.tsx` | 0 files |
| `annotations/highlights.test.tsx` | 0 files |
| `annotations/notes.test.tsx` | 0 files |
| `annotations/shapes.test.tsx` | 0 files |
| `export/exportFlow.test.tsx` | 0 files |
| `integration/fileOpening.test.tsx` | 0 files |
| `fileWatch/externalChanges.test.ts` | 0 files |
| `forms/formExport.test.tsx` | 0 files |
| `forms/formFilling.test.tsx` | 0 files |
| `offline/offlineWorkflow.test.ts` | 0 files |
| `pages/mergeSplit.test.tsx` | 0 files |
| `pages/pageManagement.test.tsx` | 0 files |
| `pages/pageReorder.test.tsx` | 0 files |
| `performance/lazyLoading.test.tsx` | 0 files |
| `print/printFlow.test.tsx` | 0 files |
| `print/printWorkflow.test.ts` | 0 files |
| `scanner/scanWorkflow.test.ts` | 0 files |
| `security/hardwareAuth.test.ts` | 0 files |
| `signatures/signatureCreation.test.tsx` | 0 files |
| `signatures/signaturePlacement.test.tsx` | 0 files |
| `textEditing/formatting.test.tsx` | 0 files |
| `textEditing/textBox.test.tsx` | 0 files |
| `license/featureGating.test.ts` | 0 files |
| `license/hardwareFingerprint.test.ts` | 0 files |
| `annotations/AnnotationProperties.test.tsx` | 0 files |
| `annotations/DrawingCanvas.test.tsx` | 0 files |
| `annotations/DrawingMove.test.tsx` | 0 files |
| `annotations/HighlightTool.test.tsx` | 0 files |
| `annotations/NoteTool.test.tsx` | 0 files |
| `annotations/SelectionPopup.test.tsx` | 0 files |
| `annotations/ShapeTool.test.tsx` | 0 files |
| `annotations/StampTool.test.tsx` | 0 files |
| `annotations/StickyNote.test.tsx` | 0 files |
| `editor/TextBoxTransform.test.tsx` | 0 files |
| `editor/TextEditor.test.tsx` | 0 files |
| `forms/FormActions.test.tsx` | 0 files |
| `forms/FormField.test.tsx` | 0 files |
| `designer/FieldPalette.test.tsx` | 0 files |
| `components/layerStacking.test.tsx` | 0 files |
| `ocr/OCRDialog.test.tsx` | 0 files |
| `ocr/OCRResultsPanel.test.tsx` | 0 files |
| `ocr/PageRangeSelector.test.tsx` | 0 files |
| `pages/InsertPageDialog.test.tsx` | 0 files |
| `pages/PageThumbnails.test.tsx` | 0 files |
| `print/PageRangeSelector.test.tsx` | 0 files |
| `signatures/CameraSignature.test.tsx` | 0 files |
| `signatures/SignatureCanvas.test.tsx` | 0 files |
| `signatures/SignaturePlacer.test.tsx` | 0 files |
| `toolbar/SearchBar.test.tsx` | 0 files |
| `ui/AccessibleComponents.test.tsx` | 0 files |
| `ui/Skeleton.test.tsx` | 0 files |
| `viewer/PDFViewer.test.tsx` | 0 files |
| `viewer/VirtualizedViewer.test.tsx` | 0 files |
| `viewer/pdfContentDark.test.tsx` | 0 files |
| `viewer/viewLayout.test.ts` | 0 files |
| `core/features.test.ts` | 0 files |
| `hooks/useAnnotationShortcuts.test.ts` | 0 files |
| `hooks/useBeforeUnload.test.ts` | 0 files |
| `hooks/useClipboard.test.ts` | 0 files |
| `hooks/useDropZone.test.ts` | 0 files |
| `hooks/useKeyboardNavigation.test.ts` | 0 files |
| `hooks/usePageSelection.test.ts` | 0 files |
| `hooks/usePointerInput.test.ts` | 0 files |
| `hooks/useSearch.test.ts` | 0 files |
| `hooks/useTouchGestures.test.ts` | 0 files |
| `hooks/useVirtualization.test.ts` | 0 files |
| `hooks/useVisiblePages.test.ts` | 0 files |
| `accessibility/checker.test.ts` | 0 files |
| `annotations/drawingGeometry.test.ts` | 0 files |
| `annotations/drawingSerializer.test.ts` | 0 files |
| `annotations/serializer.test.ts` | 0 files |
| `batch/batchProcessor.test.ts` | 0 files |
| `batch/batesNumber.test.ts` | 0 files |
| `batch/flatten.test.ts` | 0 files |
| `batch/headerFooter.test.ts` | 0 files |
| `batch/jobQueue.test.ts` | 0 files |
| `batch/operations.test.ts` | 0 files |
| `batch/watermark.test.ts` | 0 files |
| `comparison/comparisonEngine.test.ts` | 0 files |
| `comparison/reportGenerator.test.ts` | 0 files |
| `comparison/textDiff.test.ts` | 0 files |
| `enterprise/ssrfGuard.test.ts` | 0 files |
| `export/compressPdf.test.ts` | 0 files |
| `export/flattenPdf.test.ts` | 0 files |
| `export/imageExport.test.ts` | 0 files |
| `export/pdfExport.test.ts` | 0 files |
| `fileWatch/changeDetector.test.ts` | 0 files |
| `fileWatch/smartReload.test.ts` | 0 files |
| `fonts/fontFallback.test.ts` | 0 files |
| `fonts/fontMatcher.test.ts` | 0 files |
| `forms/calculations.test.ts` | 0 files |
| `forms/conditionalLogic.test.ts` | 0 files |
| `forms/formActions.test.ts` | 0 files |
| `forms/formSubmit.test.ts` | 0 files |
| `forms/formatting.test.ts` | 0 files |
| `forms/importData.test.ts` | 0 files |
| `forms/xfdfExport.test.ts` | 0 files |
| `license/licenseStorage.test.ts` | 0 files |
| `license/licenseStorageBridge.test.ts` | 0 files |
| `license/licenseValidator.test.ts` | 0 files |
| `monitoring/analytics.test.ts` | 0 files |
| `monitoring/sentry.test.ts` | 0 files |
| `ocr/batchOCR.test.ts` | 0 files |
| `ocr/exportFormats.test.ts` | 0 files |
| `ocr/imagePreprocessor.test.ts` | 0 files |
| `ocr/languageLoader.test.ts` | 0 files |
| `ocr/layoutAnalyzer.test.ts` | 0 files |
| `ocr/ocrEngine.test.ts` | 0 files |
| `ocr/types.test.ts` | 0 files |
| `offline/conflictResolver.test.ts` | 0 files |
| `offline/offlineStorage.test.ts` | 0 files |
| `offline/syncEngine.test.ts` | 0 files |
| `pages/extractPages.test.ts` | 0 files |
| `pages/mergePdf.test.ts` | 0 files |
| `pages/pageOperations.test.ts` | 0 files |
| `pages/splitPdf.test.ts` | 0 files |
| `pdf/contentDarkMode.test.ts` | 0 files |
| `pdf/renderer.test.ts` | 0 files |
| `pdf/signatureEmbed.test.ts` | 0 files |
| `pdf/textSaver.test.ts` | 0 files |
| `performance/memoryManager.test.ts` | 0 files |
| `print/executePrint.test.ts` | 0 files |
| `print/imposition.test.ts` | 0 files |
| `print/pdfRenderer.test.ts` | 0 files |
| `print/printRenderer.test.ts` | 0 files |
| `redaction/patternMatcher.test.ts` | 0 files |
| `redaction/redactionEngine.test.ts` | 0 files |
| `scanner/documentDetection.test.ts` | 0 files |
| `scanner/scannerProvider.test.ts` | 0 files |
| `security/fido2Server.test.ts` | 0 files |
| `security/webauthn.test.ts` | 0 files |
| `share/copyLink.test.ts` | 0 files |
| `share/emailShare.test.ts` | 0 files |
| `signatures/cameraCorrection.test.ts` | 0 files |
| `storage/fileHandler.test.ts` | 0 files |
| `storage/stampStorage.test.ts` | 0 files |
| `thumbnails/cache.test.ts` | 0 files |
| `modules/optionalModules.test.tsx` | 0 files |
| `pages/Privacy.test.tsx` | 0 files |
| `pages/Terms.test.tsx` | 0 files |
| `stores/annotationStore.test.ts` | 0 files |
| `stores/batchStore.test.ts` | 0 files |
| `stores/comparisonStore.test.ts` | 0 files |
| `stores/documentStore.test.ts` | 0 files |
| `stores/formDesignerStore.test.ts` | 0 files |
| `stores/formStore.test.ts` | 0 files |
| `stores/historyStore.test.ts` | 0 files |
| `stores/nativeBatchStore.test.ts` | 0 files |
| `stores/ocrStore.test.ts` | 0 files |
| `stores/redactionStore.test.ts` | 0 files |
| `stores/settingsStore.test.ts` | 0 files |
| `stores/signatureStore.test.ts` | 0 files |
| `stores/textStore.test.ts` | 0 files |
| `stores/uiStore.test.ts` | 0 files |
| `styles/indexCss.test.ts` | 0 files |
| `styles/theme.test.tsx` | 0 files |
| `utils/cn.test.ts` | 0 files |
| `utils/coordinates.test.ts` | 0 files |
