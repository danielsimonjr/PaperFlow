import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { DrawingCanvas } from '@/components/annotations/DrawingCanvas';
import { useAnnotationStore } from '@/stores/annotationStore';

// Mock the annotation store
vi.mock('@/stores/annotationStore', () => ({
  useAnnotationStore: vi.fn(),
}));

// Mock the usePointerInput hook
vi.mock('@/hooks/usePointerInput', () => ({
  usePointerInput: () => ({
    points: [],
    isDrawing: false,
    handlePointerDown: vi.fn(),
    handlePointerMove: vi.fn(),
    handlePointerUp: vi.fn(),
    handlePointerCancel: vi.fn(),
    clearPoints: vi.fn(),
  }),
}));

describe('DrawingCanvas', () => {
  const mockAddAnnotation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAnnotationStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const state = {
        activeColor: '#FFEB3B',
        activeStrokeWidth: 2,
        addAnnotation: mockAddAnnotation,
      };
      return selector(state);
    });
  });

  it('renders nothing when not active', () => {
    const { container } = render(
      <DrawingCanvas
        pageIndex={0}
        width={800}
        height={600}
        scale={1}
        isActive={false}
      />
    );

    expect(container.querySelector('canvas')).toBeNull();
  });

  it('renders canvas when active', () => {
    const { container } = render(
      <DrawingCanvas
        pageIndex={0}
        width={800}
        height={600}
        scale={1}
        isActive={true}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas?.style.width).toBe('800px');
    expect(canvas?.style.height).toBe('600px');
  });

  it('has crosshair cursor when active', () => {
    const { container } = render(
      <DrawingCanvas
        pageIndex={0}
        width={800}
        height={600}
        scale={1}
        isActive={true}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('cursor-crosshair');
  });

  it('has touch-none class for stylus support', () => {
    const { container } = render(
      <DrawingCanvas
        pageIndex={0}
        width={800}
        height={600}
        scale={1}
        isActive={true}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas?.className).toContain('touch-none');
  });
});
