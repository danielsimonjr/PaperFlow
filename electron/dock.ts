/**
 * macOS Dock Badge Manager
 *
 * Manages the dock icon badge for showing notification counts
 * and other status indicators on macOS.
 */

import { app } from 'electron';

/**
 * DockManager class for macOS-specific dock operations
 */
export class DockManager {
  private badgeCount = 0;
  private bounceId: number | null = null;

  /**
   * Check if dock API is available (macOS only)
   */
  static isAvailable(): boolean {
    return process.platform === 'darwin' && typeof app.dock !== 'undefined';
  }

  /**
   * Set the badge count on the dock icon
   * @param count - The number to display (0 to clear)
   */
  setBadgeCount(count: number): void {
    if (!DockManager.isAvailable()) {
      return;
    }

    this.badgeCount = Math.max(0, count);

    if (this.badgeCount === 0) {
      app.dock.setBadge('');
    } else if (this.badgeCount > 99) {
      app.dock.setBadge('99+');
    } else {
      app.dock.setBadge(String(this.badgeCount));
    }
  }

  /**
   * Get the current badge count
   */
  getBadgeCount(): number {
    return this.badgeCount;
  }

  /**
   * Increment the badge count
   */
  incrementBadgeCount(): void {
    this.setBadgeCount(this.badgeCount + 1);
  }

  /**
   * Decrement the badge count
   */
  decrementBadgeCount(): void {
    this.setBadgeCount(this.badgeCount - 1);
  }

  /**
   * Clear the badge
   */
  clearBadge(): void {
    this.setBadgeCount(0);
  }

  /**
   * Bounce the dock icon to attract attention
   * @param type - 'critical' bounces until app becomes active, 'informational' bounces once
   */
  bounce(type: 'critical' | 'informational' = 'informational'): void {
    if (!DockManager.isAvailable()) {
      return;
    }

    // Cancel any existing bounce
    this.cancelBounce();

    this.bounceId = app.dock.bounce(type);
  }

  /**
   * Cancel dock icon bouncing
   */
  cancelBounce(): void {
    if (!DockManager.isAvailable() || this.bounceId === null) {
      return;
    }

    app.dock.cancelBounce(this.bounceId);
    this.bounceId = null;
  }

  /**
   * Set the dock icon
   * @param imagePath - Path to the icon image
   */
  setIcon(imagePath: string): void {
    if (!DockManager.isAvailable()) {
      return;
    }

    try {
      app.dock.setIcon(imagePath);
    } catch (error) {
      console.error('[DockManager] Failed to set dock icon:', error);
    }
  }

  /**
   * Show the dock icon (if hidden)
   */
  show(): Promise<void> {
    if (!DockManager.isAvailable()) {
      return Promise.resolve();
    }

    return app.dock.show();
  }

  /**
   * Hide the dock icon
   */
  hide(): void {
    if (!DockManager.isAvailable()) {
      return;
    }

    app.dock.hide();
  }

  /**
   * Check if the dock icon is visible
   */
  isVisible(): boolean {
    if (!DockManager.isAvailable()) {
      return false;
    }

    return app.dock.isVisible();
  }

  /**
   * Set the dock menu
   * @param menu - Menu to show when right-clicking dock icon
   */
  setMenu(menu: Electron.Menu | null): void {
    if (!DockManager.isAvailable()) {
      return;
    }

    app.dock.setMenu(menu as Electron.Menu);
  }
}

// Singleton instance
let dockManager: DockManager | null = null;

/**
 * Get or create the dock manager instance
 */
export function getDockManager(): DockManager {
  if (!dockManager) {
    dockManager = new DockManager();
  }
  return dockManager;
}

/**
 * Set dock badge count
 */
export function setDockBadge(count: number): void {
  getDockManager().setBadgeCount(count);
}

/**
 * Clear dock badge
 */
export function clearDockBadge(): void {
  getDockManager().clearBadge();
}

/**
 * Bounce dock icon
 */
export function bounceDock(type?: 'critical' | 'informational'): void {
  getDockManager().bounce(type);
}
