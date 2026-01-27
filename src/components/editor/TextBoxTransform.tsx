import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@utils/cn';
import { useTextStore } from '@stores/textStore';
import type { TextBox } from '@/types/text';
import { InlineTextEditor } from './InlineTextEditor';

interface TextBoxTransformProps {
  /** Text box to transform */
  textBox: TextBox;
  /** Page height for coordinate conversion */
  pageHeight: number;
  /** Scale factor */
  scale: number;
  /** Whether this text box is selected */
  isSelected: boolean;
  /** Whether this text box is being edited */
  isEditing: boolean;
  /** Called when selection changes */
  onSelect?: () => void;
  /** Called when double-click to edit */
  onStartEdit?: () => void;
  /** Additional class names */
  className?: string;
}

type HandlePosition =
  | 'nw'
  | 'n'
  | 'ne'
  | 'w'
  | 'e'
  | 'sw'
  | 's'
  | 'se';

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize' | null;
  handle: HandlePosition | null;
  startX: number;
  startY: number;
  startBounds: TextBox['bounds'];
}

/**
 * Component for displaying and transforming (move/resize) text boxes.
 */
export function TextBoxTransform({
  textBox,
  pageHeight,
  scale,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  className,
}: TextBoxTransformProps) {
  const { updateTextBox, deleteTextBox } = useTextStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    handle: null,
    startX: 0,
    startY: 0,
    startBounds: textBox.bounds,
  });

  // Calculate screen position
  const scaleFactor = scale / 100;
  const screenX = textBox.bounds.x * scaleFactor;
  const screenY = (pageHeight - textBox.bounds.y - textBox.bounds.height) * scaleFactor;
  const screenWidth = textBox.bounds.width * scaleFactor;
  const screenHeight = textBox.bounds.height * scaleFactor;

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (
      event: React.MouseEvent,
      dragType: 'move' | 'resize',
      handle: HandlePosition | null = null
    ) => {
      event.stopPropagation();
      event.preventDefault();

      if (!isSelected) {
        onSelect?.();
        return;
      }

      setDragState({
        isDragging: true,
        dragType,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startBounds: { ...textBox.bounds },
      });
    },
    [isSelected, onSelect, textBox.bounds]
  );

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging) return;

      const deltaX = (event.clientX - dragState.startX) / scaleFactor;
      const deltaY = (event.clientY - dragState.startY) / scaleFactor;

      const newBounds = { ...dragState.startBounds };

      if (dragState.dragType === 'move') {
        newBounds.x = dragState.startBounds.x + deltaX;
        // Y is inverted in PDF coordinates
        newBounds.y = dragState.startBounds.y - deltaY;
      } else if (dragState.dragType === 'resize' && dragState.handle) {
        // Handle resize based on which handle is being dragged
        const handle = dragState.handle;

        // Horizontal resizing
        if (handle.includes('w')) {
          const newWidth = dragState.startBounds.width - deltaX;
          if (newWidth > 20) {
            newBounds.x = dragState.startBounds.x + deltaX;
            newBounds.width = newWidth;
          }
        } else if (handle.includes('e')) {
          const newWidth = dragState.startBounds.width + deltaX;
          if (newWidth > 20) {
            newBounds.width = newWidth;
          }
        }

        // Vertical resizing (note: Y is inverted)
        if (handle.includes('n')) {
          const newHeight = dragState.startBounds.height + deltaY;
          if (newHeight > 20) {
            newBounds.y = dragState.startBounds.y - deltaY;
            newBounds.height = newHeight;
          }
        } else if (handle.includes('s')) {
          const newHeight = dragState.startBounds.height - deltaY;
          if (newHeight > 20) {
            newBounds.height = newHeight;
          }
        }
      }

      updateTextBox(textBox.id, { bounds: newBounds });
    },
    [dragState, scaleFactor, updateTextBox, textBox.id]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      dragType: null,
      handle: null,
    }));
  }, []);

  // Handle double click to edit
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onStartEdit?.();
    },
    [onStartEdit]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!isEditing) {
          event.preventDefault();
          deleteTextBox(textBox.id);
        }
      }

      // Arrow keys for nudging
      if (!isEditing && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const nudgeAmount = event.shiftKey ? 10 : 1;
        const newBounds = { ...textBox.bounds };

        switch (event.key) {
          case 'ArrowUp':
            newBounds.y += nudgeAmount;
            break;
          case 'ArrowDown':
            newBounds.y -= nudgeAmount;
            break;
          case 'ArrowLeft':
            newBounds.x -= nudgeAmount;
            break;
          case 'ArrowRight':
            newBounds.x += nudgeAmount;
            break;
        }

        updateTextBox(textBox.id, { bounds: newBounds });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, textBox, deleteTextBox, updateTextBox]);

  // Set up mouse move/up listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Render resize handles
  const renderHandle = (position: HandlePosition) => {
    const positionStyles: Record<HandlePosition, string> = {
      nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
      n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
      ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
      w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
      e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
      sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
      s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
      se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
    };

    return (
      <div
        key={position}
        className={cn(
          'absolute h-3 w-3 rounded-full border-2 border-primary-500 bg-white',
          positionStyles[position]
        )}
        onMouseDown={(e) => handleMouseDown(e, 'resize', position)}
      />
    );
  };

  // If editing, show inline editor
  if (isEditing) {
    return (
      <InlineTextEditor
        textBox={textBox}
        scale={scale}
        pageHeight={pageHeight}
        className={className}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute',
        isSelected && 'ring-2 ring-primary-500',
        !isSelected && 'hover:ring-1 hover:ring-gray-400',
        dragState.isDragging && 'cursor-grabbing',
        !dragState.isDragging && isSelected && 'cursor-grab',
        className
      )}
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={(e) => {
        if (isSelected) {
          handleMouseDown(e, 'move');
        }
      }}
    >
      {/* Text content display */}
      <div
        className={cn(
          'h-full w-full overflow-hidden',
          'bg-white/50 dark:bg-gray-800/50'
        )}
        style={{
          fontFamily: textBox.fontFamily,
          fontSize: `${textBox.fontSize * scaleFactor}px`,
          fontWeight: textBox.fontWeight,
          fontStyle: textBox.fontStyle,
          textDecoration: textBox.textDecoration,
          color: textBox.color,
          textAlign: textBox.alignment,
          lineHeight: textBox.lineSpacing,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '2px',
        }}
      >
        {textBox.content || (
          <span className="text-gray-400 italic">Click to add text</span>
        )}
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          {renderHandle('nw')}
          {renderHandle('n')}
          {renderHandle('ne')}
          {renderHandle('w')}
          {renderHandle('e')}
          {renderHandle('sw')}
          {renderHandle('s')}
          {renderHandle('se')}
        </>
      )}
    </div>
  );
}
