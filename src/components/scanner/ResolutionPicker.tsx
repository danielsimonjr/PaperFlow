/**
 * Resolution Picker Component
 *
 * DPI resolution selector with visual indicators for quality/speed tradeoffs.
 */

import { cn } from '@utils/cn';
import type { ScanResolution } from '@lib/scanner/types';

interface ResolutionPickerProps {
  value: ScanResolution;
  onChange: (resolution: ScanResolution) => void;
  availableResolutions?: ScanResolution[];
  className?: string;
}

interface ResolutionOption {
  value: ScanResolution;
  label: string;
  description: string;
  speedIndicator: 'fast' | 'medium' | 'slow' | 'very-slow';
  qualityIndicator: 'draft' | 'standard' | 'high' | 'archival';
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  {
    value: 75,
    label: '75 DPI',
    description: 'Quick preview',
    speedIndicator: 'fast',
    qualityIndicator: 'draft',
  },
  {
    value: 150,
    label: '150 DPI',
    description: 'Email & web',
    speedIndicator: 'fast',
    qualityIndicator: 'standard',
  },
  {
    value: 300,
    label: '300 DPI',
    description: 'Standard documents',
    speedIndicator: 'medium',
    qualityIndicator: 'high',
  },
  {
    value: 600,
    label: '600 DPI',
    description: 'High-quality archival',
    speedIndicator: 'slow',
    qualityIndicator: 'archival',
  },
];

export function ResolutionPicker({
  value,
  onChange,
  availableResolutions,
  className,
}: ResolutionPickerProps) {
  const speedColors = {
    fast: 'bg-green-500',
    medium: 'bg-yellow-500',
    slow: 'bg-orange-500',
    'very-slow': 'bg-red-500',
  };

  const qualityColors = {
    draft: 'bg-gray-400',
    standard: 'bg-blue-400',
    high: 'bg-purple-500',
    archival: 'bg-indigo-600',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium block">Resolution (DPI)</label>

      <div className="grid grid-cols-2 gap-2">
        {RESOLUTION_OPTIONS.map((option) => {
          const isAvailable = !availableResolutions || availableResolutions.includes(option.value);
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => isAvailable && onChange(option.value)}
              disabled={!isAvailable}
              className={cn(
                'relative p-3 rounded-lg border-2 text-left transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : isAvailable
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-4 h-4 text-primary-500"
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

              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>

              {/* Indicators */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', speedColors[option.speedIndicator])} />
                  <span className="text-xs text-gray-400">Speed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', qualityColors[option.qualityIndicator])} />
                  <span className="text-xs text-gray-400">Quality</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Faster</span>
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Slower</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Draft</span>
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>Archival</span>
        </div>
      </div>
    </div>
  );
}

export default ResolutionPicker;
