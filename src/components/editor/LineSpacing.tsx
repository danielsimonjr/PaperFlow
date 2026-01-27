import { useState, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';
import { ChevronDown, Check, AlignVerticalSpaceAround } from 'lucide-react';

interface LineSpacingProps {
  /** Current line spacing multiplier */
  value: number;
  /** Called when spacing changes */
  onChange: (spacing: number) => void;
  /** Additional class names */
  className?: string;
}

/** Preset line spacing options */
const spacingOptions = [
  { value: 1, label: 'Single', shortLabel: '1' },
  { value: 1.15, label: '1.15', shortLabel: '1.15' },
  { value: 1.5, label: '1.5', shortLabel: '1.5' },
  { value: 2, label: 'Double', shortLabel: '2' },
  { value: 2.5, label: '2.5', shortLabel: '2.5' },
  { value: 3, label: 'Triple', shortLabel: '3' },
];

/**
 * Dropdown picker for selecting line spacing.
 */
export function LineSpacing({
  value,
  onChange,
  className,
}: LineSpacingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find current option label
  const currentOption = spacingOptions.find((opt) => opt.value === value);
  const displayValue = currentOption?.shortLabel || String(value);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        className={cn(
          'flex h-8 items-center gap-1 rounded border px-2',
          'border-gray-200 bg-white hover:bg-gray-50',
          'dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
          isOpen && 'ring-2 ring-primary-500'
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Line spacing"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <AlignVerticalSpaceAround className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {displayValue}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border shadow-lg',
            'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          )}
          role="listbox"
        >
          {spacingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                option.value === value &&
                  'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              )}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4" />}
            </button>
          ))}

          {/* Custom value display if not a preset */}
          {!currentOption && (
            <div className="border-t border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Custom: {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
