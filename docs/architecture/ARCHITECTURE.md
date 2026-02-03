# PaperFlow Architecture

> Version: 3.0.0 | Last Updated: 2026-02-03

PaperFlow is a comprehensive PDF editing solution delivering professional PDF capabilities through both a Progressive Web Application (PWA) and a native Electron desktop application. This document provides a complete technical overview of the system architecture.

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

```
+---------------------------+---------------------------+
|  Codebase Metrics         |  Runtime Metrics          |
+---------------------------+---------------------------+
|  26 Zustand Stores        |  Cold Start: < 3s         |
|  50+ React Components     |  Warm Start: < 1s         |
|  12 Type Definition Files |  Memory (idle): < 150 MB  |
|  80+ Library Modules      |  100-page PDF: < 500 MB   |
|  30+ IPC Channels         |  File Save: < 500 ms      |
+---------------------------+---------------------------+
```

### Module Distribution

```
src/
├── components/     # 50+ React components across 15 categories
├── stores/         # 26 Zustand stores (4 categories)
├── lib/            # 80+ library modules (6 categories)
├── hooks/          # Custom React hooks
├── types/          # 12 TypeScript type definition files
├── utils/          # Utility functions
├── pages/          # Route components
└── constants/      # Configuration constants

electron/
├── main/           # Main process modules (20+)
├── preload/        # Preload scripts (3)
├── ipc/            # IPC handlers (12)
├── workers/        # Worker threads (3)
└── *.ts            # Feature modules (25+)
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

The application core runs identically in browser and Electron environments. Platform-specific features are accessed through abstraction layers that detect the runtime environment.

```typescript
// Platform detection pattern
const isElectron = typeof window.electron !== 'undefined';
const isWeb = !isElectron;

// Feature availability
const hasNativeFileSystem = isElectron || 'showOpenFilePicker' in window;
```

### 2. Privacy-First Processing

All PDF processing occurs client-side by default. Document data never leaves the user's device unless explicitly shared.

```
+-------------+     +---------------+     +---------------+
|   PDF File  | --> | Local Process | --> | Local Storage |
+-------------+     +---------------+     +---------------+
                           |
                    (No network calls
                     for core features)
```

### 3. Offline-First Design

The application functions fully without network connectivity. Data synchronization occurs opportunistically when online.

```
Online Mode:   User --> App --> [Cache + Remote]
Offline Mode:  User --> App --> [Cache] --> Queue for sync
Reconnect:     Queue --> Sync Engine --> Remote
```

### 4. Security by Default

- Electron: Context isolation, disabled Node integration, sandboxed renderer
- Web: Strict CSP, no inline scripts, HTTPS-only
- Both: Input validation, path sanitization, signed updates

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

React components organized by feature domain:

```
components/
├── ui/                 # Reusable primitives
│   ├── Button.tsx
│   ├── Dialog.tsx
│   ├── Dropdown.tsx
│   ├── Tooltip.tsx
│   └── Skeleton.tsx
│
├── layout/             # Application shell
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Toolbar.tsx
│   ├── StatusBar.tsx
│   └── MobileToolbar.tsx
│
├── viewer/             # PDF rendering
│   ├── PDFViewer.tsx
│   ├── PageCanvas.tsx
│   ├── Thumbnails.tsx
│   └── VirtualizedViewer.tsx
│
├── annotations/        # Markup tools
│   ├── AnnotationLayer.tsx
│   ├── Highlight.tsx
│   ├── StickyNote.tsx
│   ├── Drawing.tsx
│   └── ShapeOverlay.tsx
│
├── forms/              # Form filling
│   ├── TextField.tsx
│   ├── Checkbox.tsx
│   ├── RadioButton.tsx
│   └── Dropdown.tsx
│
├── pages/              # Page management
│   ├── PageManager.tsx
│   ├── MergeDialog.tsx
│   └── SplitDialog.tsx
│
├── offline/            # Offline UI (Desktop)
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

All application state is managed through Zustand stores with clear separation of concerns:

```typescript
// Store Pattern
interface DocumentState {
  // State
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  zoom: number;
  viewMode: ViewMode;

  // Actions
  loadDocument: (file: File | ArrayBuffer) => Promise<void>;
  setPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Implementation
}));
```

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
│   ├── textSaver.ts        #   Text layer extraction
│   └── signatureEmbed.ts   #   Digital signature embedding
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
// Base annotation properties
interface BaseAnnotation {
  id: string;
  pageIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// Text markup
interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight' | 'underline' | 'strikethrough';
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  selectedText?: string;
}

// Sticky note
interface NoteAnnotation extends BaseAnnotation {
  type: 'note';
  position: { x: number; y: number };
  content: string;
  color: string;
  isCollapsed: boolean;
  author?: string;
  replies?: AnnotationReply[];
}

// Freehand drawing
interface DrawingAnnotation extends BaseAnnotation {
  type: 'drawing';
  paths: DrawingPath[];
  color: string;
  strokeWidth: number;
}

// Geometric shapes
interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'arrow' | 'line';
  bounds: AnnotationRect;
  color: string;
  strokeWidth: number;
  fillColor?: string;
}

// Stamps
interface StampAnnotation extends BaseAnnotation {
  type: 'stamp';
  stampType: 'approved' | 'rejected' | 'confidential' | 'draft' | 'custom';
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  customText?: string;
}

// Union type
type AnyAnnotation =
  | HighlightAnnotation
  | NoteAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | StampAnnotation;
```

### Form Field Types

```typescript
interface FormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  pageIndex: number;
  rect: { x: number; y: number; width: number; height: number };
  value: string | boolean | null;
  required: boolean;
  readOnly: boolean;
  options?: string[];           // For dropdown
  group?: string;               // For radio buttons
  validation?: ValidationRule;
}

interface ValidationRule {
  type: 'regex' | 'email' | 'phone' | 'number' | 'date' | 'custom';
  pattern?: string;
  message?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}
```

### Signature Types

```typescript
interface SavedSignature {
  id: string;
  name: string;
  imageData: string;       // Base64 PNG
  createdAt: Date;
  type: 'drawn' | 'typed' | 'uploaded';
}

interface SignaturePlacement {
  signatureId: string;
  pageIndex: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
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
pdfToScreen(point, pageHeight, scale): ScreenPoint
screenToPdf(point, pageHeight, scale): PDFPoint
pdfRectToScreen(rect, pageHeight, scale): ScreenRect
screenRectToPdf(rect, pageHeight, scale): PDFRect
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
| Network resilience             | Retry with exponential backoff                |

**Decision:** Users frequently work with PDFs in environments with unreliable connectivity (travel, restricted networks). Offline-first ensures the application remains fully functional regardless of network status.

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

```
Database: PaperFlowDB (Version: 2)

+-------------------+-------------------+-------------------+
|     documents     |    annotations    |     settings      |
+-------------------+-------------------+-------------------+
| id (key)          | id (key)          | key (key)         |
| name              | documentId        | value             |
| data (Blob)       | pageIndex         | updatedAt         |
| size              | type              |                   |
| createdAt         | data (JSON)       |                   |
| updatedAt         | createdAt         |                   |
| thumbnail         | updatedAt         |                   |
+-------------------+-------------------+-------------------+

+-------------------+-------------------+-------------------+
|    signatures     |      stamps       |     syncQueue     |
+-------------------+-------------------+-------------------+
| id (key)          | id (key)          | id (key)          |
| name              | name              | operation         |
| imageData         | imageData         | documentId        |
| type              | category          | payload           |
| createdAt         | createdAt         | priority          |
|                   |                   | status            |
|                   |                   | retries           |
|                   |                   | createdAt         |
+-------------------+-------------------+-------------------+

+-------------------+-------------------+
|    formData       |   editHistory     |
+-------------------+-------------------+
| documentId (key)  | id (key)          |
| values (JSON)     | documentId        |
| lastFilled        | changes (JSON)    |
|                   | timestamp         |
|                   | checksum          |
+-------------------+-------------------+
```

### Storage Limits

| Item                        | Default  | Notes                      |
|-----------------------------|----------|----------------------------|
| Max offline documents       | 50       | Configurable per user      |
| Max document size           | 100 MB   | Per document limit         |
| Quota warning threshold     | 80%      | Shows warning banner       |
| Cache expiration (assets)   | 30 days  | Service worker cache       |
| Cache expiration (PDFs)     | 90 days  | IndexedDB storage          |
| Max signatures              | 20       | Per user                   |
| Max stamps                  | 50       | Custom stamps              |

### File System Access (Desktop)

```typescript
// Electron provides direct file system access
// All operations go through IPC for security

// Read file
const result = await window.electron.readFile(filePath);

// Write file
await window.electron.writeFile(filePath, data);

// File watching
const unwatch = window.electron.watchFile(filePath, (event) => {
  if (event.type === 'change') {
    // Reload document
  }
});
```

### Web File System Access API

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

### Benchmarks

| Operation                  | Target      | Actual (P95) |
|----------------------------|-------------|--------------|
| Cold start (Electron)      | < 3s        | 2.1s         |
| Warm start (Electron)      | < 1s        | 0.6s         |
| PDF open (10 pages)        | < 1s        | 0.4s         |
| PDF open (100 pages)       | < 2s        | 1.2s         |
| Page navigation            | < 50ms      | 25ms         |
| Annotation render          | < 16ms      | 8ms          |
| Save (10 pages)            | < 500ms     | 280ms        |
| Save (100 pages)           | < 2s        | 1.4s         |
| OCR per page               | < 3s        | 2.2s         |
| Memory (idle)              | < 150 MB    | 120 MB       |
| Memory (100-page PDF)      | < 500 MB    | 380 MB       |

### Optimization Strategies

**1. Virtualized Rendering**

Only render visible pages plus a small buffer:

```typescript
// VirtualizedViewer.tsx
const visiblePages = useMemo(() => {
  const buffer = 2; // pages above/below viewport
  return pages.slice(
    Math.max(0, firstVisiblePage - buffer),
    Math.min(totalPages, lastVisiblePage + buffer + 1)
  );
}, [firstVisiblePage, lastVisiblePage, totalPages]);
```

**2. Thumbnail Caching**

LRU cache for page thumbnails:

```typescript
// lib/thumbnails/cache.ts
const thumbnailCache = new LRUCache<string, ImageData>({
  max: 100,           // Max entries
  maxAge: 1000 * 60 * 30, // 30 minutes
  updateAgeOnGet: true
});
```

**3. Worker Thread Offloading (Desktop)**

Heavy operations run in worker threads:

```typescript
// electron/workers/pdfWorker.ts
parentPort.on('message', async (task) => {
  switch (task.type) {
    case 'compress':
      const result = await compressPDF(task.data);
      parentPort.postMessage({ id: task.id, result });
      break;
    case 'merge':
      // ...
  }
});
```

**4. Memory Management**

Proactive cleanup of unused resources:

```typescript
// lib/performance/memoryManager.ts
export function disposeUnusedCanvases() {
  const threshold = 50; // MB
  if (getMemoryUsage() > threshold) {
    // Dispose canvases for non-visible pages
    pageCanvasMap.forEach((canvas, pageNum) => {
      if (!isPageVisible(pageNum)) {
        canvas.dispose();
        pageCanvasMap.delete(pageNum);
      }
    });
  }
}
```

**5. Lazy Loading**

Components loaded on demand:

```typescript
// components/lazy/index.ts
export const OCRPanel = lazy(() => import('@components/ocr/OCRPanel'));
export const BatchWizard = lazy(() => import('@components/batch/BatchWizard'));
export const FormDesigner = lazy(() => import('@components/forms/FormDesigner'));
```

---

## Security Architecture

### Content Security Policy

```typescript
// Production CSP (strict)
const productionCSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",  // Required for inline styles
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

// Development CSP (relaxed for HMR)
const developmentCSP = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // ... more permissive for development
].join('; ');
```

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
|  (Limited API surface, validates all inputs)                     |
+------------------------------------------------------------------+
                              |
                    window.electron (frozen object)
                              |
                              v
+------------------------------------------------------------------+
|                     Renderer Process                              |
|  (Sandboxed, no Node.js, no direct IPC access)                  |
+------------------------------------------------------------------+
```

```typescript
// electron/main/index.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,     // Isolate preload from renderer
    nodeIntegration: false,     // No Node.js in renderer
    sandbox: true,              // Chromium sandbox enabled
    preload: PRELOAD_PATH,      // Only way to communicate
    webSecurity: true,          // Enforce same-origin
    allowRunningInsecureContent: false,
  },
});
```

### Input Validation

All IPC handlers validate inputs:

```typescript
// electron/ipc/fileHandlers.ts
ipcMain.handle('file:read', async (event, filePath: unknown) => {
  // Type validation
  if (typeof filePath !== 'string') {
    return { success: false, error: 'Invalid file path type' };
  }

  // Path traversal protection
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    return { success: false, error: 'Path traversal not allowed' };
  }

  // Allowlist check (optional, for restricted mode)
  if (!isPathAllowed(normalizedPath, allowedDirectories)) {
    return { success: false, error: 'Path not in allowed directories' };
  }

  // Proceed with validated path
  try {
    const data = await fs.promises.readFile(normalizedPath);
    return { success: true, data: data.buffer };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### WebAuthn/FIDO2 Integration

Hardware key authentication for document signing:

```typescript
// Credential creation
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: serverChallenge,
    rp: { name: 'PaperFlow', id: 'paperflow.app' },
    user: {
      id: userId,
      name: userEmail,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // Hardware key
      userVerification: 'required',
    },
  },
});

// Signature verification
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: documentHash,
    allowCredentials: registeredCredentials,
    userVerification: 'required',
  },
});
```

---

## Testing Strategy

### Test Pyramid

```
                    /\
                   /  \
                  / E2E \           ~10% of tests
                 /  Tests \         Browser automation
                /----------\
               /            \
              / Integration  \      ~20% of tests
             /    Tests       \     Store + Component
            /------------------\
           /                    \
          /     Unit Tests       \  ~70% of tests
         /    (Stores, Utils,     \ Pure functions
        /      Components)         \
       /----------------------------\
```

### Test Organization

```
tests/
├── unit/
│   ├── stores/           # Store logic tests
│   │   ├── documentStore.test.ts
│   │   ├── annotationStore.test.ts
│   │   └── ...
│   ├── lib/              # Library function tests
│   │   ├── pdf/
│   │   ├── forms/
│   │   └── ...
│   └── utils/            # Utility function tests
│
├── integration/
│   ├── viewer/           # PDF viewing workflows
│   ├── annotations/      # Annotation workflows
│   ├── forms/            # Form filling workflows
│   ├── offline/          # Offline sync workflows
│   └── fileWatch/        # File watching workflows
│
└── e2e/
    ├── web/              # Playwright web tests
    │   ├── viewer.spec.ts
    │   └── forms.spec.ts
    └── electron/         # Playwright Electron tests
        ├── fileOps.spec.ts
        └── updates.spec.ts
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
// tests/unit/stores/documentStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '@stores/documentStore';

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset();
  });

  describe('loadDocument', () => {
    it('should load a PDF file and update state', async () => {
      const store = useDocumentStore.getState();
      const pdfFile = new File([pdfBytes], 'test.pdf', { type: 'application/pdf' });

      await store.loadDocument(pdfFile);

      expect(store.pdfDocument).not.toBeNull();
      expect(store.numPages).toBe(5);
      expect(store.currentPage).toBe(1);
    });

    it('should handle invalid files gracefully', async () => {
      const store = useDocumentStore.getState();
      const invalidFile = new File(['not a pdf'], 'test.txt');

      await expect(store.loadDocument(invalidFile)).rejects.toThrow();
      expect(store.pdfDocument).toBeNull();
    });
  });

  describe('navigation', () => {
    it('should navigate to valid pages', () => {
      const store = useDocumentStore.getState();
      store.setNumPages(10);

      store.setPage(5);
      expect(store.currentPage).toBe(5);

      store.setPage(15); // Beyond limit
      expect(store.currentPage).toBe(10);

      store.setPage(0); // Below limit
      expect(store.currentPage).toBe(1);
    });
  });
});
```

### Example Integration Test

```typescript
// tests/integration/annotations/highlight.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PDFViewer } from '@components/viewer/PDFViewer';
import { useAnnotationStore } from '@stores/annotationStore';

describe('Highlight Annotation Flow', () => {
  it('should create highlight from text selection', async () => {
    render(<PDFViewer file={testPdf} />);

    // Wait for PDF to load
    await screen.findByTestId('pdf-page-1');

    // Simulate text selection
    fireEvent.mouseUp(screen.getByTestId('text-layer'), {
      detail: { selectedText: 'Lorem ipsum' }
    });

    // Click highlight button
    fireEvent.click(screen.getByRole('button', { name: /highlight/i }));

    // Verify annotation created
    const annotations = useAnnotationStore.getState().annotations;
    expect(annotations).toHaveLength(1);
    expect(annotations[0].type).toBe('highlight');
    expect(annotations[0].selectedText).toBe('Lorem ipsum');
  });
});
```

### Example E2E Test

```typescript
// tests/e2e/web/viewer.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PDF Viewer', () => {
  test('should open and display PDF', async ({ page }) => {
    await page.goto('/');

    // Upload PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample.pdf');

    // Wait for viewer to load
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();

    // Verify page count
    const pageInfo = page.locator('[data-testid="page-info"]');
    await expect(pageInfo).toHaveText(/Page 1 of 5/);

    // Navigate to next page
    await page.click('[data-testid="next-page"]');
    await expect(pageInfo).toHaveText(/Page 2 of 5/);
  });

  test('should save annotations', async ({ page }) => {
    await page.goto('/');
    await loadTestPdf(page);

    // Add highlight
    await page.click('[data-testid="highlight-tool"]');
    await page.locator('[data-testid="text-layer"]').selectText();
    await page.click('[data-testid="apply-highlight"]');

    // Save document
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="save-button"]'),
    ]);

    expect(download.suggestedFilename()).toBe('sample_annotated.pdf');
  });
});
```

---

## Appendix: Path Aliases

Configured in both `vite.config.ts` and `tsconfig.json`:

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
| Hooks          | camelCase with `use` | `usePDF.ts`           |
| Stores         | camelCase with Store | `documentStore.ts`    |
| Utils          | camelCase            | `pdfHelpers.ts`       |
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

*This document is generated and maintained as part of the PaperFlow project. For questions or updates, please open an issue in the project repository.*
