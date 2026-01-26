import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Viewing
  defaultZoom: number;
  defaultViewMode: 'single' | 'continuous' | 'spread';
  smoothScrolling: boolean;

  // Editing
  autoSave: boolean;
  autoSaveInterval: number; // in seconds

  // Annotations
  defaultHighlightColor: string;
  defaultAnnotationOpacity: number;

  // Signatures
  savedSignatures: string[]; // base64 encoded

  // Actions
  setDefaultZoom: (zoom: number) => void;
  setDefaultViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setSmoothScrolling: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (seconds: number) => void;
  setDefaultHighlightColor: (color: string) => void;
  setDefaultAnnotationOpacity: (opacity: number) => void;
  addSignature: (signature: string) => void;
  removeSignature: (index: number) => void;
  resetToDefaults: () => void;
}

const defaultSettings = {
  defaultZoom: 100,
  defaultViewMode: 'single' as const,
  smoothScrolling: true,
  autoSave: true,
  autoSaveInterval: 30,
  defaultHighlightColor: '#FFEB3B',
  defaultAnnotationOpacity: 0.5,
  savedSignatures: [],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setDefaultZoom: (zoom) => {
        set({ defaultZoom: Math.max(10, Math.min(400, zoom)) });
      },

      setDefaultViewMode: (mode) => {
        set({ defaultViewMode: mode });
      },

      setSmoothScrolling: (enabled) => {
        set({ smoothScrolling: enabled });
      },

      setAutoSave: (enabled) => {
        set({ autoSave: enabled });
      },

      setAutoSaveInterval: (seconds) => {
        set({ autoSaveInterval: Math.max(10, Math.min(300, seconds)) });
      },

      setDefaultHighlightColor: (color) => {
        set({ defaultHighlightColor: color });
      },

      setDefaultAnnotationOpacity: (opacity) => {
        set({ defaultAnnotationOpacity: Math.max(0.1, Math.min(1, opacity)) });
      },

      addSignature: (signature) => {
        set((state) => ({
          savedSignatures: [...state.savedSignatures, signature],
        }));
      },

      removeSignature: (index) => {
        set((state) => ({
          savedSignatures: state.savedSignatures.filter((_, i) => i !== index),
        }));
      },

      resetToDefaults: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'paperflow-settings',
    }
  )
);
