import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderPageForPrint, renderPagesForPrint, type PrintRenderOptions } from '@lib/print/printRenderer';

describe('printRenderer', () => {
  const mockContext = {
    fillStyle: '',
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(mockContext),
  } as unknown as HTMLCanvasElement;

  const mockViewport = { width: 612, height: 792 };

  const mockPage = {
    getViewport: vi.fn().mockReturnValue(mockViewport),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
  };

  const mockRenderer = {
    getPage: vi.fn().mockResolvedValue(mockPage),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);
  });

  const defaultOptions: PrintRenderOptions = {
    includeAnnotations: true,
    includeFormFields: true,
    scale: 1.0,
  };

  describe('renderPageForPrint', () => {
    it('renders a page to a canvas', async () => {
      const result = await renderPageForPrint(mockRenderer, 1, defaultOptions);
      expect(result).toBeDefined();
      expect(mockRenderer.getPage).toHaveBeenCalledWith(1);
    });

    it('uses the specified scale', async () => {
      await renderPageForPrint(mockRenderer, 1, { ...defaultOptions, scale: 2.0 });
      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 2.0 });
    });

    it('sets white background', async () => {
      await renderPageForPrint(mockRenderer, 1, defaultOptions);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('throws when canvas context is unavailable', async () => {
      (mockCanvas.getContext as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

      await expect(
        renderPageForPrint(mockRenderer, 1, defaultOptions)
      ).rejects.toThrow('Failed to get canvas context');
    });
  });

  describe('renderPagesForPrint', () => {
    it('renders multiple pages', async () => {
      const result = await renderPagesForPrint(mockRenderer, [1, 2, 3], defaultOptions);
      expect(result).toHaveLength(3);
    });

    it('calls progress callback', async () => {
      const onProgress = vi.fn();
      await renderPagesForPrint(mockRenderer, [1, 2], defaultOptions, onProgress);

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });

    it('returns empty array for empty page list', async () => {
      const result = await renderPagesForPrint(mockRenderer, [], defaultOptions);
      expect(result).toHaveLength(0);
    });
  });
});
