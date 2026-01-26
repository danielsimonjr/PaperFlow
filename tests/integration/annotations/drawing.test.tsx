import { describe, it, expect, beforeEach } from 'vitest';
import { useAnnotationStore } from '@/stores/annotationStore';

describe('Drawing Integration Tests', () => {
  beforeEach(() => {
    // Reset the store with Sprint 4 defaults
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#FFEB3B',
      activeOpacity: 0.5,
      activeStrokeWidth: 2,
      activeFillColor: undefined,
      activeShapeType: 'rectangle',
      activeStampType: 'approved',
    });
  });

  describe('Annotation Store - Drawing Features', () => {
    it('stores drawing annotations with paths', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 0,
        rects: [],
        color: '#FF0000',
        opacity: 1,
        paths: [
          {
            points: [
              { x: 10, y: 10, pressure: 0.5 },
              { x: 20, y: 20, pressure: 0.6 },
              { x: 30, y: 30, pressure: 0.7 },
            ],
          },
        ],
        strokeWidth: 2,
      });

      const drawing = useAnnotationStore.getState().annotations.find((a) => a.id === annotationId);

      expect(drawing).toBeTruthy();
      expect(drawing?.type).toBe('drawing');
      expect(drawing?.paths).toHaveLength(1);
      expect(drawing?.paths?.[0].points).toHaveLength(3);
      expect(drawing?.strokeWidth).toBe(2);
    });

    it('stores shape annotations with bounds', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 100, y: 100, width: 200, height: 150 },
        strokeWidth: 2,
        fillColor: '#FFEB3B',
      });

      const shape = useAnnotationStore.getState().annotations.find((a) => a.id === annotationId);

      expect(shape).toBeTruthy();
      expect(shape?.type).toBe('shape');
      expect(shape?.shapeType).toBe('rectangle');
      expect(shape?.bounds).toEqual({ x: 100, y: 100, width: 200, height: 150 });
      expect(shape?.fillColor).toBe('#FFEB3B');
    });

    it('stores stamp annotations with position and rotation', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'stamp',
        pageIndex: 0,
        rects: [],
        color: '#FFFFFF',
        opacity: 1,
        stampType: 'approved',
        position: { x: 300, y: 400 },
        scale: 1.5,
        rotation: 45,
      });

      const stamp = useAnnotationStore.getState().annotations.find((a) => a.id === annotationId);

      expect(stamp).toBeTruthy();
      expect(stamp?.type).toBe('stamp');
      expect(stamp?.stampType).toBe('approved');
      expect(stamp?.position).toEqual({ x: 300, y: 400 });
      expect(stamp?.scale).toBe(1.5);
      expect(stamp?.rotation).toBe(45);
    });

    it('updates drawing properties', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 0,
        rects: [],
        color: '#FF0000',
        opacity: 1,
        paths: [],
        strokeWidth: 2,
      });

      useAnnotationStore.getState().updateAnnotation(annotationId, {
        color: '#00FF00',
        strokeWidth: 4,
      });

      const updated = useAnnotationStore.getState().annotations.find((a) => a.id === annotationId);

      expect(updated?.color).toBe('#00FF00');
      expect(updated?.strokeWidth).toBe(4);
    });

    it('updates shape rotation', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#3B82F6',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 100, y: 100, width: 200, height: 150 },
        strokeWidth: 2,
        rotation: 0,
      });

      useAnnotationStore.getState().updateAnnotation(annotationId, { rotation: 90 });

      const updated = useAnnotationStore.getState().annotations.find((a) => a.id === annotationId);

      expect(updated?.rotation).toBe(90);
    });

    it('deletes drawing annotations', () => {
      const annotationId = useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 0,
        rects: [],
        color: '#FF0000',
        opacity: 1,
        paths: [],
        strokeWidth: 2,
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      useAnnotationStore.getState().deleteAnnotation(annotationId);

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });
  });

  describe('Tool State Management', () => {
    it('sets active drawing tool', () => {
      useAnnotationStore.getState().setActiveTool('drawing');

      expect(useAnnotationStore.getState().activeTool).toBe('drawing');
    });

    it('sets active shape type', () => {
      useAnnotationStore.getState().setActiveShapeType('ellipse');

      expect(useAnnotationStore.getState().activeShapeType).toBe('ellipse');
    });

    it('sets active stamp type', () => {
      useAnnotationStore.getState().setActiveStampType('rejected');

      expect(useAnnotationStore.getState().activeStampType).toBe('rejected');
    });

    it('sets active stroke width', () => {
      useAnnotationStore.getState().setActiveStrokeWidth(8);

      expect(useAnnotationStore.getState().activeStrokeWidth).toBe(8);
    });

    it('sets active fill color', () => {
      useAnnotationStore.getState().setActiveFillColor('#E91E63');

      expect(useAnnotationStore.getState().activeFillColor).toBe('#E91E63');
    });

    it('clears fill color', () => {
      useAnnotationStore.getState().setActiveFillColor('#E91E63');
      useAnnotationStore.getState().setActiveFillColor(undefined);

      expect(useAnnotationStore.getState().activeFillColor).toBeUndefined();
    });
  });

  describe('Annotation Filtering', () => {
    it('filters drawing annotations by page', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 0,
        rects: [],
        color: '#FF0000',
        opacity: 1,
        paths: [],
        strokeWidth: 2,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 1,
        rects: [],
        color: '#00FF00',
        opacity: 1,
        paths: [],
        strokeWidth: 2,
      });

      useAnnotationStore.getState().addAnnotation({
        type: 'shape',
        pageIndex: 0,
        rects: [],
        color: '#0000FF',
        opacity: 1,
        shapeType: 'rectangle',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        strokeWidth: 2,
      });

      const page0Annotations = useAnnotationStore.getState().getPageAnnotations(0);
      const page1Annotations = useAnnotationStore.getState().getPageAnnotations(1);

      expect(page0Annotations).toHaveLength(2);
      expect(page1Annotations).toHaveLength(1);
    });
  });

  describe('Export/Import with Drawing Features', () => {
    it('exports annotations including drawing data', () => {
      useAnnotationStore.getState().addAnnotation({
        type: 'drawing',
        pageIndex: 0,
        rects: [],
        color: '#FF0000',
        opacity: 1,
        paths: [
          {
            points: [
              { x: 10, y: 10, pressure: 0.5 },
              { x: 20, y: 20, pressure: 0.6 },
            ],
          },
        ],
        strokeWidth: 4,
      });

      const exported = useAnnotationStore.getState().exportAnnotations();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('drawing');
      expect(parsed[0].paths).toBeDefined();
      expect(parsed[0].strokeWidth).toBe(4);
    });

    it('imports annotations with drawing data', () => {
      const importData = JSON.stringify([
        {
          id: 'test-drawing',
          type: 'drawing',
          pageIndex: 0,
          rects: [],
          color: '#FF0000',
          opacity: 1,
          paths: [
            {
              points: [
                { x: 10, y: 10, pressure: 0.5 },
                { x: 20, y: 20, pressure: 0.6 },
              ],
            },
          ],
          strokeWidth: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      useAnnotationStore.getState().importAnnotations(importData);

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0].type).toBe('drawing');
      expect(annotations[0].paths).toBeDefined();
    });
  });
});
