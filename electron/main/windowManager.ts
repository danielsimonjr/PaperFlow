/**
 * Window Manager
 *
 * Manages BrowserWindow instances with state persistence,
 * bounds validation, and multi-window support.
 */

import { BrowserWindow, BrowserWindowConstructorOptions, screen } from 'electron';
import { WindowState, loadWindowState, saveWindowState, getDefaultWindowState } from './windowState';

export interface WindowOptions extends Partial<BrowserWindowConstructorOptions> {
  id?: string;
  filePath?: string;
}

interface ManagedWindow {
  window: BrowserWindow;
  id: string;
  filePath?: string;
  state: WindowState;
}

/**
 * Default window configuration
 */
const DEFAULT_WINDOW_OPTIONS: BrowserWindowConstructorOptions = {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  show: false, // Show after ready-to-show to prevent flash
  backgroundColor: '#ffffff',
  title: 'PaperFlow',
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
};

export class WindowManager {
  private windows: Map<string, ManagedWindow> = new Map();
  private mainWindowId: string | null = null;
  private windowCounter = 0;

  /**
   * Create a new window
   */
  createWindow(options: WindowOptions = {}): BrowserWindow {
    const id = options.id || `window-${++this.windowCounter}`;

    // Load persisted state or use defaults
    const savedState = loadWindowState(id);
    const state = savedState || getDefaultWindowState();

    // Validate and adjust bounds to fit screen
    const validatedBounds = this.validateBounds(state);

    // Merge options with defaults and saved state
    const windowOptions: BrowserWindowConstructorOptions = {
      ...DEFAULT_WINDOW_OPTIONS,
      ...options,
      x: validatedBounds.x,
      y: validatedBounds.y,
      width: validatedBounds.width,
      height: validatedBounds.height,
    };

    const window = new BrowserWindow(windowOptions);

    // Restore maximized state after creation
    if (state.isMaximized) {
      window.maximize();
    }

    // Track the window
    const managedWindow: ManagedWindow = {
      window,
      id,
      filePath: options.filePath,
      state: { ...state },
    };

    this.windows.set(id, managedWindow);

    // Set main window if this is the first one
    if (!this.mainWindowId) {
      this.mainWindowId = id;
    }

    // Set up event handlers
    this.setupWindowEvents(managedWindow);

    // Show window when ready
    window.once('ready-to-show', () => {
      window.show();
    });

    return window;
  }

  /**
   * Get window by ID
   */
  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id)?.window;
  }

  /**
   * Get the main window
   */
  getMainWindow(): BrowserWindow | undefined {
    if (this.mainWindowId) {
      return this.windows.get(this.mainWindowId)?.window;
    }
    return undefined;
  }

  /**
   * Get all windows
   */
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).map((m) => m.window);
  }

  /**
   * Close a window by ID
   */
  closeWindow(id: string): void {
    const managed = this.windows.get(id);
    if (managed) {
      managed.window.close();
    }
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    for (const managed of this.windows.values()) {
      managed.window.close();
    }
  }

  /**
   * Find window by web contents ID
   */
  findWindowByWebContentsId(webContentsId: number): ManagedWindow | undefined {
    for (const managed of this.windows.values()) {
      if (managed.window.webContents.id === webContentsId) {
        return managed;
      }
    }
    return undefined;
  }

  /**
   * Get window count
   */
  getWindowCount(): number {
    return this.windows.size;
  }

  /**
   * Focus the main window
   */
  focusMainWindow(): void {
    const mainWindow = this.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  }

  /**
   * Set up event handlers for a managed window
   */
  private setupWindowEvents(managed: ManagedWindow): void {
    const { window, id } = managed;

    // Track window state changes
    window.on('resize', () => {
      if (!window.isMaximized() && !window.isMinimized()) {
        const bounds = window.getBounds();
        managed.state.width = bounds.width;
        managed.state.height = bounds.height;
      }
    });

    window.on('move', () => {
      if (!window.isMaximized() && !window.isMinimized()) {
        const bounds = window.getBounds();
        managed.state.x = bounds.x;
        managed.state.y = bounds.y;
      }
    });

    window.on('maximize', () => {
      managed.state.isMaximized = true;
    });

    window.on('unmaximize', () => {
      managed.state.isMaximized = false;
    });

    window.on('minimize', () => {
      managed.state.isMinimized = true;
    });

    window.on('restore', () => {
      managed.state.isMinimized = false;
    });

    window.on('focus', () => {
      // Update main window reference when focused
      this.mainWindowId = id;
    });

    // Save state and clean up on close
    window.on('close', () => {
      saveWindowState(id, managed.state);
    });

    window.on('closed', () => {
      this.windows.delete(id);

      // Update main window reference if needed
      if (this.mainWindowId === id) {
        const remaining = Array.from(this.windows.keys());
        this.mainWindowId = remaining.length > 0 ? remaining[0] ?? null : null;
      }
    });
  }

  /**
   * Validate window bounds to ensure they fit on screen
   */
  private validateBounds(state: WindowState): { x: number; y: number; width: number; height: number } {
    const displays = screen.getAllDisplays();

    // Find the display that the window should appear on
    let targetDisplay = screen.getPrimaryDisplay();

    if (state.x !== undefined && state.y !== undefined) {
      // Find display that contains the saved position
      const foundDisplay = displays.find((display) => {
        const { x, y, width, height } = display.bounds;
        return state.x! >= x && state.x! < x + width && state.y! >= y && state.y! < y + height;
      });

      if (foundDisplay) {
        targetDisplay = foundDisplay;
      }
    }

    const { bounds, workArea } = targetDisplay;

    // Ensure window dimensions fit within display
    const width = Math.min(state.width, workArea.width);
    const height = Math.min(state.height, workArea.height);

    // Calculate position, centering if no saved position or if it's off-screen
    let x = state.x;
    let y = state.y;

    if (x === undefined || y === undefined || x < bounds.x || x >= bounds.x + bounds.width) {
      x = workArea.x + Math.floor((workArea.width - width) / 2);
    }

    if (y === undefined || y < bounds.y || y >= bounds.y + bounds.height) {
      y = workArea.y + Math.floor((workArea.height - height) / 2);
    }

    // Ensure window is fully visible
    x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - width));
    y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - height));

    return { x, y, width, height };
  }
}
