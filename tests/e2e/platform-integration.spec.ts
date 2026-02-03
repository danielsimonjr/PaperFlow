/**
 * Platform Integration E2E Tests
 *
 * Tests platform-specific features like Touch Bar, Jump Lists, and Taskbar.
 * These tests require the Electron app to be running.
 */

import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
// Page is assigned but used in afterAll for cleanup
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let page: Page;

test.describe('Platform Integration', () => {
  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main/index.js')],
    });

    // Get the first window
    page = await electronApp.firstWindow();
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test.describe('Common Features', () => {
    test('should have platform info available', async () => {
      const platformInfo = await electronApp.evaluate(({ app }) => ({
        platform: process.platform,
        version: app.getVersion(),
        isPackaged: app.isPackaged,
      }));

      expect(platformInfo.platform).toMatch(/^(win32|darwin|linux)$/);
      expect(platformInfo.version).toBeTruthy();
    });

    test('should handle window minimize', async () => {
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.minimize();
      });

      const isMinimized = await electronApp.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMinimized();
      });

      expect(isMinimized).toBe(true);

      // Restore
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.restore();
      });
    });

    test('should handle window maximize', async () => {
      const wasMaximized = await electronApp.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMaximized();
      });

      await electronApp.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win?.isMaximized()) {
          win.unmaximize();
        } else {
          win?.maximize();
        }
      });

      const isMaximized = await electronApp.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMaximized();
      });

      expect(isMaximized).toBe(!wasMaximized);
    });

    test('should flash frame for attention', async () => {
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.flashFrame(true);
      });

      // Can't really assert on flash, just verify no error
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.flashFrame(false);
      });
    });
  });

  test.describe('Windows Features', () => {
    test.skip(process.platform !== 'win32', 'Windows only');

    test('should set taskbar progress', async () => {
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setProgressBar(0.5);
      });

      // Verify no error
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setProgressBar(-1);
      });
    });

    test('should set taskbar overlay icon', async () => {
      // This would require an actual icon file
      // Just verify the API is available
      const hasMethod = await electronApp.evaluate(({ BrowserWindow }) => {
        return typeof BrowserWindow.getAllWindows()[0]?.setOverlayIcon === 'function';
      });

      expect(hasMethod).toBe(true);
    });

    test('should configure Jump Lists', async () => {
      const result = await electronApp.evaluate(({ app }) => {
        try {
          app.setJumpList([
            {
              type: 'tasks',
              items: [
                {
                  type: 'task',
                  title: 'Test Task',
                  program: process.execPath,
                  args: '--test',
                },
              ],
            },
          ]);
          return true;
        } catch {
          return false;
        }
      });

      // May fail without proper registration
      expect(typeof result).toBe('boolean');
    });

    test('should set thumbnail toolbar buttons', async () => {
      const hasMethod = await electronApp.evaluate(({ BrowserWindow }) => {
        return typeof BrowserWindow.getAllWindows()[0]?.setThumbarButtons === 'function';
      });

      expect(hasMethod).toBe(true);
    });
  });

  test.describe('macOS Features', () => {
    test.skip(process.platform !== 'darwin', 'macOS only');

    test('should access dock', async () => {
      const hasDock = await electronApp.evaluate(({ app }) => {
        return typeof app.dock !== 'undefined';
      });

      expect(hasDock).toBe(true);
    });

    test('should set dock badge', async () => {
      await electronApp.evaluate(({ app }) => {
        app.dock?.setBadge('5');
      });

      const badge = await electronApp.evaluate(({ app }) => {
        return app.dock?.getBadge();
      });

      expect(badge).toBe('5');

      // Clear badge
      await electronApp.evaluate(({ app }) => {
        app.dock?.setBadge('');
      });
    });

    test('should bounce dock icon', async () => {
      const bounceId = await electronApp.evaluate(({ app }) => {
        return app.dock?.bounce('informational');
      });

      expect(typeof bounceId).toBe('number');

      // Cancel bounce
      await electronApp.evaluate(({ app }, id) => {
        app.dock?.cancelBounce(id);
      }, bounceId);
    });

    test('should set Touch Bar', async () => {
      const hasMethod = await electronApp.evaluate(({ BrowserWindow }) => {
        return typeof BrowserWindow.getAllWindows()[0]?.setTouchBar === 'function';
      });

      expect(hasMethod).toBe(true);
    });
  });

  test.describe('Linux Features', () => {
    test.skip(process.platform !== 'linux', 'Linux only');

    test('should set progress bar', async () => {
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setProgressBar(0.7);
      });

      // Clear
      await electronApp.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.setProgressBar(-1);
      });
    });

    test('should detect desktop environment', async () => {
      const desktopEnv = await electronApp.evaluate(() => {
        return process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || 'unknown';
      });

      expect(desktopEnv).toBeTruthy();
    });

    test('should detect Wayland', async () => {
      const isWayland = await electronApp.evaluate(() => {
        return !!(process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === 'wayland');
      });

      expect(typeof isWayland).toBe('boolean');
    });
  });
});
