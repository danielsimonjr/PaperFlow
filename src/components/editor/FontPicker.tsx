import { useState, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';
import { ChevronDown, Check } from 'lucide-react';
import { getWebSafeFonts } from '@lib/fonts/fontFallback';

interface FontPickerProps {
  /** Current font family */
  value: string;
  /** Called when font changes */
  onChange: (font: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Dropdown picker for selecting font family.
 */
export function FontPicker({ value, onChange, className }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fonts = getWebSafeFonts();

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

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        className={cn(
          'flex h-8 min-w-[120px] items-center justify-between gap-1 rounded px-2 text-sm',
          'border border-gray-200 bg-white hover:bg-gray-50',
          'dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700',
          isOpen && 'ring-2 ring-primary-500'
        )}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="truncate"
          style={{ fontFamily: `"${value}", sans-serif` }}
        >
          {value}
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
            'absolute left-0 top-full z-50 mt-1 max-h-60 w-48 overflow-auto rounded-lg border shadow-lg',
            'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          )}
          role="listbox"
        >
          {fonts.map((font) => (
            <button
              key={font.family}
              type="button"
              role="option"
              aria-selected={font.family === value}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                font.family === value &&
                  'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              )}
              style={{ fontFamily: `"${font.family}", ${font.generic}` }}
              onClick={() => {
                onChange(font.family);
                setIsOpen(false);
              }}
            >
              {font.name}
              {font.family === value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
