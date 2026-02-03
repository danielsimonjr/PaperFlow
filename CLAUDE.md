# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173 (web)
npm run electron:dev # Desktop app with hot reload
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Project Overview

PaperFlow is a comprehensive PDF editing solution available as both a Progressive Web Application (PWA) and a native desktop application built with Electron. It provides a modern alternative to Adobe Acrobat with offline capabilities and a privacy-first approach (local processing by default).

## Build & Development Commands

```bash
# Install dependencies
npm install

# Web Development
npm run dev              # Start Vite dev server at http://localhost:5173
npm run build            # Build web app to dist/
npm run preview          # Preview production build

# Desktop Development (Electron)
npm run electron:dev     # Start Electron with hot reload
npm run electron:build   # Build desktop app for all platforms
npm run electron:preview # Preview desktop build without packaging
npm run electron:compile # Compile TypeScript for Electron
npm run electron:pack    # Build without creating installers (for testing)
npm run electron:dist    # Build with installers

# Linting & Type Checking
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run test:e2e         # Run Playwright E2E tests (web)
npm run test:e2e-electron # Run Playwright E2E tests (desktop)
npm run test:coverage    # Run tests with coverage report
npm run test:watch       # Watch mode for tests

# Run a single test file
npx vitest run tests/unit/stores/documentStore.test.ts

# Run tests matching a pattern
npx vitest run -t "should load PDF"
```

## Architecture

### Core Libraries
- **PDF.js** (`pdfjs-dist`): Rendering and text extraction
- **pdf-lib**: PDF manipulation (editing, merging, splitting)
- **Tesseract.js**: Client-side OCR (Phase 2)
- **Electron**: Desktop application framework (Phase 3)
- **Zustand**: State management
- **Workbox/vite-plugin-pwa**: Service worker and offline support

### State Management (Zustand Stores)

**Core Stores (Phase 1)**
- `documentStore`: PDF state (renderer, pages, zoom, view mode)
- `annotationStore`: Annotations (highlights, notes, drawings, shapes)
- `historyStore`: Undo/redo stack
- `uiStore`: UI state (sidebar, dialogs, active tool)
- `settingsStore`: User preferences (persisted to localStorage)
- `formStore`: Form field state and values
- `signatureStore`: Saved signatures and placements
- `textStore`: Text editing state

**Advanced Stores (Phase 2)**
- `ocrStore`: OCR processing state and results
- `formDesignerStore`: Form design mode state
- `redactionStore`: Redaction marks and patterns
- `comparisonStore`: Document comparison state
- `batchStore`: Batch processing queue (web)

**Desktop Stores (Phase 3)**
- `recentFilesStore`: Recently opened files tracking
- `updateStore`: Auto-update state and settings
- `shortcutsStore`: Custom keyboard shortcuts
- `fileWatchStore`: File watcher state and events
- `offlineStore`: Offline sync status and queue
- `nativeBatchStore`: Native batch processing with worker threads
- `printStore`: Native print job management
- `scannerStore`: Scanner device state and scan history
- `securityStore`: Hardware key authentication state

**Enterprise Stores (Phase 3 Q4)**
- `enterprisePolicyStore`: MDM/GPO policy state
- `licenseStore`: License validation and feature gating
- `lanStore`: LAN peer discovery and sync
- `kioskStore`: Kiosk mode configuration and session

### Key Data Flow
```
UI Components → Zustand Stores → Core Libraries (PDF.js/pdf-lib) → IndexedDB/File System
                     ↓
             (Desktop only)
                     ↓
        Electron IPC → Main Process → Native APIs
```

### Path Aliases (configured in vite.config.ts and tsconfig.json)
- `@/` → `src/`
- `@components/` → `src/components/`
- `@hooks/` → `src/hooks/`
- `@stores/` → `src/stores/`
- `@lib/` → `src/lib/`
- `@utils/` → `src/utils/`
- `@types/` → `src/types/`

### Key Entry Points
- `src/main.tsx`: App bootstrap and React root
- `src/App.tsx`: Router and layout
- `src/pages/`: Route components (Home, Viewer, Settings)
- `electron/main/index.ts`: Electron main process entry point
- `electron/preload/index.ts`: Preload script exposing APIs to renderer

### Constants (`src/constants/`)
- `config.ts`: App configuration (zoom limits, performance thresholds)
- `shortcuts.ts`: Keyboard shortcut definitions
- `tools.ts`: Tool definitions and metadata
- `stamps.ts`: Predefined stamp templates

### Component Organization

**Core Components**
- `components/ui/`: Reusable UI primitives (Button, Dialog, Dropdown, Tooltip, Skeleton)
- `components/layout/`: App shell (Header, Sidebar, Toolbar, StatusBar, MobileToolbar)
- `components/viewer/`: PDF rendering (PDFViewer, PageCanvas, Thumbnails, VirtualizedViewer)
- `components/editor/`: Text editing (TextEditor, TextBox, FontPicker)
- `components/annotations/`: Markup tools (Highlight, StickyNote, Drawing, ShapeOverlay)
- `components/forms/`: Form fields (TextField, Checkbox, RadioButton, Dropdown)
- `components/signatures/`: Signature handling (SignaturePad, SignatureModal)
- `components/pages/`: Page management (PageManager, MergeDialog, SplitDialog)
- `components/export/`: Export dialogs (ImageExportDialog, CompressDialog)
- `components/print/`: Print functionality (PrintDialog, PrintPreview, PageRangeSelector)
- `components/sidebar/`: Sidebar panels (ThumbnailSidebar)
- `components/toolbar/`: Toolbar components
- `components/home/`: Home page components (FileDropZone)
- `components/lazy/`: Lazy-loaded component definitions for code splitting

**Desktop Components (Phase 3)**
- `components/offline/`: Offline indicators (OfflineIndicator, OfflineBanner, SyncStatusPanel, ConflictDialog)
- `components/update/`: Auto-update UI (UpdateNotification, UpdateSettings, UpdateProgress, ReleaseNotes)
- `components/scanner/`: Scanner UI (ScannerSelectDialog, ScanSettingsPanel, ScanPreview, BatchScanWorkflow)
- `components/security/`: Hardware key UI (HardwareKeyEnrollment, HardwareKeyAuth, KeyManagement)
- `components/batch/`: Batch processing (BatchWizard, BatchDashboard, BatchSummary, TemplateManager)
- `components/fileWatch/`: File watching UI (AutoReloadSettings, WatchStatusIndicator)

**Enterprise Components (Phase 3 Q4)**
- `components/enterprise/`: Enterprise config (PolicyStatusIndicator, ConfigurationViewer, LockedSettingBadge)
- `components/kiosk/`: Kiosk mode (KioskShell, KioskToolbar, KioskHeader)

### Electron Directory Structure

```
electron/
├── main/                  # Main process modules
│   ├── index.ts           # Entry point, app lifecycle
│   ├── windowManager.ts   # BrowserWindow management
│   ├── windowState.ts     # Window state persistence
│   ├── lifecycle.ts       # App lifecycle handlers
│   ├── security.ts        # CSP and security setup
│   ├── updater.ts         # Auto-update integration
│   ├── print/             # Native print integration
│   ├── scanner/           # Scanner bridge (TWAIN/WIA/SANE)
│   ├── security/          # WebAuthn bridge
│   └── updates/           # Auto-updater and differential updates
├── preload/               # Preload scripts
│   ├── index.ts           # Main preload with electronAPI
│   ├── networkPreload.ts  # Network status detection
│   └── webauthnPreload.ts # WebAuthn API bridge
├── ipc/                   # IPC handlers and types
│   ├── channels.ts        # Channel name constants
│   ├── types.ts           # TypeScript type definitions
│   ├── handlers.ts        # Core IPC handlers
│   ├── fileHandlers.ts    # File operation handlers
│   ├── printHandlers.ts   # Print IPC handlers
│   └── ...                # Other handler modules
├── workers/               # Worker threads for heavy operations
│   ├── workerPool.ts      # Worker thread pool manager
│   ├── workerManager.ts   # Worker lifecycle management
│   └── pdfWorker.ts       # PDF processing worker
├── touchbar/              # macOS Touch Bar
│   └── touchBarManager.ts # Context-aware Touch Bar
└── *.ts                   # Feature modules (tray, menu, shortcuts, etc.)
```

### Core Library Modules (lib/)

**Core Modules**
- `lib/pdf/`: PDF rendering (`renderer.ts`), saving (`saver.ts`, `textSaver.ts`), signature embedding
- `lib/pages/`: Page operations (merge, split, extract, reorder, rotate, delete)
- `lib/forms/`: Form parsing, validation, FDF/XFDF export/import
- `lib/signatures/`: Image processing, field alignment, date utilities
- `lib/storage/`: IndexedDB operations, file handling, signature/stamp storage
- `lib/fonts/`: Font matching and fallback system
- `lib/annotations/`: Annotation serialization and management
- `lib/export/`: PDF export, image export, compression, flattening
- `lib/print/`: Print rendering, page range parsing, print execution
- `lib/share/`: Clipboard operations, email sharing
- `lib/thumbnails/`: Thumbnail caching (LRU cache)
- `lib/performance/`: Memory monitoring, canvas disposal
- `lib/monitoring/`: Error tracking (Sentry), analytics

**Advanced Modules (Phase 2)**
- `lib/ocr/`: OCR engine, image preprocessing, language loading, batch processing, layout analysis
- `lib/redaction/`: Pattern matching, redaction engine, verification
- `lib/comparison/`: Text diff, comparison engine, report generation
- `lib/batch/`: Watermarks, headers/footers, Bates numbering, PDF flattening, job queue
- `lib/accessibility/`: PDF/UA checker, WCAG compliance, contrast calculation

**Desktop Modules (Phase 3)**
- `lib/electron/`: Platform detection, IPC wrappers, file system API, notifications, print, dialogs
- `lib/offline/`: Service worker config, offline storage, sync engine, delta sync, conflict resolution
- `lib/fileWatch/`: Change detection, smart reload with state preservation
- `lib/scanner/`: Scanner providers (TWAIN, WIA, SANE), document detection, image processing
- `lib/security/`: WebAuthn client, attestation verification, hardware encryption

**Enterprise Modules (Phase 3 Q4)**
- `lib/enterprise/`: GPO reader, MDM reader, config parser, config discovery, policy merging
- `lib/license/`: License format, validator, signature verifier, hardware fingerprint, feature gating
- `lib/lan/`: mDNS discovery, peer manager, sync protocol
- `lib/kiosk/`: Kiosk config, feature lockdown, session management

### PDF Coordinate System
Annotations and form fields use PDF coordinates (origin at bottom-left). The annotation layer handles conversion between PDF coordinates and screen coordinates for rendering.

Coordinate conversion utilities are in `src/utils/coordinates.ts`:
- `pdfToScreen()` / `screenToPdf()`: Point conversion
- `pdfRectToScreen()` / `screenRectToPdf()`: Rectangle conversion
- `normalizeRects()`: Merge adjacent rectangles on same line

### Annotation System
Components in `components/annotations/`:
- `AnnotationLayer`: SVG overlay for rendering annotations
- `Highlight`, `Underline`, `Strikethrough`: Text markup components
- `StickyNote`, `NoteTool`, `NoteReplies`: Note annotations
- `SelectionPopup`: Context menu for text selection
- `ExportImportDialog`: Import/export annotations as JSON

Key hooks:
- `useAnnotationShortcuts`: Keyboard shortcuts (H, U, S, N, V)
- `useTextSelection`: Text selection handling

Annotation serialization in `lib/annotations/serializer.ts`.

## Naming Conventions

| Type       | Convention              | Example            |
|------------|-------------------------|--------------------|
| Components | PascalCase              | `PDFViewer.tsx`    |
| Hooks      | camelCase with `use`    | `usePDF.ts`        |
| Stores     | camelCase with `Store`  | `documentStore.ts` |
| Utils      | camelCase               | `pdfHelpers.ts`    |
| Types      | PascalCase              | `Annotation`       |
| Constants  | SCREAMING_SNAKE_CASE    | `MAX_ZOOM`         |
| IPC Channels | UPPER_SNAKE_CASE      | `FILE_READ`        |

## Commit Message Format

```
type(scope): description

feat(viewer): add continuous scroll mode
feat(electron): implement native file dialogs
fix(annotations): correct highlight position
docs(readme): update installation steps
```

## Changelog

Always update `CHANGELOG.md` when making codebase changes. Follow [Keep a Changelog](https://keepachangelog.com/) format under `[Unreleased]` section.

## Pre-Commit Checks

Before committing and pushing, always run:
```bash
npm run typecheck && npm run build && npm run test
```
Only commit if all checks pass.

## Environment Setup

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

All variables are optional (Phase 2+ features):
- `VITE_ANALYTICS_ID`: Analytics tracking
- `VITE_GOOGLE_CLIENT_ID`: Google Drive integration
- `VITE_DROPBOX_APP_KEY`: Dropbox integration
- `VITE_ONEDRIVE_CLIENT_ID`: OneDrive integration

## Important Technical Notes

### Web Application
- PDF.js worker must be copied to `public/pdf.worker.min.js`
- The app must be installable as a PWA with a Lighthouse PWA score of 100
- All PDF processing happens client-side by default (privacy-first)
- Support File System Access API for native file handling with fallback to download
- Target performance: PDF opens in <2 seconds, edits save in <1 second
- Support PDFs up to 100MB without performance degradation

### Desktop Application (Electron)
- Context isolation is always enabled (`contextIsolation: true`)
- Node integration is disabled in renderer (`nodeIntegration: false`)
- Sandbox mode is enabled for renderer processes
- All renderer-main communication goes through the preload script
- IPC channels are typed and validated
- Main process entry: `electron/main/index.ts`
- Preload script: `electron/preload/index.ts`
- Build output: `dist-electron/` for main process code

### Performance Targets (Desktop)
- Cold start: < 3 seconds
- Warm start: < 1 second
- Memory (idle): < 150 MB
- Memory (100-page PDF): < 500 MB
- Native file save: < 500 ms

## Color Theme

```css
/* Primary brand colors */
--primary-900: #1E3A5F;
--primary-500: #3B82F6;

/* Annotation highlight colors */
--highlight-yellow: #FFEB3B;
--highlight-green: #4CAF50;
--highlight-blue: #2196F3;
--highlight-pink: #E91E63;
--highlight-orange: #FF9800;
```

## Deployment

### Web (PWA)
Deployed to Cloudflare Pages. Configuration in `wrangler.toml`.

```bash
npm run build      # Build production bundle to dist/
# Automatic deployment on push to main branch
```

Custom headers configured in `public/_headers` (security headers, caching).

### Desktop
Built with electron-builder. Configuration in `electron-builder.config.js`.

```bash
npm run electron:build          # Build for current platform
npm run electron:build -- --win # Windows (NSIS, MSI)
npm run electron:build -- --mac # macOS (DMG, universal binary)
npm run electron:build -- --linux # Linux (AppImage, deb, rpm)
```

Release artifacts output to `release/` directory.

## Architecture Documentation

- [Electron Architecture](docs/architecture/electron-architecture.md)
- [IPC Patterns](docs/architecture/ipc-patterns.md)
- [Offline-First Architecture](docs/architecture/offline-first.md)
- [Enterprise Features](docs/architecture/enterprise-features.md)
- [System Architecture](docs/architecture/ARCHITECTURE.md)
- [Project Overview](docs/architecture/OVERVIEW.md)
- [API Reference](docs/architecture/API.md)
- [Data Flow](docs/architecture/DATAFLOW.md)
- [Component Reference](docs/architecture/COMPONENTS.md)

## Development Tools

The `tools/` directory contains CLI utilities for development workflows:

### Context Compressor (`tools/compress-for-context/`)

Compresses files for LLM context windows using format-specific strategies. Supports JSON, YAML, Markdown, CSV, TypeScript/JavaScript, and more.

```bash
# Basic usage
npx tsx tools/compress-for-context/compress-for-context.ts <input> [options]

# Examples
npx tsx tools/compress-for-context/compress-for-context.ts src/stores/documentStore.ts
npx tsx tools/compress-for-context/compress-for-context.ts package.json --format json
npx tsx tools/compress-for-context/compress-for-context.ts . --recursive --output context.txt
```

Options:
- `--format`: Force specific format (json, yaml, markdown, csv, typescript, etc.)
- `--output, -o`: Output file path (default: stdout)
- `--recursive, -r`: Process directories recursively
- `--max-depth`: Maximum recursion depth
- `--exclude`: Glob patterns to exclude

### File Chunker (`tools/chunking-for-files/`)

Splits large files into manageable chunks for editing, then merges them back. Useful for editing large files that exceed context limits.

```bash
# Split a large file into chunks
npx tsx tools/chunking-for-files/chunking-for-files.ts split <file> [options]

# Merge chunks back together
npx tsx tools/chunking-for-files/chunking-for-files.ts merge <file>

# Check chunk status
npx tsx tools/chunking-for-files/chunking-for-files.ts status <file>
```

Options:
- `--chunk-size, -s`: Target chunk size in lines (default: 500)
- `--output-dir, -o`: Directory for chunk files
- `--format`: File format hint (markdown, json, typescript)

### Dependency Graph Generator (`tools/create-dependency-graph/`)

Analyzes codebase dependencies and generates visual dependency graphs.

```bash
# Generate dependency graph for the project
npx tsx tools/create-dependency-graph/create-dependency-graph.ts [options]
```

Outputs:
- `DEPENDENCY_GRAPH.md`: Markdown documentation with Mermaid diagrams
- `dependency-graph.json`: Machine-readable JSON format
- `dependency-graph.yaml`: YAML format for configuration tools

Options:
- `--entry`: Entry point file(s) to analyze
- `--output-dir, -o`: Output directory for generated files
- `--include`: Glob patterns to include
- `--exclude`: Glob patterns to exclude
- `--depth`: Maximum dependency depth to traverse

Outputs to `docs/architecture/DEPENDENCY_GRAPH.md`, `dependency-graph.json`, `unused-analysis.md`.

## Import Patterns

Use barrel exports for cleaner imports:
- `import { useDocumentStore, useAnnotationStore } from '@stores'`
- `import { useFileSystem, useAutoSave } from '@hooks'`
- `import { cn, getPlatformInfo } from '@utils'`

## Testing Tips

- Prefer `npx vitest run` over `npm run test:unit` for more reliable test discovery
- Run specific test: `npx vitest run tests/unit/path/to/test.ts`
- Check sprint status: `grep '"status"' docs/planning/sprints/PHASE_*_SPRINT_*_TODO.json`

## Subagent Tips

- Use no more than 3 subagents in parallel to avoid cascading failures
- If a subagent reports failed, complete the task yourself instead of retrying
- Subagents may fail at completion but still write files - check file existence with `Glob`
- Use `gh issue create --repo <repo> --title "<title>" --body "<body>"` to file bug reports

## Windows Development Notes

- Avoid creating files named `NUL`, `CON`, `PRN`, `AUX` (Windows reserved device names cause git issues)
- If `git add` fails with "unable to index file 'NUL'", delete the file: `rm -f NUL`

## Sprint Planning Files

Sprint TODOs are in `docs/planning/sprints/PHASE_X_SPRINT_Y_TODO.json`:
- `status`: "pending", "complete", or "completed"
- `completedAt`: ISO date when marked complete
- `blockedBy`: Array of sprint numbers that must complete first
- `canParallelWith`: Array of sprints that can run concurrently
