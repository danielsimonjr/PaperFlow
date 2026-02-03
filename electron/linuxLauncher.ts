/**
 * Linux Launcher Integration
 *
 * Integrates with Unity/GNOME/KDE launchers for quicklists and progress indicators.
 */

import { BrowserWindow, app } from 'electron';

/**
 * Unity/GNOME launcher properties
 */
interface LauncherProperties {
  /** Badge count */
  count: number;
  /** Whether count is visible */
  countVisible: boolean;
  /** Progress (0-1) */
  progress: number;
  /** Whether progress is visible */
  progressVisible: boolean;
  /** Urgent flag */
  urgent: boolean;
}

/**
 * Quicklist item
 */
interface QuicklistItem {
  id: string;
  label: string;
  callback: () => void;
}

/**
 * Linux Launcher Manager
 */
export class LinuxLauncherManager {
  private window: BrowserWindow | null = null;
  private properties: LauncherProperties = {
    count: 0,
    countVisible: false,
    progress: 0,
    progressVisible: false,
    urgent: false,
  };
  private quicklistItems: QuicklistItem[] = [];
  private desktopEntry: string;

  constructor() {
    if (process.platform !== 'linux') {
      console.log('[LinuxLauncher] Not Linux, launcher integration disabled');
    }

    this.desktopEntry = 'paperflow.desktop';
    this.initializeQuicklist();
  }

  /**
   * Initialize default quicklist items
   */
  private initializeQuicklist(): void {
    this.quicklistItems = [
      {
        id: 'new-window',
        label: 'New Window',
        callback: () => this.emitAction('new-window'),
      },
      {
        id: 'open-file',
        label: 'Open File...',
        callback: () => this.emitAction('open-file'),
      },
    ];
  }

  /**
   * Emit launcher action
   */
  private emitAction(action: string): void {
    if (this.window) {
      this.window.webContents.send('launcher-action', action);
    }
  }

  /**
   * Set the window
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  /**
   * Set badge count
   */
  setCount(count: number): void {
    if (process.platform !== 'linux') return;

    this.properties.count = count;
    this.properties.countVisible = count > 0;
    this.updateLauncher();
  }

  /**
   * Clear badge count
   */
  clearCount(): void {
    this.setCount(0);
  }

  /**
   * Set progress
   */
  setProgress(progress: number): void {
    if (process.platform !== 'linux') return;

    this.properties.progress = Math.max(0, Math.min(1, progress));
    this.properties.progressVisible = true;
    this.updateLauncher();
  }

  /**
   * Clear progress
   */
  clearProgress(): void {
    if (process.platform !== 'linux') return;

    this.properties.progressVisible = false;
    this.updateLauncher();
  }

  /**
   * Set urgent flag (flash taskbar)
   */
  setUrgent(urgent: boolean): void {
    if (process.platform !== 'linux') return;

    this.properties.urgent = urgent;
    this.updateLauncher();

    // Also use Electron's built-in flashFrame
    if (this.window) {
      this.window.flashFrame(urgent);
    }
  }

  /**
   * Update launcher properties
   * Note: This uses D-Bus which requires additional setup
   */
  private updateLauncher(): void {
    if (process.platform !== 'linux' || !this.window) return;

    // Use Electron's built-in methods where available
    if (this.properties.progressVisible) {
      this.window.setProgressBar(this.properties.progress);
    } else {
      this.window.setProgressBar(-1);
    }

    // For Unity/GNOME, we would use D-Bus
    // This is a simplified implementation
    // Full implementation would require 'dbus' native module

    console.log('[LinuxLauncher] Properties updated:', this.properties);
  }

  /**
   * Add quicklist item
   */
  addQuicklistItem(item: QuicklistItem): void {
    this.quicklistItems.push(item);
    this.updateQuicklist();
  }

  /**
   * Remove quicklist item
   */
  removeQuicklistItem(id: string): void {
    this.quicklistItems = this.quicklistItems.filter((item) => item.id !== id);
    this.updateQuicklist();
  }

  /**
   * Update quicklist
   * Note: Quicklist support varies by desktop environment
   */
  private updateQuicklist(): void {
    if (process.platform !== 'linux') return;

    // Quicklists are typically defined in the .desktop file
    // Runtime modification requires D-Bus
    console.log('[LinuxLauncher] Quicklist items:', this.quicklistItems.length);
  }

  /**
   * Add recent file to launcher
   */
  addRecentFile(filePath: string): void {
    if (process.platform !== 'linux') return;

    // Add to recent files using XDG recent manager
    // This is typically handled by GTK automatically when using native file dialogs
    app.addRecentDocument(filePath);
  }

  /**
   * Clear recent files
   */
  clearRecentFiles(): void {
    if (process.platform !== 'linux') return;

    app.clearRecentDocuments();
  }

  /**
   * Get current properties
   */
  getProperties(): LauncherProperties {
    return { ...this.properties };
  }

  /**
   * Get quicklist items
   */
  getQuicklistItems(): QuicklistItem[] {
    return [...this.quicklistItems];
  }
}

// Singleton instance
let linuxLauncherManager: LinuxLauncherManager | null = null;

/**
 * Get or create Linux launcher manager
 */
export function getLinuxLauncherManager(): LinuxLauncherManager {
  if (!linuxLauncherManager) {
    linuxLauncherManager = new LinuxLauncherManager();
  }
  return linuxLauncherManager;
}

/**
 * Initialize Linux launcher integration
 */
export function initializeLinuxLauncher(window: BrowserWindow): LinuxLauncherManager {
  const manager = getLinuxLauncherManager();
  manager.setWindow(window);
  return manager;
}
