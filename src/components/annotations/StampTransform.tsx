import { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface StampTransformProps {
  /** Current scale (1 = 100%) */
  scale: number;
  /** Current rotation in degrees */
  rotation: number;
  /** Callback when scale changes */
  onScaleChange: (scale: number) => void;
  /** Callback when rotation changes */
  onRotationChange: (rotation: number) => void;
  /** Callback when options panel should close */
  onClose?: () => void;
}

const SCALE_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' },
];

const ROTATION_OPTIONS = [
  { value: 0, label: '0°' },
  { value: 45, label: '45°' },
  { value: 90, label: '90°' },
  { value: 135, label: '135°' },
  { value: 180, label: '180°' },
  { value: 225, label: '225°' },
  { value: 270, label: '270°' },
  { value: 315, label: '315°' },
];

/**
 * Options for scaling and rotating placed stamps.
 */
export function StampTransform({
  scale,
  rotation,
  onScaleChange,
  onRotationChange,
}: StampTransformProps) {
  const [customRotation, setCustomRotation] = useState(rotation.toString());

  const handleScaleSelect = useCallback(
    (newScale: number) => {
      onScaleChange(newScale);
    },
    [onScaleChange]
  );

  const handleRotationSelect = useCallback(
    (newRotation: number) => {
      onRotationChange(newRotation);
      setCustomRotation(newRotation.toString());
    },
    [onRotationChange]
  );

  const handleCustomRotationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomRotation(value);

      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue < 360) {
        onRotationChange(numValue);
      }
    },
    [onRotationChange]
  );

  const handleRotateLeft = useCallback(() => {
    const newRotation = (rotation - 45 + 360) % 360;
    onRotationChange(newRotation);
    setCustomRotation(newRotation.toString());
  }, [rotation, onRotationChange]);

  const handleRotateRight = useCallback(() => {
    const newRotation = (rotation + 45) % 360;
    onRotationChange(newRotation);
    setCustomRotation(newRotation.toString());
  }, [rotation, onRotationChange]);

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Scale */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Scale
        </div>
        <div className="grid grid-cols-3 gap-1">
          {SCALE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                scale === value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleScaleSelect(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div>
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Rotation
        </div>

        {/* Quick rotation buttons */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <button
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={handleRotateLeft}
            title="Rotate 45° left"
          >
            <RotateCcw size={16} />
          </button>

          <input
            type="number"
            min="0"
            max="359"
            value={customRotation}
            onChange={handleCustomRotationChange}
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-xs text-gray-500">°</span>

          <button
            className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={handleRotateRight}
            title="Rotate 45° right"
            style={{ transform: 'scaleX(-1)' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Preset rotation angles */}
        <div className="grid grid-cols-4 gap-1">
          {ROTATION_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                rotation === value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleRotationSelect(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
