import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageRangeSelector } from '@components/ocr/PageRangeSelector';
import { useDocumentStore } from '@stores/documentStore';

/**
 * `documentStore.currentPage` is 1-based (the first page is 1), and the OCR run takes 0-based page
 * indices (`OCRDialog` renders `getPage(pageIndex + 1)`). The picker has to convert.
 */
describe('OCR PageRangeSelector', () => {
  beforeEach(() => {
    useDocumentStore.setState({ currentPage: 3, pageCount: 5 });
  });

  it('sends the 0-based index of the current page', () => {
    const onRangeChange = vi.fn();
    render(<PageRangeSelector onRangeChange={onRangeChange} />);
    expect(onRangeChange).toHaveBeenLastCalledWith([2]);
  });

  it('sends index 0 when the current page is the first page', () => {
    useDocumentStore.setState({ currentPage: 1, pageCount: 5 });
    const onRangeChange = vi.fn();
    render(<PageRangeSelector onRangeChange={onRangeChange} />);
    expect(onRangeChange).toHaveBeenLastCalledWith([0]);
  });

  it('sends an index that exists when the current page is the last page', () => {
    useDocumentStore.setState({ currentPage: 5, pageCount: 5 });
    const onRangeChange = vi.fn();
    render(<PageRangeSelector onRangeChange={onRangeChange} />);
    expect(onRangeChange).toHaveBeenLastCalledWith([4]);
  });

  it('labels the current page with its 1-based number', () => {
    render(<PageRangeSelector onRangeChange={vi.fn()} />);
    expect(screen.getByText('Current page (3)')).toBeTruthy();
  });
});
