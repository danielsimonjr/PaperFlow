/**
 * Windows Taskbar Overlay Icons
 *
 * Shows status indicators as overlay icons on the Windows taskbar.
 */

import { BrowserWindow, nativeImage, NativeImage } from 'electron';

/**
 * Overlay status types
 */
export type OverlayStatus = 'none' | 'unsaved' | 'processing' | 'error' | 'success' | 'notification';

/**
 * Taskbar Overlay Manager
 */
export class TaskbarOverlayManager {
  private window: BrowserWindow | null = null;
  private currentStatus: OverlayStatus = 'none';
  private overlayIcons: Map<OverlayStatus, NativeImage> = new Map();

  constructor() {
    if (process.platform !== 'win32') {
      console.log('[TaskbarOverlay] Not Windows, overlay icons disabled');
      return;
    }

    this.initializeIcons();
  }

  /**
   * Initialize overlay icons
   */
  private initializeIcons(): void {
    // Create simple overlay icons programmatically
    // In production, these would be loaded from actual icon files

    // Unsaved changes - orange dot
    this.overlayIcons.set('unsaved', this.createColorDot('#F59E0B'));

    // Processing - blue spinning (simplified to static)
    this.overlayIcons.set('processing', this.createColorDot('#3B82F6'));

    // Error - red dot
    this.overlayIcons.set('error', this.createColorDot('#EF4444'));

    // Success - green dot
    this.overlayIcons.set('success', this.createColorDot('#22C55E'));

    // Notification - purple dot
    this.overlayIcons.set('notification', this.createColorDot('#8B5CF6'));
  }

  /**
   * Create a colored dot icon
   */
  private createColorDot(color: string): NativeImage {
    // Create a simple 16x16 colored circle
    const size = 16;
    const canvas = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" />
      </svg>
    `;

    // Convert SVG to data URL and create native image
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
    return nativeImage.createFromDataURL(dataUrl);
  }

  /**
   * Set the window to show overlay on
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  /**
   * Set overlay status
   */
  setStatus(status: OverlayStatus, description?: string): void {
    if (!this.window || process.platform !== 'win32') return;

    this.currentStatus = status;

    if (status === 'none') {
      this.window.setOverlayIcon(null, '');
      return;
    }

    const icon = this.overlayIcons.get(status);
    if (icon) {
      const desc = description || this.getDefaultDescription(status);
      this.window.setOverlayIcon(icon, desc);
    }
  }

  /**
   * Get default description for status
   */
  private getDefaultDescription(status: OverlayStatus): string {
    switch (status) {
      case 'unsaved':
        return 'Unsaved changes';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error occurred';
      case 'success':
        return 'Operation completed';
      case 'notification':
        return 'New notification';
      default:
        return '';
    }
  }

  /**
   * Show unsaved changes indicator
   */
  showUnsaved(): void {
    this.setStatus('unsaved', 'Document has unsaved changes');
  }

  /**
   * Show processing indicator
   */
  showProcessing(description?: string): void {
    this.setStatus('processing', description || 'Processing document...');
  }

  /**
   * Show error indicator
   */
  showError(description?: string): void {
    this.setStatus('error', description || 'An error occurred');
  }

  /**
   * Show success indicator
   */
  showSuccess(description?: string): void {
    this.setStatus('success', description || 'Operation completed successfully');

    // Auto-clear after 3 seconds
    setTimeout(() => {
      if (this.currentStatus === 'success') {
        this.clear();
      }
    }, 3000);
  }

  /**
   * Show notification badge
   */
  showNotification(count?: number): void {
    const description = count
      ? `${count} notification${count > 1 ? 's' : ''}`
      : 'New notification';
    this.setStatus('notification', description);
  }

  /**
   * Clear overlay
   */
  clear(): void {
    this.setStatus('none');
  }

  /**
   * Get current status
   */
  getStatus(): OverlayStatus {
    return this.currentStatus;
  }
}

// Singleton instance
let taskbarOverlayManager: TaskbarOverlayManager | null = null;

/**
 * Get or create taskbar overlay manager
 */
export function getTaskbarOverlayManager(): TaskbarOverlayManager {
  if (!taskbarOverlayManager) {
    taskbarOverlayManager = new TaskbarOverlayManager();
  }
  return taskbarOverlayManager;
}

/**
 * Initialize taskbar overlay for a window
 */
export function initializeTaskbarOverlay(window: BrowserWindow): TaskbarOverlayManager {
  const manager = getTaskbarOverlayManager();
  manager.setWindow(window);
  return manager;
}
