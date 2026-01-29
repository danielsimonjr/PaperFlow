import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dpiToScale,
  canvasToBlob,
  renderPageToCanvas,
  type PageRenderer,
} from '@lib/export/imageExport';

describe('imageExport', () => {
  describe('dpiToScale', () => {
    it('returns 1.0 for 72 DPI', () => {
      expect(dpiToScale(72)).toBe(1);
    });

    it('returns approximately 2.08 for 150 DPI', () => {
      expect(dpiToScale(150)).toBeCloseTo(2.083, 2);
    });

    it('returns approximately 4.17 for 300 DPI', () => {
      expect(dpiToScale(300)).toBeCloseTo(4.167, 2);
    });
  });

  describe('canvasToBlob', () => {
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockCanvas.width = 100;
      mockCanvas.height = 100;
    });

    it('converts canvas to PNG blob', async () => {
      // Mock toBlob
      mockCanvas.toBlob = vi.fn((callback, mimeType) => {
        expect(mimeType).toBe('image/png');
        callback(new Blob(['test'], { type: 'image/png' }));
      });

      const blob = await canvasToBlob(mockCanvas, 'png', 0.9);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('converts canvas to JPEG blob with quality', async () => {
      mockCanvas.toBlob = vi.fn((callback, mimeType, quality) => {
        expect(mimeType).toBe('image/jpeg');
        expect(quality).toBe(0.85);
        callback(new Blob(['test'], { type: 'image/jpeg' }));
      });

      const blob = await canvasToBlob(mockCanvas, 'jpeg', 0.85);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('rejects when toBlob fails', async () => {
      mockCanvas.toBlob = vi.fn((callback) => {
        callback(null);
      });

      await expect(canvasToBlob(mockCanvas, 'png', 0.9)).rejects.toThrow(
        'Failed to convert canvas to blob'
      );
    });
  });

  describe('renderPageToCanvas', () => {
    it('renders a page at the specified DPI', async () => {
      const mockContext = {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockContext),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

      const mockPage = {
        getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      };

      const mockRenderer: PageRenderer = {
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      const canvas = await renderPageToCanvas(mockRenderer, 1, 72);

      expect(mockRenderer.getPage).toHaveBeenCalledWith(1);
      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1 });
      expect(mockPage.render).toHaveBeenCalled();
      expect(canvas).toBeDefined();
    });

    it('applies DPI scaling', async () => {
      const mockContext = {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockContext),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

      const mockPage = {
        getViewport: vi.fn().mockReturnValue({ width: 1224, height: 1584 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      };

      const mockRenderer: PageRenderer = {
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      await renderPageToCanvas(mockRenderer, 1, 150);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: dpiToScale(150) });
    });

    it('throws when canvas context is null', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(null),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

      const mockPage = {
        getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
      };

      const mockRenderer: PageRenderer = {
        getPage: vi.fn().mockResolvedValue(mockPage),
      };

      await expect(renderPageToCanvas(mockRenderer, 1, 72)).rejects.toThrow(
        'Failed to get canvas context'
      );
    });
  });
});
