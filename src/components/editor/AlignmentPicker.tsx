import { cn } from '@utils/cn';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import type { TextProperties } from '@/types/text';

interface AlignmentPickerProps {
  /** Current alignment */
  value: TextProperties['alignment'];
  /** Called when alignment changes */
  onChange: (alignment: TextProperties['alignment']) => void;
  /** Additional class names */
  className?: string;
}

const alignmentOptions: Array<{
  value: TextProperties['alignment'];
  icon: typeof AlignLeft;
  label: string;
}> = [
  { value: 'left', icon: AlignLeft, label: 'Align Left' },
  { value: 'center', icon: AlignCenter, label: 'Align Center' },
  { value: 'right', icon: AlignRight, label: 'Align Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
];

/**
 * Button group for selecting text alignment.
 */
export function AlignmentPicker({
  value,
  onChange,
  className,
}: AlignmentPickerProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded border border-gray-200 dark:border-gray-700',
        className
      )}
      role="group"
      aria-label="Text alignment"
    >
      {alignmentOptions.map((option, index) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        const isFirst = index === 0;
        const isLast = index === alignmentOptions.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'flex h-8 w-8 items-center justify-center',
              'transition-colors',
              isActive
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              isFirst && 'rounded-l',
              isLast && 'rounded-r',
              !isFirst && 'border-l border-gray-200 dark:border-gray-700'
            )}
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            aria-label={option.label}
            title={option.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
