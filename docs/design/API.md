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
