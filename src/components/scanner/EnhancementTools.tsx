/**
 * Enhancement Tools Component
 *
 * Image enhancement controls for scanned documents including
 * brightness, contrast, sharpness, and filters.
 */

import { useState, useCallback } from 'react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

export interface EnhancementSettings {
  brightness: number;
  contrast: number;
  sharpness: number;
  saturation: number;
  autoEnhance: boolean;
  filter: 'none' | 'document' | 'photo' | 'grayscale' | 'blackwhite';
}

interface EnhancementToolsProps {
  settings: EnhancementSettings;
  onChange: (settings: EnhancementSettings) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
}

const DEFAULT_SETTINGS: EnhancementSettings = {
  brightness: 0,
  contrast: 0,
  sharpness: 0,
  saturation: 0,
  autoEnhance: false,
  filter: 'none',
};

const FILTERS = [
  { value: 'none' as const, label: 'None', description: 'Original image' },
  { value: 'document' as const, label: 'Document', description: 'Optimize for text' },
  { value: 'photo' as const, label: 'Photo', description: 'Enhance colors' },
  { value: 'grayscale' as const, label: 'Grayscale', description: 'Black and white' },
  { value: 'blackwhite' as const, label: 'High Contrast', description: 'B&W threshold' },
];

export function EnhancementTools({
  settings,
  onChange,
  onApply,
  onReset,
  className,
}: EnhancementToolsProps) {
  const [activeTab, setActiveTab] = useState<'adjust' | 'filter'>('adjust');

  const updateSetting = useCallback(
    <K extends keyof EnhancementSettings>(key: K, value: EnhancementSettings[K]) => {
      onChange({ ...settings, [key]: value });
    },
    [settings, onChange]
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_SETTINGS);
    onReset?.();
  }, [onChange, onReset]);

  const SliderControl = ({
    label,
    value,
    onChange,
    min = -100,
    max = 100,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="text-gray-600 dark:text-gray-400">{label}</label>
        <span className="text-gray-500 font-mono text-xs">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tab buttons */}
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('adjust')}
          className={cn(
            'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'adjust'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Adjust
        </button>
        <button
          onClick={() => setActiveTab('filter')}
          className={cn(
            'flex-1 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'filter'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Filters
        </button>
      </div>

      {/* Adjust tab */}
      {activeTab === 'adjust' && (
        <div className="space-y-4">
          {/* Auto enhance toggle */}
          <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoEnhance}
              onChange={(e) => updateSetting('autoEnhance', e.target.checked)}
              className="rounded"
            />
            <div>
              <span className="font-medium text-sm">Auto Enhance</span>
              <p className="text-xs text-gray-500">Automatically optimize image quality</p>
            </div>
          </label>

          {/* Manual adjustments */}
          <div className="space-y-4">
            <SliderControl
              label="Brightness"
              value={settings.brightness}
              onChange={(v) => updateSetting('brightness', v)}
            />
            <SliderControl
              label="Contrast"
              value={settings.contrast}
              onChange={(v) => updateSetting('contrast', v)}
            />
            <SliderControl
              label="Sharpness"
              value={settings.sharpness}
              onChange={(v) => updateSetting('sharpness', v)}
              min={0}
            />
            <SliderControl
              label="Saturation"
              value={settings.saturation}
              onChange={(v) => updateSetting('saturation', v)}
            />
          </div>
        </div>
      )}

      {/* Filter tab */}
      {activeTab === 'filter' && (
        <div className="grid grid-cols-2 gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => updateSetting('filter', filter.value)}
              className={cn(
                'p-3 rounded-lg border-2 text-left transition-all',
                settings.filter === filter.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-sm">{filter.label}</div>
              <div className="text-xs text-gray-500">{filter.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
        <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1">
          Reset
        </Button>
        {onApply && (
          <Button variant="primary" size="sm" onClick={onApply} className="flex-1">
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}

export default EnhancementTools;
