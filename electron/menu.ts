/**
 * Application Menu Manager
 *
 * Manages the native application menu bar with dynamic updates
 * based on document state and user actions.
 */

import { Menu, app } from 'electron';
import {
  buildMenuTemplate,
  MenuState,
  defaultMenuState,
} from './menuTemplate';

/**
 * Current menu state
 */
let currentMenuState: MenuState = { ...defaultMenuState };

/**
 * Debounce timer for menu updates
 */
let menuUpdateTimer: NodeJS.Timeout | null = null;

/**
 * Menu update debounce delay in milliseconds
 */
const MENU_UPDATE_DELAY = 50;

/**
 * Build and set the application menu
 */
export async function buildApplicationMenu(state?: Partial<MenuState>): Promise<void> {
  // Merge with current state
  if (state) {
    currentMenuState = { ...currentMenuState, ...state };
  }

  // Build menu template
  const template = await buildMenuTemplate(currentMenuState);

  // Build and set menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Update menu state and rebuild menu (debounced)
 */
export function updateMenuState(state: Partial<MenuState>): void {
  // Update state immediately
  currentMenuState = { ...currentMenuState, ...state };

  // Debounce menu rebuild
  if (menuUpdateTimer) {
    clearTimeout(menuUpdateTimer);
  }

  menuUpdateTimer = setTimeout(async () => {
    menuUpdateTimer = null;
    await buildApplicationMenu();
  }, MENU_UPDATE_DELAY);
}

/**
 * Get current menu state
 */
export function getMenuState(): MenuState {
  return { ...currentMenuState };
}

/**
 * Reset menu state to defaults
 */
export async function resetMenuState(): Promise<void> {
  currentMenuState = { ...defaultMenuState };
  await buildApplicationMenu();
}

/**
 * Enable/disable document-related menu items
 */
export function setDocumentLoaded(hasDocument: boolean): void {
  updateMenuState({ hasDocument });
}

/**
 * Update modified state
 */
export function setDocumentModified(isModified: boolean): void {
  updateMenuState({ isModified });
}

/**
 * Update undo/redo availability
 */
export function setHistoryState(canUndo: boolean, canRedo: boolean): void {
  updateMenuState({ canUndo, canRedo });
}

/**
 * Update view mode
 */
export function setViewMode(viewMode: 'single' | 'continuous' | 'spread'): void {
  updateMenuState({ viewMode });
}

/**
 * Update zoom level
 */
export function setZoom(zoom: number): void {
  updateMenuState({ zoom });
}

/**
 * Update fullscreen state
 */
export function setFullscreen(isFullscreen: boolean): void {
  updateMenuState({ isFullscreen });
}

/**
 * Update page navigation state
 */
export function setPageState(currentPage: number, pageCount: number): void {
  updateMenuState({ currentPage, pageCount });
}

/**
 * Initialize menu on app ready
 */
export async function initializeMenu(): Promise<void> {
  // Build initial menu
  await buildApplicationMenu();

  // Listen for window focus changes to update menu state
  app.on('browser-window-focus', () => {
    // Menu state will be updated by renderer through IPC
  });

  // Listen for fullscreen changes
  app.on('browser-window-created', (_, window) => {
    window.on('enter-full-screen', () => {
      setFullscreen(true);
    });

    window.on('leave-full-screen', () => {
      setFullscreen(false);
    });
  });
}

/**
 * Get the File menu by label
 */
export function getFileMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const fileMenuItem = menu.items.find((item) => item.label === 'File');
  return fileMenuItem?.submenu || null;
}

/**
 * Get the Edit menu by label
 */
export function getEditMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const editMenuItem = menu.items.find((item) => item.label === 'Edit');
  return editMenuItem?.submenu || null;
}

/**
 * Get the View menu by label
 */
export function getViewMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const viewMenuItem = menu.items.find((item) => item.label === 'View');
  return viewMenuItem?.submenu || null;
}

/**
 * Get the Document menu by label
 */
export function getDocumentMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const documentMenuItem = menu.items.find((item) => item.label === 'Document');
  return documentMenuItem?.submenu || null;
}

/**
 * Get the Window menu by label
 */
export function getWindowMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const windowMenuItem = menu.items.find((item) => item.label === 'Window');
  return windowMenuItem?.submenu || null;
}

/**
 * Get the Help menu by label
 */
export function getHelpMenu(): Electron.Menu | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  const helpMenuItem = menu.items.find((item) => item.label === 'Help');
  return helpMenuItem?.submenu || null;
}

/**
 * Get menu item by ID (for testing)
 */
export function getMenuItemById(id: string): Electron.MenuItem | null {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;

  return menu.getMenuItemById(id);
}

/**
 * Export types
 */
export type { MenuState };
export { defaultMenuState };
