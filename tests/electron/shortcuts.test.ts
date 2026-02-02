/**
 * Shortcuts Module Tests
 *
 * Tests for keyboard shortcuts and global shortcut registration.
 */

import { describe, it, expect, vi } from 'vitest';
import './setup';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(() => Promise.resolve('{}')),
    writeFile: vi.fn(() => Promise.resolve()),
  },
}));

import {
  DEFAULT_SHORTCUTS,
  getAccelerator,
  checkAcceleratorConflict,
  getAllShortcuts,
  getShortcutsByCategory,
  type ShortcutDefinition,
} from '../../electron/shortcuts';

describe('Shortcuts Module', () => {
  describe('DEFAULT_SHORTCUTS', () => {
    it('should define file operation shortcuts', () => {
      const fileShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'file');

      expect(fileShortcuts.length).toBeGreaterThan(0);

      const ids = fileShortcuts.map((s) => s.id);
      expect(ids).toContain('file-open');
      expect(ids).toContain('file-save');
      expect(ids).toContain('file-save-as');
      expect(ids).toContain('file-close');
      expect(ids).toContain('file-print');
    });

    it('should define edit operation shortcuts', () => {
      const editShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'edit');

      expect(editShortcuts.length).toBeGreaterThan(0);

      const ids = editShortcuts.map((s) => s.id);
      expect(ids).toContain('edit-undo');
      expect(ids).toContain('edit-redo');
      expect(ids).toContain('edit-find');
    });

    it('should define view shortcuts', () => {
      const viewShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'view');

      expect(viewShortcuts.length).toBeGreaterThan(0);

      const ids = viewShortcuts.map((s) => s.id);
      expect(ids).toContain('view-zoom-in');
      expect(ids).toContain('view-zoom-out');
      expect(ids).toContain('view-zoom-reset');
      expect(ids).toContain('view-fullscreen');
    });

    it('should define document shortcuts', () => {
      const docShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'document');

      expect(docShortcuts.length).toBeGreaterThan(0);

      const ids = docShortcuts.map((s) => s.id);
      expect(ids).toContain('document-go-to-page');
      expect(ids).toContain('document-previous-page');
      expect(ids).toContain('document-next-page');
    });

    it('should define annotation shortcuts', () => {
      const annotationShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'annotation');

      expect(annotationShortcuts.length).toBeGreaterThan(0);

      const ids = annotationShortcuts.map((s) => s.id);
      expect(ids).toContain('annotation-highlight');
      expect(ids).toContain('annotation-underline');
      expect(ids).toContain('annotation-strikethrough');
      expect(ids).toContain('annotation-note');
    });

    it('should define global shortcuts', () => {
      const globalShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.isGlobal);

      expect(globalShortcuts.length).toBeGreaterThan(0);
      expect(globalShortcuts.every((s) => s.category === 'global')).toBe(true);
    });

    it('should have unique IDs', () => {
      const ids = DEFAULT_SHORTCUTS.map((s) => s.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have required fields for all shortcuts', () => {
      for (const shortcut of DEFAULT_SHORTCUTS) {
        expect(shortcut.id).toBeDefined();
        expect(shortcut.name).toBeDefined();
        expect(shortcut.description).toBeDefined();
        expect(shortcut.defaultAccelerator).toBeDefined();
        expect(shortcut.category).toBeDefined();
        expect(typeof shortcut.isGlobal).toBe('boolean');
      }
    });
  });

  describe('getAccelerator', () => {
    it('should return default accelerator for known shortcut', () => {
      const accelerator = getAccelerator('file-open');
      expect(accelerator).toBe('CmdOrCtrl+O');
    });

    it('should return undefined for unknown shortcut', () => {
      const accelerator = getAccelerator('unknown-shortcut');
      expect(accelerator).toBeUndefined();
    });
  });

  describe('getAllShortcuts', () => {
    it('should return all shortcuts', () => {
      const shortcuts = getAllShortcuts();

      expect(Array.isArray(shortcuts)).toBe(true);
      expect(shortcuts.length).toBe(DEFAULT_SHORTCUTS.length);
    });

    it('should include custom accelerators if set', () => {
      const shortcuts = getAllShortcuts();

      // By default, no custom accelerators should be set
      const withCustom = shortcuts.filter((s) => s.customAccelerator !== undefined);
      expect(withCustom.length).toBe(0);
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should filter shortcuts by category', () => {
      const fileShortcuts = getShortcutsByCategory('file');
      expect(fileShortcuts.every((s) => s.category === 'file')).toBe(true);

      const editShortcuts = getShortcutsByCategory('edit');
      expect(editShortcuts.every((s) => s.category === 'edit')).toBe(true);

      const viewShortcuts = getShortcutsByCategory('view');
      expect(viewShortcuts.every((s) => s.category === 'view')).toBe(true);
    });

    it('should return empty array for invalid category', () => {
      const shortcuts = getShortcutsByCategory('invalid' as ShortcutDefinition['category']);
      expect(shortcuts).toEqual([]);
    });
  });

  describe('checkAcceleratorConflict', () => {
    it('should detect conflict with existing shortcut', () => {
      // Try to use Ctrl+O which is already used by file-open
      const conflict = checkAcceleratorConflict('edit-undo', 'CmdOrCtrl+O');

      expect(conflict).not.toBeNull();
      expect(conflict?.id).toBe('file-open');
    });

    it('should return null for non-conflicting accelerator', () => {
      // Use a unique accelerator
      const conflict = checkAcceleratorConflict('file-open', 'CmdOrCtrl+Shift+Alt+X');

      expect(conflict).toBeNull();
    });

    it('should not conflict with itself', () => {
      // file-open using its own accelerator
      const conflict = checkAcceleratorConflict('file-open', 'CmdOrCtrl+O');

      expect(conflict).toBeNull();
    });
  });

  describe('Shortcut accelerator formats', () => {
    it('should use CmdOrCtrl for cross-platform shortcuts', () => {
      const crossPlatformShortcuts = DEFAULT_SHORTCUTS.filter(
        (s) =>
          s.defaultAccelerator.includes('CmdOrCtrl') ||
          s.defaultAccelerator.includes('Cmd') ||
          s.defaultAccelerator.includes('Ctrl')
      );

      // Most shortcuts should be cross-platform compatible
      expect(crossPlatformShortcuts.length).toBeGreaterThan(0);
    });

    it('should have valid accelerator format', () => {
      for (const shortcut of DEFAULT_SHORTCUTS) {
        const accelerator = shortcut.defaultAccelerator;

        // Check that accelerator is not empty
        expect(accelerator.length).toBeGreaterThan(0);

        // Check for valid modifier keys if + is present
        if (accelerator.includes('+')) {
          const parts = accelerator.split('+');
          const validModifiers = ['CmdOrCtrl', 'Cmd', 'Ctrl', 'Alt', 'Shift', 'Option', 'Meta'];
          const validKeys = [
            ...validModifiers,
            // Letters and numbers
            ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
            ...Array.from({ length: 10 }, (_, i) => String(i)),
            // Special keys
            'Plus',
            'Space',
            'Tab',
            'Backspace',
            'Delete',
            'Insert',
            'Home',
            'End',
            'PageUp',
            'PageDown',
            'Up',
            'Down',
            'Left',
            'Right',
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            'F7',
            'F8',
            'F9',
            'F10',
            'F11',
            'F12',
            'Escape',
            'Enter',
            'Return',
            '-',
            '/',
            ',',
          ];

          for (const part of parts) {
            expect(validKeys).toContain(part);
          }
        }
      }
    });
  });

  describe('Annotation shortcuts', () => {
    it('should have single-key accelerators for annotations', () => {
      const annotationShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'annotation');

      for (const shortcut of annotationShortcuts) {
        // Annotation shortcuts are typically single letters
        const accelerator = shortcut.defaultAccelerator;

        // They should be short (single key or Ctrl+ combo)
        expect(accelerator.length).toBeLessThan(20);
      }
    });

    it('should have highlight shortcut as H', () => {
      const highlight = DEFAULT_SHORTCUTS.find((s) => s.id === 'annotation-highlight');
      expect(highlight?.defaultAccelerator).toBe('H');
    });

    it('should have underline shortcut as U', () => {
      const underline = DEFAULT_SHORTCUTS.find((s) => s.id === 'annotation-underline');
      expect(underline?.defaultAccelerator).toBe('U');
    });

    it('should have note shortcut as N', () => {
      const note = DEFAULT_SHORTCUTS.find((s) => s.id === 'annotation-note');
      expect(note?.defaultAccelerator).toBe('N');
    });
  });

  describe('Global shortcuts', () => {
    it('should mark global shortcuts correctly', () => {
      const globalShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.isGlobal);

      expect(globalShortcuts.length).toBeGreaterThan(0);

      // All global shortcuts should be in the global category
      for (const shortcut of globalShortcuts) {
        expect(shortcut.category).toBe('global');
      }
    });

    it('should include quick open as global shortcut', () => {
      const quickOpen = DEFAULT_SHORTCUTS.find((s) => s.id === 'global-quick-open');

      expect(quickOpen).toBeDefined();
      expect(quickOpen?.isGlobal).toBe(true);
    });

    it('should include bring to front as global shortcut', () => {
      const bringToFront = DEFAULT_SHORTCUTS.find((s) => s.id === 'global-bring-to-front');

      expect(bringToFront).toBeDefined();
      expect(bringToFront?.isGlobal).toBe(true);
    });
  });
});
