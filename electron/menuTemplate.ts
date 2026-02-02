/**
 * Menu Template Definitions
 *
 * Defines the structure and content of application menus.
 * Platform-specific variations are handled through conditional logic.
 */

import { MenuItemConstructorOptions, app, shell, BrowserWindow } from 'electron';
import { IPC_EVENTS } from './ipc/channels';
import { createRecentFilesMenuItems } from './recentFiles';

/**
 * Platform detection
 */
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

/**
 * Application name for menus
 */
const APP_NAME = 'PaperFlow';

/**
 * Get keyboard shortcut modifier based on platform
 */
export function getModifier(): string {
  return isMac ? 'Cmd' : 'Ctrl';
}

/**
 * Create cross-platform accelerator
 */
export function createAccelerator(shortcut: string): string {
  return shortcut.replace(/CmdOrCtrl/g, getModifier());
}

/**
 * Menu item state for dynamic updates
 */
export interface MenuState {
  hasDocument: boolean;
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;
  viewMode: 'single' | 'continuous' | 'spread';
  zoom: number;
  isFullscreen: boolean;
  currentPage: number;
  pageCount: number;
}

/**
 * Default menu state
 */
export const defaultMenuState: MenuState = {
  hasDocument: false,
  isModified: false,
  canUndo: false,
  canRedo: false,
  viewMode: 'single',
  zoom: 100,
  isFullscreen: false,
  currentPage: 1,
  pageCount: 0,
};

/**
 * Send menu event to renderer
 */
function sendMenuEvent(event: string, ...args: unknown[]): void {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow && !focusedWindow.isDestroyed()) {
    focusedWindow.webContents.send(event, ...args);
  }
}

/**
 * Create the macOS application menu
 */
export function createMacAppMenu(): MenuItemConstructorOptions {
  return {
    label: APP_NAME,
    submenu: [
      {
        label: `About ${APP_NAME}`,
        role: 'about',
      },
      { type: 'separator' },
      {
        label: 'Preferences...',
        accelerator: 'Cmd+,',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_PREFERENCES),
      },
      { type: 'separator' },
      {
        label: 'Services',
        role: 'services',
      },
      { type: 'separator' },
      {
        label: `Hide ${APP_NAME}`,
        role: 'hide',
      },
      {
        label: 'Hide Others',
        role: 'hideOthers',
      },
      {
        label: 'Show All',
        role: 'unhide',
      },
      { type: 'separator' },
      {
        label: `Quit ${APP_NAME}`,
        role: 'quit',
      },
    ],
  };
}

/**
 * Create the File menu
 */
export async function createFileMenu(state: MenuState): Promise<MenuItemConstructorOptions> {
  const recentFilesItems = await createRecentFilesMenuItems();

  return {
    label: 'File',
    submenu: [
      {
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_NEW_WINDOW),
      },
      { type: 'separator' },
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_OPEN),
      },
      {
        label: 'Open Recent',
        submenu: recentFilesItems.map((item) => ({
          label: item.label,
          sublabel: item.sublabel,
          accelerator: item.accelerator,
          enabled: item.enabled,
          click: item.click,
        })),
      },
      { type: 'separator' },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_CLOSE),
      },
      { type: 'separator' },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        enabled: state.hasDocument && state.isModified,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_SAVE),
      },
      {
        label: 'Save As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_SAVE_AS),
      },
      { type: 'separator' },
      {
        label: 'Export',
        enabled: state.hasDocument,
        submenu: [
          {
            label: 'Export as Images...',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_EXPORT_IMAGES),
          },
          {
            label: 'Export as Text...',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_EXPORT_TEXT),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Print...',
        accelerator: 'CmdOrCtrl+P',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_FILE_PRINT),
      },
      // Exit only on Windows/Linux (macOS uses App menu)
      ...(isMac
        ? []
        : [
            { type: 'separator' as const },
            {
              label: 'Exit',
              accelerator: 'Alt+F4',
              role: 'quit' as const,
            },
          ]),
    ],
  };
}

/**
 * Create the Edit menu
 */
export function createEditMenu(state: MenuState): MenuItemConstructorOptions {
  return {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        enabled: state.canUndo,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_EDIT_UNDO),
      },
      {
        label: 'Redo',
        accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
        enabled: state.canRedo,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_EDIT_REDO),
      },
      { type: 'separator' },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      ...(isMac
        ? [
            {
              label: 'Paste and Match Style',
              accelerator: 'Cmd+Shift+V',
              role: 'pasteAndMatchStyle' as const,
            },
          ]
        : []),
      {
        label: 'Delete',
        role: 'delete',
      },
      { type: 'separator' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
      { type: 'separator' },
      {
        label: 'Find...',
        accelerator: 'CmdOrCtrl+F',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_EDIT_FIND),
      },
      {
        label: 'Find Next',
        accelerator: 'CmdOrCtrl+G',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_EDIT_FIND_NEXT),
      },
      {
        label: 'Find Previous',
        accelerator: 'CmdOrCtrl+Shift+G',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_EDIT_FIND_PREVIOUS),
      },
      ...(isMac
        ? []
        : [
            { type: 'separator' as const },
            {
              label: 'Preferences...',
              accelerator: 'Ctrl+,',
              click: () => sendMenuEvent(IPC_EVENTS.MENU_PREFERENCES),
            },
          ]),
    ],
  };
}

/**
 * Create the View menu
 */
export function createViewMenu(state: MenuState): MenuItemConstructorOptions {
  return {
    label: 'View',
    submenu: [
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_ZOOM_IN),
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_ZOOM_OUT),
      },
      {
        label: 'Reset Zoom',
        accelerator: 'CmdOrCtrl+0',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_ZOOM_RESET),
      },
      { type: 'separator' },
      {
        label: 'Fit to Width',
        accelerator: 'CmdOrCtrl+1',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_FIT_WIDTH),
      },
      {
        label: 'Fit to Page',
        accelerator: 'CmdOrCtrl+2',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_FIT_PAGE),
      },
      { type: 'separator' },
      {
        label: 'View Mode',
        enabled: state.hasDocument,
        submenu: [
          {
            label: 'Single Page',
            type: 'radio',
            checked: state.viewMode === 'single',
            accelerator: 'CmdOrCtrl+Alt+1',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_MODE, 'single'),
          },
          {
            label: 'Continuous',
            type: 'radio',
            checked: state.viewMode === 'continuous',
            accelerator: 'CmdOrCtrl+Alt+2',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_MODE, 'continuous'),
          },
          {
            label: 'Spread',
            type: 'radio',
            checked: state.viewMode === 'spread',
            accelerator: 'CmdOrCtrl+Alt+3',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_MODE, 'spread'),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Toggle Sidebar',
        accelerator: 'CmdOrCtrl+B',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_TOGGLE_SIDEBAR),
      },
      {
        label: 'Toggle Toolbar',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_VIEW_TOGGLE_TOOLBAR),
      },
      { type: 'separator' },
      {
        label: 'Enter Full Screen',
        accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
        checked: state.isFullscreen,
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload',
        visible: !app.isPackaged,
      },
      {
        label: 'Force Reload',
        accelerator: 'CmdOrCtrl+Shift+R',
        role: 'forceReload',
        visible: !app.isPackaged,
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        role: 'toggleDevTools',
        visible: !app.isPackaged,
      },
    ],
  };
}

/**
 * Create the Document menu
 */
export function createDocumentMenu(state: MenuState): MenuItemConstructorOptions {
  return {
    label: 'Document',
    submenu: [
      {
        label: 'Go to Page...',
        accelerator: 'CmdOrCtrl+J',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_GO_TO_PAGE),
      },
      {
        label: 'First Page',
        accelerator: 'CmdOrCtrl+Home',
        enabled: state.hasDocument && state.currentPage > 1,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_FIRST_PAGE),
      },
      {
        label: 'Previous Page',
        accelerator: 'CmdOrCtrl+Up',
        enabled: state.hasDocument && state.currentPage > 1,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_PREVIOUS_PAGE),
      },
      {
        label: 'Next Page',
        accelerator: 'CmdOrCtrl+Down',
        enabled: state.hasDocument && state.currentPage < state.pageCount,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_NEXT_PAGE),
      },
      {
        label: 'Last Page',
        accelerator: 'CmdOrCtrl+End',
        enabled: state.hasDocument && state.currentPage < state.pageCount,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_LAST_PAGE),
      },
      { type: 'separator' },
      {
        label: 'Rotate',
        enabled: state.hasDocument,
        submenu: [
          {
            label: 'Rotate Left',
            accelerator: 'CmdOrCtrl+Shift+L',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_ROTATE_LEFT),
          },
          {
            label: 'Rotate Right',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_ROTATE_RIGHT),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Insert Page...',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_INSERT_PAGE),
      },
      {
        label: 'Delete Page',
        enabled: state.hasDocument && state.pageCount > 1,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_DELETE_PAGE),
      },
      {
        label: 'Extract Pages...',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_EXTRACT_PAGES),
      },
      { type: 'separator' },
      {
        label: 'Add Annotation',
        enabled: state.hasDocument,
        submenu: [
          {
            label: 'Highlight',
            accelerator: 'H',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_HIGHLIGHT),
          },
          {
            label: 'Underline',
            accelerator: 'U',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_UNDERLINE),
          },
          {
            label: 'Strikethrough',
            accelerator: 'S',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_STRIKETHROUGH),
          },
          {
            label: 'Sticky Note',
            accelerator: 'N',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_NOTE),
          },
          { type: 'separator' },
          {
            label: 'Drawing',
            accelerator: 'D',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_DRAWING),
          },
          {
            label: 'Shape',
            click: () => sendMenuEvent(IPC_EVENTS.MENU_ANNOTATION_SHAPE),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Document Properties...',
        enabled: state.hasDocument,
        click: () => sendMenuEvent(IPC_EVENTS.MENU_DOCUMENT_PROPERTIES),
      },
    ],
  };
}

/**
 * Create the Window menu
 */
export function createWindowMenu(): MenuItemConstructorOptions {
  const windowSubmenu: MenuItemConstructorOptions['submenu'] = [
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize',
    },
    {
      label: 'Zoom',
      role: 'zoom',
    },
  ];

  if (isMac) {
    windowSubmenu.push(
      { type: 'separator' },
      {
        label: 'Bring All to Front',
        role: 'front',
      },
      { type: 'separator' },
      {
        label: 'Window',
        role: 'window',
      }
    );
  } else {
    windowSubmenu.push({
      label: 'Close',
      accelerator: 'Alt+F4',
      role: 'close',
    });
  }

  return {
    label: 'Window',
    submenu: windowSubmenu,
  };
}

/**
 * Create the Help menu
 */
export function createHelpMenu(): MenuItemConstructorOptions {
  return {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Keyboard Shortcuts',
        accelerator: 'CmdOrCtrl+/',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_HELP_SHORTCUTS),
      },
      { type: 'separator' },
      {
        label: 'Documentation',
        click: () => {
          shell.openExternal('https://github.com/PaperFlow/paperflow#readme');
        },
      },
      {
        label: 'Report Issue',
        click: () => {
          shell.openExternal('https://github.com/PaperFlow/paperflow/issues');
        },
      },
      {
        label: 'Release Notes',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_HELP_RELEASE_NOTES),
      },
      { type: 'separator' },
      {
        label: 'Check for Updates...',
        click: () => sendMenuEvent(IPC_EVENTS.MENU_HELP_CHECK_UPDATES),
      },
      ...(isMac
        ? []
        : [
            { type: 'separator' as const },
            {
              label: `About ${APP_NAME}`,
              click: () => sendMenuEvent(IPC_EVENTS.MENU_HELP_ABOUT),
            },
          ]),
    ],
  };
}

/**
 * Build the complete menu template
 */
export async function buildMenuTemplate(
  state: MenuState = defaultMenuState
): Promise<MenuItemConstructorOptions[]> {
  const template: MenuItemConstructorOptions[] = [];

  // macOS application menu
  if (isMac) {
    template.push(createMacAppMenu());
  }

  // Standard menus
  template.push(await createFileMenu(state));
  template.push(createEditMenu(state));
  template.push(createViewMenu(state));
  template.push(createDocumentMenu(state));
  template.push(createWindowMenu());
  template.push(createHelpMenu());

  return template;
}

/**
 * Export platform info for tests
 */
export { isMac, isWindows, isLinux, APP_NAME };
