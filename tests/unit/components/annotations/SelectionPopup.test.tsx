import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SelectionPopup } from '@components/annotations/SelectionPopup';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';

/**
 * Regression coverage for the double-push undo bug.
 *
 * annotationStore.addAnnotation already pushes a history entry. The
 * SelectionPopup createAnnotation handler used to push a SECOND one on
 * top, so users had to press Ctrl+Z twice to undo a popup-triggered
 * highlight / underline / strikethrough. The fix is to drop the
 * redundant pushHistory call in SelectionPopup.tsx.
 */
describe('SelectionPopup — undo history accounting', () => {
  const baseProps = {
    position: { x: 100, y: 100 },
    text: 'selected words',
    pdfRects: [{ x: 50, y: 500, width: 200, height: 14 }],
    pageIndex: 0,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: '#FFEB3B',
      activeOpacity: 1,
    });
    useHistoryStore.setState({ past: [], future: [] });
    vi.clearAllMocks();
  });

  it('quick-highlight places exactly one history entry', () => {
    const { getByTitle } = render(<SelectionPopup {...baseProps} />);

    fireEvent.click(getByTitle('Highlight'));

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().past[0]?.action).toBe('add_highlight');
  });

  it('underline button places exactly one history entry', () => {
    const { getByTitle } = render(<SelectionPopup {...baseProps} />);

    fireEvent.click(getByTitle('Underline'));

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().past[0]?.action).toBe('add_underline');
  });

  it('strikethrough button places exactly one history entry', () => {
    const { getByTitle } = render(<SelectionPopup {...baseProps} />);

    fireEvent.click(getByTitle('Strikethrough'));

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().past[0]?.action).toBe('add_strikethrough');
  });

  it('one Ctrl+Z removes one popup-triggered annotation', () => {
    const { getByTitle } = render(<SelectionPopup {...baseProps} />);

    fireEvent.click(getByTitle('Highlight'));

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);

    useHistoryStore.getState().undo();

    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });
});
