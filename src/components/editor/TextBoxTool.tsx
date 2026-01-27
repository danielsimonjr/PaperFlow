import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';
import { useTextStore } from '@stores/textStore';
import type { TextBox } from '@/types/text';

interface TextBoxToolProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Page height for coordinate conversion */
  pageHeight: number;
  /** Scale factor */
  scale: number;
  /** Whether the tool is active */
  isActive: boolean;
  /** Container ref for mouse coordinates */
  containerRef: React.RefObject<HTMLElement>;
  /** Called when a text box is created */
  onTextBoxCreated?: (textBox: TextBox) => void;
  /** Additional class names */
  className?: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Tool for creating new text boxes by clicking or dragging.
 */
export function TextBoxTool({
  pageIndex,
  pageHeight,
  scale,
  isActive,
  containerRef,
  onTextBoxCreated,
  className,
}: TextBoxToolProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const clickTimeoutRef = useRef<number | null>(null);
  const { addTextBox, defaultProperties, setEditingId } = useTextStore();

  // Calculate preview bounds
  const getPreviewBounds = useCallback(() => {
    const { startX, startY, currentX, currentY } = dragState;
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    return { left, top, width, height };
  }, [dragState]);

  // Create text box from drag area
  const createTextBox = useCallback(
    (
      screenBounds: { left: number; top: number; width: number; height: number },
      startEditing: boolean = false
    ) => {
      const scaleFactor = scale / 100;

      // Ensure minimum size
      const minWidth = 50;
      const minHeight = 20;
      const width = Math.max(screenBounds.width, minWidth);
      const height = Math.max(screenBounds.height, minHeight);

      // Convert to PDF coordinates
      const pdfX = screenBounds.left / scaleFactor;
      const pdfY = pageHeight - (screenBounds.top + height) / scaleFactor;
      const pdfWidth = width / scaleFactor;
      const pdfHeight = height / scaleFactor;

      const id = addTextBox({
        pageIndex,
        bounds: {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
        },
        content: '',
        fontFamily: defaultProperties.fontFamily,
        fontSize: defaultProperties.fontSize,
        fontWeight: defaultProperties.fontWeight,
        fontStyle: defaultProperties.fontStyle,
        textDecoration: defaultProperties.textDecoration,
        color: defaultProperties.color,
        alignment: defaultProperties.alignment,
        lineSpacing: defaultProperties.lineSpacing,
        rotation: 0,
      });

      const textBox = useTextStore.getState().getTextBox(id);

      if (textBox && startEditing) {
        setEditingId(id);
      }

      if (textBox) {
        onTextBoxCreated?.(textBox);
      }

      return id;
    },
    [
      scale,
      pageHeight,
      pageIndex,
      addTextBox,
      defaultProperties,
      setEditingId,
      onTextBoxCreated,
    ]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isActive || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setDragState({
        isDragging: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });

      // Set up click timeout for single-click behavior
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    },
    [isActive, containerRef]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    },
    [dragState.isDragging, containerRef]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const width = Math.abs(x - dragState.startX);
      const height = Math.abs(y - dragState.startY);

      // If drag distance is small, treat as single click
      if (width < 10 && height < 10) {
        // Create a default-sized text box at click position
        createTextBox(
          {
            left: dragState.startX,
            top: dragState.startY,
            width: 150,
            height: 30,
          },
          true // Start editing immediately
        );
      } else {
        // Create text box from drag area
        createTextBox(
          {
            left: Math.min(dragState.startX, x),
            top: Math.min(dragState.startY, y),
            width,
            height,
          },
          true // Start editing immediately
        );
      }

      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    },
    [dragState, containerRef, createTextBox]
  );

  // Set up event listeners
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isActive, containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Clean up timeout on unmount
  useEffect(() => {
    const timeoutRef = clickTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        window.clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Don't render anything if not active
  if (!isActive) return null;

  const previewBounds = getPreviewBounds();
  const showPreview =
    dragState.isDragging &&
    (previewBounds.width > 5 || previewBounds.height > 5);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0',
        isActive && 'cursor-crosshair',
        className
      )}
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    >
      {/* Drag preview */}
      {showPreview && (
        <div
          className="absolute border-2 border-dashed border-primary-500 bg-primary-100/30 dark:bg-primary-900/30"
          style={{
            left: previewBounds.left,
            top: previewBounds.top,
            width: previewBounds.width,
            height: previewBounds.height,
          }}
        />
      )}
    </div>
  );
}
