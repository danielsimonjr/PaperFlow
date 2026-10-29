import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('draws the current page and a two-page buffer in continuous layout', () => {
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
    expect(screen.getAllByLabelText(/Page /)).toHaveLength(3);
    expect(pages()).toEqual(['1', '2', '3']);
  });

  it('opens on the current page instead of resetting to page 1', () => {
    const onPageChange = vi.fn();
    render(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={8}
        currentPage={4}
        zoom={100}
        onPageChange={onPageChange}
      />
    );
    expect(onPageChange).not.toHaveBeenCalled();
    expect(pages()).toEqual(['2', '3', '4', '5', '6']);
  });

  it('follows a later page change and keeps a scroll report from jumping backward', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={8}
        currentPage={1}
        zoom={100}
        onPageChange={onPageChange}
      />
    );

    rerender(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={8}
        currentPage={4}
        zoom={100}
        onPageChange={onPageChange}
      />
    );
    expect(pages()).toEqual(['2', '3', '4', '5', '6']);

    const view = screen.getByTestId('view-mode');
    Object.defineProperty(view, 'clientHeight', { configurable: true, value: 808 });
    Object.defineProperty(view, 'scrollTop', { configurable: true, writable: true, value: 5 * 808 });
    fireEvent.scroll(view);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(6);

    rerender(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={8}
        currentPage={6}
        zoom={100}
        onPageChange={onPageChange}
      />
    );
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(pages()).toContain('6');
    expect(pages()).not.toContain('1');
  });

  it('keeps the current page when the viewport is taller than one page', () => {
    const onPageChange = vi.fn();
    render(
      <VirtualizedViewer
        layout="continuous"
        renderer={renderer}
        pageCount={8}
        currentPage={1}
        zoom={100}
        onPageChange={onPageChange}
      />
    );
    const view = screen.getByTestId('view-mode');
    Object.defineProperty(view, 'clientHeight', { configurable: true, value: 3000 });
    Object.defineProperty(view, 'scrollTop', { configurable: true, writable: true, value: 0 });
    fireEvent.scroll(view);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('spaces continuous pages by their PDF height', async () => {
    const sized = {
      getPageInfo: vi.fn(async (pageNumber: number) => ({
        pageNumber,
        width: 500,
        height: pageNumber === 1 ? 100 : 400,
        rotation: 0,
      })),
    } as unknown as PDFRenderer;

    render(
      <VirtualizedViewer
        layout="continuous"
        renderer={sized}
        pageCount={3}
        currentPage={1}
        zoom={100}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Page 2')).toHaveStyle({ top: '116px', height: '400px' });
    });
    expect(screen.getByLabelText('Page 1')).toHaveStyle({ top: '0px', height: '100px' });
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
