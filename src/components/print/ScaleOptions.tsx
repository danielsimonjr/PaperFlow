export type ScaleType = 'fit' | 'actual' | 'custom';

interface ScaleOptionsProps {
  scaleType: ScaleType;
  customScale: number;
  onScaleTypeChange: (type: ScaleType) => void;
  onCustomScaleChange: (scale: number) => void;
}

export function ScaleOptions({
  scaleType,
  customScale,
  onScaleTypeChange,
  onCustomScaleChange,
}: ScaleOptionsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">Scale</label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scale"
            checked={scaleType === 'fit'}
            onChange={() => onScaleTypeChange('fit')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">Fit to page</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scale"
            checked={scaleType === 'actual'}
            onChange={() => onScaleTypeChange('actual')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">Actual size (100%)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scale"
            checked={scaleType === 'custom'}
            onChange={() => onScaleTypeChange('custom')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">Custom</span>
        </label>

        {scaleType === 'custom' && (
          <div className="ml-6 flex items-center gap-2">
            <input
              type="number"
              min={25}
              max={400}
              value={customScale}
              onChange={(e) => onCustomScaleChange(Math.max(25, Math.min(400, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        )}
      </div>
    </div>
  );
}
