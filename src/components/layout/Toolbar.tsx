import { useState } from 'react';
import {
  Highlighter,
  StickyNote,
  Pencil,
  Type,
  Hand,
  MousePointer,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Underline,
  Strikethrough,
  FileDown,
} from 'lucide-react';
import { ViewModeToggle } from '@components/toolbar/ViewModeToggle';
import { PageNavigation } from '@components/viewer/PageNavigation';
import { ZoomControls } from '@components/viewer/ZoomControls';
import { ExportImportDialog } from '@components/annotations/ExportImportDialog';
import { useAnnotationStore, type ShapeType } from '@stores/annotationStore';
import { useUIStore, type EditorTool } from '@stores/uiStore';
import { useAnnotationShortcuts } from '@hooks/useAnnotationShortcuts';
import { cn } from '@utils/cn';
import type { AnnotationType } from '@/types';

type Tool = EditorTool | AnnotationType;

export function Toolbar() {
  const [showExportImport, setShowExportImport] = useState(false);

  // Use annotation store for annotation tools
  const annotationTool = useAnnotationStore((state) => state.activeTool);
  const setAnnotationTool = useAnnotationStore((state) => state.setActiveTool);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeShapeType = useAnnotationStore((state) => state.activeShapeType);
  const setActiveShapeType = useAnnotationStore((state) => state.setActiveShapeType);

  // Use UI store for editor tools (select, hand, text, draw, shape)
  const editorTool = useUIStore((state) => state.activeTool);
  const setEditorTool = useUIStore((state) => state.setActiveTool);

  // Set up keyboard shortcuts
  useAnnotationShortcuts({ enabled: true });

  // Combined active tool - annotation tools take precedence
  const currentTool = annotationTool || editorTool;

  const handleToolClick = (tool: Tool) => {
    if (['highlight', 'underline', 'strikethrough', 'note'].includes(tool)) {
      // Annotation tools
      setAnnotationTool(tool === annotationTool ? null : (tool as AnnotationType));
    } else {
      // Non-annotation tools (editor tools)
      setAnnotationTool(null);
      setEditorTool(tool as EditorTool);
    }
  };

  const tools: { id: Tool; icon: typeof MousePointer; label: string; shortcut?: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
    { id: 'hand', icon: Hand, label: 'Hand' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight', shortcut: 'H' },
    { id: 'underline', icon: Underline, label: 'Underline', shortcut: 'U' },
    { id: 'strikethrough', icon: Strikethrough, label: 'Strikethrough', shortcut: 'S' },
    { id: 'note', icon: StickyNote, label: 'Sticky Note', shortcut: 'N' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'shape', icon: Square, label: 'Shapes' },
  ];

  return (
    <>
      <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map(({ id, icon: Icon, label, shortcut }) => {
            const isActive = currentTool === id;
            const isHighlight = id === 'highlight';

            return (
              <button
                key={id}
                onClick={() => handleToolClick(id)}
                className={cn(
                  'rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                  isActive &&
                    'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                )}
                title={shortcut ? `${label} (${shortcut})` : label}
              >
                <Icon
                  className="h-4 w-4"
                  style={isHighlight ? { color: isActive ? activeColor : undefined } : undefined}
                />
              </button>
            );
          })}

          {/* Separator */}
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Export/Import Button */}
          <button
            onClick={() => setShowExportImport(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Export/Import Annotations"
          >
            <FileDown className="h-4 w-4" />
          </button>
        </div>

        {/* View Mode, Navigation & Zoom */}
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <ViewModeToggle />

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Page Navigation */}
          <PageNavigation />

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Zoom Controls */}
          <ZoomControls />
        </div>
      </div>

      {/* Shape Type Selector - shown when shape tool is active */}
      {editorTool === 'shape' && (
        <div className="flex h-10 items-center gap-1 border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-800 dark:bg-gray-900">
          <span className="mr-2 text-xs text-gray-500 dark:text-gray-400">Shape:</span>
          {([
            { type: 'rectangle' as ShapeType, icon: Square, label: 'Rectangle' },
            { type: 'ellipse' as ShapeType, icon: Circle, label: 'Ellipse' },
            { type: 'arrow' as ShapeType, icon: ArrowRight, label: 'Arrow' },
            { type: 'line' as ShapeType, icon: Minus, label: 'Line' },
          ]).map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setActiveShapeType(type)}
              className={cn(
                'rounded-md p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700',
                activeShapeType === type &&
                  'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
              )}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}

      {/* Export/Import Dialog */}
      <ExportImportDialog
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
      />
    </>
  );
}
