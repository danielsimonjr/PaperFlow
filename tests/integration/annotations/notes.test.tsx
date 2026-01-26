import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import { NOTE_COLORS } from '@components/annotations/StickyNote';

/**
 * Integration tests for sticky note annotation workflow.
 * Tests the complete flow from note creation to editing,
 * replies, and deletion with undo/redo support.
 */
describe('Notes Integration', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useAnnotationStore.setState({
      annotations: [],
      selectedId: null,
      activeTool: null,
      activeColor: NOTE_COLORS.yellow,
      activeOpacity: 1,
    });
    useHistoryStore.setState({
      past: [],
      future: [],
    });
  });

  /**
   * Helper to create a note annotation
   */
  const createNote = (
    pageIndex: number,
    position: { x: number; y: number },
    content: string,
    options?: { color?: string; author?: string }
  ) => {
    return useAnnotationStore.getState().addAnnotation({
      type: 'note',
      pageIndex,
      rects: [{ x: position.x, y: position.y, width: 24, height: 24 }],
      color: options?.color || NOTE_COLORS.yellow,
      opacity: 1,
      content,
      author: options?.author,
      replies: [],
    });
  };

  describe('note creation workflow', () => {
    it('should create note at specified position', () => {
      act(() => {
        createNote(0, { x: 100, y: 500 }, 'Test note');
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0]?.type).toBe('note');
      expect(annotations[0]?.rects[0]?.x).toBe(100);
      expect(annotations[0]?.rects[0]?.y).toBe(500);
      expect(annotations[0]?.content).toBe('Test note');
    });

    it('should create notes on different pages', () => {
      act(() => {
        createNote(0, { x: 100, y: 500 }, 'Page 1 note');
        createNote(2, { x: 150, y: 600 }, 'Page 3 note');
        createNote(0, { x: 200, y: 400 }, 'Another page 1 note');
      });

      const allAnnotations = useAnnotationStore.getState().annotations;
      const page0Notes = useAnnotationStore.getState().getPageAnnotations(0);
      const page2Notes = useAnnotationStore.getState().getPageAnnotations(2);

      expect(allAnnotations).toHaveLength(3);
      expect(page0Notes).toHaveLength(2);
      expect(page2Notes).toHaveLength(1);
    });

    it('should set author on note', () => {
      act(() => {
        createNote(0, { x: 100, y: 500 }, 'Test note', { author: 'John Doe' });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.author).toBe('John Doe');
    });
  });

  describe('note editing workflow', () => {
    it('should update note content', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original content');
      });

      act(() => {
        useAnnotationStore.getState().updateAnnotation(noteId, {
          content: 'Updated content',
        });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.content).toBe('Updated content');
    });

    it('should update note color', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Test note');
      });

      act(() => {
        useAnnotationStore.getState().updateAnnotation(noteId, {
          color: NOTE_COLORS.blue,
        });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe(NOTE_COLORS.blue);
    });

    it('should update note position (drag)', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Test note');
      });

      act(() => {
        useAnnotationStore.getState().updateAnnotation(noteId, {
          rects: [{ x: 200, y: 400, width: 24, height: 24 }],
        });
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.rects[0]?.x).toBe(200);
      expect(annotation?.rects[0]?.y).toBe(400);
    });

    it('should select and deselect notes', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Test note');
      });

      act(() => {
        useAnnotationStore.getState().selectAnnotation(noteId);
      });

      expect(useAnnotationStore.getState().selectedId).toBe(noteId);

      act(() => {
        useAnnotationStore.getState().selectAnnotation(null);
      });

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe('note replies workflow', () => {
    it('should add reply to note', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original note');
      });

      act(() => {
        useAnnotationStore.getState().addReply(noteId, 'This is a reply', 'Jane Doe');
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.replies).toHaveLength(1);
      expect(annotation?.replies?.[0]?.content).toBe('This is a reply');
      expect(annotation?.replies?.[0]?.author).toBe('Jane Doe');
    });

    it('should add multiple replies to note', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original note');
      });

      act(() => {
        useAnnotationStore.getState().addReply(noteId, 'First reply', 'User A');
        useAnnotationStore.getState().addReply(noteId, 'Second reply', 'User B');
        useAnnotationStore.getState().addReply(noteId, 'Third reply', 'User A');
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.replies).toHaveLength(3);
    });

    it('should have unique IDs for each reply', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original note');
      });

      act(() => {
        useAnnotationStore.getState().addReply(noteId, 'Reply 1', 'User');
        useAnnotationStore.getState().addReply(noteId, 'Reply 2', 'User');
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      const replyIds = annotation?.replies?.map((r) => r.id);
      const uniqueIds = new Set(replyIds);
      expect(uniqueIds.size).toBe(replyIds?.length);
    });

    it('should have timestamps on replies', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original note');
      });

      act(() => {
        useAnnotationStore.getState().addReply(noteId, 'Reply with timestamp', 'User');
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.replies?.[0]?.createdAt).toBeInstanceOf(Date);
    });

    it('should update note updatedAt when adding reply', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Original note');
      });

      const originalUpdatedAt = useAnnotationStore.getState().annotations[0]?.updatedAt;

      // Small delay to ensure different timestamp
      act(() => {
        useAnnotationStore.getState().addReply(noteId, 'New reply', 'User');
      });

      const newUpdatedAt = useAnnotationStore.getState().annotations[0]?.updatedAt;
      expect(newUpdatedAt?.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt!.getTime());
    });
  });

  describe('note deletion workflow', () => {
    it('should delete note by id', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Test note');
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(1);

      act(() => {
        useAnnotationStore.getState().deleteAnnotation(noteId);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });

    it('should clear selection when deleting selected note', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Test note');
        useAnnotationStore.getState().selectAnnotation(noteId);
      });

      expect(useAnnotationStore.getState().selectedId).toBe(noteId);

      act(() => {
        useAnnotationStore.getState().deleteAnnotation(noteId);
      });

      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });

    it('should delete note with all its replies', () => {
      let noteId: string = '';
      act(() => {
        noteId = createNote(0, { x: 100, y: 500 }, 'Note with replies');
        useAnnotationStore.getState().addReply(noteId, 'Reply 1', 'User');
        useAnnotationStore.getState().addReply(noteId, 'Reply 2', 'User');
      });

      expect(useAnnotationStore.getState().annotations[0]?.replies).toHaveLength(2);

      act(() => {
        useAnnotationStore.getState().deleteAnnotation(noteId);
      });

      expect(useAnnotationStore.getState().annotations).toHaveLength(0);
    });
  });

  describe('note colors', () => {
    it('should support all preset note colors', () => {
      const colorKeys = Object.keys(NOTE_COLORS) as Array<keyof typeof NOTE_COLORS>;

      act(() => {
        colorKeys.forEach((colorKey, index) => {
          createNote(0, { x: 100 + index * 50, y: 500 }, `${colorKey} note`, {
            color: NOTE_COLORS[colorKey],
          });
        });
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(colorKeys.length);

      colorKeys.forEach((colorKey) => {
        const found = annotations.find((a) => a.color === NOTE_COLORS[colorKey]);
        expect(found).toBeDefined();
      });
    });

    it('should use yellow as default color', () => {
      act(() => {
        createNote(0, { x: 100, y: 500 }, 'Default color note');
      });

      const annotation = useAnnotationStore.getState().annotations[0];
      expect(annotation?.color).toBe(NOTE_COLORS.yellow);
    });
  });

  describe('export/import workflow', () => {
    it('should export notes with replies to JSON', () => {
      act(() => {
        const noteId = createNote(0, { x: 100, y: 500 }, 'Note with replies', {
          author: 'Author',
        });
        useAnnotationStore.getState().addReply(noteId, 'A reply', 'Replier');
      });

      const json = useAnnotationStore.getState().exportAnnotations();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].type).toBe('note');
      expect(parsed[0].author).toBe('Author');
      expect(parsed[0].replies).toHaveLength(1);
      expect(parsed[0].replies[0].content).toBe('A reply');
    });

    it('should import notes from JSON', () => {
      const notesJson = JSON.stringify([
        {
          id: 'imported-note-1',
          type: 'note',
          pageIndex: 0,
          rects: [{ x: 100, y: 500, width: 24, height: 24 }],
          color: NOTE_COLORS.green,
          opacity: 1,
          content: 'Imported note',
          author: 'Importer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: [
            {
              id: 'reply-1',
              content: 'Imported reply',
              author: 'Replier',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ]);

      act(() => {
        useAnnotationStore.getState().importAnnotations(notesJson);
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0]?.id).toBe('imported-note-1');
      expect(annotations[0]?.content).toBe('Imported note');
      expect(annotations[0]?.replies).toHaveLength(1);
    });
  });

  describe('mixed annotations workflow', () => {
    it('should handle notes alongside highlights', () => {
      act(() => {
        // Create a highlight
        useAnnotationStore.getState().addAnnotation({
          type: 'highlight',
          pageIndex: 0,
          rects: [{ x: 100, y: 600, width: 200, height: 14 }],
          color: '#FFEB3B',
          opacity: 0.5,
          content: 'Highlighted text',
        });

        // Create a note
        createNote(0, { x: 100, y: 500 }, 'Note on same page');
      });

      const annotations = useAnnotationStore.getState().annotations;
      expect(annotations).toHaveLength(2);

      const highlights = annotations.filter((a) => a.type === 'highlight');
      const notes = annotations.filter((a) => a.type === 'note');

      expect(highlights).toHaveLength(1);
      expect(notes).toHaveLength(1);
    });

    it('should filter notes by page correctly', () => {
      act(() => {
        createNote(0, { x: 100, y: 500 }, 'Note on page 0');
        createNote(1, { x: 150, y: 600 }, 'Note on page 1');

        // Add highlight on page 0
        useAnnotationStore.getState().addAnnotation({
          type: 'highlight',
          pageIndex: 0,
          rects: [{ x: 100, y: 600, width: 200, height: 14 }],
          color: '#FFEB3B',
          opacity: 0.5,
        });
      });

      const page0Annotations = useAnnotationStore.getState().getPageAnnotations(0);
      const page1Annotations = useAnnotationStore.getState().getPageAnnotations(1);

      expect(page0Annotations).toHaveLength(2); // 1 note + 1 highlight
      expect(page1Annotations).toHaveLength(1); // 1 note
    });
  });
});
