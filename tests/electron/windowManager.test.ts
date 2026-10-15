/**
 * Window Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, mockBrowserWindow } from './setup';

// The persisted state a test wants the manager to find on disk.
const { loadWindowStateMock } = vi.hoisted(() => ({
  loadWindowStateMock: vi.fn(),
}));
vi.mock('../../electron/main/windowState', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../electron/main/windowState')>();
  return { ...actual, loadWindowState: loadWindowStateMock };
});

// Import after mocks are set up
import { WindowManager } from '../../electron/main/windowManager';

describe('WindowManager', () => {
  let windowManager: WindowManager;

  beforeEach(() => {
    resetMocks();
    loadWindowStateMock.mockReset();
    loadWindowStateMock.mockReturnValue(null);
    windowManager = new WindowManager();
  });

  describe('createWindow', () => {
    it('should create a new BrowserWindow', () => {
      const window = windowManager.createWindow();

      expect(mockBrowserWindow).toHaveBeenCalled();
      expect(window).toBeDefined();
    });

    it('should apply default window options', () => {
      windowManager.createWindow();

      const options = mockBrowserWindow.mock.calls[0]?.[0];
      expect(options).toMatchObject({
        minWidth: 800,
        minHeight: 600,
        show: false,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
    });

    it('should pass custom id option', () => {
      windowManager.createWindow({
        id: 'custom-window-id',
      });

      // Check that window was created and tracked with the custom id
      const window = windowManager.getWindow('custom-window-id');
      expect(window).toBeDefined();
    });

    it('should generate unique window IDs', () => {
      windowManager.createWindow();
      windowManager.createWindow();

      expect(windowManager.getWindowCount()).toBe(2);
    });

    it('should set the first window as main window', () => {
      const window = windowManager.createWindow();
      const mainWindow = windowManager.getMainWindow();

      expect(mainWindow).toBe(window);
    });
  });

  describe('a window whose persisted state is maximized', () => {
    const persistedMaximized = {
      x: 50,
      y: 60,
      width: 1000,
      height: 700,
      isMaximized: true,
      isMinimized: false,
    };

    /** The handler the manager registered for ready-to-show on a window. */
    function readyToShow(
      window: ReturnType<WindowManager['createWindow']>
    ): () => void {
      const call = vi
        .mocked(window.once)
        .mock.calls.find((c) => c[0] === 'ready-to-show');
      expect(call, 'no ready-to-show handler was registered').toBeDefined();
      return call![1] as () => void;
    }

    it('is not maximized at construction: maximize() on a hidden window shows it at once', () => {
      // On Windows, maximize() of a window that is not shown also SHOWS it, before ready-to-show. Anything
      // that waits for the window to be visible then runs against a page that has not painted, and the
      // later show() undoes what it did (a minimize from the spec's visible wait was undone 120 ms later).
      loadWindowStateMock.mockReturnValue(persistedMaximized);

      const window = windowManager.createWindow();

      expect(window.maximize).not.toHaveBeenCalled();
      expect(window.show).not.toHaveBeenCalled();
    });

    it('is created with the restored bounds, so un-maximize returns to them', () => {
      loadWindowStateMock.mockReturnValue(persistedMaximized);

      windowManager.createWindow();

      expect(mockBrowserWindow.mock.calls[0]?.[0]).toMatchObject({
        x: 50,
        y: 60,
        width: 1000,
        height: 700,
        show: false,
      });
    });

    it('is maximized, then shown, once ready-to-show fires', () => {
      loadWindowStateMock.mockReturnValue(persistedMaximized);
      const window = windowManager.createWindow();
      expect(window.maximize).not.toHaveBeenCalled();

      readyToShow(window)();

      expect(window.maximize).toHaveBeenCalledTimes(1);
      expect(window.show).toHaveBeenCalledTimes(1);
      const maximizeOrder =
        vi.mocked(window.maximize).mock.invocationCallOrder[0] ?? 0;
      const showOrder = vi.mocked(window.show).mock.invocationCallOrder[0] ?? 0;
      expect(maximizeOrder).toBeLessThan(showOrder);
    });
  });

  describe('a window whose persisted state is not maximized', () => {
    it('is shown, and never maximized, once ready-to-show fires', () => {
      loadWindowStateMock.mockReturnValue({
        x: 10,
        y: 20,
        width: 900,
        height: 600,
        isMaximized: false,
        isMinimized: false,
      });
      const window = windowManager.createWindow();
      const call = vi
        .mocked(window.once)
        .mock.calls.find((c) => c[0] === 'ready-to-show');
      expect(window.show).not.toHaveBeenCalled();

      (call![1] as () => void)();

      expect(window.show).toHaveBeenCalledTimes(1);
      expect(window.maximize).not.toHaveBeenCalled();
    });

    it('with no persisted state at all is shown, and never maximized', () => {
      const window = windowManager.createWindow();
      const call = vi
        .mocked(window.once)
        .mock.calls.find((c) => c[0] === 'ready-to-show');

      (call![1] as () => void)();

      expect(window.show).toHaveBeenCalledTimes(1);
      expect(window.maximize).not.toHaveBeenCalled();
    });
  });

  describe('getWindow', () => {
    it('should return window by ID', () => {
      const window = windowManager.createWindow({ id: 'test-window' });
      const retrieved = windowManager.getWindow('test-window');

      expect(retrieved).toBe(window);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = windowManager.getWindow('non-existent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAllWindows', () => {
    it('should return all created windows', () => {
      windowManager.createWindow({ id: 'window-1' });
      windowManager.createWindow({ id: 'window-2' });
      windowManager.createWindow({ id: 'window-3' });

      const windows = windowManager.getAllWindows();

      expect(windows).toHaveLength(3);
    });

    it('should return empty array when no windows exist', () => {
      const windows = windowManager.getAllWindows();

      expect(windows).toHaveLength(0);
    });
  });

  describe('getWindowCount', () => {
    it('should return correct window count', () => {
      expect(windowManager.getWindowCount()).toBe(0);

      windowManager.createWindow();
      expect(windowManager.getWindowCount()).toBe(1);

      windowManager.createWindow();
      expect(windowManager.getWindowCount()).toBe(2);
    });
  });

  describe('closeWindow', () => {
    it('should close window by ID', () => {
      const window = windowManager.createWindow({ id: 'test-window' });
      windowManager.closeWindow('test-window');

      expect(window.close).toHaveBeenCalled();
    });

    it('should do nothing for non-existent ID', () => {
      windowManager.closeWindow('non-existent');
      // Should not throw
    });
  });

  describe('closeAllWindows', () => {
    it('should close all windows', () => {
      const window1 = windowManager.createWindow({ id: 'window-1' });
      const window2 = windowManager.createWindow({ id: 'window-2' });

      windowManager.closeAllWindows();

      expect(window1.close).toHaveBeenCalled();
      expect(window2.close).toHaveBeenCalled();
    });
  });

  describe('focusMainWindow', () => {
    it('should focus the main window', () => {
      const window = windowManager.createWindow();
      windowManager.focusMainWindow();

      expect(window.focus).toHaveBeenCalled();
    });

    it('should restore minimized window before focusing', () => {
      const window = windowManager.createWindow();
      window.isMinimized = vi.fn(() => true);

      windowManager.focusMainWindow();

      expect(window.restore).toHaveBeenCalled();
      expect(window.focus).toHaveBeenCalled();
    });
  });
});
