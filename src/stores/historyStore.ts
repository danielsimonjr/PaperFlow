import { create } from 'zustand';

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;

  // Actions
  push: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

let historyId = 0;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  push: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `history-${++historyId}`,
      timestamp: new Date(),
    };

    set((state) => ({
      past: [...state.past.slice(-state.maxHistory + 1), newEntry],
      future: [],
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const entry = past[past.length - 1];
    if (!entry) return;

    entry.undo();

    set({
      past: past.slice(0, -1),
      future: [entry, ...future],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const entry = future[0];
    if (!entry) return;

    entry.redo();

    set({
      past: [...past, entry],
      future: future.slice(1),
    });
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  clear: () => {
    set({ past: [], future: [] });
  },
}));
