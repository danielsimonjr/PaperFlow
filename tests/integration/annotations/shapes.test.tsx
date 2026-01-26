import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore } from '@/stores/annotationStore';

describe('Shapes Integration Tests', () => {
  beforeEach(() => {
    // Reset the store with Sprint 4 defaults
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#3B82F6',
      activeOpacity: 0.5,
      activeStrokeWidth: 2,
      activeFillColor: undefined,
      activeShapeType: 'rectangle',
      activeStampType: 'approved',
    });
  });

  describe('Shape Annotation CRUD', () => {
    it('creates rectangle annotation', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 200, height: 100 },
        strokeWidth: 2,
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.shapeType).toBe('rectangle');
      expect(shape?.bounds).toEqual({ x: 50, y: 50, width: 200, height: 100 });
    });

    it('creates ellipse annotation', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#E91E63',
        opacity: 1,
        shapeType: 'ellipse',
        bounds: { x: 100, y: 100, width: 150, height: 150 },
        strokeWidth: 3,
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.shapeType).toBe('ellipse');
    });

    it('creates arrow annotation with endpoints', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#F97316',
        opacity: 1,
        shapeType: 'arrow',
        bounds: { x: 50, y: 50, width: 200, height: 100 },
        strokeWidth: 2,
        startPoint: { x: 50, y: 150 },
        endPoint: { x: 250, y: 50 },
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.shapeType).toBe('arrow');
      expect(shape?.startPoint).toEqual({ x: 50, y: 150 });
      expect(shape?.endPoint).toEqual({ x: 250, y: 50 });
    });

    it('creates line annotation', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#8B5CF6',
        opacity: 1,
        shapeType: 'line',
        bounds: { x: 0, y: 0, width: 300, height: 200 },
        strokeWidth: 4,
        startPoint: { x: 0, y: 200 },
        endPoint: { x: 300, y: 0 },
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.shapeType).toBe('line');
    });

    it('creates shape with fill color', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 200, height: 100 },
        strokeWidth: 2,
        fillColor: '#FFEB3B',
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.fillColor).toBe('#FFEB3B');
    });
  });

  describe('Shape Transformation', () => {
    it('updates shape bounds (resize)', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().updateAnnotation(id, {
        bounds: { x: 50, y: 50, width: 200, height: 150 },
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.bounds).toEqual({ x: 50, y: 50, width: 200, height: 150 });
    });

    it('updates shape rotation', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
        rotation: 0,
      });

      useAnnotationStore.getState().updateAnnotation(id, { rotation: 45 });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.rotation).toBe(45);
    });

    it('updates shape color', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().updateAnnotation(id, { color: '#E91E63' });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.color).toBe('#E91E63');
    });

    it('updates shape fill color', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
        fillColor: undefined,
      });

      useAnnotationStore.getState().updateAnnotation(id, { fillColor: '#4CAF50' });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.fillColor).toBe('#4CAF50');
    });

    it('updates shape stroke width', () => {
      const id = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().updateAnnotation(id, { strokeWidth: 8 });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === id);
      expect(shape?.strokeWidth).toBe(8);
    });
  });

  describe('Multiple Shapes', () => {
    it('creates multiple shapes on same page', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#E91E63',
        opacity: 1,
        shapeType: 'ellipse',
        bounds: { x: 200, y: 200, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#F97316',
        opacity: 1,
        shapeType: 'arrow',
        bounds: { x: 350, y: 350, width: 100, height: 50 },
        strokeWidth: 2,
      });

      const shapes = useAnnotationStore.getState().getPageAnnotations(0).filter((a) => a.type === 'shape');
      expect(shapes).toHaveLength(3);
    });

    it('selects individual shapes', () => {
      const id1 = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      const id2 = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#E91E63',
        opacity: 1,
        shapeType: 'ellipse',
        bounds: { x: 200, y: 200, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().selectAnnotation(id1);
      expect(useAnnotationStore.getState().selectedId).toBe(id1);

      useAnnotationStore.getState().selectAnnotation(id2);
      expect(useAnnotationStore.getState().selectedId).toBe(id2);

      useAnnotationStore.getState().selectAnnotation(null);
      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });

    it('deletes shapes without affecting others', () => {
      const id1 = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 50, y: 50, width: 100, height: 100 },
        strokeWidth: 2,
      });

      const id2 = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#E91E63',
        opacity: 1,
        shapeType: 'ellipse',
        bounds: { x: 200, y: 200, width: 100, height: 100 },
        strokeWidth: 2,
      });

      useAnnotationStore.getState().deleteAnnotation(id1);

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);
      expect(useAnnotationStore.getState().annotations[0].id).toBe(id2);
    });
  });

  describe('Shape Tool State', () => {
    it('maintains active shape type across tool switches', () => {
      useAnnotationStore.getState().setActiveShapeType('ellipse');
      useAnnotationStore.getState().setActiveTool('highlight');
      useAnnotationStore.getState().setActiveTool('shape');

      expect(useAnnotationStore.getState().activeShapeType).toBe('ellipse');
    });

    it('maintains fill color setting', () => {
      useAnnotationStore.getState().setActiveFillColor('#FF9800');

      expect(useAnnotationStore.getState().activeFillColor).toBe('#FF9800');

      // Should persist even when tool changes
      useAnnotationStore.getState().setActiveTool('highlight');
      useAnnotationStore.getState().setActiveTool('shape');

      expect(useAnnotationStore.getState().activeFillColor).toBe('#FF9800');
    });
  });
});
