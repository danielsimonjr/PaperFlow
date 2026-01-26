import { useCallback, useMemo } from 'react';
import { Trash2, X } from 'lucide-react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import { HIGHLIGHT_COLORS } from './SelectionPopup';
import { OpacitySlider } from './OpacitySlider';

interface AnnotationPropertiesProps {
  /** Called when the panel should close */
  onClose: () => void;
}

/**
 * Properties panel for editing the selected annotation.
 */
export function AnnotationProperties({ onClose }: AnnotationPropertiesProps) {
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedId = useAnnotationStore((state) => state.selectedId);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const pushHistory = useHistoryStore((state) => state.push);

  // Get selected annotation
  const selectedAnnotation = useMemo(() => {
    return annotations.find((a) => a.id === selectedId);
  }, [annotations, selectedId]);

  // Handle color change
  const handleColorChange = useCallback(
    (color: string) => {
      if (!selectedAnnotation) return;

      const oldColor = selectedAnnotation.color;
      updateAnnotation(selectedAnnotation.id, { color });

      pushHistory({
        action: 'change_color',
        undo: () => updateAnnotation(selectedAnnotation.id, { color: oldColor }),
        redo: () => updateAnnotation(selectedAnnotation.id, { color }),
      });
    },
    [selectedAnnotation, updateAnnotation, pushHistory]
  );

  // Handle opacity change
  const handleOpacityChange = useCallback(
    (opacity: number) => {
      if (!selectedAnnotation) return;

      updateAnnotation(selectedAnnotation.id, { opacity });
    },
    [selectedAnnotation, updateAnnotation]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!selectedAnnotation) return;

    const annotationCopy = { ...selectedAnnotation };
    deleteAnnotation(selectedAnnotation.id);

    pushHistory({
      action: 'delete_annotation',
      undo: () => {
        // Re-add the annotation (this is a simplified undo)
        useAnnotationStore.setState((state) => ({
          annotations: [...state.annotations, annotationCopy],
        }));
      },
      redo: () => deleteAnnotation(annotationCopy.id),
    });

    selectAnnotation(null);
    onClose();
  }, [selectedAnnotation, deleteAnnotation, pushHistory, selectAnnotation, onClose]);

  if (!selectedAnnotation) {
    return null;
  }

  const typeLabel = {
    highlight: 'Highlight',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    note: 'Note',
    drawing: 'Drawing',
    shape: 'Shape',
    stamp: 'Stamp',
  }[selectedAnnotation.type];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {typeLabel} Properties
        </h3>
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {/* Color picker (for highlight, underline, strikethrough) */}
      {['highlight', 'underline', 'strikethrough'].includes(
        selectedAnnotation.type
      ) && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
            Color
          </label>
          <div className="flex gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                  selectedAnnotation.color === color.value
                    ? 'ring-2 ring-primary-500 ring-offset-2'
                    : ''
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Opacity slider (for highlight) */}
      {selectedAnnotation.type === 'highlight' && (
        <div className="mb-4">
          <OpacitySlider
            value={selectedAnnotation.opacity}
            onChange={handleOpacityChange}
          />
        </div>
      )}

      {/* Content preview (for highlight with text) */}
      {selectedAnnotation.content && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-600 dark:text-gray-300">
            Selected Text
          </label>
          <p className="line-clamp-3 rounded bg-gray-50 p-2 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {selectedAnnotation.content}
          </p>
        </div>
      )}

      {/* Delete button */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
        onClick={handleDelete}
      >
        <Trash2 size={16} />
        Delete {typeLabel}
      </button>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-xs text-gray-400">
        Press Delete or Backspace to remove
      </p>
    </div>
  );
}
