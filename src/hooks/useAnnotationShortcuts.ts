import { useEffect, useCallback } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import type { AnnotationType } from '@/types';

interface UseAnnotationShortcutsOptions {
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

/**
 * Hook for handling annotation keyboard shortcuts.
 *
 * Shortcuts:
 * - H: Highlight tool
 * - U: Underline tool
 * - S: Strikethrough tool
 * - N: Note tool
 * - V or Escape: Select tool (deselect current tool)
 * - Delete/Backspace: Delete selected annotation
 * - Ctrl/Cmd+Z: Undo
 * - Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: Redo
 */
export function useAnnotationShortcuts({
  enabled = true,
}: UseAnnotationShortcutsOptions = {}) {
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo);
  const canRedo = useHistoryStore((state) => state.canRedo);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const isModifierKey = e.ctrlKey || e.metaKey;

      // Undo/Redo
      if (isModifierKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
        return;
      }

      if (isModifierKey && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Don't handle tool shortcuts if modifier key is pressed
      if (isModifierKey) return;

      // Tool shortcuts
      const toolShortcuts: Record<string, AnnotationType | null> = {
        h: 'highlight',
        u: 'underline',
        s: 'strikethrough',
        n: 'note',
        v: null,
      };

      const lowerKey = e.key.toLowerCase();

      if (Object.prototype.hasOwnProperty.call(toolShortcuts, lowerKey)) {
        e.preventDefault();
        const tool = toolShortcuts[lowerKey] ?? null;
        setActiveTool(activeTool === tool ? null : tool);
        return;
      }

      // Escape to deselect tool or annotation
      if (e.key === 'Escape') {
        e.preventDefault();
        if (activeTool) {
          setActiveTool(null);
        } else if (selectedId) {
          selectAnnotation(null);
        }
        return;
      }

      // Delete selected annotation
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteAnnotation(selectedId);
          selectAnnotation(null);
        }
        return;
      }
    },
    [
      activeTool,
      setActiveTool,
      selectedId,
      deleteAnnotation,
      selectAnnotation,
      undo,
      redo,
      canUndo,
      canRedo,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    activeTool,
    setActiveTool,
  };
}
