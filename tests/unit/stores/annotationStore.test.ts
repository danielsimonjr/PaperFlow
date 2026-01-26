import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore } from '@stores/annotationStore';

describe('annotationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#FFEB3B',
      activeOpacity: 0.5,
    });
  });

  describe('initial state', () => {
    it('should have empty annotations', () => {
      const state = useAnnotationStore.getState();
      expect(state.annotations).toEqual([]);
      expect(state.selectedId).toBeNull();
    });

    it('should have default tool settings', () => {
      const state = useAnnotationStore.getState();
      expect(state.activeTool).toBeNull();
      expect(state.activeColor).toBe('#FFEB3B');
      expect(state.activeOpacity).toBe(0.5);
    });
  });

  describe('addAnnotation', () => {
    it('should add annotation with generated id and timestamps', () => {
      const annotationData = {
        type: 'highlight' as const,
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
        content: 'Test highlight',
      };

      const id = useAnnotationStore.getState().addAnnotation(annotationData);

      const state = useAnnotationStore.getState();
      expect(state.annotations).toHaveLength(1);
      expect(state.annotations[0]?.id).toBe(id);
      expect(state.annotations[0]?.type).toBe('highlight');
      expect(state.annotations[0]?.createdAt).toBeInstanceOf(Date);
      expect(state.annotations[0]?.updatedAt).toBeInstanceOf(Date);
    });

    it('should add multiple annotations', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'note',
        pageIndex: 1,
        rects: [{ x: 300, y: 400, width: 24, height: 24 }],
        color: '#FEF3C7',
        opacity: 1,
        content: 'A note',
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(2);
    });
  });

  describe('updateAnnotation', () => {
    it('should update annotation properties', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      const originalDate = useAnnotationStore.getState().annotations[0]?.updatedAt;

      // Small delay to ensure different timestamp
      useAnnotationStore.getState().updateAnnotation(id, {
        color: '#4CAF50',
        opacity: 0.8,
      });

      const state = useAnnotationStore.getState();
      expect(state.annotations[0]?.color).toBe('#4CAF50');
      expect(state.annotations[0]?.opacity).toBe(0.8);
      expect(state.annotations[0]?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalDate!.getTime()
      );
    });
  });

  describe('deleteAnnotation', () => {
    it('should remove annotation by id', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().deleteAnnotation(id);

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should clear selection if deleted annotation was selected', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().selectAnnotation(id);
      expect(useAnnotationStore.getState().selectedId).toBe(id);

      useAnnotationStore.getState().deleteAnnotation(id);

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe('selectAnnotation', () => {
    it('should select annotation by id', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().selectAnnotation(id);

      expect(useAnnotationStore.getState().selectedId).toBe(id);
    });

    it('should deselect when passing null', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().selectAnnotation(id);
      useAnnotationStore.getState().selectAnnotation(null);

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe('tool settings', () => {
    it('should set active tool', () => {
      useAnnotationStore.getState().setActiveTool('highlight');
      expect(useAnnotationStore.getState().activeTool).toBe('highlight');

      useAnnotationStore.getState().setActiveTool('note');
      expect(useAnnotationStore.getState().activeTool).toBe('note');

      useAnnotationStore.getState().setActiveTool(null);
      expect(useAnnotationStore.getState().activeTool).toBeNull();
    });

    it('should set active color', () => {
      useAnnotationStore.getState().setActiveColor('#4CAF50');
      expect(useAnnotationStore.getState().activeColor).toBe('#4CAF50');
    });

    it('should set active opacity', () => {
      useAnnotationStore.getState().setActiveOpacity(0.75);
      expect(useAnnotationStore.getState().activeOpacity).toBe(0.75);
    });
  });

  describe('addReply', () => {
    it('should add reply to annotation', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'note',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 24, height: 24 }],
        color: '#FEF3C7',
        opacity: 1,
        content: 'Original note',
        replies: [],
      });

      useAnnotationStore.getState().addReply(id, 'This is a reply', 'User');

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.replies).toHaveLength(1);
      expect(annotation?.replies?.[0]?.content).toBe('This is a reply');
      expect(annotation?.replies?.[0]?.author).toBe('User');
    });
  });

  describe('getPageAnnotations', () => {
    it('should return annotations for specific page', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 1,
        rects: [{ x: 150, y: 250, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'note',
        pageIndex: 0,
        rects: [{ x: 200, y: 300, width: 24, height: 24 }],
        color: '#FEF3C7',
        opacity: 1,
      });

      const page0Annotations = useAnnotationStore.getState().getPageAnnotations(0);
      const page1Annotations = useAnnotationStore.getState().getPageAnnotations(1);

      expect(page0Annotations).toHaveLength(2);
      expect(page1Annotations).toHaveLength(1);
    });
  });

  describe('export/import', () => {
    it('should export annotations as JSON', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
        content: 'Test',
      });

      const json = useAnnotationStore.getState().exportAnnotations();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('highlight');
    });

    it('should import annotations from JSON', () => {
      const annotationsJson = JSON.stringify([
        {
          id: 'test-id-1',
          type: 'highlight',
          pageIndex: 0,
          rects: [{ x: 100, y: 200, width: 50, height: 20 }],
          color: '#FFEB3B',
          opacity: 0.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      useAnnotationStore.getState().importAnnotations(annotationsJson);

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);
      expect(useAnnotationStore.getState().annotations[0]?.type).toBe('highlight');
    });
  });

  describe('clearAnnotations', () => {
    it('should remove all annotations and clear selection', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'highlight',
        pageIndex: 0,
        rects: [{ x: 100, y: 200, width: 50, height: 20 }],
        color: '#FFEB3B',
        opacity: 0.5,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'note',
        pageIndex: 1,
        rects: [{ x: 200, y: 300, width: 24, height: 24 }],
        color: '#FEF3C7',
        opacity: 1,
      });

      useAnnotationStore.getState().selectAnnotation(id);
      useAnnotationStore.getState().clearAnnotations();

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });
});
