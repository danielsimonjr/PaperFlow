/**
 * Kiosk Mode Module (Sprint 24)
 *
 * Core kiosk mode functionality and configuration.
 */

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
 * Kiosk mode manager
 */
export class KioskMode {
  private config: KioskConfig;
  private state: KioskState;
  private listeners: Set<(state: KioskState) => void> = new Set();
  private inactivityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<KioskConfig>) {
    this.config = this.mergeConfig(config);
    this.state = this.createInitialState();
  }

  /**
   * Merge config with defaults
   */
  private mergeConfig(config?: Partial<KioskConfig>): KioskConfig {
    if (!config) {
      return { ...DEFAULT_KIOSK_CONFIG };
    }

    return {
      ...DEFAULT_KIOSK_CONFIG,
      ...config,
      restrictions: {
        ...DEFAULT_RESTRICTIONS,
        ...config.restrictions,
      },
      autoReset: {
        ...DEFAULT_AUTO_RESET,
        ...config.autoReset,
      },
      ui: {
        ...DEFAULT_UI_CONFIG,
        ...config.ui,
      },
      exitAuth: {
        ...DEFAULT_EXIT_AUTH,
        ...config.exitAuth,
      },
    };
  }

  /**
   * Create initial state
   */
  private createInitialState(): KioskState {
    return {
      isActive: false,
      config: null,
      session: null,
      inactivityCountdown: null,
      exitAttempts: 0,
      isLocked: false,
      lockoutEndTime: null,
      error: null,
    };
  }

  /**
   * Enter kiosk mode
   */
  enter(): void {
    this.state = {
      ...this.state,
      isActive: true,
      config: this.config,
      session: this.createSession(),
      exitAttempts: 0,
      isLocked: false,
      lockoutEndTime: null,
      error: null,
    };

    this.startInactivityMonitor();
    this.enterFullScreen();
    this.notifyListeners();
  }

  /**
   * Exit kiosk mode with PIN
   */
  exit(pin: string): boolean {
    if (!this.state.isActive || !this.state.config) {
      return false;
    }

    // Check lockout
    if (this.isLockedOut()) {
      this.state.error = 'Too many failed attempts. Please wait.';
      this.notifyListeners();
      return false;
    }

    // Verify PIN
    if (pin !== this.state.config.exitAuth.pin) {
      this.handleFailedAttempt();
      return false;
    }

    // Exit kiosk mode
    this.stopInactivityMonitor();
    this.exitFullScreen();

    this.state = {
      ...this.state,
      isActive: false,
      session: null,
      inactivityCountdown: null,
      error: null,
    };

    this.notifyListeners();
    return true;
  }

  /**
   * Check if locked out
   */
  private isLockedOut(): boolean {
    if (!this.state.isLocked || !this.state.lockoutEndTime) {
      return false;
    }

    if (Date.now() >= this.state.lockoutEndTime) {
      this.state.isLocked = false;
      this.state.lockoutEndTime = null;
      this.state.exitAttempts = 0;
      return false;
    }

    return true;
  }

  /**
   * Handle failed PIN attempt
   */
  private handleFailedAttempt(): void {
    this.state.exitAttempts++;

    if (this.state.config && this.state.exitAttempts >= this.state.config.exitAuth.maxAttempts) {
      this.state.isLocked = true;
      this.state.lockoutEndTime = Date.now() + this.state.config.exitAuth.lockoutSeconds * 1000;
      this.state.error = `Too many failed attempts. Locked for ${this.state.config.exitAuth.lockoutSeconds} seconds.`;
    } else {
      this.state.error = 'Incorrect PIN';
    }

    this.notifyListeners();
  }

  /**
   * Create new session
   */
  private createSession(): KioskSessionState {
    const now = Date.now();
    return {
      sessionId: `kiosk-${now}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: now,
      lastActivityAt: now,
      currentDocument: this.config.homeDocument,
      currentPage: 1,
      annotations: [],
      formData: {},
      isActive: true,
    };
  }

  /**
   * Reset session
   */
  resetSession(): void {
    if (!this.state.isActive) return;

    this.stopInactivityMonitor();

    this.state = {
      ...this.state,
      session: this.createSession(),
      inactivityCountdown: null,
    };

    this.startInactivityMonitor();
    this.notifyListeners();
  }

  /**
   * Record user activity
   */
  recordActivity(): void {
    if (!this.state.session) return;

    this.state.session = {
      ...this.state.session,
      lastActivityAt: Date.now(),
    };

    // Reset countdown if showing
    if (this.state.inactivityCountdown !== null) {
      this.state.inactivityCountdown = null;
      this.stopWarningTimer();
      this.startInactivityMonitor();
    }

    this.notifyListeners();
  }

  /**
   * Start inactivity monitor
   */
  private startInactivityMonitor(): void {
    if (!this.config.autoReset.enabled) return;

    this.stopInactivityMonitor();

    const timeoutMs = this.config.autoReset.timeoutSeconds * 1000;
    this.inactivityTimer = setTimeout(() => {
      this.showWarning();
    }, timeoutMs);
  }

  /**
   * Stop inactivity monitor
   */
  private stopInactivityMonitor(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.stopWarningTimer();
  }

  /**
   * Show reset warning
   */
  private showWarning(): void {
    if (!this.config.autoReset.showWarning) {
      this.resetSession();
      return;
    }

    let countdown = this.config.autoReset.warningSeconds;
    this.state.inactivityCountdown = countdown;
    this.notifyListeners();

    this.warningTimer = setInterval(() => {
      countdown--;

      if (countdown <= 0) {
        this.stopWarningTimer();
        this.resetSession();
      } else {
        this.state.inactivityCountdown = countdown;
        this.notifyListeners();
      }
    }, 1000);
  }

  /**
   * Stop warning timer
   */
  private stopWarningTimer(): void {
    if (this.warningTimer) {
      clearInterval(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Dismiss warning
   */
  dismissWarning(): void {
    this.stopWarningTimer();
    this.state.inactivityCountdown = null;
    this.startInactivityMonitor();
    this.notifyListeners();
  }

  /**
   * Check if feature is allowed
   */
  isFeatureAllowed(feature: KioskFeature): boolean {
    if (!this.state.isActive || !this.state.config) {
      return true;
    }

    return this.state.config.allowedFeatures.includes(feature);
  }

  /**
   * Check if action is allowed
   */
  isActionAllowed(action: string): boolean {
    if (!this.state.isActive || !this.state.config) {
      return true;
    }

    const restrictions = this.state.config.restrictions;
    const actionMap: Record<string, keyof typeof restrictions> = {
      save: 'disableSave',
      print: 'disablePrint',
      export: 'disableExport',
      share: 'disableShare',
      settings: 'disableSettings',
      navigate: 'disableNavigation',
    };

    const restrictionKey = actionMap[action];
    if (restrictionKey) {
      return !restrictions[restrictionKey];
    }

    return true;
  }

  /**
   * Navigate to document
   */
  setDocument(path: string, page = 1): boolean {
    if (!this.state.isActive || !this.state.config || !this.state.session) {
      return false;
    }

    // Check navigation restriction
    if (this.state.config.restrictions.disableNavigation) {
      return false;
    }

    // Check if document is allowed
    if (this.state.config.allowedDocuments.length > 0) {
      const isAllowed = this.state.config.allowedDocuments.some((pattern) => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(path);
        }
        return path === pattern;
      });

      if (!isAllowed) {
        this.state.error = 'Document not allowed in kiosk mode';
        this.notifyListeners();
        return false;
      }
    }

    this.state.session = {
      ...this.state.session,
      currentDocument: path,
      currentPage: page,
      lastActivityAt: Date.now(),
    };

    this.state.error = null;
    this.notifyListeners();
    return true;
  }

  /**
   * Enter full screen
   */
  private enterFullScreen(): void {
    if (!this.config.ui.fullScreen) return;

    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore fullscreen errors
      });
    }
  }

  /**
   * Exit full screen
   */
  private exitFullScreen(): void {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore fullscreen errors
      });
    }
  }

  /**
   * Get current state
   */
  getState(): KioskState {
    return { ...this.state };
  }

  /**
   * Get config
   */
  getConfig(): KioskConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<KioskConfig>): void {
    this.config = this.mergeConfig({ ...this.config, ...config });

    if (this.state.isActive) {
      this.state.config = this.config;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: KioskState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopInactivityMonitor();
    this.listeners.clear();
  }
}

/**
 * Create kiosk mode instance
 */
export function createKioskMode(config?: Partial<KioskConfig>): KioskMode {
  return new KioskMode(config);
}

/**
 * Global kiosk mode instance
 */
let globalKioskMode: KioskMode | null = null;

/**
 * Get global kiosk mode
 */
export function getGlobalKioskMode(): KioskMode {
  if (!globalKioskMode) {
    globalKioskMode = new KioskMode();
  }
  return globalKioskMode;
}

export default KioskMode;
