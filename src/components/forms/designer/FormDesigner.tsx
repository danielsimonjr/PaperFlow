/**
 * Form Designer Component
 * Main container for the drag-and-drop form field designer.
 */

import { useEffect, useCallback } from 'react';
import { useFormDesignerStore } from '@/stores/formDesignerStore';
import { FieldPalette } from './FieldPalette';
import { DesignCanvas } from './DesignCanvas';
import { FieldProperties } from './FieldProperties';
import { DesignerToolbar } from './DesignerToolbar';

interface FormDesignerProps {
  pageIndex?: number;
  pageWidth: number;
  pageHeight: number;
  scale?: number;
  onSave?: () => void;
  onClose?: () => void;
}

export function FormDesigner({
  pageIndex = 0,
  pageWidth,
  pageHeight,
  scale = 1,
  onSave,
  onClose,
}: FormDesignerProps) {
  const {
    isDesignMode,
    isPreviewMode,
    enterDesignMode,
    exitDesignMode,
  } = useFormDesignerStore();

  // Enter design mode on mount
  useEffect(() => {
    enterDesignMode();
    return () => {
      exitDesignMode();
    };
  }, [enterDesignMode, exitDesignMode]);

  // Handle keyboard shortcuts at document level
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + F to toggle form designer (when not in input)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (isDesignMode) {
            onClose?.();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDesignMode, onClose]);

  const handleClose = useCallback(() => {
    exitDesignMode();
    onClose?.();
  }, [exitDesignMode, onClose]);

  if (!isDesignMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      {/* Toolbar */}
      <DesignerToolbar onSave={onSave} onClose={handleClose} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette (Left) */}
        <FieldPalette />

        {/* Canvas (Center) */}
        <div className="flex-1 overflow-auto p-4 bg-gray-200">
          <div className="inline-block bg-white shadow-lg">
            {isPreviewMode && (
              <div className="bg-blue-500 text-white text-center py-1 text-sm">
                Preview Mode - Test your form
              </div>
            )}
            <DesignCanvas
              pageIndex={pageIndex}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              scale={scale}
            />
          </div>
        </div>

        {/* Properties Panel (Right) */}
        <FieldProperties />
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-1 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Page {pageIndex + 1}</span>
          <span>
            {pageWidth.toFixed(0)} × {pageHeight.toFixed(0)} pts
          </span>
          <span>Scale: {(scale * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ctrl+C: Copy</span>
          <span>Ctrl+V: Paste</span>
          <span>Ctrl+D: Duplicate</span>
          <span>Delete: Remove</span>
          <span>Arrow Keys: Nudge</span>
        </div>
      </div>
    </div>
  );
}
