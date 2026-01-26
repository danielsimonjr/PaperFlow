import { useCallback } from 'react';

interface OpacitySliderProps {
  /** Current opacity value (0-1) */
  value: number;
  /** Called when opacity changes */
  onChange: (opacity: number) => void;
  /** Minimum opacity (default: 0.3) */
  min?: number;
  /** Maximum opacity (default: 1) */
  max?: number;
}

/**
 * Slider component for adjusting annotation opacity.
 */
export function OpacitySlider({
  value,
  onChange,
  min = 0.3,
  max = 1,
}: OpacitySliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const percentage = Math.round(value * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">Opacity</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={handleChange}
        className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-500 dark:bg-gray-700"
      />
      <span className="min-w-[3ch] text-xs text-gray-600 dark:text-gray-300">
        {percentage}%
      </span>
    </div>
  );
}
