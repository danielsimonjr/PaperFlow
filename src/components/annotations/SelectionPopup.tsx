import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useHistoryStore } from '@stores/historyStore';
import type { AnnotationRect, AnnotationType, Annotation } from '@/types';

// Highlight color presets
export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Orange', value: '#FF9800' },
] as const;

interface SelectionPopupProps {
  /** Position for the popup */
  position: { x: number; y: number };
  /** Selected text */
  text: string;
  /** Selection rectangles in PDF coordinates */
  pdfRects: AnnotationRect[];
  /** Page index (0-based) */
  pageIndex: number;
  /** Called when an annotation is created */
  onAnnotationCreated?: () => void;
  /** Called when popup should close */
  onClose: () => void;
}

/**
 * Popup menu that appears after text selection.
 * Provides options to highlight, underline, strikethrough, or copy text.
 */
export function SelectionPopup({
  position,
  text,
  pdfRects,
  pageIndex,
  onAnnotationCreated,
  onClose,
}: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingType, setPendingType] = useState<AnnotationType | null>(null);

  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);
  const setActiveColor = useAnnotationStore((state) => state.setActiveColor);
  const deleteAnnotation = useAnnotationStore((state) => state.deleteAnnotation);
  const pushHistory = useHistoryStore((state) => state.push);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Create annotation with specified type
  const createAnnotation = useCallback(
    (type: AnnotationType, color?: string) => {
      const annotationData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
        type,
        pageIndex,
        rects: pdfRects,
        color: color || activeColor,
        opacity: activeOpacity,
        content: text,
      };

      const id = addAnnotation(annotationData);

      // Add to history
      pushHistory({
        action: `add_${type}`,
        undo: () => deleteAnnotation(id),
        redo: () => addAnnotation(annotationData),
      });

      onAnnotationCreated?.();
      onClose();
    },
    [
      pageIndex,
      pdfRects,
      text,
      activeColor,
      activeOpacity,
      addAnnotation,
      deleteAnnotation,
      pushHistory,
      onAnnotationCreated,
      onClose,
    ]
  );

  // Handle highlight with color picker
  const handleHighlightClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPendingType('highlight');
      setShowColorPicker(true);
    },
    []
  );

  // Handle quick highlight (use current color)
  const handleQuickHighlight = useCallback(() => {
    createAnnotation('highlight');
  }, [createAnnotation]);

  // Handle color selection
  const handleColorSelect = useCallback(
    (color: string) => {
      setActiveColor(color);
      if (pendingType) {
        createAnnotation(pendingType, color);
      }
      setShowColorPicker(false);
      setPendingType(null);
    },
    [pendingType, createAnnotation, setActiveColor]
  );

  // Copy text to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    onClose();
  }, [text, onClose]);

  // Calculate popup position (ensure it stays in viewport)
  const popupStyle = {
    left: Math.max(10, position.x - 100),
    top: Math.max(10, position.y - 50),
  };

  return (
    <div
      ref={popupRef}
      className="absolute z-50 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800"
      style={popupStyle}
    >
      {showColorPicker ? (
        // Color picker view
        <div className="p-2">
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Choose color
          </div>
          <div className="flex gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                className="h-6 w-6 rounded-full ring-offset-2 transition-transform hover:scale-110 hover:ring-2 hover:ring-gray-400"
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>
      ) : (
        // Main toolbar view
        <div className="flex items-center gap-1 p-1">
          {/* Highlight button with color dropdown */}
          <div className="relative flex">
            <button
              className="flex items-center gap-1 rounded-l px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={handleQuickHighlight}
              title="Highlight"
            >
              <Highlighter size={16} style={{ color: activeColor }} />
            </button>
            <button
              className="rounded-r px-1 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleHighlightClick}
              title="Choose color"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Underline */}
          <button
            className="rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => createAnnotation('underline', '#EF4444')}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </button>

          {/* Strikethrough */}
          <button
            className="rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => createAnnotation('strikethrough', '#EF4444')}
            title="Strikethrough"
          >
            <StrikethroughIcon size={16} />
          </button>

          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Copy */}
          <button
            className="rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={handleCopy}
            title="Copy text"
          >
            <Copy size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
