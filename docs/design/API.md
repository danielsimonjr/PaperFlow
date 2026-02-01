# PaperFlow API Reference

## Overview

PaperFlow is primarily a client-side application. This document covers:
1. Internal JavaScript APIs (stores, hooks, utilities)
2. Future Cloud API endpoints (Phase 3)

---

## Internal APIs

### Zustand Stores

#### documentStore

```typescript
import { useDocumentStore } from '@stores/documentStore';

// State
interface DocumentState {
  fileName: string | null;
  fileData: ArrayBuffer | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
}

// Actions
loadDocument(file: File): Promise<void>
loadFromUrl(url: string): Promise<void>
setCurrentPage(page: number): void
nextPage(): void
prevPage(): void
setZoom(zoom: number): void
zoomIn(): void
zoomOut(): void
setViewMode(mode: ViewMode): void
setModified(modified: boolean): void
closeDocument(): void

// Usage
const { fileName, currentPage, nextPage } = useDocumentStore();
```

#### annotationStore

```typescript
import { useAnnotationStore } from '@stores/annotationStore';

// State
interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeOpacity: number;
}

// Actions
addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): string
updateAnnotation(id: string, updates: Partial<Annotation>): void
deleteAnnotation(id: string): void
selectAnnotation(id: string | null): void
setActiveTool(tool: AnnotationType | null): void
setActiveColor(color: string): void
setActiveOpacity(opacity: number): void
addReply(annotationId: string, content: string, author: string): void
getPageAnnotations(pageIndex: number): Annotation[]
exportAnnotations(): string
importAnnotations(json: string): void
clearAnnotations(): void
```

#### historyStore

```typescript
import { useHistoryStore } from '@stores/historyStore';

// Actions
push(entry: { action: string; undo: () => void; redo: () => void }): void
undo(): void
redo(): void
canUndo(): boolean
canRedo(): boolean
clear(): void
```

#### uiStore

```typescript
import { useUIStore } from '@stores/uiStore';

// State
interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeDialog: string | null;
  darkMode: boolean;
}

// Actions
toggleSidebar(): void
setSidebarWidth(width: number): void
openDialog(dialogId: string): void
closeDialog(): void
toggleDarkMode(): void
setDarkMode(dark: boolean): void
```

#### settingsStore

```typescript
import { useSettingsStore } from '@stores/settingsStore';

// State
interface SettingsState {
  defaultZoom: number;
  defaultViewMode: ViewMode;
  smoothScrolling: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultHighlightColor: string;
  defaultAnnotationOpacity: number;
  savedSignatures: string[];
}

// Actions
setDefaultZoom(zoom: number): void
setDefaultViewMode(mode: ViewMode): void
setSmoothScrolling(enabled: boolean): void
setAutoSave(enabled: boolean): void
setAutoSaveInterval(seconds: number): void
setDefaultHighlightColor(color: string): void
setDefaultAnnotationOpacity(opacity: number): void
addSignature(signature: string): void
removeSignature(index: number): void
resetToDefaults(): void
```

---

### PDF Renderer API

```typescript
import { PDFRenderer } from '@lib/pdf/renderer';

const renderer = new PDFRenderer();

// Load document
await renderer.loadDocument(source: ArrayBuffer | string): Promise<PDFDocumentInfo>

// Render page to canvas
await renderer.renderPage(
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale?: number
): Promise<void>

// Get page information
await renderer.getPageInfo(pageNumber: number): Promise<PDFPageInfo>

// Get text content
await renderer.getTextContent(pageNumber: number): Promise<string>

// Get document outline
await renderer.getOutline(): Promise<PDFOutlineItem[]>

// Get page count
renderer.getPageCount(): number

// Cleanup
renderer.destroy(): void
```

---

### IndexedDB Storage API

```typescript
import { storage } from '@lib/storage/indexeddb';

// Initialize
await storage.init(): Promise<void>

// Recent Files
await storage.addRecentFile(file: RecentFile): Promise<void>
await storage.getRecentFiles(limit?: number): Promise<RecentFile[]>
await storage.removeRecentFile(id: string): Promise<void>

// Documents
await storage.saveDocument(id: string, data: ArrayBuffer): Promise<void>
await storage.getDocument(id: string): Promise<ArrayBuffer | null>

// Clear all data
await storage.clearAll(): Promise<void>
```

---

### Custom Hooks

#### usePDF

```typescript
import { usePDF } from '@hooks/usePDF';

const {
  document,        // PDFDocumentProxy
  isLoading,       // boolean
  error,           // Error | null
  loadFile,        // (file: File) => Promise<void>
  loadUrl,         // (url: string) => Promise<void>
  renderPage,      // (pageNum: number, canvas: HTMLCanvasElement) => Promise<void>
  getTextContent,  // (pageNum: number) => Promise<string>
} = usePDF();
```

#### useAnnotations

```typescript
import { useAnnotations } from '@hooks/useAnnotations';

const {
  annotations,     // Annotation[]
  selectedId,      // string | null
  addHighlight,    // (rects: Rect[], color: string) => string
  addNote,         // (position: Point, content: string) => string
  addDrawing,      // (paths: Path[]) => string
  deleteSelected,  // () => void
  updateSelected,  // (updates: Partial<Annotation>) => void
} = useAnnotations(pageIndex: number);
```

#### useUndoRedo

```typescript
import { useUndoRedo } from '@hooks/useUndoRedo';

const {
  canUndo,    // boolean
  canRedo,    // boolean
  undo,       // () => void
  redo,       // () => void
  push,       // (action: string, undo: () => void, redo: () => void) => void
} = useUndoRedo();
```

#### useKeyboardShortcuts

```typescript
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';

useKeyboardShortcuts({
  'file.open': () => openFilePicker(),
  'file.save': () => saveDocument(),
  'edit.undo': () => undo(),
  'edit.redo': () => redo(),
  'nav.nextPage': () => nextPage(),
  'nav.prevPage': () => prevPage(),
  'zoom.in': () => zoomIn(),
  'zoom.out': () => zoomOut(),
});
```

#### useOffline

```typescript
import { useOffline } from '@hooks/useOffline';

const {
  isOnline,      // boolean
  isOffline,     // boolean
} = useOffline();
```

#### useFileSystem

```typescript
import { useFileSystem } from '@hooks/useFileSystem';

const {
  openFile,      // () => Promise<File | null>
  saveFile,      // (data: Blob, suggestedName?: string) => Promise<void>
  saveAs,        // (data: Blob, suggestedName?: string) => Promise<void>
  hasNativeFS,   // boolean (File System Access API support)
} = useFileSystem();
```

---

## Type Definitions

### Annotation Types

```typescript
type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'drawing'
  | 'shape'
  | 'stamp';

interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Annotation {
  id: string;
  type: AnnotationType;
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

interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}
```

### Form Types

```typescript
type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'date';

interface FormField {
  id: string;
  pageIndex: number;
  type: FormFieldType;
  name: string;
  bounds: AnnotationRect;
  value: string | boolean;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
}
```

### PDF Types

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

interface PDFOutlineItem {
  title: string;
  pageNumber: number;
  children?: PDFOutlineItem[];
}

type ViewMode = 'single' | 'continuous' | 'spread';
```

---

## Future Cloud API (Phase 3)

### Authentication

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Documents

```
GET    /api/documents                 # List user documents
POST   /api/documents                 # Upload document
GET    /api/documents/:id             # Get document metadata
GET    /api/documents/:id/download    # Download document
PUT    /api/documents/:id             # Update document
DELETE /api/documents/:id             # Delete document
```

### Collaboration

```
GET    /api/documents/:id/collaborators    # List collaborators
POST   /api/documents/:id/collaborators    # Add collaborator
DELETE /api/documents/:id/collaborators/:userId

WebSocket /ws/documents/:id                # Real-time sync
```

### Annotations (Cloud Sync)

```
GET    /api/documents/:id/annotations
POST   /api/documents/:id/annotations
PUT    /api/documents/:id/annotations/:annotationId
DELETE /api/documents/:id/annotations/:annotationId
```

### Form Data

```
GET    /api/documents/:id/form-data
PUT    /api/documents/:id/form-data
POST   /api/documents/:id/form-data/export   # Export to FDF/XFDF
```

---

## Phase 2 APIs

### OCR API (`lib/ocr/`)

The OCR API provides client-side optical character recognition using Tesseract.js.

```typescript
import { OCREngine, batchOCR, preprocessImage, analyzeLayout } from '@lib/ocr';

// Initialize the OCR engine with a language
await OCREngine.initialize(language: string): Promise<void>
// Supported languages: 'eng', 'fra', 'deu', 'spa', 'chi_sim', etc.

// Run OCR on an image
const result = await OCREngine.recognize(
  image: ImageData | HTMLCanvasElement | Blob
): Promise<OCRResult>

// Run OCR on a PDF page canvas
const result = await OCREngine.recognizePage(
  canvas: HTMLCanvasElement
): Promise<OCRResult>

// Batch process multiple pages
const results = await batchOCR(
  pages: HTMLCanvasElement[],
  options?: BatchOCROptions,
  onProgress?: (progress: BatchProgress) => void
): Promise<OCRResult[]>

// Preprocess image for better OCR accuracy
const processed = preprocessImage(
  imageData: ImageData,
  options?: PreprocessOptions
): ImageData

// Analyze document layout from OCR results
const layout = analyzeLayout(ocrResult: OCRResult): LayoutAnalysis
```

#### OCR Types

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  lines: OCRLine[];
  paragraphs: OCRParagraph[];
}

interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

interface OCRLine {
  text: string;
  words: OCRWord[];
  bbox: BoundingBox;
}

interface OCRParagraph {
  text: string;
  lines: OCRLine[];
  bbox: BoundingBox;
}

interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface BatchOCROptions {
  language?: string;
  parallel?: number;
  preprocess?: boolean;
}

interface BatchProgress {
  current: number;
  total: number;
  pageIndex: number;
}

interface PreprocessOptions {
  grayscale?: boolean;
  threshold?: number;
  denoise?: boolean;
  deskew?: boolean;
}

interface LayoutAnalysis {
  columns: number;
  readingOrder: number[];
  tables: TableRegion[];
  images: ImageRegion[];
}
```

---

### Redaction API (`lib/redaction/`)

The Redaction API provides secure content removal with pattern matching and verification.

```typescript
import {
  searchPattern,
  createAreaMark,
  createTextMark,
  verifyRedactions,
  BUILT_IN_PATTERNS
} from '@lib/redaction';

// Find pattern matches in text
const matches = searchPattern(
  text: string,
  pattern: RegExp | string
): PatternMatch[]

// Create an area-based redaction mark
const mark = createAreaMark(
  pageIndex: number,
  bounds: RedactionBounds
): RedactionMark

// Create a text-based redaction mark
const mark = createTextMark(
  pageIndex: number,
  text: string,
  rects: AnnotationRect[]
): RedactionMark

// Verify redactions are complete and properly applied
const verification = verifyRedactions(
  marks: RedactionMark[]
): RedactionVerification

// Built-in patterns for common sensitive data
BUILT_IN_PATTERNS: {
  SSN: RegExp;           // Social Security Numbers (XXX-XX-XXXX)
  PHONE: RegExp;         // Phone numbers (various formats)
  EMAIL: RegExp;         // Email addresses
  CREDIT_CARD: RegExp;   // Credit card numbers
  DATE: RegExp;          // Date formats
  IP_ADDRESS: RegExp;    // IPv4 addresses
}
```

#### Redaction Types

```typescript
interface PatternMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  pattern: string;
}

interface RedactionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RedactionMark {
  id: string;
  pageIndex: number;
  type: 'area' | 'text';
  bounds?: RedactionBounds;
  text?: string;
  rects?: AnnotationRect[];
  color: string;
  createdAt: Date;
}

interface RedactionVerification {
  isValid: boolean;
  issues: RedactionIssue[];
  coverage: number;
}

interface RedactionIssue {
  markId: string;
  type: 'overlap' | 'incomplete' | 'invalid_bounds';
  message: string;
}
```

---

### Comparison API (`lib/comparison/`)

The Comparison API enables document comparison with diff generation and reporting.

```typescript
import {
  compareDocuments,
  diffText,
  generateReport,
  exportReport
} from '@lib/comparison';

// Compare two documents
const result = compareDocuments(
  doc1Text: string[],      // Array of page texts
  doc2Text: string[],      // Array of page texts
  doc1Info: DocumentInfo,
  doc2Info: DocumentInfo
): ComparisonResult

// Perform text diff between two strings
const diffs = diffText(
  text1: string,
  text2: string
): TextDiff[]

// Generate a comparison report
const report = generateReport(
  result: ComparisonResult
): ComparisonReport

// Export report in various formats
const exported = exportReport(
  report: ComparisonReport,
  format: 'text' | 'html' | 'json' | 'pdf'
): string | Blob
```

#### Comparison Types

```typescript
interface DocumentInfo {
  fileName: string;
  pageCount: number;
  modifiedDate?: Date;
}

interface ComparisonResult {
  doc1Info: DocumentInfo;
  doc2Info: DocumentInfo;
  pageComparisons: PageComparison[];
  summary: ComparisonSummary;
}

interface PageComparison {
  pageNumber: number;
  diffs: TextDiff[];
  similarity: number;
}

interface TextDiff {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  position: {
    line: number;
    column: number;
  };
}

interface ComparisonSummary {
  totalAdditions: number;
  totalDeletions: number;
  totalUnchanged: number;
  overallSimilarity: number;
  changedPages: number[];
}

interface ComparisonReport {
  title: string;
  generatedAt: Date;
  result: ComparisonResult;
  highlights: DiffHighlight[];
}

interface DiffHighlight {
  pageIndex: number;
  type: 'added' | 'removed';
  text: string;
  rects: AnnotationRect[];
}
```

---

### Batch API (`lib/batch/`)

The Batch API provides bulk document operations including watermarks, headers/footers, and Bates numbering.

```typescript
import {
  applyWatermark,
  applyHeaderFooter,
  applyBatesNumber,
  flattenPdf
} from '@lib/batch';

// Add watermark to PDF
const watermarkedPdf = await applyWatermark(
  pdf: PDFDocument,
  options: WatermarkOptions
): Promise<PDFDocument>

// Add headers and footers
const updatedPdf = await applyHeaderFooter(
  pdf: PDFDocument,
  options: HeaderFooterOptions
): Promise<PDFDocument>

// Apply Bates numbering
const numberedPdf = await applyBatesNumber(
  pdf: PDFDocument,
  options: BatesOptions
): Promise<PDFDocument>

// Flatten annotations and forms
const flattenedPdf = await flattenPdf(
  pdf: PDFDocument,
  options?: FlattenOptions
): Promise<PDFDocument>
```

#### Batch Types

```typescript
interface WatermarkOptions {
  text?: string;
  image?: Blob | ArrayBuffer;
  position: 'center' | 'diagonal' | 'tile' | 'custom';
  customPosition?: { x: number; y: number };
  opacity: number;
  fontSize?: number;
  fontColor?: string;
  rotation?: number;
  pages?: number[] | 'all' | 'odd' | 'even';
}

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
  fontSize: number;
  fontColor: string;
  margin: number;
  pages?: number[] | 'all' | 'odd' | 'even';
  // Placeholders: {page}, {pages}, {date}, {time}, {filename}
}

interface BatesOptions {
  prefix?: string;
  suffix?: string;
  startNumber: number;
  digits: number;
  position: 'top-left' | 'top-center' | 'top-right' |
            'bottom-left' | 'bottom-center' | 'bottom-right';
  fontSize: number;
  fontColor: string;
  pages?: number[] | 'all';
}

interface FlattenOptions {
  flattenAnnotations?: boolean;
  flattenForms?: boolean;
  flattenSignatures?: boolean;
  preserveAppearance?: boolean;
}
```

---

### Accessibility API (`lib/accessibility/`)

The Accessibility API provides PDF/UA compliance checking and WCAG contrast calculations.

```typescript
import {
  runAccessibilityCheck,
  calculateContrastRatio,
  checkDocumentStructure
} from '@lib/accessibility';

// Run full PDF/UA accessibility check
const results = await runAccessibilityCheck(
  pdf: PDFDocument
): Promise<AccessibilityReport>

// Calculate WCAG contrast ratio between foreground and background colors
const ratio = calculateContrastRatio(
  fg: string,   // Hex color (e.g., '#000000')
  bg: string    // Hex color (e.g., '#FFFFFF')
): number       // Returns ratio like 21 (for black on white)

// Check document tag structure
const structureCheck = await checkDocumentStructure(
  pdf: PDFDocument
): Promise<StructureCheckResult>
```

#### Accessibility Types

```typescript
interface AccessibilityReport {
  isCompliant: boolean;
  score: number;              // 0-100
  issues: AccessibilityIssue[];
  warnings: AccessibilityWarning[];
  passed: AccessibilityCheck[];
}

interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  category: AccessibilityCategory;
  message: string;
  pageIndex?: number;
  element?: string;
  wcagCriteria?: string;      // e.g., '1.4.3'
  remediation?: string;
}

interface AccessibilityWarning {
  id: string;
  category: AccessibilityCategory;
  message: string;
  pageIndex?: number;
}

interface AccessibilityCheck {
  id: string;
  category: AccessibilityCategory;
  description: string;
}

type AccessibilityCategory =
  | 'document-info'
  | 'tagged-content'
  | 'reading-order'
  | 'alternative-text'
  | 'color-contrast'
  | 'language'
  | 'navigation'
  | 'forms';

interface StructureCheckResult {
  hasTaggedContent: boolean;
  hasTitle: boolean;
  hasLanguage: boolean;
  tagTree: TagNode[];
  missingAltText: number;
  emptyTags: number;
  readingOrderIssues: number;
}

interface TagNode {
  type: string;
  children: TagNode[];
  hasAltText?: boolean;
  pageIndex?: number;
}
```

---

### Form Actions API (`lib/forms/`)

The Form Actions API enables creating and executing interactive form actions and scripts.

```typescript
import {
  createFormAction,
  executeAction,
  executeScript
} from '@lib/forms';

// Create a form action
const action = createFormAction(
  trigger: ActionTrigger,
  type: ActionType,
  options: ActionOptions
): FormAction

// Execute a form action
const result = await executeAction(
  action: FormAction,
  context: ActionContext
): Promise<ActionResult>

// Execute a form script (JavaScript)
const result = await executeScript(
  script: string,
  context: ActionContext
): Promise<ScriptResult>
```

#### Form Action Types

```typescript
type ActionTrigger =
  | 'mouse-up'
  | 'mouse-down'
  | 'mouse-enter'
  | 'mouse-exit'
  | 'focus'
  | 'blur'
  | 'keystroke'
  | 'format'
  | 'validate'
  | 'calculate';

type ActionType =
  | 'submit-form'
  | 'reset-form'
  | 'javascript'
  | 'go-to-page'
  | 'open-url'
  | 'show-hide'
  | 'set-value';

interface ActionOptions {
  // For submit-form
  url?: string;
  method?: 'GET' | 'POST';
  format?: 'FDF' | 'XFDF' | 'HTML' | 'PDF';
  fields?: string[];

  // For reset-form
  resetFields?: string[] | 'all';

  // For javascript
  script?: string;

  // For go-to-page
  pageNumber?: number;

  // For open-url
  targetUrl?: string;
  newWindow?: boolean;

  // For show-hide
  targetFields?: string[];
  visibility?: boolean;

  // For set-value
  targetField?: string;
  value?: string | boolean | number;
}

interface FormAction {
  id: string;
  trigger: ActionTrigger;
  type: ActionType;
  options: ActionOptions;
  enabled: boolean;
}

interface ActionContext {
  document: PDFDocument;
  currentField?: FormField;
  formData: Record<string, unknown>;
  event?: {
    value?: string;
    change?: string;
    selStart?: number;
    selEnd?: number;
  };
}

interface ActionResult {
  success: boolean;
  error?: string;
  changes?: FieldChange[];
}

interface FieldChange {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ScriptResult {
  success: boolean;
  returnValue?: unknown;
  error?: string;
  console: string[];
}
```
