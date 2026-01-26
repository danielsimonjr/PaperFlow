import { useState } from 'react';
import {
  Highlighter,
  StickyNote,
  Pencil,
  Type,
  Hand,
  MousePointer,
  Square,
} from 'lucide-react';
import { ViewModeToggle } from '@components/toolbar/ViewModeToggle';
import { PageNavigation } from '@components/viewer/PageNavigation';
import { ZoomControls } from '@components/viewer/ZoomControls';
import { cn } from '@utils/cn';

type Tool = 'select' | 'hand' | 'text' | 'highlight' | 'note' | 'draw' | 'shape';

export function Toolbar() {
  const [activeTool, setActiveTool] = useState<Tool>('select');

  const tools: { id: Tool; icon: typeof MousePointer; label: string }[] = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'hand', icon: Hand, label: 'Hand' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' },
    { id: 'note', icon: StickyNote, label: 'Sticky Note' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'shape', icon: Square, label: 'Shapes' },
  ];

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            className={cn(
              'rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              activeTool === id &&
                'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
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
  );
}
