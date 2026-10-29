import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DrawingAnnotation } from '@components/annotations/DrawingAnnotation';
import { useHistoryStore } from '@stores/historyStore';
import { useUIStore } from '@stores/uiStore';
import type { Annotation, DrawingPath } from '@/types';

const paths: DrawingPath[] = [{ points: [{ x: 1, y: 2 }] }];

function annotation(): Annotation {
  return {
    id: 'draw-1',
    type: 'drawing',
    pageIndex: 0,
    rects: [],
    color: '#111111',
    opacity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    paths,
    strokeWidth: 2,
  };
}

describe('DrawingAnnotation move', () => {
  beforeEach(() => {
    useHistoryStore.setState({ past: [], future: [] });
    useUIStore.setState({ activeTool: 'select' });
  });

  it('reports the PDF delta and records undo', () => {
    const seen: DrawingPath[][] = [];
    render(
      <svg>
        <DrawingAnnotation
          annotation={annotation()}
          isSelected
          scale={2}
          pageHeight={100}
          onSelect={() => {}}
          onDelete={() => {}}
          onPathsChange={(next) => seen.push(next)}
        />
      </svg>
    );

    const drawing = screen.getByTestId('drawing-annotation');
    fireEvent.pointerDown(drawing, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(drawing, { clientX: 10, clientY: 4, pointerId: 1 });
    fireEvent.pointerUp(drawing, { clientX: 10, clientY: 4, pointerId: 1 });

    expect(seen.at(-1)?.[0]?.points[0]).toEqual({ x: 6, y: 0 });
    useHistoryStore.getState().undo();
    expect(seen.at(-1)?.[0]?.points[0]).toEqual({ x: 1, y: 2 });
    useHistoryStore.getState().redo();
    expect(seen.at(-1)?.[0]?.points[0]).toEqual({ x: 6, y: 0 });
  });

  it('leaves the drawing in place while the hand tool is active', () => {
    useUIStore.setState({ activeTool: 'hand' });
    const seen: DrawingPath[][] = [];
    render(
      <svg>
        <DrawingAnnotation
          annotation={annotation()}
          isSelected
          scale={2}
          pageHeight={100}
          onSelect={() => {}}
          onDelete={() => {}}
          onPathsChange={(next) => seen.push(next)}
        />
      </svg>
    );

    const drawing = screen.getByTestId('drawing-annotation');
    fireEvent.pointerDown(drawing, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(drawing, { clientX: 10, clientY: 4, pointerId: 1 });
    fireEvent.pointerUp(drawing, { clientX: 10, clientY: 4, pointerId: 1 });

    expect(seen).toEqual([]);
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });
});
