import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pdfjs-dist with inline mock implementations
vi.mock('pdfjs-dist', () => {
  const mockPage = {
    getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
    render: vi.fn().mockReturnValue({
      promise: Promise.resolve(),
      cancel: vi.fn(),
    }),
    getTextContent: vi.fn().mockResolvedValue({
      items: [
        { str: 'Hello' },
        { str: 'World' },
      ],
    }),
    rotate: 0,
  };

  const mockDocument = {
    numPages: 5,
    getPage: vi.fn().mockResolvedValue(mockPage),
    getMetadata: vi.fn().mockResolvedValue({
      info: {
        Title: 'Test Document',
        Author: 'Test Author',
        Subject: 'Test Subject',
      },
    }),
    getOutline: vi.fn().mockResolvedValue(null),
    getDestination: vi.fn(),
    getPageIndex: vi.fn(),
    destroy: vi.fn(),
  };

  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve(mockDocument),
    }),
    __mockDocument: mockDocument,
    __mockPage: mockPage,
  };
});

import { PDFRenderer } from '@lib/pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';

// Get mock references after import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDocument = (pdfjsLib as any).__mockDocument;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPage = (pdfjsLib as any).__mockPage;

describe('PDFRenderer', () => {
  let renderer: PDFRenderer;

  beforeEach(() => {
    renderer = new PDFRenderer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('loadDocument', () => {
    it('should load a document from ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(100);
      const info = await renderer.loadDocument(buffer);

      expect(info.numPages).toBe(5);
      expect(info.title).toBe('Test Document');
      expect(info.author).toBe('Test Author');
    });

    it('should load a password-protected document', async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer, 'password123');

      expect(pdfjsLib.getDocument).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'password123' })
      );
    });

    it('should destroy existing document before loading new one', async () => {
      const buffer = new ArrayBuffer(100);

      // Load first document
      await renderer.loadDocument(buffer);

      // Load second document
      await renderer.loadDocument(buffer);

      expect(mockDocument.destroy).toHaveBeenCalled();
    });
  });

  describe('renderPage', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);

      // Mock canvas context
      mockContext = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        clearRect: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      mockCanvas = document.createElement('canvas');
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    });

    it('should render a page to canvas', async () => {
      const result = await renderer.renderPage(1, mockCanvas);

      expect(mockDocument.getPage).toHaveBeenCalledWith(1);
      expect(mockPage.render).toHaveBeenCalled();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should apply scale to rendering', async () => {
      await renderer.renderPage(1, mockCanvas, 2.0);

      expect(mockPage.getViewport).toHaveBeenCalledWith(
        expect.objectContaining({ scale: expect.any(Number) })
      );
    });

    it('should throw error when no document is loaded', async () => {
      renderer.destroy();

      await expect(renderer.renderPage(1, mockCanvas)).rejects.toThrow('No document loaded');
    });

    it('should cancel existing render task for same page', async () => {
      // Start first render (don't await)
      const render1 = renderer.renderPage(1, mockCanvas);

      // Start second render for same page
      const render2 = renderer.renderPage(1, mockCanvas);

      await Promise.all([render1.catch(() => {}), render2]);

      // Both should complete or cancel without error
    });
  });

  describe('cancelRender', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);

      // Mock canvas context
      mockContext = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(),
        putImageData: vi.fn(),
        clearRect: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      mockCanvas = document.createElement('canvas');
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    });

    it('should cancel an ongoing render task', async () => {
      // Start render
      const renderPromise = renderer.renderPage(1, mockCanvas);

      // Cancel it
      renderer.cancelRender(1);

      // Should complete or reject gracefully
      await renderPromise.catch(() => {});
    });

    it('should do nothing if no render task exists', () => {
      // Should not throw
      renderer.cancelRender(99);
    });
  });

  describe('getPageInfo', () => {
    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);
    });

    it('should return page dimensions and rotation', async () => {
      const info = await renderer.getPageInfo(1);

      expect(info.pageNumber).toBe(1);
      expect(info.width).toBe(612);
      expect(info.height).toBe(792);
      expect(info.rotation).toBe(0);
    });

    it('should throw error when no document is loaded', async () => {
      renderer.destroy();

      await expect(renderer.getPageInfo(1)).rejects.toThrow('No document loaded');
    });
  });

  describe('getTextContent', () => {
    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);
    });

    it('should return text content items', async () => {
      const content = await renderer.getTextContent(1);

      expect(content.items).toHaveLength(2);
    });

    it('should throw error when no document is loaded', async () => {
      renderer.destroy();

      await expect(renderer.getTextContent(1)).rejects.toThrow('No document loaded');
    });
  });

  describe('getTextContentAsString', () => {
    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);
    });

    it('should return concatenated text', async () => {
      const text = await renderer.getTextContentAsString(1);

      expect(text).toBe('Hello World');
    });
  });

  describe('getPage', () => {
    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);
    });

    it('should return the PDF page proxy', async () => {
      const page = await renderer.getPage(1);

      expect(page).toBe(mockPage);
    });

    it('should throw error when no document is loaded', async () => {
      renderer.destroy();

      await expect(renderer.getPage(1)).rejects.toThrow('No document loaded');
    });
  });

  describe('getOutline', () => {
    beforeEach(async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);
    });

    it('should return empty array when no outline', async () => {
      const outline = await renderer.getOutline();

      expect(outline).toEqual([]);
    });

    it('should return outline items with page numbers', async () => {
      mockDocument.getOutline.mockResolvedValueOnce([
        { title: 'Chapter 1', dest: 'chapter1', items: [] },
        { title: 'Chapter 2', dest: 'chapter2', items: [] },
      ]);
      mockDocument.getDestination.mockResolvedValue([{ num: 0 }]);
      mockDocument.getPageIndex.mockResolvedValue(0);

      const outline = await renderer.getOutline();

      expect(outline).toHaveLength(2);
      expect(outline[0]?.title).toBe('Chapter 1');
      expect(outline[0]?.pageNumber).toBe(1);
    });

    it('should handle nested outline items', async () => {
      mockDocument.getOutline.mockResolvedValueOnce([
        {
          title: 'Chapter 1',
          dest: null,
          items: [
            { title: 'Section 1.1', dest: null, items: [] },
          ],
        },
      ]);

      const outline = await renderer.getOutline();

      expect(outline[0]?.children).toHaveLength(1);
      expect(outline[0]?.children?.[0]?.title).toBe('Section 1.1');
    });

    it('should throw error when no document is loaded', async () => {
      renderer.destroy();

      await expect(renderer.getOutline()).rejects.toThrow('No document loaded');
    });
  });

  describe('getPageCount', () => {
    it('should return 0 when no document loaded', () => {
      expect(renderer.getPageCount()).toBe(0);
    });

    it('should return correct page count after loading', async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);

      expect(renderer.getPageCount()).toBe(5);
    });
  });

  describe('destroy', () => {
    it('should destroy the document', async () => {
      const buffer = new ArrayBuffer(100);
      await renderer.loadDocument(buffer);

      renderer.destroy();

      expect(mockDocument.destroy).toHaveBeenCalled();
      expect(renderer.getPageCount()).toBe(0);
    });

    it('should handle destroy when no document loaded', () => {
      // Should not throw
      renderer.destroy();
    });
  });
});
