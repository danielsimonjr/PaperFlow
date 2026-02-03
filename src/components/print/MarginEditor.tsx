/**
 * Margin Editor Component
 *
 * Allows editing of print margins with visual feedback
 * and preset margin options.
 */

import { useState, useMemo, useCallback } from 'react';
import { usePrintStore, type PrintMargins } from '@stores/printStore';
import { cn } from '@utils/cn';

/**
 * Margin presets
 */
const MARGIN_PRESETS = [
  { id: 'normal', name: 'Normal', margins: { top: 72, bottom: 72, left: 72, right: 72 } },
  { id: 'narrow', name: 'Narrow', margins: { top: 36, bottom: 36, left: 36, right: 36 } },
  { id: 'wide', name: 'Wide', margins: { top: 72, bottom: 72, left: 144, right: 144 } },
  { id: 'none', name: 'None', margins: { top: 0, bottom: 0, left: 0, right: 0 } },
  { id: 'custom', name: 'Custom', margins: null },
];

/**
 * Unit options
 */
type MarginUnit = 'in' | 'mm' | 'pt';

/**
 * Convert between units
 */
const convertToPoints = (value: number, unit: MarginUnit): number => {
  switch (unit) {
    case 'in':
      return value * 72;
    case 'mm':
      return value * 2.83465;
    case 'pt':
    default:
      return value;
  }
};

const convertFromPoints = (points: number, unit: MarginUnit): number => {
  switch (unit) {
    case 'in':
      return points / 72;
    case 'mm':
      return points / 2.83465;
    case 'pt':
    default:
      return points;
  }
};

interface MarginEditorProps {
  className?: string;
}

export function MarginEditor({ className }: MarginEditorProps) {
  const { settings, updateSettings } = usePrintStore();
  const [unit, setUnit] = useState<MarginUnit>('in');
  const [linkMargins, setLinkMargins] = useState(false);

  // Get current preset
  const currentPreset = useMemo(() => {
    const preset = MARGIN_PRESETS.find((p) => {
      if (!p.margins) return false;
      return (
        p.margins.top === settings.margins.top &&
        p.margins.bottom === settings.margins.bottom &&
        p.margins.left === settings.margins.left &&
        p.margins.right === settings.margins.right
      );
    });
    return preset?.id || 'custom';
  }, [settings.margins]);

  // Convert margins for display
  const displayMargins = useMemo(() => {
    return {
      top: convertFromPoints(settings.margins.top, unit),
      bottom: convertFromPoints(settings.margins.bottom, unit),
      left: convertFromPoints(settings.margins.left, unit),
      right: convertFromPoints(settings.margins.right, unit),
    };
  }, [settings.margins, unit]);

  // Handle margin change
  const handleMarginChange = useCallback(
    (side: keyof PrintMargins, value: number) => {
      const pointValue = convertToPoints(value, unit);
      const newMargins = { ...settings.margins };

      if (linkMargins) {
        // Apply to all sides
        newMargins.top = pointValue;
        newMargins.bottom = pointValue;
        newMargins.left = pointValue;
        newMargins.right = pointValue;
      } else {
        newMargins[side] = pointValue;
      }

      updateSettings({ margins: newMargins });
    },
    [settings.margins, unit, linkMargins, updateSettings]
  );

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = MARGIN_PRESETS.find((p) => p.id === presetId);
    if (preset?.margins) {
      updateSettings({ margins: preset.margins });
    }
  };

  // Format value for display
  const formatValue = (value: number): string => {
    switch (unit) {
      case 'in':
        return value.toFixed(2);
      case 'mm':
        return value.toFixed(1);
      case 'pt':
      default:
        return Math.round(value).toString();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Unit selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Margins</h3>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as MarginUnit)}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="in">inches</option>
          <option value="mm">mm</option>
          <option value="pt">points</option>
        </select>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {MARGIN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => preset.margins && applyPreset(preset.id)}
            disabled={!preset.margins}
            className={cn(
              'px-3 py-1 text-sm rounded border transition-colors',
              currentPreset === preset.id
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800',
              !preset.margins && 'opacity-50 cursor-default'
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Visual editor */}
      <div className="relative p-4">
        {/* Paper representation */}
        <div className="relative mx-auto w-48 h-64 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded">
          {/* Content area */}
          <div
            className="absolute bg-gray-100 dark:bg-gray-700 rounded-sm"
            style={{
              top: `${(displayMargins.top / 792) * 100}%`,
              bottom: `${(displayMargins.bottom / 792) * 100}%`,
              left: `${(displayMargins.left / 612) * 100}%`,
              right: `${(displayMargins.right / 612) * 100}%`,
            }}
          />

          {/* Margin indicators */}
          <div
            className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500"
            style={{ top: '4px' }}
          >
            {formatValue(displayMargins.top)}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-500"
            style={{ bottom: '4px' }}
          >
            {formatValue(displayMargins.bottom)}
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-500"
            style={{ left: '4px' }}
          >
            {formatValue(displayMargins.left)}
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-500"
            style={{ right: '4px' }}
          >
            {formatValue(displayMargins.right)}
          </div>
        </div>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Top</label>
          <input
            type="number"
            step={unit === 'in' ? 0.1 : unit === 'mm' ? 1 : 10}
            min={0}
            value={formatValue(displayMargins.top)}
            onChange={(e) => handleMarginChange('top', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bottom</label>
          <input
            type="number"
            step={unit === 'in' ? 0.1 : unit === 'mm' ? 1 : 10}
            min={0}
            value={formatValue(displayMargins.bottom)}
            onChange={(e) => handleMarginChange('bottom', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Left</label>
          <input
            type="number"
            step={unit === 'in' ? 0.1 : unit === 'mm' ? 1 : 10}
            min={0}
            value={formatValue(displayMargins.left)}
            onChange={(e) => handleMarginChange('left', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Right</label>
          <input
            type="number"
            step={unit === 'in' ? 0.1 : unit === 'mm' ? 1 : 10}
            min={0}
            value={formatValue(displayMargins.right)}
            onChange={(e) => handleMarginChange('right', parseFloat(e.target.value) || 0)}
            className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Link margins toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={linkMargins}
          onChange={(e) => setLinkMargins(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">Link all margins</span>
      </label>
    </div>
  );
}

export default MarginEditor;
