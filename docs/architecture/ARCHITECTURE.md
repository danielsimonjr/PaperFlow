# PaperFlow Architecture

PaperFlow is a PDF editor. It runs as a Progressive Web Application (PWA) in a browser and as a native Electron desktop application. This document describes the system architecture.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [System Context](#system-context)
4. [Component Architecture](#component-architecture)
5. [Data Model](#data-model)
6. [Key Design Decisions](#key-design-decisions)
7. [Storage Architecture](#storage-architecture)
8. [Performance Considerations](#performance-considerations)
9. [Security Architecture](#security-architecture)
10. [Testing Strategy](#testing-strategy)

---

## System Overview

### Key Statistics

| Item | Count |
|------|-------|
| TypeScript files (file inventory) | 780 |
| Exports (dependency graph) | 3440 |
| Functions (dependency graph) | 1459 |
| Classes (dependency graph) | 69 |
| Interfaces (dependency graph) | 691 |
| Zustand store modules, excluding index.ts | 26 |
| Files in src/components, including index.ts | 209 |
| Files in src/lib, including index.ts | 173 |
| IPC request channels | 113 |
| IPC event channels | 78 |

### Module Distribution

```
src/
├── components/     # 209 files in 31 folders
├── core/           # Core feature catalog, the product boundary
├── stores/         # 26 Zustand store modules
├── lib/            # 173 files in 29 folders
├── hooks/          # 26 hook modules
├── types/          # 12 files
├── utils/          # Utility functions
├── pages/          # Route components
└── constants/      # Configuration constants

electron/
├── main/           # Main process modules (22 files)
├── preload/        # Preload scripts (3 files)
├── ipc/            # IPC handlers (14 files)
├── workers/        # Worker threads (3 files)
└── *.ts            # Feature modules (29 files)
```

### Store Categories

| Category   | Count | Purpose                                    |
|------------|-------|--------------------------------------------|
| Core       | 8     | Document state, UI, history, settings      |
| Advanced   | 5     | OCR, forms, redaction, comparison, batch   |
| Desktop    | 9     | Updates, file watch, print, scanner, sync  |
| Enterprise | 4     | Policy, licensing, LAN, kiosk mode         |

---

## Architecture Principles

### 1. Platform Agnostic Core

The application core runs in the browser and in Electron. Platform-specific features use abstraction layers. These layers detect the runtime environment.

```typescript
// src/lib/electron/platform.ts (excerpt)
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.electron !== 'undefined';
}

// Line 161 of the same file: isElectron() || 'showOpenFilePicker' in window
```

### 2. Privacy-First Processing

PDF processing runs in the client by default.

```
+-------------+     +---------------+     +---------------+
|   PDF File  | --> | Local Process | --> | Local Storage |
+-------------+     +---------------+     +---------------+
                           |
                    (Client-side
                     processing)
```

### 3. Offline-First Design

The application stores documents and some changes locally. It processes queued changes when the browser reports a network connection.

```
Online Mode:   User --> App --> [Cache + Remote]
Offline Mode:  User --> App --> [Cache] --> Queue for sync
Reconnect:     Queue --> Sync Engine --> Remote
```

### 4. Security by Default

- Electron: Context isolation, disabled Node integration, sandboxed renderer
- Web: Content Security Policy headers in `public/_headers`
- Desktop: the file handlers check paths with `assertPathAllowed`

### 5. Progressive Enhancement

Features scale based on platform capabilities:

```
+------------------+------------------+------------------+
|      Web         |   Web + PWA      |    Electron      |
+------------------+------------------+------------------+
| View PDFs        | + Offline access | + Native dialogs |
| Annotate         | + Install prompt | + File watching  |
| Fill forms       | + Background     | + Auto-updates   |
| Basic export     |   sync           | + Scanner access |
|                  |                  | + Hardware keys  |
+------------------+------------------+------------------+
```

The table lists platform capabilities. Some listed capabilities have no caller in the application. No rendered code path calls the native open or save dialog. No module in `electron/` imports the scanner bridge (`electron/main/scanner/scannerBridge.ts`) or the WebAuthn bridge (`electron/main/security/webauthnBridge.ts`). In `src`, no module outside `src/components/security/` refers to the hardware-key components.

---

## System Context

### High-Level Architecture

```
+===========================================================================+
|                              PaperFlow                                     |
+===========================================================================+
|                                                                           |
|  +------------------------------------------------------------------+    |
|  |                         UI Layer                                  |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  |  |   Viewer   |  | Annotations|  |   Forms    |  |   Pages    |  |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  |  |   Editor   |  | Signatures |  |   Export   |  |  Settings  |  |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  +------------------------------------------------------------------+    |
|                                  |                                        |
|                                  v                                        |
|  +------------------------------------------------------------------+    |
|  |                      State Layer (Zustand)                        |    |
|  |  +----------+  +----------+  +----------+  +----------+          |    |
|  |  | document |  |annotation|  |   form   |  | signature|          |    |
|  |  |  Store   |  |  Store   |  |  Store   |  |  Store   |          |    |
|  |  +----------+  +----------+  +----------+  +----------+          |    |
|  |  +----------+  +----------+  +----------+  +----------+          |    |
|  |  | history  |  |    ui    |  | settings |  |  offline |          |    |
|  |  |  Store   |  |  Store   |  |  Store   |  |  Store   |          |    |
|  |  +----------+  +----------+  +----------+  +----------+          |    |
|  +------------------------------------------------------------------+    |
|                                  |                                        |
|                                  v                                        |
|  +------------------------------------------------------------------+    |
|  |                     Core Libraries Layer                          |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  |  |   PDF.js   |  |  pdf-lib   |  |Tesseract.js|  |   Storage  |  |    |
|  |  | (render)   |  |  (edit)    |  |   (OCR)    |  | (IndexedDB)|  |    |
|  |  +------------+  +------------+  +------------+  +------------+  |    |
|  +------------------------------------------------------------------+    |
|                                  |                                        |
|           +---------------------+|+----------------------+                |
|           |                      |                       |                |
|           v                      v                       v                |
|  +-----------------+    +-----------------+    +-----------------+        |
|  |   Web APIs      |    |  Service Worker |    |   Electron IPC  |        |
|  | (File System    |    | (Cache, Offline |    | (Native APIs,   |        |
|  |  Access API)    |    |  Sync)          |    |  File System)   |        |
|  +-----------------+    +-----------------+    +-----------------+        |
|                                                         |                 |
+=========================================================|=================+
                                                          |
                                                          v
                                              +-----------------------+
                                              |    Electron Main      |
                                              |    Process            |
                                              |  +----------------+   |
                                              |  | Window Manager |   |
                                              |  | File Watcher   |   |
                                              |  | Auto-Updater   |   |
                                              |  | Native Dialogs |   |
                                              |  | Scanner Bridge |   |
                                              |  | Print Service  |   |
                                              |  +----------------+   |
                                              +-----------------------+
```

No rendered code path calls the native dialogs or the Scanner Bridge. See Progressive Enhancement.

### Data Flow

```
+-------------+     +-------------+     +-------------+     +-------------+
|    User     | --> |     UI      | --> |   Zustand   | --> |    Lib      |
|   Action    |     | Components  |     |   Stores    |     |  Modules    |
+-------------+     +-------------+     +-------------+     +-------------+
                                                                   |
      +------------------------------------------------------------+
      |
      v
+-------------+     +-------------+     +-------------+
|   PDF.js    |     |   pdf-lib   |     |  IndexedDB  |
|  (Render)   |     |   (Edit)    |     |  (Persist)  |
+-------------+     +-------------+     +-------------+
      |                   |                   |
      v                   v                   v
+-------------------------------------------------------------+
|                     Output                                   |
|  [Canvas Rendering]  [Modified PDF]  [Local Storage]        |
+-------------------------------------------------------------+
```

---

## Component Architecture

### Layer 1: UI Components

React components are grouped by feature domain. The tree lists some files of each folder:

```
components/
├── ui/                 # Reusable primitives
│   ├── Button.tsx
│   ├── Dialog.tsx
│   ├── Select.tsx
│   └── Skeleton.tsx
│
├── layout/             # Application shell
│   ├── AppLayout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   └── MobileToolbar.tsx
│
├── viewer/             # PDF rendering
│   ├── PDFViewer.tsx
│   ├── PageCanvas.tsx
│   ├── VirtualizedViewer.tsx
│   └── ZoomControls.tsx
│
├── annotations/        # Markup tools
│   ├── AnnotationLayer.tsx
│   ├── Highlight.tsx
│   ├── StickyNote.tsx
│   ├── DrawingCanvas.tsx
│   └── ShapeOverlay.tsx
│
├── forms/              # Form filling
│   ├── TextField.tsx
│   ├── Checkbox.tsx
│   ├── RadioButton.tsx
│   └── Dropdown.tsx
│
├── pages/              # Page management
│   ├── DraggableThumbnail.tsx
│   ├── MergeDialog.tsx
│   └── SplitDialog.tsx
│
├── offline/            # Offline UI
│   ├── OfflineIndicator.tsx
│   ├── OfflineBanner.tsx
│   ├── SyncStatusPanel.tsx
│   └── ConflictDialog.tsx
│
└── enterprise/         # Enterprise UI
    ├── PolicyStatusIndicator.tsx
    ├── ConfigurationViewer.tsx
    └── LockedSettingBadge.tsx
```

### Layer 2: State Management (Zustand)

Application state is held in Zustand stores. Each store holds one area of state:

```typescript
// src/stores/documentStore.ts (excerpt)
interface DocumentState {
  // State
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

  // Actions
  loadDocument: (file: File) => Promise<void>;
  loadDocumentFromArrayBuffer: (data: ArrayBuffer | Uint8Array, fileName: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setModified: (modified: boolean) => void;
}
```

The store uses the `persist` middleware with the name `paperflow-document`. It persists only `zoom` and `viewMode`.

**Core Stores (8)**

| Store           | Purpose                              |
|-----------------|--------------------------------------|
| documentStore   | PDF state, renderer, pages, zoom     |
| annotationStore | Highlights, notes, drawings, shapes  |
| historyStore    | Undo/redo stack                      |
| uiStore         | Sidebar, dialogs, active tool        |
| settingsStore   | User preferences (persisted)         |
| formStore       | Form field values                    |
| signatureStore  | Saved signatures and placements      |
| textStore       | Text editing state                   |

**Advanced Stores (5)**

| Store            | Purpose                        |
|------------------|--------------------------------|
| ocrStore         | OCR processing and results     |
| formDesignerStore| Form design mode               |
| redactionStore   | Redaction marks and patterns   |
| comparisonStore  | Document comparison state      |
| batchStore       | Batch processing queue (web)   |

**Desktop Stores (9)**

| Store            | Purpose                        |
|------------------|--------------------------------|
| recentFilesStore | Recently opened files          |
| updateStore      | Auto-update state              |
| shortcutsStore   | Custom keyboard shortcuts      |
| fileWatchStore   | File watcher events            |
| offlineStore     | Offline sync status            |
| nativeBatchStore | Native batch processing        |
| printStore       | Native print jobs              |
| scannerStore     | Scanner device state           |
| securityStore    | Hardware key authentication    |

**Enterprise Stores (4)**

| Store                | Purpose                    |
|----------------------|----------------------------|
| enterprisePolicyStore| MDM/GPO policy state       |
| licenseStore         | License validation         |
| lanStore             | LAN peer discovery         |
| kioskStore           | Kiosk mode configuration   |

### Layer 3: Core Libraries

```
lib/
├── pdf/                    # PDF rendering and manipulation
│   ├── renderer.ts         #   PDF.js wrapper for rendering
│   ├── saver.ts            #   pdf-lib wrapper for saving
│   ├── textSaver.ts        #   Saves text boxes into a PDF
│   └── signatureEmbed.ts   #   Embeds placed signatures into a PDF
│
├── pages/                  # Page operations
│   ├── mergePdf.ts         #   Merge multiple PDFs
│   ├── splitPdf.ts         #   Split PDF into parts
│   ├── extractPages.ts     #   Extract specific pages
│   └── pageOperations.ts   #   Rotate, reorder, delete
│
├── annotations/            # Annotation handling
│   ├── serializer.ts       #   JSON serialization
│   └── drawingSerializer.ts#   Drawing path serialization
│
├── forms/                  # Form processing
│   ├── formParser.ts       #   Parse form fields
│   ├── validation.ts       #   Form validation rules
│   ├── fdfExport.ts        #   FDF format export
│   └── xfdfExport.ts       #   XFDF format export
│
├── storage/                # Data persistence
│   ├── indexeddb.ts        #   IndexedDB operations
│   ├── fileHandler.ts      #   File I/O abstraction
│   ├── signatureStorage.ts #   Signature persistence
│   └── stampStorage.ts     #   Stamp persistence
│
├── ocr/                    # OCR processing
│   ├── ocrEngine.ts        #   Tesseract.js wrapper
│   ├── languageLoader.ts   #   Language pack loading
│   ├── imagePreprocessor.ts#   Image enhancement
│   └── layoutAnalyzer.ts   #   Document layout analysis
│
├── offline/                # Offline support
│   ├── serviceWorkerConfig.ts
│   ├── offlineStorage.ts
│   ├── syncEngine.ts
│   ├── deltaSync.ts
│   └── conflictResolver.ts
│
├── electron/               # Electron integration
│   ├── platform.ts         #   Platform detection
│   ├── ipc.ts              #   IPC wrapper
│   ├── fileSystem.ts       #   Native file operations
│   └── dialogs.ts          #   Native dialog wrappers
│
└── enterprise/             # Enterprise features
    ├── gpoReader.ts        #   Windows GPO integration
    ├── mdmReader.ts        #   macOS MDM integration
    ├── configParser.ts     #   Configuration parsing
    └── policyMerger.ts     #   Policy precedence
```

### Layer 4: Electron Main Process

```
electron/
├── main/
│   ├── index.ts            # Entry point, app lifecycle
│   ├── windowManager.ts    # BrowserWindow management
│   ├── windowState.ts      # Window state persistence
│   ├── lifecycle.ts        # Startup/shutdown handlers
│   ├── security.ts         # CSP configuration
│   ├── updater.ts          # Auto-update integration
│   ├── print/              # Native print services
│   ├── scanner/            # Scanner bridge (TWAIN/WIA/SANE)
│   └── security/           # WebAuthn bridge
│
├── preload/
│   ├── index.ts            # Main preload (contextBridge)
│   ├── networkPreload.ts   # Network status detection
│   └── webauthnPreload.ts  # WebAuthn API bridge
│
├── ipc/
│   ├── channels.ts         # Channel name constants
│   ├── types.ts            # TypeScript definitions
│   ├── handlers.ts         # Core handlers
│   ├── fileHandlers.ts     # File operations
│   ├── printHandlers.ts    # Print operations
│   └── dialogHandlers.ts   # Dialog operations
│
└── workers/
    ├── workerPool.ts       # Worker thread pool
    ├── workerManager.ts    # Worker lifecycle
    └── pdfWorker.ts        # PDF processing worker
```

---

## Data Model

### PDF Document

```typescript
interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}
```

### Annotation Types

```typescript
// src/types/annotations.ts (excerpt)
export interface HighlightAnnotation {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough';
  pageIndex: number;
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  selectedText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteAnnotation {
  id: string;
  type: 'note';
  pageIndex: number;
  position: { x: number; y: number };
  content: string;
  color: string;
  isCollapsed: boolean;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: AnnotationReply[];
}

export interface DrawingAnnotation {
  id: string;
  type: 'drawing';
  pageIndex: number;
  paths: DrawingPath[];
  color: string;
  strokeWidth: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShapeAnnotation {
  id: string;
  type: 'shape';
  pageIndex: number;
  shapeType: 'rectangle' | 'circle' | 'arrow' | 'line';
  bounds: AnnotationRect;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StampAnnotation {
  id: string;
  type: 'stamp';
  pageIndex: number;
  stampType: 'approved' | 'rejected' | 'confidential' | 'draft' | 'custom';
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  customText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AnyAnnotation =
  | HighlightAnnotation
  | NoteAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | StampAnnotation;
```

### Form Field Types

```typescript
// src/types/forms.ts (excerpt)
export type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'date'
  | 'number';

export interface BaseFormField {
  id: string;
  pageIndex: number;
  name: string;
  bounds: AnnotationRect;
  required: boolean;
  readonly: boolean;
  tooltip?: string;
}

export interface TextFormField extends BaseFormField {
  type: 'text';
  value: string;
  maxLength?: number;
  multiline?: boolean;
  format?: 'none' | 'email' | 'phone' | 'zip';
}

export interface NumberFormField extends BaseFormField {
  type: 'number';
  value: number | null;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

export interface CheckboxFormField extends BaseFormField {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;
}

export interface RadioFormField extends BaseFormField {
  type: 'radio';
  value: string;
  groupName: string;
  options: { label: string; value: string }[];
}

export interface DropdownFormField extends BaseFormField {
  type: 'dropdown';
  value: string;
  options: string[];
  allowCustom?: boolean;
}

export interface SignatureFormField extends BaseFormField {
  type: 'signature';
  value: string | null; // base64 signature data
  signedBy?: string;
  signedAt?: Date;
}

export interface DateFormField extends BaseFormField {
  type: 'date';
  value: string | null; // ISO date string
  format: string;
}

export type FormField =
  | TextFormField
  | NumberFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | SignatureFormField
  | DateFormField;
```

### Signature Types

```typescript
// src/types/index.ts
export interface Signature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string;
  createdAt: Date;
  isDefault?: boolean;
  isInitials?: boolean;
}

// src/stores/signatureStore.ts
export interface PlacedSignature {
  id: string;
  signatureId: string;
  pageIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  signatureData: string;
  signatureType: 'draw' | 'type' | 'image';
  createdAt: Date;
  dateStamp?: {
    enabled: boolean;
    format: string;
    position: 'below' | 'right' | 'left';
  };
}

export interface StoredSignature extends Signature {
  isDefault: boolean;
  isInitials: boolean;
}
```

### Coordinate System

PDF uses a coordinate system with origin at bottom-left. Screen coordinates have origin at top-left.

```
PDF Coordinates:          Screen Coordinates:

  y ^                       (0,0) +---------→ x
    |                             |
    |                             |
    +------→ x                    v y
 (0,0)

// Conversion utilities (src/utils/coordinates.ts)
pdfToScreen(point: Point, context: TransformContext): Point
screenToPdf(point: Point, context: TransformContext): Point
pdfRectToScreen(rect: Rect, context: TransformContext): Rect
screenRectToPdf(rect: Rect, context: TransformContext): Rect

// TransformContext: scale, pageHeight, offsetX?, offsetY?
```

---

## Key Design Decisions

### Why Zustand for State Management?

| Consideration        | Zustand                          | Redux                    | MobX                     |
|----------------------|----------------------------------|--------------------------|--------------------------|
| Bundle Size          | ~1 KB                            | ~2 KB + middleware       | ~15 KB                   |
| Boilerplate          | Minimal                          | Significant              | Moderate                 |
| TypeScript Support   | Excellent (first-class)          | Good (with toolkit)      | Good                     |
| React Integration    | Hooks-native                     | Requires connect/hooks   | Requires observer        |
| Learning Curve       | Low                              | High                     | Medium                   |
| Devtools             | Redux DevTools compatible        | Redux DevTools           | MobX DevTools            |

**Decision:** Zustand provides the simplest API with excellent TypeScript support, minimal bundle impact, and sufficient power for our state complexity.

### Why Electron for Desktop?

| Consideration        | Electron                         | Tauri                    | PWA Only                 |
|----------------------|----------------------------------|--------------------------|--------------------------|
| Code Sharing         | 100% (same React app)            | Partial (Rust backend)   | 100%                     |
| Native APIs          | Full Node.js access              | Limited to IPC           | Very limited             |
| File System          | Full access                      | Sandboxed                | Limited (File API)       |
| Scanner Access       | Yes (via native modules)         | Complex                  | No                       |
| Auto-Updates         | Built-in (electron-updater)      | Built-in                 | No (service worker)      |
| Bundle Size          | ~150 MB                          | ~10 MB                   | N/A (web)                |
| Maturity             | Very high (10+ years)            | Growing                  | High                     |

**Decision:** Electron enables sharing 100% of our React codebase while providing full native capabilities required for scanner access, file watching, and system integration.

### Why Offline-First Architecture?

| Requirement                    | Solution                                      |
|--------------------------------|-----------------------------------------------|
| Edit PDFs without internet     | IndexedDB storage + Service Worker caching    |
| Resume work after reconnect    | Offline queue with background sync            |
| Handle concurrent edits        | Conflict detection and resolution UI          |
| Efficient sync for large PDFs  | Delta sync (transfer only changes)            |
| Network resilience            | Retry with delays up to 5 min                 |

**Decision:** Users frequently work with PDFs in environments with unreliable connectivity (travel, restricted networks). Offline-first keeps document viewing and local editing available without a network connection.

The offline store registers the browser `online` and `offline` listeners (`src/stores/offlineStore.ts:282-283`). No live module imports `backgroundSync`, so its queue processor does not run. The only writer of the offline queue is `useOfflineData`, and no module uses it. `ConflictDialog` and `deltaSync` have no live importer. The autosave writes the loaded bytes, so annotation and form edits are not saved.

### Why pdf-lib for Editing?

| Library      | Rendering | Editing | Size    | License    |
|--------------|-----------|---------|---------|------------|
| PDF.js       | Excellent | None    | ~500 KB | Apache 2.0 |
| pdf-lib      | None      | Full    | ~300 KB | MIT        |
| PDFKit       | None      | Create  | ~200 KB | MIT        |
| jsPDF        | None      | Create  | ~300 KB | MIT        |

**Decision:** Use PDF.js for rendering (best quality, Mozilla-maintained) and pdf-lib for editing (only library supporting full PDF modification in JavaScript).

---

## Storage Architecture

### IndexedDB Schema

The application uses three IndexedDB databases. The table lists their object stores.

| Database | Source file | Object stores |
|----------|-------------|---------------|
| `paperflow` | `src/lib/storage/indexeddb.ts` | `recentFiles` (key `id`, index `lastOpened`), `documents` (key `id`), `signatures` (key `id`), `autoSave` (key `id`, indexes `documentId` and `savedAt`) |
| `paperflow-offline` | `src/lib/offline/offlineStorage.ts` | `documents` (key `id`), `metadata` (key `id`, indexes `fileName`, `modifiedAt`, `syncedAt`, `priority` and `isAvailableOffline`), `annotations` (key `id`, index `documentId`), `editHistory` (key `id`, indexes `documentId` and `timestamp`), `settings` (key `documentId`) |
| `paperflow-queue` | `src/lib/offline/offlineQueue.ts` | `queue` (key `id`, indexes `documentId`, `status`, `priority` and `createdAt`) |

### Storage Limits

| Item | Default | Source |
|------|---------|--------|
| Max offline documents | 50 | `DEFAULT_MAX_OFFLINE_DOCUMENTS` in `src/lib/offline/offlineAvailability.ts` |
| Max document size | 100 MB | `MAX_FILE_SIZE` in `src/constants/config.ts` |
| Quota warning threshold | 80% | `QUOTA_WARNING_THRESHOLD` in `src/lib/offline/offlineAvailability.ts` |
| Cache expiration (static assets) | 30 days | `runtimeCaching` rules in `vite.config.ts` |
| Cache expiration (PDF files) | 90 days | `runtimeCaching` rules in `vite.config.ts` |
| Max saved signatures | 10 | `MAX_SIGNATURES` in `src/stores/signatureStore.ts` |
| Max saved initials | 10 | `MAX_SIGNATURES` in `src/stores/signatureStore.ts` |

### File System Access (Desktop)

```typescript
// The renderer calls the preload bridge, window.electron.
// Every call goes through IPC. The main process checks each path.
const result = await window.electron.readFile(filePath);
await window.electron.writeFile(filePath, data);
const watching = await window.electron.watchFile(filePath); // returns a boolean

// Subscribe to file change events. The return value is an unsubscribe function.
const unsubscribe = window.electron.onFileChanged((event) => {
  // Handle the change, for example by reloading the document
});
```

### Web File System Access API
The application opens files with `openPdfFile` in `src/lib/storage/fileHandler.ts`. That function calls `fileOpen` from the browser-fs-access package. The package uses the File System Access API when the browser supports it. The example shows that API.

```typescript
// Modern browsers support File System Access API
if ('showOpenFilePicker' in window) {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{ accept: { 'application/pdf': ['.pdf'] } }]
  });
  const file = await fileHandle.getFile();
  // Process file

  // Save back to same location
  const writable = await fileHandle.createWritable();
  await writable.write(modifiedData);
  await writable.close();
} else {
  // Fallback to input[type=file] + download
}
```

---

## Performance Considerations

### Benchmark Targets

The file `tests/performance/benchmarks.ts` uses simulated timings. The table lists the targets in the file `tests/performance/benchmarks.ts`. The table does not list measured results.

| Operation | Target |
|-----------|--------|
| Load small PDF | 500 ms |
| Load medium PDF | 1000 ms |
| Load large PDF | 2000 ms |
| Render page 100% | 100 ms |
| Render page 200% | 200 ms |
| Render thumbnail | 50 ms |
| Create highlight | 50 ms |
| Create note | 50 ms |
| Render annotations | 100 ms |
| Save document | 1000 ms |
| Export PDF | 2000 ms |
| Export image | 500 ms |
| Navigate next | 100 ms |
| Jump to page | 200 ms |
| Zoom change | 100 ms |
| Detect forms | 500 ms |
| Update field | 50 ms |

The header comment of the same file states a memory target of less than 500 MB for 100-page documents.

### Optimization Strategies

**1. Virtualized Rendering**

The hook `useVisiblePages` in `src/hooks/useVisiblePages.ts` finds the visible pages with IntersectionObserver. The hook returns the visible pages and the buffered pages (`isBuffered`).

```typescript
// src/components/viewer/VirtualizedViewer.tsx
const {
  visiblePages,
  currentVisiblePage,
  registerPageElement,
  containerRef,
} = useVisiblePages({
  pageCount,
  bufferSize: 2,
});
```

**2. Thumbnail Caching**

`ThumbnailCache` in `src/lib/thumbnails/cache.ts` stores thumbnail data URLs. When the cache is full, the `ThumbnailCache` removes the least recently used entry. The cache key has the form `documentId:pageNumber:scale`. The module creates one shared instance with a capacity of 200.

```typescript
// src/lib/thumbnails/cache.ts (excerpt)
get(documentId: string, pageNumber: number, scale: number): string | null {
  const key = this.makeKey(documentId, pageNumber, scale);
  const value = this.cache.get(key);

  if (value !== undefined) {
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  return null;
}

// Global singleton instance
export const thumbnailCache = new ThumbnailCache(200);
```

**3. Worker Thread Offloading (Desktop)**

The worker in `electron/workers/pdfWorker.ts` runs the compress, merge, split and watermark tasks. It reads and writes the files itself. It sends progress messages and one result message for each task.

```typescript
// electron/workers/pdfWorker.ts (message handler, excerpt)
parentPort?.on('message', async (message: TaskMessage) => {
  if (message.type !== 'task') return;

  const { task } = message;
  const { payload } = task;

  try {
    let result: unknown;

    switch (task.type) {
      case 'compress':
        result = await compressPdf(
          task.id,
          payload.inputPath,
          payload.outputPath,
          payload.options as Parameters<typeof compressPdf>[3]
        );
        break;
      // The merge, split and watermark cases call mergePdfs, splitPdf and addWatermark.
      default:
        throw new Error(`Unknown operation type: ${task.type}`);
    }

    sendResult(task.id, result);
  } catch (error) {
    sendResult(
      task.id,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
});
```

**4. Memory Management**

The module `src/lib/performance/memoryManager.ts` reads the browser heap figures. The module returns a warning when the heap use is high. The warning levels start at shares of `jsHeapSizeLimit`: low 50%, medium 70%, high 85% and critical 95%. The constant `MEMORY_THRESHOLDS` stores the thresholds. The module does not export `MEMORY_THRESHOLDS`.

```typescript
// src/lib/performance/memoryManager.ts (exports)
export function getMemoryInfo(): MemoryInfo | null; // null when performance.memory is not available
export function getMemoryWarning(): MemoryWarning | null;
export function formatMemory(bytes: number): string;
export function estimateDocumentMemory(
  pageCount: number,
  avgPageSizeKB?: number
): { estimated: number; isLargeDocument: boolean; warning: string | null };

export class CanvasDisposer {
  register(id: string, canvas: HTMLCanvasElement): void;
  dispose(id: string): void; // sets the canvas width and height to 0
  disposeAll(): void;
}
```

**5. Lazy Loading**

Components load on demand. The file `src/components/lazy/index.ts` exports these lazy components:

- `LazySignatureModal`
- `LazyDrawingCanvas`
- `LazyImageExportDialog`
- `LazyCompressDialog`
- `LazyPrintDialog`
- `LazyMergeDialog`
- `LazySplitDialog`

---

## Security Architecture

### Content Security Policy

The Electron main process sets the policy in `electron/main/security.ts`. `setupContentSecurityPolicy` uses `DEVELOPMENT_CSP` when `isDev` is true. Otherwise, it uses `PRODUCTION_CSP`.

```typescript
// electron/main/security.ts (PRODUCTION_CSP)
export const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
```

The web build sends its headers from `public/_headers`. The `script-src` directive in that file includes `'unsafe-inline'`. The same file allows connections to `https://*.sentry.io`.

### Electron Security Model

```
+------------------------------------------------------------------+
|                        Main Process                               |
|  (Full Node.js access, handles all privileged operations)        |
+------------------------------------------------------------------+
                              |
                    contextBridge (allowlist)
                              |
                              v
+------------------------------------------------------------------+
|                      Preload Script                               |
|  (Limited API surface)                                           |
+------------------------------------------------------------------+
                              |
                    window.electron (API object)
                              |
                              v
+------------------------------------------------------------------+
|                     Renderer Process                              |
|  (Sandboxed, no Node.js, no direct IPC access)                  |
+------------------------------------------------------------------+
```

```typescript
// electron/main/index.ts (createMainWindow, excerpt)
const mainWindow = windowManager.createWindow({
  webPreferences: {
    preload: PRELOAD_PATH,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

// Set up CSP
setupContentSecurityPolicy(mainWindow, isDev);
```

### Input Validation

The FILE_READ handler in `electron/ipc/fileHandlers.ts` checks the path before it reads the file. The handler catches errors and returns an object with `success` set to `false`.

```typescript
// electron/ipc/fileHandlers.ts (FILE_READ handler)
ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
  try {
    assertPathAllowed(filePath);
    const data = await fs.readFile(filePath);
    return { success: true, data: new Uint8Array(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
});
```

The FILE_WRITE handler calls `assertPathAllowed` and `assertExtensionAllowedForWrite` before it writes.

### WebAuthn/FIDO2 Integration

The WebAuthn client in `src/lib/security/webauthnClient.ts` creates hardware key credentials. Its default configuration uses the relying party ID `paperflow.app`, the relying party name `PaperFlow`, a timeout of 60000 ms and `preferred` user verification. Registration calls `navigator.credentials.create` in `src/lib/security/webauthn.ts`.

```typescript
// src/lib/security/webauthnClient.ts (generateRegistrationOptions, excerpt)
return {
  // ...
  rp: {
    name: this.config.rpName,
    id: this.config.rpId,
  },
  // ...
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 }, // ES256
    { type: 'public-key', alg: -257 }, // RS256
  ],
  attestation: 'direct',
  authenticatorSelection: {
    authenticatorAttachment: 'cross-platform',
    requireResidentKey: false,
    residentKey: 'preferred',
    userVerification: this.config.userVerification,
  },
  // ...
};
```

Assertion requests call `navigator.credentials.get` in `src/lib/security/webauthn.ts`:

```typescript
// src/lib/security/webauthn.ts (excerpt)
const publicKeyOptions: PublicKeyCredentialRequestOptions = {
  challenge,
  timeout: options.timeout || 60000,
  rpId: options.rpId,
  allowCredentials,
  userVerification: options.userVerification || 'preferred',
};

const credential = (await navigator.credentials.get({
  publicKey: publicKeyOptions,
})) as PublicKeyCredential;
```

---

## Testing Strategy

### Test Layers

The table gives the number of test files in each test folder.

| Folder | Files | Runner | Contents |
|--------|-------|--------|----------|
| `tests/unit` | 116 | Vitest | Components, hooks, lib, pages, stores, styles and utils |
| `tests/integration` | 23 | Vitest | Workflows that use several modules |
| `tests/e2e` | 12 | Playwright | Test directory `./tests/e2e` |
| `tests/e2e-electron` | 5 | Playwright | Desktop application tests (test directory `./tests/e2e-electron`) |
| `tests/electron` | 18 | Vitest | Main process and IPC modules |

Other folders are `tests/accessibility`, `tests/enterprise`, `tests/kiosk`, `tests/lan`, `tests/license`, `tests/manual`, `tests/update` and `tests/visual`. The folder `tests/performance` holds the benchmark file. The folder `tests/mocks` holds a Sentry mock. The folder `tests/fixtures` holds a sample PDF file.

### Test Organization

```
tests/
├── unit/                 # Components, hooks, lib, pages, stores, styles, utils
│   ├── stores/           # Store tests, for example documentStore.test.ts
│   └── lib/              # Library tests
│
├── integration/          # Workflow tests
│   ├── annotations/      # Drawing, highlight, note and shape tests
│   ├── forms/
│   ├── offline/
│   ├── fileWatch/
│   └── fileOpening.test.tsx
│
├── e2e/                  # Playwright tests (test directory ./tests/e2e)
├── e2e-electron/         # Playwright tests for the desktop application
├── electron/             # Vitest tests for main process and IPC modules
├── performance/          # benchmarks.ts
├── mocks/                # sentry.ts
└── fixtures/             # sample PDF file
```

### Test Commands

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests (web)
npm run test:e2e

# Run E2E tests (Electron)
npm run test:e2e-electron

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/stores/documentStore.test.ts

# Run tests matching pattern
npx vitest run -t "should load PDF"

# Watch mode
npm run test:watch
```

### Example Unit Test

```typescript
// tests/unit/stores/documentStore.test.ts (excerpt)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentStore } from '@stores/documentStore';

// Mock PDFRenderer
vi.mock('@lib/pdf/renderer', () => ({
  PDFRenderer: vi.fn().mockImplementation(function () {
    return {
      loadDocument: vi.fn().mockResolvedValue({
        numPages: 5,
        title: 'Test Document',
      }),
      renderPage: vi.fn().mockResolvedValue({ width: 612, height: 792 }),
      destroy: vi.fn(),
    };
  }),
}));

describe('documentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentStore.setState({
      fileName: null,
      fileData: null,
      documentInfo: null,
      pageCount: 0,
      currentPage: 1,
      zoom: 100,
      viewMode: 'single',
      isModified: false,
      isLoading: false,
      error: null,
      renderer: null,
    });
  });

  // ...
});
```

### Example Integration Test

```typescript
// tests/integration/annotations/highlights.test.tsx (excerpt)
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import { useHighlightTool } from '@hooks/useHighlightTool';
import { HIGHLIGHT_COLORS } from '@components/annotations/SelectionPopup';

describe('Highlights Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#FFEB3B',
      activeOpacity: 0.5,
    });
    useHistoryStore.setState({
      past: [],
      future: [],
    });
  });

  // ...
});
```

### Example E2E Test

```typescript
// tests/e2e-electron/updates.spec.ts (excerpt)
import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

// __dirname is defined earlier in the file
// Test configuration
const APP_PATH = path.join(__dirname, '../../dist-electron/main/index.js');

let electronApp: ElectronApplication;
let page: Page;

// Helper to launch the Electron app
async function launchApp(): Promise<void> {
  electronApp = await electron.launch({
    args: [APP_PATH],
    // ...
  });
  // ...
}
```

---

## Appendix: Path Aliases

Configured in `vite.config.ts`, `vitest.config.ts` and `tsconfig.json`:

| Alias          | Path               |
|----------------|--------------------|
| `@/`           | `src/`             |
| `@components/` | `src/components/`  |
| `@hooks/`      | `src/hooks/`       |
| `@stores/`     | `src/stores/`      |
| `@lib/`        | `src/lib/`         |
| `@utils/`      | `src/utils/`       |
| `@types/`      | `src/types/`       |

---

## Appendix: Naming Conventions

| Type           | Convention           | Example               |
|----------------|----------------------|-----------------------|
| Components     | PascalCase           | `PDFViewer.tsx`       |
| Hooks          | camelCase with `use` | `useFormFields.ts`    |
| Stores         | camelCase with Store | `documentStore.ts`    |
| Utils          | camelCase            | `coordinates.ts`      |
| Types          | PascalCase           | `Annotation`          |
| Constants      | SCREAMING_SNAKE      | `MAX_ZOOM`            |
| IPC Channels   | UPPER_SNAKE          | `FILE_READ`           |

---

## Appendix: Related Documentation

- [Electron Architecture](./electron-architecture.md) - Desktop app details
- [IPC Patterns](./ipc-patterns.md) - Inter-process communication
- [Offline-First Architecture](./offline-first.md) - Offline capabilities
- [Enterprise Features](./enterprise-features.md) - Enterprise deployment

---

*Report errors in this document as issues in the project repository.*

---

## Verification

Check: `repo-tools check . --docs=docs/architecture`

| Claim | Value | Source |
|-------|-------|--------|
| totalFiles | 780 | file-inventory.json |
| totalExports | 3440 | dependency-graph.json |
| totalFunctions | 1459 | dependency-graph.json |
| totalClasses | 69 | dependency-graph.json |
| totalInterfaces | 691 | dependency-graph.json |
