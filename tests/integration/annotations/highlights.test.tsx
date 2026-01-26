import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import { useHighlightTool } from '@hooks/useHighlightTool';
import { HIGHLIGHT_COLORS } from '@components/annotations/SelectionPopup';

/**
 * Integration tests for highlight annotation workflow.
 * Tests the complete flow from text selection to highlight creation,
 * editing, and deletion with undo/redo support.
 */
describe('Highlights Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
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

  describe('highlight creation workflow', () => {
    it('should create highlight from text selection', () => {
      const { result } = renderHook(() => useHighlightTool());

      // Simulate text selection rectangles
      const selectionRects = [
        { x: 72, y: 700, width: 300, height: 14 },
        { x: 72, y: 680, width: 250, height: 14 },
      ];

      act(() => {
        result.current.createHighlight(0, selectionRects, {
          text: 'Selected paragraph text',
        });
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0]?.type).toBe('highlight');
      expect(annotations[0]?.rects).toEqual(selectionRects);
      expect(annotations[0]?.content).toBe('Selected paragraph text');
    });

    it('should use store active color and opacity', () => {
      // Set custom color and opacity
      useAnnotationStore.setState({
        activeColor: '#4CAF50',
        activeOpacity: 0.75,
      });

      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe('#4CAF50');
      expect(annotation?.opacity).toBe(0.75);
    });

    it('should create highlights on different pages', () => {
      const { result } = renderHook(() => useHighlightTool());

      act(() => {
        result.current.createHighlight(0, [{ x: 100, y: 500, width: 200, height: 14 }]);
        result.current.createHighlight(2, [{ x: 150, y: 600, width: 180, height: 14 }]);
        result.current.createHighlight(0, [{ x: 100, y: 300, width: 220, height: 14 }]);
      });

      const allAnnotations = useAnnotationStore.getState().annotations;
      const page0Annotations = useAnnotationStore.getState().getPageAnnotations(0);
      const page2Annotations = useAnnotationStore.getState().getPageAnnotations(2);

      expect(allAnnotations).toHaveLength(3);
      expect(page0Annotations).toHaveLength(2);
      expect(page2Annotations).toHaveLength(1);
    });
  });

  describe('highlight editing workflow', () => {
    it('should update highlight color', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      let highlightId: string | null = null;
      act(() => {
        highlightId = result.current.createHighlight(0, rects);
      });

      act(() => {
        useAnnotationStore.getState().updateAnnotation(highlightId!, {
          color: '#E91E63',
        });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe('#E91E63');
    });

    it('should update highlight opacity', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      let highlightId: string | null = null;
      act(() => {
        highlightId = result.current.createHighlight(0, rects);
      });

      act(() => {
        useAnnotationStore.getState().updateAnnotation(highlightId!, {
          opacity: 0.3,
        });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.opacity).toBe(0.3);
    });

    it('should select and deselect highlights', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      let highlightId: string | null = null;
      act(() => {
        highlightId = result.current.createHighlight(0, rects);
      });

      act(() => {
        useAnnotationStore.getState().selectAnnotation(highlightId);
      });

      expect(useAnnotationStore.getState().selectedId).toBe(highlightId);

      act(() => {
        useAnnotationStore.getState().selectAnnotation(null);
      });

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe('highlight deletion workflow', () => {
    it('should delete highlight by id', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      let highlightId: string | null = null;
      act(() => {
        highlightId = result.current.createHighlight(0, rects);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      act(() => {
        useAnnotationStore.getState().deleteAnnotation(highlightId!);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should clear selection when deleting selected highlight', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      let highlightId: string | null = null;
      act(() => {
        highlightId = result.current.createHighlight(0, rects);
        useAnnotationStore.getState().selectAnnotation(highlightId);
      });

      expect(useAnnotationStore.getState().selectedId).toBe(highlightId);

      act(() => {
        useAnnotationStore.getState().deleteAnnotation(highlightId!);
      });

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe('undo/redo workflow', () => {
    it('should undo highlight creation', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      act(() => {
        useHistoryStore.getState().undo();
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should redo highlight creation after undo', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      act(() => {
        result.current.createHighlight(0, rects);
      });

      act(() => {
        useHistoryStore.getState().undo();
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);

      act(() => {
        useHistoryStore.getState().redo();
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);
    });

    it('should track multiple highlight operations in history', () => {
      const { result } = renderHook(() => useHighlightTool());

      act(() => {
        result.current.createHighlight(0, [{ x: 100, y: 500, width: 200, height: 14 }]);
        result.current.createHighlight(0, [{ x: 100, y: 400, width: 200, height: 14 }]);
        result.current.createHighlight(0, [{ x: 100, y: 300, width: 200, height: 14 }]);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(3);
      expect(useHistoryStore.getState().past).toHaveLength(3);

      // Undo all three
      act(() => {
        useHistoryStore.getState().undo();
        useHistoryStore.getState().undo();
        useHistoryStore.getState().undo();
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });
  });

  describe('highlight colors', () => {
    it('should support all preset colors', () => {
      const { result } = renderHook(() => useHighlightTool());
      const rects = [{ x: 100, y: 500, width: 200, height: 14 }];

      HIGHLIGHT_COLORS.forEach((preset, index) => {
        act(() => {
          result.current.createHighlight(0, [{ ...rects[0], y: 500 - index * 20 }], {
            color: preset.value,
          });
        });
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(HIGHLIGHT_COLORS.length);

      HIGHLIGHT_COLORS.forEach((preset) => {
        const found = annotations.find((a) => a.color === preset.value);
        expect(found).toBeDefined();
      });
    });
  });

  describe('export/import workflow', () => {
    it('should export highlights to JSON', () => {
      const { result } = renderHook(() => useHighlightTool());

      act(() => {
        result.current.createHighlight(0, [{ x: 100, y: 500, width: 200, height: 14 }], {
          text: 'First highlight',
          color: '#FFEB3B',
        });
        result.current.createHighlight(1, [{ x: 150, y: 600, width: 180, height: 14 }], {
          text: 'Second highlight',
          color: '#4CAF50',
        });
      });

      const json = useAnnotationStore.getState().exportAnnotations();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].type).toBe('highlight');
      expect(parsed[1].type).toBe('highlight');
    });

    it('should import highlights from JSON', () => {
      const highlightsJson = JSON.stringify([
        {
          id: 'imported-1',
          type: 'highlight',
          pageIndex: 0,
          rects: [{ x: 100, y: 500, width: 200, height: 14 }],
          color: '#FFEB3B',
          opacity: 0.5,
          content: 'Imported highlight',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      act(() => {
        useAnnotationStore.getState().importAnnotations(highlightsJson);
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0]?.id).toBe('imported-1');
      expect(annotations[0]?.content).toBe('Imported highlight');
    });
  });
});
