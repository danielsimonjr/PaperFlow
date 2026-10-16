import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OCRResultsPanel } from '@components/ocr/OCRResultsPanel';
import { useOCRStore } from '@stores/ocrStore';
import { useDocumentStore } from '@stores/documentStore';
import type { OCRResult } from '@/lib/ocr/types';

/**
 * `documentStore.currentPage` is 1-based. The OCR store keys results by the 0-based page index
 * that `OCRDialog` passes to `addResult`, so the panel has to read the key `currentPage - 1`.
 */
function resultOf(...words: string[]): OCRResult {
  return {
    text: words.join(' '),
    words: words.map((text, i) => ({
      text,
      bounds: { x: i * 40, y: 10, width: 36, height: 12 },
      confidence: 0.95,
    })),
    confidence: 0.95,
  };
}

describe('OCRResultsPanel', () => {
  beforeEach(() => {
    useOCRStore.getState().reset();
    useOCRStore.setState({
      results: new Map([
        [0, resultOf('alpha')],
        [1, resultOf('bravo')],
        [2, resultOf('charlie', 'delta')],
      ]),
    });
    useDocumentStore.setState({ currentPage: 2, pageCount: 3 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the result of the current page', () => {
    render(<OCRResultsPanel />);
    expect(screen.getByText('bravo')).toBeTruthy();
    expect(screen.queryByText('charlie')).toBeNull();
  });

  it('shows the first result on the first page', () => {
    useDocumentStore.setState({ currentPage: 1 });
    render(<OCRResultsPanel />);
    expect(screen.getByText('alpha')).toBeTruthy();
  });

  it('saves an edit to the result of the current page', () => {
    render(<OCRResultsPanel />);
    fireEvent.click(screen.getByText('bravo'));
    fireEvent.change(screen.getByLabelText('Edit word'), { target: { value: 'echo' } });
    fireEvent.keyDown(screen.getByLabelText('Edit word'), { key: 'Enter' });

    const results = useOCRStore.getState().results;
    expect(results.get(1)?.words[0]?.text).toBe('echo');
    expect(results.get(2)?.words[0]?.text).toBe('charlie');
  });

  it('edits the word that the user clicked while a search filters the list', () => {
    useDocumentStore.setState({ currentPage: 3 });
    render(<OCRResultsPanel />);
    fireEvent.change(screen.getByLabelText('Search OCR results'), { target: { value: 'delt' } });
    fireEvent.click(screen.getByText('delta'));
    fireEvent.change(screen.getByLabelText('Edit word'), { target: { value: 'foxtrot' } });
    fireEvent.keyDown(screen.getByLabelText('Edit word'), { key: 'Enter' });

    const words = useOCRStore.getState().results.get(2)?.words.map((w) => w.text);
    expect(words).toEqual(['charlie', 'foxtrot']);
  });

  it('names the exported text file with the 1-based page number', () => {
    const downloads: string[] = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:ocr');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });

    render(<OCRResultsPanel />);
    fireEvent.click(screen.getByLabelText('Export as text file'));
    expect(downloads).toEqual(['ocr-page-2.txt']);
  });
});
