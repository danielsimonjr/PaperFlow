import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EditorTool = 'select' | 'hand' | 'text' | 'draw' | 'shape';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Dialogs
  activeDialog: string | null;

  // Theme
  darkMode: boolean;

  // Active editor tool (non-annotation tools)
  activeTool: EditorTool;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  openDialog: (dialogId: string) => void;
  closeDialog: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  setActiveTool: (tool: EditorTool) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: 256,
      activeDialog: null,
      darkMode: false,
      activeTool: 'select' as EditorTool,

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
      },

      openDialog: (dialogId) => {
        set({ activeDialog: dialogId });
      },

      closeDialog: () => {
        set({ activeDialog: null });
      },

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        });
      },

      setDarkMode: (dark) => {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: dark });
      },

      setActiveTool: (tool) => {
        set({ activeTool: tool });
      },
    }),
    {
      name: 'paperflow-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
