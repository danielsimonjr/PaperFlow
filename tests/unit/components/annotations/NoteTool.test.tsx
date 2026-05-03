import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { NoteTool } from '@components/annotations/NoteTool';
import { NOTE_COLORS } from '@components/annotations/StickyNote';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';

/**
 * Regression coverage for the double-push undo bug.
 *
 * annotationStore.addAnnotation already pushes a history entry. The
 * NoteTool click handler used to push a SECOND one on top, so the user
 * had to press Ctrl+Z twice to undo a single note. The fix is to drop
 * the redundant pushHistory call in NoteTool.tsx.
 */
describe('NoteTool — undo history accounting', () => {
  beforeEach(() => {
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: 'note',
      activeColor: NOTE_COLORS.yellow,
      activeOpacity: 1,
    });
    useHistoryStore.setState({ past: [], future: [] });
  });

  it('places a single history entry per note (not two)', () => {
    const { container } = render(
      <NoteTool pageIndex={0} scale={1} pageHeight={792} />
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay, { clientX: 100, clientY: 200 });

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);
    // The buggy version would record 2 entries here (one from the store,
    // one from the NoteTool handler). After the fix, only the store's
    // entry remains.
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().past[0]?.action).toBe('add_note');
  });

  it('one Ctrl+Z removes one note (not two presses for one note)', () => {
    const { container } = render(
      <NoteTool pageIndex={0} scale={1} pageHeight={792} />
    );

    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay, { clientX: 100, clientY: 200 });

    expect(useAnnotationStore.getState().annotations).toHaveLength(1);

    // Single undo should fully remove the note.
    useHistoryStore.getState().undo();

    expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });
});
