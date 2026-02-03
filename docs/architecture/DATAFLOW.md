# Data Flow Architecture

> Version: 3.0.0 | Last Updated: 2026-02-03

This document describes how data flows through PaperFlow for all major operations, from user interactions through state management to storage and persistence.

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

PaperFlow uses a layered architecture where data flows through distinct tiers. Each layer has specific responsibilities and communicates with adjacent layers through well-defined interfaces.

### Data Flow Layers

```
+===========================================================================+
|                              UI LAYER                                       |
|  +-----------------------------------------------------------------------+  |
|  |  React Components                                                      |  |
|  |  - PDFViewer, AnnotationLayer, FormFields, Toolbar                    |  |
|  |  - Handle user interactions and render state                          |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
                                    |
                                    | React Hooks / Store Subscriptions
                                    v
+===========================================================================+
|                           STATE LAYER (Zustand)                             |
|  +-----------------------------------------------------------------------+  |
|  |  Core Stores           |  Desktop Stores       |  Enterprise Stores   |  |
|  |  - documentStore       |  - fileWatchStore     |  - licenseStore      |  |
|  |  - annotationStore     |  - offlineStore       |  - enterprisePolicy  |  |
|  |  - formStore           |  - updateStore        |  - kioskStore        |  |
|  |  - historyStore        |  - printStore         |  - lanStore          |  |
|  |  - signatureStore      |  - scannerStore       |                      |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
                                    |
                                    | Store Actions / Library Calls
                                    v
+===========================================================================+
|                           CORE LIBRARY LAYER                                |
|  +-----------------------------------------------------------------------+  |
|  |  PDF Processing        |  Form Handling        |  Export/Import       |  |
|  |  - PDF.js (render)     |  - formParser         |  - pdfExport         |  |
|  |  - pdf-lib (edit)      |  - validation         |  - imageExport       |  |
|  |  - renderer.ts         |  - fdfExport          |  - compressPdf       |  |
|  |  - saver.ts            |  - xfdfExport         |  - flattenPdf        |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
                                    |
                                    | File I/O / IPC (Electron)
                                    v
+===========================================================================+
|                           STORAGE LAYER                                     |
|  +-----------------------------------------------------------------------+  |
|  |  Web Storage           |  Desktop Storage      |  Electron Main       |  |
|  |  - IndexedDB           |  - File System        |  - Node.js fs        |  |
|  |  - localStorage        |  - Electron Store     |  - chokidar          |  |
|  |  - Service Worker      |  - Secure Storage     |  - electron-store    |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
```

### Key Libraries

| Library | Purpose | Layer |
|---------|---------|-------|
| PDF.js | PDF rendering and text extraction | Core Library |
| pdf-lib | PDF manipulation (edit, merge, split) | Core Library |
| Zustand | State management | State Layer |
| IndexedDB | Browser persistence | Storage Layer |
| Electron IPC | Desktop process communication | Storage Layer |

---

## PDF Loading Flow

When a user opens a PDF document, data flows through multiple stages from file selection to rendered display.

### Web Application Flow

```
+-------------+     +------------------+     +------------------+
|   User      |     |  FileDropZone /  |     |  File System     |
|   Action    |---->|  Open Dialog     |---->|  Access API      |
+-------------+     +------------------+     +------------------+
                                                      |
                                                      | File object / ArrayBuffer
                                                      v
+------------------+     +------------------+     +------------------+
|   PDFViewer      |     |  documentStore   |     |  loadDocument()  |
|   (renders)      |<----|  (state update)  |<----|  action called   |
+------------------+     +------------------+     +------------------+
       ^                         |
       |                         | Create PDFRenderer
       |                         v
       |                 +------------------+
       |                 |   PDF.js Worker  |
       |                 |  (background)    |
       +-----------------+------------------+
                 Render callbacks
```

### Desktop Application Flow

```
+-------------+     +------------------+     +------------------+
|   User      |     |  Native Dialog   |     |  Electron Main   |
|   Action    |---->|  (dialog:open)   |---->|  Process         |
+-------------+     +------------------+     +------------------+
                                                      |
                                                      | IPC: file:read
                                                      v
+------------------+     +------------------+     +------------------+
|   Preload        |     |  fs.readFile()   |     |  Node.js         |
|   Script         |<----|  (native)        |<----|  File System     |
+------------------+     +------------------+     +------------------+
       |
       | ArrayBuffer via IPC
       v
+------------------+     +------------------+     +------------------+
|   documentStore  |     |  PDFRenderer     |     |  PDF.js Worker   |
|   loadDocument() |---->|  instance        |---->|  (parse PDF)     |
+------------------+     +------------------+     +------------------+
                                                      |
                                                      | Document ready
                                                      v
+------------------+     +------------------+     +------------------+
|   PDFViewer      |     |  PageCanvas      |     |  formStore       |
|   Component      |---->|  (each page)     |---->|  (form fields)   |
+------------------+     +------------------+     +------------------+
```

### Sequence Diagram

```
User          FileDropZone      documentStore      PDFRenderer      PDF.js Worker
  |                |                  |                 |                 |
  | Drop file      |                  |                 |                 |
  |--------------->|                  |                 |                 |
  |                | loadDocument()   |                 |                 |
  |                |----------------->|                 |                 |
  |                |                  | set isLoading   |                 |
  |                |                  |-----+           |                 |
  |                |                  |     |           |                 |
  |                |                  |<----+           |                 |
  |                |                  |                 |                 |
  |                |                  | new PDFRenderer |                 |
  |                |                  |---------------->|                 |
  |                |                  |                 | loadDocument()  |
  |                |                  |                 |---------------->|
  |                |                  |                 |                 |
  |                |                  |                 |   Parse PDF     |
  |                |                  |                 |<----------------|
  |                |                  |                 |                 |
  |                |                  | documentInfo    |                 |
  |                |                  |<----------------|                 |
  |                |                  |                 |                 |
  |                |                  | set state       |                 |
  |                |                  |-----+           |                 |
  |                |                  |     | (pageCount, renderer, etc.) |
  |                |                  |<----+           |                 |
  |                |                  |                 |                 |
  | Re-render      |                  |                 |                 |
  |<---------------|                  |                 |                 |
```

### State Changes

```typescript
// Initial state
{
  fileName: null,
  fileData: null,
  documentInfo: null,
  pageCount: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
  renderer: null,
}

// Loading state
{
  isLoading: true,
  error: null,
}

// Loaded state
{
  fileName: "document.pdf",
  fileData: ArrayBuffer,
  documentInfo: { numPages: 10, title: "...", ... },
  pageCount: 10,
  currentPage: 1,
  isLoading: false,
  error: null,
  renderer: PDFRenderer,
}
```

---

## Annotation Operations

Annotations (highlights, notes, drawings, shapes, stamps) flow through a dedicated annotation layer with history tracking for undo/redo.

### Create Annotation Flow

```
+-------------+     +------------------+     +------------------+
|   User      |     |  Annotation      |     |  annotationStore |
|   Creates   |---->|  Tool (active)   |---->|  addAnnotation() |
+-------------+     +------------------+     +------------------+
                                                      |
                           +--------------------------|
                           |                          v
                    +------+-------+     +------------------+
                    | historyStore |     |  Generate UUID   |
                    | push()       |<----|  Add timestamps  |
                    +--------------+     +------------------+
                           |                          |
                           v                          v
                    +------------------+     +------------------+
                    |  Undo/Redo       |     |  AnnotationLayer |
                    |  Stack           |     |  Re-renders      |
                    +------------------+     +------------------+
                                                      |
                                                      | (if auto-save enabled)
                                                      v
                                             +------------------+
                                             |  IndexedDB       |
                                             |  Persistence     |
                                             +------------------+
```

### Annotation State Flow

```
+------------------+     +------------------+     +------------------+
|   Active Tool    |     |   User           |     |  Selection       |
|   (highlight)    |---->|   Text Select    |---->|  Coordinates     |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   documentStore  |<----|  Coordinate      |<----|  screenToPdf()   |
|   setModified()  |     |  Conversion      |     |  Transform       |
+------------------+     +------------------+     +------------------+
                                |
                                v
+------------------+     +------------------+     +------------------+
|   Annotation     |     |  annotationStore |     |  Zustand State   |
|   Object         |---->|  annotations[]   |---->|  Update          |
+------------------+     +------------------+     +------------------+
```

### History Integration

```
User Action           annotationStore          historyStore
     |                      |                       |
     | Add annotation       |                       |
     |--------------------->|                       |
     |                      | Store current state   |
     |                      |---------------------->|
     |                      |                       | push({ undo, redo })
     |                      |                       |-----+
     |                      |                       |     |
     |                      |                       |<----+
     |                      |                       |
     | Undo (Ctrl+Z)        |                       |
     |--------------------------------------------->|
     |                      |                       | past.pop()
     |                      |                       | entry.undo()
     |                      |<----------------------|
     |                      | Remove annotation     |
     |                      |-----+                 |
     |                      |     |                 |
     |                      |<----+                 |
     |                      |                       | future.push(entry)
     |                      |                       |-----+
     |                      |                       |     |
     |                      |                       |<----+
```

### Annotation Types and Properties

```
+------------------+
|   Annotation     |
+------------------+
| id: string       |
| type: AnnotationType
| pageIndex: number|
| rects: Rect[]    |---------> Text Markup (highlight, underline, strikethrough)
| position: Point  |---------> Note, Stamp
| path: Point[]    |---------> Drawing (freehand)
| shape: ShapeData |---------> Shape (rectangle, ellipse, arrow, line)
| color: string    |
| opacity: number  |
| content?: string |
| replies: Reply[] |
| createdAt: Date  |
| updatedAt: Date  |
+------------------+
```

---

## Form Field Operations

Form fields are detected when PDFs are loaded and managed through a dedicated form store with validation and export capabilities.

### Form Detection Flow

```
+------------------+     +------------------+     +------------------+
|   PDF Loaded     |     |  formParser      |     |  Detect AcroForm |
|   (documentStore)|---->|  parseFields()   |---->|  Fields          |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   formStore      |     |  Group by Page   |     |  Extract Field   |
|   setFields()    |<----|  fieldsByPage    |<----|  Properties      |
+------------------+     +------------------+     +------------------+
       |
       v
+------------------+
|   FormField      |
|   Components     |
+------------------+
```

### Form Field Update Flow

```
+-------------+     +------------------+     +------------------+
|   User      |     |  TextField /     |     |  formStore       |
|   Types     |---->|  Checkbox /      |---->|  updateFieldValue|
+-------------+     |  Dropdown        |     +------------------+
                    +------------------+              |
                                                      |
                           +--------------------------|
                           |                          |
                           v                          v
                    +------------------+     +------------------+
                    |  Validation      |     |  Clear Error     |
                    |  (on blur)       |     |  (on change)     |
                    +------------------+     +------------------+
                           |                          |
                           v                          v
                    +------------------+     +------------------+
                    |  validationErrors|     |  isDirty = true  |
                    |  Map update      |     |  (modified flag) |
                    +------------------+     +------------------+
```

### Form Export Flow

```
+------------------+     +------------------+     +------------------+
|   User Clicks    |     |  formStore       |     |  Field Values    |
|   Export FDF     |---->|  getFormData()   |---->|  Collection      |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   Download       |     |  Blob Creation   |     |  generateFDF()   |
|   Trigger        |<----|  application/vnd |<----|  or XFDF         |
+------------------+     |  .fdf            |     +------------------+
                         +------------------+
```

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

FormField
+------------------+
| id: string       |
| name: string     |
| type: FieldType  |-----> 'text' | 'checkbox' | 'radio' | 'dropdown' |
| pageIndex: number|       'signature' | 'date' | 'number'
| rect: Rect       |
| value: unknown   |
| required: boolean|
| readonly: boolean|
| options?: string[]
| validation?: ValidationRule[]
+------------------+
```

---

## Save/Export Flow

Saving involves collecting all document modifications (annotations, form data, text edits) and embedding them into the PDF.

### Save Document Flow

```
+-------------+     +------------------+     +------------------+
|   User      |     |  Save Trigger    |     |  Collect State   |
|   Saves     |---->|  (Ctrl+S / Menu) |---->|  from Stores     |
+-------------+     +------------------+     +------------------+
                                                      |
              +---------------------------------------|
              |                                       |
              v                                       v
+------------------+     +------------------+     +------------------+
|   documentStore  |     |  annotationStore |     |  formStore       |
|   fileData       |     |  annotations     |     |  fields          |
+------------------+     +------------------+     +------------------+
              |                   |                       |
              +-------------------+-----------------------+
                                  |
                                  v
                         +------------------+
                         |  pdf-lib         |
                         |  PDFDocument     |
                         +------------------+
                                  |
       +--------------------------+-------------------------+
       |                          |                         |
       v                          v                         v
+------------------+     +------------------+     +------------------+
|  Embed           |     |  Set Form        |     |  Embed           |
|  Annotations     |     |  Field Values    |     |  Signatures      |
+------------------+     +------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |  pdfDoc.save()   |
                         |  -> Uint8Array   |
                         +------------------+
                                  |
           +----------------------+----------------------+
           |                      |                      |
           v                      v                      v
    +-------------+       +-------------+       +-------------+
    | Web: File   |       | Web:        |       | Electron:   |
    | System API  |       | Download    |       | fs.writeFile|
    +-------------+       +-------------+       +-------------+
```

### Export Variants

```
+------------------+
|   Export Type    |
+------------------+
         |
         +-----> PDF (with embedded annotations)
         |        |
         |        +---> savePdf() -> pdf-lib -> Uint8Array
         |
         +-----> PDF/A (archival format)
         |        |
         |        +---> flattenPdf() + convertToPdfA()
         |
         +-----> Images (PNG, JPEG)
         |        |
         |        +---> renderPageToCanvas() -> toDataURL()
         |
         +-----> Form Data (FDF/XFDF)
         |        |
         |        +---> generateFDF() or generateXFDF()
         |
         +-----> Annotations (JSON)
                  |
                  +---> annotationStore.exportAnnotations()
```

### Desktop Save Flow

```
+------------------+     +------------------+     +------------------+
|   Renderer       |     |  Preload         |     |  Main Process    |
|   saveFile()     |---->|  IPC invoke      |---->|  file:save       |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   Response       |     |  fs.writeFile    |     |  Validate Path   |
|   { success }    |<----|  (atomic write)  |<----|  Check perms     |
+------------------+     +------------------+     +------------------+
```

---

## Electron IPC Flow

In the desktop application, all communication between the renderer (React app) and main process (Node.js) flows through typed IPC channels.

### IPC Architecture

```
+===========================================================================+
|                         RENDERER PROCESS                                    |
|  +-----------------------------------------------------------------------+  |
|  |  React Component                                                       |  |
|  |  window.electron.openFile()                                           |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
                                    |
                                    | contextBridge API
                                    v
+===========================================================================+
|                         PRELOAD SCRIPT                                      |
|  +-----------------------------------------------------------------------+  |
|  |  contextBridge.exposeInMainWorld('electron', {                        |  |
|  |    openFile: () => ipcRenderer.invoke('dialog:openFile'),             |  |
|  |    onFileChanged: (cb) => { ... return unsubscribe }                  |  |
|  |  })                                                                    |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
                                    |
                                    | ipcRenderer.invoke / ipcRenderer.on
                                    v
+===========================================================================+
|                         MAIN PROCESS                                        |
|  +-----------------------------------------------------------------------+  |
|  |  ipcMain.handle('dialog:openFile', async (event) => {                 |  |
|  |    const result = await dialog.showOpenDialog(...)                    |  |
|  |    return result                                                       |  |
|  |  })                                                                    |  |
|  +-----------------------------------------------------------------------+  |
+===========================================================================+
```

### Request-Response Pattern

```
Renderer                 Preload                   Main Process
   |                        |                           |
   | window.electron.       |                           |
   | readFile(path)         |                           |
   |----------------------->|                           |
   |                        | ipcRenderer.invoke        |
   |                        | ('file:read', path)       |
   |                        |-------------------------->|
   |                        |                           |
   |                        |                           | fs.readFile(path)
   |                        |                           |-------+
   |                        |                           |       |
   |                        |                           |<------+
   |                        |                           |
   |                        |    { success, data }      |
   |                        |<--------------------------|
   |  Promise resolves      |                           |
   |<-----------------------|                           |
```

### Event Subscription Pattern

```
Renderer                 Preload                   Main Process
   |                        |                           |
   | const unsubscribe =    |                           |
   | onFileChanged(cb)      |                           |
   |----------------------->|                           |
   |                        | ipcRenderer.on            |
   |                        | ('file:changed', handler) |
   |                        |-------------------------->|
   |                        |                           |
   |    returns () => void  |                           |
   |<-----------------------|                           |
   |                        |                           |
   |                        |                           | File changes detected
   |                        |                           | webContents.send()
   |                        |    'file:changed', data   |
   |                        |<--------------------------|
   |   callback(data)       |                           |
   |<-----------------------|                           |
   |                        |                           |
   | unsubscribe()          |                           |
   |----------------------->|                           |
   |                        | removeListener            |
   |                        |-------------------------->|
```

### IPC Channel Categories

```
+------------------+-------------------------------------------+
|   Category       |   Channels                                |
+------------------+-------------------------------------------+
|   File           |   file:read, file:write, file:save,       |
|                  |   file:exists, file:delete, file:copy     |
+------------------+-------------------------------------------+
|   Dialog         |   dialog:openFile, dialog:saveFile,       |
|                  |   dialog:message                          |
+------------------+-------------------------------------------+
|   Window         |   window:minimize, window:maximize,       |
|                  |   window:close, window:setTitle           |
+------------------+-------------------------------------------+
|   Watcher        |   watcher:start, watcher:stop,            |
|                  |   watcher:stopAll                         |
+------------------+-------------------------------------------+
|   Update         |   update:check, update:download,          |
|                  |   update:install, update:getState         |
+------------------+-------------------------------------------+
|   Notification   |   notification:show, notification:close   |
+------------------+-------------------------------------------+
|   Print          |   print:dialog, print:silent,             |
|                  |   print:getPrinters                       |
+------------------+-------------------------------------------+
```

---

## Offline Sync Flow

PaperFlow implements offline-first architecture with intelligent caching, operation queuing, and conflict resolution.

### Going Offline Flow

```
+------------------+     +------------------+     +------------------+
|   Network        |     |  Navigator       |     |  offlineStore    |
|   Disconnects    |---->|  'offline' event |---->|  setOnline(false)|
+------------------+     +------------------+     +------------------+
                                                          |
       +--------------------------------------------------|
       |                                                  |
       v                                                  v
+------------------+     +------------------+     +------------------+
|   OfflineBanner  |     |  Queue Processor |     |  Local Storage   |
|   Appears        |     |  Pauses          |     |  Mode Active     |
+------------------+     +------------------+     +------------------+
```

### Offline Operation Queue

```
+------------------+     +------------------+     +------------------+
|   User Action    |     |  Check Online    |     |  Online?         |
|   (Save, Edit)   |---->|  Status          |---->|  Yes / No        |
+------------------+     +------------------+     +------------------+
                                                    |           |
                                          +--------+           +--------+
                                          |                             |
                                          v                             v
                                   +-------------+               +-------------+
                                   | Execute     |               | Queue       |
                                   | Immediately |               | Operation   |
                                   +-------------+               +-------------+
                                                                        |
                                                                        v
                                                                 +-------------+
                                                                 | IndexedDB   |
                                                                 | offlineQueue|
                                                                 +-------------+
```

### Coming Back Online

```
+------------------+     +------------------+     +------------------+
|   Network        |     |  Navigator       |     |  offlineStore    |
|   Reconnects     |---->|  'online' event  |---->|  setOnline(true) |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   OfflineBanner  |     |  syncOnReconnect |     |  Background Sync |
|   Hides          |<----|  Setting Check   |---->|  Triggered       |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                         +------------------+     +------------------+
                         |   Conflict       |     |  Process Queue   |
                         |   Detection      |<----|  FIFO Order      |
                         +------------------+     +------------------+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
             +-------------+             +-------------+
             | No Conflict |             | Conflict    |
             | Apply       |             | Detected    |
             +-------------+             +-------------+
                                                |
                         +----------------------+----------------------+
                         |                      |                      |
                         v                      v                      v
                  +-------------+        +-------------+        +-------------+
                  | Auto-resolve|        | User        |        | Queue for   |
                  | (newest)    |        | Resolution  |        | Later       |
                  +-------------+        +-------------+        +-------------+
```

### Sync Conflict Resolution

```
+------------------+     +------------------+     +------------------+
|   Local Change   |     |   Remote Change  |     |   Compare        |
|   (timestamp A)  |---->|   (timestamp B)  |---->|   Checksums      |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                  +------------------+
                                                  |   Conflict?      |
                                                  +------------------+
                                                    |           |
                                           No      |           |   Yes
                                                   v           v
                                           +-------------+  +------------------+
                                           | Merge       |  | ConflictDialog   |
                                           | Automatically|  | User Choice      |
                                           +-------------+  +------------------+
                                                                    |
                                    +-------------------------------+
                                    |               |               |
                                    v               v               v
                             +----------+    +----------+    +----------+
                             | Keep     |    | Keep     |    | Manual   |
                             | Local    |    | Remote   |    | Merge    |
                             +----------+    +----------+    +----------+
```

### Offline Storage Schema

```
IndexedDB: paperflow-offline (v1)
+------------------+-------------------------------------------+
|   Store          |   Purpose                                 |
+------------------+-------------------------------------------+
|   documents      |   PDF binary data for offline access      |
|   metadata       |   Document metadata (name, size, etc.)    |
|   annotations    |   Annotations per document                |
|   editHistory    |   Edit history for sync tracking          |
|   settings       |   Offline availability settings           |
|   syncQueue      |   Pending operations to sync              |
+------------------+-------------------------------------------+
```

---

## Caching Strategy

PaperFlow implements multiple caching layers to optimize performance and reduce memory usage.

### Thumbnail Cache (LRU)

```
+------------------+     +------------------+     +------------------+
|   Render         |     |  ThumbnailCache  |     |   Check Cache    |
|   Thumbnail      |---->|   .get()         |---->|   Hit / Miss     |
+------------------+     +------------------+     +------------------+
                                                    |           |
                                           Hit     |           |   Miss
                                                   v           v
                                           +-------------+  +------------------+
                                           | Return      |  | Render Page      |
                                           | Cached      |  | to Canvas        |
                                           +-------------+  +------------------+
                                                                    |
                                                                    v
                                                            +------------------+
                                                            | Cache Result     |
                                                            | LRU Eviction     |
                                                            +------------------+
```

```
ThumbnailCache
+------------------+
| maxSize: 200     |
| cache: Map<string, string>
+------------------+
| Key Format:      |
| {docId}:{page}:{scale}
+------------------+
| LRU Eviction:    |
| Delete oldest when full
+------------------+
```

### Recent Files Cache

```
+------------------+     +------------------+     +------------------+
|   Open File      |     |  IndexedDB       |     |  recentFiles     |
|                  |---->|  addRecentFile() |---->|  Store           |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          | index: lastOpened (desc)
                                                          v
                                                  +------------------+
                                                  |   Limit: 10      |
                                                  |   Sorted by date |
                                                  +------------------+
```

### Font Cache

```
+------------------+     +------------------+     +------------------+
|   Render Text    |     |  fontMatcher     |     |   Font Cache     |
|   with Font      |---->|   findFont()     |---->|   Check          |
+------------------+     +------------------+     +------------------+
                                                    |           |
                                           Cached  |           |   Not Cached
                                                   v           v
                                           +-------------+  +------------------+
                                           | Return      |  | Load Font        |
                                           | Font Data   |  | from Network     |
                                           +-------------+  +------------------+
                                                                    |
                                                                    v
                                                            +------------------+
                                                            | Cache Font       |
                                                            | (Service Worker) |
                                                            +------------------+
```

### Service Worker Caching

```
+------------------+-------------------------------------------+
|   Request Type   |   Caching Strategy                        |
+------------------+-------------------------------------------+
|   Static Assets  |   Stale-While-Revalidate                  |
|   (.js, .css)    |   Cache: paperflow-static-v1              |
+------------------+-------------------------------------------+
|   PDF Documents  |   Cache-First (offline-available)         |
|   (.pdf)         |   Cache: paperflow-pdfs-v1                |
+------------------+-------------------------------------------+
|   Images         |   Cache-First                             |
|   (.png, .jpg)   |   Cache: paperflow-images-v1              |
+------------------+-------------------------------------------+
|   Fonts          |   Cache-First                             |
|   (.woff2)       |   Cache: paperflow-fonts-v1               |
+------------------+-------------------------------------------+
|   API Calls      |   Network-First (with offline fallback)   |
|   (/api/*)       |   Cache: paperflow-api-v1                 |
+------------------+-------------------------------------------+
```

### Cache Expiration

| Cache | Expiration | Max Size |
|-------|------------|----------|
| Thumbnails | Session | 200 entries |
| Recent Files | Never | 10 entries |
| Static Assets | 30 days | Unlimited |
| PDF Documents | 90 days | 50 documents |
| Fonts | 30 days | Unlimited |

---

## Error Handling Flow

PaperFlow implements comprehensive error handling with error boundaries, store error states, and user notifications.

### Error Boundary Flow

```
+------------------+     +------------------+     +------------------+
|   Component      |     |  Error Thrown    |     |  ErrorBoundary   |
|   Renders        |---->|  (any level)     |---->|  componentDidCatch
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                  +------------------+
                                                  |   Log to         |
                                                  |   Monitoring     |
                                                  +------------------+
                                                          |
                                                          v
                                                  +------------------+
                                                  |   Display        |
                                                  |   Fallback UI    |
                                                  +------------------+
```

### Store Error States

```
+------------------+     +------------------+     +------------------+
|   Async Action   |     |  try/catch       |     |  Error Caught    |
|   (e.g. loadDoc) |---->|  Wrapper         |---->|                  |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|   UI Shows       |     |  set({ error })  |     |  Store State     |
|   Error Message  |<----|  in store        |<----|  Updated         |
+------------------+     +------------------+     +------------------+
```

### Error Categories and Handling

```
+------------------+-------------------------------------------+
|   Error Type     |   Handling Strategy                       |
+------------------+-------------------------------------------+
|   PDF Parse      |   Show error in documentStore             |
|                  |   Display user-friendly message           |
+------------------+-------------------------------------------+
|   Network        |   Queue operation for retry               |
|                  |   Show offline indicator                  |
+------------------+-------------------------------------------+
|   Validation     |   Update formStore.validationErrors       |
|                  |   Highlight invalid fields                |
+------------------+-------------------------------------------+
|   Save/Export    |   Show toast notification                 |
|                  |   Offer retry option                      |
+------------------+-------------------------------------------+
|   IPC (Electron) |   Return { success: false, error }        |
|                  |   Log to crash reporter                   |
+------------------+-------------------------------------------+
|   Unhandled      |   Error boundary catches                  |
|                  |   Report to Sentry                        |
+------------------+-------------------------------------------+
```

### Monitoring Integration

```
+------------------+     +------------------+     +------------------+
|   Error Occurs   |     |  Error Handler   |     |  Sentry          |
|                  |---->|                  |---->|  captureException|
+------------------+     +------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         |   Local Log      |
                         |   (console)      |
                         +------------------+
                                  |
                                  v
                         +------------------+
                         |   Analytics      |
                         |   Event          |
                         +------------------+
```

### Recovery Flow

```
+------------------+     +------------------+     +------------------+
|   Error State    |     |  User Action     |     |  Recovery        |
|   Displayed      |---->|  (Retry / Reset) |---->|  Attempt         |
+------------------+     +------------------+     +------------------+
                                                          |
                           +------------------------------+
                           |                              |
                           v                              v
                    +-------------+               +-------------+
                    | Clear Error |               | Reset Store |
                    | Retry Action|               | Reload App  |
                    +-------------+               +-------------+
```

---

## Summary

PaperFlow's data flow architecture follows these key principles:

1. **Unidirectional Data Flow**: UI triggers actions -> Stores update state -> Components re-render
2. **Separation of Concerns**: Each layer has specific responsibilities
3. **Type Safety**: TypeScript interfaces define all data structures and IPC channels
4. **Offline-First**: All operations work offline with sync when connected
5. **Error Resilience**: Multiple layers of error handling ensure graceful degradation

### Quick Reference

| Flow | Entry Point | State Store | Core Library | Storage |
|------|-------------|-------------|--------------|---------|
| PDF Load | FileDropZone | documentStore | PDF.js | IndexedDB |
| Annotation | AnnotationLayer | annotationStore | - | IndexedDB |
| Form | FormField | formStore | formParser | - |
| Save | Toolbar/Menu | documentStore | pdf-lib | File System |
| Offline | Network Event | offlineStore | syncEngine | IndexedDB |
| IPC | window.electron | Various | - | Node.js fs |
