# Phase 1: MVP Development Plan

## Overview

Phase 1 spans 6 months (24 weeks) across 12 two-week sprints, delivering the core PDF editing experience that's immediately better than Adobe for common tasks.

### Milestones

| Month | Deliverables | Milestone |
|-------|--------------|-----------|
| 1-2 | PDF.js integration, basic viewing, PWA shell, design system | Internal Alpha |
| 3 | Text editing, annotations, form filling | Closed Beta |
| 4 | Signatures, page management, merge/split | Open Beta |
| 5 | Cloud storage integration, export formats | Beta Refinement |
| 6 | Polish, performance optimization, mobile refinement | Public Launch (v1.0) |

### Success Criteria

| Metric | Target |
|--------|--------|
| Time to First Edit | < 30 seconds |
| Task Completion Rate | 95%+ for common tasks |
| PDF Load Time (10-page doc) | < 2 seconds |
| Edit Save Time | < 1 second |
| Lighthouse PWA Score | 100 |
| Bundle Size (Initial) | < 200 KB gzipped |

### Sprint Overview

| Sprint | Focus Area | Weeks |
|--------|------------|-------|
| 1 | Project Foundation & Basic PDF Rendering | 1-2 |
| 2 | File Operations & View Modes | 3-4 |
| 3 | Annotations Part 1 (Highlight, Notes) | 5-6 |
| 4 | Annotations Part 2 (Drawing, Shapes) | 7-8 |
| 5 | Form Filling | 9-10 |
| 6 | Digital Signatures | 11-12 |
| 7 | Text Editing | 13-14 |
| 8 | Page Management | 15-16 |
| 9 | Export & Print | 17-18 |
| 10 | Polish & Optimization | 19-20 |
| 11 | Testing & QA | 21-22 |
| 12 | Launch Preparation | 23-24 |

---

## Sprint 1: Project Foundation & Basic PDF Rendering

**Goal:** Set up development environment and implement basic PDF rendering

**Milestone:** Internal Alpha (end of Sprint 2)

### Environment Setup

- [ ] Initialize Vite + React + TypeScript project
  ```bash
  npm create vite@latest paperflow -- --template react-ts
  ```
- [ ] Configure Tailwind CSS with custom theme
  - Primary colors: `#1E3A5F` (brand), `#3B82F6` (accent)
  - Dark mode support via `class` strategy
- [ ] Set up ESLint + Prettier with strict rules
- [ ] Configure path aliases in tsconfig.json
  - `@/` → `src/`
  - `@components/`, `@hooks/`, `@stores/`, `@lib/`, `@utils/`, `@types/`
- [ ] Set up Git repository with .gitignore
- [ ] Create development and production environment files

### Core Dependencies

```bash
# Core
npm install pdfjs-dist react-router-dom zustand

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip @radix-ui/react-tabs
npm install lucide-react clsx tailwind-merge

# PWA
npm install vite-plugin-pwa workbox-window

# PDF Manipulation
npm install pdf-lib @pdf-lib/fontkit

# File Handling
npm install browser-fs-access file-saver jszip uuid

# Dev Dependencies
npm install -D @types/node vitest @testing-library/react
npm install -D playwright @playwright/test
npm install -D eslint prettier eslint-config-prettier
```

### PWA Foundation

- [ ] Install and configure vite-plugin-pwa
- [ ] Create manifest.json with app metadata
  - Name: "PaperFlow"
  - Theme color: `#1E3A5F`
  - Display: standalone
- [ ] Generate PWA icons (192px, 512px, maskable)
- [ ] Set up basic service worker with Workbox
  - Precache application shell
  - Runtime cache for PDF.js assets
- [ ] Implement install prompt handler
- [ ] Configure offline fallback page

### PDF.js Integration

- [ ] Install pdfjs-dist package
- [ ] Configure PDF.js worker (copy to public folder as `pdf.worker.min.js`)
- [ ] Create PDFRenderer class with methods:
  - `loadDocument(source: ArrayBuffer | string)`
  - `renderPage(pageNumber, canvas, scale)`
  - `getPageInfo(pageNumber)`
  - `getTextContent(pageNumber)`
  - `getOutline()`
  - `destroy()`
- [ ] Implement document loading from File object
- [ ] Implement document loading from URL
- [ ] Implement document loading from ArrayBuffer
- [ ] Handle password-protected PDFs (prompt for password)

### Basic PDF Viewer

- [ ] Create PDFViewer container component
- [ ] Create PageCanvas component for rendering
  - High-DPI canvas support (devicePixelRatio)
  - Canvas cleanup on unmount
- [ ] Implement single page display
- [ ] Add page number indicator with input field
- [ ] Implement previous/next page navigation
- [ ] Add basic zoom controls
  - Zoom in (+25%)
  - Zoom out (-25%)
  - Reset to 100%
  - Fit to width
  - Fit to page
  - Zoom range: 10% - 400%
- [ ] Implement smooth scrolling between pages
- [ ] Add keyboard navigation (Arrow keys, Page Up/Down)

### Application Shell

- [ ] Create Header component
  - Logo and app name
  - File name display with modified indicator (*)
  - Save/Download buttons
  - Settings link
- [ ] Create collapsible Sidebar component
  - Thumbnails tab
  - Bookmarks/Outline tab
  - Annotations tab (placeholder)
  - Collapse/expand toggle
- [ ] Create Toolbar component
  - Tool selection buttons
  - Page navigation
  - Zoom controls
- [ ] Create main layout with CSS Grid
  - Header (fixed)
  - Toolbar (fixed)
  - Sidebar (resizable)
  - Main content area (scrollable)
- [ ] Implement dark mode toggle
  - Persist preference to localStorage
  - Respect system preference on first visit
- [ ] Set up React Router with routes:
  - `/` - Home (file picker)
  - `/editor` - PDF editor
  - `/settings` - User settings
  - `*` - 404 Not Found

### State Management

- [ ] Install and configure Zustand
- [ ] Create documentStore
  - State: fileName, fileData, pageCount, currentPage, zoom, viewMode, isModified, isLoading, error
  - Actions: loadDocument, setCurrentPage, nextPage, prevPage, setZoom, zoomIn, zoomOut, setViewMode, closeDocument
- [ ] Create uiStore
  - State: sidebarOpen, sidebarWidth, activeDialog, darkMode
  - Actions: toggleSidebar, setSidebarWidth, openDialog, closeDialog, toggleDarkMode
- [ ] Create settingsStore
  - State: defaultZoom, defaultViewMode, smoothScrolling, autoSave, defaultHighlightColor
  - Persist to localStorage
- [ ] Create historyStore
  - State: past[], future[]
  - Actions: push, undo, redo, canUndo, canRedo, clear

### Key Implementation: PDF Renderer

```typescript
// src/lib/pdf/renderer.ts
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export class PDFRenderer {
  private document: pdfjsLib.PDFDocumentProxy | null = null;

  async loadDocument(source: ArrayBuffer | string): Promise<PDFDocumentInfo> {
    const loadingTask = pdfjsLib.getDocument(source);
    this.document = await loadingTask.promise;

    const metadata = await this.document.getMetadata();

    return {
      numPages: this.document.numPages,
      title: metadata.info?.Title,
      author: metadata.info?.Author,
    };
  }

  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0
  ): Promise<void> {
    if (!this.document) throw new Error('No document loaded');

    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Support high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.width * dpr;
    canvas.height = viewport.height * dpr;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const context = canvas.getContext('2d')!;
    context.scale(dpr, dpr);

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  }

  destroy(): void {
    if (this.document) {
      this.document.destroy();
      this.document = null;
    }
  }
}
```

### Definition of Done

- [ ] PDF files load and render correctly (test with 5+ sample PDFs)
- [ ] Page navigation works (prev/next/jump to page)
- [ ] Zoom in/out functions properly (10% - 400% range)
- [ ] Dark mode toggles correctly and persists
- [ ] PWA is installable on Chrome
- [ ] Lighthouse PWA score ≥ 90
- [ ] No console errors or warnings
- [ ] Works offline after first load

---

## Sprint 2: File Operations & View Modes

**Goal:** Complete file handling and implement all view modes

**Milestone:** Internal Alpha Complete

### File Opening

- [ ] Implement drag-and-drop file opening
  - Visual feedback on drag over
  - Validate file type (.pdf only)
  - Show error for invalid files
- [ ] Create file picker dialog with browser-fs-access
  - Native file picker when supported
  - Fallback to `<input type="file">` when not
- [ ] Support opening from URL parameter (`?url=...`)
- [ ] Add loading indicator during file load
  - Show progress for large files
  - Cancel button for long operations
- [ ] Implement error handling for invalid/corrupted files
- [ ] Create "Open Recent" list with IndexedDB
  - Store last 10 files
  - Show file name, size, last opened date
  - Thumbnail preview
  - Clear recent files option

### File Saving

- [ ] Implement "Save" to original file (File System Access API)
  - Maintain file handle reference
  - Prompt for location if no handle
- [ ] Implement "Save As" with new filename
- [ ] Add "Download" fallback for unsupported browsers
  - Generate blob URL
  - Trigger download with suggested filename
- [ ] Show save confirmation toast notification
- [ ] Track document modified state
  - Show indicator in header (*)
  - Warn before closing with unsaved changes
- [ ] Auto-save to IndexedDB every 30 seconds (configurable)

### View Modes

- [ ] Implement single page view (default)
  - Center page horizontally
  - Vertical scrolling between pages
- [ ] Implement continuous scroll view
  - Render visible pages + 2 ahead
  - Virtualized rendering for performance
  - Smooth scroll snap optional
- [ ] Implement two-page spread view
  - First page on right (cover mode)
  - Option for first page on left
- [ ] Create view mode toggle in toolbar
- [ ] Persist view mode preference
- [ ] Optimize rendering for each mode
  - Only render visible pages
  - Dispose off-screen canvases

### Thumbnail Sidebar

- [ ] Create ThumbnailSidebar component
- [ ] Generate page thumbnails on load
  - Scale: 0.2 of original
  - Cache generated thumbnails
- [ ] Implement lazy loading for large documents
  - IntersectionObserver for visibility
  - Placeholder until rendered
- [ ] Add click-to-navigate functionality
- [ ] Highlight current page in sidebar
  - Scroll thumbnail into view
- [ ] Add thumbnail size slider (small/medium/large)
- [ ] Show page numbers below thumbnails

### Search Functionality

- [ ] Create SearchBar component in toolbar
  - Keyboard shortcut: Ctrl/Cmd + F
  - Close on Escape
- [ ] Implement text search using PDF.js
  - Search all pages
  - Case-insensitive by default
- [ ] Highlight search results on pages
  - Yellow highlight for matches
  - Orange highlight for current match
- [ ] Add next/previous result navigation
  - Keyboard: Enter for next, Shift+Enter for previous
- [ ] Show total match count and current position
- [ ] Add case-sensitive option toggle
- [ ] Add whole word option toggle

### Bookmarks/Outline

- [ ] Parse PDF outline from document
- [ ] Create OutlinePanel component
- [ ] Display nested outline structure
  - Indentation for hierarchy
  - Expand/collapse icons
- [ ] Implement click-to-navigate
  - Scroll to destination page
  - Handle named destinations
- [ ] Add expand/collapse all buttons
- [ ] Show "No bookmarks" message when empty

### Key Implementation: Document Store

```typescript
// src/stores/documentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DocumentState {
  fileName: string | null;
  fileData: ArrayBuffer | null;
  fileHandle: FileSystemFileHandle | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;

  loadDocument: (file: File) => Promise<void>;
  saveDocument: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: (containerWidth: number, pageWidth: number) => void;
  fitToPage: (containerSize: Size, pageSize: Size) => void;
  setViewMode: (mode: ViewMode) => void;
  setModified: (modified: boolean) => void;
  closeDocument: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    {
      name: 'paperflow-document',
      partialize: (state) => ({
        zoom: state.zoom,
        viewMode: state.viewMode,
      }),
    }
  )
);
```

### Definition of Done

- [ ] Drag-and-drop file opening works
- [ ] File picker opens and loads PDF
- [ ] Save/Save As/Download all functional
- [ ] All three view modes work correctly
- [ ] Thumbnails display and navigate correctly
- [ ] Search finds and highlights text
- [ ] Bookmarks panel shows outline and navigates
- [ ] Recent files list persists across sessions
- [ ] Modified indicator shows when document changed
- [ ] Unsaved changes warning on close

---

## Sprint 3: Annotations Part 1 (Highlight, Notes)

**Goal:** Implement text highlighting and sticky notes

**Milestone:** Closed Beta (end of Sprint 3)

### Annotation Infrastructure

- [ ] Create AnnotationLayer component (SVG overlay on pages)
  - Position absolutely over page canvas
  - Scale with zoom level
  - Handle pointer events
- [ ] Define annotation data models
  ```typescript
  interface Annotation {
    id: string;
    type: AnnotationType;
    pageIndex: number;
    rects: Rect[];
    color: string;
    opacity: number;
    content?: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    replies?: Reply[];
  }
  ```
- [ ] Create annotationStore with Zustand
- [ ] Implement annotation ID generation (UUID v4)
- [ ] Create coordinate transformation utilities
  - PDF coords (bottom-left origin) ↔ Screen coords (top-left origin)
  - Account for zoom and scroll position
- [ ] Implement annotation serialization for save/load
- [ ] Add annotation import/export (JSON format)

### Text Selection

- [ ] Enable PDF.js text layer on pages
- [ ] Capture text selection events
  - `mouseup` event after selection
  - `selectionchange` event
- [ ] Get selection rectangles from PDF.js text layer
- [ ] Convert screen coordinates to PDF coordinates
- [ ] Show selection popup menu
  - Highlight button with color options
  - Underline button
  - Strikethrough button
  - Copy text button
- [ ] Handle multi-line and multi-column selections

### Highlight Tool

- [ ] Create Highlight component (SVG rect with blend mode)
- [ ] Implement highlight creation from text selection
- [ ] Support highlight colors:
  - Yellow: `#FFEB3B`
  - Green: `#4CAF50`
  - Blue: `#2196F3`
  - Pink: `#E91E63`
  - Orange: `#FF9800`
- [ ] Add opacity control (30% - 100%, default 50%)
- [ ] Enable highlight color editing after creation
  - Click to select
  - Color picker in properties panel
- [ ] Implement highlight deletion
  - Select + Delete key
  - Right-click context menu
- [ ] Show highlight on hover (subtle border)

### Underline & Strikethrough

- [ ] Create Underline component (SVG line below text)
- [ ] Create Strikethrough component (SVG line through text center)
- [ ] Share selection logic with highlight
- [ ] Add color options (same palette as highlight)
- [ ] Default colors:
  - Underline: Red `#EF4444`
  - Strikethrough: Red `#EF4444`

### Sticky Notes

- [ ] Create StickyNote component
  - Icon indicator on page
  - Expandable note panel
- [ ] Implement click-to-place on page
  - Show placement cursor
  - Click to position
- [ ] Add rich text editor for note content
  - Basic formatting (bold, italic)
  - Auto-resize textarea
- [ ] Support note drag to reposition
- [ ] Implement collapse/expand toggle
  - Collapsed: show icon only
  - Expanded: show full note
- [ ] Add note color options:
  - Yellow: `#FEF3C7`
  - Green: `#D1FAE5`
  - Blue: `#DBEAFE`
  - Pink: `#FCE7F3`
  - Purple: `#EDE9FE`
- [ ] Create reply threading UI
  - Reply button on note
  - Nested reply display
  - Delete individual replies
- [ ] Show author and timestamp

### Annotation Toolbar

- [ ] Create floating AnnotationToolbar component
  - Position in toolbar area
  - Tool selection buttons with icons
- [ ] Add tool buttons:
  - Select/Hand tool
  - Highlight
  - Underline
  - Strikethrough
  - Sticky Note
- [ ] Show color picker popover on click
- [ ] Add opacity slider in popover
- [ ] Indicate active tool with highlight/border
- [ ] Keyboard shortcuts:
  - `H` for Highlight
  - `U` for Underline
  - `S` for Strikethrough
  - `N` for Note
  - `Escape` to deselect tool

### Key Implementation: Annotation Store

```typescript
// src/stores/annotationStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  activeTool: null,
  activeColor: '#FFEB3B',
  activeOpacity: 0.5,

  addAnnotation: (data) => {
    const id = uuidv4();
    const now = new Date();
    const annotation = { ...data, id, createdAt: now, updatedAt: now };

    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));

    // Push to history for undo
    useHistoryStore.getState().push({
      action: `Add ${data.type}`,
      undo: () => get().deleteAnnotation(id),
      redo: () => set((s) => ({ annotations: [...s.annotations, annotation] })),
    });

    return id;
  },

  // ... other actions
}));
```

### Definition of Done

- [ ] Text selection works on PDF pages
- [ ] Highlight tool creates colored highlights
- [ ] Underline and strikethrough work
- [ ] Sticky notes can be placed and edited
- [ ] Note replies work
- [ ] All annotations can be selected, edited, deleted
- [ ] Annotations persist when document is saved
- [ ] Annotations export/import works
- [ ] Undo/redo works for all annotation actions
- [ ] Keyboard shortcuts work

---

## Sprint 4: Annotations Part 2 (Drawing, Shapes)

**Goal:** Implement freehand drawing and shape annotations

### Drawing Tool

- [ ] Create DrawingCanvas component (canvas overlay)
- [ ] Implement freehand drawing with mouse
  - Smooth line rendering (bezier curves)
  - Variable stroke width
- [ ] Add touch/stylus support
  - Pressure sensitivity for stroke width
  - Palm rejection
- [ ] Support stroke colors (same palette as highlights)
- [ ] Support stroke widths: 1px, 2px, 4px, 8px
- [ ] Implement eraser tool
  - Erase by stroke (remove entire path)
  - Visual eraser cursor
- [ ] Add undo/redo for strokes
- [ ] Serialize paths for save/load
  - Array of points with pressure

### Shape Tools

- [ ] Create ShapeOverlay component
- [ ] Implement rectangle drawing
  - Click and drag
  - Shift for square
- [ ] Implement circle/ellipse drawing
  - Click and drag from center
  - Shift for circle
- [ ] Implement arrow drawing
  - Arrowhead at end
  - Configurable head size
- [ ] Implement line drawing
  - Shift for horizontal/vertical/45°
- [ ] Add stroke color options
- [ ] Add fill color options (with transparency)
- [ ] Add stroke width options
- [ ] Support resizing after creation
  - Corner handles
  - Edge handles
  - Maintain aspect ratio with Shift
- [ ] Support rotation
  - Rotation handle above shape
  - Shift for 15° increments

### Stamps

- [ ] Create StampTool component
- [ ] Add preset stamps:
  - Approved (green)
  - Rejected (red)
  - Confidential (red)
  - Draft (orange)
  - Final (blue)
  - For Review (yellow)
- [ ] Support custom text stamps
  - User-defined text
  - Font selection
  - Color selection
- [ ] Allow stamp rotation (0°, 45°, 90°, etc.)
- [ ] Allow stamp scaling
- [ ] Implement stamp placement via click
- [ ] Save custom stamps for reuse

### Definition of Done

- [ ] Freehand drawing works smoothly
- [ ] Pressure sensitivity works with stylus
- [ ] All shape tools create correct shapes
- [ ] Shapes can be resized and rotated
- [ ] Stamps can be placed and customized
- [ ] All drawing annotations save and load correctly
- [ ] Eraser removes strokes
- [ ] Undo/redo works for drawing

---

## Sprint 5: Form Filling

**Goal:** Implement form field detection and filling

### Form Detection

- [ ] Parse PDF form fields using PDF.js
  - AcroForm fields
  - XFA forms (basic support)
- [ ] Identify field types:
  - Text fields
  - Checkboxes
  - Radio buttons
  - Dropdowns/Listboxes
  - Signature fields (placeholder)
- [ ] Map field positions to page coordinates
- [ ] Handle multi-page forms
- [ ] Detect required fields
- [ ] Read field default values

### Form Field Components

- [ ] Create TextField component
  - Single line and multiline support
  - Character limit display
  - Format masks (phone, date, etc.)
- [ ] Create Checkbox component
  - Visual check mark
  - Tri-state if supported
- [ ] Create RadioButton component
  - Group management
  - Mutual exclusivity
- [ ] Create Dropdown component
  - Native-like dropdown
  - Search/filter for long lists
  - Custom value if allowed
- [ ] Style fields to match PDF appearance
  - Match font, size, color
  - Maintain borders and backgrounds

### Form Interaction

- [ ] Implement tab navigation between fields
  - Follow PDF tab order
  - Visual focus indicator
- [ ] Auto-advance to next field (optional)
- [ ] Validate required fields
  - Highlight incomplete required fields
  - Show validation message
- [ ] Show field validation errors
  - Red border
  - Error tooltip
- [ ] Auto-save form progress to IndexedDB
  - Save on field blur
  - Restore on document reopen

### Form Data

- [ ] Export form data to JSON
- [ ] Export form data to FDF format
- [ ] Export form data to XFDF format
- [ ] Import form data from JSON
- [ ] Import form data from FDF/XFDF
- [ ] Clear all form fields option
- [ ] Reset to default values option

### Definition of Done

- [ ] Form fields are detected correctly
- [ ] All field types can be filled
- [ ] Tab navigation works in correct order
- [ ] Validation shows for required fields
- [ ] Form data exports and imports correctly
- [ ] Auto-save preserves form progress
- [ ] Form data is included when saving PDF

---

## Sprint 6: Digital Signatures

**Goal:** Implement signature creation and placement

**Milestone:** Open Beta (end of Sprint 6)

### Signature Creation

- [ ] Create SignatureModal component
  - Three tabs: Draw, Type, Image
- [ ] Implement draw signature with canvas
  - Smooth line rendering
  - Black ink on white/transparent background
  - Clear button
  - Line thickness option
- [ ] Support mouse, touch, and stylus input
- [ ] Implement type signature
  - Text input field
  - Signature font selection (4-5 cursive fonts)
  - Preview in real-time
- [ ] Support signature image upload
  - Accept PNG, JPG, SVG
  - Auto-remove white background
  - Crop to signature bounds
- [ ] Add initials support
  - Separate from full signature
  - Same creation options

### Signature Management

- [ ] Save signatures to IndexedDB
  - Encrypt stored signatures
  - Maximum 10 saved signatures
- [ ] Create SignatureList component
  - Grid of saved signatures
  - Preview thumbnails
- [ ] Allow renaming saved signatures
- [ ] Delete saved signatures
- [ ] Set default signature
  - Quick-apply default
  - Indicator for default

### Signature Placement

- [ ] Click-to-place signature on page
  - Show signature preview following cursor
  - Click to confirm placement
- [ ] Resize signature after placement
  - Maintain aspect ratio
  - Corner drag handles
- [ ] Rotate signature (optional)
- [ ] Multiple signatures per document
- [ ] Align signature to form field if detected
- [ ] Date stamp option
  - Auto-insert current date
  - Configurable format

### Definition of Done

- [ ] All signature creation methods work
- [ ] Signatures save and persist
- [ ] Signatures can be placed on any page
- [ ] Signatures can be resized
- [ ] Initials work separately from signatures
- [ ] Signatures are embedded when saving PDF
- [ ] Signature fields in forms are fillable

---

## Sprint 7: Text Editing

**Goal:** Implement inline text editing

### Text Selection

- [ ] Select existing text on page
  - Click and drag
  - Double-click for word
  - Triple-click for paragraph
- [ ] Show text properties panel
  - Font family (detected)
  - Font size
  - Color
  - Bold/Italic/Underline status
- [ ] Copy text to clipboard
- [ ] Select all text on page (Ctrl+A when focused)

### Inline Editing

- [ ] Edit existing text in place
  - Double-click to enter edit mode
  - Contenteditable overlay
- [ ] Match original font when available
  - Detect font from PDF
  - Use exact font if embedded
- [ ] Fall back to similar fonts
  - Map common fonts to web fonts
  - Helvetica → Arial
  - Times → Times New Roman
- [ ] Preserve text styling
  - Maintain size, color, weight
- [ ] Handle multi-line text blocks
- [ ] Character limit per line (to prevent overflow)

### Text Boxes

- [ ] Create new text box anywhere
  - Click and drag to define area
  - Or click to start typing
- [ ] Rich text formatting:
  - Bold (Ctrl+B)
  - Italic (Ctrl+I)
  - Underline (Ctrl+U)
- [ ] Font family selection
  - Common PDF fonts
  - Web-safe fonts
- [ ] Font size control (8-72pt)
- [ ] Text color picker
- [ ] Text alignment options:
  - Left, Center, Right, Justify
- [ ] Line spacing options
- [ ] Text box resize/reposition

### Definition of Done

- [ ] Text can be selected and copied
- [ ] Existing text can be edited inline
- [ ] New text boxes can be added
- [ ] Formatting tools work correctly
- [ ] Text changes save to PDF
- [ ] Font matching works reasonably well
- [ ] Undo/redo works for text edits

---

## Sprint 8: Page Management

**Goal:** Implement page manipulation features

### Page Reordering

- [ ] Drag-and-drop page thumbnails
  - Visual feedback during drag
  - Drop indicator between pages
- [ ] Multi-select pages
  - Ctrl+click for individual
  - Shift+click for range
- [ ] Move pages to specific position
  - Right-click menu
  - "Move to page..." dialog

### Page Operations

- [ ] Delete single page
  - Confirmation dialog
  - Cannot delete last page
- [ ] Delete multiple selected pages
- [ ] Duplicate page
  - Insert after original
- [ ] Rotate page
  - 90° clockwise
  - 90° counter-clockwise
  - 180°
  - Apply to selected pages
- [ ] Insert blank page
  - Before or after current
  - Page size options (match document, standard sizes)

### Merge & Split

- [ ] Merge multiple PDF files
  - Drag-and-drop files onto merge dialog
  - Reorder files before merge
  - Progress indicator
- [ ] Split PDF into separate files
  - Split by page range
  - Split every N pages
  - Split by file size
- [ ] Extract pages to new PDF
  - Select pages
  - Extract to new file

### Definition of Done

- [ ] Pages can be reordered via drag-and-drop
- [ ] Multi-select works for bulk operations
- [ ] Delete, duplicate, rotate all work
- [ ] Blank pages can be inserted
- [ ] PDF merge combines multiple files
- [ ] PDF split creates multiple files
- [ ] Page extraction works
- [ ] All operations update document correctly

---

## Sprint 9: Export & Print

**Goal:** Implement export formats and printing

### Export Formats

- [ ] Export to PDF (with all changes)
  - Flatten annotations option
  - Preserve editability option
- [ ] Export to PNG
  - Per page export
  - All pages to ZIP
  - Resolution options (72, 150, 300 DPI)
- [ ] Export to JPEG
  - Quality slider (60-100%)
  - Same options as PNG
- [ ] Compress PDF
  - Reduce image quality
  - Remove metadata
  - Subsample images
  - Show size comparison

### Print

- [ ] Print dialog with preview
  - Show page thumbnails
  - Navigate between pages
- [ ] Page range selection
  - All pages
  - Current page
  - Custom range (1-5, 8, 10-12)
- [ ] Scale options
  - Fit to page
  - Actual size
  - Custom percentage
- [ ] Orientation options
  - Auto (based on page)
  - Portrait
  - Landscape
- [ ] Copies count
- [ ] Print annotations option
- [ ] Print form fields option

### Share

- [ ] Generate shareable link (requires cloud - defer)
- [ ] Email document (opens email client)
- [ ] Copy link to clipboard

### Definition of Done

- [ ] PDF export includes all changes
- [ ] Image export works for PNG and JPEG
- [ ] Compression reduces file size
- [ ] Print preview shows correctly
- [ ] Print options apply correctly
- [ ] Printed output matches preview

---

## Sprint 10: Polish & Optimization

**Goal:** Performance optimization and UX improvements

### Performance

- [ ] Implement virtualized page rendering
  - Only render visible pages
  - Buffer 2 pages ahead/behind
  - Dispose off-screen pages
- [ ] Optimize thumbnail generation
  - Web Worker for generation
  - Cache generated thumbnails
  - Progressive loading
- [ ] Add loading skeletons
  - Page skeleton while loading
  - Thumbnail skeleton
- [ ] Reduce bundle size
  - Code splitting by route
  - Dynamic imports for heavy features
  - Tree shaking verification
- [ ] Lazy load heavy features
  - OCR module (future)
  - Signature canvas
  - Rich text editor
- [ ] Memory management
  - Dispose unused canvases
  - Monitor memory usage
  - Warn for very large documents

### Mobile Experience

- [ ] Optimize touch interactions
  - Larger touch targets (44px minimum)
  - Touch-friendly spacing
- [ ] Improve mobile toolbar layout
  - Bottom toolbar for primary actions
  - Collapsible secondary tools
- [ ] Add mobile-specific gestures
  - Pinch to zoom
  - Two-finger pan
  - Long press for context menu
  - Swipe for page navigation
- [ ] Test on various devices
  - iOS Safari
  - Android Chrome
  - iPad
  - Android tablets

### Accessibility

- [ ] Keyboard navigation for all features
  - Tab order
  - Arrow key navigation in lists
  - Enter/Space for activation
- [ ] Screen reader support
  - Meaningful labels
  - Live regions for updates
  - Page content accessible
- [ ] High contrast mode
  - Detect system preference
  - Manual toggle
- [ ] Focus indicators
  - Visible focus rings
  - Skip navigation links
- [ ] ARIA labels and roles
  - Buttons, dialogs, menus
  - Toolbar roles
- [ ] Color contrast compliance (WCAG AA)

### Definition of Done

- [ ] Large documents (100+ pages) perform well
- [ ] Memory usage stays reasonable
- [ ] Mobile experience is usable
- [ ] Touch gestures work correctly
- [ ] Keyboard navigation works throughout
- [ ] Screen reader can navigate app
- [ ] Focus is always visible
- [ ] Lighthouse Accessibility score ≥ 90

---

## Sprint 11: Testing & QA

**Goal:** Comprehensive testing coverage

### Unit Tests (60% of tests)

- [ ] Test all utility functions
  - Coordinate transformations
  - File helpers
  - PDF helpers
  - cn() classname utility
- [ ] Test Zustand stores
  - documentStore actions and state
  - annotationStore CRUD operations
  - historyStore undo/redo
  - settingsStore persistence
- [ ] Test PDF rendering logic
  - PDFRenderer class methods
  - Page rendering
  - Text extraction
- [ ] Test annotation serialization
  - JSON export/import
  - Coordinate handling

### Integration Tests (30% of tests)

- [ ] Test file opening flow
  - Drag and drop
  - File picker
  - URL loading
- [ ] Test annotation creation
  - Highlight flow
  - Note creation
  - Drawing tools
- [ ] Test form filling
  - Field detection
  - Value entry
  - Tab navigation
- [ ] Test signature placement
  - Creation modal
  - Placement flow
  - Save and reload

### E2E Tests (10% of tests)

- [ ] Test complete user workflows
  - Open → Edit → Save → Reopen
  - Form fill and submit
  - Annotate and share
- [ ] Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers
- [ ] Mobile device testing
  - Touch interactions
  - Responsive layout
- [ ] Performance benchmarks
  - Load time for various PDF sizes
  - Render time per page
  - Memory usage

### Test Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── pdf/
│   │   │   └── renderer.test.ts
│   │   └── annotations/
│   │       └── manager.test.ts
│   ├── stores/
│   │   ├── documentStore.test.ts
│   │   └── annotationStore.test.ts
│   └── utils/
│       └── pdfHelpers.test.ts
├── integration/
│   ├── viewer.test.tsx
│   ├── annotations.test.tsx
│   └── forms.test.tsx
└── e2e/
    ├── open-file.spec.ts
    ├── annotations.spec.ts
    └── signatures.spec.ts
```

### Definition of Done

- [ ] Unit test coverage ≥ 80%
- [ ] All integration tests pass
- [ ] E2E tests cover critical paths
- [ ] Cross-browser tests pass
- [ ] No critical bugs remaining
- [ ] Performance benchmarks documented

---

## Sprint 12: Launch Preparation

**Goal:** Prepare for public launch

**Milestone:** Public Launch v1.0

### Deployment

- [ ] Set up production hosting (Cloudflare Pages)
- [ ] Configure CDN for static assets
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Set up monitoring and analytics
  - Error tracking (Sentry)
  - Usage analytics (privacy-respecting)
- [ ] Configure Content Security Policy
- [ ] Set up staging environment

### CI/CD Pipeline

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: paperflow
          directory: dist
```

### Documentation

- [ ] User guide / Help center
  - Getting started
  - Feature documentation
  - FAQ
- [ ] Video tutorials (optional)
  - Quick start (2 min)
  - Feature highlights
- [ ] Changelog
- [ ] Privacy policy
- [ ] Terms of service

### Pre-Launch Checklist

- [ ] Beta testing feedback incorporated
- [ ] All critical bugs fixed
- [ ] Performance targets met
- [ ] Accessibility audit passed
- [ ] Security review completed
- [ ] Legal documents in place
- [ ] Analytics configured
- [ ] Error tracking configured
- [ ] Backup and recovery tested
- [ ] Load testing completed

### Launch

- [ ] Soft launch to limited audience
- [ ] Monitor for issues
- [ ] Public launch announcement
- [ ] Submit to Product Hunt (optional)
- [ ] Monitor and respond to feedback

### Definition of Done

- [ ] Production deployment working
- [ ] CI/CD pipeline operational
- [ ] Documentation published
- [ ] Analytics and monitoring active
- [ ] v1.0 released publicly
- [ ] No critical issues in production

---

## Appendix: Technical Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open file | `Ctrl/Cmd + O` |
| Save | `Ctrl/Cmd + S` |
| Save As | `Ctrl/Cmd + Shift + S` |
| Print | `Ctrl/Cmd + P` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Find | `Ctrl/Cmd + F` |
| Zoom in | `Ctrl/Cmd + =` |
| Zoom out | `Ctrl/Cmd + -` |
| Reset zoom | `Ctrl/Cmd + 0` |
| Next page | `→` or `Page Down` |
| Previous page | `←` or `Page Up` |
| First page | `Ctrl/Cmd + Home` |
| Last page | `Ctrl/Cmd + End` |
| Select tool | `V` |
| Hand tool | `H` |
| Highlight | `L` |
| Note | `N` |
| Draw | `D` |

### Color Palette

```css
/* Primary Brand */
--primary-900: #1E3A5F;
--primary-700: #2D5A8A;
--primary-500: #3B82F6;

/* Highlight Colors */
--highlight-yellow: #FFEB3B;
--highlight-green: #4CAF50;
--highlight-blue: #2196F3;
--highlight-pink: #E91E63;
--highlight-orange: #FF9800;

/* Note Colors */
--note-yellow: #FEF3C7;
--note-green: #D1FAE5;
--note-blue: #DBEAFE;
--note-pink: #FCE7F3;
--note-purple: #EDE9FE;

/* Status */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
```

### Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |
| Bundle Size (Initial) | < 200 KB |
| PDF Load (10 pages) | < 2s |
| Page Render | < 100ms |

### Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |
| iOS Safari | iOS 15+ |
| Android Chrome | Android 10+ |
