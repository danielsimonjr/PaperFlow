# PaperFlow Data Flow

## Overview

PaperFlow follows a local-first architecture where all PDF processing happens in the browser. This document describes how data flows through the application.

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Viewer  │  │  Editor  │  │Annotations│  │   Page Manager      │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────────┬──────────┘ │
└───────┼─────────────┼──────────────┼───────────────────┼────────────┘
        │             │              │                   │
        ▼             ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Zustand State Stores                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────┐│
│  │documentStore │  │annotationStore│  │      historyStore          ││
│  │              │  │              │  │      (undo/redo)            ││
│  └──────────────┘  └──────────────┘  └─────────────────────────────┘│
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │   uiStore    │  │settingsStore │                                 │
│  └──────────────┘  └──────────────┘                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Core Libraries                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  PDF.js  │  │  pdf-lib │  │Tesseract │  │     IndexedDB        │ │
│  │ (render) │  │  (edit)  │  │  (OCR)   │  │     (storage)        │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Document Lifecycle

### 1. Document Opening

```
User Action                    System Response
─────────────────────────────────────────────────────────────
Drag & Drop / File Picker  →  Validate file type (.pdf)
                           →  Read file as ArrayBuffer
                           →  Store in documentStore
                           →  Initialize PDF.js renderer
                           →  Extract document metadata
                           →  Render first page
                           →  Generate thumbnails (async)
                           →  Parse outline/bookmarks
                           →  Detect form fields
                           →  Save to IndexedDB (recent files)
```

### 2. Document Viewing

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Action │ ──► │documentStore│ ──► │  PDF.js     │
│ (navigate,  │     │ (state)     │     │  (render)   │
│  zoom, etc) │     └─────────────┘     └──────┬──────┘
└─────────────┘                                │
                                               ▼
                                        ┌─────────────┐
                                        │   Canvas    │
                                        │  (display)  │
                                        └─────────────┘
```

### 3. Document Editing

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User Edit   │ ──► │historyStore │ ──► │ pdf-lib     │
│ (text, form │     │ (capture    │     │ (modify     │
│  annotation)│     │  undo state)│     │  document)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐            │
                    │documentStore│ ◄──────────┘
                    │ (modified   │
                    │  flag=true) │
                    └─────────────┘
```

### 4. Document Saving

```
Save Trigger                   System Response
─────────────────────────────────────────────────────────────
Ctrl+S / Save Button       →  Serialize all changes
                           →  Apply annotations to PDF
                           →  Apply form field values
                           →  Apply text edits
                           →  Flatten if requested
                           →  Compress if requested
                           →  File System Access API save
                               OR Download fallback
                           →  Clear modified flag
                           →  Update recent files
```

## State Store Schema

### documentStore

```typescript
{
  // Document State
  fileName: string | null;
  fileData: ArrayBuffer | null;
  pageCount: number;
  currentPage: number;
  zoom: number;                    // 10-400
  viewMode: 'single' | 'continuous' | 'spread';
  rotation: number;                // 0, 90, 180, 270
  isModified: boolean;
  isLoading: boolean;
  error: string | null;

  // Metadata
  documentInfo: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };

  // Outline
  outline: OutlineItem[];
}
```

### annotationStore

```typescript
{
  annotations: Annotation[];
  selectedId: string | null;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeOpacity: number;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough' |
        'note' | 'drawing' | 'shape' | 'stamp';
  pageIndex: number;
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  content?: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  replies?: AnnotationReply[];
}
```

### historyStore

```typescript
{
  past: HistoryEntry[];      // Undo stack
  future: HistoryEntry[];    // Redo stack
  maxHistory: number;        // Default: 50
}

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  undo: () => void;
  redo: () => void;
}
```

### uiStore

```typescript
{
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeDialog: string | null;
  darkMode: boolean;
  activeTool: string;
}
```

### settingsStore

```typescript
{
  // Viewing
  defaultZoom: number;
  defaultViewMode: 'single' | 'continuous' | 'spread';
  smoothScrolling: boolean;

  // Editing
  autoSave: boolean;
  autoSaveInterval: number;

  // Annotations
  defaultHighlightColor: string;
  defaultAnnotationOpacity: number;

  // Signatures
  savedSignatures: Signature[];
}
```

## Persistence Layer

### IndexedDB Schema

```
Database: paperflow
├── recentFiles (indexed by lastOpened)
│   ├── id: string
│   ├── name: string
│   ├── size: number
│   ├── lastOpened: Date
│   └── thumbnail: string (base64)
│
├── documents
│   ├── id: string
│   └── data: ArrayBuffer
│
└── signatures
    ├── id: string
    ├── name: string
    ├── type: 'draw' | 'type' | 'image'
    ├── data: string (base64 or SVG)
    └── createdAt: Date
```

### LocalStorage Keys

```
paperflow-document    → { zoom, viewMode }
paperflow-ui          → { sidebarOpen, sidebarWidth, darkMode }
paperflow-settings    → { all settings }
```

## Event Flow Examples

### Highlight Text Flow

```
1. User selects text on page
   └─► Text layer captures selection
       └─► Calculate selection rectangles
           └─► Show annotation popup

2. User clicks "Highlight"
   └─► Create Annotation object
       └─► Add to annotationStore
           └─► Push to historyStore
               └─► Render highlight overlay
                   └─► Mark document modified
```

### Form Fill Flow

```
1. PDF.js parses form fields on load
   └─► Create FormField objects
       └─► Store in formStore

2. User clicks form field
   └─► Render input component at position
       └─► Focus input

3. User enters value
   └─► Update formStore
       └─► Push to historyStore
           └─► Mark document modified
```

### Page Reorder Flow

```
1. User drags thumbnail
   └─► Show drop indicator
       └─► Calculate new position

2. User drops thumbnail
   └─► Update page order in pdf-lib
       └─► Push to historyStore
           └─► Re-render thumbnails
               └─► Update current page if affected
                   └─► Mark document modified
```

## Coordinate Systems

### PDF Coordinates
- Origin: Bottom-left of page
- Units: Points (1/72 inch)
- Used by: pdf-lib, annotation storage

### Screen Coordinates
- Origin: Top-left of viewport
- Units: Pixels
- Used by: Mouse events, DOM positioning

### Transformation

```typescript
// PDF to Screen
screenX = (pdfX * scale) + offsetX;
screenY = ((pageHeight - pdfY) * scale) + offsetY;

// Screen to PDF
pdfX = (screenX - offsetX) / scale;
pdfY = pageHeight - ((screenY - offsetY) / scale);
```

## Error Handling Flow

```
Error Occurs                   System Response
─────────────────────────────────────────────────────────────
File Load Error            →  Show error toast
                           →  Clear loading state
                           →  Log to console (dev)

Render Error               →  Show placeholder
                           →  Retry with lower quality
                           →  Show error if retry fails

Save Error                 →  Show error dialog
                           →  Offer retry
                           →  Keep document state

Storage Error              →  Fallback to memory-only
                           →  Warn user about persistence
```
