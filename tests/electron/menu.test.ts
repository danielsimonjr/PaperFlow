/**
 * Menu Module Tests
 *
 * Tests for the native application menu system.
 */

import { describe, it, expect, vi } from 'vitest';
import './setup';
import {
  buildMenuTemplate,
  createFileMenu,
  createEditMenu,
  createViewMenu,
  createDocumentMenu,
  createWindowMenu,
  createHelpMenu,
  createMacAppMenu,
  defaultMenuState,
  isMac,
  isWindows,
  isLinux,
  APP_NAME,
} from '../../electron/menuTemplate';

// Mock the recentFiles module
vi.mock('../../electron/recentFiles', () => ({
  createRecentFilesMenuItems: vi.fn(() =>
    Promise.resolve([
      {
        label: 'test.pdf',
        sublabel: '/path/to/test.pdf',
        accelerator: undefined,
        enabled: true,
        click: vi.fn(),
      },
    ])
  ),
}));

describe('Menu Template', () => {
  describe('defaultMenuState', () => {
    it('should have correct default values', () => {
      expect(defaultMenuState.hasDocument).toBe(false);
      expect(defaultMenuState.isModified).toBe(false);
      expect(defaultMenuState.canUndo).toBe(false);
      expect(defaultMenuState.canRedo).toBe(false);
      expect(defaultMenuState.viewMode).toBe('single');
      expect(defaultMenuState.zoom).toBe(100);
      expect(defaultMenuState.isFullscreen).toBe(false);
      expect(defaultMenuState.currentPage).toBe(1);
      expect(defaultMenuState.pageCount).toBe(0);
    });
  });

  describe('buildMenuTemplate', () => {
    it('should build a valid menu template', async () => {
      const template = await buildMenuTemplate();

      expect(Array.isArray(template)).toBe(true);
      expect(template.length).toBeGreaterThan(0);
    });

    it('should include standard menus', async () => {
      const template = await buildMenuTemplate();

      const labels = template.map((item) => item.label);

      expect(labels).toContain('File');
      expect(labels).toContain('Edit');
      expect(labels).toContain('View');
      expect(labels).toContain('Document');
      expect(labels).toContain('Window');
      expect(labels).toContain('Help');
    });

    it('should include app menu on macOS', async () => {
      if (isMac) {
        const template = await buildMenuTemplate();
        expect(template[0]?.label).toBe(APP_NAME);
      }
    });
  });

  describe('createFileMenu', () => {
    it('should create File menu with standard items', async () => {
      const menu = await createFileMenu(defaultMenuState);

      expect(menu.label).toBe('File');
      expect(menu.submenu).toBeDefined();
      expect(Array.isArray(menu.submenu)).toBe(true);

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('New Window');
      expect(labels).toContain('Open...');
      expect(labels).toContain('Open Recent');
      expect(labels).toContain('Save');
      expect(labels).toContain('Save As...');
      expect(labels).toContain('Print...');
    });

    it('should have correct accelerators', async () => {
      const menu = await createFileMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const openItem = items.find((item) => item.label === 'Open...');
      expect(openItem?.accelerator).toBe('CmdOrCtrl+O');

      const saveItem = items.find((item) => item.label === 'Save');
      expect(saveItem?.accelerator).toBe('CmdOrCtrl+S');
    });

    it('should disable Save when document is not modified', async () => {
      const menu = await createFileMenu({
        ...defaultMenuState,
        hasDocument: true,
        isModified: false,
      });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const saveItem = items.find((item) => item.label === 'Save');
      expect(saveItem?.enabled).toBe(false);
    });

    it('should enable Save when document is modified', async () => {
      const menu = await createFileMenu({
        ...defaultMenuState,
        hasDocument: true,
        isModified: true,
      });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const saveItem = items.find((item) => item.label === 'Save');
      expect(saveItem?.enabled).toBe(true);
    });

    it('should include Exit on Windows/Linux', async () => {
      const menu = await createFileMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const exitItem = items.find((item) => item.label === 'Exit');

      if (isMac) {
        expect(exitItem).toBeUndefined();
      } else {
        expect(exitItem).toBeDefined();
      }
    });
  });

  describe('createEditMenu', () => {
    it('should create Edit menu with standard items', () => {
      const menu = createEditMenu(defaultMenuState);

      expect(menu.label).toBe('Edit');
      expect(menu.submenu).toBeDefined();

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('Undo');
      expect(labels).toContain('Redo');
      expect(labels).toContain('Cut');
      expect(labels).toContain('Copy');
      expect(labels).toContain('Paste');
      expect(labels).toContain('Select All');
      expect(labels).toContain('Find...');
    });

    it('should disable Undo when canUndo is false', () => {
      const menu = createEditMenu({ ...defaultMenuState, canUndo: false });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const undoItem = items.find((item) => item.label === 'Undo');
      expect(undoItem?.enabled).toBe(false);
    });

    it('should enable Undo when canUndo is true', () => {
      const menu = createEditMenu({ ...defaultMenuState, canUndo: true });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const undoItem = items.find((item) => item.label === 'Undo');
      expect(undoItem?.enabled).toBe(true);
    });

    it('should have platform-specific Redo accelerator', () => {
      const menu = createEditMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const redoItem = items.find((item) => item.label === 'Redo');

      if (isMac) {
        expect(redoItem?.accelerator).toBe('Cmd+Shift+Z');
      } else {
        expect(redoItem?.accelerator).toBe('Ctrl+Y');
      }
    });
  });

  describe('createViewMenu', () => {
    it('should create View menu with zoom controls', () => {
      const menu = createViewMenu(defaultMenuState);

      expect(menu.label).toBe('View');

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('Zoom In');
      expect(labels).toContain('Zoom Out');
      expect(labels).toContain('Reset Zoom');
      expect(labels).toContain('Fit to Width');
      expect(labels).toContain('Fit to Page');
    });

    it('should include View Mode submenu', () => {
      const menu = createViewMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const viewModeItem = items.find((item) => item.label === 'View Mode');
      expect(viewModeItem).toBeDefined();
      expect(viewModeItem?.submenu).toBeDefined();
    });

    it('should have correct view mode checked state', () => {
      const menu = createViewMenu({ ...defaultMenuState, viewMode: 'continuous' });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const viewModeItem = items.find((item) => item.label === 'View Mode');
      const viewModeSubmenu = viewModeItem?.submenu as Electron.MenuItemConstructorOptions[];

      const continuousItem = viewModeSubmenu.find((item) => item.label === 'Continuous');
      expect(continuousItem?.checked).toBe(true);

      const singleItem = viewModeSubmenu.find((item) => item.label === 'Single Page');
      expect(singleItem?.checked).toBe(false);
    });

    it('should include Toggle Sidebar option', () => {
      const menu = createViewMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const sidebarItem = items.find((item) => item.label === 'Toggle Sidebar');
      expect(sidebarItem).toBeDefined();
      expect(sidebarItem?.accelerator).toBe('CmdOrCtrl+B');
    });

    it('should include Full Screen option', () => {
      const menu = createViewMenu(defaultMenuState);
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const fullscreenItem = items.find((item) => item.label === 'Enter Full Screen');
      expect(fullscreenItem).toBeDefined();
    });
  });

  describe('createDocumentMenu', () => {
    it('should create Document menu with page operations', () => {
      const menu = createDocumentMenu(defaultMenuState);

      expect(menu.label).toBe('Document');

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('Go to Page...');
      expect(labels).toContain('First Page');
      expect(labels).toContain('Previous Page');
      expect(labels).toContain('Next Page');
      expect(labels).toContain('Last Page');
      expect(labels).toContain('Rotate');
      expect(labels).toContain('Insert Page...');
      expect(labels).toContain('Delete Page');
    });

    it('should include Add Annotation submenu', () => {
      const menu = createDocumentMenu({ ...defaultMenuState, hasDocument: true });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const annotationItem = items.find((item) => item.label === 'Add Annotation');
      expect(annotationItem).toBeDefined();
      expect(annotationItem?.submenu).toBeDefined();

      const annotationSubmenu = annotationItem?.submenu as Electron.MenuItemConstructorOptions[];
      const labels = annotationSubmenu.map((item) => item.label);

      expect(labels).toContain('Highlight');
      expect(labels).toContain('Underline');
      expect(labels).toContain('Strikethrough');
      expect(labels).toContain('Sticky Note');
    });

    it('should enable navigation when document is loaded', () => {
      const menu = createDocumentMenu({
        ...defaultMenuState,
        hasDocument: true,
        currentPage: 2,
        pageCount: 5,
      });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const prevItem = items.find((item) => item.label === 'Previous Page');
      const nextItem = items.find((item) => item.label === 'Next Page');

      expect(prevItem?.enabled).toBe(true);
      expect(nextItem?.enabled).toBe(true);
    });

    it('should disable Previous Page on first page', () => {
      const menu = createDocumentMenu({
        ...defaultMenuState,
        hasDocument: true,
        currentPage: 1,
        pageCount: 5,
      });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const prevItem = items.find((item) => item.label === 'Previous Page');
      expect(prevItem?.enabled).toBe(false);
    });

    it('should disable Next Page on last page', () => {
      const menu = createDocumentMenu({
        ...defaultMenuState,
        hasDocument: true,
        currentPage: 5,
        pageCount: 5,
      });
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const nextItem = items.find((item) => item.label === 'Next Page');
      expect(nextItem?.enabled).toBe(false);
    });
  });

  describe('createWindowMenu', () => {
    it('should create Window menu with standard items', () => {
      const menu = createWindowMenu();

      expect(menu.label).toBe('Window');
      expect(menu.submenu).toBeDefined();

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('Minimize');
      expect(labels).toContain('Zoom');
    });

    it('should include Bring All to Front on macOS', () => {
      const menu = createWindowMenu();
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const bringAllItem = items.find((item) => item.label === 'Bring All to Front');

      if (isMac) {
        expect(bringAllItem).toBeDefined();
      }
    });
  });

  describe('createHelpMenu', () => {
    it('should create Help menu with standard items', () => {
      const menu = createHelpMenu();

      expect(menu.label).toBe('Help');

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain('Keyboard Shortcuts');
      expect(labels).toContain('Documentation');
      expect(labels).toContain('Report Issue');
      expect(labels).toContain('Check for Updates...');
    });

    it('should include About on Windows/Linux', () => {
      const menu = createHelpMenu();
      const items = menu.submenu as Electron.MenuItemConstructorOptions[];

      const aboutItem = items.find((item) => item.label === `About ${APP_NAME}`);

      if (!isMac) {
        expect(aboutItem).toBeDefined();
      }
    });
  });

  describe('createMacAppMenu', () => {
    it('should create macOS app menu', () => {
      const menu = createMacAppMenu();

      expect(menu.label).toBe(APP_NAME);
      expect(menu.submenu).toBeDefined();

      const labels = (menu.submenu as Electron.MenuItemConstructorOptions[]).map(
        (item) => item.label
      );

      expect(labels).toContain(`About ${APP_NAME}`);
      expect(labels).toContain('Preferences...');
      expect(labels).toContain('Services');
      expect(labels).toContain(`Hide ${APP_NAME}`);
      expect(labels).toContain(`Quit ${APP_NAME}`);
    });
  });

  describe('Platform detection', () => {
    it('should detect platform correctly', () => {
      // Only one should be true
      const platforms = [isMac, isWindows, isLinux];
      const trueCount = platforms.filter(Boolean).length;

      // In the test environment, one platform should be detected
      expect(trueCount).toBeLessThanOrEqual(1);
    });
  });
});
