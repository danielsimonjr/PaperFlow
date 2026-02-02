import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Quiet hours configuration for notifications
 */
interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

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

  // Forms
  formAutoAdvance: boolean; // Auto-advance to next field on completion
  formAutoSave: boolean; // Auto-save form progress

  // Signatures
  savedSignatures: string[]; // base64 encoded

  // System Tray (Electron)
  minimizeToTray: boolean;
  closeToTray: boolean;
  showTrayIcon: boolean;

  // Notifications (Electron)
  notificationsEnabled: boolean;
  notificationSound: boolean;
  notificationQuietHours: QuietHoursConfig;
  notifyOnSave: boolean;
  notifyOnExport: boolean;
  notifyOnBackgroundComplete: boolean;

  // Startup (Electron)
  launchOnStartup: boolean;
  startMinimized: boolean;

  // Actions
  setDefaultZoom: (zoom: number) => void;
  setDefaultViewMode: (mode: 'single' | 'continuous' | 'spread') => void;
  setSmoothScrolling: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (seconds: number) => void;
  setDefaultHighlightColor: (color: string) => void;
  setDefaultAnnotationOpacity: (opacity: number) => void;
  setFormAutoAdvance: (enabled: boolean) => void;
  setFormAutoSave: (enabled: boolean) => void;
  addSignature: (signature: string) => void;
  removeSignature: (index: number) => void;
  setMinimizeToTray: (enabled: boolean) => void;
  setCloseToTray: (enabled: boolean) => void;
  setShowTrayIcon: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationSound: (enabled: boolean) => void;
  setNotificationQuietHours: (config: QuietHoursConfig) => void;
  setNotifyOnSave: (enabled: boolean) => void;
  setNotifyOnExport: (enabled: boolean) => void;
  setNotifyOnBackgroundComplete: (enabled: boolean) => void;
  setLaunchOnStartup: (enabled: boolean) => void;
  setStartMinimized: (enabled: boolean) => void;
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
  formAutoAdvance: false,
  formAutoSave: true,
  savedSignatures: [],
  // System Tray defaults
  minimizeToTray: false,
  closeToTray: false,
  showTrayIcon: true,
  // Notification defaults
  notificationsEnabled: true,
  notificationSound: true,
  notificationQuietHours: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
  },
  notifyOnSave: false,
  notifyOnExport: true,
  notifyOnBackgroundComplete: true,
  // Startup defaults
  launchOnStartup: false,
  startMinimized: false,
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

      setFormAutoAdvance: (enabled) => {
        set({ formAutoAdvance: enabled });
      },

      setFormAutoSave: (enabled) => {
        set({ formAutoSave: enabled });
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

      // Tray settings
      setMinimizeToTray: (enabled) => {
        set({ minimizeToTray: enabled });
      },

      setCloseToTray: (enabled) => {
        set({ closeToTray: enabled });
      },

      setShowTrayIcon: (enabled) => {
        set({ showTrayIcon: enabled });
      },

      // Notification settings
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
      },

      setNotificationSound: (enabled) => {
        set({ notificationSound: enabled });
      },

      setNotificationQuietHours: (config) => {
        set({ notificationQuietHours: config });
      },

      setNotifyOnSave: (enabled) => {
        set({ notifyOnSave: enabled });
      },

      setNotifyOnExport: (enabled) => {
        set({ notifyOnExport: enabled });
      },

      setNotifyOnBackgroundComplete: (enabled) => {
        set({ notifyOnBackgroundComplete: enabled });
      },

      // Startup settings
      setLaunchOnStartup: (enabled) => {
        set({ launchOnStartup: enabled });
      },

      setStartMinimized: (enabled) => {
        set({ startMinimized: enabled });
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
