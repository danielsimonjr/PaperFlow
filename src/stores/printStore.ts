/**
 * Print Store
 *
 * Zustand store for print settings, job queue, printer status, and print history.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Print margins
 */
export interface PrintMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Page range
 */
export interface PageRange {
  from: number;
  to: number;
}

/**
 * Duplex mode
 */
export type DuplexMode = 'simplex' | 'shortEdge' | 'longEdge';

/**
 * Print quality
 */
export type PrintQuality = 'draft' | 'normal' | 'high';

/**
 * Print settings
 */
export interface PrintSettings {
  printerName: string;
  copies: number;
  color: boolean;
  duplex: DuplexMode;
  landscape: boolean;
  paperSize: string;
  margins: PrintMargins;
  scale: number;
  pageRanges: PageRange[];
  collate: boolean;
  quality: PrintQuality;
  printBackground: boolean;
}

/**
 * Printer info
 */
export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  status: 'idle' | 'printing' | 'paused' | 'error' | 'offline' | 'unknown';
  colorCapable: boolean;
  duplexCapable: boolean;
}

/**
 * Print job status
 */
export type PrintJobStatus =
  | 'pending'
  | 'printing'
  | 'completed'
  | 'cancelled'
  | 'error';

/**
 * Print job
 */
export interface PrintJob {
  id: string;
  documentName: string;
  printerName: string;
  status: PrintJobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  pagesPrinted: number;
  totalPages: number;
  error?: string;
  settings: PrintSettings;
}

/**
 * Print preset
 */
export interface PrintPreset {
  id: string;
  name: string;
  description?: string;
  settings: Partial<PrintSettings>;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Print history entry
 */
export interface PrintHistoryEntry {
  id: string;
  documentName: string;
  printerName: string;
  timestamp: number;
  pages: number;
  status: 'completed' | 'cancelled' | 'error';
  error?: string;
}

/**
 * Default print settings
 */
const defaultSettings: PrintSettings = {
  printerName: '',
  copies: 1,
  color: true,
  duplex: 'simplex',
  landscape: false,
  paperSize: 'Letter',
  margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch margins
  scale: 100,
  pageRanges: [],
  collate: true,
  quality: 'normal',
  printBackground: true,
};

/**
 * Default print presets
 */
const defaultPresets: PrintPreset[] = [
  {
    id: 'draft',
    name: 'Draft',
    description: 'Quick draft printing - grayscale, low quality',
    settings: {
      color: false,
      quality: 'draft',
      duplex: 'simplex',
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'final',
    name: 'Final',
    description: 'High quality color printing',
    settings: {
      color: true,
      quality: 'high',
      duplex: 'simplex',
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'eco',
    name: 'Eco',
    description: 'Eco-friendly duplex printing',
    settings: {
      color: false,
      quality: 'normal',
      duplex: 'longEdge',
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'booklet',
    name: 'Booklet',
    description: 'Booklet printing setup',
    settings: {
      landscape: true,
      duplex: 'shortEdge',
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Print state
 */
interface PrintState {
  // Settings
  settings: PrintSettings;
  presets: PrintPreset[];

  // Printers
  printers: PrinterInfo[];
  selectedPrinter: PrinterInfo | null;
  isLoadingPrinters: boolean;

  // Job queue
  jobs: PrintJob[];
  activeJob: PrintJob | null;

  // History
  history: PrintHistoryEntry[];

  // UI state
  isPreviewOpen: boolean;
  isSettingsOpen: boolean;
  isPrinting: boolean;

  // Actions - Settings
  updateSettings: (settings: Partial<PrintSettings>) => void;
  resetSettings: () => void;
  applyPreset: (presetId: string) => void;

  // Actions - Presets
  addPreset: (preset: Omit<PrintPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreset: (id: string, updates: Partial<PrintPreset>) => void;
  deletePreset: (id: string) => void;

  // Actions - Printers
  setPrinters: (printers: PrinterInfo[]) => void;
  selectPrinter: (printer: PrinterInfo | null) => void;
  setLoadingPrinters: (loading: boolean) => void;

  // Actions - Jobs
  addJob: (job: Omit<PrintJob, 'id' | 'createdAt' | 'status' | 'pagesPrinted'>) => string;
  updateJob: (id: string, updates: Partial<PrintJob>) => void;
  cancelJob: (id: string) => void;
  removeJob: (id: string) => void;
  clearCompletedJobs: () => void;

  // Actions - History
  addToHistory: (entry: Omit<PrintHistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;

  // Actions - UI
  setPreviewOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setIsPrinting: (printing: boolean) => void;
}

/**
 * Print store
 */
export const usePrintStore = create<PrintState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      presets: defaultPresets,
      printers: [],
      selectedPrinter: null,
      isLoadingPrinters: false,
      jobs: [],
      activeJob: null,
      history: [],
      isPreviewOpen: false,
      isSettingsOpen: false,
      isPrinting: false,

      // Settings actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (preset) {
          set((state) => ({
            settings: { ...state.settings, ...preset.settings },
          }));
        }
      },

      // Preset actions
      addPreset: (preset) => {
        const now = Date.now();
        const newPreset: PrintPreset = {
          ...preset,
          id: `preset-${now}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id || p.isDefault),
        }));
      },

      // Printer actions
      setPrinters: (printers) => {
        set({ printers });
        // Auto-select default printer if no printer is selected
        const { selectedPrinter } = get();
        if (!selectedPrinter) {
          const defaultPrinter = printers.find((p) => p.isDefault);
          if (defaultPrinter) {
            set({
              selectedPrinter: defaultPrinter,
              settings: { ...get().settings, printerName: defaultPrinter.name },
            });
          }
        }
      },

      selectPrinter: (printer) => {
        set({
          selectedPrinter: printer,
          settings: { ...get().settings, printerName: printer?.name || '' },
        });
      },

      setLoadingPrinters: (loading) => {
        set({ isLoadingPrinters: loading });
      },

      // Job actions
      addJob: (job) => {
        const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newJob: PrintJob = {
          ...job,
          id,
          createdAt: Date.now(),
          status: 'pending',
          pagesPrinted: 0,
        };
        set((state) => ({
          jobs: [...state.jobs, newJob],
        }));
        return id;
      },

      updateJob: (id, updates) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
          activeJob:
            state.activeJob?.id === id
              ? { ...state.activeJob, ...updates }
              : state.activeJob,
        }));
      },

      cancelJob: (id) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, status: 'cancelled' } : job
          ),
          activeJob:
            state.activeJob?.id === id
              ? { ...state.activeJob, status: 'cancelled' }
              : state.activeJob,
        }));
      },

      removeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          activeJob: state.activeJob?.id === id ? null : state.activeJob,
        }));
      },

      clearCompletedJobs: () => {
        set((state) => ({
          jobs: state.jobs.filter(
            (job) => job.status !== 'completed' && job.status !== 'cancelled'
          ),
        }));
      },

      // History actions
      addToHistory: (entry) => {
        const newEntry: PrintHistoryEntry = {
          ...entry,
          id: `history-${Date.now()}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 100), // Keep last 100 entries
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      // UI actions
      setPreviewOpen: (open) => {
        set({ isPreviewOpen: open });
      },

      setSettingsOpen: (open) => {
        set({ isSettingsOpen: open });
      },

      setIsPrinting: (printing) => {
        set({ isPrinting: printing });
      },
    }),
    {
      name: 'paperflow-print',
      partialize: (state) => ({
        settings: state.settings,
        presets: state.presets,
        history: state.history,
      }),
    }
  )
);

export default usePrintStore;
