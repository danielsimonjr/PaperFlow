import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VirtualizedViewer } from '@/components/viewer/VirtualizedViewer';
import { useUIStore } from '@stores/uiStore';
import type { PDFRenderer } from '@lib/pdf/renderer';

vi.mock('@/components/viewer/PageCanvas', () => ({
  PageCanvas: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid="rendered-page" data-page={pageNumber} />
  ),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const renderer = {} as PDFRenderer;

function pages() {
  return screen.getAllByTestId('rendered-page').map((node) => node.getAttribute('data-page'));
}

describe('VirtualizedViewer layouts', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    useUIStore.setState({ activeTool: 'select' });
  });

  it('draws only the current page in single layout', () => {
    render(
      <VirtualizedViewer
        layout="single"
        renderer={renderer}
        pageCount={4}
        currentPage={3}
        zoom={100}
      />
    );
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'single');
    expect(pages()).toEqual(['3']);
  });

  it('draws the cover spread with an empty left slot', () => {
    render(
      <VirtualizedViewer
        layout="spread"
        renderer={renderer}
        pageCount={4}
        currentPage={1}
        zoom={100}
      />
    );
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'spread');
    expect(screen.getAllByTestId('spread-placeholder')).toHaveLength(1);
    expect(pages()).toEqual(['1']);
  });

  it('draws an even page beside the next page', () => {
    render(
      <VirtualizedViewer
        layout="spread"
        renderer={renderer}
        pageCount={4}
        currentPage={2}
        zoom={100}
      />
    );
    expect(pages()).toEqual(['2', '3']);
  });

  it('keeps a slot for every page and draws the visible one in continuous layout', () => {
    render(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={5}
        currentPage={1}
        zoom={100}
      />
    );
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'continuous');
    expect(screen.getAllByLabelText(/Page /)).toHaveLength(5);
    expect(pages()).toEqual(['1', '2', '3']);
  });

  it('pans while the hand tool is down', () => {
    useUIStore.setState({ activeTool: 'hand' });
    render(
      <VirtualizedViewer
        layout="single"
        renderer={renderer}
        pageCount={1}
        currentPage={1}
        zoom={100}
      />
    );
    const view = screen.getByTestId('view-mode');
    fireEvent.mouseDown(view, { clientX: 20, clientY: 20 });
    expect(view.className).toContain('cursor-grabbing');
    fireEvent.mouseUp(view);
    expect(view.className).not.toContain('cursor-grabbing');
  });
});
