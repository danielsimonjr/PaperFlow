/**
 * Kiosk Store (Sprint 24)
 *
 * Zustand store for managing kiosk mode state and session.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  KioskConfig,
  KioskState,
  KioskSessionState,
  KioskFeature,
} from '@/types/kioskConfig';
import {
  DEFAULT_KIOSK_CONFIG,
  DEFAULT_RESTRICTIONS,
  DEFAULT_AUTO_RESET,
  DEFAULT_UI_CONFIG,
  DEFAULT_EXIT_AUTH,
} from '@/types/kioskConfig';

/**
 * Kiosk store actions
 */
interface KioskActions {
  // Kiosk mode control
  enterKioskMode: (config?: Partial<KioskConfig>) => void;
  exitKioskMode: (pin: string) => boolean;
  adminExitKioskMode: (adminPin: string) => boolean;

  // Configuration
  setConfig: (config: KioskConfig) => void;
  updateConfig: (updates: Partial<KioskConfig>) => void;
  resetConfig: () => void;

  // Session management
  startSession: (documentPath?: string) => void;
  endSession: () => void;
  resetSession: () => void;
  recordActivity: () => void;

  // Document navigation
  setCurrentDocument: (path: string, page?: number) => void;
  setCurrentPage: (page: number) => void;

  // Feature checks
  isFeatureAllowed: (feature: KioskFeature) => boolean;
  isActionAllowed: (action: string) => boolean;

  // Inactivity handling
  startInactivityTimer: () => void;
  stopInactivityTimer: () => void;
  showResetWarning: () => void;
  dismissResetWarning: () => void;

  // Lockout management
  handleFailedAttempt: () => void;
  clearLockout: () => void;
  checkLockout: () => boolean;
}

/**
 * Complete kiosk store type
 */
type KioskStoreState = KioskState & KioskActions;

/**
 * Initial state
 */
const initialState: KioskState = {
  isActive: false,
  config: null,
  session: null,
  inactivityCountdown: null,
  exitAttempts: 0,
  isLocked: false,
  lockoutEndTime: null,
  error: null,
};

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `kiosk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create new session
 */
function createSession(documentPath?: string): KioskSessionState {
  const now = Date.now();
  return {
    sessionId: generateSessionId(),
    startedAt: now,
    lastActivityAt: now,
    currentDocument: documentPath,
    currentPage: 1,
    annotations: [],
    formData: {},
    isActive: true,
  };
}

// Inactivity timer reference
let inactivityTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

/**
 * Kiosk store
 */
export const useKioskStore = create<KioskStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Enter kiosk mode
       */
      enterKioskMode: (config?: Partial<KioskConfig>) => {
        const fullConfig: KioskConfig = {
          ...DEFAULT_KIOSK_CONFIG,
          ...config,
          restrictions: {
            ...DEFAULT_RESTRICTIONS,
            ...config?.restrictions,
          },
          autoReset: {
            ...DEFAULT_AUTO_RESET,
            ...config?.autoReset,
          },
          ui: {
            ...DEFAULT_UI_CONFIG,
            ...config?.ui,
          },
          exitAuth: {
            ...DEFAULT_EXIT_AUTH,
            ...config?.exitAuth,
          },
          enabled: true,
        };

        set({
          isActive: true,
          config: fullConfig,
          session: createSession(fullConfig.homeDocument),
          exitAttempts: 0,
          isLocked: false,
          lockoutEndTime: null,
          error: null,
        });

        // Start inactivity timer
        get().startInactivityTimer();

        // Enter full screen if configured
        if (fullConfig.ui.fullScreen && typeof document !== 'undefined') {
          document.documentElement.requestFullscreen?.().catch(() => {
            // Ignore fullscreen errors
          });
        }
      },

      /**
       * Exit kiosk mode with PIN
       */
      exitKioskMode: (pin: string) => {
        const { config, checkLockout, handleFailedAttempt } = get();

        // Check if locked out
        if (checkLockout()) {
          set({ error: 'Too many failed attempts. Please wait.' });
          return false;
        }

        // Verify PIN
        if (config && pin === config.exitAuth.pin) {
          get().stopInactivityTimer();

          set({
            isActive: false,
            session: null,
            exitAttempts: 0,
            inactivityCountdown: null,
            error: null,
          });

          // Exit full screen
          if (typeof document !== 'undefined' && document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {
              // Ignore fullscreen errors
            });
          }

          return true;
        }

        // Failed attempt
        handleFailedAttempt();
        return false;
      },

      /**
       * Admin exit with separate PIN
       */
      adminExitKioskMode: (adminPin: string) => {
        const { config, checkLockout } = get();

        if (checkLockout()) {
          set({ error: 'Too many failed attempts. Please wait.' });
          return false;
        }

        const expectedPin = config?.exitAuth.adminPin || config?.exitAuth.pin;

        if (adminPin === expectedPin) {
          return get().exitKioskMode(config?.exitAuth.pin || '');
        }

        get().handleFailedAttempt();
        return false;
      },

      /**
       * Set kiosk configuration
       */
      setConfig: (config: KioskConfig) => {
        set({ config });
      },

      /**
       * Update configuration
       */
      updateConfig: (updates: Partial<KioskConfig>) => {
        const { config } = get();
        if (config) {
          set({
            config: {
              ...config,
              ...updates,
            },
          });
        }
      },

      /**
       * Reset to default configuration
       */
      resetConfig: () => {
        set({ config: DEFAULT_KIOSK_CONFIG });
      },

      /**
       * Start a new session
       */
      startSession: (documentPath?: string) => {
        set({ session: createSession(documentPath) });
        get().startInactivityTimer();
      },

      /**
       * End current session
       */
      endSession: () => {
        get().stopInactivityTimer();
        set({ session: null });
      },

      /**
       * Reset session (for auto-reset)
       */
      resetSession: () => {
        const { config } = get();

        get().stopInactivityTimer();

        set({
          session: createSession(config?.homeDocument),
          inactivityCountdown: null,
        });

        get().startInactivityTimer();
      },

      /**
       * Record user activity
       */
      recordActivity: () => {
        const { session, inactivityCountdown } = get();

        if (session) {
          set({
            session: {
              ...session,
              lastActivityAt: Date.now(),
            },
          });
        }

        // Reset countdown if warning was showing
        if (inactivityCountdown !== null) {
          set({ inactivityCountdown: null });
          get().startInactivityTimer();
        }
      },

      /**
       * Set current document
       */
      setCurrentDocument: (path: string, page = 1) => {
        const { session, config } = get();

        // Check if navigation is allowed
        if (config?.restrictions.disableNavigation) {
          return;
        }

        // Check if document is in allowed list
        if (config?.allowedDocuments.length) {
          const isAllowed = config.allowedDocuments.some((pattern) => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              return regex.test(path);
            }
            return path === pattern;
          });

          if (!isAllowed) {
            set({ error: 'Document not allowed in kiosk mode' });
            return;
          }
        }

        if (session) {
          set({
            session: {
              ...session,
              currentDocument: path,
              currentPage: page,
              lastActivityAt: Date.now(),
            },
            error: null,
          });
        }
      },

      /**
       * Set current page
       */
      setCurrentPage: (page: number) => {
        const { session } = get();

        if (session) {
          set({
            session: {
              ...session,
              currentPage: page,
              lastActivityAt: Date.now(),
            },
          });
        }
      },

      /**
       * Check if a feature is allowed
       */
      isFeatureAllowed: (feature: KioskFeature) => {
        const { isActive, config } = get();

        if (!isActive || !config) {
          return true; // Not in kiosk mode, all allowed
        }

        return config.allowedFeatures.includes(feature);
      },

      /**
       * Check if an action is allowed
       */
      isActionAllowed: (action: string) => {
        const { isActive, config } = get();

        if (!isActive || !config) {
          return true;
        }

        const restrictions = config.restrictions;

        const actionMap: Record<string, keyof typeof restrictions> = {
          save: 'disableSave',
          print: 'disablePrint',
          export: 'disableExport',
          share: 'disableShare',
          settings: 'disableSettings',
          navigate: 'disableNavigation',
          'external-link': 'disableExternalLinks',
          'context-menu': 'disableContextMenu',
          shortcut: 'disableShortcuts',
          'text-selection': 'disableTextSelection',
          annotate: 'disableAnnotations',
          'form-edit': 'disableFormEditing',
        };

        const restrictionKey = actionMap[action];
        if (restrictionKey) {
          return !restrictions[restrictionKey];
        }

        return true;
      },

      /**
       * Start inactivity timer
       */
      startInactivityTimer: () => {
        const { config } = get();

        if (!config?.autoReset.enabled) {
          return;
        }

        // Clear existing timer
        get().stopInactivityTimer();

        // Set new timer
        const timeoutMs = config.autoReset.timeoutSeconds * 1000;
        inactivityTimer = setTimeout(() => {
          get().showResetWarning();
        }, timeoutMs);
      },

      /**
       * Stop inactivity timer
       */
      stopInactivityTimer: () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
          inactivityTimer = null;
        }
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
      },

      /**
       * Show reset warning countdown
       */
      showResetWarning: () => {
        const { config } = get();

        if (!config?.autoReset.showWarning) {
          get().resetSession();
          return;
        }

        let countdown = config.autoReset.warningSeconds;
        set({ inactivityCountdown: countdown });

        countdownTimer = setInterval(() => {
          countdown--;

          if (countdown <= 0) {
            get().stopInactivityTimer();
            get().resetSession();
          } else {
            set({ inactivityCountdown: countdown });
          }
        }, 1000);
      },

      /**
       * Dismiss reset warning
       */
      dismissResetWarning: () => {
        get().stopInactivityTimer();
        set({ inactivityCountdown: null });
        get().startInactivityTimer();
      },

      /**
       * Handle failed exit attempt
       */
      handleFailedAttempt: () => {
        const { exitAttempts, config } = get();
        const newAttempts = exitAttempts + 1;

        if (config && newAttempts >= config.exitAuth.maxAttempts) {
          const lockoutEndTime = Date.now() + config.exitAuth.lockoutSeconds * 1000;
          set({
            exitAttempts: newAttempts,
            isLocked: true,
            lockoutEndTime,
            error: `Too many failed attempts. Locked for ${config.exitAuth.lockoutSeconds} seconds.`,
          });
        } else {
          set({
            exitAttempts: newAttempts,
            error: 'Incorrect PIN',
          });
        }
      },

      /**
       * Clear lockout
       */
      clearLockout: () => {
        set({
          exitAttempts: 0,
          isLocked: false,
          lockoutEndTime: null,
          error: null,
        });
      },

      /**
       * Check if currently locked out
       */
      checkLockout: () => {
        const { isLocked, lockoutEndTime, clearLockout } = get();

        if (!isLocked || !lockoutEndTime) {
          return false;
        }

        if (Date.now() >= lockoutEndTime) {
          clearLockout();
          return false;
        }

        return true;
      },
    }),
    {
      name: 'paperflow-kiosk',
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

/**
 * Hook for checking if in kiosk mode
 */
export function useIsKioskMode(): boolean {
  return useKioskStore((state) => state.isActive);
}

/**
 * Hook for checking feature availability in kiosk mode
 */
export function useKioskFeature(feature: KioskFeature): boolean {
  const isActive = useKioskStore((state) => state.isActive);
  const isFeatureAllowed = useKioskStore((state) => state.isFeatureAllowed);

  if (!isActive) return true;
  return isFeatureAllowed(feature);
}

/**
 * Hook for kiosk restrictions
 */
export function useKioskRestrictions() {
  const config = useKioskStore((state) => state.config);
  const isActive = useKioskStore((state) => state.isActive);

  if (!isActive || !config) {
    return null;
  }

  return config.restrictions;
}

export default useKioskStore;
