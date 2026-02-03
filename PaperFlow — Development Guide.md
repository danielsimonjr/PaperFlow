# PaperFlow Development Guide

## For Claude Code Implementation

This guide accompanies the PaperFlow PRD and provides detailed technical implementation instructions, sprint breakdowns, and task lists for building the PDF editor PWA.

-----

## Table of Contents

1. [Project Setup](#1-project-setup)
1. [Architecture Overview](#2-architecture-overview)
1. [Phase 1: MVP Development (Months 1-6)](#3-phase-1-mvp-development)
1. [Phase 2: Advanced Features (Months 7-12)](#4-phase-2-advanced-features)
1. [Phase 3: Premium & Enterprise (Year 2)](#5-phase-3-premium--enterprise)
1. [Testing Strategy](#6-testing-strategy)
1. [Deployment Pipeline](#7-deployment-pipeline)
1. [Code Standards](#8-code-standards)

-----

## 1. Project Setup

### 1.1 Initialize Project

```bash
# Create project with Vite + React + TypeScript
npm create vite@latest paperflow -- --template react-ts
cd paperflow

# Or with Svelte (alternative)
npm create vite@latest paperflow -- --template svelte-ts
```

### 1.2 Core Dependencies

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
npm install browser-fs-access file-saver jszip

# Dev Dependencies
npm install -D @types/node vitest @testing-library/react
npm install -D playwright @playwright/test
npm install -D eslint prettier eslint-config-prettier
```

### 1.3 Project Structure

```
paperflow/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── maskable-icon.png
│   └── pdf.worker.min.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── viewer/                # PDF viewing components
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── PageCanvas.tsx
│   │   │   ├── Thumbnail.tsx
│   │   │   ├── ThumbnailSidebar.tsx
│   │   │   └── OutlinePanel.tsx
│   │   ├── editor/                # Editing components
│   │   │   ├── TextEditor.tsx
│   │   │   ├── TextBox.tsx
│   │   │   └── FontPicker.tsx
│   │   ├── annotations/           # Annotation components
│   │   │   ├── AnnotationLayer.tsx
│   │   │   ├── Highlight.tsx
│   │   │   ├── StickyNote.tsx
│   │   │   ├── Drawing.tsx
│   │   │   └── ShapeOverlay.tsx
│   │   ├── forms/                 # Form components
│   │   │   ├── FormField.tsx
│   │   │   ├── TextField.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── RadioButton.tsx
│   │   │   └── Dropdown.tsx
│   │   ├── signatures/            # Signature components
│   │   │   ├── SignaturePad.tsx
│   │   │   ├── SignatureModal.tsx
│   │   │   └── SignatureList.tsx
│   │   └── pages/                 # Page management
│   │       ├── PageManager.tsx
│   │       ├── PageThumbnail.tsx
│   │       └── MergeModal.tsx
│   ├── hooks/                     # Custom React hooks
│   │   ├── usePDF.ts
│   │   ├── useAnnotations.ts
│   │   ├── useUndoRedo.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useOffline.ts
│   │   └── useFileSystem.ts
│   ├── stores/                    # Zustand stores
│   │   ├── documentStore.ts
│   │   ├── uiStore.ts
│   │   ├── annotationStore.ts
│   │   ├── historyStore.ts
│   │   └── settingsStore.ts
│   ├── lib/                       # Core libraries
│   │   ├── pdf/
│   │   │   ├── renderer.ts
│   │   │   ├── editor.ts
│   │   │   ├── merger.ts
│   │   │   ├── splitter.ts
│   │   │   └── compressor.ts
│   │   ├── annotations/
│   │   │   ├── manager.ts
│   │   │   └── serializer.ts
│   │   ├── signatures/
│   │   │   ├── canvas.ts
│   │   │   └── storage.ts
│   │   ├── storage/
│   │   │   ├── indexeddb.ts
│   │   │   └── fileSystem.ts
│   │   └── export/
│   │       ├── toWord.ts
│   │       ├── toImage.ts
│   │       └── print.ts
│   ├── pages/                     # Route pages
│   │   ├── Home.tsx
│   │   ├── Editor.tsx
│   │   ├── Settings.tsx
│   │   └── NotFound.tsx
│   ├── utils/                     # Utility functions
│   │   ├── cn.ts                  # classNames helper
│   │   ├── debounce.ts
│   │   ├── fileHelpers.ts
│   │   └── pdfHelpers.ts
│   ├── types/                     # TypeScript types
│   │   ├── pdf.ts
│   │   ├── annotations.ts
│   │   ├── forms.ts
│   │   └── index.ts
│   └── constants/
│       ├── tools.ts
│       ├── shortcuts.ts
│       └── config.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 1.4 Configuration Files

#### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'PaperFlow',
        short_name: 'PaperFlow',
        description: 'The Modern PDF Editor for Everyone',
        theme_color: '#1E3A5F',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/pdfjs-dist/,
            handler: 'CacheFirst',
            options: { cacheName: 'pdfjs-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
});
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1E3A5F' },
        surface: { light: '#ffffff', dark: '#1e293b' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        signature: ['Caveat', 'cursive']
      }
    }
  },
  plugins: []
};
```

-----

## 2. Architecture Overview

### 2.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  Viewer  │  │  Editor  │  │Annotations│  │  Page Manager   ││
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────────┬────────┘│
└───────┼─────────────┼──────────────┼─────────────────┼─────────┘
        │             │              │                 │
        ▼             ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Zustand State Stores                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │documentStore │  │annotationStore│  │    historyStore      │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Core Libraries                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  PDF.js  │  │  pdf-lib │  │Tesseract │  │    IndexedDB    ││
│  │ (render) │  │  (edit)  │  │  (OCR)   │  │   (storage)     ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 State Management Schema

```typescript
// src/types/index.ts

export interface PDFDocument {
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

export interface Annotation {
  id: string;
  pageIndex: number;
  type: 'highlight' | 'underline' | 'strikethrough' | 'note' | 'drawing' | 'shape' | 'stamp';
  bounds: { x: number; y: number; width: number; height: number };
  color: string;
  opacity: number;
  content?: string;
  author?: string;
  createdAt: Date;
  replies?: AnnotationReply[];
}

export interface Signature {
  id: string;
  name: string;
  type: 'draw' | 'type' | 'image';
  data: string; // base64 or SVG path
  createdAt: Date;
}

export interface FormField {
  id: string;
  pageIndex: number;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date';
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  value: string | boolean;
  options?: string[];
  required?: boolean;
  readonly?: boolean;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  before: any;
  after: any;
}
```

-----

## 3. Phase 1: MVP Development

### Sprint Overview (12 Sprints × 2 Weeks = 24 Weeks)

|Sprint|Focus Area                              |Weeks|
|------|----------------------------------------|-----|
|1     |Project Foundation & Basic PDF Rendering|1-2  |
|2     |File Operations & View Modes            |3-4  |
|3     |Annotations Part 1 (Highlight, Notes)   |5-6  |
|4     |Annotations Part 2 (Drawing, Shapes)    |7-8  |
|5     |Form Filling                            |9-10 |
|6     |Digital Signatures                      |11-12|
|7     |Text Editing                            |13-14|
|8     |Page Management                         |15-16|
|9     |Export & Print                          |17-18|
|10    |Polish & Optimization                   |19-20|
|11    |Testing & QA                            |21-22|
|12    |Launch Preparation                      |23-24|

-----

### Sprint 1: Project Foundation & Basic PDF Rendering

**Goal:** Set up development environment and implement basic PDF rendering

#### Todo List

```markdown
## Environment Setup
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS with custom theme
- [ ] Set up ESLint + Prettier with strict rules
- [ ] Configure path aliases in tsconfig.json
- [ ] Set up Git repository with .gitignore
- [ ] Create development and production environment files

## PWA Foundation
- [ ] Install and configure vite-plugin-pwa
- [ ] Create manifest.json with app metadata
- [ ] Generate PWA icons (192px, 512px, maskable)
- [ ] Set up basic service worker with Workbox
- [ ] Implement install prompt handler

## PDF.js Integration
- [ ] Install pdfjs-dist package
- [ ] Configure PDF.js worker (copy to public folder)
- [ ] Create PDFDocument wrapper class
- [ ] Implement document loading from File object
- [ ] Implement document loading from URL
- [ ] Implement document loading from ArrayBuffer

## Basic PDF Viewer
- [ ] Create PDFViewer container component
- [ ] Create PageCanvas component for rendering
- [ ] Implement single page display
- [ ] Add page number indicator
- [ ] Implement previous/next page navigation
- [ ] Add basic zoom controls (in/out/reset)

## Application Shell
- [ ] Create Header component with logo and title
- [ ] Create collapsible Sidebar component
- [ ] Create main layout with flexbox/grid
- [ ] Implement dark mode toggle with localStorage
- [ ] Set up React Router with basic routes

## State Management
- [ ] Install and configure Zustand
- [ ] Create documentStore for PDF state
- [ ] Create uiStore for UI state
- [ ] Create settingsStore for user preferences
- [ ] Implement store persistence with localStorage
```

#### Key Implementation: PDF Renderer

```typescript
// src/lib/pdf/renderer.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

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
      subject: metadata.info?.Subject,
      keywords: metadata.info?.Keywords,
    };
  }
  
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0
  ): Promise<void> {
    if (!this.document) {
      throw new Error('No document loaded');
    }
    
    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d')!;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  }
  
  async getPageDimensions(pageNumber: number): Promise<{ width: number; height: number }> {
    if (!this.document) {
      throw new Error('No document loaded');
    }
    
    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    
    return {
      width: viewport.width,
      height: viewport.height,
    };
  }
  
  async getTextContent(pageNumber: number): Promise<string> {
    if (!this.document) {
      throw new Error('No document loaded');
    }
    
    const page = await this.document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    return textContent.items
      .map((item: any) => item.str)
      .join(' ');
  }
  
  destroy(): void {
    if (this.document) {
      this.document.destroy();
      this.document = null;
    }
  }
}
```

#### Definition of Done

- [ ] PDF files load and render correctly
- [ ] Page navigation works (prev/next/jump)
- [ ] Zoom in/out functions properly
- [ ] Dark mode toggles correctly
- [ ] PWA is installable on Chrome
- [ ] No console errors or warnings

-----

### Sprint 2: File Operations & View Modes

**Goal:** Complete file handling and implement all view modes

#### Todo List

```markdown
## File Opening
- [ ] Implement drag-and-drop file opening
- [ ] Create file picker dialog with browser-fs-access
- [ ] Support opening from URL parameter
- [ ] Add loading indicator during file load
- [ ] Implement error handling for invalid files
- [ ] Create "Open Recent" list with IndexedDB

## File Saving
- [ ] Implement "Save" to original file (File System Access API)
- [ ] Implement "Save As" with new filename
- [ ] Add "Download" fallback for unsupported browsers
- [ ] Show save confirmation toast
- [ ] Track document modified state

## View Modes
- [ ] Implement single page view (default)
- [ ] Implement continuous scroll view
- [ ] Implement two-page spread view
- [ ] Create view mode toggle in toolbar
- [ ] Persist view mode preference
- [ ] Optimize rendering for each mode

## Thumbnail Sidebar
- [ ] Create ThumbnailSidebar component
- [ ] Generate page thumbnails on load
- [ ] Implement lazy loading for large documents
- [ ] Add click-to-navigate functionality
- [ ] Highlight current page in sidebar
- [ ] Add thumbnail size slider

## Search Functionality
- [ ] Create SearchBar component in toolbar
- [ ] Implement text search using PDF.js
- [ ] Highlight search results on pages
- [ ] Add next/previous result navigation
- [ ] Show total match count
- [ ] Add case-sensitive option

## Bookmarks/Outline
- [ ] Parse PDF outline from document
- [ ] Create OutlinePanel component
- [ ] Display nested outline structure
- [ ] Implement click-to-navigate
- [ ] Add expand/collapse for sections
```

#### Key Implementation: Document Store

```typescript
// src/stores/documentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PDFRenderer } from '@lib/pdf/renderer';

interface DocumentState {
  // State
  renderer: PDFRenderer | null;
  fileName: string | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDocument: (file: File) => Promise<void>;
  loadFromUrl: (url: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToWidth: () => void;
  fitToPage: () => void;
  setViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setModified: (modified: boolean) => void;
  closeDocument: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      renderer: null,
      fileName: null,
      pageCount: 0,
      currentPage: 1,
      zoom: 100,
      viewMode: 'single',
      isModified: false,
      isLoading: false,
      error: null,
      
      loadDocument: async (file: File) => {
        set({ isLoading: true, error: null });
        
        try {
          const renderer = new PDFRenderer();
          const arrayBuffer = await file.arrayBuffer();
          const info = await renderer.loadDocument(arrayBuffer);
          
          set({
            renderer,
            fileName: file.name,
            pageCount: info.numPages,
            currentPage: 1,
            isModified: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load document',
            isLoading: false,
          });
        }
      },
      
      loadFromUrl: async (url: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const renderer = new PDFRenderer();
          const info = await renderer.loadDocument(url);
          
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'document.pdf';
          
          set({
            renderer,
            fileName,
            pageCount: info.numPages,
            currentPage: 1,
            isModified: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load document',
            isLoading: false,
          });
        }
      },
      
      setCurrentPage: (page: number) => {
        const { pageCount } = get();
        if (page >= 1 && page <= pageCount) {
          set({ currentPage: page });
        }
      },
      
      nextPage: () => {
        const { currentPage, pageCount } = get();
        if (currentPage < pageCount) {
          set({ currentPage: currentPage + 1 });
        }
      },
      
      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 });
        }
      },
      
      setZoom: (zoom: number) => {
        set({ zoom: Math.max(10, Math.min(400, zoom)) });
      },
      
      zoomIn: () => {
        const { zoom } = get();
        set({ zoom: Math.min(400, zoom + 25) });
      },
      
      zoomOut: () => {
        const { zoom } = get();
        set({ zoom: Math.max(10, zoom - 25) });
      },
      
      fitToWidth: () => {
        // Implementation depends on container width
        set({ zoom: 100 }); // Placeholder
      },
      
      fitToPage: () => {
        // Implementation depends on container dimensions
        set({ zoom: 100 }); // Placeholder
      },
      
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      setModified: (modified: boolean) => {
        set({ isModified: modified });
      },
      
      closeDocument: () => {
        const { renderer } = get();
        if (renderer) {
          renderer.destroy();
        }
        set({
          renderer: null,
          fileName: null,
          pageCount: 0,
          currentPage: 1,
          isModified: false,
          error: null,
        });
      },
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

-----

### Sprint 3: Annotations Part 1 (Highlight, Notes)

**Goal:** Implement text highlighting and sticky notes

#### Todo List

```markdown
## Annotation Infrastructure
- [ ] Create AnnotationLayer component (overlay on pages)
- [ ] Define annotation data models (types, interfaces)
- [ ] Create annotationStore with Zustand
- [ ] Implement annotation ID generation
- [ ] Create annotation coordinate system (PDF coords ↔ screen coords)

## Text Selection
- [ ] Capture text selection events on PDF pages
- [ ] Get selection rectangles from PDF.js text layer
- [ ] Convert screen coordinates to PDF coordinates
- [ ] Show selection popup menu

## Highlight Tool
- [ ] Create Highlight component
- [ ] Implement highlight creation from text selection
- [ ] Support multiple highlight colors (yellow, green, blue, pink, orange)
- [ ] Add opacity control (50-100%)
- [ ] Enable highlight color editing after creation
- [ ] Implement highlight deletion (select + delete key)

## Underline & Strikethrough
- [ ] Create Underline component (positioned below text)
- [ ] Create Strikethrough component (positioned through text)
- [ ] Share selection logic with highlight
- [ ] Add color options

## Sticky Notes
- [ ] Create StickyNote component
- [ ] Implement click-to-place on page
- [ ] Add rich text editor for note content
- [ ] Support note drag to reposition
- [ ] Implement collapse/expand toggle
- [ ] Add note color options
- [ ] Create reply threading UI

## Annotation Toolbar
- [ ] Create floating AnnotationToolbar component
- [ ] Add tool buttons (highlight, underline, strikethrough, note)
- [ ] Show color picker popover
- [ ] Add opacity slider
- [ ] Indicate active tool
```

#### Key Implementation: Annotation Store

```typescript
// src/stores/annotationStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type AnnotationType = 
  | 'highlight' 
  | 'underline' 
  | 'strikethrough' 
  | 'note' 
  | 'drawing' 
  | 'shape' 
  | 'stamp';

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
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

export interface AnnotationReply {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeOpacity: number;
  
  // Actions
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setActiveTool: (tool: AnnotationType | null) => void;
  setActiveColor: (color: string) => void;
  setActiveOpacity: (opacity: number) => void;
  addReply: (annotationId: string, content: string, author: string) => void;
  getPageAnnotations: (pageIndex: number) => Annotation[];
  exportAnnotations: () => string;
  importAnnotations: (json: string) => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  activeTool: null,
  activeColor: '#FFEB3B', // Yellow
  activeOpacity: 0.5,
  
  addAnnotation: (annotationData) => {
    const id = uuidv4();
    const now = new Date();
    
    const annotation: Annotation = {
      ...annotationData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));
    
    return id;
  },
  
  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      ),
    }));
  },
  
  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },
  
  selectAnnotation: (id) => {
    set({ selectedId: id });
  },
  
  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },
  
  setActiveColor: (color) => {
    set({ activeColor: color });
  },
  
  setActiveOpacity: (opacity) => {
    set({ activeOpacity: opacity });
  },
  
  addReply: (annotationId, content, author) => {
    const reply: AnnotationReply = {
      id: uuidv4(),
      content,
      author,
      createdAt: new Date(),
    };
    
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === annotationId
          ? { ...a, replies: [...(a.replies || []), reply], updatedAt: new Date() }
          : a
      ),
    }));
  },
  
  getPageAnnotations: (pageIndex) => {
    return get().annotations.filter((a) => a.pageIndex === pageIndex);
  },
  
  exportAnnotations: () => {
    return JSON.stringify(get().annotations, null, 2);
  },
  
  importAnnotations: (json) => {
    try {
      const imported = JSON.parse(json);
      set({ annotations: imported });
    } catch (error) {
      console.error('Failed to import annotations:', error);
    }
  },
}));
```

-----

### Sprint 4-12: Continued Development

*Each subsequent sprint follows the same detailed structure with:*

- Clear goals
- Comprehensive todo lists with checkboxes
- Key implementation code samples
- Definition of done criteria

*Sprints 4-12 cover:*

- **Sprint 4:** Annotations Part 2 (Drawing, Shapes, Stamps)
- **Sprint 5:** Form Filling (Field detection, all field types)
- **Sprint 6:** Digital Signatures (Draw, Type, Image, Management)
- **Sprint 7:** Text Editing (Inline editing, Text boxes, Font controls)
- **Sprint 8:** Page Management (Reorder, Delete, Rotate, Merge, Split)
- **Sprint 9:** Export & Print (Images, Cloud storage, Print dialog)
- **Sprint 10:** Polish & Optimization (Performance, Mobile, Accessibility)
- **Sprint 11:** Testing & QA (Unit, Integration, E2E tests)
- **Sprint 12:** Launch Preparation (Deployment, Monitoring, Documentation)

-----

## 4. Phase 2: Advanced Features

### OCR Implementation (Sprints 13-14)

```markdown
## Tesseract.js Integration
- [ ] Install tesseract.js package
- [ ] Set up Web Worker for OCR processing
- [ ] Implement language pack loading (on-demand)
- [ ] Create OCR progress tracking

## OCR Workflow
- [ ] Create OCRModal component
- [ ] Add page selection for OCR
- [ ] Implement image preprocessing (contrast, deskew)
- [ ] Run OCR and show progress
- [ ] Display confidence scores

## Text Layer Creation
- [ ] Convert OCR results to PDF text layer
- [ ] Position text accurately over image
- [ ] Make OCR'd text searchable
- [ ] Preserve original page appearance
```

### Form Creation (Sprints 15-16)

```markdown
## Form Designer
- [ ] Create FormDesigner component
- [ ] Implement drag-and-drop field placement
- [ ] Add field type selector palette
- [ ] Create property editor panel

## Field Configuration
- [ ] Configure text field properties (maxLength, format)
- [ ] Set up checkbox/radio groups
- [ ] Define dropdown options
- [ ] Add validation rules
- [ ] Set required fields
- [ ] Configure tab order
```

### Redaction (Sprints 17-18)

```markdown
## Redaction Tool
- [ ] Create RedactionTool component
- [ ] Implement area selection for redaction
- [ ] Support text-based redaction
- [ ] Add redaction appearance options (black box, white box)

## True Redaction
- [ ] Remove actual content (not just cover)
- [ ] Flatten redacted areas
- [ ] Verify redaction completeness
- [ ] Generate redaction certificate
```

-----

## 5. Phase 3: Premium & Enterprise

### AI Features (Year 2 Q1)

- LLM integration for document summarization
- Smart form auto-fill using document context
- Natural language queries about document content
- Automated translation

### Collaboration (Year 2 Q2)

- WebSocket-based real-time sync
- Operational transformation or CRDT for conflict resolution
- User presence and cursors
- Version history with diff view
- Review workflows with assignments

### Enterprise (Year 2 Q3)

- SAML/SSO integration
- Admin dashboard
- Team management
- Audit logging
- Custom branding
- On-premise deployment option

-----

## 6. Testing Strategy

### Test Structure

```
tests/
├── unit/                    # 60% of tests
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
├── integration/             # 30% of tests
│   ├── viewer.test.tsx
│   ├── annotations.test.tsx
│   └── forms.test.tsx
└── e2e/                     # 10% of tests
    ├── open-file.spec.ts
    ├── annotations.spec.ts
    └── signatures.spec.ts
```

### Test Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

-----

## 7. Deployment Pipeline

### GitHub Actions CI/CD

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

-----

## 8. Code Standards

### Naming Conventions

|Type      |Convention            |Example           |
|----------|----------------------|------------------|
|Components|PascalCase            |`PDFViewer.tsx`   |
|Hooks     |camelCase with `use`  |`usePDF.ts`       |
|Stores    |camelCase with `Store`|`documentStore.ts`|
|Utils     |camelCase             |`pdfHelpers.ts`   |
|Types     |PascalCase            |`Annotation`      |
|Constants |SCREAMING_SNAKE       |`MAX_ZOOM`        |

### Commit Format

```
type(scope): description

feat(viewer): add continuous scroll mode
fix(annotations): correct highlight position
docs(readme): update installation steps
```

-----

## Quick Reference

### Keyboard Shortcuts to Implement

|Action       |Shortcut              |
|-------------|----------------------|
|Open file    |`Ctrl/Cmd + O`        |
|Save         |`Ctrl/Cmd + S`        |
|Print        |`Ctrl/Cmd + P`        |
|Undo         |`Ctrl/Cmd + Z`        |
|Redo         |`Ctrl/Cmd + Shift + Z`|
|Find         |`Ctrl/Cmd + F`        |
|Zoom in      |`Ctrl/Cmd + =`        |
|Zoom out     |`Ctrl/Cmd + -`        |
|Next page    |`→` or `Page Down`    |
|Previous page|`←` or `Page Up`      |

### Color Palette

```css
/* Primary */
--primary-900: #1E3A5F;
--primary-700: #2D5A8A;
--primary-500: #3B82F6;

/* Annotations */
--highlight-yellow: #FFEB3B;
--highlight-green: #4CAF50;
--highlight-blue: #2196F3;
--highlight-pink: #E91E63;
--highlight-orange: #FF9800;

/* Status */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
```

-----

*This guide provides Claude Code with everything needed to implement PaperFlow systematically.*