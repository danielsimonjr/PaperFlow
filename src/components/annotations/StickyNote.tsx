import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, GripVertical } from 'lucide-react';
import type { Annotation } from '@/types';
import { NoteReplies } from './NoteReplies';

// Note color options
export const NOTE_COLORS = {
  yellow: '#FEF3C7',
  green: '#D1FAE5',
  blue: '#DBEAFE',
  pink: '#FCE7F3',
  purple: '#E9D5FF',
} as const;

interface StickyNoteProps {
  annotation: Annotation;
  isSelected: boolean;
  scale: number;
  pageHeight: number;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Annotation>) => void;
}

/**
 * Sticky note annotation component.
 * Displays as a small icon that expands to show content.
 */
export function StickyNote({
  annotation,
  isSelected,
  scale,
  pageHeight,
  onSelect,
  onDelete,
  onUpdate,
}: StickyNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(annotation.content || '');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  // Calculate screen position from PDF coordinates
  // Note position is stored as PDF coordinates in annotation.rects[0]
  const position = annotation.rects[0] || { x: 0, y: 0, width: 24, height: 24 };
  const screenX = position.x * scale;
  const screenY = (pageHeight - position.y - position.height) * scale;

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Save content on blur
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      onUpdate({ content: newContent });
    },
    [onUpdate]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isExpanded) {
        e.preventDefault();
        onDelete();
      }
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      setIsExpanded(false);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = -(moveEvent.clientY - startY) / scale; // Invert Y for PDF coords

      const newX = startPosX + deltaX;
      const newY = startPosY + deltaY;

      onUpdate({
        rects: [{ ...position, x: newX, y: newY }],
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Note icon size
  const iconSize = Math.max(24, 32 * scale);

  return (
    <foreignObject
      x={screenX}
      y={screenY}
      width={isExpanded ? 280 : iconSize}
      height={isExpanded ? 'auto' : iconSize}
      style={{ overflow: 'visible' }}
    >
      <div
        ref={noteRef}
        className={`relative ${isDragging ? 'cursor-grabbing' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Note Icon (collapsed state) */}
        {!isExpanded && (
          <button
            className={`flex items-center justify-center rounded-lg shadow-md transition-all hover:scale-110 ${
              isSelected ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{
              width: iconSize,
              height: iconSize,
              backgroundColor: annotation.color || NOTE_COLORS.yellow,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            title="Click to expand note"
          >
            <MessageSquare
              size={iconSize * 0.6}
              className="text-gray-600"
            />
          </button>
        )}

        {/* Expanded Note Panel */}
        {isExpanded && (
          <div
            className="rounded-lg shadow-lg"
            style={{
              backgroundColor: annotation.color || NOTE_COLORS.yellow,
              width: 280,
              minHeight: 150,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
              <div
                className="cursor-grab text-gray-600 hover:text-gray-800"
                onMouseDown={handleDragStart}
              >
                <GripVertical size={16} />
              </div>
              <span className="text-xs text-gray-600">
                {annotation.author || 'Note'}
              </span>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              <textarea
                ref={textareaRef}
                className="min-h-[80px] w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none"
                placeholder="Type your note here..."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsExpanded(false);
                  }
                  e.stopPropagation();
                }}
              />
            </div>

            {/* Replies Section */}
            <NoteReplies
              annotation={annotation}
              onUpdate={onUpdate}
            />

            {/* Footer with delete button */}
            <div className="flex justify-end border-t border-black/10 px-3 py-2">
              <button
                className="text-xs text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                Delete Note
              </button>
            </div>
          </div>
        )}
      </div>
    </foreignObject>
  );
}
