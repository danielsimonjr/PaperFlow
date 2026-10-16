# Data Flow Architecture

<!-- repo-map:no-verification -->

This document describes how data moves through PaperFlow. It covers user actions, state management, storage and persistence.

## Table of Contents

1. [Overview](#overview)
2. [PDF Loading Flow](#pdf-loading-flow)
3. [Annotation Operations](#annotation-operations)
4. [Form Field Operations](#form-field-operations)
5. [Save/Export Flow](#saveexport-flow)
6. [Electron IPC Flow](#electron-ipc-flow)
7. [Offline Sync Flow](#offline-sync-flow)
8. [Caching Strategy](#caching-strategy)
9. [Error Handling Flow](#error-handling-flow)

---

## Overview

PaperFlow uses a layered architecture. Each layer has one set of responsibilities. Components call stores and library code. Stores call library code and storage APIs.

### Data Flow Layers

```
UI layer          React components (src/components)
                    |  Hooks and store subscriptions
                    v
State layer       Zustand stores (src/stores)
                    |  Store actions and library calls
                    v
Core library      PDF, form, export and offline code (src/lib)
                    |  Browser APIs, or IPC in the desktop build
                    v
Storage layer     IndexedDB, localStorage, Cache API, file system
```

### Key Libraries

| Library | Purpose | Layer |
|---------|---------|-------|
| PDF.js (pdfjs-dist) | PDF rendering and text extraction | Core Library |
| pdf-lib | PDF file manipulation | Core Library |
| Zustand | State management | State Layer |
| IndexedDB | Browser database API (not a package) | Storage Layer |
| Electron IPC | Desktop process communication | Storage Layer |

---

## PDF Loading Flow

The web build and the desktop build open a PDF through the same Open action. The editor page also opens a PDF from a `url` query parameter.

### Open Action

1. The Home page Open button calls `open()` from `useFileSystem` (`src/hooks/useFileSystem.ts:46`).
2. `open()` calls `openPdfFile()` (`src/lib/storage/fileHandler.ts:13`). The function opens the file picker with `browser-fs-access`.
3. `open()` calls `loadDocument(file)` on the document store.
4. `loadDocument()` reads the bytes with `file.arrayBuffer()`. It then calls `loadDocumentFromArrayBuffer()` (`src/stores/documentStore.ts:52-57`).
5. `loadDocumentFromArrayBuffer()` destroys the previous renderer. `loadDocumentFromArrayBuffer()` creates a `PDFRenderer` and loads the bytes with PDF.js.
6. `open()` navigates to `/editor`.

```
Home page        useFileSystem       documentStore          PDFRenderer      PDF.js
    |                  |                    |                     |              |
    | open()           |                    |                     |              |
    |----------------->|                    |                     |              |
    |                  | openPdfFile()      |                     |              |
    |                  | (file picker)      |                     |              |
    |                  | loadDocument(file) |                     |              |
    |                  |------------------->|                     |              |
    |                  |                    | new PDFRenderer()   |              |
    |                  |                    |-------------------->|              |
    |                  |                    |                     | getDocument()|
    |                  |                    |                     |------------->|
    |                  |                    |  documentInfo       |   parsed     |
    |                  |                    |<--------------------|<-------------|
    |                  |                    | set state           |              |
    |                  | navigate /editor   |                     |              |
    |<-----------------|                    |                     |              |
```

### Open From URL

The editor page reads the `url` query parameter. It calls `openFromUrl()` (`src/pages/Editor.tsx:41-46`). `openFromUrl()` (`src/hooks/useFileSystem.ts:71`) calls `fetchPdfFromUrl()` (`src/lib/storage/fileHandler.ts:74`). It then calls `loadDocumentFromArrayBuffer()`.

### Desktop Build

The Open action uses `openPdfFile()` in `src/lib/storage/fileHandler.ts` on both builds.

The preload script exposes a native open dialog as `window.electron.openFile`. It uses the channel `DIALOG_OPEN_FILE`. No renderer code calls `window.electron.openFile`.

The main process registers the `DIALOG_OPEN_FILE` and `FILE_READ` handlers in `setupFileHandlers()` (`electron/ipc/fileHandlers.ts`).

Recent files work differently on the desktop. `openRecentFile()` in `src/stores/recentFilesStore.ts` checks if the file exists. The function reads the file using `window.electron.readFile` (line 108). The function does not load the bytes into the document store.

### Worker Setup

PDF.js loads its worker from `./pdf.worker.min.js` in the desktop build. The web build loads it from `/pdf.worker.min.js`. The worker parses the PDF in the background.

### State Changes

```typescript
// Initial state
{
  fileName: null,
  fileData: null,
  documentInfo: null,
  pageCount: 0,
  currentPage: 1,
  zoom: 100,
  viewMode: 'single',
  isModified: false,
  isLoading: false,
  error: null,
  renderer: null,
}

// Loading state (set at the start of loadDocument and loadDocumentFromArrayBuffer)
{
  isLoading: true,
  error: null,
}

// Loaded state
{
  fileName: "document.pdf",
  fileData: <PDF bytes>,
  documentInfo: { numPages: 10, title: "...", ... },
  pageCount: 10,
  currentPage: 1,
  isModified: false,
  isLoading: false,
  error: null,
  renderer: PDFRenderer,
}
```

The document store persists only `zoom` and `viewMode`. It writes them to localStorage under the key `paperflow-document` (`src/stores/documentStore.ts:181-185`).

---

## Annotation Operations

The annotation store keeps annotations in memory. The annotation store does not write annotations to storage. Adding or deleting an annotation records an undo entry in the history store.

### Create Annotation Flow

1. A component calls `annotationStore.addAnnotation()` (`src/stores/annotationStore.ts`).
2. `addAnnotation()` creates the `id` with `uuidv4()`. `addAnnotation()` sets `createdAt` and `updatedAt` to the current time.
3. The store adds the annotation to `annotations`.
4. The store calls `useHistoryStore.getState().push()` with an `undo` function and a `redo` function (`annotationStore.ts:71`).
5. The annotation layer renders the new annotation.

### Annotation Fields

The store uses the `Annotation` interface in `src/types/index.ts:30`.

- Common: `id`, `type`, `pageIndex`, `rects`, `color`, `opacity`, `createdAt`, `updatedAt`
- Text and notes: `content`, `author`, `replies`
- Drawing: `paths`, `strokeWidth`
- Shape: `shapeType`, `bounds`, `fillColor`, `startPoint`, `endPoint`
- Stamp: `stampType`, `position`, `scale`, `customText`
- Other: `rotation`, `backgroundColor`

### History Integration

The history store is one shared stack. The text store (`src/stores/textStore.ts`) and the thumbnail sidebar also push entries to it.

- `addAnnotation()` and `deleteAnnotation()` call `push()`. `updateAnnotation()` does not call `push()` (`annotationStore.ts:88-94`).
- `push()` appends an entry to `past`. It keeps the newest 50 entries (`maxHistory`). It clears `future` (`src/stores/historyStore.ts:32-43`).
- `undo()` calls `entry.undo()` on the last entry in `past`. It moves that entry to the start of `future` (`historyStore.ts:45-58`).
- `redo()` calls `entry.redo()` on the first entry in `future`. It moves that entry to the end of `past` (`historyStore.ts:60-73`).
- `src/hooks/useAnnotationShortcuts.ts` maps Ctrl+Z (or Cmd+Z) to undo. It maps Ctrl+Shift+Z and Ctrl+Y to redo (lines 53-68).

### Coordinates

`src/utils/coordinates.ts` defines `screenToPdf()` and related conversion functions. No module in `src` calls `screenToPdf()`.

---

## Form Field Operations

Form fields load from the PDF when a document opens. The form store holds the field values. The form store autosaves the values to IndexedDB when the form autosave setting is on.

### Form Detection Flow

The `useFormFields` hook runs an effect when the renderer, the page count or the file name changes (`src/hooks/useFormFields.ts:26-66`).

1. For each page, the hook calls `extractPageFormFields(page, pageIndex)` (`src/lib/forms/formParser.ts:283`).
2. The hook sorts the fields with `sortFieldsByTabOrder()` (`formParser.ts:361`).
3. The hook calls `formStore.setFields()` (`src/stores/formStore.ts`).
4. If the file has fields, the hook calls `loadFormData(documentId)`. The document ID equals `form-` plus the file name (`useFormFields.ts:50-52`). The function `loadFormData()` resides in `src/lib/storage/formStorage.ts:81`.
5. If saved values exist, the hook calls `formStore.importFormData()` (`formStore.ts:244`).

### Form Field Update Flow

Four field components call `formStore.updateFieldValue()`: `TextField`, `Checkbox`, `RadioButton` and `Dropdown`. All four are in `src/components/forms/`.

1. `updateFieldValue()` sets the new value and rebuilds `fieldsByPage`. The function deletes the field's entry in `validationErrors` and sets `isDirty` to true.
2. When the form autosave setting is on and the form has fields, the `useFormFields` effect waits one second. It then calls `saveFormData()` with the same document ID (`useFormFields.ts:68-84`).
3. `saveFormData()` writes to the `formData` object store of the `paperflow` IndexedDB database (`src/lib/storage/formStorage.ts:3-4`).

### Form Validation

Validation runs only through `validateForm()` (`src/lib/forms/validation.ts:124`). The only caller is `FormActions.tsx:82`. Field components do not run validation. No page renders `FormActions`.

`validateFormFields()` (`src/lib/forms/formParser.ts:406`) has one caller, `areRequiredFieldsFilled()` (`formParser.ts:459`). No module calls `areRequiredFieldsFilled()`.

### Form Field State Structure

```
formStore
+------------------+
| fields: FormField[]
| fieldsByPage: Map<number, FormField[]>
| focusedFieldId: string | null
| validationErrors: Map<string, string[]>
| isDirty: boolean
| isLoading: boolean
| originalValues: Map<string, unknown>
+------------------+

FormField (src/types/forms.ts)
+------------------+
| id: string       |
| name: string     |
| type: FieldType  |-----> 'text' | 'checkbox' | 'radio' | 'dropdown'
|                  |       | 'signature' | 'date' | 'number'
| pageIndex: number|
| bounds: Rect     |
| value: unknown   |
| required: boolean|
| readonly: boolean|
| options?: string[]
+------------------+
```

### Form Export Functions

`FormActions.tsx` calls three export functions (lines 45-51). No page renders `FormActions`.

| Format | Function | Module |
|--------|----------|--------|
| JSON | `downloadFormDataAsJSON()` | `src/lib/forms/exportImport.ts:83` |
| FDF | `downloadFormDataAsFDF()` | `src/lib/forms/fdfExport.ts:104` |
| XFDF | `downloadFormDataAsXFDF()` | `src/lib/forms/xfdfExport.ts:92` |

The FDF file uses the `application/vnd.fdf` blob type.

---

## Save/Export Flow

The application does not write annotations or form values into the PDF file. The save functions write the loaded PDF bytes. The export functions write separate files.

### Save Paths

| Path | Entry point | Output |
|------|-------------|--------|
| Autosave | `useAutoSave` hook, mounted in the editor (`src/pages/Editor.tsx:30`) | Loaded PDF bytes, unchanged. Stored in the `autoSave` object store. |
| Save to file (web) | `useFileSystem().save()` (`src/hooks/useFileSystem.ts:108`) | Loaded PDF bytes, written to a file handle or downloaded. No component calls `save()`. |
| Save to file (desktop) | `window.electron.saveFile()` (preload) | Loaded PDF bytes, written through the native save dialog. Only the wrapper `fileOperations.saveFile` calls it, and no module calls that wrapper. |

The autosave path works in two steps.

1. `useAutoSave` calls `savePdf(fileData)` (`src/hooks/useAutoSave.ts:51`). `savePdf()` (`src/lib/pdf/saver.ts:14`) returns the bytes unchanged.
2. The hook calls `storage.saveAutoSave()` (`src/lib/storage/indexeddb.ts:177`). It also calls `cleanupOldAutoSaves(5)`, which is defined at `indexeddb.ts:238`.

Two save controls have no effect:

- The Save button in the header (`src/components/layout/Header.tsx:64-71`) has no click handler.
- `KEYBOARD_SHORTCUTS` (`src/constants/shortcuts.ts:8`) lists Ctrl+S as `file.save`. No module imports that constant, so the binding has no effect.

The desktop File > Save menu item sends `menu-file-save` to the renderer (`electron/menuTemplate.ts:164`). The renderer does not subscribe to that event. The only subscriber, `useElectronMenuEvents()` (`src/hooks/usePlatform.ts:168`), has no caller.

### Export Variants

| Export | Function | Reached from |
|--------|----------|--------------|
| Images, one page or a ZIP of pages | `exportSinglePage()`, `exportPagesAsZip()` (`src/lib/export/imageExport.ts`) | `ImageExportDialog` (`src/components/export/ImageExportDialog.tsx:15`), rendered in `Header.tsx:134` |
| Compressed PDF | `compressPdf()` (`src/lib/export/compressPdf.ts:44`) | `CompressDialog` (`src/components/export/CompressDialog.tsx:32`), rendered in `Header.tsx:135` |
| Annotations as JSON | `annotationStore.exportAnnotations()` (`src/stores/annotationStore.ts:179`) | `ExportImportDialog` (`src/components/annotations/ExportImportDialog.tsx:38`), rendered in `Toolbar.tsx:169` |
| Form data as JSON, FDF or XFDF | `downloadFormDataAs*()` (see Form Field Operations) | `FormActions`, which no page renders |
| Flattened PDF | `flattenPdf()` (`src/lib/export/flattenPdf.ts:15`) calls `exportPdf()` (`src/lib/export/pdfExport.ts:20`) | No caller |

Image export renders each page to a canvas with `renderPageToCanvas()` (`src/lib/export/imageExport.ts:190`). It then converts the canvas to a `Blob` with `canvasToBlob()` (`imageExport.ts:227`).

### Desktop Save Flow

```
Renderer: window.electron.saveFile(data)
  -> preload: invoke DIALOG_SAVE_FILE (native save dialog)
  -> if the dialog is not canceled: invoke FILE_SAVE (filePath, data)
       -> main process: assertPathAllowed(), assertExtensionAllowedForWrite(), fs.writeFile()
       -> returns { success: true } or { success: false, error }
  -> preload returns the dialog result. It discards the FILE_SAVE result.
```

A failed write therefore looks like a successful save to the caller. The handler writes the file in place. The handler does not write to a temporary file first.

---

## Electron IPC Flow

In the desktop build, the renderer and the main process communicate through named IPC channels. The preload script (`electron/preload/index.ts`) exposes a typed API as `window.electron`. The main process registers one handler for each request channel.

Channel names are constants in `electron/ipc/channels.ts`. Each value is a lowercase, hyphenated string. For example, `FILE_READ` has the value `file-read`.

### Renderer to Main Calls

| Renderer call | Preload method | Channel | Main handler |
|---------------|----------------|---------|--------------|
| `window.electron.openFile()` | `openFile` | `DIALOG_OPEN_FILE` | `electron/ipc/fileHandlers.ts` |
| `window.electron.readFile(path)` | `readFile` | `FILE_READ` | `electron/ipc/fileHandlers.ts` |
| `window.electron.writeFile(path, data)` | `writeFile` | `FILE_WRITE` | `electron/ipc/fileHandlers.ts` |
| `window.electron.saveFile(data)` | `saveFile` | `DIALOG_SAVE_FILE`, then `FILE_SAVE` | `electron/ipc/fileHandlers.ts` |
| `window.electron.watchFile(path)` | `watchFile` | `WATCHER_START` | `electron/ipc/fileHandlers.ts` |

No module in `src` calls `window.electron.openFile()`. In `src`, only `fileOperations.saveFile` (`src/lib/electron/ipc.ts:39`) calls `window.electron.saveFile()`, and no module calls that wrapper.

`electron/ipc/handlers.ts` calls `setupFileHandlers()`, which registers these handlers.

### Request-Response Pattern

```
Renderer               Preload                        Main process
   | readFile(path)        |                              |
   |---------------------->| invoke('file-read', path)    |
   |                       |----------------------------->| assertPathAllowed(path)
   |                       |                              | fs.readFile(path)
   |                       |   { success: true, data }    |
   |                       |<-----------------------------|
   |  resolves with result |                              |
   |<----------------------|                              |
```

The handler returns `{ success: true, data }` when the operation succeeds. The handler returns `{ success: false, error }` when the operation fails. The handler does not throw for file errors (`electron/ipc/fileHandlers.ts:279-290`).

### Event Subscription Pattern

The preload function `createListener()` (`electron/preload/index.ts:98-106`) adds an `ipcRenderer.on` listener. The `createListener()` function returns a function that removes the listener. The file watcher sends `file-changed` with `webContents.send()` (`electron/fileWatcher.ts:48`).

```
Renderer                   Preload                          Main process
   | onFileChanged(cb)        |                                |
   |------------------------->| createListener('file-changed') |
   |  returns unsubscribe     |                                |
   |<-------------------------|                                |
   |                          |                                | file changes
   |                          | 'file-changed', event          |
   |                          |<-------------------------------|
   |  callback(event)         |                                |
   |<-------------------------|                                |
   |  unsubscribe()           |                                |
   |------------------------->| ipcRenderer.removeListener     |
```

### IPC Channel Categories

Request channels (renderer to main):

| Category | Constants (examples) |
|----------|----------------------|
| File | `FILE_READ`, `FILE_WRITE`, `FILE_SAVE`, `FILE_EXISTS`, `FILE_DELETE`, `FILE_COPY`, `FILE_MOVE`, `FILE_GET_RECENT`, `FILE_ADD_RECENT` |
| Dialog | `DIALOG_OPEN_FILE`, `DIALOG_SAVE_FILE`, `DIALOG_MESSAGE` |
| Folder | `FOLDER_PICK`, `FOLDER_LIST`, `FOLDER_CREATE` |
| Watcher | `WATCHER_START`, `WATCHER_STOP`, `WATCHER_STOP_ALL` |
| Auto-save | `AUTOSAVE_ENABLE`, `AUTOSAVE_DISABLE`, `AUTOSAVE_GET_RECOVERY`, `AUTOSAVE_CLEAR_RECOVERY` |
| Window | `WINDOW_MINIMIZE`, `WINDOW_MAXIMIZE`, `WINDOW_CLOSE`, `WINDOW_SET_TITLE` |
| Update | `UPDATE_CHECK_FOR_UPDATES`, `UPDATE_DOWNLOAD`, `UPDATE_INSTALL_AND_RESTART` |
| Notification | `NOTIFICATION_SHOW`, `NOTIFICATION_CLOSE` |
| Print | `PRINT_GET_PRINTERS`, `PRINT_SHOW_DIALOG`, `PRINT_SILENT` |

Event channels (main to renderer):

| Category | Constants (examples) |
|----------|----------------------|
| File | `FILE_OPENED`, `FILE_SAVED`, `FILE_CHANGED`, `FILE_DELETED`, `FILE_ERROR` |
| Auto-save | `AUTOSAVE_TRIGGERED`, `AUTOSAVE_COMPLETED`, `AUTOSAVE_FAILED` |
| Update | `UPDATE_STATE_CHANGED`, `UPDATE_AVAILABLE`, `UPDATE_DOWNLOADED`, `UPDATE_ERROR` |
| Menu | `MENU_FILE_OPEN`, `MENU_FILE_SAVE`, `MENU_EDIT_UNDO`, `MENU_VIEW_ZOOM_IN` |

The full list is in `electron/ipc/channels.ts`.

---

## Offline Sync Flow

The offline modules keep documents for offline use. They also queue writes and detect sync conflicts.

### Entry Points

The application code defines the entry points.

- `offlineStore` registers listeners for the browser `online` and `offline` events (`src/stores/offlineStore.ts:282-283`).
- `useOfflineData` (`src/hooks/useOfflineData.ts`) queues writes while offline (line 222). Its hooks `useOfflineDocument()` and `useOfflineDocuments()` have no caller.
- `useOfflineSync()` (`src/hooks/useOfflineSync.ts`) calls `syncEngine.sync()`. No module calls `useOfflineSync()`.
- `backgroundSync.initialize()` (`src/lib/offline/backgroundSync.ts:288`) starts the queue processor and adds the `online` listener. No module calls `initialize()`.
- `OfflineBanner`, `OfflineIndicator` and `ConflictDialog` (`src/components/offline/`) are not rendered by any module.

### Offline Modules

| Module | Role |
|--------|------|
| `offlineStore` (`src/stores/offlineStore.ts`) | Holds the online state and the banner flag. |
| `offlineStorage` (`src/lib/offline/offlineStorage.ts`) | IndexedDB database `paperflow-offline`. |
| `offlineQueue` (`src/lib/offline/offlineQueue.ts`) | IndexedDB database `paperflow-queue`, object store `queue`. |
| `queueProcessor` (`src/lib/offline/queueProcessor.ts`) | Selects the queued items that are ready for retry. It does nothing while `navigator.onLine` is false (lines 121-122). |
| `backgroundSync` (`src/lib/offline/backgroundSync.ts`) | Runs `performSync()` when the browser goes online. Uses a timer when Background Sync is not supported. |
| `syncEngine` (`src/lib/offline/syncEngine.ts`) | Compares the local and the remote copy of each document. Reports conflicts. |
| `conflictResolver` (`src/lib/offline/conflictResolver.ts`) | Detects conflicts. Recommends a resolution strategy. |

### Going Offline

1. The browser fires `offline`. `offlineStore` sets the online state to false and sets `showOfflineBanner` (`offlineStore.ts:134`).
2. `queueProcessor.processQueue()` returns early while `navigator.onLine` is false (`queueProcessor.ts:121-122`).

### Queueing a Write

1. `useOfflineData` updates its local state first (`useOfflineData.ts:210-214`).
2. When `isOnline` is false, `mutate()` calls `offlineQueue.enqueue('update', key, { data })` (`useOfflineData.ts:220-222`).

Queued items return in priority order: high, then normal, then low. Items with the same priority return in creation order (`src/lib/offline/offlineQueue.ts`).

### Reconnecting

1. The browser fires `online`. `backgroundSync` runs `handleOnline()` (`backgroundSync.ts:201-204`). This listener exists only after `startFallbackSync()` runs (`backgroundSync.ts:178`).
2. `performSync()` calls `queueProcessor.processQueue()` (`backgroundSync.ts:209-212`).
3. `processQueue()` selects the items that are ready for retry (`queueProcessor.ts:126-134`).

`performSync()` does not call `syncEngine.sync()`. Conflict detection does not run when the browser reconnects.

### Conflict Detection

`syncEngine.sync()` (`src/lib/offline/syncEngine.ts:90`) compares each local document with its remote copy.

1. A different checksum and a different `modifiedAt` value make a conflict (`syncEngine.ts:259-262`). The engine adds the conflict to `result.conflicts` and to the offline store (`syncEngine.ts:275-277`). When `autoResolveConflicts` is set, the engine resolves the conflict with the default strategy instead (`syncEngine.ts:273-274`). The option defaults to false (`syncEngine.ts:72`).
2. Otherwise, the copy with the higher `version` is saved to the other side (`syncEngine.ts:284-289`).

### Resolving Conflicts

`ConflictDialog` offers four choices: Keep Local, Keep Cloud, Keep Newest and Merge Changes. Its choice calls `syncEngine.resolveConflict()` (`src/components/offline/ConflictDialog.tsx:93`).

`conflictResolver.getRecommendedStrategy()` recommends a strategy. The function recommends the newest copy when the two copies differ by more than one hour. The function recommends a merge for annotations. The function recommends the local copy for forms. Otherwise, the function recommends manual resolution. The function only recommends. The function does not apply a strategy.

### Offline Storage Schema

```
IndexedDB: paperflow-offline
+------------------+-------------------------------------------+
|   Store          |   Purpose                                 |
+------------------+-------------------------------------------+
|   documents      |   PDF binary data for offline access      |
|   metadata       |   Document metadata (name, size, etc.)    |
|   annotations    |   Annotations per document                |
|   editHistory    |   Edit history for sync tracking          |
|   settings       |   Offline availability settings           |
+------------------+-------------------------------------------+

IndexedDB: paperflow-queue
+------------------+-------------------------------------------+
|   queue          |   Pending operations                      |
+------------------+-------------------------------------------+
```

---

## Caching Strategy

PaperFlow uses four kinds of cache. The thumbnail cache lives in memory. The recent-files list lives in the desktop main process or in IndexedDB. The service worker caches network responses. The autosave store lives in IndexedDB.

### Thumbnail Cache (LRU)

`ThumbnailCache` (`src/lib/thumbnails/cache.ts`) keeps rendered thumbnails as data URLs.

- Key format: `documentId:pageNumber:scale` (`cache.ts:15`).
- `get()` moves the entry to the most recent position (`cache.ts:18-30`).
- `set()` removes the least recently used entry when the cache is full (`cache.ts:32-49`).
- The application uses one shared instance with 200 entries (`cache.ts:74`).
- The cache is held in memory. A page reload clears it.

### Recent Files

- Desktop: `electron/recentFiles.ts` keeps at most 10 entries (`MAX_RECENT_FILES`).
- Web: `src/lib/storage/indexeddb.ts` stores recent files in the `recentFiles` object store of the `paperflow` database. The store has a `lastOpened` index (lines 42-43). The list reads that index (line 85). The web store has no size limit. The Home page calls `addRecentFile()` (`src/pages/Home.tsx:30,66`).

### Service Worker Caches

The runtime caching rules are in `vite.config.ts` (lines 47-116).

| Requests matched by | Strategy | Cache name | Entries | Maximum age |
|---------------------|----------|------------|---------|-------------|
| `https://unpkg.com/pdfjs-dist` URLs | CacheFirst | `paperflow-pdfjs-v1` | 10 | 30 days |
| `.js` and `.css` files | StaleWhileRevalidate | `paperflow-static-v1` | 100 | 30 days |
| `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico` files | CacheFirst | `paperflow-images-v1` | 100 | 30 days |
| `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot` files | CacheFirst | `paperflow-fonts-v1` | 20 | 1 year |
| `.pdf` files | CacheFirst | `paperflow-pdfs-v1` | 20 | 90 days |
| `/api/` paths | NetworkFirst, 10 second timeout | `paperflow-api-v1` | 50 | 5 minutes |

### Autosave Store

Autosave entries live in the `autoSave` object store of the `paperflow` database (`src/lib/storage/indexeddb.ts:58`). Each autosave stores the loaded PDF bytes. See Save/Export Flow.

### Cache Expiration

| Cache | Lifetime | Maximum entries |
|-------|----------|-----------------|
| Thumbnails (memory) | Until the page reloads | 200 |
| Recent files, desktop | No expiry | 10 |
| Recent files, web (IndexedDB) | No expiry | No limit |
| Static assets | 30 days | 100 |
| PDF.js library (CDN) | 30 days | 10 |
| Images | 30 days | 100 |
| Fonts | 1 year | 20 |
| PDF files | 90 days | 20 |
| API responses | 5 minutes | 50 |

---

## Error Handling Flow

Errors reach the user in three ways. Store actions write the error message to an `error` field. IPC handlers return `{ success: false, error }`. Other errors go to the console. The application has no React error boundary.

### Store Error States

`documentStore.loadDocument()` (`src/stores/documentStore.ts:52-65`):

1. Sets `isLoading` to true and `error` to null.
2. Reads the file and loads the document.
3. If loading fails, sets `error` to the error message and `isLoading` to false.

`useFileSystem.open()` (`src/hooks/useFileSystem.ts:46-69`) sets its own `error` field the same way. A cancelled file picker is not an error.

### Error Handling by Source

| Source | Handling |
|--------|----------|
| PDF load (`documentStore`) | Sets `error`. |
| File open (`useFileSystem.open()`) | Sets `error`. A cancelled file picker is ignored. |
| Form field extraction (`useFormFields`) | Logs the error to the console. Clears the field list (`src/hooks/useFormFields.ts:57-59`). |
| Desktop IPC (main process) | Returns `{ success: false, error }` (`electron/ipc/fileHandlers.ts`). The preload `saveFile()` discards this result. |
| Autosave (editor) | Logs `Auto-save failed:` to the console (`src/pages/Editor.tsx:36`). |
| Offline queue | Skips items that are not ready for retry (`src/lib/offline/queueProcessor.ts:126-134`). |
| Error reporting | `captureError()` (`src/lib/monitoring/sentry.ts:168`) has no caller. |

### Error Reporting

`src/lib/monitoring/sentry.ts` loads `@sentry/browser` with a dynamic import. It starts only when `VITE_SENTRY_DSN` is set. `package.json` does not list `@sentry/browser`.

### Recovery

A new `loadDocument()` call clears `error` before it loads the document (`documentStore.ts:53`). `closeDocument()` resets the document state.

---

## Summary

PaperFlow's data flow follows these principles:

1. **One-way data flow**: Components call store actions. Stores update state. Components render the new state.
2. **Separation of concerns**: Each layer has one set of responsibilities.
3. **Type checking**: TypeScript interfaces define the data structures and the IPC channel names.
4. **Local processing**: PDF rendering and editing run in the renderer. The desktop main process handles file system access.
5. **Error state in stores**: Store actions write errors to an `error` field. IPC handlers return error objects.

### Quick Reference

| Flow | Entry Point | State Store | Core Library | Storage |
|------|-------------|-------------|--------------|---------|
| PDF load | Home page Open button (`useFileSystem.open()`) | documentStore | PDF.js | Recent files (IndexedDB on web) |
| Annotation | AnnotationLayer | annotationStore | - | None (memory) |
| Form | TextField, Checkbox, RadioButton, Dropdown | formStore | formParser | IndexedDB (`formData`) |
| Save | useAutoSave (editor) | documentStore | saver.ts | IndexedDB (`autoSave`) |
| Offline | Browser online and offline events | offlineStore | queueProcessor, syncEngine | IndexedDB (`paperflow-queue`, `paperflow-offline`) |
| IPC | window.electron (preload) | Various | - | Node.js fs (main process) |
