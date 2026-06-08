import { useState, useCallback } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { NOTE_COLORS } from './StickyNote';
import type { Annotation } from '@/types';

interface NoteToolProps {
  pageIndex: number;
  scale: number;
  pageHeight: number;
  onNoteCreated?: () => void;
}

/**
 * Note placement tool overlay.
 * Shows cursor and handles click-to-place note functionality.
 */
export function NoteTool({
  pageIndex,
  scale,
  pageHeight,
  onNoteCreated,
}: NoteToolProps) {
  const [isPlacing, setIsPlacing] = useState(true);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlacing) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert screen coordinates to PDF coordinates
      const pdfX = clickX / scale;
      const pdfY = pageHeight - clickY / scale;

      // Create note annotation
      const noteData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'note',
        pageIndex,
        rects: [{ x: pdfX, y: pdfY, width: 24, height: 24 }],
        color: activeColor || NOTE_COLORS.yellow,
        opacity: 1,
        content: '',
        author: 'User',
        replies: [],
      };

      // annotationStore.addAnnotation is the single source of truth for
      // history — it pushes its own `add_note` entry. Adding another one
      // here doubled the undo stack and forced two Ctrl+Z presses to
      // remove a single note.
      addAnnotation(noteData);

      // Reset tool
      setActiveTool(null);
      setIsPlacing(false);
      onNoteCreated?.();
    },
    [
      isPlacing,
      scale,
      pageHeight,
      pageIndex,
      activeColor,
      addAnnotation,
      setActiveTool,
      onNoteCreated,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        setIsPlacing(false);
      }
    },
    [setActiveTool]
  );

  if (!isPlacing) return null;

  return (
    <div
      className="absolute inset-0 cursor-crosshair"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Click to place note"
    >
      {/* Visual indicator */}
      <div className="pointer-events-none absolute inset-0 bg-primary-500/5" />
    </div>
  );
}
