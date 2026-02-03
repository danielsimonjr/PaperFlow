/**
 * Print Quality Selector Component
 *
 * Allows selection of print quality with visual indicators
 * and descriptions.
 */

import { usePrintStore, type PrintQuality } from '@stores/printStore';
import { cn } from '@utils/cn';

/**
 * Quality option details
 */
interface QualityOption {
  id: PrintQuality;
  name: string;
  description: string;
  dpi: string;
  speed: 'Fast' | 'Normal' | 'Slow';
  inkUsage: 'Low' | 'Normal' | 'High';
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: 'draft',
    name: 'Draft',
    description: 'Quick printing for internal use',
    dpi: '150 DPI',
    speed: 'Fast',
    inkUsage: 'Low',
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Balanced quality for everyday documents',
    dpi: '300 DPI',
    speed: 'Normal',
    inkUsage: 'Normal',
  },
  {
    id: 'high',
    name: 'High',
    description: 'Best quality for photos and presentations',
    dpi: '600 DPI',
    speed: 'Slow',
    inkUsage: 'High',
  },
];

interface PrintQualitySelectorProps {
  className?: string;
  compact?: boolean;
}

export function PrintQualitySelector({
  className,
  compact = false,
}: PrintQualitySelectorProps) {
  const { settings, updateSettings } = usePrintStore();

  if (compact) {
    return (
      <div className={cn('flex gap-2', className)}>
        {QUALITY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => updateSettings({ quality: option.id })}
            className={cn(
              'flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors',
              settings.quality === option.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            {option.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium">Print Quality</h3>
      <div className="space-y-2">
        {QUALITY_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              settings.quality === option.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="quality"
              checked={settings.quality === option.id}
              onChange={() => updateSettings({ quality: option.id })}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{option.name}</span>
                <span className="text-xs text-gray-500">({option.dpi})</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Speed:</span>
                  <QualityIndicator
                    level={option.speed === 'Fast' ? 3 : option.speed === 'Normal' ? 2 : 1}
                    color="green"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Ink:</span>
                  <QualityIndicator
                    level={option.inkUsage === 'Low' ? 1 : option.inkUsage === 'Normal' ? 2 : 3}
                    color={option.inkUsage === 'Low' ? 'green' : option.inkUsage === 'Normal' ? 'yellow' : 'red'}
                  />
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Quality indicator bars
 */
function QualityIndicator({
  level,
  color,
}: {
  level: 1 | 2 | 3;
  color: 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-3 rounded-sm',
            i <= level ? colorClasses[color] : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  );
}

export default PrintQualitySelector;
