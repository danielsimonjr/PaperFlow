import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AnnotationProperties } from '@components/annotations/AnnotationProperties';
import { useAnnotationStore } from '@stores/annotationStore';
import type { Annotation } from '@/types';

function drawing(color: string): Annotation {
  return {
    id: 'draw-1',
    type: 'drawing',
    pageIndex: 0,
    rects: [],
    color,
    opacity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    paths: [{ points: [{ x: 1, y: 2 }] }],
    strokeWidth: 2,
  };
}

describe('AnnotationProperties recolor', () => {
  beforeEach(() => {
    useAnnotationStore.setState({
      annotations: [drawing('#FFEB3B')],
      selectedId: 'draw-1',
    });
  });

  it('recolors a selected drawing', () => {
    render(<AnnotationProperties onClose={() => {}} />);
    fireEvent.click(screen.getByTitle('Black'));
    expect(useAnnotationStore.getState().annotations[0]?.color).toBe('#111111');
  });

  it('keeps the drawing palette off text markup', () => {
    useAnnotationStore.setState({
      annotations: [{ ...drawing('#FFEB3B'), type: 'highlight', paths: undefined }],
      selectedId: 'draw-1',
    });
    render(<AnnotationProperties onClose={() => {}} />);
    expect(screen.queryByTitle('Black')).not.toBeInTheDocument();
    expect(screen.getByTitle('Yellow')).toBeInTheDocument();
  });
});
