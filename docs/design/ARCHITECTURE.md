# PaperFlow Technical Architecture

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Framework | React 19 + TypeScript | Component architecture, large ecosystem, PWA support |
| PDF Engine | PDF.js + pdf-lib | Mozilla's renderer for viewing, pdf-lib for manipulation |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Styling | Tailwind CSS + Radix UI | Utility-first CSS, accessible components |
| Build Tool | Vite | Fast development, optimal production builds |
| Service Worker | Workbox | Google's PWA toolkit for offline support |
| Local Storage | IndexedDB | Client-side document and settings persistence |
| OCR Engine | Tesseract.js (WASM) | Client-side OCR, no data leaves device |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser Environment                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     React Application                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  Pages   │  │Components│  │  Hooks   │  │   Stores     │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Core Libraries                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  PDF.js  │  │  pdf-lib │  │Tesseract │  │  IndexedDB   │   │ │
│  │  │ (render) │  │  (edit)  │  │  (OCR)   │  │  (storage)   │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     Web Workers                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ PDF.js Worker│  │ OCR Worker   │  │ Compression Worker   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Service Worker                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ Cache API    │  │ Background   │  │ Push Notifications   │ │ │
│  │  │              │  │ Sync         │  │                      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Optional - Cloud Features)
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloud Services                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Auth Service │  │ Cloud Storage│  │ Collaboration Server     │  │
│  │ (OAuth 2.0)  │  │ (Optional)   │  │ (WebSocket - Phase 3)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
paperflow/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # PWA icons
│   └── pdf.worker.min.js      # PDF.js worker
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with routing
│   ├── index.css              # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives
│   │   ├── layout/            # App shell (Header, Sidebar, Toolbar)
│   │   ├── viewer/            # PDF rendering components
│   │   ├── editor/            # Text editing components
│   │   ├── annotations/       # Markup tools
│   │   ├── forms/             # Form field components
│   │   ├── signatures/        # Signature handling
│   │   ├── pages/             # Page management
│   │   ├── redaction/         # Redaction tools (Phase 2)
│   │   ├── batch/             # Batch processing (Phase 2)
│   │   ├── comparison/        # Document comparison (Phase 2)
│   │   └── accessibility/     # Accessibility tools (Phase 2)
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   ├── lib/                   # Core libraries
│   │   ├── pdf/               # PDF rendering and editing
│   │   ├── annotations/       # Annotation management
│   │   ├── signatures/        # Signature handling
│   │   ├── storage/           # IndexedDB operations
│   │   ├── export/            # Export functionality
│   │   ├── ocr/               # OCR processing (Phase 2)
│   │   ├── redaction/         # Redaction engine (Phase 2)
│   │   ├── comparison/        # Document comparison (Phase 2)
│   │   ├── batch/             # Batch processing (Phase 2)
│   │   └── accessibility/     # Accessibility checking (Phase 2)
│   ├── pages/                 # Route pages
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript definitions
│   └── constants/             # Application constants
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## PWA Requirements

### Web App Manifest
- Full configuration with icons, splash screens, shortcuts
- Theme color and background color matching brand
- Display mode: standalone

### Service Worker
- Precaching of application shell
- Runtime caching of assets
- Offline-first strategy for static resources

### Offline Storage
- IndexedDB for documents and user data
- LocalStorage for lightweight settings
- Cache API for application assets

### Advanced PWA Features
- Background Sync for queued operations
- Push Notifications for collaboration alerts
- File System Access API for native file handling

## Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.0 second |
| Largest Contentful Paint (LCP) | < 2.5 seconds |
| Time to Interactive (TTI) | < 3.0 seconds |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100 milliseconds |
| Bundle Size (Initial) | < 200 KB (gzipped) |
| PDF Rendering (10-page doc) | < 2 seconds |

## Security Architecture

### Client-Side Processing
- PDFs processed locally by default
- No upload unless cloud features explicitly used
- Sandboxed PDF rendering

### Encryption
- AES-256 for stored documents
- TLS 1.3 for all network transmission

### Data Retention
- No retention of user documents on servers
- Cloud documents encrypted at rest
- User controls data deletion

### Authentication (Cloud Features)
- OAuth 2.0 + PKCE
- Optional 2FA for paid accounts
- Session management with secure tokens

### Content Security
- Strict CSP headers to prevent XSS
- Subresource Integrity for external resources
- Sandboxed iframes where applicable

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |
| iOS Safari | iOS 15+ |
| Android Chrome | Android 10+ |

## Scalability Considerations

### Client-Side
- Virtualized rendering for large documents
- Lazy loading of pages and thumbnails
- Web Workers for CPU-intensive operations
- Memory management for large files (up to 100MB)

### Future Cloud Infrastructure
- Stateless API design
- Horizontal scaling capability
- CDN for static assets
- Regional deployment for latency

## State Management (Zustand Stores)

### Core Stores (Phase 1)
| Store | Purpose |
|-------|---------|
| `documentStore` | PDF state, renderer, pages, zoom, view mode |
| `annotationStore` | Annotations (highlights, notes, drawings, shapes) |
| `historyStore` | Undo/redo stack |
| `uiStore` | UI state (sidebar, dialogs, active tool) |
| `settingsStore` | User preferences (persisted to localStorage) |
| `formStore` | Form field state and values |
| `signatureStore` | Saved signatures and placements |
| `textStore` | Text editing state |

### Phase 2 Stores
| Store | Purpose |
|-------|---------|
| `ocrStore` | OCR processing state, results, language selection, preprocessing options |
| `formDesignerStore` | Form design mode, field selection, clipboard, grid settings |
| `redactionStore` | Redaction marks, patterns, verification, audit log |
| `comparisonStore` | Document comparison state, results, view modes |
| `batchStore` | Batch processing queue, operations, progress tracking |
| `accessibilityStore` | Accessibility check results |

## Core Library Modules

### Phase 1 Libraries
| Module | Purpose |
|--------|---------|
| `lib/pdf/` | PDF rendering (`renderer.ts`), saving (`saver.ts`, `textSaver.ts`), signature embedding |
| `lib/pages/` | Page operations (merge, split, extract, reorder, rotate, delete) |
| `lib/forms/` | Form parsing, validation, FDF/XFDF export/import |
| `lib/signatures/` | Image processing, field alignment, date utilities |
| `lib/storage/` | IndexedDB operations, file handling, signature/stamp storage |
| `lib/fonts/` | Font matching and fallback system |
| `lib/annotations/` | Annotation serialization and management |
| `lib/export/` | PDF export, image export, compression, flattening |
| `lib/print/` | Print rendering, page range parsing, print execution |
| `lib/share/` | Clipboard operations, email sharing |
| `lib/thumbnails/` | Thumbnail caching (LRU cache) |
| `lib/performance/` | Memory monitoring, canvas disposal |
| `lib/monitoring/` | Error tracking (Sentry), analytics |

### Phase 2 Libraries
| Module | Purpose |
|--------|---------|
| `lib/ocr/` | Tesseract.js OCR engine, image preprocessing, language loading, batch processing, layout analysis, export formats (hOCR, plain text, HTML) |
| `lib/redaction/` | Pattern matching (SSN, phone, email, credit cards), redaction engine, verification, metadata scrubbing |
| `lib/comparison/` | Text diff algorithm, comparison engine, report generation (text, HTML, JSON, PDF) |
| `lib/batch/` | Batch processor, watermarks, headers/footers, Bates numbering, PDF flattening |
| `lib/accessibility/` | PDF/UA checker, WCAG 2.1 compliance, contrast calculation, tag analysis |
| `lib/forms/` (additions) | Calculated fields, conditional logic, formatting, form actions, form submission |

## Component Architecture

### Core Components (Phase 1)
| Directory | Components |
|-----------|------------|
| `components/ui/` | Button, Dialog, Dropdown, Tooltip, Skeleton |
| `components/layout/` | Header, Sidebar, Toolbar, StatusBar, MobileToolbar |
| `components/viewer/` | PDFViewer, PageCanvas, Thumbnails, VirtualizedViewer |
| `components/editor/` | TextEditor, TextBox, FontPicker |
| `components/annotations/` | Highlight, StickyNote, Drawing, ShapeOverlay, AnnotationLayer |
| `components/forms/` | TextField, Checkbox, RadioButton, Dropdown |
| `components/signatures/` | SignaturePad, SignatureModal |
| `components/pages/` | PageManager, MergeDialog, SplitDialog |
| `components/export/` | ImageExportDialog, CompressDialog |
| `components/print/` | PrintDialog, PrintPreview, PageRangeSelector |

### Phase 2 Components
| Directory | Components |
|-----------|------------|
| `components/redaction/` | RedactionToolbar, PatternSearchDialog, RedactionVerify |
| `components/batch/` | BatchPanel, WatermarkDialog, HeaderFooterDialog, BatesNumberDialog, FlattenDialog |
| `components/comparison/` | ComparisonDialog, SideBySideView, OverlayView, ComparisonReport |
| `components/accessibility/` | AccessibilityPanel, IssueList, AccessibilityReport |

## Data Flow

```
UI Components → Zustand Stores → Core Libraries (PDF.js/pdf-lib/Tesseract.js) → IndexedDB/File System
```

### PDF Coordinate System
Annotations and form fields use PDF coordinates (origin at bottom-left). The annotation layer handles conversion between PDF coordinates and screen coordinates for rendering.

Coordinate conversion utilities are in `src/utils/coordinates.ts`:
- `pdfToScreen()` / `screenToPdf()`: Point conversion
- `pdfRectToScreen()` / `screenRectToPdf()`: Rectangle conversion
- `normalizeRects()`: Merge adjacent rectangles on same line
