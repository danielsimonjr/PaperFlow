/**
 * Design Canvas Component
 * The drop target and interaction area for placing and manipulating form fields.
 */

import { useRef, useState, useCallback, type DragEvent, type MouseEvent, type KeyboardEvent } from 'react';
import {
  useFormDesignerStore,
  type FieldType,
  type FormFieldDefinition,
  type Rect,
} from '@/stores/formDesignerStore';
import { FieldPreview } from './FieldPreview';

interface DesignCanvasProps {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  type: 'move' | 'resize';
  startX: number;
  startY: number;
  fieldId: string;
  originalBounds: Rect;
  resizeHandle?: ResizeHandle;
}

export function DesignCanvas({ pageIndex, pageWidth, pageHeight, scale }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    fields,
    selectedFieldId,
    selectedFieldIds,
    isPreviewMode,
    snapToGrid,
    gridSize,
    addField,
    selectField,
    addToSelection,
    clearSelection,
    moveField,
    resizeField,
    deleteSelectedFields,
    duplicateField,
    copyField,
    pasteField,
    cutField,
    getFieldsByPage,
  } = useFormDesignerStore();

  const pageFields = getFieldsByPage(pageIndex);

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const fieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (!fieldType) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    addField(fieldType, { x, y }, pageIndex);
  };

  const handleCanvasClick = (e: MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  const handleFieldMouseDown = (e: MouseEvent, field: FormFieldDefinition) => {
    e.stopPropagation();

    if (isPreviewMode) return;

    if (e.shiftKey) {
      addToSelection(field.id);
    } else if (!selectedFieldIds.includes(field.id)) {
      selectField(field.id);
    }

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setDragState({
      type: 'move',
      startX: x,
      startY: y,
      fieldId: field.id,
      originalBounds: { ...field.bounds },
    });
  };

  const handleResizeMouseDown = (
    e: MouseEvent,
    field: FormFieldDefinition,
    handle: ResizeHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (isPreviewMode) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setDragState({
      type: 'resize',
      startX: x,
      startY: y,
      fieldId: field.id,
      originalBounds: { ...field.bounds },
      resizeHandle: handle,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;

      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const dx = x - dragState.startX;
      const dy = y - dragState.startY;

      if (dragState.type === 'move') {
        moveField(dragState.fieldId, {
          x: dragState.originalBounds.x + dx,
          y: dragState.originalBounds.y + dy,
        });
      } else if (dragState.type === 'resize' && dragState.resizeHandle) {
        const original = dragState.originalBounds;
        const newBounds = { ...original };

        switch (dragState.resizeHandle) {
          case 'e':
            newBounds.width = original.width + dx;
            break;
          case 'w':
            newBounds.x = original.x + dx;
            newBounds.width = original.width - dx;
            break;
          case 's':
            newBounds.height = original.height + dy;
            break;
          case 'n':
            newBounds.y = original.y + dy;
            newBounds.height = original.height - dy;
            break;
          case 'se':
            newBounds.width = original.width + dx;
            newBounds.height = original.height + dy;
            break;
          case 'sw':
            newBounds.x = original.x + dx;
            newBounds.width = original.width - dx;
            newBounds.height = original.height + dy;
            break;
          case 'ne':
            newBounds.y = original.y + dy;
            newBounds.height = original.height - dy;
            newBounds.width = original.width + dx;
            break;
          case 'nw':
            newBounds.x = original.x + dx;
            newBounds.y = original.y + dy;
            newBounds.width = original.width - dx;
            newBounds.height = original.height - dy;
            break;
        }

        resizeField(dragState.fieldId, newBounds);
      }
    },
    [dragState, getCanvasCoordinates, moveField, resizeField]
  );

  const handleMouseUp = () => {
    setDragState(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isPreviewMode) return;
    if (!selectedFieldId) return;

    const field = fields.find((f) => f.id === selectedFieldId);
    if (!field) return;

    const nudgeAmount = e.shiftKey ? gridSize : 1;

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        deleteSelectedFields();
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveField(selectedFieldId, { x: field.bounds.x, y: field.bounds.y - nudgeAmount });
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveField(selectedFieldId, { x: field.bounds.x, y: field.bounds.y + nudgeAmount });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveField(selectedFieldId, { x: field.bounds.x - nudgeAmount, y: field.bounds.y });
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveField(selectedFieldId, { x: field.bounds.x + nudgeAmount, y: field.bounds.y });
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          duplicateField(selectedFieldId);
        }
        break;
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          copyField();
        }
        break;
      case 'v':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const centerX = pageWidth / 2;
          const centerY = pageHeight / 2;
          pasteField({ x: centerX, y: centerY }, pageIndex);
        }
        break;
      case 'x':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          cutField();
        }
        break;
      case 'Escape':
        clearSelection();
        break;
    }
  };

  const renderResizeHandles = (field: FormFieldDefinition) => {
    if (!selectedFieldIds.includes(field.id) || isPreviewMode) return null;

    const handleSize = 8;
    const handles: { pos: ResizeHandle; style: React.CSSProperties }[] = [
      { pos: 'nw', style: { top: -handleSize / 2, left: -handleSize / 2, cursor: 'nwse-resize' } },
      { pos: 'n', style: { top: -handleSize / 2, left: '50%', marginLeft: -handleSize / 2, cursor: 'ns-resize' } },
      { pos: 'ne', style: { top: -handleSize / 2, right: -handleSize / 2, cursor: 'nesw-resize' } },
      { pos: 'e', style: { top: '50%', marginTop: -handleSize / 2, right: -handleSize / 2, cursor: 'ew-resize' } },
      { pos: 'se', style: { bottom: -handleSize / 2, right: -handleSize / 2, cursor: 'nwse-resize' } },
      { pos: 's', style: { bottom: -handleSize / 2, left: '50%', marginLeft: -handleSize / 2, cursor: 'ns-resize' } },
      { pos: 'sw', style: { bottom: -handleSize / 2, left: -handleSize / 2, cursor: 'nesw-resize' } },
      { pos: 'w', style: { top: '50%', marginTop: -handleSize / 2, left: -handleSize / 2, cursor: 'ew-resize' } },
    ];

    return handles.map(({ pos, style }) => (
      <div
        key={pos}
        className="absolute bg-blue-500 border border-white rounded-sm"
        style={{
          width: handleSize,
          height: handleSize,
          ...style,
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, field, pos)}
      />
    ));
  };

  return (
    <div
      ref={canvasRef}
      className={`relative ${isDragOver ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
      style={{
        width: pageWidth * scale,
        height: pageHeight * scale,
        backgroundImage: snapToGrid && !isPreviewMode
          ? `repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${gridSize * scale - 1}px,
              #e5e7eb ${gridSize * scale - 1}px,
              #e5e7eb ${gridSize * scale}px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent ${gridSize * scale - 1}px,
              #e5e7eb ${gridSize * scale - 1}px,
              #e5e7eb ${gridSize * scale}px
            )`
          : undefined,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {pageFields.map((field) => (
        <div
          key={field.id}
          className={`absolute ${
            selectedFieldIds.includes(field.id) && !isPreviewMode
              ? 'ring-2 ring-blue-500'
              : ''
          }`}
          style={{
            left: field.bounds.x * scale,
            top: field.bounds.y * scale,
            width: field.bounds.width * scale,
            height: field.bounds.height * scale,
            cursor: isPreviewMode ? 'default' : 'move',
          }}
          onMouseDown={(e) => handleFieldMouseDown(e, field)}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: field.bounds.width,
              height: field.bounds.height,
            }}
          >
            <FieldPreview
              field={field}
              isSelected={selectedFieldIds.includes(field.id)}
              isPreviewMode={isPreviewMode}
            />
          </div>
          {renderResizeHandles(field)}
        </div>
      ))}

      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-30 pointer-events-none flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Drop field here
          </div>
        </div>
      )}
    </div>
  );
}
