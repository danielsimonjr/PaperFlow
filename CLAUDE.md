# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install
npm run dev              # Web: http://localhost:5173
npm run electron:dev     # Desktop with hot reload
```

See [Build & Development Commands](#build--development-commands) for full reference.

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

**Essential Stores** (start here when debugging):
- `documentStore`: PDF state - most common debugging target
- `annotationStore`: Annotation state and active tool
- `uiStore`: UI state including editor tools (select, hand, etc.)

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

- **Desktop/Enterprise**: See `docs/architecture/` for Phase 3+ store plans

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

### Key Files for Debugging
- `src/lib/pdf/renderer.ts`: PDF.js worker configuration and rendering
- `src/components/viewer/PageCanvas.tsx`: PDF page rendering with annotation layers
- `src/stores/documentStore.ts`: Core PDF document state
- `vite.config.ts`: Web build configuration (check `base` for Electron)
- `electron-builder.yml`: Desktop build configuration

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

- **Desktop/Enterprise**: See `docs/architecture/` for Phase 3+ components

### Electron Directory Structure

```
electron/
├── main/           # Main process (index.ts, windowManager, lifecycle, security, updater)
├── preload/        # Preload scripts (index.ts, networkPreload, webauthnPreload)
├── ipc/            # IPC handlers and types (channels, handlers, fileHandlers)
├── workers/        # Worker threads (workerPool, pdfWorker)
└── *.ts            # Feature modules (tray, menu, shortcuts, etc.)
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

- **Desktop/Enterprise**: See `docs/architecture/` for Phase 3+ modules

### PDF Coordinate System
Annotations and form fields use PDF coordinates (origin at bottom-left). The annotation layer handles conversion between PDF coordinates and screen coordinates for rendering.

Coordinate conversion utilities are in `src/utils/coordinates.ts`:
- `pdfToScreen()` / `screenToPdf()`: Point conversion
- `pdfRectToScreen()` / `screenRectToPdf()`: Rectangle conversion
- `normalizeRects()`: Merge adjacent rectangles on same line

### Annotation System
Components in `components/annotations/`: `AnnotationLayer` (SVG overlay), `Highlight`/`Underline`/`Strikethrough` (text markup), `StickyNote`/`NoteTool`/`NoteReplies` (notes), `SelectionPopup` (context menu), `ExportImportDialog`. Key hooks: `useAnnotationShortcuts` (H, U, S, N, V), `useTextSelection`. Serialization in `lib/annotations/serializer.ts`.

### Tool State Architecture

- **Annotation tools** (highlight, underline, strikethrough, note): Stored in `annotationStore.activeTool`
- **Editor tools** (select, hand, text, draw, shape): Stored in `uiStore.activeTool`
- When adding new tool behavior, ensure view components (SinglePageView, ContinuousView) consume the tool state from the global store
- Auto-annotation: When annotation tool is active, text selection auto-creates annotations (see `PageCanvas.tsx`)

### Drawing/Annotation Tool Layering

The PDF text layer (`.textLayer`) has `z-index: 2` in `src/index.css`. Drawing and shape tools must use `z-index: 20` or higher to receive pointer events above the text layer. When adding new drawing/annotation overlay tools, always set explicit z-index.

### Pointer Event Handlers and React State

When tracking drag state in pointer event handlers, use a ref for synchronous state alongside React state:
- React state (`setIsDrawing(true)`) is async - move events may fire before re-render
- Use `isDrawingRef.current = true` before the state setter for immediate availability in `handlePointerMove`
- See `src/hooks/usePointerInput.ts` for the pattern

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

`type(scope): description` -- e.g. `feat(viewer): add continuous scroll mode`, `fix(annotations): correct highlight position`

## Changelog

Always update `CHANGELOG.md` when making codebase changes. Follow [Keep a Changelog](https://keepachangelog.com/) format under `[Unreleased]` section.

## Pre-Commit Checks

Before committing and pushing, always run:
```bash
npm run typecheck && npm run build && npm run test
```
Only commit if all checks pass.

## Environment Setup

Copy `.env.example` to `.env.local`. All variables are optional (Phase 2+): `VITE_ANALYTICS_ID`, `VITE_GOOGLE_CLIENT_ID`, `VITE_DROPBOX_APP_KEY`, `VITE_ONEDRIVE_CLIENT_ID`.

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
Cold start < 3s, warm start < 1s, memory idle < 150 MB, 100-page PDF < 500 MB, native save < 500 ms.

### Electron Build Troubleshooting
- `npm run electron:build -- --win --x64` (Windows x64 only); portable output: `release/PaperFlow-{version}-win-x64.exe`
- **Blank page** - `base: './'` in vite.config.ts (relative paths for file://); app uses HashRouter not BrowserRouter
- **PDF.js worker path** - Must use relative path (`./pdf.worker.min.js`); absolute resolves to drive root
- **rcedit "Unable to commit changes"** - File locked by Dropbox or running process; stop PaperFlow.exe first
- **"Cannot find module"** errors - electron-builder.yml must include all needed node_modules
- **NSIS script errors** - Comment out `nsis.include`, use portable target
- **Missing icons** - Create PNGs in build/icons/ (16x16 through 512x512)

### Electron Build in Dropbox Folders
Build to temp to avoid Dropbox file locking: `npx electron-builder --win portable --config.directories.output="C:/Temp/paperflow-build"` then copy to `release/`. Before rebuilding: `Stop-Process -Name "PaperFlow" -Force -ErrorAction SilentlyContinue`.

## Color Theme

Primary brand: `#1E3A5F` (900), `#3B82F6` (500). Highlight colors: yellow `#FFEB3B`, green `#4CAF50`, blue `#2196F3`, pink `#E91E63`, orange `#FF9800`.

## Deployment

- **Web (PWA)**: Cloudflare Pages (`wrangler.toml`). Auto-deploys on push to main. Headers in `public/_headers`.
- **Desktop**: electron-builder (`electron-builder.config.js`). `npm run electron:build -- --win/--mac/--linux`. Output: `release/`.

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

- **Context Compressor**: Compresses files for LLM context windows (`--format`, `--recursive`, `--output`)
  `npx tsx tools/compress-for-context/compress-for-context.ts <input> [options]`

- **File Chunker**: Splits large files into chunks for editing, then merges back
  `npx tsx tools/chunking-for-files/chunking-for-files.ts split|merge|status <file>`

- **Dependency Graph**: Analyzes imports and generates dependency graphs to `docs/architecture/`
  `npx tsx tools/create-dependency-graph/create-dependency-graph.ts [options]`

## Import Patterns

Use barrel exports for cleaner imports:
- `import { useDocumentStore, useAnnotationStore } from '@stores'`
- `import { useFileSystem, useAutoSave } from '@hooks'`
- `import { cn, getPlatformInfo } from '@utils'`

## Build Notes

Expected warnings (not errors):
- CSS `@import` order warnings from PostCSS
- Chunk size warnings for pdf-engine (~797KB)
- Full test suite: ~5 minutes, 2,400+ tests

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
