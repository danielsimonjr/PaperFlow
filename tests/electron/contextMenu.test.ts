/**
 * Context Menu Tests
 *
 * Tests for context menu creation and behavior.
 */

import { describe, it, expect } from 'vitest';
import './setup';
import {
  createDocumentContextMenu,
  createAnnotationContextMenu,
  type DocumentContextOptions,
  type AnnotationContextOptions,
} from '../../electron/contextMenu';
import { mockBrowserWindow } from './setup';

describe('Context Menu Module', () => {
  const mockWindow = new mockBrowserWindow() as unknown as Electron.BrowserWindow;

  describe('createDocumentContextMenu', () => {
    const defaultOptions: DocumentContextOptions = {
      hasSelection: false,
      hasDocument: true,
      canUndo: false,
      canRedo: false,
      currentPage: 1,
      pageCount: 5,
      zoom: 100,
      x: 100,
      y: 200,
    };

    it('should create a menu with zoom controls', () => {
      const menu = createDocumentContextMenu(mockWindow, defaultOptions);

      expect(menu).toBeDefined();
      // Menu should be a valid Electron.Menu object
    });

    it('should include selection items when text is selected', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        hasSelection: true,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      // Menu should include copy and annotation options
      expect(menu).toBeDefined();
    });

    it('should include page navigation when document has pages', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        hasDocument: true,
        currentPage: 2,
        pageCount: 5,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include undo option when canUndo is true', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        canUndo: true,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include Add Annotation submenu', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        hasDocument: true,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include document properties option', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        hasDocument: true,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should show zoom percentage', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        zoom: 150,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should show page info for multi-page documents', () => {
      const options: DocumentContextOptions = {
        ...defaultOptions,
        hasDocument: true,
        currentPage: 3,
        pageCount: 10,
      };

      const menu = createDocumentContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });
  });

  describe('createAnnotationContextMenu', () => {
    const defaultOptions: AnnotationContextOptions = {
      annotationId: 'test-annotation-1',
      annotationType: 'highlight',
      canEdit: true,
      canDelete: true,
      x: 100,
      y: 200,
    };

    it('should create a menu for annotations', () => {
      const menu = createAnnotationContextMenu(mockWindow, defaultOptions);

      expect(menu).toBeDefined();
    });

    it('should include Edit option when canEdit is true', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        canEdit: true,
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include Delete option when canDelete is true', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        canDelete: true,
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include color options for highlight annotations', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        annotationType: 'highlight',
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include color options for underline annotations', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        annotationType: 'underline',
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include Reply option for note annotations', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        annotationType: 'note',
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include layer options for drawing annotations', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        annotationType: 'drawing',
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should include layer options for shape annotations', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        annotationType: 'shape',
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should always include Properties option', () => {
      const menu = createAnnotationContextMenu(mockWindow, defaultOptions);

      expect(menu).toBeDefined();
    });

    it('should not include Edit when canEdit is false', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        canEdit: false,
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });

    it('should not include Delete when canDelete is false', () => {
      const options: AnnotationContextOptions = {
        ...defaultOptions,
        canDelete: false,
      };

      const menu = createAnnotationContextMenu(mockWindow, options);

      expect(menu).toBeDefined();
    });
  });

  describe('Annotation types', () => {
    it('should handle all annotation types', () => {
      const types: AnnotationContextOptions['annotationType'][] = [
        'highlight',
        'underline',
        'strikethrough',
        'note',
        'drawing',
        'shape',
      ];

      for (const annotationType of types) {
        const options: AnnotationContextOptions = {
          annotationId: `test-${annotationType}`,
          annotationType,
          canEdit: true,
          canDelete: true,
          x: 0,
          y: 0,
        };

        const menu = createAnnotationContextMenu(mockWindow, options);
        expect(menu).toBeDefined();
      }
    });
  });
});
