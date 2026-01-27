import { useState, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';
import { ChevronDown } from 'lucide-react';

interface FontSizePickerProps {
  /** Current font size in points */
  value: number;
  /** Called when size changes */
  onChange: (size: number) => void;
  /** Minimum size (default: 8) */
  min?: number;
  /** Maximum size (default: 72) */
  max?: number;
  /** Additional class names */
  className?: string;
}

/** Common font sizes for quick selection */
const commonSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

/**
 * Dropdown picker for selecting font size.
 */
export function FontSizePicker({
  value,
  onChange,
  min = 8,
  max = 72,
  className,
}: FontSizePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle input blur - validate and apply
  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setInputValue(String(clamped));
    } else {
      setInputValue(String(value));
    }
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setInputValue(String(value));
      setIsOpen(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(max, value + 1);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(min, value - 1);
      onChange(newValue);
    }
  };

  // Handle size selection
  const handleSizeSelect = (size: number) => {
    onChange(size);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input with dropdown trigger */}
      <div
        className={cn(
          'flex h-8 items-center rounded border',
          'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
          isOpen && 'ring-2 ring-primary-500'
        )}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={() => inputRef.current?.select()}
          className={cn(
            'h-full w-12 bg-transparent px-2 text-center text-sm outline-none',
            'text-gray-900 dark:text-gray-100'
          )}
          aria-label="Font size"
        />
        <button
          type="button"
          className={cn(
            'flex h-full items-center px-1 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select font size"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 max-h-48 w-20 overflow-auto rounded-lg border shadow-lg',
            'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          )}
          role="listbox"
        >
          {commonSizes.map((size) => (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={size === value}
              className={cn(
                'w-full px-3 py-1.5 text-center text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                size === value &&
                  'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              )}
              onClick={() => handleSizeSelect(size)}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
