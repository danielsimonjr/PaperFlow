/**
 * Window Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, mockBrowserWindow } from './setup';

// Import after mocks are set up
import { WindowManager } from '../../electron/main/windowManager';

describe('WindowManager', () => {
  let windowManager: WindowManager;

  beforeEach(() => {
    resetMocks();
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
