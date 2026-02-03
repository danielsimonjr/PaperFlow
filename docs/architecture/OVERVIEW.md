# PaperFlow Architecture Overview

> **Version 3.0.0** | **Last Updated: 2026-02-03**

---

## What Is This?

PaperFlow is a comprehensive PDF editing solution available as both a Progressive Web Application (PWA) and a native desktop application built with Electron. It provides a modern, privacy-first alternative to Adobe Acrobat with full offline capabilities.

All PDF processing happens locally by default - documents never leave the user's device unless explicitly shared. The application supports advanced features including OCR text recognition, interactive form filling, digital signatures, document comparison, and high-volume batch processing.

| Metric | Value |
|--------|-------|
| Codebase Size | ~920 files |
| Frontend Framework | React 18 + TypeScript |
| Desktop Framework | Electron 28+ |
| Cloud Dependencies | Zero (optional integrations available) |

---

## Key Capabilities

| Category | Feature | Description | Phase |
|----------|---------|-------------|-------|
| **Viewing** | PDF Rendering | PDF.js-powered rendering with continuous, single, and spread view modes | 1 |
| **Viewing** | Navigation | Thumbnail sidebar, outline panel, text search, zoom controls | 1 |
| **Editing** | Page Operations | Merge, split, rotate, extract, reorder, delete pages | 1 |
| **Editing** | Text Editing | Add/edit text boxes with font customization | 1 |
| **Annotations** | Markup | Highlights, underlines, strikethroughs, sticky notes | 1 |
| **Annotations** | Drawing | Freehand drawing, shapes (rectangle, ellipse, arrow, line) | 1 |
| **Annotations** | Stamps | Predefined stamps (Approved, Rejected, etc.) and custom stamps | 1 |
| **Forms** | Form Filling | Text fields, checkboxes, radio buttons, dropdowns, dates | 1 |
| **Forms** | Form Design | Create and edit interactive PDF form fields | 2 |
| **Signatures** | Digital Signatures | Draw, type, or upload signatures; signature field placement | 1 |
| **OCR** | Text Recognition | Tesseract.js-powered OCR for scanned documents | 2 |
| **Security** | Redaction | Pattern-based and manual content redaction | 2 |
| **Comparison** | Document Diff | Side-by-side comparison with change highlighting | 2 |
| **Batch** | Bulk Operations | Watermarks, headers/footers, Bates numbering, compression | 2 |
| **Accessibility** | PDF/UA Compliance | Accessibility checking and WCAG compliance validation | 2 |
| **Desktop** | Native File System | Direct file access, auto-save, file watching | 3 |
| **Desktop** | System Integration | Tray icon, native menus, keyboard shortcuts, Touch Bar | 3 |
| **Desktop** | Scanning | TWAIN/WIA/SANE scanner integration with batch scanning | 3 |
| **Desktop** | Hardware Security | WebAuthn/FIDO2 hardware key authentication | 3 |
| **Desktop** | Worker Threads | Parallel PDF processing for batch operations | 3 |
| **Enterprise** | MDM/GPO | Centralized configuration via Group Policy or MDM profiles | 3 |
| **Enterprise** | Licensing | Offline-capable hardware-bound license validation | 3 |
| **Enterprise** | LAN Sync | Peer-to-peer document synchronization on local network | 3 |
| **Enterprise** | Kiosk Mode | Locked-down interface for public terminals | 3 |

---

## Quick Architecture Overview

```
+------------------------------------------------------------------------+
|                           UI LAYER (React)                              |
|  +------------------------------------------------------------------+  |
|  |  Pages: Home, Viewer, Settings                                    |  |
|  |  Components: ~207 files                                           |  |
|  |    - viewer/     PDF rendering (PDFViewer, PageCanvas)            |  |
|  |    - annotations/ Markup tools (Highlight, StickyNote, Drawing)   |  |
|  |    - forms/      Form fields (TextField, Checkbox, Dropdown)      |  |
|  |    - signatures/ Signature handling (SignaturePad, SignatureModal)|  |
|  |    - batch/      Batch processing UI (BatchWizard, Dashboard)     |  |
|  |    - offline/    Sync indicators (OfflineBanner, ConflictDialog)  |  |
|  |  Hooks: ~40 custom hooks (usePDF, useAnnotations, useOfflineSync) |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------------+
|                        STATE LAYER (Zustand)                            |
|  +------------------------------------------------------------------+  |
|  |  Core Stores:                                                     |  |
|  |    documentStore     - PDF state, renderer, pages, zoom           |  |
|  |    annotationStore   - Highlights, notes, drawings, shapes        |  |
|  |    historyStore      - Undo/redo stack                            |  |
|  |    formStore         - Form field state and values                |  |
|  |    signatureStore    - Saved signatures and placements            |  |
|  |  Desktop Stores:                                                  |  |
|  |    updateStore       - Auto-update state and settings             |  |
|  |    offlineStore      - Offline sync status and queue              |  |
|  |    fileWatchStore    - File watcher events                        |  |
|  |    nativeBatchStore  - Worker thread batch processing             |  |
|  |  Enterprise Stores:                                               |  |
|  |    enterprisePolicyStore - MDM/GPO policy state                   |  |
|  |    licenseStore      - License validation and feature gating      |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------------+
|                       CORE LAYER (Libraries)                            |
|  +------------------------------------------------------------------+  |
|  |  PDF.js (pdfjs-dist)                                              |  |
|  |    - PDF rendering and text extraction                            |  |
|  |    - Page navigation and viewport management                      |  |
|  |                                                                   |  |
|  |  pdf-lib                                                          |  |
|  |    - PDF manipulation (editing, merging, splitting)               |  |
|  |    - Form field embedding and signature embedding                 |  |
|  |                                                                   |  |
|  |  Tesseract.js                                                     |  |
|  |    - Client-side OCR processing                                   |  |
|  |    - Multi-language text recognition                              |  |
|  |                                                                   |  |
|  |  IndexedDB (via idb)                                              |  |
|  |    - Local document storage                                       |  |
|  |    - Offline data persistence                                     |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
                                   |
                    (Desktop only - via IPC)
                                   v
+------------------------------------------------------------------------+
|                       ELECTRON LAYER                                    |
|  +------------------------------------------------------------------+  |
|  |  Main Process (electron/main/)                                    |  |
|  |    - Window management (BrowserWindow lifecycle)                  |  |
|  |    - Native APIs (file system, dialogs, menus)                    |  |
|  |    - IPC handlers for renderer communication                      |  |
|  |    - Auto-updater (electron-updater)                              |  |
|  |                                                                   |  |
|  |  Preload Scripts (electron/preload/)                              |  |
|  |    - contextBridge API exposure                                   |  |
|  |    - Type-safe IPC channel definitions                            |  |
|  |                                                                   |  |
|  |  Worker Threads (electron/workers/)                               |  |
|  |    - Parallel PDF processing                                      |  |
|  |    - Batch operation execution                                    |  |
|  |    - Worker pool management                                       |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

---

## Data Model

### PDFDocument

The core document representation used throughout the application.

```typescript
interface PDFDocument {
  id: string;              // Unique identifier (UUID)
  name: string;            // File name
  data: ArrayBuffer;       // Raw PDF binary data
  pageCount: number;       // Total number of pages
  currentPage: number;     // Currently displayed page (1-indexed)
  zoom: number;            // Current zoom level (0.25 - 5.0)
  rotation: number;        // Document rotation (0, 90, 180, 270)
  modified: boolean;       // Has unsaved changes
  createdAt: Date;         // First opened timestamp
  updatedAt: Date;         // Last modified timestamp
}

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
  pageNumber: number;      // 1-indexed page number
  width: number;           // Page width in PDF points
  height: number;          // Page height in PDF points
  rotation: number;        // Page rotation in degrees
}

type ViewMode = 'single' | 'continuous' | 'spread';
```

### Annotation

All annotation types share common properties and are stored per-page.

```typescript
type AnyAnnotation =
  | HighlightAnnotation
  | NoteAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | StampAnnotation;

interface HighlightAnnotation {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough';
  pageIndex: number;       // 0-indexed page number
  rects: AnnotationRect[]; // PDF coordinates (origin bottom-left)
  color: string;           // Hex color (#FFEB3B)
  opacity: number;         // 0.0 - 1.0
  selectedText?: string;   // Captured text content
  createdAt: Date;
  updatedAt: Date;
}

interface NoteAnnotation {
  id: string;
  type: 'note';
  pageIndex: number;
  position: { x: number; y: number };  // PDF coordinates
  content: string;         // Note text content
  color: string;           // Note icon/background color
  isCollapsed: boolean;    // Collapsed state
  author?: string;         // Author name
  replies?: AnnotationReply[];  // Thread replies
  createdAt: Date;
  updatedAt: Date;
}

interface DrawingAnnotation {
  id: string;
  type: 'drawing';
  pageIndex: number;
  paths: DrawingPath[];    // Freehand stroke paths
  color: string;
  strokeWidth: number;     // Stroke width in points
  createdAt: Date;
  updatedAt: Date;
}

interface ShapeAnnotation {
  id: string;
  type: 'shape';
  pageIndex: number;
  shapeType: 'rectangle' | 'circle' | 'arrow' | 'line';
  bounds: AnnotationRect;  // Bounding box
  color: string;           // Stroke color
  strokeWidth: number;
  fillColor?: string;      // Optional fill
  createdAt: Date;
  updatedAt: Date;
}

interface StampAnnotation {
  id: string;
  type: 'stamp';
  pageIndex: number;
  stampType: 'approved' | 'rejected' | 'confidential' | 'draft' | 'custom';
  position: { x: number; y: number };
  scale: number;           // Stamp size multiplier
  rotation: number;        // Rotation in degrees
  customText?: string;     // Custom stamp text
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationRect {
  x: number;      // Left edge (PDF coordinates)
  y: number;      // Bottom edge (PDF coordinates)
  width: number;
  height: number;
}

interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}
```

### FormField

Interactive form field types for PDF forms.

```typescript
type FormField =
  | TextFormField
  | NumberFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | SignatureFormField
  | DateFormField;

interface BaseFormField {
  id: string;
  pageIndex: number;
  name: string;            // Field name (must be unique)
  bounds: AnnotationRect;  // Field position and size
  required: boolean;
  readonly: boolean;
  tooltip?: string;        // Hover tooltip text
}

interface TextFormField extends BaseFormField {
  type: 'text';
  value: string;
  maxLength?: number;
  multiline?: boolean;
  format?: 'none' | 'email' | 'phone' | 'zip';
}

interface NumberFormField extends BaseFormField {
  type: 'number';
  value: number | null;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

interface CheckboxFormField extends BaseFormField {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;    // Value when checked
}

interface RadioFormField extends BaseFormField {
  type: 'radio';
  value: string;
  groupName: string;       // Radio button group identifier
  options: { label: string; value: string }[];
}

interface DropdownFormField extends BaseFormField {
  type: 'dropdown';
  value: string;
  options: string[];
  allowCustom?: boolean;   // Allow freeform entry
}

interface SignatureFormField extends BaseFormField {
  type: 'signature';
  value: string | null;    // Base64-encoded signature image
  signedBy?: string;       // Signer name
  signedAt?: Date;         // Signing timestamp
}

interface DateFormField extends BaseFormField {
  type: 'date';
  value: string | null;    // ISO date string (YYYY-MM-DD)
  format: string;          // Display format (e.g., 'MM/DD/YYYY')
}
```

---

## Directory Structure

```
paperflow/
├── src/                          # Web application source
│   ├── components/               # React components (~207 files)
│   │   ├── ui/                   # Reusable primitives
│   │   │   ├── Button.tsx        # Button with variants
│   │   │   ├── Dialog.tsx        # Modal dialog
│   │   │   ├── Dropdown.tsx      # Dropdown menu
│   │   │   ├── Tooltip.tsx       # Hover tooltips
│   │   │   └── Skeleton.tsx      # Loading skeletons
│   │   ├── layout/               # App shell
│   │   │   ├── Header.tsx        # Top navigation bar
│   │   │   ├── Sidebar.tsx       # Side panel container
│   │   │   ├── Toolbar.tsx       # Tool selection bar
│   │   │   └── StatusBar.tsx     # Bottom status bar
│   │   ├── viewer/               # PDF rendering
│   │   │   ├── PDFViewer.tsx     # Main viewer component
│   │   │   ├── PageCanvas.tsx    # Individual page renderer
│   │   │   ├── Thumbnails.tsx    # Page thumbnail strip
│   │   │   └── VirtualizedViewer.tsx  # Virtualized scrolling
│   │   ├── annotations/          # Markup tools
│   │   │   ├── Highlight.tsx     # Text highlights
│   │   │   ├── StickyNote.tsx    # Note annotations
│   │   │   ├── Drawing.tsx       # Freehand drawing
│   │   │   └── ShapeOverlay.tsx  # Shape annotations
│   │   ├── forms/                # Form field components
│   │   │   ├── TextField.tsx     # Text input field
│   │   │   ├── Checkbox.tsx      # Checkbox field
│   │   │   └── Dropdown.tsx      # Select dropdown
│   │   ├── signatures/           # Signature handling
│   │   │   ├── SignaturePad.tsx  # Drawing canvas
│   │   │   └── SignatureModal.tsx # Signature dialog
│   │   ├── editor/               # Text editing
│   │   │   ├── TextEditor.tsx    # Rich text editor
│   │   │   └── FontPicker.tsx    # Font selection
│   │   ├── pages/                # Page management
│   │   │   ├── PageManager.tsx   # Page operations UI
│   │   │   ├── MergeDialog.tsx   # PDF merge wizard
│   │   │   └── SplitDialog.tsx   # PDF split wizard
│   │   ├── batch/                # Batch processing UI
│   │   │   ├── BatchWizard.tsx   # Batch job wizard
│   │   │   ├── BatchDashboard.tsx # Job monitoring
│   │   │   └── TemplateManager.tsx # Saved templates
│   │   ├── offline/              # Offline indicators
│   │   │   ├── OfflineIndicator.tsx # Status icon
│   │   │   ├── SyncStatusPanel.tsx  # Sync progress
│   │   │   └── ConflictDialog.tsx   # Conflict resolution
│   │   └── enterprise/           # Enterprise features
│   │       ├── PolicyStatusIndicator.tsx
│   │       └── ConfigurationViewer.tsx
│   │
│   ├── stores/                   # Zustand state stores (~26 files)
│   │   ├── documentStore.ts      # PDF document state
│   │   ├── annotationStore.ts    # Annotation state
│   │   ├── historyStore.ts       # Undo/redo
│   │   ├── uiStore.ts            # UI state
│   │   ├── settingsStore.ts      # User preferences
│   │   ├── formStore.ts          # Form field state
│   │   ├── signatureStore.ts     # Signatures
│   │   ├── offlineStore.ts       # Offline sync
│   │   ├── fileWatchStore.ts     # File watching
│   │   └── nativeBatchStore.ts   # Native batch ops
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── usePDF.ts             # PDF loading/rendering
│   │   ├── useAnnotations.ts     # Annotation operations
│   │   ├── useTextSelection.ts   # Text selection
│   │   ├── useOfflineSync.ts     # Offline sync
│   │   └── useConnectionStatus.ts # Network status
│   │
│   ├── lib/                      # Core libraries (~172 files)
│   │   ├── pdf/                  # PDF operations
│   │   │   ├── renderer.ts       # PDF.js wrapper
│   │   │   ├── saver.ts          # pdf-lib save operations
│   │   │   └── textSaver.ts      # Text layer extraction
│   │   ├── pages/                # Page operations
│   │   │   ├── merge.ts          # PDF merging
│   │   │   ├── split.ts          # PDF splitting
│   │   │   └── rotate.ts         # Page rotation
│   │   ├── forms/                # Form handling
│   │   │   ├── parser.ts         # Form field parsing
│   │   │   └── validation.ts     # Field validation
│   │   ├── storage/              # Data persistence
│   │   │   ├── indexedDB.ts      # IndexedDB wrapper
│   │   │   └── fileHandling.ts   # File system access
│   │   ├── ocr/                  # OCR processing
│   │   │   ├── engine.ts         # Tesseract.js wrapper
│   │   │   └── preprocessing.ts  # Image preprocessing
│   │   ├── offline/              # Offline support
│   │   │   ├── syncEngine.ts     # Sync logic
│   │   │   └── conflictResolution.ts
│   │   └── enterprise/           # Enterprise features
│   │       ├── gpoReader.ts      # Group Policy reader
│   │       └── policyMerger.ts   # Policy merging
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── index.ts              # Common types
│   │   ├── pdf.ts                # PDF-related types
│   │   ├── annotations.ts        # Annotation types
│   │   ├── forms.ts              # Form field types
│   │   └── electronTypes.ts      # Electron API types
│   │
│   ├── constants/                # Configuration
│   │   ├── config.ts             # App config (zoom limits, etc.)
│   │   ├── shortcuts.ts          # Keyboard shortcuts
│   │   └── tools.ts              # Tool definitions
│   │
│   ├── pages/                    # Route components
│   │   ├── Home.tsx              # Landing page
│   │   ├── Viewer.tsx            # PDF viewer page
│   │   └── Settings.tsx          # Settings page
│   │
│   ├── utils/                    # Utility functions
│   │   └── coordinates.ts        # PDF/screen conversion
│   │
│   ├── main.tsx                  # App bootstrap
│   ├── App.tsx                   # Router and layout
│   └── sw.ts                     # Service worker
│
├── electron/                     # Desktop application (~88 files)
│   ├── main/                     # Main process
│   │   ├── index.ts              # Entry point, app lifecycle
│   │   ├── windowManager.ts      # BrowserWindow management
│   │   ├── windowState.ts        # Window state persistence
│   │   ├── lifecycle.ts          # App lifecycle handlers
│   │   ├── security.ts           # CSP and security setup
│   │   ├── updater.ts            # Auto-update integration
│   │   ├── print/                # Native print integration
│   │   ├── scanner/              # Scanner bridge
│   │   ├── security/             # WebAuthn bridge
│   │   └── updates/              # Differential updates
│   │
│   ├── preload/                  # Preload scripts
│   │   ├── index.ts              # Main preload (electronAPI)
│   │   ├── networkPreload.ts     # Network status
│   │   └── webauthnPreload.ts    # WebAuthn API
│   │
│   ├── ipc/                      # IPC handlers
│   │   ├── channels.ts           # Channel name constants
│   │   ├── types.ts              # TypeScript definitions
│   │   ├── handlers.ts           # Core handlers
│   │   ├── fileHandlers.ts       # File operations
│   │   └── printHandlers.ts      # Print operations
│   │
│   ├── workers/                  # Worker threads
│   │   ├── workerPool.ts         # Thread pool manager
│   │   ├── workerManager.ts      # Worker lifecycle
│   │   └── pdfWorker.ts          # PDF processing worker
│   │
│   ├── touchbar/                 # macOS Touch Bar
│   │   └── touchBarManager.ts    # Context-aware Touch Bar
│   │
│   └── *.ts                      # Feature modules
│       ├── tray.ts               # System tray
│       ├── menu.ts               # Native menus
│       └── shortcuts.ts          # Global shortcuts
│
├── tests/                        # Test suites (~200 files)
│   ├── unit/                     # Unit tests (Vitest)
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests (Playwright)
│
├── docs/                         # Documentation
│   ├── architecture/             # Architecture docs
│   │   ├── OVERVIEW.md           # This file
│   │   ├── electron-architecture.md
│   │   ├── ipc-patterns.md
│   │   ├── offline-first.md
│   │   └── enterprise-features.md
│   └── planning/                 # Sprint planning
│       └── sprints/              # Sprint TODO files
│
├── public/                       # Static assets
│   ├── pdf.worker.min.js         # PDF.js worker
│   └── _headers                  # Cloudflare headers
│
├── dist/                         # Web build output
├── dist-electron/                # Electron build output
└── release/                      # Desktop installers
```

---

## Key Design Principles

### 1. Privacy-First

All PDF processing happens client-side by default. Documents never leave the user's device unless explicitly shared. No telemetry without consent. Cloud integrations (Google Drive, Dropbox, OneDrive) are optional and require explicit user authentication.

### 2. Offline-First

The application works fully offline via multiple mechanisms:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Static Assets | Service Worker (Workbox) | Cache app shell and static resources |
| Document Storage | IndexedDB | Store PDF binary data locally |
| Sync Queue | Background Sync API | Queue operations for later sync |
| Conflict Resolution | Last-write-wins + Manual | Handle concurrent edits |

### 3. Context Isolation (Desktop)

Electron security model enforces strict process separation:

```typescript
// Main process configuration
webPreferences: {
  contextIsolation: true,    // Isolate preload from renderer
  nodeIntegration: false,    // No Node.js in renderer
  sandbox: true,             // Chromium sandbox enabled
  preload: path.join(__dirname, 'preload.js')
}
```

All renderer-main communication goes through typed preload scripts. No direct access to Node.js APIs from renderer.

### 4. Progressive Enhancement

Core PDF viewing works everywhere. Advanced features degrade gracefully:

| Feature | Web | Desktop | Fallback |
|---------|-----|---------|----------|
| File System Access | File System Access API | Native fs | Download/upload |
| OCR | Tesseract.js (WASM) | Tesseract.js + Native | Manual text entry |
| Scanning | Not available | TWAIN/WIA/SANE | Import images |
| Hardware Keys | WebAuthn | WebAuthn + Native bridge | Password auth |

### 5. Type Safety

Full TypeScript coverage with strict mode enabled:

- All Zustand stores have complete type definitions
- IPC channels are typed end-to-end via `electron/ipc/types.ts`
- PDF coordinate systems documented and typed
- React props fully typed with no `any` escape hatches

---

## Performance Characteristics

### Web Application

| Metric | Target | Measurement |
|--------|--------|-------------|
| PDF Open (10 pages) | < 2 seconds | Time to first render |
| PDF Open (100 pages) | < 5 seconds | Time to first render |
| Edit Save | < 1 second | Local save to IndexedDB |
| PDF Size Limit | 100 MB | Without performance degradation |
| Memory (100-page PDF) | < 300 MB | Active editing session |
| Lighthouse PWA Score | 100 | Full PWA compliance |
| First Contentful Paint | < 1.5 seconds | Initial load |
| Time to Interactive | < 3 seconds | Initial load |

### Desktop Application

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold Start | < 3 seconds | First launch after reboot |
| Warm Start | < 1 second | Subsequent launches |
| Memory (Idle) | < 150 MB | No document open |
| Memory (100-page PDF) | < 500 MB | Active editing |
| Native File Save | < 500 ms | Direct file system write |
| IPC Round Trip | < 10 ms | Main-renderer communication |
| Worker Thread Spawn | < 100 ms | Worker pool initialization |

### Batch Processing

| Operation | Throughput | Notes |
|-----------|------------|-------|
| Compress | ~5 pages/second | Quality-dependent |
| Merge | ~10 files/second | File size dependent |
| OCR | ~3 seconds/page | Language and complexity dependent |
| Watermark | ~20 pages/second | Single watermark |
| Split | ~15 operations/second | Single-page extraction |
| Bates Numbering | ~25 pages/second | Sequential numbering |

---

## Storage Files

### IndexedDB Databases

**Primary Database:** `paperflow` (version 2)

| Store | Purpose | Key | Data |
|-------|---------|-----|------|
| `recentFiles` | Recent file metadata | `id` | Filename, path, last opened |
| `documents` | PDF binary data | `id` | ArrayBuffer of PDF |
| `signatures` | Saved user signatures | `id` | Base64 image, type, name |
| `autoSave` | Auto-save recovery | `id` | Temporary save data |
| `stamps` | Custom stamp images | `id` | Base64 image, name |

**Offline Database:** `paperflow-offline` (version 1)

| Store | Purpose | Key | Data |
|-------|---------|-----|------|
| `documents` | Offline-available PDFs | `id` | Full PDF with metadata |
| `metadata` | Document metadata | `id` | Title, author, page count |
| `annotations` | Annotation data | `documentId` | Per-document annotations |
| `editHistory` | Edit history for sync | `id` | Operation log entries |
| `settings` | Offline settings | `key` | Configuration values |

### localStorage Keys

| Key | Purpose | Type |
|-----|---------|------|
| `paperflow-settings` | User preferences (theme, zoom, view mode) | JSON object |
| `paperflow-shortcuts` | Custom keyboard shortcut mappings | JSON object |
| `paperflow-recent-count` | Number of recent files to display | number |
| `paperflow-license` | Encrypted license data (enterprise) | string |
| `paperflow-sidebar-state` | Sidebar collapsed/expanded state | boolean |
| `paperflow-last-tool` | Last selected annotation tool | string |

### Desktop File Locations

| Platform | App Data Path |
|----------|---------------|
| Windows | `%APPDATA%\PaperFlow\` |
| macOS | `~/Library/Application Support/PaperFlow/` |
| Linux | `~/.config/paperflow/` |

**Files stored in app data:**

```
PaperFlow/
├── settings.json          # User preferences
├── recent-files.json      # Recent file list with paths
├── window-state.json      # Window position, size, maximized state
├── shortcuts.json         # Custom keyboard shortcuts
├── backups/               # Auto-backup directory
│   └── {document-id}/     # Per-document backups
├── cache/                 # Thumbnail and preview cache
│   ├── thumbnails/        # Page thumbnail images
│   └── previews/          # Document preview images
├── logs/                  # Application logs (debug builds)
└── enterprise/            # Enterprise configuration
    ├── policy.json        # Applied GPO/MDM policy
    └── license.dat        # License file
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/paperflow.git
cd paperflow

# Install dependencies
npm install

# Copy environment file (optional, for cloud integrations)
cp .env.example .env.local
```

### Development

```bash
# Web development server (http://localhost:5173)
npm run dev

# Desktop development (Electron with hot reload)
npm run electron:dev

# Run both web and electron in parallel
npm run dev & npm run electron:dev
```

### Building

```bash
# Web build (outputs to dist/)
npm run build

# Preview web build locally
npm run preview

# Desktop build (outputs to release/)
npm run electron:build

# Platform-specific desktop builds
npm run electron:build -- --win    # Windows (NSIS, MSI)
npm run electron:build -- --mac    # macOS (DMG, universal binary)
npm run electron:build -- --linux  # Linux (AppImage, deb, rpm)
```

### Testing

```bash
# Run all tests
npm run test

# Unit tests only (Vitest)
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests - web (Playwright)
npm run test:e2e

# E2E tests - desktop (Playwright + Electron)
npm run test:e2e-electron

# Coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test file
npx vitest run tests/unit/stores/documentStore.test.ts
```

### Linting and Type Checking

```bash
# ESLint
npm run lint

# TypeScript type checking
npm run typecheck
```

---

## Environment Variables

All environment variables are optional. Copy `.env.example` to `.env.local` for local development.

| Variable | Purpose | Default | Example |
|----------|---------|---------|---------|
| `VITE_ANALYTICS_ID` | Google Analytics tracking ID | - | `G-XXXXXXXXXX` |
| `VITE_GOOGLE_CLIENT_ID` | Google Drive integration OAuth | - | `xxx.apps.googleusercontent.com` |
| `VITE_DROPBOX_APP_KEY` | Dropbox integration | - | `xxxxxxxxx` |
| `VITE_ONEDRIVE_CLIENT_ID` | OneDrive integration OAuth | - | `xxxxxxxx-xxxx-xxxx-xxxx` |
| `VITE_SENTRY_DSN` | Error tracking (Sentry) | - | `https://xxx@sentry.io/xxx` |
| `VITE_API_URL` | Optional cloud API endpoint | - | `https://api.paperflow.app` |

**Desktop-specific variables** (set in system environment):

| Variable | Purpose | Default |
|----------|---------|---------|
| `PAPERFLOW_DEV` | Enable development features | `false` |
| `PAPERFLOW_LOG_LEVEL` | Logging verbosity | `info` |
| `PAPERFLOW_DISABLE_GPU` | Disable GPU acceleration | `false` |

---

## Related Documentation

| Document | Description | Path |
|----------|-------------|------|
| [Electron Architecture](./electron-architecture.md) | Desktop application architecture, IPC design, security model | `docs/architecture/electron-architecture.md` |
| [IPC Patterns](./ipc-patterns.md) | Inter-process communication patterns and best practices | `docs/architecture/ipc-patterns.md` |
| [Offline-First Architecture](./offline-first.md) | Offline capabilities, sync engine, conflict resolution | `docs/architecture/offline-first.md` |
| [Enterprise Features](./enterprise-features.md) | MDM/GPO integration, licensing, kiosk mode | `docs/architecture/enterprise-features.md` |
| [Development Guide](../../CLAUDE.md) | Coding conventions, commands, commit format | `CLAUDE.md` |

---

## Architecture Decision Records

Key architectural decisions and rationale:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PDF Rendering | PDF.js | Industry standard, excellent rendering quality, Mozilla-maintained |
| PDF Editing | pdf-lib | Pure JavaScript, no native dependencies, comprehensive API |
| State Management | Zustand | Simpler than Redux, excellent TypeScript support, built-in persistence |
| Desktop Framework | Electron | Cross-platform, web technology reuse, mature ecosystem |
| OCR Engine | Tesseract.js | Client-side processing, no server required, multiple languages |
| Local Storage | IndexedDB | Handles large binary data, structured queries, transactions |
| Service Worker | Workbox | Battle-tested caching strategies, easy configuration |
| Test Framework | Vitest | Native ESM support, faster than Jest, Vite integration |
| E2E Testing | Playwright | Cross-browser, Electron support, better DX than Cypress |

---

## Quick Reference

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:

| Alias | Path |
|-------|------|
| `@/` | `src/` |
| `@components/` | `src/components/` |
| `@hooks/` | `src/hooks/` |
| `@stores/` | `src/stores/` |
| `@lib/` | `src/lib/` |
| `@utils/` | `src/utils/` |
| `@types/` | `src/types/` |

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PDFViewer.tsx` |
| Hooks | camelCase with `use` | `usePDF.ts` |
| Stores | camelCase with `Store` | `documentStore.ts` |
| Utils | camelCase | `pdfHelpers.ts` |
| Types | PascalCase | `Annotation` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ZOOM` |
| IPC Channels | UPPER_SNAKE_CASE | `FILE_READ` |

### PDF Coordinate System

PDF coordinates use origin at bottom-left, while screen coordinates use top-left. Conversion utilities in `src/utils/coordinates.ts`:

```typescript
import { pdfToScreen, screenToPdf } from '@utils/coordinates';

// Convert PDF point to screen coordinates
const screenPoint = pdfToScreen(pdfPoint, pageHeight, scale);

// Convert screen coordinates to PDF point
const pdfPoint = screenToPdf(screenPoint, pageHeight, scale);
```

---

*This document provides a comprehensive overview of the PaperFlow architecture. For implementation details, refer to the specific architecture documents linked in Related Documentation.*
