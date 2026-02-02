/**
 * Platform Detection Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isElectron,
  isBrowser,
  isWindows,
  isMacOS,
  isLinux,
  isFeatureAvailable,
  getCommandKey,
  getAltKey,
  formatShortcut,
} from '../../src/lib/electron/platform';

describe('Platform Detection', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset window.electron
    if (typeof global.window !== 'undefined') {
      delete (global.window as { electron?: unknown }).electron;
    }
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true });
  });

  describe('isElectron', () => {
    it('should return false when window.electron is undefined', () => {
      expect(isElectron()).toBe(false);
    });

    it('should return true when window.electron is defined', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isElectron()).toBe(true);
    });
  });

  describe('isBrowser', () => {
    it('should return true when not in Electron', () => {
      expect(isBrowser()).toBe(true);
    });

    it('should return false when in Electron', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isBrowser()).toBe(false);
    });
  });

  describe('Platform OS Detection', () => {
    it('isWindows should detect Windows platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true,
      });
      expect(isWindows()).toBe(true);
    });

    it('isMacOS should detect macOS platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true,
      });
      expect(isMacOS()).toBe(true);
    });

    it('isLinux should detect Linux platform', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Linux x86_64' },
        writable: true,
      });
      expect(isLinux()).toBe(true);
    });
  });

  describe('isFeatureAvailable', () => {
    it('should return false for native-file-dialogs in browser', () => {
      expect(isFeatureAvailable('native-file-dialogs')).toBe(false);
    });

    it('should return true for native-file-dialogs in Electron', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isFeatureAvailable('native-file-dialogs')).toBe(true);
    });

    it('should return false for window-controls in browser', () => {
      expect(isFeatureAvailable('window-controls')).toBe(false);
    });

    it('should return true for window-controls in Electron', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isFeatureAvailable('window-controls')).toBe(true);
    });

    it('should return false for recent-files in browser', () => {
      expect(isFeatureAvailable('recent-files')).toBe(false);
    });

    it('should return true for recent-files in Electron', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isFeatureAvailable('recent-files')).toBe(true);
    });

    it('should return false for shell-integration in browser', () => {
      expect(isFeatureAvailable('shell-integration')).toBe(false);
    });

    it('should return true for shell-integration in Electron', () => {
      (global.window as { electron?: object }).electron = {};
      expect(isFeatureAvailable('shell-integration')).toBe(true);
    });
  });

  describe('Keyboard shortcuts', () => {
    describe('getCommandKey', () => {
      it('should return Ctrl for Windows', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'Win32' },
          writable: true,
        });
        expect(getCommandKey()).toBe('Ctrl');
      });

      it('should return Cmd for macOS', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          writable: true,
        });
        expect(getCommandKey()).toBe('Cmd');
      });

      it('should return Ctrl for Linux', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'Linux x86_64' },
          writable: true,
        });
        expect(getCommandKey()).toBe('Ctrl');
      });
    });

    describe('getAltKey', () => {
      it('should return Alt for Windows', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'Win32' },
          writable: true,
        });
        expect(getAltKey()).toBe('Alt');
      });

      it('should return Option for macOS', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          writable: true,
        });
        expect(getAltKey()).toBe('Option');
      });
    });

    describe('formatShortcut', () => {
      it('should replace Ctrl with symbol on macOS', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          writable: true,
        });
        expect(formatShortcut('Ctrl+S')).toBe('\u2318S');
      });

      it('should replace Alt with symbol on macOS', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          writable: true,
        });
        expect(formatShortcut('Alt+F4')).toBe('\u2325F4');
      });

      it('should replace Shift with symbol on macOS', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          writable: true,
        });
        expect(formatShortcut('Shift+Enter')).toBe('\u21E7Enter');
      });

      it('should keep shortcuts unchanged on Windows', () => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'Win32' },
          writable: true,
        });
        expect(formatShortcut('Ctrl+S')).toBe('Ctrl+S');
      });
    });
  });
});
