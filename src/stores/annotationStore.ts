import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Annotation, AnnotationType, AnnotationReply } from '@/types';
import { useHistoryStore } from './historyStore';

// Extended annotation type for Sprint 4 drawing/shape/stamp features
export type ShapeType = 'rectangle' | 'ellipse' | 'arrow' | 'line';
export type StampType = 'approved' | 'rejected' | 'confidential' | 'draft' | 'final' | 'for-review' | 'custom';

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  activeTool: AnnotationType | null;
  activeColor: string;
  activeOpacity: number;
  // Sprint 4: Drawing and shape properties
  activeStrokeWidth: number;
  activeFillColor: string | undefined;
  activeShapeType: ShapeType;
  activeStampType: StampType;

  // Actions
  addAnnotation: (
    annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setActiveTool: (tool: AnnotationType | null) => void;
  setActiveColor: (color: string) => void;
  setActiveOpacity: (opacity: number) => void;
  setActiveStrokeWidth: (width: number) => void;
  setActiveFillColor: (color: string | undefined) => void;
  setActiveShapeType: (shapeType: ShapeType) => void;
  setActiveStampType: (stampType: StampType) => void;
  addReply: (annotationId: string, content: string, author: string) => void;
  getPageAnnotations: (pageIndex: number) => Annotation[];
  exportAnnotations: () => string;
  importAnnotations: (json: string) => void;
  clearAnnotations: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: [],
  selectedId: null,
  activeTool: null,
  activeColor: '#FFEB3B',
  activeOpacity: 0.5,
  // Sprint 4 defaults
  activeStrokeWidth: 2,
  activeFillColor: undefined,
  activeShapeType: 'rectangle',
  activeStampType: 'approved',

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

    // Push to history for undo/redo
    useHistoryStore.getState().push({
      action: `Add ${annotation.type}`,
      undo: () => {
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        }));
      },
      redo: () => {
        set((state) => ({
          annotations: [...state.annotations, annotation],
        }));
      },
    });

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
    const annotation = get().annotations.find((a) => a.id === id);

    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));

    // Push to history for undo/redo
    if (annotation) {
      useHistoryStore.getState().push({
        action: `Delete ${annotation.type}`,
        undo: () => {
          set((state) => ({
            annotations: [...state.annotations, annotation],
          }));
        },
        redo: () => {
          set((state) => ({
            annotations: state.annotations.filter((a) => a.id !== id),
          }));
        },
      });
    }
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

  setActiveStrokeWidth: (width) => {
    set({ activeStrokeWidth: width });
  },

  setActiveFillColor: (color) => {
    set({ activeFillColor: color });
  },

  setActiveShapeType: (shapeType) => {
    set({ activeShapeType: shapeType });
  },

  setActiveStampType: (stampType) => {
    set({ activeStampType: stampType });
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
          ? {
              ...a,
              replies: [...(a.replies || []), reply],
              updatedAt: new Date(),
            }
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

  clearAnnotations: () => {
    set({ annotations: [], selectedId: null });
  },
}));
