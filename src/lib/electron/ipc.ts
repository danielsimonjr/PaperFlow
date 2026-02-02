/**
 * Electron IPC Wrapper
 *
 * Provides a typed wrapper for IPC communication with the main process.
 * Falls back gracefully when running in a browser.
 */

import { isElectron } from './platform';
import type {
  FileDialogOptions,
  SaveDialogOptions,
  MessageDialogOptions,
  FileReadOptions,
  NotificationOptions,
  WindowBounds,
  RecentFile,
  MemoryInfo,
} from '@/types/electronTypes';

/**
 * File Operations
 */
export const fileOperations = {
  /**
   * Open a file dialog and get the selected file paths
   */
  async openFile(options?: FileDialogOptions): Promise<string[] | null> {
    if (!isElectron()) {
      return null;
    }

    const result = await window.electron!.showOpenDialog(options);
    return result.canceled ? null : result.filePaths;
  },

  /**
   * Save data to a file with a save dialog
   */
  async saveFile(data: Uint8Array, defaultPath?: string): Promise<string | null> {
    if (!isElectron()) {
      return null;
    }

    const result = await window.electron!.saveFile(data, defaultPath);
    return result.canceled ? null : result.filePath ?? null;
  },

  /**
   * Save data to a new file (always shows dialog)
   */
  async saveFileAs(data: Uint8Array, defaultPath?: string): Promise<string | null> {
    if (!isElectron()) {
      return null;
    }

    const result = await window.electron!.saveFileAs(data, defaultPath);
    return result.canceled ? null : result.filePath ?? null;
  },

  /**
   * Read a file from the file system
   */
  async readFile(filePath: string, options?: FileReadOptions): Promise<Uint8Array | null> {
    if (!isElectron()) {
      return null;
    }

    const result = await window.electron!.readFile(filePath, options);
    if (!result.success || !result.data) {
      return null;
    }

    // Convert Buffer to Uint8Array if needed
    if (result.data instanceof Uint8Array) {
      return result.data;
    }
    if (typeof result.data === 'string') {
      return new TextEncoder().encode(result.data);
    }
    return null;
  },

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!isElectron()) {
      return false;
    }

    return window.electron!.fileExists(filePath);
  },

  /**
   * Get list of recently opened files
   */
  async getRecentFiles(): Promise<RecentFile[]> {
    if (!isElectron()) {
      return [];
    }

    return window.electron!.getRecentFiles();
  },

  /**
   * Add a file to the recent files list
   */
  async addRecentFile(filePath: string): Promise<void> {
    if (!isElectron()) {
      return;
    }

    await window.electron!.addRecentFile(filePath);
  },

  /**
   * Clear the recent files list
   */
  async clearRecentFiles(): Promise<void> {
    if (!isElectron()) {
      return;
    }

    await window.electron!.clearRecentFiles();
  },
};

/**
 * Dialog Operations
 */
export const dialogOperations = {
  /**
   * Show an open file dialog
   */
  async showOpenDialog(options?: FileDialogOptions): Promise<string[] | null> {
    return fileOperations.openFile(options);
  },

  /**
   * Show a save file dialog
   */
  async showSaveDialog(options?: SaveDialogOptions): Promise<string | null> {
    if (!isElectron()) {
      return null;
    }

    const result = await window.electron!.showSaveDialog(options);
    return result.canceled ? null : result.filePath ?? null;
  },

  /**
   * Show a message dialog
   */
  async showMessageDialog(options: MessageDialogOptions): Promise<number> {
    if (!isElectron()) {
      // Fallback to browser confirm/alert
      if (options.buttons && options.buttons.length > 1) {
        const confirmed = window.confirm(`${options.message}\n\n${options.detail || ''}`);
        return confirmed ? 0 : 1;
      }
      window.alert(`${options.message}\n\n${options.detail || ''}`);
      return 0;
    }

    const result = await window.electron!.showMessageDialog(options);
    return result.response;
  },

  /**
   * Show an error dialog
   */
  async showError(title: string, message: string): Promise<void> {
    await this.showMessageDialog({
      type: 'error',
      title,
      message,
      buttons: ['OK'],
    });
  },

  /**
   * Show a confirmation dialog
   */
  async confirm(message: string, detail?: string): Promise<boolean> {
    const response = await this.showMessageDialog({
      type: 'question',
      title: 'Confirm',
      message,
      detail,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
    });
    return response === 0;
  },
};

/**
 * Window Operations
 */
export const windowOperations = {
  /**
   * Minimize the window
   */
  minimize(): void {
    if (isElectron()) {
      window.electron!.minimizeWindow();
    }
  },

  /**
   * Maximize or restore the window
   */
  maximize(): void {
    if (isElectron()) {
      window.electron!.maximizeWindow();
    }
  },

  /**
   * Close the window
   */
  close(): void {
    if (isElectron()) {
      window.electron!.closeWindow();
    }
  },

  /**
   * Check if window is maximized
   */
  async isMaximized(): Promise<boolean> {
    if (!isElectron()) {
      return false;
    }

    return window.electron!.isWindowMaximized();
  },

  /**
   * Set the window title
   */
  setTitle(title: string): void {
    if (isElectron()) {
      window.electron!.setWindowTitle(title);
    } else {
      document.title = title;
    }
  },

  /**
   * Get window bounds
   */
  async getBounds(): Promise<WindowBounds | null> {
    if (!isElectron()) {
      return null;
    }

    return window.electron!.getWindowBounds();
  },

  /**
   * Set window bounds
   */
  setBounds(bounds: Partial<WindowBounds>): void {
    if (isElectron()) {
      window.electron!.setWindowBounds(bounds);
    }
  },
};

/**
 * Shell Operations
 */
export const shellOperations = {
  /**
   * Open a URL in the default browser
   */
  async openExternal(url: string): Promise<void> {
    if (isElectron()) {
      await window.electron!.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  /**
   * Open a file path with the default application
   */
  async openPath(path: string): Promise<string> {
    if (!isElectron()) {
      return 'Not supported in browser';
    }

    return window.electron!.openPath(path);
  },

  /**
   * Show a file in the file manager
   */
  showItemInFolder(path: string): void {
    if (isElectron()) {
      window.electron!.showItemInFolder(path);
    }
  },

  /**
   * Move a file to trash
   */
  async trashItem(path: string): Promise<void> {
    if (isElectron()) {
      await window.electron!.trashItem(path);
    }
  },
};

/**
 * Clipboard Operations
 */
export const clipboardOperations = {
  /**
   * Read text from clipboard
   */
  async readText(): Promise<string> {
    if (isElectron()) {
      return window.electron!.readClipboardText();
    }

    if (navigator.clipboard) {
      return navigator.clipboard.readText();
    }

    return '';
  },

  /**
   * Write text to clipboard
   */
  async writeText(text: string): Promise<void> {
    if (isElectron()) {
      window.electron!.writeClipboardText(text);
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  },

  /**
   * Read image from clipboard as data URL
   */
  async readImage(): Promise<string | null> {
    if (isElectron()) {
      return window.electron!.readClipboardImage();
    }

    // Browser fallback
    if (navigator.clipboard && 'read' in navigator.clipboard) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('image/png')) {
            const blob = await item.getType('image/png');
            return URL.createObjectURL(blob);
          }
        }
      } catch {
        // Permission denied or no image
      }
    }

    return null;
  },

  /**
   * Write image to clipboard from data URL
   */
  writeImage(dataUrl: string): void {
    if (isElectron()) {
      window.electron!.writeClipboardImage(dataUrl);
    }
  },
};

/**
 * Notification Operations
 */
export const notificationOperations = {
  /**
   * Show a notification
   */
  show(options: NotificationOptions): void {
    if (isElectron()) {
      window.electron!.showNotification(options);
      return;
    }

    // Browser fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        silent: options.silent,
      });
    }
  },

  /**
   * Request notification permission (browser only)
   */
  async requestPermission(): Promise<boolean> {
    if (isElectron()) {
      return true;
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },
};

/**
 * System Operations
 */
export const systemOperations = {
  /**
   * Get memory usage information
   */
  async getMemoryInfo(): Promise<MemoryInfo | null> {
    if (!isElectron()) {
      // Browser fallback using performance API
      if ('memory' in performance) {
        const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
        if (memory) {
          return {
            heapUsed: memory.usedJSHeapSize,
            heapTotal: memory.totalJSHeapSize,
            external: 0,
            arrayBuffers: 0,
          };
        }
      }
      return null;
    }

    return window.electron!.getMemoryInfo();
  },
};

/**
 * Event Subscriptions
 */
export const eventSubscriptions = {
  /**
   * Subscribe to file opened event
   */
  onFileOpened(callback: (filePath: string) => void): () => void {
    if (!isElectron()) {
      return () => {};
    }

    return window.electron!.onFileOpened(callback);
  },

  /**
   * Subscribe to menu events
   */
  onMenuFileNew(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuFileNew(callback);
  },

  onMenuFileOpen(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuFileOpen(callback);
  },

  onMenuFileSave(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuFileSave(callback);
  },

  onMenuFileSaveAs(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuFileSaveAs(callback);
  },

  onMenuEditUndo(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuEditUndo(callback);
  },

  onMenuEditRedo(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuEditRedo(callback);
  },

  onMenuViewZoomIn(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuViewZoomIn(callback);
  },

  onMenuViewZoomOut(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuViewZoomOut(callback);
  },

  onMenuViewZoomReset(callback: () => void): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onMenuViewZoomReset(callback);
  },

  /**
   * Subscribe to before quit event
   */
  onBeforeQuit(callback: () => Promise<boolean>): () => void {
    if (!isElectron()) return () => {};
    return window.electron!.onBeforeQuit(callback);
  },
};
