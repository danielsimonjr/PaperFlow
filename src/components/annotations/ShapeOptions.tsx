import { useCallback } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { HIGHLIGHT_COLORS } from './SelectionPopup';

const STROKE_WIDTHS = [
  { value: 1, label: 'Thin' },
  { value: 2, label: 'Normal' },
  { value: 4, label: 'Thick' },
  { value: 8, label: 'Extra Thick' },
];

interface ShapeOptionsProps {
  /** Callback when options panel should close */
  onClose?: () => void;
}

/**
 * Options panel for shape tools: stroke color, fill color, stroke width.
 */
export function ShapeOptions({ onClose }: ShapeOptionsProps) {
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeFillColor = useAnnotationStore((state) => state.activeFillColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const setActiveColor = useAnnotationStore((state) => state.setActiveColor);
  const setActiveFillColor = useAnnotationStore((state) => state.setActiveFillColor);
  const setActiveStrokeWidth = useAnnotationStore((state) => state.setActiveStrokeWidth);

  const handleStrokeColorSelect = useCallback(
    (color: string) => {
      setActiveColor(color);
    },
    [setActiveColor]
  );

  const handleFillColorSelect = useCallback(
    (color: string | undefined) => {
      setActiveFillColor(color);
    },
    [setActiveFillColor]
  );

  const handleStrokeWidthSelect = useCallback(
    (width: number) => {
      setActiveStrokeWidth(width);
      onClose?.();
    },
    [setActiveStrokeWidth, onClose]
  );

  return (
    <div className="w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Stroke Color */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Stroke Color
        </div>
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                activeColor === color.value
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                  : ''
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleStrokeColorSelect(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Fill Color */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Fill Color
        </div>
        <div className="flex flex-wrap gap-2">
          {/* No fill option */}
          <button
            className={`relative h-6 w-6 rounded-full border-2 border-gray-300 transition-transform hover:scale-110 dark:border-gray-600 ${
              activeFillColor === undefined
                ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                : ''
            }`}
            onClick={() => handleFillColorSelect(undefined)}
            title="No Fill"
          >
            {/* Diagonal line to indicate "none" */}
            <svg className="absolute inset-0" viewBox="0 0 24 24">
              <line
                x1="4"
                y1="20"
                x2="20"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400"
              />
            </svg>
          </button>
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                activeFillColor === color.value
                  ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                  : ''
              }`}
              style={{ backgroundColor: color.value, opacity: 0.5 }}
              onClick={() => handleFillColorSelect(color.value)}
              title={`${color.name} Fill`}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Stroke Width
        </div>
        <div className="space-y-1">
          {STROKE_WIDTHS.map(({ value, label }) => (
            <button
              key={value}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors ${
                activeStrokeWidth === value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleStrokeWidthSelect(value)}
            >
              {/* Visual preview of stroke width */}
              <div
                className="rounded-full"
                style={{
                  width: '24px',
                  height: `${value}px`,
                  backgroundColor: activeColor,
                }}
              />
              <span className="text-sm">{label}</span>
              <span className="ml-auto text-xs text-gray-400">{value}px</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
