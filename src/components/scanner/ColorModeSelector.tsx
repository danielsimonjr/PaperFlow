/**
 * Color Mode Selector Component
 *
 * Visual selector for scan color modes with previews.
 */

import { cn } from '@utils/cn';
import type { ScanColorMode } from '@lib/scanner/types';

interface ColorModeSelectorProps {
  value: ScanColorMode;
  onChange: (mode: ScanColorMode) => void;
  availableModes?: ScanColorMode[];
  className?: string;
}

interface ColorModeOption {
  value: ScanColorMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: string; // Gradient or background
}

const COLOR_MODE_OPTIONS: ColorModeOption[] = [
  {
    value: 'color',
    label: 'Color',
    description: 'Full color scan',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="#EF4444" />
        <circle cx="8" cy="14" r="4" fill="#22C55E" />
        <circle cx="16" cy="14" r="4" fill="#3B82F6" />
      </svg>
    ),
    preview: 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500',
  },
  {
    value: 'grayscale',
    label: 'Grayscale',
    description: 'Shades of gray',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="url(#gray-gradient)" />
        <defs>
          <linearGradient id="gray-gradient" x1="4" y1="4" x2="20" y2="20">
            <stop stopColor="#1F2937" />
            <stop offset="1" stopColor="#9CA3AF" />
          </linearGradient>
        </defs>
      </svg>
    ),
    preview: 'bg-gradient-to-b from-gray-800 to-gray-400',
  },
  {
    value: 'blackwhite',
    label: 'Black & White',
    description: 'High contrast B&W',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="8" height="16" fill="black" rx="1" />
        <rect x="12" y="4" width="8" height="16" fill="white" stroke="black" strokeWidth="1" rx="1" />
      </svg>
    ),
    preview: 'bg-black',
  },
];

export function ColorModeSelector({
  value,
  onChange,
  availableModes,
  className,
}: ColorModeSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium block">Color Mode</label>

      <div className="flex gap-3">
        {COLOR_MODE_OPTIONS.map((option) => {
          const isAvailable = !availableModes || availableModes.includes(option.value);
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => isAvailable && onChange(option.value)}
              disabled={!isAvailable}
              className={cn(
                'flex-1 flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                  : isAvailable
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
              )}
            >
              {/* Preview box */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg mb-3 shadow-inner',
                  option.preview,
                  option.value === 'blackwhite' && 'border border-gray-300 dark:border-gray-600'
                )}
              />

              {/* Label */}
              <span className="font-medium text-sm">{option.label}</span>
              <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="mt-2">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode-specific tips */}
      <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
        {value === 'color' && (
          <span>Best for photos and colored documents. Larger file size.</span>
        )}
        {value === 'grayscale' && (
          <span>Good for documents with images. Moderate file size.</span>
        )}
        {value === 'blackwhite' && (
          <span>Best for text documents. Smallest file size, sharpest text.</span>
        )}
      </div>
    </div>
  );
}

export default ColorModeSelector;
