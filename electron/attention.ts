/**
 * Cross-Platform Attention Manager
 *
 * Attracts user attention via dock bounce (macOS), taskbar flash (Windows),
 * and urgent hint (Linux).
 */

import { app, BrowserWindow } from 'electron';

/**
 * Attention types
 */
export type AttentionType = 'informational' | 'critical';

/**
 * Attention state
 */
interface AttentionState {
  isActive: boolean;
  type: AttentionType;
  window: BrowserWindow | null;
}

/**
 * Attention Manager class
 */
export class AttentionManager {
  private state: AttentionState = {
    isActive: false,
    type: 'informational',
    window: null,
  };
  private focusListener: (() => void) | null = null;

  /**
   * Request user attention
   */
  requestAttention(window: BrowserWindow, type: AttentionType = 'informational'): void {
    if (!window || window.isDestroyed()) return;

    // Don't request attention if window is focused
    if (window.isFocused()) return;

    this.state = {
      isActive: true,
      type,
      window,
    };

    switch (process.platform) {
      case 'darwin':
        this.requestAttentionMacOS(type);
        break;
      case 'win32':
        this.requestAttentionWindows(window, type);
        break;
      case 'linux':
        this.requestAttentionLinux(window);
        break;
    }

    // Set up listener to cancel attention when focused
    this.setupFocusListener(window);
  }

  /**
   * macOS: Bounce dock icon
   */
  private requestAttentionMacOS(type: AttentionType): void {
    // 'critical' bounces until user focuses, 'informational' bounces once
    const bounceType = type === 'critical' ? 'critical' : 'informational';
    app.dock?.bounce(bounceType);
  }

  /**
   * Windows: Flash taskbar button
   */
  private requestAttentionWindows(window: BrowserWindow, type: AttentionType): void {
    // Flash the taskbar button
    window.flashFrame(true);

    // For informational, stop after a few flashes
    if (type === 'informational') {
      setTimeout(() => {
        if (this.state.isActive && !window.isDestroyed()) {
          window.flashFrame(false);
        }
      }, 5000);
    }
  }

  /**
   * Linux: Set urgent hint
   */
  private requestAttentionLinux(window: BrowserWindow): void {
    // Flash frame works on Linux too
    window.flashFrame(true);
  }

  /**
   * Set up focus listener to cancel attention
   */
  private setupFocusListener(window: BrowserWindow): void {
    // Remove existing listener
    this.removeFocusListener();

    this.focusListener = () => {
      this.cancelAttention();
    };

    window.once('focus', this.focusListener);
  }

  /**
   * Remove focus listener
   */
  private removeFocusListener(): void {
    if (this.focusListener && this.state.window && !this.state.window.isDestroyed()) {
      this.state.window.removeListener('focus', this.focusListener);
    }
    this.focusListener = null;
  }

  /**
   * Cancel attention request
   */
  cancelAttention(): void {
    if (!this.state.isActive) return;

    const window = this.state.window;

    if (window && !window.isDestroyed()) {
      switch (process.platform) {
        case 'darwin':
          // macOS dock bounce cancels automatically on focus
          break;
        case 'win32':
        case 'linux':
          window.flashFrame(false);
          break;
      }
    }

    this.removeFocusListener();

    this.state = {
      isActive: false,
      type: 'informational',
      window: null,
    };
  }

  /**
   * Check if attention is active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Request attention for operation complete
   */
  notifyOperationComplete(window: BrowserWindow): void {
    this.requestAttention(window, 'informational');

    // On macOS, also set dock badge temporarily
    if (process.platform === 'darwin') {
      app.dock?.setBadge('!');

      // Clear after 5 seconds if not focused
      setTimeout(() => {
        if (!window.isFocused()) {
          app.dock?.setBadge('');
        }
      }, 5000);
    }
  }

  /**
   * Request attention for error
   */
  notifyError(window: BrowserWindow): void {
    this.requestAttention(window, 'critical');

    // On macOS, set dock badge
    if (process.platform === 'darwin') {
      app.dock?.setBadge('\u26A0'); // Warning sign
    }
  }
}

// Singleton instance
let attentionManager: AttentionManager | null = null;

/**
 * Get or create attention manager
 */
export function getAttentionManager(): AttentionManager {
  if (!attentionManager) {
    attentionManager = new AttentionManager();
  }
  return attentionManager;
}

/**
 * Request user attention
 */
export function requestAttention(window: BrowserWindow, type?: AttentionType): void {
  getAttentionManager().requestAttention(window, type);
}

/**
 * Cancel attention request
 */
export function cancelAttention(): void {
  getAttentionManager().cancelAttention();
}

/**
 * Notify operation complete
 */
export function notifyOperationComplete(window: BrowserWindow): void {
  getAttentionManager().notifyOperationComplete(window);
}

/**
 * Notify error
 */
export function notifyError(window: BrowserWindow): void {
  getAttentionManager().notifyError(window);
}
