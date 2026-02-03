/**
 * Scan Settings Panel
 *
 * Comprehensive scan settings with resolution, color mode,
 * paper size, duplex, and quality options.
 */

import { useScannerStore } from '@stores/scannerStore';
import { cn } from '@utils/cn';
import type { ScanColorMode, ScanResolution, ScanPaperSize } from '@lib/scanner/types';

interface ScanSettingsPanelProps {
  className?: string;
}

export function ScanSettingsPanel({ className }: ScanSettingsPanelProps) {
  const { settings, updateSettings, selectedDevice, profiles, applyProfile } =
    useScannerStore();

  const capabilities = selectedDevice?.capabilities;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile selection */}
      <div>
        <label className="text-sm font-medium block mb-2">Scan Profile</label>
        <select
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
          onChange={(e) => {
            if (e.target.value) {
              applyProfile(e.target.value);
            }
          }}
          defaultValue=""
        >
          <option value="">Select a profile...</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>

      {/* Resolution */}
      <div>
        <label className="text-sm font-medium block mb-2">Resolution (DPI)</label>
        <div className="grid grid-cols-3 gap-2">
          {([75, 150, 300, 600] as ScanResolution[]).map((dpi) => {
            const available = capabilities?.resolutions.includes(dpi) ?? true;
            return (
              <button
                key={dpi}
                type="button"
                onClick={() => updateSettings({ resolution: dpi })}
                disabled={!available}
                className={cn(
                  'py-2 px-3 text-sm rounded border transition-colors',
                  settings.resolution === dpi
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : available
                      ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                )}
              >
                {dpi} DPI
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {settings.resolution <= 150
            ? 'Draft quality - fast scanning'
            : settings.resolution <= 300
              ? 'Standard quality - good for documents'
              : 'High quality - best for photos and detailed images'}
        </p>
      </div>

      {/* Color mode */}
      <div>
        <label className="text-sm font-medium block mb-2">Color Mode</label>
        <div className="flex gap-2">
          {(['color', 'grayscale', 'blackwhite'] as ScanColorMode[]).map((mode) => {
            const available = capabilities?.colorModes.includes(mode) ?? true;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => updateSettings({ colorMode: mode })}
                disabled={!available}
                className={cn(
                  'flex-1 flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-colors',
                  settings.colorMode === mode
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : available
                      ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded mb-2',
                    mode === 'color' && 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500',
                    mode === 'grayscale' && 'bg-gradient-to-b from-gray-800 to-gray-400',
                    mode === 'blackwhite' && 'bg-black border border-gray-300'
                  )}
                />
                <span className="text-xs capitalize">
                  {mode === 'blackwhite' ? 'B&W' : mode}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paper size */}
      <div>
        <label className="text-sm font-medium block mb-2">Paper Size</label>
        <select
          value={settings.paperSize}
          onChange={(e) => updateSettings({ paperSize: e.target.value as ScanPaperSize })}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="auto">Auto Detect</option>
          <option value="letter">Letter (8.5" x 11")</option>
          <option value="legal">Legal (8.5" x 14")</option>
          <option value="a4">A4 (210mm x 297mm)</option>
          <option value="a5">A5 (148mm x 210mm)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Scan source */}
      {capabilities && (capabilities.hasFlatbed || capabilities.hasADF) && (
        <div>
          <label className="text-sm font-medium block mb-2">Scan Source</label>
          <div className="flex gap-2">
            {capabilities.hasFlatbed && (
              <button
                type="button"
                onClick={() => updateSettings({ useADF: false })}
                className={cn(
                  'flex-1 py-2 px-3 text-sm rounded border-2 transition-colors',
                  !settings.useADF
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                Flatbed
              </button>
            )}
            {capabilities.hasADF && (
              <button
                type="button"
                onClick={() => updateSettings({ useADF: true })}
                className={cn(
                  'flex-1 py-2 px-3 text-sm rounded border-2 transition-colors',
                  settings.useADF
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
              >
                Document Feeder
              </button>
            )}
          </div>
        </div>
      )}

      {/* Duplex */}
      {capabilities?.duplex && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.duplex}
              onChange={(e) => updateSettings({ duplex: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Scan both sides (duplex)</span>
          </label>
        </div>
      )}

      {/* Adjustments */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Adjustments</h3>

        {/* Brightness */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-gray-600 dark:text-gray-400">Brightness</label>
            <span>{settings.brightness}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={settings.brightness}
            onChange={(e) =>
              updateSettings({ brightness: parseInt(e.target.value, 10) })
            }
            className="w-full"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <label className="text-gray-600 dark:text-gray-400">Contrast</label>
            <span>{settings.contrast}</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={settings.contrast}
            onChange={(e) =>
              updateSettings({ contrast: parseInt(e.target.value, 10) })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Auto options */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Auto Enhancement</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoDetect}
            onChange={(e) => updateSettings({ autoDetect: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Auto-detect document edges</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoCorrect}
            onChange={(e) => updateSettings({ autoCorrect: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Auto-correct perspective</span>
        </label>
      </div>
    </div>
  );
}

export default ScanSettingsPanel;
