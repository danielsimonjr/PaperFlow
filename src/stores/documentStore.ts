import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DocumentState {
  // State
  fileName: string | null;
  fileData: ArrayBuffer | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  viewMode: 'single' | 'continuous' | 'spread';
  isModified: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDocument: (file: File) => Promise<void>;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setModified: (modified: boolean) => void;
  closeDocument: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      fileName: null,
      fileData: null,
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
          const arrayBuffer = await file.arrayBuffer();
          // TODO: Initialize PDF.js renderer and get page count

          set({
            fileName: file.name,
            fileData: arrayBuffer,
            pageCount: 0, // Will be set by PDF.js
            currentPage: 1,
            isModified: false,
            isLoading: false,
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

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setModified: (modified: boolean) => {
        set({ isModified: modified });
      },

      closeDocument: () => {
        set({
          fileName: null,
          fileData: null,
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
