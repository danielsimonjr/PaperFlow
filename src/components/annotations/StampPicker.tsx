import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { PRESET_STAMPS, type PresetStamp } from '@/constants/stamps';

interface CustomStamp {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
}

interface StampPickerProps {
  /** Currently selected stamp */
  selectedStamp: string | null;
  /** Callback when stamp is selected */
  onSelect: (stampId: string, customText?: string, customColor?: string) => void;
  /** Callback to open custom stamp dialog */
  onCreateCustom?: () => void;
  /** Custom stamps from storage */
  customStamps?: CustomStamp[];
  /** Callback when options panel should close */
  onClose?: () => void;
}

/**
 * Stamp picker showing preset and custom stamps.
 */
export function StampPicker({
  selectedStamp,
  onSelect,
  onCreateCustom,
  customStamps = [],
  onClose,
}: StampPickerProps) {
  const [hoveredStamp, setHoveredStamp] = useState<string | null>(null);

  const handleSelect = useCallback(
    (stamp: PresetStamp | CustomStamp) => {
      if ('borderColor' in stamp) {
        // Preset stamp
        onSelect(stamp.id);
      } else {
        // Custom stamp
        onSelect('custom', stamp.text, stamp.color);
      }
      onClose?.();
    },
    [onSelect, onClose]
  );

  const renderStampPreview = useCallback(
    (stamp: PresetStamp | CustomStamp) => {
      const isSelected = selectedStamp === stamp.id;
      const isHovered = hoveredStamp === stamp.id;

      return (
        <button
          key={stamp.id}
          className={`relative flex w-full items-center justify-center rounded-md border-2 px-3 py-2 transition-all ${
            isSelected
              ? 'border-primary-500 ring-2 ring-primary-500/20'
              : isHovered
                ? 'border-gray-300 dark:border-gray-600'
                : 'border-gray-200 dark:border-gray-700'
          }`}
          style={{
            backgroundColor: stamp.backgroundColor,
          }}
          onClick={() => handleSelect(stamp)}
          onMouseEnter={() => setHoveredStamp(stamp.id)}
          onMouseLeave={() => setHoveredStamp(null)}
        >
          <span
            className="text-xs font-bold"
            style={{ color: stamp.color }}
          >
            {stamp.text}
          </span>
        </button>
      );
    },
    [selectedStamp, hoveredStamp, handleSelect]
  );

  return (
    <div className="w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {/* Preset Stamps */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          Preset Stamps
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_STAMPS.map((stamp) => renderStampPreview(stamp))}
        </div>
      </div>

      {/* Custom Stamps */}
      {customStamps.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Custom Stamps
          </div>
          <div className="grid grid-cols-2 gap-2">
            {customStamps.map((stamp) => renderStampPreview(stamp))}
          </div>
        </div>
      )}

      {/* Create Custom Button */}
      {onCreateCustom && (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-gray-600 dark:text-gray-400"
          onClick={() => {
            onCreateCustom();
            onClose?.();
          }}
        >
          <Plus size={16} />
          Create Custom Stamp
        </button>
      )}
    </div>
  );
}
