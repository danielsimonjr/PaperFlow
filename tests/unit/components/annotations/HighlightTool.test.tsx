import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHighlightTool } from '@hooks/useHighlightTool';
import { HIGHLIGHT_TOOL_COLORS } from '@components/annotations/HighlightTool';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';

describe('HighlightTool', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#FFEB3B',
      activeOpacity: 0.5,
    });
    useHistoryStore.setState({
      past: [],
      future: [],
    });
  });

  describe('HIGHLIGHT_TOOL_COLORS', () => {
    it('should have 5 default highlight colors', () => {
      expect(HIGHLIGHT_TOOL_COLORS).toHaveLength(5);
    });

    it('should include yellow, green, blue, pink, and orange', () => {
      const colorNames = HIGHLIGHT_TOOL_COLORS.map((c) => c.name.toLowerCase());
      expect(colorNames).toContain('yellow');
      expect(colorNames).toContain('green');
      expect(colorNames).toContain('blue');
      expect(colorNames).toContain('pink');
      expect(colorNames).toContain('orange');
    });

    it('should have valid hex color values', () => {
      HIGHLIGHT_TOOL_COLORS.forEach((color) => {
        expect(color.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('useHighlightTool', () => {
    it('should create a highlight annotation', () => {
      const { result } = renderHook(() => useHighlightTool());

      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0]?.type).toBe('highlight');
      expect(annotations[0]?.pageIndex).toBe(0);
      expect(annotations[0]?.rects).toEqual(rects);
    });

    it('should use active color from store', () => {
      useAnnotationStore.setState({ activeColor: '#4CAF50' });

      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe('#4CAF50');
    });

    it('should use custom color when provided', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects, { color: '#E91E63' });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe('#E91E63');
    });

    it('should use active opacity from store', () => {
      useAnnotationStore.setState({ activeOpacity: 0.75 });

      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.opacity).toBe(0.75);
    });

    it('should use custom opacity when provided', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects, { opacity: 0.3 });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.opacity).toBe(0.3);
    });

    it('should store selected text content', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects, { text: 'Selected text' });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.content).toBe('Selected text');
    });

    it('should return null for empty rects', () => {
      const { result } = renderHook(() => useHighlightTool());

      let id: string | null = null;
      act(() => {
        id = result.current.createHighlight(0, []);
      });

      expect(id).toBeNull();
      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should push to history for undo support', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const historyState = useHistoryStore.getState();
      expect(historyState.past).toHaveLength(1);
      expect(historyState.past[0]?.action).toBe('add_highlight');
    });

    it('should support undo via history', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      // Undo
      act(() => {
        useHistoryStore.getState().undo();
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should handle multiple rects for multi-line selections', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [
        { x: 100, y: 200, width: 200, height: 20 },
        { x: 50, y: 180, width: 250, height: 20 },
        { x: 50, y: 160, width: 150, height: 20 },
      ];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.rects).toHaveLength(3);
    });

    it('should return the annotation id', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 200, width: 50, height: 20 }];

      let id: string | null = null;
      act(() => {
        id = result.current.createHighlight(0, rects);
      });

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(useAnnotationStore.getState().annotations[0]?.id).toBe(id);
    });
  });
});
