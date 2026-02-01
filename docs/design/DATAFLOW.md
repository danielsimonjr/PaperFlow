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

---

## Phase 2 Data Flows

### OCR Processing Flow

Optical Character Recognition converts scanned/image-based PDFs into searchable documents.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  PDF Page   │ ──► │   Canvas    │ ──► │    Image        │
│  (source)   │     │   Render    │     │  Preprocessing  │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Searchable  │ ◄── │ Text Layer  │ ◄── │  Tesseract.js   │
│    PDF      │     │  Embedding  │     │  (OCR Engine)   │
└─────────────┘     └─────────────┘     └─────────────────┘
```

```
OCR Process                    System Response
─────────────────────────────────────────────────────────────
User initiates OCR         →  Identify pages needing OCR
                           →  Render page to high-res canvas
                           →  Apply image preprocessing
                               ├─ Deskew rotation
                               ├─ Contrast normalization
                               └─ Noise reduction
                           →  Send to Tesseract.js worker
                           →  Receive OCR results (text + positions)
                           →  Generate invisible text layer
                           →  Embed text layer in PDF
                           →  Update search index
                           →  Mark document modified
```

### Redaction Flow

Secure removal of sensitive information with audit trail support.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Pattern   │ ──► │    Match    │ ──► │     Mark        │
│   Search    │     │  Detection  │     │   Creation      │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Audit Log  │ ◄── │ Verification│ ◄── │   User Review   │
│  (export)   │     │  (applied)  │     │   & Approval    │
└─────────────┘     └──────┬──────┘     └─────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Apply     │
                    │  Redaction  │
                    └─────────────┘
```

```
Redaction Process              System Response
─────────────────────────────────────────────────────────────
Define search pattern      →  Parse regex/text pattern
                           →  Search all pages for matches
                           →  Return match locations

Mark for redaction         →  Create redaction annotation
                           →  Show visual preview (strikethrough)
                           →  Store in redactionStore

User reviews marks         →  Display all pending redactions
                           →  Allow approve/reject per mark
                           →  Allow manual area selection

Apply redactions           →  Remove underlying content (permanent)
                           →  Fill areas with solid color
                           →  Remove from text layer
                           →  Update search index

Generate audit log         →  Record redaction locations
                           →  Record original text (if permitted)
                           →  Timestamp and user info
                           →  Export as JSON/PDF report
```

### Document Comparison Flow

Side-by-side comparison of two PDF documents with change highlighting.

```
┌─────────────┐     ┌─────────────┐
│ Document A  │     │ Document B  │
│   (load)    │     │   (load)    │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Extract   │     │   Extract   │
│    Text     │     │    Text     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
          ┌─────────────┐
          │    Diff     │
          │  Algorithm  │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐     ┌─────────────┐
          │   Change    │ ──► │   Report    │
          │  Detection  │     │   Export    │
          └─────────────┘     └─────────────┘
```

```
Comparison Process             System Response
─────────────────────────────────────────────────────────────
Load documents             →  Open both PDFs in memory
                           →  Validate page counts
                           →  Extract text from all pages

Run comparison             →  Normalize text (whitespace, encoding)
                           →  Execute diff algorithm
                           →  Identify additions (green)
                           →  Identify deletions (red)
                           →  Identify modifications (yellow)

Generate results           →  Create side-by-side view
                           →  Highlight changes inline
                           →  Calculate change statistics
                           →  Navigate between changes

Export report              →  Generate comparison summary
                           →  List all changes with page numbers
                           →  Export as PDF/HTML/JSON
```

### Batch Processing Flow

Apply operations to multiple documents or pages in sequence.

```
┌─────────────────────────────────────────────────────────────┐
│                    Batch Operation Queue                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Doc 1  │  │   Doc 2  │  │   Doc 3  │  │   ...    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼──────────────┼─────────────┼──────────┘
        │             │              │             │
        ▼             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Sequential Processor                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Apply Operation (watermark/header/footer/Bates/etc.)  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Progress Tracking                          │
│  [████████████████░░░░░░░░░░░░░░] 45% (3/7 documents)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Results   │
                    │   Summary   │
                    └─────────────┘
```

```
Batch Process                  System Response
─────────────────────────────────────────────────────────────
Queue operations           →  Validate all input files
                           →  Configure operation parameters
                               ├─ Watermark (text/image, position)
                               ├─ Header/Footer (content, font)
                               ├─ Bates numbering (prefix, start)
                               └─ Other transformations
                           →  Estimate processing time

Process sequentially       →  Load document into memory
                           →  Apply configured operation
                           →  Save modified document
                           →  Update progress bar
                           →  Move to next document

Track progress             →  Display current document
                           →  Show completion percentage
                           →  Log any errors per document
                           →  Allow cancel/pause

Report results             →  Summary of processed files
                           →  List of successes/failures
                           →  Error details for failures
                           →  Total processing time
```

### Accessibility Check Flow

Validate PDF accessibility compliance (WCAG/PDF/UA standards).

```
┌─────────────┐
│    PDF      │
│  Analysis   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Run Accessibility Checks                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Tag    │  │ Contrast │  │ Alt Text │  │ Reading  │    │
│  │Structure │  │  Check   │  │  Check   │  │  Order   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼──────────────┼─────────────┼──────────┘
        │             │              │             │
        └─────────────┴──────────────┴─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Generate   │
                    │   Issues    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Create    │
                    │   Report    │
                    └─────────────┘
```

```
Accessibility Check            System Response
─────────────────────────────────────────────────────────────
Analyze PDF structure      →  Parse document tag tree
                           →  Identify content types
                           →  Map reading order

Run checks                 →  Tag Structure:
                               ├─ Verify document tagged
                               ├─ Check heading hierarchy
                               └─ Validate list structure
                           →  Contrast Check:
                               ├─ Extract text/background colors
                               ├─ Calculate contrast ratios
                               └─ Flag WCAG violations
                           →  Alt Text Check:
                               ├─ Find all images
                               ├─ Verify alt text presence
                               └─ Flag decorative images
                           →  Reading Order:
                               ├─ Verify logical sequence
                               ├─ Check table structure
                               └─ Validate form labels

Generate issues            →  Categorize by severity (error/warning)
                           →  Include page number and location
                           →  Provide remediation guidance

Create report              →  Summary statistics
                           →  Detailed issue list
                           →  Export as PDF/HTML/JSON
                           →  Compliance score
```

### Form Actions Flow

Dynamic form behavior triggered by user interactions.

```
┌─────────────────────────────────────────────────────────────┐
│                    Trigger Events                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ onClick  │  │ onChange │  │  onBlur  │  │ onFocus  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼──────────────┼─────────────┼──────────┘
        │             │              │             │
        └─────────────┴──────────────┴─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Evaluate   │
                    │ Conditions  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Execute   │
                    │   Actions   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Update    │
                    │ Field State │
                    └─────────────┘
```

```
Form Action Process            System Response
─────────────────────────────────────────────────────────────
Trigger event              →  User interacts with form field
                           →  Capture event type and value
                           →  Look up registered actions

Evaluate conditions        →  Parse condition expressions
                               ├─ Field value comparisons
                               ├─ Logical operators (AND/OR)
                               └─ Function calls
                           →  Determine if conditions met

Execute actions            →  Available action types:
                               ├─ Show/Hide field
                               ├─ Enable/Disable field
                               ├─ Set field value
                               ├─ Calculate value
                               ├─ Validate input
                               ├─ Submit form data
                               └─ Custom JavaScript
                           →  Execute in defined order

Update field state         →  Apply state changes to formStore
                           →  Re-render affected fields
                           →  Trigger dependent actions
                           →  Push to historyStore if value changed
```

### Form Actions State Schema

```typescript
interface FormAction {
  id: string;
  fieldId: string;
  trigger: 'onClick' | 'onChange' | 'onBlur' | 'onFocus' | 'onLoad';
  conditions: ActionCondition[];
  actions: ActionDefinition[];
}

interface ActionCondition {
  type: 'fieldValue' | 'expression';
  fieldId?: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  value: string | number | boolean;
  logic?: 'AND' | 'OR';
}

interface ActionDefinition {
  type: 'show' | 'hide' | 'enable' | 'disable' |
        'setValue' | 'calculate' | 'validate' | 'submit';
  targetFieldId?: string;
  value?: string | number;
  formula?: string;
  validationRule?: string;
  errorMessage?: string;
}
```
