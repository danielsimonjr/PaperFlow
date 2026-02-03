/**
 * Accessibility Options Component
 *
 * UI for configuring print accessibility features including
 * large print, high contrast, and text-only output.
 */

import { useState } from 'react';
import {
  PrintAccessibility,
  ACCESSIBILITY_PRESETS,
  LARGE_PRINT_SIZES,
  type PrintAccessibilityOptions,
  DEFAULT_ACCESSIBILITY_OPTIONS,
} from '@lib/print/accessibility';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface AccessibilityOptionsProps {
  value: PrintAccessibilityOptions;
  onChange: (options: PrintAccessibilityOptions) => void;
  className?: string;
}

export function AccessibilityOptions({
  value,
  onChange,
  className,
}: AccessibilityOptionsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Update handler
  const updateOption = <K extends keyof PrintAccessibilityOptions>(
    key: K,
    optionValue: PrintAccessibilityOptions[K]
  ) => {
    onChange({ ...value, [key]: optionValue });
    setActivePreset(null); // Clear preset when manually changing
  };

  // Apply preset
  const applyPreset = (presetKey: keyof typeof ACCESSIBILITY_PRESETS) => {
    const preset = PrintAccessibility.getPreset(presetKey);
    onChange(preset);
    setActivePreset(presetKey);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    onChange(DEFAULT_ACCESSIBILITY_OPTIONS);
    setActivePreset(null);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Accessibility Options</h3>
          <p className="text-xs text-gray-500 mt-1">
            Make printed documents easier to read
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetToDefaults}>
          Reset
        </Button>
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ACCESSIBILITY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key as keyof typeof ACCESSIBILITY_PRESETS)}
              className={cn(
                'text-left p-3 rounded-lg border transition-colors',
                activePreset === key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-sm">{preset.name}</div>
              <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Large Print */}
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.largePrint}
            onChange={(e) => updateOption('largePrint', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium text-sm">Large Print Mode</span>
            <p className="text-xs text-gray-500">Increase text size for easier reading</p>
          </div>
        </label>

        {value.largePrint && (
          <div className="ml-6 space-y-2">
            <label className="text-xs text-gray-500 block">Font Size</label>
            <div className="flex gap-2">
              {Object.entries(LARGE_PRINT_SIZES).map(([name, size]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => updateOption('fontSize', size)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded border transition-colors capitalize',
                    value.fontSize === size
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  {name} ({size}pt)
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={12}
                max={48}
                value={value.fontSize || 18}
                onChange={(e) => updateOption('fontSize', parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="text-sm w-12 text-right">{value.fontSize || 18}pt</span>
            </div>
          </div>
        )}
      </div>

      {/* High Contrast */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.highContrast}
            onChange={(e) => updateOption('highContrast', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium text-sm">High Contrast</span>
            <p className="text-xs text-gray-500">
              Black text on white background only
            </p>
          </div>
        </label>
      </div>

      {/* Text Only */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.textOnly}
            onChange={(e) => updateOption('textOnly', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium text-sm">Text Only</span>
            <p className="text-xs text-gray-500">
              Remove all images and graphics
            </p>
          </div>
        </label>
      </div>

      {/* Line Spacing */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">
          Line Spacing
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={value.lineSpacing || 1.5}
            onChange={(e) =>
              updateOption('lineSpacing', parseFloat(e.target.value))
            }
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">
            {(value.lineSpacing || 1.5).toFixed(1)}x
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Single</span>
          <span>Double</span>
          <span>Triple</span>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">
          Letter Spacing
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={value.letterSpacing || 0}
            onChange={(e) =>
              updateOption('letterSpacing', parseFloat(e.target.value))
            }
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">
            {value.letterSpacing || 0}pt
          </span>
        </div>
      </div>

      {/* Dyslexia Font */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.dyslexiaFont}
            onChange={(e) => updateOption('dyslexiaFont', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium text-sm">Dyslexia-Friendly Font</span>
            <p className="text-xs text-gray-500">
              Use OpenDyslexic or similar fonts
            </p>
          </div>
        </label>
      </div>

      {/* Simplified Layout */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.simplifiedLayout}
            onChange={(e) => updateOption('simplifiedLayout', e.target.checked)}
            className="rounded"
          />
          <div>
            <span className="font-medium text-sm">Simplified Layout</span>
            <p className="text-xs text-gray-500">
              Remove complex formatting and decorations
            </p>
          </div>
        </label>
      </div>

      {/* Preview hint */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-500">
          These settings will be applied when printing. Use Print Preview to see how
          your document will look with these accessibility options enabled.
        </p>
      </div>
    </div>
  );
}

export default AccessibilityOptions;
