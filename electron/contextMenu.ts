/**
 * Context Menu Module
 *
 * Provides context menus for the document viewer and annotations.
 * Handles right-click interactions in the Electron application.
 */

import { Menu, BrowserWindow, IpcMain } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS } from './ipc/channels';

/**
 * Context menu options for document view
 */
export interface DocumentContextOptions {
  hasSelection: boolean;
  hasDocument: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentPage: number;
  pageCount: number;
  zoom: number;
  x: number;
  y: number;
}

/**
 * Context menu options for annotations
 */
export interface AnnotationContextOptions {
  annotationId: string;
  annotationType: 'highlight' | 'underline' | 'strikethrough' | 'note' | 'drawing' | 'shape';
  canEdit: boolean;
  canDelete: boolean;
  x: number;
  y: number;
}

/**
 * Send context menu action to renderer
 */
function sendContextAction(window: BrowserWindow, event: string, ...args: unknown[]): void {
  if (!window.isDestroyed()) {
    window.webContents.send(event, ...args);
  }
}

/**
 * Create document context menu
 */
export function createDocumentContextMenu(
  window: BrowserWindow,
  options: DocumentContextOptions
): Menu {
  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

  // Text selection actions
  if (options.hasSelection) {
    template.push(
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
      { type: 'separator' },
      {
        label: 'Highlight Selection',
        accelerator: 'H',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_ANNOTATION_HIGHLIGHT),
      },
      {
        label: 'Underline Selection',
        accelerator: 'U',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_ANNOTATION_UNDERLINE),
      },
      {
        label: 'Strikethrough Selection',
        accelerator: 'S',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_ANNOTATION_STRIKETHROUGH),
      },
      { type: 'separator' }
    );
  }

  // Add annotation actions
  if (options.hasDocument) {
    template.push(
      {
        label: 'Add Annotation',
        submenu: [
          {
            label: 'Sticky Note',
            accelerator: 'N',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_DOCUMENT, {
                action: 'add-note',
                x: options.x,
                y: options.y,
              }),
          },
          {
            label: 'Drawing',
            accelerator: 'D',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_DOCUMENT, {
                action: 'add-drawing',
                x: options.x,
                y: options.y,
              }),
          },
          {
            label: 'Shape',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_DOCUMENT, {
                action: 'add-shape',
                x: options.x,
                y: options.y,
              }),
          },
        ],
      },
      { type: 'separator' }
    );
  }

  // Zoom actions
  template.push(
    {
      label: 'Zoom In',
      accelerator: 'CmdOrCtrl+Plus',
      enabled: options.hasDocument,
      click: () => sendContextAction(window, IPC_EVENTS.MENU_VIEW_ZOOM_IN),
    },
    {
      label: 'Zoom Out',
      accelerator: 'CmdOrCtrl+-',
      enabled: options.hasDocument,
      click: () => sendContextAction(window, IPC_EVENTS.MENU_VIEW_ZOOM_OUT),
    },
    {
      label: 'Reset Zoom',
      accelerator: 'CmdOrCtrl+0',
      enabled: options.hasDocument,
      click: () => sendContextAction(window, IPC_EVENTS.MENU_VIEW_ZOOM_RESET),
    },
    {
      label: `Zoom: ${options.zoom}%`,
      enabled: false,
    },
    { type: 'separator' }
  );

  // Page navigation
  if (options.hasDocument && options.pageCount > 1) {
    template.push(
      {
        label: 'Previous Page',
        accelerator: 'Left',
        enabled: options.currentPage > 1,
        click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_PREVIOUS_PAGE),
      },
      {
        label: 'Next Page',
        accelerator: 'Right',
        enabled: options.currentPage < options.pageCount,
        click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_NEXT_PAGE),
      },
      {
        label: 'Go to Page...',
        accelerator: 'CmdOrCtrl+J',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_GO_TO_PAGE),
      },
      {
        label: `Page ${options.currentPage} of ${options.pageCount}`,
        enabled: false,
      },
      { type: 'separator' }
    );
  }

  // Page actions
  if (options.hasDocument) {
    template.push(
      {
        label: 'Rotate Page Left',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_ROTATE_LEFT),
      },
      {
        label: 'Rotate Page Right',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_ROTATE_RIGHT),
      },
      { type: 'separator' }
    );
  }

  // Undo/Redo
  if (options.canUndo || options.canRedo) {
    if (options.canUndo) {
      template.push({
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_EDIT_UNDO),
      });
    }
    if (options.canRedo) {
      template.push({
        label: 'Redo',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y',
        click: () => sendContextAction(window, IPC_EVENTS.MENU_EDIT_REDO),
      });
    }
    template.push({ type: 'separator' });
  }

  // Document properties
  if (options.hasDocument) {
    template.push({
      label: 'Document Properties...',
      click: () => sendContextAction(window, IPC_EVENTS.MENU_DOCUMENT_PROPERTIES),
    });
  }

  return Menu.buildFromTemplate(template);
}

/**
 * Create annotation context menu
 */
export function createAnnotationContextMenu(
  window: BrowserWindow,
  options: AnnotationContextOptions
): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [];

  // Edit annotation
  if (options.canEdit) {
    template.push({
      label: 'Edit Annotation',
      click: () =>
        sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
          action: 'edit',
          annotationId: options.annotationId,
        }),
    });
  }

  // Annotation-specific actions
  switch (options.annotationType) {
    case 'highlight':
    case 'underline':
    case 'strikethrough':
      template.push({
        label: 'Change Color',
        submenu: [
          {
            label: 'Yellow',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
                action: 'change-color',
                annotationId: options.annotationId,
                color: '#FFEB3B',
              }),
          },
          {
            label: 'Green',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
                action: 'change-color',
                annotationId: options.annotationId,
                color: '#4CAF50',
              }),
          },
          {
            label: 'Blue',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
                action: 'change-color',
                annotationId: options.annotationId,
                color: '#2196F3',
              }),
          },
          {
            label: 'Pink',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
                action: 'change-color',
                annotationId: options.annotationId,
                color: '#E91E63',
              }),
          },
          {
            label: 'Orange',
            click: () =>
              sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
                action: 'change-color',
                annotationId: options.annotationId,
                color: '#FF9800',
              }),
          },
        ],
      });
      break;

    case 'note':
      template.push({
        label: 'Reply',
        click: () =>
          sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
            action: 'reply',
            annotationId: options.annotationId,
          }),
      });
      break;

    case 'drawing':
    case 'shape':
      template.push(
        {
          label: 'Bring to Front',
          click: () =>
            sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
              action: 'bring-to-front',
              annotationId: options.annotationId,
            }),
        },
        {
          label: 'Send to Back',
          click: () =>
            sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
              action: 'send-to-back',
              annotationId: options.annotationId,
            }),
        }
      );
      break;
  }

  template.push({ type: 'separator' });

  // Copy annotation content (for notes)
  if (options.annotationType === 'note') {
    template.push({
      label: 'Copy Note Text',
      click: () =>
        sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
          action: 'copy-text',
          annotationId: options.annotationId,
        }),
    });
  }

  // Delete annotation
  if (options.canDelete) {
    template.push({
      label: 'Delete Annotation',
      accelerator: 'Delete',
      click: () =>
        sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
          action: 'delete',
          annotationId: options.annotationId,
        }),
    });
  }

  template.push({ type: 'separator' });

  // Properties
  template.push({
    label: 'Properties...',
    click: () =>
      sendContextAction(window, IPC_EVENTS.CONTEXT_MENU_ANNOTATION, {
        action: 'properties',
        annotationId: options.annotationId,
      }),
  });

  return Menu.buildFromTemplate(template);
}

/**
 * Show document context menu
 */
export function showDocumentContextMenu(
  window: BrowserWindow,
  options: DocumentContextOptions
): void {
  const menu = createDocumentContextMenu(window, options);
  menu.popup({ window });
}

/**
 * Show annotation context menu
 */
export function showAnnotationContextMenu(
  window: BrowserWindow,
  options: AnnotationContextOptions
): void {
  const menu = createAnnotationContextMenu(window, options);
  menu.popup({ window });
}

/**
 * Set up context menu IPC handlers
 */
export function setupContextMenuHandlers(ipc: IpcMain): void {
  // Show document context menu
  ipc.handle(
    IPC_CHANNELS.CONTEXT_MENU_SHOW_DOCUMENT,
    (event, options: DocumentContextOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        showDocumentContextMenu(window, options);
      }
    }
  );

  // Show annotation context menu
  ipc.handle(
    IPC_CHANNELS.CONTEXT_MENU_SHOW_ANNOTATION,
    (event, options: AnnotationContextOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        showAnnotationContextMenu(window, options);
      }
    }
  );
}

/**
 * Export types
 */
export type { DocumentContextOptions, AnnotationContextOptions };
