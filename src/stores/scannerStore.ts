/**
 * Scanner Store
 *
 * Zustand store for scanner state, available devices,
 * scan settings, and scan history.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ScannerDevice,
  ScanSettings,
  ScanResult,
  ScanColorMode,
  ScanResolution,
  ScanPaperSize,
  ScanProfile,
} from '@lib/scanner/types';

/**
 * Scan history entry
 */
export interface ScanHistoryEntry {
  id: string;
  deviceName: string;
  timestamp: number;
  pageCount: number;
  resolution: ScanResolution;
  colorMode: ScanColorMode;
  paperSize: ScanPaperSize;
  thumbnailUrl?: string;
}

/**
 * Scanner state
 */
interface ScannerState {
  // Devices
  devices: ScannerDevice[];
  selectedDevice: ScannerDevice | null;
  isLoadingDevices: boolean;

  // Scan settings
  settings: ScanSettings;
  profiles: ScanProfile[];

  // Scan state
  isScanning: boolean;
  scanProgress: number;
  currentScanResult: ScanResult | null;
  batchPages: ScanResult[];

  // History
  history: ScanHistoryEntry[];
  scanHistory: ScanResult[];

  // UI state
  previewUrl: string | null;
  showSettings: boolean;
  showPreview: boolean;

  // Actions - Devices
  setDevices: (devices: ScannerDevice[]) => void;
  selectDevice: (device: ScannerDevice | null) => void;
  setLoadingDevices: (loading: boolean) => void;
  refreshDevices: () => Promise<void>;

  // Actions - Settings
  updateSettings: (settings: Partial<ScanSettings>) => void;
  resetSettings: () => void;
  applyProfile: (profileId: string) => void;

  // Actions - Profiles
  addProfile: (profile: Omit<ScanProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProfile: (id: string, updates: Partial<ScanProfile>) => void;
  deleteProfile: (id: string) => void;

  // Actions - Scanning
  startScan: () => void;
  completeScan: (result: ScanResult) => void;
  cancelScan: () => void;
  setScanProgress: (progress: number) => void;
  addBatchPage: (page: ScanResult) => void;
  clearBatchPages: () => void;

  // Actions - History
  addToHistory: (entry: Omit<ScanHistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  addScanToHistory: (scan: ScanResult) => void;
  clearScanHistory: () => void;

  // Actions - UI
  setPreviewUrl: (url: string | null) => void;
  setShowSettings: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
}

/**
 * Default scan settings
 */
const defaultSettings: ScanSettings = {
  resolution: 300,
  colorMode: 'color',
  paperSize: 'auto',
  duplex: false,
  useADF: false,
  brightness: 0,
  contrast: 0,
  autoDetect: true,
  autoCorrect: true,
};

/**
 * Default scan profiles
 */
const defaultProfiles: ScanProfile[] = [
  {
    id: 'document',
    name: 'Document',
    description: 'Standard document scanning',
    settings: {
      resolution: 300,
      colorMode: 'color',
      paperSize: 'auto',
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'photo',
    name: 'Photo',
    description: 'High-quality photo scanning',
    settings: {
      resolution: 600,
      colorMode: 'color',
      paperSize: 'auto',
      autoDetect: false,
      autoCorrect: false,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'text',
    name: 'Text/OCR',
    description: 'Optimized for text recognition',
    settings: {
      resolution: 300,
      colorMode: 'grayscale',
      paperSize: 'auto',
      brightness: 10,
      contrast: 20,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'draft',
    name: 'Draft',
    description: 'Quick low-resolution scan',
    settings: {
      resolution: 150,
      colorMode: 'color',
      paperSize: 'auto',
      autoDetect: true,
      autoCorrect: false,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Scanner store
 */
export const useScannerStore = create<ScannerState>()(
  persist(
    (set, get) => ({
      // Initial state
      devices: [],
      selectedDevice: null,
      isLoadingDevices: false,
      settings: defaultSettings,
      profiles: defaultProfiles,
      isScanning: false,
      scanProgress: 0,
      currentScanResult: null,
      batchPages: [],
      history: [],
      scanHistory: [],
      previewUrl: null,
      showSettings: false,
      showPreview: false,

      // Device actions
      setDevices: (devices) => set({ devices }),

      selectDevice: (device) =>
        set({
          selectedDevice: device,
        }),

      setLoadingDevices: (loading) => set({ isLoadingDevices: loading }),

      refreshDevices: async () => {
        set({ isLoadingDevices: true });
        // This would call the IPC to enumerate devices
        // For now, it's a placeholder
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ isLoadingDevices: false });
      },

      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      applyProfile: (profileId) => {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (profile) {
          set((state) => ({
            settings: { ...state.settings, ...profile.settings },
          }));
        }
      },

      // Profile actions
      addProfile: (profile) => {
        const now = Date.now();
        const newProfile: ScanProfile = {
          ...profile,
          id: `profile-${now}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
      },

      updateProfile: (id, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProfile: (id) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id || p.isDefault),
        }));
      },

      // Scanning actions
      startScan: () =>
        set({
          isScanning: true,
          scanProgress: 0,
          currentScanResult: null,
        }),

      completeScan: (result) =>
        set({
          isScanning: false,
          scanProgress: 100,
          currentScanResult: result,
          previewUrl: result.success ? result.dataUrl : null,
        }),

      cancelScan: () =>
        set({
          isScanning: false,
          scanProgress: 0,
        }),

      setScanProgress: (progress) => set({ scanProgress: progress }),

      addBatchPage: (page) =>
        set((state) => ({
          batchPages: [...state.batchPages, page],
        })),

      clearBatchPages: () => set({ batchPages: [] }),

      // History actions
      addToHistory: (entry) => {
        const newEntry: ScanHistoryEntry = {
          ...entry,
          id: `history-${Date.now()}`,
          timestamp: Date.now(),
        };
        set((state) => ({
          history: [newEntry, ...state.history].slice(0, 100),
        }));
      },

      clearHistory: () => set({ history: [], scanHistory: [] }),

      addScanToHistory: (scan) =>
        set((state) => ({
          scanHistory: [...state.scanHistory, scan],
        })),

      clearScanHistory: () => set({ scanHistory: [] }),

      // UI actions
      setPreviewUrl: (url) => set({ previewUrl: url }),
      setShowSettings: (show) => set({ showSettings: show }),
      setShowPreview: (show) => set({ showPreview: show }),
    }),
    {
      name: 'paperflow-scanner',
      partialize: (state) => ({
        settings: state.settings,
        profiles: state.profiles,
        history: state.history,
      }),
    }
  )
);

export default useScannerStore;
