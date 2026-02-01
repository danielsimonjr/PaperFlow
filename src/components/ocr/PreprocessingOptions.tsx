/**
 * Preprocessing Options Component
 * Configuration for image preprocessing before OCR.
 */

import { useOCRStore } from '@/stores/ocrStore';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';

export function PreprocessingOptions() {
  const { preprocessingOptions, setPreprocessingOptions } = useOCRStore();

  const handleChange = (key: string, value: boolean | number) => {
    setPreprocessingOptions({
      ...preprocessingOptions,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Image Preprocessing</label>
        <span className="text-xs text-gray-500">Improves recognition accuracy</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Grayscale */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={preprocessingOptions.grayscale ?? true}
            onCheckedChange={(checked) => handleChange('grayscale', checked === true)}
          />
          <span className="text-sm">Grayscale</span>
        </label>

        {/* Denoise */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={preprocessingOptions.denoise ?? false}
            onCheckedChange={(checked) => handleChange('denoise', checked === true)}
          />
          <span className="text-sm">Reduce noise</span>
        </label>

        {/* Binarize */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={preprocessingOptions.binarize ?? false}
            onCheckedChange={(checked) => handleChange('binarize', checked === true)}
          />
          <span className="text-sm">Binarize (B&W)</span>
        </label>

        {/* Adaptive threshold */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={preprocessingOptions.adaptiveThreshold ?? false}
            onCheckedChange={(checked) => handleChange('adaptiveThreshold', checked === true)}
            disabled={preprocessingOptions.binarize}
          />
          <span className={cn('text-sm', preprocessingOptions.binarize && 'text-gray-400')}>
            Adaptive threshold
          </span>
        </label>

        {/* Invert */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={preprocessingOptions.invert ?? false}
            onCheckedChange={(checked) => handleChange('invert', checked === true)}
          />
          <span className="text-sm">Invert colors</span>
        </label>
      </div>

      {/* Scale selection */}
      <div className="space-y-2">
        <label className="text-sm" htmlFor="scale-select">
          Image scale (higher = more accurate, slower)
        </label>
        <Select
          id="scale-select"
          value={String(preprocessingOptions.scale ?? 2.0)}
          onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
          className="w-full"
        >
          <option value="1.0">1x (fastest)</option>
          <option value="1.5">1.5x</option>
          <option value="2.0">2x (recommended)</option>
          <option value="3.0">3x (highest quality)</option>
        </Select>
      </div>

      {/* Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use <strong>Grayscale</strong> for most documents</p>
        <p>• Enable <strong>Reduce noise</strong> for scanned documents</p>
        <p>• Use <strong>Invert colors</strong> for white text on dark background</p>
      </div>
    </div>
  );
}
