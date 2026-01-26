import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RectangleTool } from '@/components/annotations/RectangleTool';
import { EllipseTool } from '@/components/annotations/EllipseTool';
import { ArrowTool } from '@/components/annotations/ArrowTool';
import { LineTool } from '@/components/annotations/LineTool';
import { useAnnotationStore } from '@/stores/annotationStore';

// Mock the annotation store
vi.mock('@/stores/annotationStore', () => ({
  useAnnotationStore: vi.fn(),
}));

describe('Shape Tools', () => {
  const mockAddAnnotation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAnnotationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        activeColor: '#3B82F6',
        activeStrokeWidth: 2,
        activeFillColor: undefined,
        addAnnotation: mockAddAnnotation,
      };
      return selector(state);
    });
  });

  describe('RectangleTool', () => {
    it('renders nothing when not active', () => {
      const { container } = render(
        <RectangleTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={false}
        />
      );

      expect(container.querySelector('svg')).toBeNull();
    });

    it('renders SVG when active', () => {
      const { container } = render(
        <RectangleTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('width')).toBe('800');
      expect(svg?.getAttribute('height')).toBe('600');
    });

    it('has crosshair cursor when active', () => {
      const { container } = render(
        <RectangleTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg');
      expect(svg?.classList.contains('cursor-crosshair')).toBe(true);
    });

    it('creates annotation on mouse drag and release', () => {
      const { container } = render(
        <RectangleTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg')!;

      // Mock getBoundingClientRect
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Simulate drag
      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(svg, { clientX: 200, clientY: 200 });

      expect(mockAddAnnotation).toHaveBeenCalledTimes(1);
      expect(mockAddAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shape',
          shapeType: 'rectangle',
          pageIndex: 0,
        })
      );
    });
  });

  describe('EllipseTool', () => {
    it('renders SVG when active', () => {
      const { container } = render(
        <EllipseTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('creates ellipse annotation on drag', () => {
      const { container } = render(
        <EllipseTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg')!;

      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(svg, { clientX: 200, clientY: 200 });

      expect(mockAddAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shape',
          shapeType: 'ellipse',
        })
      );
    });
  });

  describe('ArrowTool', () => {
    it('renders SVG when active', () => {
      const { container } = render(
        <ArrowTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('creates arrow annotation on drag', () => {
      const { container } = render(
        <ArrowTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg')!;

      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(svg, { clientX: 200, clientY: 200 });

      expect(mockAddAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shape',
          shapeType: 'arrow',
        })
      );
    });
  });

  describe('LineTool', () => {
    it('renders SVG when active', () => {
      const { container } = render(
        <LineTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      expect(container.querySelector('svg')).toBeTruthy();
    });

    it('creates line annotation on drag', () => {
      const { container } = render(
        <LineTool
          pageIndex={0}
          width={800}
          height={600}
          scale={1}
          pageHeight={842}
          isActive={true}
        />
      );

      const svg = container.querySelector('svg')!;

      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(svg, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(svg, { clientX: 200, clientY: 200 });

      expect(mockAddAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shape',
          shapeType: 'line',
        })
      );
    });
  });
});
