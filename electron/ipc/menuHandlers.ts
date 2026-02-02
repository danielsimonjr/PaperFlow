/**
 * Menu IPC Handlers
 *
 * Handles IPC communication for menu state updates and menu actions
 * between the main process and renderer.
 */

import { IpcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from './channels';
import {
  getMenuState,
  setDocumentLoaded,
  setDocumentModified,
  setHistoryState,
  setViewMode,
  setZoom,
  setPageState,
  MenuState,
} from '../menu';

/**
 * Menu state update payload from renderer
 */
export interface MenuStateUpdate {
  hasDocument?: boolean;
  isModified?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  viewMode?: 'single' | 'continuous' | 'spread';
  zoom?: number;
  currentPage?: number;
  pageCount?: number;
}

/**
 * Set up menu-related IPC handlers
 */
export function setupMenuHandlers(ipcMain: IpcMain): void {
  // Update menu state from renderer
  ipcMain.handle(
    IPC_CHANNELS.MENU_UPDATE_STATE,
    (_event, update: MenuStateUpdate) => {
      if (update.hasDocument !== undefined) {
        setDocumentLoaded(update.hasDocument);
      }
      if (update.isModified !== undefined) {
        setDocumentModified(update.isModified);
      }
      if (update.canUndo !== undefined || update.canRedo !== undefined) {
        const currentState = getMenuState();
        setHistoryState(
          update.canUndo ?? currentState.canUndo,
          update.canRedo ?? currentState.canRedo
        );
      }
      if (update.viewMode !== undefined) {
        setViewMode(update.viewMode);
      }
      if (update.zoom !== undefined) {
        setZoom(update.zoom);
      }
      if (update.currentPage !== undefined || update.pageCount !== undefined) {
        const currentState = getMenuState();
        setPageState(
          update.currentPage ?? currentState.currentPage,
          update.pageCount ?? currentState.pageCount
        );
      }
      return true;
    }
  );

  // Get current menu state
  ipcMain.handle(IPC_CHANNELS.MENU_GET_STATE, () => {
    return getMenuState();
  });
}

/**
 * Notify renderer of fullscreen change
 */
export function notifyFullscreenChange(window: BrowserWindow, isFullscreen: boolean): void {
  if (!window.isDestroyed()) {
    window.webContents.send('menu-fullscreen-changed', isFullscreen);
  }
}

/**
 * Types for menu action handlers
 */
export interface MenuActionHandlers {
  onFileNew?: () => void;
  onFileNewWindow?: () => void;
  onFileOpen?: () => void;
  onFileSave?: () => void;
  onFileSaveAs?: () => void;
  onFileClose?: () => void;
  onFilePrint?: () => void;
  onEditUndo?: () => void;
  onEditRedo?: () => void;
  onEditFind?: () => void;
  onViewZoomIn?: () => void;
  onViewZoomOut?: () => void;
  onViewZoomReset?: () => void;
  onViewFitWidth?: () => void;
  onViewFitPage?: () => void;
  onViewMode?: (mode: 'single' | 'continuous' | 'spread') => void;
  onViewToggleSidebar?: () => void;
  onViewToggleToolbar?: () => void;
  onDocumentGoToPage?: () => void;
  onDocumentFirstPage?: () => void;
  onDocumentPreviousPage?: () => void;
  onDocumentNextPage?: () => void;
  onDocumentLastPage?: () => void;
  onDocumentRotateLeft?: () => void;
  onDocumentRotateRight?: () => void;
  onDocumentInsertPage?: () => void;
  onDocumentDeletePage?: () => void;
  onDocumentExtractPages?: () => void;
  onDocumentProperties?: () => void;
  onAnnotationHighlight?: () => void;
  onAnnotationUnderline?: () => void;
  onAnnotationStrikethrough?: () => void;
  onAnnotationNote?: () => void;
  onAnnotationDrawing?: () => void;
  onAnnotationShape?: () => void;
  onHelpShortcuts?: () => void;
  onHelpReleaseNotes?: () => void;
  onHelpCheckUpdates?: () => void;
  onHelpAbout?: () => void;
  onPreferences?: () => void;
}

export type { MenuState };
