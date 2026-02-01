# Phase 2: Advanced Features Development Plan

## Overview

Phase 2 spans 6 months (24 weeks) across 12 two-week sprints, delivering advanced PDF editing features that differentiate PaperFlow from basic alternatives and justify premium pricing.

### Milestones

| Month | Deliverables | Milestone |
|-------|--------------|-----------|
| 7-8 | OCR implementation, form creation basics | v1.5 Release |
| 9-10 | Redaction, comparison tools, batch processing | v2.0 Release |
| 11-12 | Advanced form features, PDF/UA accessibility checker | v2.5 Release |

### Success Criteria

| Metric | Target |
|--------|--------|
| OCR Accuracy (English) | ≥ 95% on clear documents |
| OCR Processing Speed | < 3 seconds per page |
| Form Designer Usability | Complete form in < 5 minutes |
| Redaction Verification | 100% content removal |
| Comparison Accuracy | Detect all text changes |
| Batch Processing | 100 pages in < 60 seconds |

### Sprint Overview

| Sprint | Focus Area | Weeks |
|--------|------------|-------|
| 1 | OCR Foundation & Tesseract.js Integration | 1-2 |
| 2 | OCR Processing UI & Multi-Language Support | 3-4 |
| 3 | Batch OCR & Layout Preservation | 5-6 |
| 4 | Form Designer Basics | 7-8 |
| 5 | Form Field Types & Properties | 9-10 |
| 6 | Redaction Tools | 11-12 |
| 7 | Document Comparison | 13-14 |
| 8 | Batch Processing Part 1 (Watermarks, Headers/Footers) | 15-16 |
| 9 | Advanced Form Features (Conditional Logic, Validation) | 17-18 |
| 10 | Batch Processing Part 2 (Bates Numbering, Flatten) | 19-20 |
| 11 | PDF/UA Accessibility Checker | 21-22 |
| 12 | Testing, QA & v2.5 Release | 23-24 |

### New Dependencies

```bash
# OCR
npm install tesseract.js

# Form Creation (may need additional)
# Uses existing pdf-lib for form field creation

# No additional major dependencies expected
```

---

## Sprint 1: OCR Foundation & Tesseract.js Integration

**Goal:** Set up Tesseract.js infrastructure and implement basic OCR functionality

**Milestone:** OCR Technical Foundation

### Tesseract.js Setup

- [ ] Install tesseract.js package
- [ ] Configure Web Worker for OCR processing
  - Offload OCR to worker thread
  - Progress reporting back to main thread
- [ ] Set up language data loading
  - Lazy load language files on demand
  - Cache downloaded language files in IndexedDB
  - Start with English (eng) as default
- [ ] Create OCR configuration options
  - Recognition mode (single block, sparse text, page)
  - Whitelist/blacklist characters
  - Page segmentation mode (PSM)

### OCR Library Module

- [ ] Create `lib/ocr/` directory structure
  ```
  lib/ocr/
  ├── ocrEngine.ts      # Tesseract.js wrapper
  ├── ocrWorker.ts      # Web Worker script
  ├── languageLoader.ts # Language file management
  ├── imagePreprocessor.ts # Image preparation
  └── types.ts          # OCR types
  ```
- [ ] Implement OCREngine class
  ```typescript
  class OCREngine {
    initialize(language: string): Promise<void>
    recognize(image: ImageData | Blob): Promise<OCRResult>
    recognizePage(pageCanvas: HTMLCanvasElement): Promise<OCRResult>
    setLanguage(language: string): Promise<void>
    terminate(): void
  }
  ```
- [ ] Define OCR result types
  ```typescript
  interface OCRResult {
    text: string;
    confidence: number;
    blocks: OCRBlock[];
    lines: OCRLine[];
    words: OCRWord[];
    processingTime: number;
  }

  interface OCRWord {
    text: string;
    confidence: number;
    bbox: BoundingBox;
    baseline: number;
  }
  ```

### Image Preprocessing

- [ ] Implement image preprocessing for better OCR accuracy
  - Grayscale conversion
  - Contrast enhancement
  - Deskewing (straighten rotated text)
  - Noise reduction
  - Binarization (threshold to black/white)
- [ ] Create preprocessing pipeline
  - Configurable preprocessing steps
  - Preview before/after preprocessing
- [ ] Handle different image sources
  - PDF page canvas
  - Uploaded image files
  - Scanned document detection

### OCR Store

- [ ] Create `stores/ocrStore.ts`
  ```typescript
  interface OCRState {
    isProcessing: boolean;
    progress: number;
    currentPage: number;
    totalPages: number;
    results: Map<number, OCRResult>;
    language: string;
    availableLanguages: string[];
    error: string | null;

    // Actions
    startOCR(pageNumbers: number[]): Promise<void>;
    cancelOCR(): void;
    setLanguage(lang: string): void;
    clearResults(): void;
  }
  ```

### Basic OCR Integration

- [ ] Add OCR button to toolbar
  - Icon: text recognition/scan icon
  - Tooltip: "Recognize Text (OCR)"
- [ ] Implement single-page OCR
  - Render page to canvas at 300 DPI
  - Run OCR on canvas
  - Display results
- [ ] Create OCR results overlay
  - Show recognized text over original page
  - Toggle between original and OCR view
  - Highlight low-confidence words

### Definition of Done

- [ ] Tesseract.js initializes successfully
- [ ] English language data loads and caches
- [ ] Single page OCR completes in < 5 seconds
- [ ] OCR results display with confidence scores
- [ ] Web Worker prevents UI blocking
- [ ] Image preprocessing improves accuracy
- [ ] Unit tests for OCR engine (80%+ coverage)

---

## Sprint 2: OCR Processing UI & Multi-Language Support

**Goal:** Build comprehensive OCR UI and add multi-language support

### OCR Dialog Component

- [ ] Create `components/ocr/OCRDialog.tsx`
  - Modal dialog for OCR operations
  - Page selection (current, range, all)
  - Language selection dropdown
  - Preprocessing options checkboxes
  - Start/Cancel buttons
- [ ] Add progress indicator
  - Overall progress bar
  - Current page indicator
  - Estimated time remaining
  - Cancel button during processing
- [ ] Create OCR settings panel
  - Default language preference
  - Auto-detect language option
  - Quality vs. speed toggle
  - Save settings to localStorage

### Multi-Language Support

- [ ] Implement language manager
  - List of 50+ supported languages
  - Language code to name mapping
  - Language file download on demand
  - Download progress indication
- [ ] Popular languages quick-access
  - English, Spanish, French, German, Chinese, Japanese, Korean
  - Arabic, Russian, Portuguese, Italian
  - Hindi, Thai, Vietnamese
- [ ] Language detection hints
  - Detect script type (Latin, CJK, Arabic, etc.)
  - Suggest likely languages
  - Multi-language document support

### OCR Results Panel

- [ ] Create `components/ocr/OCRResultsPanel.tsx`
  - Sidebar panel showing OCR text
  - Search within OCR results
  - Copy text to clipboard
  - Select and highlight words
- [ ] Confidence highlighting
  - Green: > 90% confidence
  - Yellow: 70-90% confidence
  - Red: < 70% confidence
- [ ] Manual correction interface
  - Click word to edit
  - Suggest alternatives
  - Mark as correct
- [ ] Export OCR text
  - Copy all text
  - Export to .txt file
  - Export with formatting preserved

### OCR to Searchable PDF

- [ ] Implement text layer embedding
  - Add invisible text layer over scanned pages
  - Position text to match original locations
  - Maintain word bounding boxes
- [ ] Create `lib/ocr/textLayerEmbed.ts`
  - Use pdf-lib to add text content
  - Preserve original image
  - Enable text selection in saved PDF
- [ ] Save OCR'd document
  - Option to flatten (merge text with image)
  - Option to keep editable layers
  - Preserve original quality

### OCR Keyboard Shortcuts

- [ ] Add shortcuts
  - `Ctrl/Cmd + Shift + O`: Open OCR dialog
  - `Escape`: Cancel OCR in progress

### Definition of Done

- [ ] OCR dialog is user-friendly and intuitive
- [ ] At least 20 languages available
- [ ] Language files download and cache correctly
- [ ] OCR results panel shows confidence levels
- [ ] Manual correction works
- [ ] Searchable PDF export works
- [ ] Text selection works on OCR'd documents

---

## Sprint 3: Batch OCR & Layout Preservation

**Goal:** Process multiple pages and preserve document layout

### Batch OCR Processing

- [ ] Implement batch OCR controller
  - Queue pages for processing
  - Process pages sequentially or in parallel (configurable)
  - Memory management for large documents
  - Resume interrupted batch
- [ ] Create batch progress UI
  - Grid view of page thumbnails
  - Status indicator per page (pending, processing, complete, error)
  - Overall progress statistics
  - Pause/Resume capability
- [ ] Error handling for batch
  - Skip failed pages, continue processing
  - Retry failed pages option
  - Error report summary

### Layout Preservation

- [ ] Implement layout analysis
  - Detect columns (single, double, multi-column)
  - Identify headers and footers
  - Recognize tables
  - Detect images and captions
- [ ] Create `lib/ocr/layoutAnalyzer.ts`
  ```typescript
  interface LayoutAnalysis {
    columns: Column[];
    tables: Table[];
    images: ImageRegion[];
    headers: TextRegion[];
    footers: TextRegion[];
    readingOrder: Region[];
  }
  ```
- [ ] Reading order detection
  - Left-to-right, top-to-bottom for Western
  - Right-to-left for Arabic/Hebrew
  - Top-to-bottom for vertical CJK
  - Multi-column flow

### Table Recognition

- [ ] Detect table structures
  - Identify grid lines
  - Cell boundary detection
  - Merge cells detection
- [ ] Extract table data
  - Cell content OCR
  - Row/column structure
  - Export to CSV option

### OCR Output Formats

- [ ] Plain text export
  - Preserve paragraph breaks
  - Maintain reading order
- [ ] Formatted text export
  - Basic formatting (bold, italic detected)
  - Preserve line breaks and spacing
- [ ] HTML export
  - Semantic structure
  - Tables as HTML tables
  - Images referenced
- [ ] hOCR format export
  - Standard OCR interchange format
  - Word-level bounding boxes
  - Confidence scores

### Performance Optimization

- [ ] Implement page rendering cache
  - Pre-render pages at OCR resolution
  - LRU cache for rendered pages
- [ ] Memory management
  - Dispose processed page data
  - Limit concurrent processing
  - Monitor memory usage
- [ ] Web Worker pool
  - Multiple workers for parallel OCR
  - Load balancing across workers

### Definition of Done

- [ ] Batch OCR processes 100 pages without crashing
- [ ] Layout analysis detects columns correctly
- [ ] Tables are recognized and extractable
- [ ] Reading order is correct for multi-column layouts
- [ ] Multiple export formats work
- [ ] Memory usage stays reasonable for large documents
- [ ] OCR speed: < 3 seconds per page average

---

## Sprint 4: Form Designer Basics

**Goal:** Create the foundation for drag-and-drop form field design

**Milestone:** v1.5 Release (end of Sprint 4)

### Form Designer Architecture

- [ ] Create `components/forms/designer/` directory
  ```
  components/forms/designer/
  ├── FormDesigner.tsx       # Main designer container
  ├── FieldPalette.tsx       # Draggable field types
  ├── DesignCanvas.tsx       # Drop target canvas
  ├── FieldProperties.tsx    # Property editor panel
  ├── FieldPreview.tsx       # Field preview renderer
  └── DesignerToolbar.tsx    # Designer-specific toolbar
  ```
- [ ] Create form designer store
  ```typescript
  interface FormDesignerState {
    isDesignMode: boolean;
    selectedFieldId: string | null;
    fields: FormFieldDefinition[];
    clipboard: FormFieldDefinition | null;
    snapToGrid: boolean;
    gridSize: number;

    // Actions
    addField(type: FieldType, position: Point): string;
    updateField(id: string, updates: Partial<FormFieldDefinition>): void;
    deleteField(id: string): void;
    duplicateField(id: string): string;
    selectField(id: string | null): void;
    copyField(): void;
    pasteField(): void;
  }
  ```

### Field Palette

- [ ] Create draggable field palette
  - Text Field (single line)
  - Text Area (multi-line)
  - Checkbox
  - Radio Button Group
  - Dropdown/Combo Box
  - Date Picker
  - Signature Field
  - Button (submit, reset, print)
- [ ] Field icons and labels
  - Clear visual representation
  - Tooltip with description
- [ ] Drag preview
  - Ghost element during drag
  - Snap to grid indicator

### Design Canvas

- [ ] Implement drop zone on PDF pages
  - Drag-and-drop field placement
  - Visual feedback on hover
  - Grid snapping (optional)
- [ ] Field positioning
  - Click and drag to move
  - Resize handles on selection
  - Multi-select with Shift+click
  - Keyboard nudge (arrow keys)
- [ ] Alignment guides
  - Show guides when aligning with other fields
  - Snap to guides
  - Distribute evenly option

### Field Selection & Manipulation

- [ ] Selection UI
  - Blue border on selected field
  - Resize handles at corners and edges
  - Rotation handle (optional)
- [ ] Multi-selection
  - Bounding box selection (drag to select)
  - Add to selection with Shift+click
  - Move multiple fields together
- [ ] Context menu
  - Cut, Copy, Paste, Delete
  - Bring to Front, Send to Back
  - Align options
  - Duplicate

### Field Properties Panel

- [ ] Common properties
  - Field name (identifier)
  - Tooltip text
  - Required checkbox
  - Read-only checkbox
  - Default value
- [ ] Appearance properties
  - Border color and width
  - Background color
  - Font family, size, color
  - Text alignment
- [ ] Position and size
  - X, Y coordinates
  - Width, Height
  - Lock aspect ratio

### Basic Field Types Implementation

- [ ] Text Field designer component
  - Max characters setting
  - Format mask option (phone, date, SSN)
  - Placeholder text
- [ ] Checkbox designer component
  - Check style (check, circle, cross, diamond)
  - Export value setting
- [ ] Radio Button designer component
  - Group name
  - Add/remove options
  - Default selection

### Form Preview Mode

- [ ] Toggle between design and preview mode
  - Preview shows field interaction
  - Test form filling in preview
  - Return to design mode to edit
- [ ] Preview toolbar
  - Clear form button
  - Print preview button
  - Exit preview button

### Definition of Done

- [ ] Fields can be dragged from palette to canvas
- [ ] Fields can be moved and resized
- [ ] Properties panel edits field attributes
- [ ] Multi-selection works
- [ ] Grid snapping works
- [ ] Preview mode allows testing
- [ ] Form saves to PDF with fields
- [ ] Unit tests for form designer store

---

## Sprint 5: Form Field Types & Properties

**Goal:** Implement all field types with full property configuration

### Advanced Field Types

- [ ] Dropdown/Combo Box
  - Add/remove options
  - Option values (display vs. export value)
  - Allow custom value option
  - Default selection
  - Sort options alphabetically
- [ ] Date Picker
  - Date format selection
  - Min/max date constraints
  - Calendar popup
  - Default to today option
- [ ] Signature Field
  - Required signature indicator
  - Clear signature button
  - Integration with existing signature system
  - Signature date auto-stamp
- [ ] List Box
  - Multi-select option
  - Scroll behavior
  - Option height

### Button Fields

- [ ] Submit Button
  - Submit URL (for web forms)
  - Submit format (FDF, XFDF, HTML)
  - Target (current window, new window)
- [ ] Reset Button
  - Reset scope (all fields, selected fields)
  - Confirmation option
- [ ] Print Button
  - Print options (current page, all pages)
- [ ] Custom Action Button
  - JavaScript action (advanced)
  - Named action (next page, previous page, etc.)

### Calculated Fields

- [ ] Create calculation builder
  - Field reference picker
  - Basic math operations (+, -, *, /)
  - Sum of multiple fields
  - Average, min, max
- [ ] Calculation formula editor
  - Visual formula builder
  - Direct formula input for advanced users
  - Validation of formula syntax
- [ ] Calculation triggers
  - Calculate on field change
  - Calculate on page open
  - Manual calculate button

### Field Validation

- [ ] Validation rules builder
  - Required field
  - Minimum/maximum length
  - Number range
  - Regular expression pattern
  - Custom error messages
- [ ] Built-in validation patterns
  - Email address
  - Phone number (multiple formats)
  - SSN (###-##-####)
  - ZIP code
  - Credit card number
- [ ] Validation UI
  - Real-time validation indicator
  - Error message display position
  - Focus on first error

### Field Tab Order

- [ ] Tab order editor
  - Visual tab order indicators
  - Drag to reorder
  - Auto-order by position
- [ ] Tab order preview
  - Step through fields in order
  - Highlight current field

### Field Formatting

- [ ] Number formatting
  - Decimal places
  - Thousands separator
  - Currency symbol
  - Negative number display
- [ ] Date formatting
  - Multiple format options
  - Locale-aware formatting
- [ ] Text casing
  - Uppercase
  - Lowercase
  - Title Case

### Form Actions

- [ ] Field actions
  - On focus
  - On blur
  - On change
  - On keystroke
- [ ] Built-in actions
  - Show/hide field
  - Set field value
  - Navigate to page
  - Open URL

### Definition of Done

- [ ] All field types fully configurable
- [ ] Calculated fields work correctly
- [ ] Validation rules enforce input
- [ ] Tab order is customizable
- [ ] Field formatting applies correctly
- [ ] Form exports with all settings to PDF

---

## Sprint 6: Redaction Tools

**Goal:** Implement true redaction with pattern search and verification

**Milestone:** v2.0 Release Start

### Redaction Infrastructure

- [ ] Create `lib/redaction/` directory
  ```
  lib/redaction/
  ├── redactionEngine.ts   # Core redaction logic
  ├── patternMatcher.ts    # Pattern detection
  ├── redactionApply.ts    # Apply redactions to PDF
  ├── redactionVerify.ts   # Verify redaction completeness
  └── types.ts             # Redaction types
  ```
- [ ] Define redaction types
  ```typescript
  interface RedactionMark {
    id: string;
    pageIndex: number;
    bounds: Rect;
    type: 'text' | 'area' | 'pattern';
    pattern?: string;
    overlayText?: string;
    overlayColor: string;
    status: 'marked' | 'applied';
  }
  ```

### Redaction Store

- [ ] Create `stores/redactionStore.ts`
  ```typescript
  interface RedactionState {
    marks: RedactionMark[];
    selectedMarkIds: string[];
    activePattern: string | null;
    overlayColor: string;
    overlayText: string;
    isApplied: boolean;

    // Actions
    addMark(mark: Omit<RedactionMark, 'id'>): string;
    removeMark(id: string): void;
    selectMarks(ids: string[]): void;
    setOverlayOptions(color: string, text?: string): void;
    applyRedactions(): Promise<void>;
    verifyRedactions(): Promise<VerificationResult>;
  }
  ```

### Manual Redaction Tool

- [ ] Create redaction drawing tool
  - Click and drag to mark area
  - Snap to text selection
  - Visual preview (semi-transparent overlay)
- [ ] Redaction mark appearance
  - Configurable fill color (default: black)
  - Optional overlay text ("REDACTED", custom)
  - Mark vs. applied visual distinction
- [ ] Redaction toolbar
  - Mark Area tool
  - Mark Selected Text tool
  - Search & Redact button
  - Apply Redactions button

### Text Selection Redaction

- [ ] Select text and mark for redaction
  - Right-click context menu option
  - Keyboard shortcut (Ctrl+Shift+R)
  - Multiple text selections at once
- [ ] Word-level redaction
  - Click word to mark
  - Double-click to select word
  - Shift+click for range

### Pattern-Based Redaction

- [ ] Create pattern search dialog
  - Built-in patterns dropdown
  - Custom regex input
  - Case sensitive option
  - Whole word option
- [ ] Built-in patterns
  - Social Security Numbers (###-##-####)
  - Phone numbers (multiple formats)
  - Email addresses
  - Credit card numbers
  - Dates (multiple formats)
  - US addresses
  - IP addresses
- [ ] Pattern preview
  - Show all matches before redacting
  - Select/deselect individual matches
  - Match count display
- [ ] Custom pattern builder
  - Visual regex builder (simple mode)
  - Direct regex input (advanced mode)
  - Test pattern on document

### Redaction Application

- [ ] Apply redactions permanently
  - Remove underlying content (not just cover)
  - Flatten affected pages
  - Update text content streams
  - Remove from search index
- [ ] Confirmation dialog
  - Warning about permanent action
  - List of redactions to apply
  - Preview option
- [ ] Batch application
  - Apply to current page
  - Apply to selected pages
  - Apply to entire document

### Redaction Verification

- [ ] Create verification tool
  - Scan applied redactions
  - Check for content behind redaction marks
  - Detect hidden text
  - Check metadata
- [ ] Verification report
  - Pass/Fail status
  - Details of any issues found
  - Suggestions for fixing
- [ ] Metadata scrubbing
  - Remove author, creation date, etc.
  - Remove document properties
  - Remove XMP metadata
  - Option to preserve selected metadata

### Audit Trail

- [ ] Redaction log
  - Timestamp of each redaction
  - User who marked/applied
  - Pattern used (if applicable)
  - Page and location
- [ ] Export audit trail
  - PDF attachment
  - Separate log file

### Definition of Done

- [ ] Manual area redaction works
- [ ] Text selection redaction works
- [ ] Pattern search finds all instances
- [ ] Redactions remove content (not just cover)
- [ ] Verification confirms clean redaction
- [ ] Metadata scrubbing option works
- [ ] Audit trail is generated
- [ ] No recoverable content after redaction

---

## Sprint 7: Document Comparison

**Goal:** Implement side-by-side and overlay document comparison

### Comparison Infrastructure

- [ ] Create `lib/comparison/` directory
  ```
  lib/comparison/
  ├── comparisonEngine.ts  # Core comparison logic
  ├── textDiff.ts          # Text-level diff
  ├── visualDiff.ts        # Visual overlay diff
  ├── reportGenerator.ts   # Comparison report
  └── types.ts             # Comparison types
  ```
- [ ] Define comparison types
  ```typescript
  interface ComparisonResult {
    document1: string;
    document2: string;
    pages: PageComparison[];
    summary: ComparisonSummary;
  }

  interface PageComparison {
    pageNumber: number;
    textChanges: TextChange[];
    visualChanges: VisualChange[];
    similarity: number; // 0-100%
  }

  interface TextChange {
    type: 'added' | 'removed' | 'modified';
    text: string;
    location: Rect;
    pageIndex: number;
  }
  ```

### Comparison Store

- [ ] Create `stores/comparisonStore.ts`
  - Two document slots (original, revised)
  - Comparison results
  - View mode (side-by-side, overlay, diff-only)
  - Navigation between changes

### Document Selection UI

- [ ] Create comparison dialog
  - Select first document (current or file picker)
  - Select second document (file picker)
  - Comparison options
- [ ] Comparison options
  - Compare text only
  - Compare visual appearance
  - Ignore whitespace
  - Ignore case
  - Page range selection

### Side-by-Side View

- [ ] Create `components/comparison/SideBySideView.tsx`
  - Two document panels
  - Synchronized scrolling
  - Synchronized zoom
  - Page alignment
- [ ] Change highlighting
  - Red background for removed text
  - Green background for added text
  - Yellow background for modified text
  - Line connectors between changes
- [ ] Navigation between changes
  - Previous/Next change buttons
  - Change summary sidebar
  - Jump to specific change

### Overlay View

- [ ] Create `components/comparison/OverlayView.tsx`
  - Single view with overlay
  - Toggle between documents
  - Diff highlight mode
- [ ] Visual difference display
  - Flicker/blink toggle between versions
  - Opacity slider for overlay
  - Difference only mode (show only changed areas)
- [ ] Color coding
  - Configurable colors for added/removed
  - High contrast mode

### Text-Level Comparison

- [ ] Implement text extraction for comparison
  - Extract text from both documents
  - Preserve structure and positions
- [ ] Diff algorithm
  - Character-level diff
  - Word-level diff
  - Line-level diff
  - Paragraph-level diff
- [ ] Change categorization
  - Text additions
  - Text deletions
  - Text modifications
  - Moved text

### Visual Comparison

- [ ] Pixel-level comparison
  - Render pages as images
  - Compare pixel differences
  - Threshold for "different" pixels
- [ ] Change region detection
  - Group changed pixels into regions
  - Filter noise (minor differences)
- [ ] Annotation comparison
  - Compare annotation differences
  - Highlight annotation changes

### Comparison Report

- [ ] Generate comparison report
  - Summary statistics
  - Page-by-page changes
  - Full text diff view
- [ ] Export formats
  - PDF report
  - HTML report
  - Plain text summary
- [ ] Report content
  - Document metadata comparison
  - Total changes count
  - Changes by type
  - Visual thumbnails of changed pages

### Definition of Done

- [ ] Two documents can be loaded for comparison
- [ ] Side-by-side view shows synchronized pages
- [ ] Text changes are highlighted
- [ ] Overlay view toggles between versions
- [ ] Navigation between changes works
- [ ] Comparison report generates correctly
- [ ] Performance: Compare 100-page documents in < 30 seconds

---

## Sprint 8: Batch Processing Part 1 (Watermarks, Headers/Footers)

**Goal:** Implement watermarking and header/footer functionality for batch operations

**Milestone:** v2.0 Release (end of Sprint 8)

### Batch Processing Infrastructure

- [ ] Create `lib/batch/` directory
  ```
  lib/batch/
  ├── batchProcessor.ts    # Core batch engine
  ├── watermark.ts         # Watermark operations
  ├── headerFooter.ts      # Header/footer operations
  ├── pageNumbers.ts       # Page numbering
  ├── types.ts             # Batch operation types
  └── templates.ts         # Predefined templates
  ```
- [ ] Create batch operation queue
  - Add operations to queue
  - Process sequentially or in parallel
  - Progress tracking
  - Cancel/pause/resume

### Batch Processing Store

- [ ] Create `stores/batchStore.ts`
  ```typescript
  interface BatchState {
    operations: BatchOperation[];
    isProcessing: boolean;
    progress: BatchProgress;
    results: BatchResult[];

    // Actions
    addOperation(op: BatchOperation): void;
    removeOperation(id: string): void;
    startBatch(): Promise<void>;
    cancelBatch(): void;
    clearQueue(): void;
  }
  ```

### Watermark Feature

- [ ] Create `components/batch/WatermarkDialog.tsx`
  - Text watermark tab
  - Image watermark tab
  - Preview panel
  - Apply options
- [ ] Text watermark options
  - Text content
  - Font family, size
  - Color and opacity
  - Rotation angle
  - Position (center, corners, tile)
- [ ] Image watermark options
  - Upload image (PNG, JPG, SVG)
  - Scale and position
  - Opacity control
  - Tile option
- [ ] Watermark placement
  - Page range (all, even, odd, custom)
  - Layer (over content, under content)
  - Margin from edges
- [ ] Watermark templates
  - DRAFT
  - CONFIDENTIAL
  - COPY
  - SAMPLE
  - Custom saved templates

### Watermark Implementation

- [ ] Create `lib/batch/watermark.ts`
  ```typescript
  interface WatermarkOptions {
    type: 'text' | 'image';
    content: string | ArrayBuffer;
    position: WatermarkPosition;
    opacity: number;
    rotation: number;
    scale: number;
    layer: 'over' | 'under';
    pages: PageRange;
  }

  function applyWatermark(pdf: PDFDocument, options: WatermarkOptions): Promise<PDFDocument>
  ```
- [ ] Text rendering with pdf-lib
  - Embed fonts for text watermarks
  - Calculate text dimensions
  - Position correctly for rotation
- [ ] Image embedding
  - Embed image in PDF
  - Scale proportionally
  - Handle transparency

### Header/Footer Feature

- [ ] Create `components/batch/HeaderFooterDialog.tsx`
  - Header section
  - Footer section
  - Preview panel
  - Variable insertion
- [ ] Header/Footer content
  - Left, center, right sections
  - Text content
  - Variable placeholders
- [ ] Available variables
  - `{{page}}` - Current page number
  - `{{total}}` - Total page count
  - `{{date}}` - Current date
  - `{{time}}` - Current time
  - `{{filename}}` - Document filename
  - `{{author}}` - Document author
- [ ] Styling options
  - Font family, size, color
  - Bold, italic, underline
  - Alignment per section
  - Margins from edge

### Header/Footer Implementation

- [ ] Create `lib/batch/headerFooter.ts`
  ```typescript
  interface HeaderFooterOptions {
    header?: {
      left?: string;
      center?: string;
      right?: string;
    };
    footer?: {
      left?: string;
      center?: string;
      right?: string;
    };
    font: FontConfig;
    margins: Margins;
    startPage: number;
    pages: PageRange;
  }
  ```
- [ ] Variable substitution
  - Parse variable placeholders
  - Replace with actual values
  - Handle formatting
- [ ] Page number formats
  - Arabic (1, 2, 3)
  - Roman (i, ii, iii or I, II, III)
  - Letters (a, b, c or A, B, C)
  - Custom format ("Page X of Y")

### Batch Processing UI

- [ ] Create batch processing panel
  - List of queued operations
  - Drag to reorder
  - Edit/remove operations
  - Start batch button
- [ ] Progress display
  - Overall progress bar
  - Current operation indicator
  - Estimated time remaining
  - Log output

### Definition of Done

- [ ] Text watermarks apply correctly
- [ ] Image watermarks apply correctly
- [ ] Watermark position options work
- [ ] Headers and footers render correctly
- [ ] Variables substitute properly
- [ ] Page numbering works with all formats
- [ ] Batch queue processes in order
- [ ] Progress tracking is accurate

---

## Sprint 9: Advanced Form Features (Conditional Logic, Validation)

**Goal:** Add conditional logic, advanced validation, and form scripting

### Conditional Logic

- [ ] Create condition builder UI
  - If/Then/Else visual builder
  - Field reference selector
  - Comparison operators
  - Logical operators (AND, OR, NOT)
- [ ] Condition types
  - Field value equals
  - Field value contains
  - Field is empty/not empty
  - Field value comparison (>, <, >=, <=)
  - Multiple conditions (AND/OR)
- [ ] Actions when condition is true
  - Show field
  - Hide field
  - Enable field
  - Disable field
  - Set field value
  - Make field required/optional
- [ ] Condition storage
  ```typescript
  interface FormCondition {
    id: string;
    trigger: 'onChange' | 'onFocus' | 'onBlur';
    sourceFieldId: string;
    conditions: ConditionGroup;
    actions: ConditionAction[];
  }
  ```

### Advanced Validation

- [ ] Create validation builder UI
  - Add multiple rules per field
  - Rule priority/order
  - Custom error messages
- [ ] Validation rule types
  - Required
  - Minimum/maximum length
  - Minimum/maximum value (numbers)
  - Pattern (regex)
  - Custom function
  - Cross-field validation (field A < field B)
- [ ] Validation timing
  - On blur (after leaving field)
  - On change (real-time)
  - On submit
  - Combination
- [ ] Validation feedback
  - Error message position (below, right, tooltip)
  - Error styling (red border, icon)
  - Success indicator (green check)

### Form Scripting

- [ ] JavaScript action support
  - Field-level scripts
  - Document-level scripts
  - Event handlers
- [ ] Script editor
  - Syntax highlighting
  - Auto-complete for field references
  - Validation before save
  - Error highlighting
- [ ] Available scripting API
  ```javascript
  // Field access
  this.getField('fieldName').value
  this.getField('fieldName').hidden = true

  // Calculations
  AFSimple_Calculate('SUM', ['field1', 'field2'])

  // Formatting
  AFNumber_Format(2, 0, 0, 0, '$', true)

  // Validation
  AFRange_Validate(true, 0, true, 100)
  ```
- [ ] Script templates
  - Sum fields
  - Validate date range
  - Show/hide based on selection
  - Auto-populate from other field

### Form Submit Actions

- [ ] Submit configuration
  - Submit URL
  - Submit format (FDF, XFDF, HTML, PDF)
  - Submit method (GET, POST)
  - Include empty fields option
- [ ] Pre-submit validation
  - Check all required fields
  - Run all validation rules
  - Show error summary
- [ ] Submit feedback
  - Success message
  - Error handling
  - Redirect option

### Form Import/Export Enhancement

- [ ] Form template export
  - Export empty form as template
  - Include all field definitions
  - Include validation rules
  - Include conditional logic
- [ ] Form template import
  - Import field definitions
  - Map to existing fields option
  - Merge or replace option
- [ ] Field data import
  - CSV import for dropdown options
  - JSON import for complex data
  - Excel import (future)

### Definition of Done

- [ ] Conditional logic shows/hides fields
- [ ] Conditions with AND/OR work
- [ ] Validation rules prevent invalid input
- [ ] Custom error messages display
- [ ] Cross-field validation works
- [ ] Script editor saves and runs scripts
- [ ] Form templates export and import
- [ ] Submit action configurable

---

## Sprint 10: Batch Processing Part 2 (Bates Numbering, Flatten)

**Goal:** Implement Bates numbering and document flattening for legal/compliance use

### Bates Numbering

- [ ] Create `components/batch/BatesNumberDialog.tsx`
  - Prefix configuration
  - Starting number
  - Number of digits
  - Suffix configuration
  - Position options
  - Preview
- [ ] Bates number format
  - Prefix (text): "ABC-" or "EX-"
  - Number: configurable digits (6-10)
  - Suffix (optional): "-001"
  - Full example: "ABC-000001-001"
- [ ] Position options
  - Header or footer
  - Left, center, right
  - All corners option
  - Custom X/Y position
- [ ] Font options
  - Font family
  - Font size
  - Color
- [ ] Page range
  - All pages
  - Selected pages
  - Even/odd pages
  - Custom range

### Bates Implementation

- [ ] Create `lib/batch/batesNumbering.ts`
  ```typescript
  interface BatesOptions {
    prefix: string;
    startNumber: number;
    digits: number;
    suffix: string;
    position: BatesPosition;
    font: FontConfig;
    pages: PageRange;
  }

  function applyBatesNumbers(
    pdf: PDFDocument,
    options: BatesOptions
  ): Promise<{ pdf: PDFDocument; lastNumber: number }>
  ```
- [ ] Multi-document Bates
  - Continue numbering across documents
  - Track last number used
  - Number assignment log

### Bates Numbering Log

- [ ] Generate Bates log
  - Document name
  - Page number
  - Bates number assigned
  - Timestamp
- [ ] Export log formats
  - CSV
  - PDF report
  - Excel (future)

### Document Flattening

- [ ] Create `components/batch/FlattenDialog.tsx`
  - What to flatten options
  - Preview before/after
  - Apply button
- [ ] Flatten options
  - Flatten annotations
  - Flatten form fields
  - Flatten signatures
  - Flatten layers
  - All of the above
- [ ] Flatten implementation
  - Burn annotations into content
  - Convert form fields to static text
  - Merge all layers
  - Remove interactive elements

### Flatten Implementation

- [ ] Create `lib/batch/flatten.ts`
  ```typescript
  interface FlattenOptions {
    annotations: boolean;
    formFields: boolean;
    signatures: boolean;
    layers: boolean;
    preserveAppearance: boolean;
  }

  function flattenDocument(
    pdf: PDFDocument,
    options: FlattenOptions
  ): Promise<PDFDocument>
  ```
- [ ] Annotation flattening
  - Render annotations to content stream
  - Remove annotation objects
  - Preserve visual appearance
- [ ] Form field flattening
  - Get field values
  - Render as static text
  - Remove field objects

### Batch Flatten

- [ ] Multi-document flattening
  - Process multiple files
  - Same options for all
  - Progress tracking
- [ ] Output options
  - Overwrite original
  - Create new file (suffix)
  - Output to folder

### Compliance Features

- [ ] PDF/A conversion check
  - Detect PDF/A compliance
  - Warn if flattening breaks compliance
- [ ] Audit trail preservation
  - Option to keep audit trail
  - Document modification history
- [ ] Digital signature handling
  - Warn about signature invalidation
  - Option to skip signed documents

### Definition of Done

- [ ] Bates numbers apply correctly
- [ ] Number format is configurable
- [ ] Multi-document numbering continues sequence
- [ ] Bates log generates correctly
- [ ] Annotations flatten to content
- [ ] Form fields flatten to static text
- [ ] Signatures flatten (with warning)
- [ ] Flattened documents render identically

---

## Sprint 11: PDF/UA Accessibility Checker

**Goal:** Implement accessibility checking for PDF/UA compliance

**Milestone:** v2.5 Release Start

### Accessibility Infrastructure

- [ ] Create `lib/accessibility/` directory
  ```
  lib/accessibility/
  ├── accessibilityChecker.ts  # Main checker
  ├── tagChecker.ts            # Structure tags
  ├── readingOrderChecker.ts   # Reading order
  ├── altTextChecker.ts        # Alternative text
  ├── contrastChecker.ts       # Color contrast
  ├── types.ts                 # Types
  └── rules/                   # Individual rules
      ├── documentTitle.ts
      ├── documentLanguage.ts
      ├── headingStructure.ts
      └── ... (more rules)
  ```
- [ ] Define accessibility types
  ```typescript
  interface AccessibilityIssue {
    id: string;
    rule: string;
    severity: 'error' | 'warning' | 'info';
    pageIndex?: number;
    element?: string;
    description: string;
    recommendation: string;
    wcagCriteria?: string;
  }

  interface AccessibilityReport {
    documentTitle: string;
    checkDate: Date;
    pdfUACompliant: boolean;
    issues: AccessibilityIssue[];
    passed: string[];
    score: number; // 0-100
  }
  ```

### Accessibility Store

- [ ] Create `stores/accessibilityStore.ts`
  ```typescript
  interface AccessibilityState {
    isChecking: boolean;
    report: AccessibilityReport | null;
    selectedIssue: string | null;

    // Actions
    runCheck(): Promise<void>;
    clearReport(): void;
    selectIssue(id: string): void;
  }
  ```

### Document Structure Checks

- [ ] Document title check
  - Has title metadata
  - Title is meaningful (not filename)
- [ ] Document language check
  - Language tag present
  - Valid language code
- [ ] Tagged PDF check
  - Document has structure tags
  - Tag tree is valid
- [ ] Heading structure check
  - Headings use proper tags (H1-H6)
  - Headings are in logical order
  - No skipped levels

### Content Checks

- [ ] Alternative text check
  - Images have alt text
  - Alt text is meaningful (not "image.jpg")
  - Decorative images marked appropriately
- [ ] Table structure check
  - Tables have headers
  - Headers use TH tags
  - Complex tables have scope attributes
  - Tables have summary/caption
- [ ] List structure check
  - Lists use proper L, LI tags
  - Nested lists are correct
- [ ] Link check
  - Links have descriptive text
  - Links indicate destination
  - No "click here" or "read more"

### Reading Order Check

- [ ] Content order analysis
  - Compare visual order to tag order
  - Detect multi-column issues
  - Detect header/footer placement
- [ ] Reading order visualization
  - Overlay showing reading order
  - Number each content block
  - Highlight out-of-order content

### Contrast Check

- [ ] Text contrast analysis
  - Calculate contrast ratios
  - Check against WCAG thresholds
  - Normal text: 4.5:1 minimum
  - Large text: 3:1 minimum
- [ ] Color-only information
  - Detect information conveyed by color only
  - Suggest alternatives

### Accessibility Checker UI

- [ ] Create `components/accessibility/AccessibilityPanel.tsx`
  - Run check button
  - Report display
  - Issue list
  - Issue details
- [ ] Issue list view
  - Group by severity
  - Group by type
  - Filter options
  - Sort options
- [ ] Issue detail view
  - Issue description
  - WCAG criterion reference
  - Recommendation
  - Navigate to element button
- [ ] Visual indicators
  - Highlight issues on page
  - Overlay for reading order
  - Contrast preview

### Accessibility Report

- [ ] Generate accessibility report
  - Executive summary
  - Compliance score
  - Issues by category
  - Detailed findings
  - Recommendations
- [ ] Export report
  - PDF format
  - HTML format
  - JSON format (for automation)
- [ ] Report customization
  - Include/exclude categories
  - Severity filtering
  - Add custom notes

### Quick Fixes (Where Possible)

- [ ] Auto-fix capabilities
  - Add document title from filename
  - Add document language tag
  - Mark decorative images
- [ ] Guided fixes
  - Step-by-step fix wizard
  - Alt text entry dialog
  - Table header marking

### Definition of Done

- [ ] All PDF/UA checks implemented
- [ ] Issues display with severity levels
- [ ] Navigation to issues works
- [ ] Reading order visualization works
- [ ] Contrast checker works
- [ ] Report generates correctly
- [ ] Export formats work
- [ ] Auto-fixes work where applicable

---

## Sprint 12: Testing, QA & v2.5 Release

**Goal:** Comprehensive testing and release preparation

**Milestone:** v2.5 Release

### Unit Testing

- [ ] OCR module tests (80%+ coverage)
  - OCREngine initialization
  - Text recognition accuracy
  - Language loading
  - Preprocessing functions
- [ ] Form designer tests
  - Field creation
  - Field manipulation
  - Property updates
  - Form export
- [ ] Redaction tests
  - Mark creation
  - Pattern matching
  - Content removal verification
- [ ] Comparison tests
  - Text diff accuracy
  - Change detection
  - Report generation
- [ ] Batch processing tests
  - Watermark application
  - Header/footer rendering
  - Bates numbering
  - Flattening
- [ ] Accessibility checker tests
  - Rule validation
  - Issue detection
  - Report accuracy

### Integration Testing

- [ ] OCR workflow
  - Load scanned PDF
  - Run OCR
  - Save searchable PDF
  - Verify text selection
- [ ] Form creation workflow
  - Create new form
  - Add various fields
  - Set validation
  - Export and fill
- [ ] Redaction workflow
  - Mark sensitive content
  - Apply redactions
  - Verify removal
  - Check metadata
- [ ] Batch processing workflow
  - Queue multiple operations
  - Process documents
  - Verify results

### E2E Testing

- [ ] Full OCR scenario
  - Upload scanned document
  - Select language
  - Run OCR
  - Review and correct
  - Save searchable PDF
- [ ] Form designer scenario
  - Open PDF
  - Enter design mode
  - Create form
  - Test in preview
  - Export and fill
- [ ] Redaction scenario
  - Open sensitive document
  - Search for patterns
  - Mark additional content
  - Apply and verify
- [ ] Comparison scenario
  - Load two versions
  - Compare
  - Navigate changes
  - Export report

### Performance Testing

- [ ] OCR performance
  - Single page: < 3 seconds
  - 10 pages: < 30 seconds
  - 100 pages: < 5 minutes
- [ ] Form designer performance
  - 100 fields: responsive
  - Form save: < 2 seconds
- [ ] Redaction performance
  - Pattern search: < 5 seconds
  - Apply redactions: < 2 seconds/page
- [ ] Batch processing performance
  - 100 pages watermark: < 60 seconds
  - 100 pages Bates: < 60 seconds
- [ ] Accessibility check performance
  - Full check: < 30 seconds
  - Large document (500 pages): < 3 minutes

### Cross-Browser Testing

- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Mobile browsers (iOS Safari, Android Chrome)

### Documentation Updates

- [ ] User guide updates
  - OCR feature documentation
  - Form designer guide
  - Redaction guide
  - Comparison guide
  - Batch processing guide
  - Accessibility checker guide
- [ ] API documentation (if applicable)
- [ ] Release notes

### Bug Fixes

- [ ] Address all critical bugs
- [ ] Address high-priority bugs
- [ ] Triage remaining bugs for future releases

### Release Checklist

- [ ] Version bump to 2.5.0
- [ ] Changelog updated
- [ ] Roadmap updated (Phase 2 complete)
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Rollback plan ready

### Definition of Done

- [ ] Unit test coverage ≥ 80%
- [ ] All integration tests pass
- [ ] E2E tests cover all new features
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Documentation updated
- [ ] v2.5.0 released

---

## Appendix: Technical Reference

### New Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open OCR dialog | `Ctrl/Cmd + Shift + O` |
| Toggle form design mode | `Ctrl/Cmd + Shift + F` |
| Open redaction tool | `Ctrl/Cmd + Shift + R` |
| Open comparison | `Ctrl/Cmd + Shift + C` |
| Open batch processing | `Ctrl/Cmd + Shift + B` |
| Run accessibility check | `Ctrl/Cmd + Shift + A` |

### File Structure Additions

```
src/
├── components/
│   ├── ocr/
│   │   ├── OCRDialog.tsx
│   │   ├── OCRResultsPanel.tsx
│   │   └── LanguageSelector.tsx
│   ├── forms/
│   │   └── designer/
│   │       ├── FormDesigner.tsx
│   │       ├── FieldPalette.tsx
│   │       └── FieldProperties.tsx
│   ├── redaction/
│   │   ├── RedactionToolbar.tsx
│   │   ├── PatternSearchDialog.tsx
│   │   └── RedactionVerify.tsx
│   ├── comparison/
│   │   ├── ComparisonDialog.tsx
│   │   ├── SideBySideView.tsx
│   │   └── OverlayView.tsx
│   ├── batch/
│   │   ├── BatchPanel.tsx
│   │   ├── WatermarkDialog.tsx
│   │   ├── HeaderFooterDialog.tsx
│   │   └── BatesNumberDialog.tsx
│   └── accessibility/
│       ├── AccessibilityPanel.tsx
│       ├── IssueList.tsx
│       └── AccessibilityReport.tsx
├── lib/
│   ├── ocr/
│   ├── redaction/
│   ├── comparison/
│   ├── batch/
│   └── accessibility/
└── stores/
    ├── ocrStore.ts
    ├── formDesignerStore.ts
    ├── redactionStore.ts
    ├── comparisonStore.ts
    ├── batchStore.ts
    └── accessibilityStore.ts
```

### Performance Targets

| Feature | Target |
|---------|--------|
| OCR per page | < 3 seconds |
| Form designer responsiveness | < 100ms interaction |
| Redaction application | < 2 seconds/page |
| Comparison (100 pages) | < 30 seconds |
| Batch watermark (100 pages) | < 60 seconds |
| Accessibility check | < 30 seconds |

### Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 100+ |
| Firefox | 100+ |
| Safari | 15+ |
| Edge | 100+ |
| iOS Safari | iOS 15+ |
| Android Chrome | Android 10+ |

### Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| tesseract.js | ^5.0.0 | Client-side OCR |

Note: Most features build on existing pdf-lib capabilities. Additional dependencies may be identified during implementation.
