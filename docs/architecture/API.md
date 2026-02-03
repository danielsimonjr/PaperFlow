# PaperFlow API Reference

> **Version:** 3.0.0
> **Last Updated:** 2026-02-03
> **License:** MIT

Complete API documentation for PaperFlow's public interfaces, Zustand stores, core libraries, and Electron IPC channels.

---

## Table of Contents

- [Overview](#overview)
- [Zustand Stores API (Core)](#zustand-stores-api-core)
  - [documentStore](#documentstore)
  - [annotationStore](#annotationstore)
  - [historyStore](#historystore)
  - [uiStore](#uistore)
  - [settingsStore](#settingsstore)
- [Zustand Stores API (Advanced)](#zustand-stores-api-advanced)
  - [formStore](#formstore)
  - [signatureStore](#signaturestore)
  - [ocrStore](#ocrstore)
- [Zustand Stores API (Desktop)](#zustand-stores-api-desktop)
  - [recentFilesStore](#recentfilesstore)
  - [updateStore](#updatestore)
  - [fileWatchStore](#filewatchstore)
- [Core Library APIs](#core-library-apis)
  - [lib/pdf/renderer](#libpdfrenderer)
  - [lib/pdf/saver](#libpdfsaver)
  - [lib/pages/](#libpages)
  - [lib/annotations/serializer](#libannotationsserializer)
- [Electron IPC Channels](#electron-ipc-channels)
  - [File Operations](#file-operations)
  - [Print Operations](#print-operations)
  - [Scanner Operations](#scanner-operations)
  - [Update Operations](#update-operations)
- [Types](#types)
  - [PDFDocument](#pdfdocument)
  - [Annotation](#annotation)
  - [FormField](#formfield)
  - [Signature](#signature)

---

## Overview

PaperFlow provides a layered API architecture:

```
+------------------------------------------+
|              React Components            |
+------------------------------------------+
|              Zustand Stores              |
+------------------------------------------+
|             Core Libraries               |
+------------------------------------------+
|    Electron IPC (Desktop only)           |
+------------------------------------------+
|      Native APIs / PDF.js / pdf-lib      |
+------------------------------------------+
```

### Import Patterns

```typescript
// Zustand stores
import { useDocumentStore } from '@stores/documentStore';
import { useAnnotationStore } from '@stores/annotationStore';

// Core libraries
import { PDFRenderer } from '@lib/pdf/renderer';
import { mergePdfs, splitByRange } from '@lib/pages';

// Types
import type { Annotation, PDFDocument, FormField } from '@/types';
```

---

## Zustand Stores API (Core)

### documentStore

Manages the currently loaded PDF document state, including rendering, navigation, and zoom controls.

**Import:**
```typescript
import { useDocumentStore } from '@stores/documentStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `fileName` | `string \| null` | Name of the loaded file |
| `fileData` | `ArrayBuffer \| null` | Raw PDF bytes |
| `documentInfo` | `PDFDocumentInfo \| null` | Metadata about the PDF |
| `pageCount` | `number` | Total number of pages |
| `currentPage` | `number` | Current page number (1-indexed) |
| `zoom` | `number` | Zoom level (10-400) |
| `viewMode` | `'single' \| 'continuous' \| 'spread'` | Page view mode |
| `isModified` | `boolean` | Whether document has unsaved changes |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message if any |
| `renderer` | `PDFRenderer \| null` | PDF.js renderer instance |

#### Methods

##### `loadDocument(file: File): Promise<void>`

Loads a PDF from a File object.

```typescript
const { loadDocument } = useDocumentStore();

// Load from file input
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    await loadDocument(file);
  }
};
```

**Parameters:**
- `file` - File object from file input or drag-drop

**Throws:** Sets `error` state if loading fails

---

##### `loadDocumentFromArrayBuffer(data: ArrayBuffer | Uint8Array, fileName: string): Promise<void>`

Loads a PDF from raw bytes.

```typescript
const { loadDocumentFromArrayBuffer } = useDocumentStore();

// Load from fetch response
const response = await fetch('/document.pdf');
const data = await response.arrayBuffer();
await loadDocumentFromArrayBuffer(data, 'document.pdf');
```

**Parameters:**
- `data` - PDF bytes as ArrayBuffer or Uint8Array
- `fileName` - Display name for the document

---

##### `setCurrentPage(page: number): void`

Navigates to a specific page.

```typescript
const { setCurrentPage, pageCount } = useDocumentStore();

// Go to page 5
setCurrentPage(5);

// Go to last page
setCurrentPage(pageCount);
```

**Parameters:**
- `page` - Page number (1-indexed, clamped to valid range)

---

##### `nextPage(): void`

Advances to the next page if available.

```typescript
const { nextPage, currentPage, pageCount } = useDocumentStore();

// Navigate forward
nextPage(); // currentPage becomes currentPage + 1 (max: pageCount)
```

---

##### `prevPage(): void`

Goes back to the previous page if available.

```typescript
const { prevPage, currentPage } = useDocumentStore();

// Navigate backward
prevPage(); // currentPage becomes currentPage - 1 (min: 1)
```

---

##### `setZoom(zoom: number): void`

Sets the zoom level directly.

```typescript
const { setZoom } = useDocumentStore();

// Set to 150%
setZoom(150);

// Zoom is clamped between 10 and 400
setZoom(500); // Actually sets to 400
```

**Parameters:**
- `zoom` - Zoom percentage (10-400)

---

##### `zoomIn(): void`

Increases zoom by 25%.

```typescript
const { zoomIn, zoom } = useDocumentStore();
zoomIn(); // zoom: 100 -> 125
```

---

##### `zoomOut(): void`

Decreases zoom by 25%.

```typescript
const { zoomOut, zoom } = useDocumentStore();
zoomOut(); // zoom: 100 -> 75
```

---

##### `resetZoom(): void`

Resets zoom to 100%.

```typescript
const { resetZoom } = useDocumentStore();
resetZoom(); // zoom -> 100
```

---

##### `setViewMode(mode: 'single' | 'continuous' | 'spread'): void`

Changes the page view mode.

```typescript
const { setViewMode } = useDocumentStore();

setViewMode('single');     // One page at a time
setViewMode('continuous'); // Scrollable pages
setViewMode('spread');     // Two pages side by side
```

---

##### `setModified(modified: boolean): void`

Marks the document as having unsaved changes.

```typescript
const { setModified } = useDocumentStore();

// Mark as modified after editing
setModified(true);

// Mark as saved
setModified(false);
```

---

##### `closeDocument(): void`

Closes the current document and resets state.

```typescript
const { closeDocument } = useDocumentStore();

// Clean up and reset
closeDocument();
```

---

### annotationStore

Manages PDF annotations including highlights, notes, drawings, shapes, and stamps.

**Import:**
```typescript
import { useAnnotationStore } from '@stores/annotationStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `annotations` | `Annotation[]` | All annotations |
| `selectedId` | `string \| null` | Currently selected annotation ID |
| `activeTool` | `AnnotationType \| null` | Active annotation tool |
| `activeColor` | `string` | Current annotation color |
| `activeOpacity` | `number` | Current opacity (0-1) |
| `activeStrokeWidth` | `number` | Drawing stroke width |
| `activeFillColor` | `string \| undefined` | Shape fill color |
| `activeShapeType` | `ShapeType` | Current shape type |
| `activeStampType` | `StampType` | Current stamp type |

#### Methods

##### `addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): string`

Creates a new annotation.

```typescript
const { addAnnotation } = useAnnotationStore();

// Add a highlight
const id = addAnnotation({
  type: 'highlight',
  pageIndex: 0,
  rects: [{ x: 100, y: 200, width: 150, height: 20 }],
  color: '#FFEB3B',
  opacity: 0.5,
  content: 'Important section',
});

console.log('Created annotation:', id);
```

**Parameters:**
- `annotation` - Annotation data without auto-generated fields

**Returns:** `string` - The generated annotation ID

---

##### `updateAnnotation(id: string, updates: Partial<Annotation>): void`

Updates an existing annotation.

```typescript
const { updateAnnotation } = useAnnotationStore();

// Change color
updateAnnotation('ann-123', { color: '#4CAF50' });

// Update content
updateAnnotation('ann-123', {
  content: 'Updated note text',
  opacity: 0.8
});
```

**Parameters:**
- `id` - Annotation ID to update
- `updates` - Partial annotation data to merge

---

##### `deleteAnnotation(id: string): void`

Removes an annotation.

```typescript
const { deleteAnnotation, selectedId } = useAnnotationStore();

// Delete selected annotation
if (selectedId) {
  deleteAnnotation(selectedId);
}
```

**Parameters:**
- `id` - Annotation ID to delete

---

##### `selectAnnotation(id: string | null): void`

Selects or deselects an annotation.

```typescript
const { selectAnnotation } = useAnnotationStore();

// Select an annotation
selectAnnotation('ann-123');

// Deselect
selectAnnotation(null);
```

---

##### `setActiveTool(tool: AnnotationType | null): void`

Sets the current annotation tool.

```typescript
const { setActiveTool } = useAnnotationStore();

setActiveTool('highlight');     // Highlight mode
setActiveTool('note');          // Sticky note mode
setActiveTool('drawing');       // Freehand drawing
setActiveTool('shape');         // Shape tool
setActiveTool('stamp');         // Stamp tool
setActiveTool(null);            // Selection mode
```

---

##### `addReply(annotationId: string, content: string, author: string): void`

Adds a reply to an annotation.

```typescript
const { addReply } = useAnnotationStore();

addReply('ann-123', 'I agree with this point.', 'Jane Doe');
```

---

##### `getPageAnnotations(pageIndex: number): Annotation[]`

Gets all annotations for a specific page.

```typescript
const { getPageAnnotations } = useAnnotationStore();

// Get annotations for page 1 (0-indexed)
const pageAnnotations = getPageAnnotations(0);
```

---

##### `exportAnnotations(): string`

Exports all annotations as JSON string.

```typescript
const { exportAnnotations } = useAnnotationStore();

const json = exportAnnotations();
// Download or save json string
```

**Returns:** `string` - JSON string of all annotations

---

##### `importAnnotations(json: string): void`

Imports annotations from JSON string.

```typescript
const { importAnnotations } = useAnnotationStore();

// Import from file content
importAnnotations(jsonString);
```

---

##### `clearAnnotations(): void`

Removes all annotations.

```typescript
const { clearAnnotations } = useAnnotationStore();
clearAnnotations();
```

---

### historyStore

Manages undo/redo functionality with a stack-based history system.

**Import:**
```typescript
import { useHistoryStore } from '@stores/historyStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `past` | `HistoryEntry[]` | Undo stack |
| `future` | `HistoryEntry[]` | Redo stack |
| `maxHistory` | `number` | Maximum history entries (default: 50) |

#### Methods

##### `push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void`

Adds a new history entry.

```typescript
const { push } = useHistoryStore();

// Record an action with undo/redo callbacks
push({
  action: 'Add annotation',
  undo: () => deleteAnnotation(id),
  redo: () => restoreAnnotation(savedAnnotation),
});
```

**Parameters:**
- `entry.action` - Description of the action
- `entry.undo` - Function to undo the action
- `entry.redo` - Function to redo the action

---

##### `undo(): void`

Undoes the last action.

```typescript
const { undo, canUndo } = useHistoryStore();

if (canUndo()) {
  undo();
}
```

---

##### `redo(): void`

Redoes the last undone action.

```typescript
const { redo, canRedo } = useHistoryStore();

if (canRedo()) {
  redo();
}
```

---

##### `canUndo(): boolean`

Checks if undo is available.

```typescript
const { canUndo } = useHistoryStore();
const undoEnabled = canUndo(); // true if past.length > 0
```

---

##### `canRedo(): boolean`

Checks if redo is available.

```typescript
const { canRedo } = useHistoryStore();
const redoEnabled = canRedo(); // true if future.length > 0
```

---

##### `clear(): void`

Clears all history.

```typescript
const { clear } = useHistoryStore();
clear(); // Empties both past and future stacks
```

---

### uiStore

Manages UI state including sidebar, dialogs, and theme.

**Import:**
```typescript
import { useUIStore } from '@stores/uiStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `sidebarOpen` | `boolean` | Sidebar visibility |
| `sidebarWidth` | `number` | Sidebar width in pixels (200-400) |
| `activeDialog` | `string \| null` | Currently open dialog ID |
| `darkMode` | `boolean` | Dark mode enabled |

#### Methods

##### `toggleSidebar(): void`

Toggles sidebar visibility.

```typescript
const { toggleSidebar, sidebarOpen } = useUIStore();
toggleSidebar(); // sidebarOpen: true -> false
```

---

##### `setSidebarWidth(width: number): void`

Sets sidebar width (clamped 200-400px).

```typescript
const { setSidebarWidth } = useUIStore();
setSidebarWidth(300);
```

---

##### `openDialog(dialogId: string): void`

Opens a dialog by ID.

```typescript
const { openDialog } = useUIStore();

openDialog('settings');
openDialog('export');
openDialog('print');
```

---

##### `closeDialog(): void`

Closes the current dialog.

```typescript
const { closeDialog } = useUIStore();
closeDialog();
```

---

##### `toggleDarkMode(): void`

Toggles dark mode and updates DOM.

```typescript
const { toggleDarkMode } = useUIStore();
toggleDarkMode(); // Also updates document.documentElement.classList
```

---

##### `setDarkMode(dark: boolean): void`

Sets dark mode explicitly.

```typescript
const { setDarkMode } = useUIStore();
setDarkMode(true);  // Enable dark mode
setDarkMode(false); // Disable dark mode
```

---

### settingsStore

Manages user preferences with persistence to localStorage.

**Import:**
```typescript
import { useSettingsStore } from '@stores/settingsStore';
```

#### State

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultZoom` | `number` | `100` | Default zoom level |
| `defaultViewMode` | `ViewMode` | `'single'` | Default view mode |
| `smoothScrolling` | `boolean` | `true` | Enable smooth scrolling |
| `autoSave` | `boolean` | `true` | Enable auto-save |
| `autoSaveInterval` | `number` | `30` | Auto-save interval (seconds) |
| `defaultHighlightColor` | `string` | `'#FFEB3B'` | Default highlight color |
| `defaultAnnotationOpacity` | `number` | `0.5` | Default annotation opacity |
| `formAutoAdvance` | `boolean` | `false` | Auto-advance to next form field |
| `formAutoSave` | `boolean` | `true` | Auto-save form progress |
| `minimizeToTray` | `boolean` | `false` | Minimize to system tray |
| `closeToTray` | `boolean` | `false` | Close to system tray |
| `notificationsEnabled` | `boolean` | `true` | Enable notifications |

#### Methods

##### `setDefaultZoom(zoom: number): void`

Sets default zoom level (10-400).

```typescript
const { setDefaultZoom } = useSettingsStore();
setDefaultZoom(125);
```

---

##### `setDefaultViewMode(mode: 'single' | 'continuous' | 'spread'): void`

Sets default view mode.

```typescript
const { setDefaultViewMode } = useSettingsStore();
setDefaultViewMode('continuous');
```

---

##### `setAutoSave(enabled: boolean): void`

Enables or disables auto-save.

```typescript
const { setAutoSave } = useSettingsStore();
setAutoSave(true);
```

---

##### `setAutoSaveInterval(seconds: number): void`

Sets auto-save interval (10-300 seconds).

```typescript
const { setAutoSaveInterval } = useSettingsStore();
setAutoSaveInterval(60); // Save every minute
```

---

##### `resetToDefaults(): void`

Resets all settings to defaults.

```typescript
const { resetToDefaults } = useSettingsStore();
resetToDefaults();
```

---

## Zustand Stores API (Advanced)

### formStore

Manages PDF form fields, values, and validation.

**Import:**
```typescript
import { useFormStore } from '@stores/formStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `fields` | `FormField[]` | All form fields |
| `fieldsByPage` | `Map<number, FormField[]>` | Fields grouped by page |
| `focusedFieldId` | `string \| null` | Currently focused field |
| `validationErrors` | `Map<string, string[]>` | Field validation errors |
| `isDirty` | `boolean` | Whether form has been modified |
| `isLoading` | `boolean` | Loading state |

#### Methods

##### `setFields(fields: FormField[]): void`

Sets form fields (called when document loads).

```typescript
const { setFields } = useFormStore();

// Set fields parsed from PDF
setFields(parsedFields);
```

---

##### `updateFieldValue(fieldId: string, value: unknown): void`

Updates a field's value.

```typescript
const { updateFieldValue } = useFormStore();

// Text field
updateFieldValue('field-name', 'John Doe');

// Checkbox
updateFieldValue('field-agree', true);

// Dropdown
updateFieldValue('field-country', 'US');
```

---

##### `setFocusedField(fieldId: string | null): void`

Sets the currently focused field.

```typescript
const { setFocusedField } = useFormStore();
setFocusedField('field-email');
```

---

##### `getFieldById(fieldId: string): FormField | undefined`

Gets a field by ID.

```typescript
const { getFieldById } = useFormStore();
const field = getFieldById('field-name');
```

---

##### `getFieldsForPage(pageIndex: number): FormField[]`

Gets all fields on a specific page.

```typescript
const { getFieldsForPage } = useFormStore();
const pageFields = getFieldsForPage(0); // First page
```

---

##### `getFormData(): Record<string, unknown>`

Exports form data as key-value pairs.

```typescript
const { getFormData } = useFormStore();

const data = getFormData();
// { "name": "John", "email": "john@example.com", ... }
```

---

##### `importFormData(data: Record<string, unknown>): void`

Imports form data from key-value pairs.

```typescript
const { importFormData } = useFormStore();

importFormData({
  name: 'Jane Doe',
  email: 'jane@example.com',
  agree: true,
});
```

---

##### `resetToDefaults(): void`

Resets all fields to original values.

```typescript
const { resetToDefaults } = useFormStore();
resetToDefaults();
```

---

##### `clearAllFields(): void`

Clears all field values.

```typescript
const { clearAllFields } = useFormStore();
clearAllFields();
```

---

### signatureStore

Manages saved signatures and signature placements on documents.

**Import:**
```typescript
import { useSignatureStore } from '@stores/signatureStore';
```

#### Types

```typescript
interface StoredSignature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string;           // Base64 encoded
  createdAt: Date;
  isDefault: boolean;
  isInitials: boolean;
}

interface PlacedSignature {
  id: string;
  signatureId: string;
  pageIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  signatureData: string;
  signatureType: 'draw' | 'type' | 'image';
  createdAt: Date;
}
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `signatures` | `StoredSignature[]` | Saved signatures |
| `defaultSignatureId` | `string \| null` | Default signature ID |
| `defaultInitialsId` | `string \| null` | Default initials ID |
| `placedSignatures` | `PlacedSignature[]` | Signatures placed on document |
| `selectedPlacedId` | `string \| null` | Selected placed signature |
| `isModalOpen` | `boolean` | Signature modal state |
| `isPlacingSignature` | `boolean` | Currently placing a signature |

#### Methods

##### `addSignature(signature: Omit<StoredSignature, 'id' | 'createdAt'>): string`

Saves a new signature (max 10 per type).

```typescript
const { addSignature } = useSignatureStore();

const id = addSignature({
  name: 'My Signature',
  type: 'draw',
  data: 'data:image/png;base64,...',
  isDefault: false,
  isInitials: false,
});
```

**Returns:** `string` - Signature ID (empty string if limit reached)

---

##### `placeSignature(signature: StoredSignature, pageIndex: number, position: { x: number; y: number }, size?: { width: number; height: number }): string`

Places a signature on the document.

```typescript
const { placeSignature, signatures } = useSignatureStore();

const placedId = placeSignature(
  signatures[0],
  0, // Page index
  { x: 200, y: 500 },
  { width: 200, height: 80 }
);
```

---

##### `updatePlacedSignature(id: string, updates: Partial<PlacedSignature>): void`

Updates a placed signature.

```typescript
const { updatePlacedSignature } = useSignatureStore();

// Move signature
updatePlacedSignature('placed-123', {
  position: { x: 250, y: 550 },
});

// Resize
updatePlacedSignature('placed-123', {
  size: { width: 180, height: 70 },
});
```

---

##### `deletePlacedSignature(id: string): void`

Removes a placed signature.

```typescript
const { deletePlacedSignature } = useSignatureStore();
deletePlacedSignature('placed-123');
```

---

##### `setDefaultSignature(id: string | null): void`

Sets the default signature.

```typescript
const { setDefaultSignature } = useSignatureStore();
setDefaultSignature('sig-456');
```

---

##### `getSignaturesOnly(): StoredSignature[]`

Gets signatures (excluding initials).

```typescript
const { getSignaturesOnly } = useSignatureStore();
const sigs = getSignaturesOnly();
```

---

##### `getInitialsOnly(): StoredSignature[]`

Gets initials (excluding full signatures).

```typescript
const { getInitialsOnly } = useSignatureStore();
const initials = getInitialsOnly();
```

---

### ocrStore

Manages OCR (Optical Character Recognition) processing state.

**Import:**
```typescript
import { useOCRStore } from '@stores/ocrStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `results` | `Map<number, OCRResult>` | OCR results by page index |
| `isProcessing` | `boolean` | OCR in progress |
| `progress` | `OCRProgress \| null` | Current progress |
| `currentPage` | `number` | Page being processed |
| `totalPages` | `number` | Total pages to process |
| `language` | `string` | OCR language code |
| `error` | `string \| null` | Error message |

#### Methods

##### `setLanguage(language: string): void`

Sets the OCR language.

```typescript
const { setLanguage } = useOCRStore();

setLanguage('eng');  // English
setLanguage('fra');  // French
setLanguage('deu');  // German
setLanguage('jpn');  // Japanese
```

---

##### `startProcessing(totalPages: number): void`

Initializes OCR processing state.

```typescript
const { startProcessing } = useOCRStore();
startProcessing(10); // Processing 10 pages
```

---

##### `addResult(pageIndex: number, result: OCRResult): void`

Adds OCR result for a page.

```typescript
const { addResult } = useOCRStore();

addResult(0, {
  text: 'Recognized text...',
  words: [{ text: 'Hello', confidence: 0.95, bounds: {...} }],
  confidence: 0.92,
});
```

---

##### `cancelOCR(): void`

Cancels ongoing OCR processing.

```typescript
const { cancelOCR } = useOCRStore();
cancelOCR();
```

---

##### `reset(): void`

Resets all OCR state.

```typescript
const { reset } = useOCRStore();
reset();
```

---

## Zustand Stores API (Desktop)

### recentFilesStore

Manages recently opened files in the Electron desktop app.

**Import:**
```typescript
import { useRecentFilesStore } from '@stores/recentFilesStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `recentFiles` | `RecentFile[]` | List of recent files |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |

#### Types

```typescript
interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
  size?: number;
  thumbnail?: string;
}
```

#### Methods

##### `loadRecentFiles(): Promise<void>`

Loads recent files from the system.

```typescript
const { loadRecentFiles } = useRecentFilesStore();

// Load on app startup
useEffect(() => {
  loadRecentFiles();
}, []);
```

---

##### `addRecentFile(filePath: string): Promise<void>`

Adds a file to recent files.

```typescript
const { addRecentFile } = useRecentFilesStore();

await addRecentFile('/path/to/document.pdf');
```

---

##### `removeRecentFile(filePath: string): Promise<void>`

Removes a file from recent files.

```typescript
const { removeRecentFile } = useRecentFilesStore();

await removeRecentFile('/path/to/old-document.pdf');
```

---

##### `clearRecentFiles(): Promise<void>`

Clears all recent files.

```typescript
const { clearRecentFiles } = useRecentFilesStore();
await clearRecentFiles();
```

---

##### `openRecentFile(file: RecentFile): Promise<void>`

Opens a recent file.

```typescript
const { openRecentFile, recentFiles } = useRecentFilesStore();

try {
  await openRecentFile(recentFiles[0]);
} catch (error) {
  // File may no longer exist
  console.error('Failed to open file:', error);
}
```

---

### updateStore

Manages auto-update state and settings for the desktop app.

**Import:**
```typescript
import { useUpdateStore } from '@stores/updateStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `state` | `UpdateState` | Current update state |
| `settings` | `UpdateSettings` | Update settings |
| `isNotificationVisible` | `boolean` | Update notification shown |
| `isProgressDialogVisible` | `boolean` | Download progress shown |
| `isCheckingManually` | `boolean` | Manual check in progress |

#### Types

```typescript
interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  downloadProgress?: UpdateDownloadProgress;
  error?: string;
}

interface UpdateSettings {
  autoUpdate: boolean;
  channel: 'stable' | 'beta' | 'alpha';
  checkFrequency: 'hourly' | 'daily' | 'weekly' | 'never';
  allowPrerelease: boolean;
  allowDowngrade: boolean;
}
```

#### Methods

##### `checkForUpdates(): Promise<void>`

Manually checks for updates.

```typescript
const { checkForUpdates, state } = useUpdateStore();

await checkForUpdates();

if (state.status === 'available') {
  console.log('Update available:', state.availableVersion);
}
```

---

##### `downloadUpdate(): Promise<void>`

Downloads an available update.

```typescript
const { downloadUpdate, state } = useUpdateStore();

if (state.status === 'available') {
  await downloadUpdate();
}
```

---

##### `installAndRestart(): void`

Installs downloaded update and restarts app.

```typescript
const { installAndRestart, state } = useUpdateStore();

if (state.status === 'downloaded') {
  installAndRestart();
}
```

---

##### `installLater(): Promise<void>`

Defers installation to next restart.

```typescript
const { installLater } = useUpdateStore();
await installLater();
```

---

##### `setChannel(channel: 'stable' | 'beta' | 'alpha'): void`

Sets the update channel.

```typescript
const { setChannel } = useUpdateStore();

setChannel('stable'); // Production releases
setChannel('beta');   // Beta releases
setChannel('alpha');  // Alpha/nightly releases
```

---

##### `setAutoUpdate(enabled: boolean): void`

Enables or disables automatic updates.

```typescript
const { setAutoUpdate } = useUpdateStore();
setAutoUpdate(true);
```

---

### fileWatchStore

Manages file watching for external changes detection.

**Import:**
```typescript
import { useFileWatchStore } from '@stores/fileWatchStore';
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `watchedFiles` | `Map<string, WatchedFile>` | Watched file status |
| `externalChanges` | `ExternalChange[]` | Detected changes |
| `settings` | `FileWatchSettings` | Watch settings |
| `isInitialized` | `boolean` | Watcher initialized |
| `isEnabled` | `boolean` | Watching enabled |

#### Types

```typescript
interface WatchedFile {
  path: string;
  status: 'watching' | 'changed' | 'deleted' | 'locked' | 'error';
  lastModified: number;
  changeCount: number;
  isLocked: boolean;
  pendingAction: 'reload' | 'ignore' | 'compare' | 'pending';
}

interface FileWatchSettings {
  enabled: boolean;
  autoReload: boolean;
  showNotifications: boolean;
  notificationStyle: 'banner' | 'dialog' | 'toast';
  defaultAction: 'reload' | 'ignore' | 'compare' | 'pending';
  checkInterval: number;
}
```

#### Methods

##### `watchFile(path: string): Promise<boolean>`

Starts watching a file for changes.

```typescript
const { watchFile } = useFileWatchStore();

const success = await watchFile('/path/to/document.pdf');
if (success) {
  console.log('Now watching file');
}
```

---

##### `unwatchFile(path: string): Promise<boolean>`

Stops watching a file.

```typescript
const { unwatchFile } = useFileWatchStore();
await unwatchFile('/path/to/document.pdf');
```

---

##### `unwatchAll(): Promise<void>`

Stops watching all files.

```typescript
const { unwatchAll } = useFileWatchStore();
await unwatchAll();
```

---

##### `getWatchedFile(path: string): WatchedFile | undefined`

Gets watch status for a file.

```typescript
const { getWatchedFile } = useFileWatchStore();

const status = getWatchedFile('/path/to/document.pdf');
if (status?.status === 'changed') {
  // File was modified externally
}
```

---

##### `getPendingChanges(): ExternalChange[]`

Gets undismissed external changes.

```typescript
const { getPendingChanges } = useFileWatchStore();

const changes = getPendingChanges();
if (changes.length > 0) {
  // Show reload prompt
}
```

---

##### `updateSettings(settings: Partial<FileWatchSettings>): void`

Updates watch settings.

```typescript
const { updateSettings } = useFileWatchStore();

updateSettings({
  autoReload: true,
  showNotifications: true,
});
```

---

## Core Library APIs

### lib/pdf/renderer

PDF rendering using PDF.js.

**Import:**
```typescript
import { PDFRenderer } from '@lib/pdf/renderer';
```

#### Class: PDFRenderer

##### `loadDocument(source: ArrayBuffer | string, password?: string): Promise<PDFDocumentInfo>`

Loads a PDF document.

```typescript
const renderer = new PDFRenderer();

// From ArrayBuffer
const info = await renderer.loadDocument(arrayBuffer);
console.log(`Loaded ${info.numPages} pages`);

// From URL
const info2 = await renderer.loadDocument('/documents/sample.pdf');

// Password-protected PDF
const info3 = await renderer.loadDocument(data, 'secret123');
```

**Parameters:**
- `source` - PDF data as ArrayBuffer or URL string
- `password` - Optional password for encrypted PDFs

**Returns:**
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
```

---

##### `renderPage(pageNumber: number, canvas: HTMLCanvasElement, scale?: number): Promise<RenderResult>`

Renders a page to a canvas.

```typescript
const renderer = new PDFRenderer();
await renderer.loadDocument(pdfData);

const canvas = document.createElement('canvas');
const result = await renderer.renderPage(1, canvas, 1.5);

console.log(`Rendered: ${result.width}x${result.height}`);
```

**Parameters:**
- `pageNumber` - Page number (1-indexed)
- `canvas` - Target canvas element
- `scale` - Scale factor (default: 1.0)

**Returns:**
```typescript
interface RenderResult {
  width: number;
  height: number;
}
```

---

##### `getPageInfo(pageNumber: number): Promise<PDFPageInfo>`

Gets page dimensions and rotation.

```typescript
const info = await renderer.getPageInfo(1);
console.log(`Page 1: ${info.width}x${info.height}, rotation: ${info.rotation}`);
```

**Returns:**
```typescript
interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}
```

---

##### `getTextContent(pageNumber: number): Promise<TextContent>`

Gets structured text content from a page.

```typescript
const textContent = await renderer.getTextContent(1);
// Returns PDF.js TextContent object
```

---

##### `getTextContentAsString(pageNumber: number): Promise<string>`

Gets page text as a plain string.

```typescript
const text = await renderer.getTextContentAsString(1);
console.log('Page text:', text);
```

---

##### `getOutline(): Promise<PDFOutlineItem[]>`

Gets the document outline (table of contents).

```typescript
const outline = await renderer.getOutline();
for (const item of outline) {
  console.log(`${item.title} -> Page ${item.pageNumber}`);
}
```

---

##### `cancelRender(pageNumber: number): void`

Cancels an ongoing render operation.

```typescript
renderer.cancelRender(1);
```

---

##### `destroy(): void`

Cleans up resources.

```typescript
renderer.destroy();
```

---

### lib/pdf/saver

PDF saving and modification using pdf-lib.

**Import:**
```typescript
import { savePdf, copyPdf, getPdfInfo } from '@lib/pdf/saver';
```

#### `savePdf(originalPdfBytes: ArrayBuffer, options?: SaveOptions): Promise<Uint8Array>`

Saves a PDF with modifications.

```typescript
const modifiedPdf = await savePdf(originalData, {
  preserveEditHistory: false,
  flattenAnnotations: true,
});

// Download the result
const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
```

**Parameters:**
- `originalPdfBytes` - Original PDF data
- `options.preserveEditHistory` - Keep edit history
- `options.flattenAnnotations` - Flatten annotations into content
- `options.linearize` - Linearize for web viewing

---

#### `copyPdf(originalPdfBytes: ArrayBuffer): Promise<Uint8Array>`

Creates an unmodified copy of a PDF.

```typescript
const copy = await copyPdf(originalData);
```

---

#### `getPdfInfo(pdfBytes: ArrayBuffer): Promise<PDFInfo>`

Gets PDF metadata.

```typescript
const info = await getPdfInfo(pdfData);
console.log(`Title: ${info.title}, Pages: ${info.pageCount}`);
```

---

### lib/pages/

Page manipulation operations.

**Import:**
```typescript
import {
  deletePage,
  deletePages,
  duplicatePage,
  rotatePage,
  rotatePages,
  insertBlankPage,
  reorderPages,
  movePage,
  movePages,
  mergePdfs,
  splitByRange,
  splitEveryNPages,
  splitBySize,
} from '@lib/pages';
```

#### `deletePage(pdfBytes: ArrayBuffer, pageIndex: number): Promise<Uint8Array>`

Deletes a single page.

```typescript
// Delete page 3 (0-indexed)
const result = await deletePage(pdfData, 2);
```

---

#### `deletePages(pdfBytes: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array>`

Deletes multiple pages.

```typescript
// Delete pages 2, 4, and 6
const result = await deletePages(pdfData, [1, 3, 5]);
```

---

#### `duplicatePage(pdfBytes: ArrayBuffer, pageIndex: number, insertAfter?: boolean): Promise<Uint8Array>`

Duplicates a page.

```typescript
// Duplicate page 1, insert after
const result = await duplicatePage(pdfData, 0, true);

// Duplicate page 1, insert before
const result2 = await duplicatePage(pdfData, 0, false);
```

---

#### `rotatePage(pdfBytes: ArrayBuffer, pageIndex: number, rotation: RotationAngle): Promise<Uint8Array>`

Rotates a single page.

```typescript
// Rotate page 1 by 90 degrees clockwise
const result = await rotatePage(pdfData, 0, 90);

// Rotate page 1 by 180 degrees
const result2 = await rotatePage(pdfData, 0, 180);
```

**Parameters:**
- `rotation` - `0 | 90 | 180 | 270` degrees

---

#### `rotatePages(pdfBytes: ArrayBuffer, pageIndices: number[], rotation: RotationAngle): Promise<Uint8Array>`

Rotates multiple pages.

```typescript
// Rotate pages 1-3 by 90 degrees
const result = await rotatePages(pdfData, [0, 1, 2], 90);
```

---

#### `insertBlankPage(pdfBytes: ArrayBuffer, insertIndex: number, size?: PageSize): Promise<Uint8Array>`

Inserts a blank page.

```typescript
// Insert at beginning with letter size
const result = await insertBlankPage(pdfData, 0, 'letter');

// Insert after page 5, matching adjacent page size
const result2 = await insertBlankPage(pdfData, 5, 'match');
```

**Parameters:**
- `size` - `'letter' | 'a4' | 'legal' | 'match'`

---

#### `reorderPages(pdfBytes: ArrayBuffer, newOrder: number[]): Promise<Uint8Array>`

Reorders all pages.

```typescript
// Original: [0, 1, 2, 3] -> New: [3, 0, 1, 2]
const result = await reorderPages(pdfData, [3, 0, 1, 2]);
```

---

#### `movePage(pdfBytes: ArrayBuffer, fromIndex: number, toIndex: number): Promise<Uint8Array>`

Moves a page to a new position.

```typescript
// Move page 1 to position 4
const result = await movePage(pdfData, 0, 3);
```

---

#### `mergePdfs(files: MergeFile[], onProgress?: MergeProgressCallback): Promise<Uint8Array>`

Merges multiple PDFs.

```typescript
const files = [
  { name: 'doc1.pdf', data: arrayBuffer1 },
  { name: 'doc2.pdf', data: arrayBuffer2 },
];

const merged = await mergePdfs(files, (progress) => {
  console.log(`Merging ${progress.currentFileName}: ${progress.percentComplete}%`);
});
```

---

#### `splitByRange(pdfBytes: ArrayBuffer, rangeStr: string, baseName?: string): Promise<SplitResult>`

Extracts pages by range.

```typescript
// Extract pages 1-5
const result = await splitByRange(pdfData, '1-5', 'document');
console.log(result.name); // "document_pages_1-5.pdf"

// Extract specific pages
const result2 = await splitByRange(pdfData, '1,3,5-7', 'document');
```

---

#### `splitEveryNPages(pdfBytes: ArrayBuffer, pagesPerFile: number, baseName?: string, onProgress?: SplitProgressCallback): Promise<SplitResult[]>`

Splits into files of N pages each.

```typescript
// Split into 5-page chunks
const results = await splitEveryNPages(pdfData, 5, 'chapter');
// Returns: [chapter_001.pdf, chapter_002.pdf, ...]
```

---

#### `splitBySize(pdfBytes: ArrayBuffer, maxSizeBytes: number, baseName?: string, onProgress?: SplitProgressCallback): Promise<SplitResult[]>`

Splits by maximum file size.

```typescript
// Split into files under 5MB
const results = await splitBySize(pdfData, 5 * 1024 * 1024, 'part');
```

---

### lib/annotations/serializer

Annotation import/export utilities.

**Import:**
```typescript
import {
  exportAnnotations,
  importAnnotations,
  serializeAnnotation,
  deserializeAnnotation,
  mergeAnnotations,
} from '@lib/annotations/serializer';
```

#### `exportAnnotations(annotations: Annotation[], documentName?: string): string`

Exports annotations to JSON.

```typescript
const json = exportAnnotations(annotations, 'my-document.pdf');

// Save to file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
```

**Returns:** JSON string with format:
```json
{
  "version": 1,
  "exportedAt": "2026-02-03T12:00:00.000Z",
  "documentName": "my-document.pdf",
  "annotations": [...]
}
```

---

#### `importAnnotations(json: string): Annotation[]`

Imports annotations from JSON.

```typescript
const annotations = importAnnotations(jsonString);
```

**Throws:** Error if JSON is invalid or version is incompatible

---

#### `mergeAnnotations(existing: Annotation[], imported: Annotation[]): Annotation[]`

Merges annotations, resolving ID conflicts.

```typescript
const merged = mergeAnnotations(existingAnnotations, importedAnnotations);
```

---

## Electron IPC Channels

IPC channels are defined in `electron/ipc/channels.ts` and typed in `electron/ipc/types.ts`.

### File Operations

#### `FILE_READ`

Reads a file from the filesystem.

```typescript
// Renderer process
const result = await window.electron.readFile('/path/to/file.pdf');
if (result.success) {
  const data = result.data; // string or Buffer
}
```

---

#### `FILE_WRITE`

Writes data to a file.

```typescript
const result = await window.electron.writeFile('/path/to/file.pdf', uint8Array);
if (result.success) {
  console.log('File saved');
}
```

---

#### `DIALOG_OPEN_FILE`

Shows native file open dialog.

```typescript
const result = await window.electron.showOpenDialog({
  title: 'Open PDF',
  filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  multiSelections: false,
});

if (!result.canceled) {
  const filePath = result.filePaths[0];
}
```

---

#### `DIALOG_SAVE_FILE`

Shows native file save dialog.

```typescript
const result = await window.electron.showSaveDialog({
  title: 'Save PDF',
  defaultPath: 'document.pdf',
  filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
});

if (!result.canceled) {
  await window.electron.writeFile(result.filePath, pdfData);
}
```

---

### Print Operations

#### `PRINT_GET_PRINTERS`

Lists available printers.

```typescript
const printers = await window.electron.getPrinters();
for (const printer of printers) {
  console.log(printer.name, printer.isDefault);
}
```

---

#### `PRINT_SHOW_DIALOG`

Shows native print dialog.

```typescript
await window.electron.showPrintDialog({
  silent: false,
  printBackground: true,
  copies: 1,
});
```

---

#### `PRINT_SILENT`

Prints without showing dialog.

```typescript
await window.electron.printSilent({
  printerName: 'HP LaserJet',
  copies: 2,
  collate: true,
});
```

---

### Scanner Operations

#### `SCANNER_ENUMERATE`

Lists available scanners.

```typescript
const scanners = await window.electron.enumerateScanners();
for (const scanner of scanners) {
  console.log(scanner.id, scanner.name, scanner.type);
}
```

---

#### `SCANNER_SCAN`

Acquires an image from the scanner.

```typescript
const result = await window.electron.scan({
  scannerId: 'scanner-123',
  resolution: 300,
  colorMode: 'color',
  format: 'png',
});

if (result.success) {
  const imageData = result.data;
}
```

---

### Update Operations

#### `UPDATE_CHECK_FOR_UPDATES`

Checks for application updates.

```typescript
const result = await window.electron.checkForUpdates();
if (result.success && result.result) {
  console.log('Update available');
}
```

---

#### `UPDATE_DOWNLOAD`

Downloads an available update.

```typescript
const result = await window.electron.downloadUpdate();
```

---

#### `UPDATE_INSTALL_AND_RESTART`

Installs update and restarts.

```typescript
window.electron.installAndRestart();
```

---

## Types

### PDFDocument

```typescript
interface PDFDocument {
  id: string;
  name: string;
  data: ArrayBuffer;
  pageCount: number;
  currentPage: number;
  zoom: number;
  rotation: number;
  modified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PDFDocumentInfo

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
```

### Annotation

```typescript
type AnnotationType =
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'note'
  | 'drawing'
  | 'shape'
  | 'stamp'
  | 'eraser';

interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
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

  // Drawing properties
  paths?: DrawingPath[];
  strokeWidth?: number;

  // Shape properties
  shapeType?: 'rectangle' | 'ellipse' | 'arrow' | 'line';
  bounds?: AnnotationRect;
  fillColor?: string;
  rotation?: number;

  // Stamp properties
  stampType?: 'approved' | 'rejected' | 'confidential' | 'draft' | 'final' | 'for-review' | 'custom';
  position?: { x: number; y: number };
  scale?: number;
  customText?: string;
}
```

### FormField

```typescript
type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'date'
  | 'number';

interface BaseFormField {
  id: string;
  pageIndex: number;
  name: string;
  bounds: AnnotationRect;
  required: boolean;
  readonly: boolean;
  tooltip?: string;
}

interface TextFormField extends BaseFormField {
  type: 'text';
  value: string;
  maxLength?: number;
  multiline?: boolean;
  format?: 'none' | 'email' | 'phone' | 'zip';
}

interface NumberFormField extends BaseFormField {
  type: 'number';
  value: number | null;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

interface CheckboxFormField extends BaseFormField {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;
}

interface RadioFormField extends BaseFormField {
  type: 'radio';
  value: string;
  groupName: string;
  options: { label: string; value: string }[];
}

interface DropdownFormField extends BaseFormField {
  type: 'dropdown';
  value: string;
  options: string[];
  allowCustom?: boolean;
}

interface SignatureFormField extends BaseFormField {
  type: 'signature';
  value: string | null;
  signedBy?: string;
  signedAt?: Date;
}

interface DateFormField extends BaseFormField {
  type: 'date';
  value: string | null;
  format: string;
}

type FormField =
  | TextFormField
  | NumberFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | SignatureFormField
  | DateFormField;
```

### Signature

```typescript
interface Signature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string;         // Base64 encoded
  createdAt: Date;
  isDefault?: boolean;
  isInitials?: boolean;
}
```

### RecentFile

```typescript
interface RecentFile {
  path: string;
  name: string;
  timestamp: number;
  size?: number;
  thumbnail?: string;
}
```

### UpdateState

```typescript
interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadProgress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  error?: string;
  lastCheckTime?: number;
}
```

### FileWatcherEvent

```typescript
interface FileWatcherEvent {
  type: 'change' | 'add' | 'unlink' | 'error';
  path: string;
  stats?: {
    size: number;
    created: number;
    modified: number;
    accessed: number;
    isFile: boolean;
    isDirectory: boolean;
  };
  error?: string;
}
```

---

## See Also

- [Electron Architecture](./electron-architecture.md)
- [IPC Patterns](./ipc-patterns.md)
- [Offline-First Architecture](./offline-first.md)
- [Enterprise Features](./enterprise-features.md)

---

*Generated for PaperFlow v3.0.0*
