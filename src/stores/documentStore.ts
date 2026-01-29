import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PDFRenderer } from '@lib/pdf/renderer';
import type { PDFDocumentInfo } from '@/types/pdf';

interface DocumentState {
  // State
  fileName: string | null;
  fileData: ArrayBuffer | null;
  documentInfo: PDFDocumentInfo | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  renderer: PDFRenderer | null;

  // Actions
  loadDocument: (file: File) => Promise<void>;
  loadDocumentFromArrayBuffer: (data: ArrayBuffer | Uint8Array, fileName: string) => Promise<void>;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToWidth: () => void;
  fitToPage: () => void;
  setViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setModified: (modified: boolean) => void;
  closeDocument: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
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

      loadDocument: async (file: File) => {
        set({ isLoading: true, error: null });

        try {
          const arrayBuffer = await file.arrayBuffer();
          await get().loadDocumentFromArrayBuffer(arrayBuffer, file.name);
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load document',
            isLoading: false,
          });
        }
      },

      loadDocumentFromArrayBuffer: async (data: ArrayBuffer | Uint8Array, fileName: string) => {
        set({ isLoading: true, error: null });

        const arrayBuffer = data instanceof Uint8Array ? data.buffer as ArrayBuffer : data;

        try {
          // Clean up existing renderer
          const existingRenderer = get().renderer;
          if (existingRenderer) {
            existingRenderer.destroy();
          }

          // Create new renderer and load document
          const renderer = new PDFRenderer();
          const documentInfo = await renderer.loadDocument(arrayBuffer);

          set({
            fileName,
            fileData: arrayBuffer,
            documentInfo,
            pageCount: documentInfo.numPages,
            currentPage: 1,
            isModified: false,
            isLoading: false,
            error: null,
            renderer,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to load document',
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

      resetZoom: () => {
        set({ zoom: 100 });
      },

      fitToWidth: () => {
        // This will be implemented when we have container dimensions
        // For now, set to a reasonable default
        set({ zoom: 100 });
      },

      fitToPage: () => {
        // This will be implemented when we have container dimensions
        // For now, set to a reasonable default
        set({ zoom: 75 });
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
          fileName: null,
          fileData: null,
          documentInfo: null,
          pageCount: 0,
          currentPage: 1,
          isModified: false,
          error: null,
          renderer: null,
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
