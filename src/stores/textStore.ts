import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TextBox, TextProperties, TextTool } from '@/types/text';
import { useHistoryStore } from './historyStore';

interface TextState {
  /** All text boxes in the document */
  textBoxes: TextBox[];
  /** Currently selected text box ID */
  selectedId: string | null;
  /** Active text editing tool */
  activeTool: TextTool;
  /** Currently editing text box (in edit mode) */
  editingId: string | null;
  /** Default text properties for new text boxes */
  defaultProperties: TextProperties;

  // Actions
  addTextBox: (
    textBox: Omit<TextBox, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateTextBox: (id: string, updates: Partial<TextBox>) => void;
  deleteTextBox: (id: string) => void;
  selectTextBox: (id: string | null) => void;
  setEditingId: (id: string | null) => void;
  setActiveTool: (tool: TextTool) => void;
  setDefaultProperties: (properties: Partial<TextProperties>) => void;
  getPageTextBoxes: (pageIndex: number) => TextBox[];
  getTextBox: (id: string) => TextBox | undefined;
  clearTextBoxes: () => void;
  exportTextBoxes: () => string;
  importTextBoxes: (json: string) => void;
}

const defaultTextProperties: TextProperties = {
  fontFamily: 'Arial',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  alignment: 'left',
  lineSpacing: 1,
};

export const useTextStore = create<TextState>((set, get) => ({
  textBoxes: [],
  selectedId: null,
  activeTool: null,
  editingId: null,
  defaultProperties: defaultTextProperties,

  addTextBox: (textBoxData) => {
    const id = uuidv4();
    const now = new Date();

    const textBox: TextBox = {
      ...textBoxData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      textBoxes: [...state.textBoxes, textBox],
      selectedId: id,
    }));

    // Add to history for undo/redo
    const historyStore = useHistoryStore.getState();
    historyStore.push({
      action: 'Add text box',
      undo: () => {
        set((state) => ({
          textBoxes: state.textBoxes.filter((t) => t.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },
      redo: () => {
        set((state) => ({
          textBoxes: [...state.textBoxes, textBox],
        }));
      },
    });

    return id;
  },

  updateTextBox: (id, updates) => {
    const current = get().textBoxes.find((t) => t.id === id);
    if (!current) return;

    const previousState = { ...current };

    set((state) => ({
      textBoxes: state.textBoxes.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
    }));

    // Add to history for undo/redo
    const historyStore = useHistoryStore.getState();
    historyStore.push({
      action: 'Update text box',
      undo: () => {
        set((state) => ({
          textBoxes: state.textBoxes.map((t) =>
            t.id === id ? previousState : t
          ),
        }));
      },
      redo: () => {
        set((state) => ({
          textBoxes: state.textBoxes.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        }));
      },
    });
  },

  deleteTextBox: (id) => {
    const textBox = get().textBoxes.find((t) => t.id === id);
    if (!textBox) return;

    set((state) => ({
      textBoxes: state.textBoxes.filter((t) => t.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      editingId: state.editingId === id ? null : state.editingId,
    }));

    // Add to history for undo/redo
    const historyStore = useHistoryStore.getState();
    historyStore.push({
      action: 'Delete text box',
      undo: () => {
        set((state) => ({
          textBoxes: [...state.textBoxes, textBox],
        }));
      },
      redo: () => {
        set((state) => ({
          textBoxes: state.textBoxes.filter((t) => t.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },
    });
  },

  selectTextBox: (id) => {
    set({ selectedId: id });
  },

  setEditingId: (id) => {
    set({ editingId: id });
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  setDefaultProperties: (properties) => {
    set((state) => ({
      defaultProperties: { ...state.defaultProperties, ...properties },
    }));
  },

  getPageTextBoxes: (pageIndex) => {
    return get().textBoxes.filter((t) => t.pageIndex === pageIndex);
  },

  getTextBox: (id) => {
    return get().textBoxes.find((t) => t.id === id);
  },

  clearTextBoxes: () => {
    set({ textBoxes: [], selectedId: null, editingId: null });
  },

  exportTextBoxes: () => {
    return JSON.stringify(get().textBoxes, null, 2);
  },

  importTextBoxes: (json) => {
    try {
      const imported = JSON.parse(json);
      set({ textBoxes: imported });
    } catch (error) {
      console.error('Failed to import text boxes:', error);
    }
  },
}));
