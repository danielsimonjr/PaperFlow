import { describe, it, expect } from 'vitest';
import {
  formatMemory,
  estimateDocumentMemory,
  CanvasDisposer,
  isMemoryApiAvailable,
} from '@lib/performance/memoryManager';

describe('memoryManager', () => {
  describe('formatMemory', () => {
    it('formats bytes as KB', () => {
      expect(formatMemory(1536)).toBe('2 KB');
    });

    it('formats bytes as MB', () => {
      expect(formatMemory(5 * 1024 * 1024)).toBe('5.0 MB');
    });

    it('formats small values as KB', () => {
      expect(formatMemory(512)).toBe('1 KB');
    });
  });

  describe('estimateDocumentMemory', () => {
    it('estimates memory for a normal document', () => {
      const result = estimateDocumentMemory(10);
      expect(result.estimated).toBeGreaterThan(0);
      expect(result.isLargeDocument).toBe(false);
      expect(result.warning).toBeNull();
    });

    it('flags large documents over 100 pages', () => {
      const result = estimateDocumentMemory(150);
      expect(result.isLargeDocument).toBe(true);
    });

    it('shows warning for documents over 500 pages', () => {
      const result = estimateDocumentMemory(600);
      expect(result.warning).toContain('600 pages');
    });

    it('handles single page', () => {
      const result = estimateDocumentMemory(1);
      expect(result.isLargeDocument).toBe(false);
      expect(result.warning).toBeNull();
    });
  });

  describe('isMemoryApiAvailable', () => {
    it('returns a boolean', () => {
      const result = isMemoryApiAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('CanvasDisposer', () => {
    it('tracks registered canvases', () => {
      const disposer = new CanvasDisposer();
      const canvas = document.createElement('canvas');

      disposer.register('page-1', canvas);
      expect(disposer.count).toBe(1);
    });

    it('disposes a canvas', () => {
      const disposer = new CanvasDisposer();
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      disposer.register('page-1', canvas);
      disposer.dispose('page-1');

      expect(disposer.count).toBe(0);
      expect(canvas.width).toBe(0);
      expect(canvas.height).toBe(0);
    });

    it('disposes all canvases', () => {
      const disposer = new CanvasDisposer();
      disposer.register('page-1', document.createElement('canvas'));
      disposer.register('page-2', document.createElement('canvas'));
      disposer.register('page-3', document.createElement('canvas'));

      disposer.disposeAll();
      expect(disposer.count).toBe(0);
    });

    it('handles disposing non-existent canvas', () => {
      const disposer = new CanvasDisposer();
      expect(() => disposer.dispose('nonexistent')).not.toThrow();
    });
  });
});
