import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '@components/toolbar/SearchBar';
import { useDocumentStore } from '@stores/documentStore';
import type { PDFRenderer } from '@lib/pdf/renderer';

// "page" matches 3 times with any case (two on page 1, one on page 2) and 2 times with the case of the query.
const PAGES: Record<number, string> = {
  1: 'Page one and page two',
  2: 'another page',
  3: 'nothing here',
};

const renderer = {
  getTextContentAsString: vi.fn((n: number) => Promise.resolve(PAGES[n] ?? '')),
} as unknown as PDFRenderer;

function renderBar() {
  const onClose = vi.fn();
  render(<SearchBar isOpen onClose={onClose} />);
  const input = screen.getByTestId('search-input');
  const count = screen.getByTestId('search-results-count');
  return { input, count, onClose };
}

async function searchFor(input: HTMLElement, count: HTMLElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(count).not.toHaveTextContent('Searching'));
}

describe('SearchBar', () => {
  beforeEach(() => {
    useDocumentStore.setState({ renderer, pageCount: 3, currentPage: 1 });
  });

  describe('case and whole-word toggles', () => {
    it('search again with the option that the click sets, not the previous one', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'page');
      expect(count).toHaveTextContent('1 of 3');

      fireEvent.click(screen.getByTitle('Case sensitive (Alt+C)'));
      await waitFor(() => expect(count).toHaveTextContent('1 of 2'));

      fireEvent.click(screen.getByTitle('Case sensitive (Alt+C)'));
      await waitFor(() => expect(count).toHaveTextContent('1 of 3'));
    });
  });

  describe('Enter and Shift+Enter in the search box', () => {
    it('search on the first Enter and step to the next match on the next Enter', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'page');
      expect(count).toHaveTextContent('1 of 3');

      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(count).not.toHaveTextContent('Searching'));
      expect(count).toHaveTextContent('2 of 3');

      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(count).not.toHaveTextContent('Searching'));
      expect(count).toHaveTextContent('3 of 3');
    });

    it('step to the previous match on Shift+Enter', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'page');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(count).toHaveTextContent('2 of 3');

      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
      await waitFor(() => expect(count).not.toHaveTextContent('Searching'));
      expect(count).toHaveTextContent('1 of 3');
    });

    it('search again when the text of the box changed since the last search', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'page');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(count).toHaveTextContent('2 of 3');

      await searchFor(input, count, 'two');
      expect(count).toHaveTextContent('1 of 1');
    });

    it('step to the next match on Enter after a toggle searched the edited text', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'two');
      expect(count).toHaveTextContent('1 of 1');

      // The text changes without Enter. The toggle searches the new text, so the next Enter steps.
      fireEvent.change(input, { target: { value: 'page' } });
      fireEvent.click(screen.getByTitle('Whole word (Alt+W)'));
      await waitFor(() => expect(count).toHaveTextContent('1 of 3'));

      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(count).not.toHaveTextContent('Searching'));
      expect(count).toHaveTextContent('2 of 3');
    });

    it('move the view to the page of the match that Enter selects', async () => {
      const { input, count } = renderBar();
      await searchFor(input, count, 'page');
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(count).toHaveTextContent('3 of 3'));
      expect(useDocumentStore.getState().currentPage).toBe(2);
    });
  });
});
