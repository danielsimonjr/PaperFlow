import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageSelection } from '@hooks/usePageSelection';

describe('usePageSelection', () => {
  describe('initial state', () => {
    it('should start with no selection', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      expect(result.current.selectionCount).toBe(0);
      expect(result.current.getSelectedArray()).toEqual([]);
    });

    it('should have lastSelectedIndex as null initially', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      expect(result.current.lastSelectedIndex).toBeNull();
    });
  });

  describe('toggleSelection', () => {
    it('should select a page on regular click', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.toggleSelection(5);
      });

      expect(result.current.isSelected(5)).toBe(true);
      expect(result.current.selectionCount).toBe(1);
    });

    it('should replace selection on regular click', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.toggleSelection(3);
      });

      act(() => {
        result.current.toggleSelection(5);
      });

      expect(result.current.isSelected(3)).toBe(false);
      expect(result.current.isSelected(5)).toBe(true);
      expect(result.current.selectionCount).toBe(1);
    });

    it('should toggle individual selection with ctrl+click', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      const ctrlClickEvent = { ctrlKey: true } as React.MouseEvent;

      act(() => {
        result.current.toggleSelection(3, ctrlClickEvent);
      });

      act(() => {
        result.current.toggleSelection(5, ctrlClickEvent);
      });

      expect(result.current.isSelected(3)).toBe(true);
      expect(result.current.isSelected(5)).toBe(true);
      expect(result.current.selectionCount).toBe(2);

      // Toggle off
      act(() => {
        result.current.toggleSelection(3, ctrlClickEvent);
      });

      expect(result.current.isSelected(3)).toBe(false);
      expect(result.current.selectionCount).toBe(1);
    });

    it('should select range with shift+click', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.toggleSelection(2);
      });

      const shiftClickEvent = { shiftKey: true } as React.MouseEvent;

      act(() => {
        result.current.toggleSelection(6, shiftClickEvent);
      });

      expect(result.current.getSelectedArray()).toEqual([2, 3, 4, 5, 6]);
      expect(result.current.selectionCount).toBe(5);
    });

    it('should handle cmd+click on Mac', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      const metaClickEvent = { metaKey: true } as React.MouseEvent;

      act(() => {
        result.current.toggleSelection(3, metaClickEvent);
      });

      act(() => {
        result.current.toggleSelection(5, metaClickEvent);
      });

      expect(result.current.isSelected(3)).toBe(true);
      expect(result.current.isSelected(5)).toBe(true);
    });
  });

  describe('selectRange', () => {
    it('should select a range of pages', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.selectRange(2, 5);
      });

      expect(result.current.getSelectedArray()).toEqual([2, 3, 4, 5]);
    });

    it('should handle reversed range', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.selectRange(5, 2);
      });

      expect(result.current.getSelectedArray()).toEqual([2, 3, 4, 5]);
    });

    it('should clamp to valid range', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 5 })
      );

      act(() => {
        result.current.selectRange(-5, 10);
      });

      expect(result.current.getSelectedArray()).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('selectAll', () => {
    it('should select all pages', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 5 })
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(5);
      expect(result.current.getSelectedArray()).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selection', () => {
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10 })
      );

      act(() => {
        result.current.selectAll();
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectionCount).toBe(0);
      expect(result.current.lastSelectedIndex).toBeNull();
    });
  });

  describe('onSelectionChange callback', () => {
    it('should call callback when selection changes', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        usePageSelection({ pageCount: 10, onSelectionChange: callback })
      );

      act(() => {
        result.current.toggleSelection(5);
      });

      expect(callback).toHaveBeenCalledWith([5]);
    });
  });
});
