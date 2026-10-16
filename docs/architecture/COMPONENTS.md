# PaperFlow Component Reference

This document lists the React components, the Zustand stores, the hooks, the core library modules and the Electron modules of PaperFlow. Each component table lists every exported component of its folder.

## Conventions

- **Props** lists the members of the component's own props type. A `?` marks an optional member. `None` means that the component takes no props.
- **Store hooks** lists the `use...Store` hooks that the component's file refers to.
- A component with an inline props type lists the members of that type.

---

## React Components

### Layout (`src/components/layout/`)

| Component | Props | Store hooks |
|---|---|---|
| `AppLayout` | `children`, `showSidebar?`, `showToolbar?` | None |
| `MinimalLayout` | `children` | None |
| `Header` | None | `useDocumentStore` |
| `MobileToolbar` | None | `useDocumentStore`, `useAnnotationStore` |
| `Sidebar` | None | None |
| `TitleBar` | `title?`, `isModified?`, `isMaximized?`, `className?`, `children?` | None |
| `TrafficLightsSpacer` | None | None |
| `Toolbar` | None | `useAnnotationStore`, `useUIStore` |

No file under `src/` or `electron/` imports `AppLayout`.

### Viewer (`src/components/viewer/`)

| Component | Props | Store hooks |
|---|---|---|
| `PDFViewer` | None | `useDocumentStore` |
| `SinglePageView` | `renderer`, `currentPage`, `zoom`, `onWheel?` | `useUIStore` |
| `ContinuousView` | `renderer`, `pageCount`, `currentPage`, `zoom`, `onPageChange?`, `onWheel?` | `useUIStore` |
| `SpreadView` | `renderer`, `currentPage`, `pageCount`, `zoom`, `coverMode?`, `onWheel?` | None |
| `PageCanvas` | `renderer`, `pageNumber`, `scale`, `onPageRendered?` | `useAnnotationStore`, `useUIStore`, `useFormStore` |
| `TextLayer` | `renderer`, `pageNumber`, `scale`, `width`, `height`, `onTextSelected?` | None |
| `VirtualizedViewer` | `renderer`, `pageCount`, `currentPage`, `zoom`, `onPageChange?`, `onWheel?` | None |
| `PageNavigation` | `className?` | `useDocumentStore` |
| `ZoomControls` | `className?` | `useDocumentStore` |
| `DropZone` | `onFileDrop`, `accept?`, `multiple?`, `disabled?`, `className?`, `children?` | None |
| `PageSkeleton` | `width?`, `height?`, `className?` | None |
| `ThumbnailSkeleton` | `className?` | None |

No file under `src/` or `electron/` imports `VirtualizedViewer`.

### Sidebar (`src/components/sidebar/`)

| Component | Props | Store hooks |
|---|---|---|
| `ThumbnailSidebar` | `className?` | `useDocumentStore`, `useHistoryStore` |
| `OutlinePanel` | `className?` | `useDocumentStore` |

### Annotations (`src/components/annotations/`)

| Component | Props | Store hooks |
|---|---|---|
| `AnnotationLayer` | `pageIndex`, `width`, `height`, `scale`, `pageHeight` | `useAnnotationStore` |
| `AnnotationProperties` | `onClose` | `useAnnotationStore`, `useHistoryStore` |
| `ArrowTool` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive` | `useAnnotationStore` |
| `CustomStampDialog` | `isOpen`, `onClose`, `onCreate` | None |
| `DrawingAnnotation` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete` | None |
| `DrawingCanvas` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive` | `useAnnotationStore` |
| `DrawingToolOptions` | `onClose?` | `useAnnotationStore` |
| `EllipseTool` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive` | `useAnnotationStore` |
| `EraserTool` | `pageIndex`, `width`, `height`, `scale`, `isActive` | `useAnnotationStore` |
| `ExportImportDialog` | `isOpen`, `onClose` | `useAnnotationStore`, `useDocumentStore` |
| `Highlight` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete` | None |
| `HighlightTool` | `pageIndex`, `isActive`, `selectionRects?`, `selectedText?`, `onHighlightCreated?`, `onClearSelection?` | `useAnnotationStore` |
| `LineTool` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive` | `useAnnotationStore` |
| `NoteReplies` | `annotation`, `onUpdate` | `useAnnotationStore` |
| `NoteTool` | `pageIndex`, `scale`, `pageHeight`, `onNoteCreated?` | `useAnnotationStore` |
| `OpacitySlider` | `value`, `onChange`, `min?`, `max?` | None |
| `RectangleTool` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive` | `useAnnotationStore` |
| `ResizeHandles` | `bounds`, `rotation?`, `onResize`, `handleSize?` | None |
| `RotationHandle` | `centerX`, `centerY`, `bounds`, `currentRotation`, `onRotate` | None |
| `SelectionPopup` | `position`, `text`, `pdfRects`, `pageIndex`, `onAnnotationCreated?`, `onClose` | `useAnnotationStore` |
| `ShapeAnnotation` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete` | None |
| `ShapeOptions` | `onClose?` | `useAnnotationStore` |
| `ShapeOverlay` | `pageIndex`, `width`, `height`, `scale`, `pageHeight` | `useAnnotationStore` |
| `StampPicker` | `selectedStamp`, `onSelect`, `onCreateCustom?`, `customStamps?`, `onClose?` | None |
| `StampTool` | `pageIndex`, `width`, `height`, `scale`, `pageHeight`, `isActive`, `stampType`, `customText?`, `customColor?` | `useAnnotationStore` |
| `StampTransform` | `scale`, `rotation`, `onScaleChange`, `onRotationChange`, `onClose?` | None |
| `StickyNote` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete`, `onUpdate` | None |
| `Strikethrough` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete` | None |
| `Underline` | `annotation`, `isSelected`, `scale`, `pageHeight`, `onSelect`, `onDelete` | None |

### Editor (`src/components/editor/`)

| Component | Props | Store hooks |
|---|---|---|
| `AlignmentPicker` | `value`, `onChange`, `className?` | None |
| `FontPicker` | `value`, `onChange`, `className?` | None |
| `FontSizePicker` | `value`, `onChange`, `min?`, `max?`, `className?` | None |
| `InlineTextEditor` | `textBox`, `scale`, `pageHeight`, `onComplete?`, `onCancel?`, `maxCharsPerLine?`, `className?` | `useTextStore` |
| `LineSpacing` | `value`, `onChange`, `className?` | None |
| `RichTextToolbar` | `className?`, `compact?` | `useTextStore`, `useHistoryStore` |
| `TextBoxTool` | `pageIndex`, `pageHeight`, `scale`, `isActive`, `containerRef`, `onTextBoxCreated?`, `className?` | `useTextStore` |
| `TextBoxTransform` | `textBox`, `pageHeight`, `scale`, `isSelected`, `isEditing`, `onSelect?`, `onStartEdit?`, `className?` | `useTextStore` |
| `TextColorPicker` | `value`, `onChange`, `className?` | None |
| `TextProperties` | `selection?`, `textBox?`, `className?` | None |
| `TextSelector` | `renderer`, `pageNumber`, `pageHeight`, `scale`, `onSelectionChange?`, `onDoubleClick?`, `containerRef`, `disabled?` | None |

### Forms (`src/components/forms/`)

| Component | Props | Store hooks |
|---|---|---|
| `Checkbox` | `field`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?`, `onValueChange?` | `useFormStore` |
| `Dropdown` | `field`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?`, `onValueChange?` | `useFormStore` |
| `FieldError` | `errors`, `className?` | None |
| `FieldErrorTooltip` | `errors`, `visible`, `position?` | None |
| `RequiredIndicator` | `className?` | None |
| `FormActions` | `pdfFilename?`, `onValidationError?`, `className?` | `useFormStore` |
| `FormFieldRenderer` | `field`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?`, `onValueChange?` | None |
| `FormLayer` | `pageIndex`, `width`, `height`, `scale`, `pageHeight` | `useFormStore` |
| `RadioButton` | `field`, `optionValue`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?`, `onValueChange?` | `useFormStore` |
| `RadioGroup` | `field`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?`, `onValueChange?` | `useFormStore` |
| `TextField` | `field`, `scale`, `pageHeight`, `onFocus?`, `onBlur?`, `onTab?` | `useFormStore` |

Form designer (`src/components/forms/designer/`):

| Component | Props | Store hooks |
|---|---|---|
| `DesignCanvas` | `pageIndex`, `pageWidth`, `pageHeight`, `scale` | `useFormDesignerStore` |
| `DesignerToolbar` | `onSave?`, `onClose?` | `useFormDesignerStore` |
| `FieldPalette` | None | `useFormDesignerStore` |
| `FieldPreview` | `field`, `isSelected`, `isPreviewMode`, `onValueChange?` | None |
| `FieldProperties` | None | `useFormDesignerStore` |
| `FormDesigner` | `pageIndex?`, `pageWidth`, `pageHeight`, `scale?`, `onSave?`, `onClose?` | `useFormDesignerStore` |

### Signatures (`src/components/signatures/`)

| Component | Props | Store hooks |
|---|---|---|
| `DateStamp` | `date?`, `format?`, `position?`, `className?` | None |
| `DrawSignature` | `onSignatureChange`, `width?`, `height?`, `lineWidth?`, `isInitials?` | None |
| `ImageSignature` | `onSignatureChange`, `isInitials?` | None |
| `InitialsModal` | `isOpen`, `onClose`, `onSelect?` | None |
| `SignatureList` | `signatures`, `onSelect`, `isInitials?` | `useSignatureStore` |
| `SignatureModal` | `isOpen`, `onClose`, `isInitials?`, `onSelect?` | `useSignatureStore` |
| `SignaturePlacer` | `pageIndex`, `pageWidth`, `pageHeight`, `scale` | `useSignatureStore` |
| `SignatureResize` | `signature`, `scale` | `useSignatureStore` |
| `SignatureRotation` | `signature`, `scale` | `useSignatureStore` |
| `TypeSignature` | `onSignatureChange`, `isInitials?` | None |

### Pages (`src/components/pages/`)

| Component | Props | Store hooks |
|---|---|---|
| `DraggableThumbnail` | `pageNumber`, `pageIndex`, `thumbnailUrl?`, `width`, `height`, `isCurrentPage`, `isSelected`, `isDragging`, `isDropTarget`, `dropPosition`, `onClick`, `onContextMenu`, `dragProps` | None |
| `InsertPageDialog` | `open`, `onOpenChange`, `currentPageIndex`, `pageCount`, `position`, `onInsert` | None |
| `MergeDialog` | `open`, `onOpenChange`, `currentDocument?`, `onMerge` | None |
| `MoveToDialog` | `open`, `onOpenChange`, `currentPageIndex`, `pageCount`, `selectedPages`, `onMove` | None |
| `PageContextMenu` | `children`, `pageCount`, `isSelected`, `selectedCount`, `onDelete`, `onDeleteSelected`, `onDuplicate`, `onRotateCW`, `onRotateCCW`, `onRotate180`, `onInsertBefore`, `onInsertAfter`, `onMoveTo`, `onExtract` | None |
| `RotateMenu` | `onRotate`, `disabled?`, `className?` | None |
| `SplitDialog` | `open`, `onOpenChange`, `pageCount`, `onSplitByRange`, `onSplitEveryN`, `onSplitBySize` | None |

### Export (`src/components/export/`)

| Component | Props | Store hooks |
|---|---|---|
| `CompressDialog` | `isOpen`, `onClose` | `useDocumentStore` |
| `ImageExportDialog` | `isOpen`, `onClose` | `useDocumentStore`, `useAnnotationStore` |

### Print (`src/components/print/`)

| Component | Props | Store hooks |
|---|---|---|
| `AccessibilityOptions` | `value`, `onChange`, `className?` | None |
| `AdvancedPrintSettings` | `className?` | `usePrintStore` |
| `BindingOptions` | `value`, `onChange`, `pageCount`, `className?`, `compact?` | None |
| `BookletWizard` | `onComplete?`, `onCancel?`, `className?` | `useDocumentStore`, `usePrintStore` |
| `MarginEditor` | `className?` | `usePrintStore` |
| `OrientationOptions` | `orientation`, `onOrientationChange` | None |
| `PageLayout` | `className?` | `usePrintStore` |
| `PageRangeSelector` | `pageCount`, `currentPage`, `onRangeChange` | None |
| `PrintDialog` | `isOpen`, `onClose` | `useDocumentStore`, `useAnnotationStore`, `useFormStore` |
| `PrintPresetsManager` | `className?`, `onApply?` | `usePrintStore` |
| `PrintPreview` | `pages`, `currentPreviewIndex`, `onPreviewIndexChange` | None |
| `PrintPreviewEnhanced` | `className?`, `showMargins?`, `showGrid?`, `onPageChange?` | `usePrintStore`, `useDocumentStore` |
| `PrintQualitySelector` | `className?`, `compact?` | `usePrintStore` |
| `PrinterStatus` | `printer?`, `className?`, `compact?` | `usePrintStore` |
| `ScaleOptions` | `scaleType`, `customScale`, `onScaleTypeChange`, `onCustomScaleChange` | None |

The name `PageRangeSelector` is also exported from `src/components/ocr/`. The two exports are separate components.

### UI (`src/components/ui/`)

| Component | Props | Store hooks |
|---|---|---|
| `SkipNav` | `targetId?` | None |
| `LiveRegion` | `message`, `politeness?` | None |
| `VisuallyHidden` | `children`, `as?` | None |
| `IconButton` | `aria-label`, `onClick?`, `disabled?`, `className?`, `children` | None |
| `Button` | `variant?`, `size?`, plus button HTML attributes | None |
| `Checkbox` | `checked?`, `onCheckedChange?`, `disabled?`, `id?`, `name?`, `className?` | None |
| `Dialog` | Radix dialog root props | None |
| `DialogTrigger` | Radix trigger props | None |
| `DialogPortal` | Radix portal props | None |
| `DialogClose` | Radix close props | None |
| `DialogOverlay` | Radix overlay props | None |
| `DialogContent` | Radix content props | None |
| `DialogHeader` | `div` attributes | None |
| `DialogFooter` | `div` attributes | None |
| `DialogTitle` | Radix title props | None |
| `DialogDescription` | Radix description props | None |
| `Input` | `error?`, plus input HTML attributes | None |
| `LoadingIndicator` | `message?`, `progress?`, `showProgress?`, `onCancel?`, `className?` | None |
| `LoadingOverlay` | `message?`, `progress?`, `showProgress?`, `onCancel?` (type `LoadingIndicatorProps`) | None |
| `Progress` | `value?`, `max?`, plus `div` attributes | None |
| `Select` | `error?`, plus select HTML attributes | None |
| `Skeleton` | `className?`, `width?`, `height?`, `rounded?` | None |
| `SkeletonText` | `lines?`, `className?` | None |
| `ThemeToggle` | `showLabel?`, `className?` | `useUIStore` |
| `ThemeSelector` | `className?` | `useUIStore` |

The `Checkbox` name is also exported from `src/components/forms/`. The two exports are separate components.

### Offline (`src/components/offline/`)

| Component | Props | Store hooks |
|---|---|---|
| `ConflictDialog` | `isOpen`, `onClose`, `conflict?` | `useOfflineStore` |
| `OfflineBanner` | `className?`, `position?`, `variant?` | `useOfflineStore` |
| `OfflineIndicator` | `className?`, `showLabel?`, `size?` | `useOfflineStore` |
| `OfflineSettings` | `className?` | `useOfflineStore` |
| `SyncStatusPanel` | `onClose` | `useOfflineStore` |
| `VersionCompare` | `localVersion`, `remoteVersion`, `conflictType` | None |

### Update (`src/components/update/`)

| Component | Props | Store hooks |
|---|---|---|
| `InstallPrompt` | `className?` | `useUpdateStore`, `useDocumentStore` |
| `ReleaseNotes` | `className?` | `useUpdateStore` |
| `UpdateNotification` | `className?` | `useUpdateStore` |
| `UpdateErrorNotification` | None | `useUpdateStore` |
| `UpdateProgress` | `className?` | `useUpdateStore` |
| `UpdateProgressIndicator` | None | `useUpdateStore` |
| `UpdateSettings` | `className?` | `useUpdateStore` |

### Updates (`src/components/updates/`)

| Component | Props | Store hooks |
|---|---|---|
| `UpdateNotification` | `className?` | None |

The name `UpdateNotification` is also exported from `src/components/update/`. The two exports are separate components.

### Scanner (`src/components/scanner/`)

| Component | Props | Store hooks |
|---|---|---|
| `BatchScanWorkflow` | `onComplete?`, `onCancel?`, `className?` | `useScannerStore` |
| `ColorModeSelector` | `value`, `onChange`, `availableModes?`, `className?` | None |
| `CropTool` | `imageUrl`, `initialCrop?`, `aspectRatio?`, `minSize?`, `onCropChange?`, `onCropComplete?`, `className?` | None |
| `EnhancementTools` | `settings`, `onChange`, `onApply?`, `onReset?`, `className?` | None |
| `PageOrganizer` | `pages`, `onPagesChange`, `onDelete?`, `onRotate?`, `className?` | None |
| `ProfileManager` | `onSelect?`, `onClose?`, `className?` | `useScannerStore` |
| `ResolutionPicker` | `value`, `onChange`, `availableResolutions?`, `className?` | None |
| `ScanPreview` | `className?`, `onAccept?`, `onRescan?` | `useScannerStore` |
| `ScanSettingsPanel` | `className?` | `useScannerStore` |
| `ScannerInfo` | `device`, `className?`, `compact?` | None |
| `ScannerSelectDialog` | `isOpen`, `onClose`, `onSelect?` | `useScannerStore` |

### Security (`src/components/security/`)

| Component | Props | Store hooks |
|---|---|---|
| `EnrollmentGuide` | `onComplete?`, `className?` | None |
| `HardwareKeyAuth` | `onSuccess?`, `onCancel?`, `timeout?`, `allowFallback?`, `className?` | `useSecurityStore` |
| `HardwareKeyEnrollment` | `userId`, `userName`, `displayName`, `onComplete?`, `onCancel?`, `className?` | `useSecurityStore` |
| `KeyChallenge` | `isActive`, `timeout?`, `onTimeout?`, `keyType?`, `className?` | None |
| `KeyManagement` | `onAddKey?`, `className?` | `useSecurityStore` |

### Batch (`src/components/batch/`)

| Component | Props | Store hooks |
|---|---|---|
| `BatchDashboard` | `activeOnly?`, `onJobSelect?` | `useNativeBatchStore` |
| `BatchPanel` | `files?`, `onFilesAdded?`, `onProcessStart?`, `onProcessCancel?`, `isProcessing?`, `progress?` | None |
| `BatchSummary` | `jobId`, `onClose?`, `onRetry?`, `onExportReport?` | `useNativeBatchStore` |
| `BatchWizard` | `initialType?`, `onComplete?`, `onCancel?` | `useNativeBatchStore` |
| `BatesNumberDialog` | `isOpen?`, `onClose?`, `onApply?` | None |
| `FlattenDialog` | `isOpen?`, `onClose?`, `onApply?` | None |
| `HeaderFooterDialog` | `isOpen?`, `onClose?`, `onApply?` | None |
| `TemplateManager` | `operationType?`, `onSelectTemplate?`, `selectionMode?` | `useNativeBatchStore` |
| `WatermarkDialog` | `isOpen?`, `onClose?`, `onApply?` | None |

### File watch (`src/components/fileWatch/`)

| Component | Props | Store hooks |
|---|---|---|
| `ChangePreview` | `changeSummary`, `className?` | None |
| `ChangeCountBadge` | `count`, `severity` (`'minor'`, `'moderate'` or `'major'`), `className?` | None |
| `DocumentCompare` | `currentDocument`, `externalDocument`, `diff`, `onAcceptExternal`, `onKeepCurrent`, `onMergePage?`, `className?` | None |
| `ExternalChangeNotification` | `change`, `onReload`, `onIgnore`, `onCompare`, `className?` | `useFileWatchStore` |
| `ExternalChangeNotifications` | `onReload`, `onCompare`, `className?` | `useFileWatchStore` |
| `FileLockNotification` | `filePath`, `isLocked`, `onRetry`, `onDismiss`, `className?` | None |
| `FileLockIndicator` | `isLocked`, `onClick?`, `className?` | None |
| `WatchStatusIndicator` | `filePath?`, `showLabel?`, `size?`, `className?` | `useFileWatchStore` |
| `GlobalWatchStatus` | `className?` | `useFileWatchStore` |
| `WatchToggleButton` | `filePath`, `onToggle?`, `className?` | `useFileWatchStore` |

### Settings (`src/components/settings/`)

| Component | Props | Store hooks |
|---|---|---|
| `AutoReloadSettings` | `className?` | `useFileWatchStore` |
| `NotificationSettings` | None | `useSettingsStore` |
| `ShortcutSettings` | None | `useShortcutsStore` |

### Enterprise (`src/components/enterprise/`)

| Component | Props | Store hooks |
|---|---|---|
| `ConfigExportDialog` | `isOpen`, `onClose`, `onExport?`, `onImport?` | `useEnterprisePolicyStore` |
| `ConfigSourceBadge` | `source`, `abbreviated?`, `className?` | None |
| `ConfigurationViewer` | `showAll?`, `category?`, `searchFilter?`, `expandAll?`, `className?` | `useEnterprisePolicyStore` |
| `LockedSettingBadge` | `category`, `settingKey`, `showTooltip?`, `className?`, `size?` | None |
| `LockedSettingWrapper` | `category`, `settingKey`, `children`, `label?`, `description?`, `className?` | None |
| `PolicyStatusIndicator` | `variant?`, `className?`, `showWhenNotManaged?` | `useEnterprisePolicyStore` |

The file that exports `LockedSettingBadge` also exports `withLockCheck`.

### Kiosk (`src/components/kiosk/`)

| Component | Props | Store hooks |
|---|---|---|
| `KioskHeader` | `brandingLogo?`, `welcomeMessage?`, `className?` | None |
| `KioskShell` | `children`, `className?` | `useKioskStore` |
| `KioskToolbar` | `items`, `showPageNavigation?`, `showZoomControls?`, `showSearch?`, `touchMode?`, `className?`, `currentPage?`, `totalPages?`, `zoom?`, `onPrevPage?`, `onNextPage?`, `onZoomIn?`, `onZoomOut?`, `onSearch?`, `onFeatureClick?` | None |

### Home (`src/components/home/`)

| Component | Props | Store hooks |
|---|---|---|
| `RecentFiles` | `onFileSelect`, `className?` | None |

### Toolbar (`src/components/toolbar/`)

| Component | Props | Store hooks |
|---|---|---|
| `AnnotationToolbar` | None | `useAnnotationStore`, `useSignatureStore` |
| `SearchBar` | `isOpen`, `onClose`, `className?` | `useDocumentStore` |
| `ViewModeToggle` | `className?` | `useDocumentStore` |

### Accessibility (`src/components/accessibility/`)

| Component | Props | Store hooks |
|---|---|---|
| `AccessibilityPanel` | `onRunCheck?`, `isChecking?`, `progress?`, `results?`, `onIssueSelect?`, `onAutoFix?` | None |
| `AccessibilityReport` | `documentName?`, `report?`, `onExport?`, `onPrint?` | None |
| `IssueList` | `issues?`, `selectedIssueId?`, `onIssueSelect?`, `onIssueFix?`, `onIssueIgnore?`, `severityFilter?`, `onSeverityFilterChange?`, `categoryFilter?`, `onCategoryFilterChange?` | None |

### Comparison (`src/components/comparison/`)

| Component | Props | Store hooks |
|---|---|---|
| `ComparisonDialog` | `isOpen?`, `onClose?`, `onCompare?`, `currentDocument?` | None |
| `ComparisonReport` | `document1Name?`, `document2Name?`, `summary?`, `differences?`, `onDifferenceClick?`, `onExport?` | None |
| `OverlayView` | `document1?`, `document2?`, `overlayOpacity?`, `onOpacityChange?`, `document1Color?`, `document2Color?`, `currentPage?`, `onPageChange?`, `zoom?`, `topDocument?`, `onSwapDocuments?` | None |
| `SideBySideView` | `document1?`, `document2?`, `differences?`, `selectedDifferenceIndex?`, `onDifferenceSelect?`, `currentPage?`, `onPageChange?`, `zoom?` | None |

### Help (`src/components/help/`)

| Component | Props | Store hooks |
|---|---|---|
| `KeyboardShortcutsDialog` | `isOpen`, `onClose` | `useShortcutsStore` |

### OCR (`src/components/ocr/`)

| Component | Props | Store hooks |
|---|---|---|
| `BatchOCRProgress` | `progress`, `onPause`, `onResume`, `onCancel`, `onRetry?` | None |
| `LanguageSelector` | None | `useOCRStore` |
| `OCRDialog` | None | `useUIStore`, `useOCRStore`, `useDocumentStore` |
| `OCRExportDialog` | `open`, `onOpenChange` | `useOCRStore` |
| `OCRProgress` | None | `useOCRStore` |
| `OCRResultsPanel` | None | `useOCRStore`, `useDocumentStore` |
| `PageRangeSelector` | `onRangeChange` | `useDocumentStore` |
| `PreprocessingOptions` | None | `useOCRStore` |

### Redaction (`src/components/redaction/`)

| Component | Props | Store hooks |
|---|---|---|
| `PatternSearchDialog` | `isOpen?`, `onClose?`, `onPatternsSelected?` | None |
| `RedactionToolbar` | `onToolSelect?`, `onApplyRedactions?`, `canApply?`, `activeTool?` | None |
| `RedactionVerify` | `pendingCount?`, `appliedCount?`, `onVerify?`, `isVerifying?`, `verificationResult?` | None |

### Lazy-loaded components (`src/components/lazy/`)

| Export | Loads |
|---|---|
| `LazySignatureModal` | `SignatureModal` |
| `LazyDrawingCanvas` | `DrawingCanvas` |
| `LazyImageExportDialog` | `ImageExportDialog` |
| `LazyCompressDialog` | `CompressDialog` |
| `LazyPrintDialog` | `PrintDialog` |
| `LazyMergeDialog` | `MergeDialog` |
| `LazySplitDialog` | `SplitDialog` |

---

## Zustand Stores (`src/stores/`)

### Core stores

The excerpts below show the state fields and some actions. Each excerpt line appears in its store file as written.

```typescript
// src/stores/documentStore.ts (excerpt)
interface DocumentState {
  fileName: string | null;
  fileData: ArrayBuffer | null;
  documentInfo: PDFDocumentInfo | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  renderer: PDFRenderer | null;

  loadDocument: (file: File) => Promise<void>;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: () => void;
  fitToPage: () => void;
  setViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setModified: (modified: boolean) => void;
  closeDocument: () => void;
}
```

```typescript
// src/stores/annotationStore.ts (excerpt)
interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeOpacity: number;
  activeStrokeWidth: number;
  activeFillColor: string | undefined;
  activeShapeType: ShapeType;
  activeStampType: StampType;

  addAnnotation: (
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setActiveTool: (tool: AnnotationType | null) => void;
  addReply: (annotationId: string, content: string, author: string) => void;
  getPageAnnotations: (pageIndex: number) => Annotation[];
  exportAnnotations: () => string;
  importAnnotations: (json: string) => void;
  clearAnnotations: () => void;
}
```

```typescript
// src/stores/historyStore.ts (excerpt)
interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;

  push: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}
```

```typescript
// src/stores/uiStore.ts (excerpt)
interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeDialog: string | null;
  darkMode: boolean;
  activeTool: EditorTool;

  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  openDialog: (dialogId: string) => void;
  closeDialog: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setActiveTool: (tool: EditorTool) => void;
}
```

```typescript
// src/stores/settingsStore.ts (excerpt)
interface SettingsState {
  defaultZoom: number;
  defaultViewMode: 'single' | 'continuous' | 'spread';
  smoothScrolling: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds

  setDefaultZoom: (zoom: number) => void;
  setDefaultViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setSmoothScrolling: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (seconds: number) => void;
}
```

### Other stores

| Store | Purpose | Key state |
|---|---|---|
| `formStore` | Form fields and validation | `fields`, `fieldsByPage`, `validationErrors` |
| `signatureStore` | Saved signatures and placements | `signatures`, `placedSignatures` |
| `textStore` | Text box editing | `textBoxes`, `selectedId` |
| `ocrStore` | OCR results and progress | `results`, `isProcessing` |
| `formDesignerStore` | Form designer mode and fields | `isDesignMode`, `selectedFieldIds` |
| `redactionStore` | Redaction marks and search results | `marks`, `searchResults` |
| `comparisonStore` | Document comparison | `result`, `viewMode` |
| `batchStore` | Batch operation queue | `operations`, `results` |
| `recentFilesStore` | Recently opened files | `recentFiles` |
| `updateStore` | Update state and settings | `state`, `settings`, `isNotificationVisible` |
| `shortcutsStore` | Keyboard shortcuts | `shortcuts`, `pendingChanges` |
| `fileWatchStore` | Watched files and external changes | `watchedFiles`, `externalChanges` |
| `offlineStore` | Connection, sync and conflicts | `pendingOperationsCount`, `syncStatus`, `conflicts` |
| `nativeBatchStore` | Native batch jobs | `jobs`, `queueStats`, `resourceUsage` |
| `printStore` | Print settings, printers and jobs | `settings`, `printers`, `jobs` |
| `scannerStore` | Scanner devices and scans | `devices`, `isScanning` |
| `securityStore` | Hardware key authentication | `enrolledKeys`, `isAuthenticated` |
| `enterprisePolicyStore` | Enterprise policy configuration | `config`, `configSources`, `lockedSettings` |
| `licenseStore` | License state | `license`, `lastChecked`, `isOffline` |
| `lanStore` | LAN peer discovery | `discoveredPeers`, `connectedPeers` |
| `kioskStore` | Kiosk configuration and session | `config`, `session` |

---

## Hooks (`src/hooks/`)

| File | Exports |
|---|---|
| `useAnnotationShortcuts.ts` | `useAnnotationShortcuts` |
| `useAnnounce.ts` | `useAnnounce` |
| `useAutoSave.ts` | `useAutoSave`, `useAutoSaveRecovery` |
| `useBeforeUnload.ts` | `useBeforeUnload`, `useBeforeUnloadCallback` |
| `useClipboard.ts` | `useClipboard`, `copyToClipboard` |
| `useConnectionStatus.ts` | `useConnectionStatus`, `useIsOnline`, `useOnReconnect`, `useOnDisconnect` |
| `useDropZone.ts` | `useDropZone` |
| `useFileSystem.ts` | `useFileSystem` |
| `useFormFields.ts` | `useFormFields` |
| `useFormNavigation.ts` | `useFormNavigation` |
| `useHighlightTool.ts` | `useHighlightTool` |
| `useKeyboardNavigation.ts` | `useKeyboardNavigation`, `useFocusTrap` |
| `useOfflineData.ts` | `useOfflineData`, `useOfflineDocument`, `useOfflineDocuments` |
| `useOfflineSync.ts` | `useOfflineSync` |
| `usePageDrag.ts` | `usePageDrag` |
| `usePageSelection.ts` | `usePageSelection` |
| `usePlatform.ts` | `usePlatform`, `useElectronMenuEvents` |
| `usePointerInput.ts` | `usePointerInput` |
| `useSearch.ts` | `useSearch` |
| `useSignatureInput.ts` | `useSignatureInput` |
| `useTextSelection.ts` | `useTextSelection` |
| `useThumbnails.ts` | `useThumbnails`, `useLazyThumbnails` |
| `useTouchGestures.ts` | `useTouchGestures` |
| `useUnsavedChanges.ts` | `useUnsavedChanges`, `useDocumentModified` |
| `useVirtualization.ts` | `useVirtualization`, `useDynamicVirtualization` |
| `useVisiblePages.ts` | `useVisiblePages` |

`src/hooks/index.ts` re-exports these hooks.

---

## Core Libraries (`src/lib/`)

This section lists the modules of five folders. Other folders under `src/lib/` are not listed.

### PDF (`src/lib/pdf/`)

```
lib/pdf/
├── renderer.ts        # PDFRenderer class
├── saver.ts           # savePdf, copyPdf, getPdfInfo
├── signatureEmbed.ts  # embedSignaturesInPdf, hasExistingSignatures, getSignatureFieldPositions
└── textSaver.ts       # saveTextBoxesToPdf, exportTextBoxes, importTextBoxes
```

### Pages (`src/lib/pages/`)

```
lib/pages/
├── extractPages.ts    # extractPages and the other extract functions
├── index.ts           # Module exports
├── mergePdf.ts        # mergePdfs, mergePdfsWithSelection
├── pageOperations.ts  # deletePage(s), duplicatePage, rotatePage(s), insertBlankPage, reorderPages, movePage(s), getPageInfo
└── splitPdf.ts        # splitByRange, splitEveryNPages, splitBySize, splitIntoSinglePages
```

### Annotations (`src/lib/annotations/`)

```
lib/annotations/
├── drawingSerializer.ts  # serializeDrawingPaths, deserializeDrawingPaths, simplifyPath
└── serializer.ts         # serializeAnnotation, serializeReply, exportAnnotations, importAnnotations
```

### Storage (`src/lib/storage/`)

```
lib/storage/
├── fileHandler.ts       # openPdfFile, savePdfFile, savePdfFileAs, downloadPdf, fetchPdfFromUrl
├── formStorage.ts       # saveFormData, loadFormData, deleteFormData, hasFormData
├── indexeddb.ts         # RecentFile, AutoSaveEntry and the storage object
├── signatureStorage.ts  # Signature storage in IndexedDB, with encryption support
└── stampStorage.ts      # Custom stamp storage in IndexedDB
```

### Export (`src/lib/export/`)

```
lib/export/
├── compressPdf.ts  # compressPdf, analyzePdfSize, formatFileSize
├── flattenPdf.ts   # flattenPdf: embeds annotations and form field values in the page content
├── imageExport.ts  # PNG and JPEG page export
├── index.ts        # Module exports
└── pdfExport.ts    # exportPdf
```

---

## Electron Modules (`electron/`)

### Main process (`electron/main/`)

```
electron/main/
├── fileLock.ts              # File lock detection
├── folderWatcher.ts         # Folder watcher
├── index.ts                 # Main process entry point
├── lifecycle.ts             # App lifecycle management
├── networkStatus.ts         # Network status detection
├── print/                   # Native print integration
├── scanner/                 # Scanner bridge
├── security/                # WebAuthn bridge
├── security.ts              # Security configuration
├── updater.ts               # Auto-updater (electron-updater)
├── updates/                 # Differential updates
├── watcherOptimizations.ts  # Watcher optimizations
├── watcherService.ts        # Watcher service
├── windowManager.ts         # Window manager
└── windowState.ts           # Window state persistence
```

### Preload scripts (`electron/preload/`)

```
electron/preload/
├── index.ts             # Exposes the `electron` API through contextBridge
├── networkPreload.ts    # Exposes the `electronNetwork` API
└── webauthnPreload.ts   # Exposes the `electronWebAuthn` API
```

### IPC (`electron/ipc/`)

```
electron/ipc/
├── channels.ts              # IPC channel names and events
├── clipboardHandlers.ts     # Clipboard IPC handlers
├── dialogHandlers.ts        # Dialog IPC handlers
├── fileHandlers.ts          # File system IPC handlers
├── fileWatchIPC.ts          # File watch IPC handlers
├── handlers.ts              # setupIpcHandlers
├── menuHandlers.ts          # Menu IPC handlers
├── notificationHandlers.ts  # Notification, tray and dock IPC handlers
├── pathSandbox.ts           # Path sandbox for IPC file handlers
├── printHandlers.ts         # Print IPC handlers
├── safeStorageHandlers.ts   # SafeStorage IPC handlers
├── shellHandlers.ts         # Shell IPC handlers
├── storageHandlers.ts       # Secure storage IPC handlers
└── types.ts                 # IPC type definitions
```

### Workers (`electron/workers/`)

```
electron/workers/
├── pdfWorker.ts       # PDF worker thread
├── workerManager.ts   # Worker manager
└── workerPool.ts      # Worker pool
```

### Feature modules (`electron/`)

```
electron/
├── attention.ts             # Cross-platform attention manager
├── autoSave.ts              # Auto-save module
├── backup.ts                # Backup module
├── clipboard.ts             # Clipboard module
├── contextMenu.ts           # Context menu module
├── crashReporter.ts         # Crash reporter module
├── dialogs.ts               # Native dialogs module
├── dock.ts                  # macOS Dock badge manager
├── fileAssociation.ts       # File association handler
├── fileWatcher.ts           # File watcher module
├── jumpList.ts              # Windows jump list manager
├── linuxLauncher.ts         # Linux launcher integration
├── menu.ts                  # Application menu manager
├── menuTemplate.ts          # Menu template definitions
├── notifications.ts         # Desktop notification manager
├── powerSave.ts             # Power save blocker module
├── print.ts                 # Print module
├── protocol.ts              # Protocol handler module
├── recentFiles.ts           # Recent files management
├── secureStorage.ts         # Secure storage module
├── shell.ts                 # Shell integration module
├── shortcuts.ts             # Global keyboard shortcuts module
├── startup.ts               # Startup module
├── taskbarOverlay.ts        # Windows taskbar overlay icons
├── taskbarProgress.ts       # Windows taskbar progress
├── thumbnailToolbar.ts      # Windows thumbnail toolbar
├── tray.ts                  # System tray manager
├── trayMenu.ts              # System tray context menu
├── windowsCrashReporter.ts  # Windows-specific crash reporter
├── ipc/                     # IPC handlers
├── main/                    # Main process
├── preload/                 # Preload scripts
├── native/                  # Native scanner addons: ImageCapture (macOS), SANE (Linux), TWAIN and WIA (Windows)
├── touchbar/                # Touch Bar manager
├── workers/                 # Worker threads
└── tsconfig.json            # TypeScript configuration
```

---

## Component Relationships

The lists show the import edges that the source files declare.

- `src/pages/Editor.tsx` imports `Header`, `Sidebar`, `Toolbar`, `PDFViewer`, `SearchBar` and `LoadingOverlay`.
- `src/components/layout/AppLayout.tsx` imports `Header`, `Sidebar` and `Toolbar`.
- `src/components/layout/Header.tsx` imports `ThemeToggle`, `Button`, `ImageExportDialog`, `CompressDialog` and `PrintDialog`.
- `src/components/layout/Sidebar.tsx` imports `ThumbnailSidebar` and `OutlinePanel`.
- `src/components/sidebar/ThumbnailSidebar.tsx` imports `DraggableThumbnail`, `PageContextMenu`, `MoveToDialog`, `InsertPageDialog`, `MergeDialog` and `SplitDialog`.
- `src/components/viewer/PDFViewer.tsx` imports `SinglePageView`, `ContinuousView` and `SpreadView`.
- `SinglePageView`, `ContinuousView` and `SpreadView` import `PageCanvas`.
- `src/components/viewer/PageCanvas.tsx` imports `TextLayer`, `AnnotationLayer`, `FormLayer`, `SelectionPopup`, `NoteTool`, `DrawingCanvas`, `RectangleTool`, `EllipseTool`, `ArrowTool` and `LineTool`.
- `src/components/lazy/index.ts` loads `SignatureModal`, `DrawingCanvas`, `ImageExportDialog`, `CompressDialog`, `PrintDialog`, `MergeDialog` and `SplitDialog` with dynamic imports.

<!-- repo-map:no-verification -->
