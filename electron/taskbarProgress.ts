/**
 * Windows Taskbar Progress
 *
 * Shows operation progress in Windows taskbar for long-running operations.
 */

import { BrowserWindow } from 'electron';

/**
 * Progress mode
 */
export type ProgressMode = 'none' | 'indeterminate' | 'normal' | 'error' | 'paused';

/**
 * Taskbar progress state
 */
interface TaskbarProgressState {
  mode: ProgressMode;
  progress: number;
  operationName?: string;
}

/**
 * Taskbar Progress Manager
 */
export class TaskbarProgressManager {
  private window: BrowserWindow | null = null;
  private state: TaskbarProgressState = {
    mode: 'none',
    progress: 0,
  };

  constructor() {
    if (process.platform !== 'win32') {
      console.log('[TaskbarProgress] Not Windows, taskbar progress disabled');
    }
  }

  /**
   * Set the window to show progress on
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
  }

  /**
   * Set progress value (0-1)
   */
  setProgress(progress: number, operationName?: string): void {
    if (!this.window || process.platform !== 'win32') return;

    this.state = {
      mode: 'normal',
      progress: Math.max(0, Math.min(1, progress)),
      operationName,
    };

    this.window.setProgressBar(this.state.progress);
  }

  /**
   * Set indeterminate progress (spinning)
   */
  setIndeterminate(operationName?: string): void {
    if (!this.window || process.platform !== 'win32') return;

    this.state = {
      mode: 'indeterminate',
      progress: 2, // Special value for indeterminate
      operationName,
    };

    this.window.setProgressBar(2); // Indeterminate
  }

  /**
   * Set error state
   */
  setError(): void {
    if (!this.window || process.platform !== 'win32') return;

    this.state = {
      mode: 'error',
      progress: 1,
    };

    this.window.setProgressBar(1, { mode: 'error' });
  }

  /**
   * Set paused state
   */
  setPaused(): void {
    if (!this.window || process.platform !== 'win32') return;

    this.state = {
      mode: 'paused',
      progress: this.state.progress,
    };

    this.window.setProgressBar(this.state.progress, { mode: 'paused' });
  }

  /**
   * Clear progress
   */
  clear(): void {
    if (!this.window || process.platform !== 'win32') return;

    this.state = {
      mode: 'none',
      progress: 0,
    };

    this.window.setProgressBar(-1); // Remove progress bar
  }

  /**
   * Get current state
   */
  getState(): TaskbarProgressState {
    return { ...this.state };
  }

  /**
   * Check if progress is active
   */
  isActive(): boolean {
    return this.state.mode !== 'none';
  }
}

// Singleton instance
let taskbarProgressManager: TaskbarProgressManager | null = null;

/**
 * Get or create taskbar progress manager
 */
export function getTaskbarProgressManager(): TaskbarProgressManager {
  if (!taskbarProgressManager) {
    taskbarProgressManager = new TaskbarProgressManager();
  }
  return taskbarProgressManager;
}

/**
 * Initialize taskbar progress for a window
 */
export function initializeTaskbarProgress(window: BrowserWindow): TaskbarProgressManager {
  const manager = getTaskbarProgressManager();
  manager.setWindow(window);
  return manager;
}
