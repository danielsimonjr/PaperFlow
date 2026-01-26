# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PaperFlow is a Progressive Web Application (PWA) for PDF editing built with React, TypeScript, and Vite. It aims to provide a modern, web-first alternative to Adobe Acrobat with offline capabilities and a privacy-first approach (local processing by default).

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Run all tests with coverage
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Watch mode for tests
npm run test:watch
```

## Architecture

### Core Libraries
- **PDF.js** (`pdfjs-dist`): Rendering and text extraction
- **pdf-lib**: PDF manipulation (editing, merging, splitting)
- **Tesseract.js**: Client-side OCR (Phase 2)
- **Zustand**: State management
- **Workbox/vite-plugin-pwa**: Service worker and offline support

### State Management (Zustand Stores)
- `documentStore`: PDF state (renderer, pages, zoom, view mode)
- `annotationStore`: Annotations (highlights, notes, drawings, shapes)
- `historyStore`: Undo/redo stack
- `uiStore`: UI state (sidebar, dialogs, active tool)
- `settingsStore`: User preferences (persisted to localStorage)

### Key Data Flow
```
UI Components → Zustand Stores → Core Libraries (PDF.js/pdf-lib) → IndexedDB/File System
```

### Path Aliases (configured in vite.config.ts and tsconfig.json)
- `@/` → `src/`
- `@components/` → `src/components/`
- `@hooks/` → `src/hooks/`
- `@stores/` → `src/stores/`
- `@lib/` → `src/lib/`
- `@utils/` → `src/utils/`
- `@types/` → `src/types/`

### Component Organization
- `components/ui/`: Reusable UI primitives (Button, Dialog, Dropdown, Tooltip)
- `components/layout/`: App shell (Header, Sidebar, Toolbar, StatusBar)
- `components/viewer/`: PDF rendering (PDFViewer, PageCanvas, Thumbnails)
- `components/editor/`: Text editing (TextEditor, TextBox, FontPicker)
- `components/annotations/`: Markup tools (Highlight, StickyNote, Drawing, ShapeOverlay)
- `components/forms/`: Form fields (TextField, Checkbox, RadioButton, Dropdown)
- `components/signatures/`: Signature handling (SignaturePad, SignatureModal)
- `components/pages/`: Page management (PageManager, MergeModal)

### PDF Coordinate System
Annotations and form fields use PDF coordinates (origin at bottom-left). The annotation layer handles conversion between PDF coordinates and screen coordinates for rendering.

Coordinate conversion utilities are in `src/utils/coordinates.ts`:
- `pdfToScreen()` / `screenToPdf()`: Point conversion
- `pdfRectToScreen()` / `screenRectToPdf()`: Rectangle conversion
- `normalizeRects()`: Merge adjacent rectangles on same line

### Annotation System (Sprint 3)
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

## Commit Message Format

```
type(scope): description

feat(viewer): add continuous scroll mode
fix(annotations): correct highlight position
docs(readme): update installation steps
```

## Important Technical Notes

- PDF.js worker must be copied to `public/pdf.worker.min.js`
- The app must be installable as a PWA with a Lighthouse PWA score of 100
- All PDF processing happens client-side by default (privacy-first)
- Support File System Access API for native file handling with fallback to download
- Target performance: PDF opens in <2 seconds, edits save in <1 second
- Support PDFs up to 100MB without performance degradation

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
