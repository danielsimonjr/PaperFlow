import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatePrintScale, getOrientationCSS } from '@lib/print/executePrint';
import { renderPagesForPrint, type PrintRenderOptions } from '@lib/print/printRenderer';

describe('Print Flow Integration', () => {
  describe('print scale and orientation work together', () => {
    it('fit scale with portrait orientation', () => {
      const scale = calculatePrintScale('fit', 100);
      const css = getOrientationCSS('portrait');

      expect(scale).toBe(1.0);
      expect(css).toContain('portrait');
    });

    it('custom scale with landscape orientation', () => {
      const scale = calculatePrintScale('custom', 75);
      const css = getOrientationCSS('landscape');

      expect(scale).toBe(0.75);
      expect(css).toContain('landscape');
    });

    it('actual scale with auto orientation', () => {
      const scale = calculatePrintScale('actual', 100);
      const css = getOrientationCSS('auto');

      expect(scale).toBe(1.0);
      expect(css).toContain('auto');
    });
  });

  describe('multi-page print rendering', () => {
    const mockContext = {
      fillStyle: '',
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
    } as unknown as HTMLCanvasElement;

    const mockPage = {
      getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
    };

    const mockRenderer = {
      getPage: vi.fn().mockResolvedValue(mockPage),
    };

    const options: PrintRenderOptions = {
      includeAnnotations: true,
      includeFormFields: true,
      scale: 1.0,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);
    });

    it('renders all pages in order', async () => {
      const pages = [1, 3, 5];
      const result = await renderPagesForPrint(mockRenderer, pages, options);

      expect(result).toHaveLength(3);
      expect(mockRenderer.getPage).toHaveBeenCalledWith(1);
      expect(mockRenderer.getPage).toHaveBeenCalledWith(3);
      expect(mockRenderer.getPage).toHaveBeenCalledWith(5);
    });

    it('tracks progress during rendering', async () => {
      const progress = vi.fn();
      await renderPagesForPrint(mockRenderer, [1, 2, 3], options, progress);

      expect(progress).toHaveBeenCalledTimes(3);
      expect(progress).toHaveBeenCalledWith(1, 3);
      expect(progress).toHaveBeenCalledWith(2, 3);
      expect(progress).toHaveBeenCalledWith(3, 3);
    });

    it('applies custom scale to all pages', async () => {
      const customOptions = { ...options, scale: 1.5 };
      await renderPagesForPrint(mockRenderer, [1, 2], customOptions);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.5 });
    });
  });
});
