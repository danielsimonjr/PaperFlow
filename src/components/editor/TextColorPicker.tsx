import { useState, useRef, useEffect } from 'react';
import { cn } from '@utils/cn';
import { ChevronDown, Check } from 'lucide-react';

interface TextColorPickerProps {
  /** Current color in hex format */
  value: string;
  /** Called when color changes */
  onChange: (color: string) => void;
  /** Additional class names */
  className?: string;
}

/** Preset color palette */
const colorPalette = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#4B5563' },
  { name: 'Gray', value: '#9CA3AF' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
];

/**
 * Color picker for text color.
 */
export function TextColorPicker({
  value,
  onChange,
  className,
}: TextColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

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

  // Update custom color when value changes
  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  // Handle preset color selection
  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  // Handle custom color change
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

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
        aria-label="Text color"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div
          className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: value }}
        />
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
            'absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border p-2 shadow-lg',
            'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          )}
        >
          {/* Color grid */}
          <div className="mb-2 grid grid-cols-6 gap-1">
            {colorPalette.map((color) => (
              <button
                key={color.value}
                type="button"
                className={cn(
                  'relative flex h-6 w-6 items-center justify-center rounded',
                  'border border-gray-200 dark:border-gray-600',
                  'hover:scale-110 transition-transform'
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
              >
                {value === color.value && (
                  <Check
                    className={cn(
                      'h-3 w-3',
                      ['#000000', '#4B5563'].includes(color.value)
                        ? 'text-white'
                        : 'text-gray-900'
                    )}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-2 h-px bg-gray-200 dark:bg-gray-700" />

          {/* Custom color input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Custom:
            </label>
            <div className="flex flex-1 items-center gap-1">
              <input
                ref={colorInputRef}
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={customColor.toUpperCase()}
                onChange={(e) => {
                  const color = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(color)) {
                    setCustomColor(color);
                    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                      onChange(color);
                    }
                  }
                }}
                className={cn(
                  'flex-1 rounded border px-2 py-1 text-xs',
                  'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700',
                  'text-gray-900 dark:text-gray-100'
                )}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
