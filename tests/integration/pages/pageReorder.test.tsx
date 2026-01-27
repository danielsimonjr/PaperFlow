import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PDFDocument } from 'pdf-lib';
import { usePageDrag } from '@hooks/usePageDrag';
import { usePageSelection } from '@hooks/usePageSelection';
import {
  reorderPages,
  movePage,
  movePages,
} from '@lib/pages/pageOperations';

// Create a mock PDF with specified number of pages
async function createMockPdf(pageCount: number): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([612, 792]); // Letter size
  }
  const bytes = await pdfDoc.save();
  return bytes.buffer;
}

describe('Page Reorder Integration', () => {
  describe('usePageDrag hook', () => {
    it('should initialize with no dragging state', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set(),
          onReorder,
        })
      );

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.draggedPages).toEqual([]);
      expect(result.current.dragState.dropTargetIndex).toBeNull();
      expect(result.current.dragState.dropPosition).toBeNull();
    });

    it('should provide drag props for pages', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set(),
          onReorder,
        })
      );

      const dragProps = result.current.getDragProps(2);

      expect(dragProps.draggable).toBe(true);
      expect(typeof dragProps.onDragStart).toBe('function');
      expect(typeof dragProps.onDragOver).toBe('function');
      expect(typeof dragProps.onDragLeave).toBe('function');
      expect(typeof dragProps.onDrop).toBe('function');
      expect(typeof dragProps.onDragEnd).toBe('function');
    });

    it('should track dragged single page', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set(),
          onReorder,
        })
      );

      const mockDataTransfer = {
        setData: vi.fn(),
        getData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
        dropEffect: '',
      };

      const mockEvent = {
        dataTransfer: mockDataTransfer,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(2, mockEvent);
      });

      expect(result.current.dragState.isDragging).toBe(true);
      expect(result.current.dragState.draggedPages).toEqual([2]);
      expect(mockDataTransfer.setData).toHaveBeenCalled();
    });

    it('should drag all selected pages when dragging a selected page', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set([1, 2, 3]),
          onReorder,
        })
      );

      const mockDataTransfer = {
        setData: vi.fn(),
        getData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
        dropEffect: '',
      };

      const mockEvent = {
        dataTransfer: mockDataTransfer,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(2, mockEvent);
      });

      expect(result.current.dragState.draggedPages).toEqual([1, 2, 3]);
    });

    it('should clear drag state on drag end', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set(),
          onReorder,
        })
      );

      const mockDataTransfer = {
        setData: vi.fn(),
        getData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
        dropEffect: '',
      };

      const mockEvent = {
        dataTransfer: mockDataTransfer,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(0, mockEvent);
      });

      expect(result.current.dragState.isDragging).toBe(true);

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.dragState.isDragging).toBe(false);
      expect(result.current.dragState.draggedPages).toEqual([]);
    });

    it('should clear drop target on drag leave', () => {
      const onReorder = vi.fn();
      const { result } = renderHook(() =>
        usePageDrag({
          pageCount: 5,
          selectedPages: new Set(),
          onReorder,
        })
      );

      act(() => {
        result.current.handleDragLeave();
      });

      expect(result.current.dragState.dropTargetIndex).toBeNull();
      expect(result.current.dragState.dropPosition).toBeNull();
    });
  });

  describe('usePageSelection + usePageDrag combined', () => {
    it('should allow selecting multiple pages and then dragging them', () => {
      const onReorder = vi.fn();

      const { result: selectionResult } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      // Select pages 2, 3, 4
      act(() => {
        selectionResult.current.toggleSelection(2);
      });
      act(() => {
        selectionResult.current.toggleSelection(3, { ctrlKey: true } as React.MouseEvent);
      });
      act(() => {
        selectionResult.current.toggleSelection(4, { ctrlKey: true } as React.MouseEvent);
      });

      expect(selectionResult.current.getSelectedArray()).toEqual([2, 3, 4]);

      // Now use drag hook with selection
      const { result: dragResult } = renderHook(() =>
        usePageDrag({
          pageCount: 10,
          selectedPages: selectionResult.current.selectedPages,
          onReorder,
        })
      );

      const mockDataTransfer = {
        setData: vi.fn(),
        getData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
        dropEffect: '',
      };

      const mockEvent = {
        dataTransfer: mockDataTransfer,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        dragResult.current.handleDragStart(3, mockEvent);
      });

      expect(dragResult.current.dragState.draggedPages).toEqual([2, 3, 4]);
    });
  });

  describe('Page reorder operations', () => {
    it('should reorder pages correctly', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await reorderPages(pdfBytes, [4, 3, 2, 1, 0]);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(5);
    });

    it('should move single page forward', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await movePage(pdfBytes, 0, 4);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(5);
    });

    it('should move single page backward', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await movePage(pdfBytes, 4, 0);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(5);
    });

    it('should move multiple pages to new position', async () => {
      const pdfBytes = await createMockPdf(10);
      const result = await movePages(pdfBytes, [0, 1, 2], 7);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(10);
    });

    it('should handle moving pages to beginning', async () => {
      const pdfBytes = await createMockPdf(6);
      const result = await movePages(pdfBytes, [4, 5], 0);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(6);
    });

    it('should handle moving non-consecutive pages', async () => {
      const pdfBytes = await createMockPdf(8);
      // Moving 3 pages, so max valid target is 8 - 3 = 5
      const result = await movePages(pdfBytes, [1, 3, 5], 5);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(8);
    });

    it('should throw error for invalid source index', async () => {
      const pdfBytes = await createMockPdf(5);

      await expect(movePage(pdfBytes, -1, 2)).rejects.toThrow('Invalid source page index');
      await expect(movePage(pdfBytes, 10, 2)).rejects.toThrow('Invalid source page index');
    });

    it('should throw error for invalid target index', async () => {
      const pdfBytes = await createMockPdf(5);

      await expect(movePage(pdfBytes, 0, -1)).rejects.toThrow('Invalid target page index');
      await expect(movePage(pdfBytes, 0, 10)).rejects.toThrow('Invalid target page index');
    });

    it('should handle moving to same position gracefully', async () => {
      const pdfBytes = await createMockPdf(5);
      const result = await movePage(pdfBytes, 2, 2);

      const doc = await PDFDocument.load(result);
      expect(doc.getPageCount()).toBe(5);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid new order length', async () => {
      const pdfBytes = await createMockPdf(5);

      await expect(reorderPages(pdfBytes, [0, 1, 2])).rejects.toThrow(
        'New order must include all pages'
      );
    });

    it('should throw error for duplicate indices in new order', async () => {
      const pdfBytes = await createMockPdf(3);

      await expect(reorderPages(pdfBytes, [0, 0, 2])).rejects.toThrow(
        'New order must include each page index exactly once'
      );
    });

    it('should throw error for invalid page indices in movePages', async () => {
      const pdfBytes = await createMockPdf(5);

      await expect(movePages(pdfBytes, [0, 10], 2)).rejects.toThrow(
        'Invalid page index'
      );
    });
  });
});
