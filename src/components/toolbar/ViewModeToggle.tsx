import { FileText, Rows, BookOpen } from 'lucide-react';
import { useDocumentStore } from '@stores/documentStore';
import { cn } from '@utils/cn';

type ViewMode = 'single' | 'continuous' | 'spread';

const viewModes: { id: ViewMode; icon: typeof FileText; label: string }[] = [
  { id: 'single', icon: FileText, label: 'Single Page' },
  { id: 'continuous', icon: Rows, label: 'Continuous Scroll' },
  { id: 'spread', icon: BookOpen, label: 'Two-Page Spread' },
];

interface ViewModeToggleProps {
  className?: string;
}

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const viewMode = useDocumentStore((state) => state.viewMode);
  const setViewMode = useDocumentStore((state) => state.setViewMode);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {viewModes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setViewMode(id)}
          className={cn(
            'rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            viewMode === id &&
              'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
          )}
          title={label}
          aria-label={label}
          aria-pressed={viewMode === id}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
