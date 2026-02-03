# PaperFlow Component Reference

> **Version:** 3.0.0 | **Last Updated:** 2026-02-03

Complete reference for all components, stores, libraries, and modules in PaperFlow.

---

## Table of Contents

1. [UI Components](#ui-components)
2. [Desktop Components](#desktop-components)
3. [Enterprise Components](#enterprise-components)
4. [Zustand Stores](#zustand-stores)
5. [Core Libraries](#core-libraries)
6. [Electron Modules](#electron-modules)
7. [Hooks](#hooks)

---

## UI Components

### Layout Components (`src/components/layout/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Header` | Top application bar with title and actions | `title`, `showBack` |
| `Sidebar` | Collapsible sidebar container | `open`, `onClose` |
| `Toolbar` | Main editing toolbar with tool buttons | `activeTool`, `onToolSelect` |
| `StatusBar` | Bottom status bar with page info and zoom | `page`, `totalPages`, `zoom` |
| `MobileToolbar` | Touch-optimized toolbar for mobile | `tools`, `onSelect` |

```typescript
// Example: Layout composition
<Header title="Document.pdf" showBack />
<div className="flex">
  <Sidebar open={sidebarOpen}>
    <ThumbnailSidebar />
  </Sidebar>
  <main>
    <PDFViewer />
  </main>
</div>
<Toolbar activeTool={tool} onToolSelect={setTool} />
<StatusBar page={currentPage} totalPages={pageCount} zoom={zoom} />
```

### Viewer Components (`src/components/viewer/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PDFViewer` | Main PDF rendering component | `document`, `page`, `zoom` |
| `PageCanvas` | Single page canvas renderer | `page`, `scale`, `rotation` |
| `Thumbnails` | Page thumbnail grid | `pages`, `selected`, `onSelect` |
| `VirtualizedViewer` | Virtualized scrolling for large PDFs | `pageCount`, `renderPage` |
| `OutlinePanel` | PDF bookmark/outline navigation | `outline`, `onNavigate` |

```
┌─────────────────────────────────────────────────────────────┐
│                        PDFViewer                            │
│  ┌──────────┐  ┌─────────────────────────────────────────┐ │
│  │Thumbnails│  │              PageCanvas                  │ │
│  │ ┌──────┐ │  │  ┌─────────────────────────────────────┐│ │
│  │ │Page 1│ │  │  │                                     ││ │
│  │ └──────┘ │  │  │         Rendered PDF Page           ││ │
│  │ ┌──────┐ │  │  │                                     ││ │
│  │ │Page 2│ │  │  │      + AnnotationLayer overlay      ││ │
│  │ └──────┘ │  │  │                                     ││ │
│  │ ┌──────┐ │  │  └─────────────────────────────────────┘│ │
│  │ │Page 3│ │  │                                         │ │
│  │ └──────┘ │  └─────────────────────────────────────────┘ │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

### Annotation Components (`src/components/annotations/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `AnnotationLayer` | SVG overlay for all annotations | `annotations`, `page`, `scale` |
| `Highlight` | Text highlight markup | `rects`, `color`, `opacity` |
| `Underline` | Text underline markup | `rects`, `color` |
| `Strikethrough` | Text strikethrough markup | `rects`, `color` |
| `StickyNote` | Expandable note annotation | `position`, `content`, `color` |
| `Drawing` | Freehand drawing paths | `paths`, `strokeWidth`, `color` |
| `ShapeOverlay` | Shape annotations (rect, ellipse, arrow) | `type`, `bounds`, `style` |
| `SelectionPopup` | Context menu for text selection | `position`, `onAction` |

```typescript
// Annotation layer composition
<AnnotationLayer page={page} scale={scale}>
  {highlights.map(h => <Highlight key={h.id} {...h} />)}
  {notes.map(n => <StickyNote key={n.id} {...n} />)}
  {drawings.map(d => <Drawing key={d.id} {...d} />)}
  {shapes.map(s => <ShapeOverlay key={s.id} {...s} />)}
</AnnotationLayer>
```

### Editor Components (`src/components/editor/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `TextEditor` | Rich text editing for text boxes | `content`, `onChange`, `style` |
| `TextBox` | Positioned text annotation | `position`, `size`, `content` |
| `FontPicker` | Font family/size/style selector | `font`, `size`, `onSelect` |

### Form Components (`src/components/forms/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `FormField` | Generic form field wrapper | `field`, `value`, `onChange` |
| `TextField` | Text input form field | `multiline`, `maxLength` |
| `Checkbox` | Checkbox form field | `checked`, `onChange` |
| `RadioButton` | Radio button group | `options`, `selected` |
| `Dropdown` | Select dropdown field | `options`, `value` |
| `DatePicker` | Date input field | `value`, `format` |

### Signature Components (`src/components/signatures/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `SignaturePad` | Canvas for drawing signatures | `onSave`, `strokeWidth` |
| `SignatureModal` | Modal for creating/selecting signatures | `onSelect`, `onClose` |
| `SignatureList` | Saved signature gallery | `signatures`, `onSelect`, `onDelete` |
| `SignaturePlacement` | Drag-to-place signature on page | `signature`, `onPlace` |

### Page Components (`src/components/pages/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PageManager` | Page operations panel | `pages`, `onReorder` |
| `MergeDialog` | Merge multiple PDFs dialog | `files`, `onMerge` |
| `SplitDialog` | Split PDF into parts | `pageCount`, `onSplit` |
| `ExtractDialog` | Extract page range | `pageCount`, `onExtract` |
| `ReorderPanel` | Drag-drop page reordering | `pages`, `onReorder` |

### Export Components (`src/components/export/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ImageExportDialog` | Export pages as images | `format`, `dpi`, `pages` |
| `CompressDialog` | PDF compression options | `quality`, `onCompress` |
| `ExportOptionsPanel` | Export settings panel | `options`, `onChange` |

### Print Components (`src/components/print/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PrintDialog` | Print settings dialog | `printers`, `options` |
| `PrintPreview` | Print preview component | `pages`, `layout` |
| `PageRangeSelector` | Page range input | `total`, `selected` |

### UI Primitives (`src/components/ui/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Styled button component | `variant`, `size`, `disabled` |
| `Dialog` | Modal dialog container | `open`, `onClose`, `title` |
| `Dropdown` | Dropdown menu | `trigger`, `items` |
| `Tooltip` | Hover tooltip | `content`, `position` |
| `Skeleton` | Loading skeleton | `width`, `height` |
| `Input` | Text input | `value`, `onChange`, `type` |
| `Switch` | Toggle switch | `checked`, `onChange` |
| `Tabs` | Tab navigation | `tabs`, `active`, `onChange` |

---

## Desktop Components

### Offline Components (`src/components/offline/`)

| Component | Purpose |
|-----------|---------|
| `OfflineIndicator` | Network status indicator in header |
| `OfflineBanner` | Full-width offline warning banner |
| `SyncStatusPanel` | Sync queue and progress display |
| `ConflictDialog` | Resolve sync conflicts |

### Update Components (`src/components/update/`)

| Component | Purpose |
|-----------|---------|
| `UpdateNotification` | New version available toast |
| `UpdateSettings` | Auto-update preferences |
| `UpdateProgress` | Download progress indicator |
| `ReleaseNotes` | What's new in this version |

### Scanner Components (`src/components/scanner/`)

| Component | Purpose |
|-----------|---------|
| `ScannerSelectDialog` | Choose scanner device |
| `ScanSettingsPanel` | Resolution, color, duplex settings |
| `ScanPreview` | Preview scanned image |
| `BatchScanWorkflow` | Multi-page scanning workflow |

### Security Components (`src/components/security/`)

| Component | Purpose |
|-----------|---------|
| `HardwareKeyEnrollment` | Register FIDO2 hardware key |
| `HardwareKeyAuth` | Authenticate with hardware key |
| `KeyManagement` | Manage registered keys |

### Batch Components (`src/components/batch/`)

| Component | Purpose |
|-----------|---------|
| `BatchWizard` | Step-by-step batch operation setup |
| `BatchDashboard` | Active jobs overview |
| `BatchSummary` | Operation results summary |
| `TemplateManager` | Save/load batch templates |

### File Watch Components (`src/components/fileWatch/`)

| Component | Purpose |
|-----------|---------|
| `AutoReloadSettings` | Configure auto-reload behavior |
| `WatchStatusIndicator` | File watching status icon |

---

## Enterprise Components

### Enterprise Components (`src/components/enterprise/`)

| Component | Purpose |
|-----------|---------|
| `PolicyStatusIndicator` | MDM/GPO policy status |
| `ConfigurationViewer` | View applied configuration |
| `LockedSettingBadge` | Indicates admin-locked setting |

### Kiosk Components (`src/components/kiosk/`)

| Component | Purpose |
|-----------|---------|
| `KioskShell` | Locked-down app container |
| `KioskToolbar` | Restricted toolbar for kiosk mode |
| `KioskHeader` | Minimal header for kiosk mode |

---

## Zustand Stores

### Core Stores

```typescript
// src/stores/documentStore.ts
interface DocumentStore {
  // State
  document: PDFDocument | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  rotation: number;

  // Actions
  loadPDF: (file: File | ArrayBuffer) => Promise<void>;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
  rotatePage: (degrees: number) => void;
  closePDF: () => void;
}
```

```typescript
// src/stores/annotationStore.ts
interface AnnotationStore {
  annotations: Map<number, Annotation[]>;  // page -> annotations
  selectedId: string | null;

  addAnnotation: (pageNum: number, annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  getPageAnnotations: (pageNum: number) => Annotation[];
  clearPage: (pageNum: number) => void;
}
```

```typescript
// src/stores/historyStore.ts
interface HistoryStore {
  past: HistoryState[];
  future: HistoryState[];

  pushState: (state: HistoryState) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}
```

```typescript
// src/stores/uiStore.ts
interface UIStore {
  sidebarOpen: boolean;
  sidebarTab: 'thumbnails' | 'outline' | 'annotations';
  activeTool: ToolType | null;
  activeDialog: DialogType | null;

  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setActiveTool: (tool: ToolType | null) => void;
  openDialog: (dialog: DialogType) => void;
  closeDialog: () => void;
}
```

```typescript
// src/stores/settingsStore.ts
interface SettingsStore {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultZoom: number;
  autoSave: boolean;
  autoSaveInterval: number;

  setTheme: (theme: Theme) => void;
  setLanguage: (lang: string) => void;
  setDefaultZoom: (zoom: number) => void;
  setAutoSave: (enabled: boolean) => void;
  reset: () => void;
}
```

### Advanced Stores

| Store | Purpose | Key State |
|-------|---------|-----------|
| `formStore` | Form field values and validation | `fields`, `values`, `errors` |
| `signatureStore` | Saved signatures and placements | `signatures`, `placements` |
| `textStore` | Text editing state | `textBoxes`, `activeBox` |
| `ocrStore` | OCR processing state | `results`, `isProcessing` |
| `formDesignerStore` | Form design mode | `designMode`, `selectedField` |
| `redactionStore` | Redaction marks | `redactions`, `patterns` |
| `comparisonStore` | Document comparison | `documents`, `differences` |
| `batchStore` | Web batch processing | `jobs`, `queue` |

### Desktop Stores

| Store | Purpose | Key State |
|-------|---------|-----------|
| `recentFilesStore` | Recently opened files | `files`, `maxCount` |
| `updateStore` | Auto-update state | `available`, `downloading`, `progress` |
| `shortcutsStore` | Custom keyboard shortcuts | `shortcuts`, `conflicts` |
| `fileWatchStore` | File watcher state | `watching`, `lastChange` |
| `offlineStore` | Offline sync queue | `queue`, `syncing`, `conflicts` |
| `nativeBatchStore` | Native batch with workers | `jobs`, `workers` |
| `printStore` | Native print jobs | `jobs`, `printers` |
| `scannerStore` | Scanner devices | `devices`, `scanning` |
| `securityStore` | Hardware key state | `keys`, `authenticated` |

### Enterprise Stores

| Store | Purpose | Key State |
|-------|---------|-----------|
| `enterprisePolicyStore` | MDM/GPO policies | `policies`, `source` |
| `licenseStore` | License validation | `license`, `features`, `valid` |
| `lanStore` | LAN peer discovery | `peers`, `syncing` |
| `kioskStore` | Kiosk mode config | `enabled`, `allowedTools` |

---

## Core Libraries

### PDF Libraries (`src/lib/pdf/`)

```
lib/pdf/
├── renderer.ts      # PDF.js page rendering
├── saver.ts         # pdf-lib PDF modification
├── textSaver.ts     # Text layer preservation
├── loader.ts        # PDF loading utilities
└── worker.ts        # Web Worker setup
```

**Key Functions:**
- `renderPage(page, scale, rotation)` - Render page to canvas
- `savePDF(document, options)` - Save modified PDF
- `getPageDimensions(page)` - Get page width/height
- `extractText(page)` - Extract text content

### Page Operations (`src/lib/pages/`)

```
lib/pages/
├── merge.ts         # Combine multiple PDFs
├── split.ts         # Split PDF into parts
├── extract.ts       # Extract page ranges
├── reorder.ts       # Reorder pages
├── rotate.ts        # Rotate pages
└── delete.ts        # Remove pages
```

### Annotation Libraries (`src/lib/annotations/`)

```
lib/annotations/
├── serializer.ts    # JSON serialization
├── embedder.ts      # Embed in PDF
├── importer.ts      # Import from XFDF
└── exporter.ts      # Export to XFDF
```

### Storage Libraries (`src/lib/storage/`)

```
lib/storage/
├── indexedDB.ts     # IndexedDB operations
├── fileHandler.ts   # File System Access API
├── signatures.ts    # Signature storage
└── stamps.ts        # Custom stamp storage
```

### Export Libraries (`src/lib/export/`)

```
lib/export/
├── pdfExport.ts     # PDF export options
├── imageExport.ts   # PNG/JPEG export
├── compression.ts   # PDF compression
└── flatten.ts       # Flatten annotations
```

---

## Electron Modules

### Main Process (`electron/main/`)

```
electron/main/
├── index.ts              # Entry point, app lifecycle
├── windowManager.ts      # BrowserWindow management
├── windowState.ts        # Window state persistence
├── lifecycle.ts          # App lifecycle handlers
├── security.ts           # CSP and security setup
├── updater.ts            # Auto-update (electron-updater)
├── print/                # Native print integration
├── scanner/              # Scanner bridge (TWAIN/WIA/SANE)
├── security/             # WebAuthn bridge
└── updates/              # Differential updates
```

### Preload Scripts (`electron/preload/`)

```
electron/preload/
├── index.ts              # Main preload (electronAPI)
├── networkPreload.ts     # Network status detection
└── webauthnPreload.ts    # WebAuthn API bridge
```

### IPC Handlers (`electron/ipc/`)

```
electron/ipc/
├── channels.ts           # Channel name constants
├── types.ts              # TypeScript definitions
├── handlers.ts           # Core IPC handlers
├── fileHandlers.ts       # File operation handlers
├── printHandlers.ts      # Print IPC handlers
└── scannerHandlers.ts    # Scanner IPC handlers
```

### Workers (`electron/workers/`)

```
electron/workers/
├── workerPool.ts         # Worker thread pool manager
├── workerManager.ts      # Worker lifecycle
└── pdfWorker.ts          # PDF processing worker
```

---

## Hooks

### Core Hooks (`src/hooks/`)

| Hook | Purpose | Returns |
|------|---------|---------|
| `usePDF` | PDF document state and actions | `{ document, page, zoom, ... }` |
| `useAnnotations` | Page annotations | `{ annotations, add, update, delete }` |
| `useHistory` | Undo/redo functionality | `{ undo, redo, canUndo, canRedo }` |
| `useKeyboardShortcuts` | Register keyboard handlers | `void` |
| `useTextSelection` | Track text selection | `{ selection, rects }` |
| `useAnnotationShortcuts` | Annotation tool shortcuts | `void` |

### Desktop Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useConnectionStatus` | Network online/offline | `{ online, type }` |
| `useOfflineData` | Offline data access | `{ data, loading }` |
| `useOfflineSync` | Sync queue management | `{ queue, sync, conflicts }` |
| `useFileWatch` | File change detection | `{ watching, changed }` |

```typescript
// Example: Custom hook usage
function PDFEditor() {
  const { document, page, setPage } = usePDF();
  const { annotations, addAnnotation } = useAnnotations(page);
  const { undo, redo, canUndo } = useHistory();

  useKeyboardShortcuts();
  useAnnotationShortcuts();

  return (
    <PDFViewer
      document={document}
      page={page}
      annotations={annotations}
    />
  );
}
```

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                           App.tsx                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Layout: Header + Sidebar + Main + Toolbar + StatusBar           ││
│  │  │                                                               ││
│  │  ├── PDFViewer                                                   ││
│  │  │   ├── VirtualizedViewer (continuous mode)                     ││
│  │  │   │   └── PageCanvas[] + AnnotationLayer[]                    ││
│  │  │   └── PageCanvas (single mode) + AnnotationLayer              ││
│  │  │                                                               ││
│  │  ├── Thumbnails (sidebar)                                        ││
│  │  ├── OutlinePanel (sidebar)                                      ││
│  │  │                                                               ││
│  │  ├── Dialogs (modals)                                            ││
│  │  │   ├── MergeDialog, SplitDialog, ExtractDialog                 ││
│  │  │   ├── SignatureModal, PrintDialog                             ││
│  │  │   └── ImageExportDialog, CompressDialog                       ││
│  │  │                                                               ││
│  │  └── Toasts (notifications)                                      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

                              │
                              │ State subscriptions
                              ▼

┌─────────────────────────────────────────────────────────────────────┐
│                      Zustand Stores                                  │
│  documentStore ←→ annotationStore ←→ historyStore                   │
│       ↓                                                              │
│  formStore, signatureStore, textStore                               │
│       ↓                                                              │
│  uiStore, settingsStore                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 3.0
**Last Updated:** 2026-02-03
**Maintained By:** Daniel Simon Jr.
