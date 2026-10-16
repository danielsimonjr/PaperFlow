/**
 * Page orientation choices: auto, portrait or landscape.
 */
export type Orientation = 'auto' | 'portrait' | 'landscape';

interface OrientationOptionsProps {
  orientation: Orientation;
  onOrientationChange: (orientation: Orientation) => void;
}

/**
 * Buttons set the page orientation: Auto, Portrait or Landscape. The component highlights the button for the current
 * orientation.
 */
export function OrientationOptions({ orientation, onOrientationChange }: OrientationOptionsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">Orientation</label>

      <div className="flex gap-2">
        <button
          onClick={() => onOrientationChange('auto')}
          className={`rounded-lg px-3 py-1.5 text-sm ${orientation === 'auto' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
        >
          Auto
        </button>
        <button
          onClick={() => onOrientationChange('portrait')}
          className={`rounded-lg px-3 py-1.5 text-sm ${orientation === 'portrait' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
        >
          Portrait
        </button>
        <button
          onClick={() => onOrientationChange('landscape')}
          className={`rounded-lg px-3 py-1.5 text-sm ${orientation === 'landscape' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
        >
          Landscape
        </button>
      </div>
    </div>
  );
}
