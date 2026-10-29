import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PDFViewer } from '@/components/viewer/PDFViewer';
import { useDocumentStore } from '@stores/documentStore';
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

describe('PDFViewer layout', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    useDocumentStore.setState({
      fileName: 'sample.pdf',
      renderer: {} as PDFRenderer,
      pageCount: 3,
      currentPage: 1,
      zoom: 100,
      viewMode: 'single',
      isLoading: false,
      error: null,
    });
  });

  it('uses the document view mode as the viewer layout', () => {
    const { rerender } = render(<PDFViewer />);
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'single');

    useDocumentStore.setState({ viewMode: 'spread' });
    rerender(<PDFViewer />);
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'spread');

    useDocumentStore.setState({ viewMode: 'continuous' });
    rerender(<PDFViewer />);
    expect(screen.getByTestId('view-mode')).toHaveAttribute('data-mode', 'continuous');
  });

  it('turns to the last page from the keyboard in continuous layout', () => {
    useDocumentStore.setState({ viewMode: 'continuous', pageCount: 8, currentPage: 1 });
    render(<PDFViewer />);
    expect(screen.getAllByTestId('rendered-page').map((node) => node.getAttribute('data-page'))).toEqual([
      '1',
      '2',
      '3',
    ]);

    fireEvent.keyDown(window, { key: 'End' });
    expect(useDocumentStore.getState().currentPage).toBe(8);
    expect(screen.getAllByTestId('rendered-page').map((node) => node.getAttribute('data-page'))).toEqual([
      '6',
      '7',
      '8',
    ]);
  });

  it('jumps by two pages from the keyboard in spread layout', () => {
    useDocumentStore.setState({ viewMode: 'spread', pageCount: 4, currentPage: 1 });
    render(<PDFViewer />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(useDocumentStore.getState().currentPage).toBe(3);
    expect(screen.getAllByTestId('rendered-page').map((node) => node.getAttribute('data-page'))).toEqual([
      '2',
      '3',
    ]);
  });
});
