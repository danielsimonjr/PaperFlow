/**
 * Advanced Print Settings Panel
 *
 * Comprehensive print settings including duplex, collation,
 * stapling, color mode, and quality options.
 */

import { usePrintStore, type PrintQuality } from '@stores/printStore';
import { cn } from '@utils/cn';

interface AdvancedPrintSettingsProps {
  className?: string;
}

export function AdvancedPrintSettings({ className }: AdvancedPrintSettingsProps) {
  const { settings, updateSettings, selectedPrinter } = usePrintStore();

  // Check printer capabilities
  const supportsColor = selectedPrinter?.colorCapable ?? true;
  const supportsDuplex = selectedPrinter?.duplexCapable ?? true;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Copies */}
      <div>
        <h3 className="text-sm font-medium mb-3">Copies</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={999}
            value={settings.copies}
            onChange={(e) =>
              updateSettings({
                copies: Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)),
              })
            }
            className="w-20 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.collate}
              onChange={(e) => updateSettings({ collate: e.target.checked })}
              className="rounded"
              disabled={settings.copies <= 1}
            />
            <span className="text-sm">Collate</span>
          </label>
        </div>
        {settings.copies > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            {settings.collate
              ? 'Prints all pages of each copy before starting the next copy'
              : 'Prints multiple copies of each page before moving to the next page'}
          </p>
        )}
      </div>

      {/* Color Mode */}
      <div>
        <h3 className="text-sm font-medium mb-3">Color</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ color: true })}
            disabled={!supportsColor}
            className={cn(
              'flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
              settings.color && supportsColor
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
              !supportsColor && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 mb-2" />
            <span className="text-sm">Color</span>
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ color: false })}
            className={cn(
              'flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
              !settings.color
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-400 mb-2" />
            <span className="text-sm">Grayscale</span>
          </button>
        </div>
        {!supportsColor && (
          <p className="text-xs text-gray-500 mt-2">
            Selected printer does not support color printing
          </p>
        )}
      </div>

      {/* Duplex / Two-sided printing */}
      <div>
        <h3 className="text-sm font-medium mb-3">Two-sided printing</h3>
        <div className="space-y-2">
          <label
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              settings.duplex === 'simplex'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="duplex"
              checked={settings.duplex === 'simplex'}
              onChange={() => updateSettings({ duplex: 'simplex' })}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">One-sided</div>
              <div className="text-xs text-gray-500">Print on one side of the paper</div>
            </div>
            <div className="w-10 h-12 border rounded flex items-center justify-center">
              <div className="w-6 h-8 border border-gray-400 rounded-sm bg-gray-100">
                <div className="w-full h-1/3 bg-gray-300 rounded-t-sm" />
              </div>
            </div>
          </label>

          <label
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              settings.duplex === 'longEdge'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
              !supportsDuplex && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name="duplex"
              checked={settings.duplex === 'longEdge'}
              onChange={() => updateSettings({ duplex: 'longEdge' })}
              className="mt-1"
              disabled={!supportsDuplex}
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Two-sided, flip on long edge</div>
              <div className="text-xs text-gray-500">
                For standard documents, like reports or letters
              </div>
            </div>
            <div className="w-10 h-12 border rounded flex items-center justify-center">
              <div className="relative w-6 h-8 border border-gray-400 rounded-sm">
                <div className="absolute inset-0 bg-gray-100">
                  <div className="w-full h-1/3 bg-gray-300 rounded-t-sm" />
                </div>
                <div
                  className="absolute inset-0 bg-gray-200 opacity-70"
                  style={{ transform: 'translate(4px, 4px)' }}
                >
                  <div className="w-full h-1/3 bg-gray-400 rounded-t-sm" />
                </div>
              </div>
            </div>
          </label>

          <label
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              settings.duplex === 'shortEdge'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
              !supportsDuplex && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="radio"
              name="duplex"
              checked={settings.duplex === 'shortEdge'}
              onChange={() => updateSettings({ duplex: 'shortEdge' })}
              className="mt-1"
              disabled={!supportsDuplex}
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Two-sided, flip on short edge</div>
              <div className="text-xs text-gray-500">
                For booklets or calendars that flip up
              </div>
            </div>
            <div className="w-10 h-12 border rounded flex items-center justify-center">
              <div className="relative w-6 h-8 border border-gray-400 rounded-sm">
                <div className="absolute inset-0 bg-gray-100">
                  <div className="w-full h-1/3 bg-gray-300 rounded-t-sm" />
                </div>
                <div
                  className="absolute inset-0 bg-gray-200 opacity-70"
                  style={{ transform: 'translate(0, 4px) scaleY(-1)' }}
                >
                  <div className="w-full h-1/3 bg-gray-400 rounded-t-sm" />
                </div>
              </div>
            </div>
          </label>
        </div>
        {!supportsDuplex && (
          <p className="text-xs text-gray-500 mt-2">
            Selected printer does not support two-sided printing
          </p>
        )}
      </div>

      {/* Quality */}
      <div>
        <h3 className="text-sm font-medium mb-3">Print Quality</h3>
        <div className="flex gap-2">
          {(['draft', 'normal', 'high'] as PrintQuality[]).map((quality) => (
            <button
              key={quality}
              type="button"
              onClick={() => updateSettings({ quality })}
              className={cn(
                'flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors capitalize',
                settings.quality === quality
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              {quality}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {settings.quality === 'draft'
            ? 'Fast printing, lower quality. Good for drafts and internal documents.'
            : settings.quality === 'normal'
              ? 'Balanced quality and speed. Recommended for most documents.'
              : 'Best quality, slower printing. Recommended for photos and final documents.'}
        </p>
      </div>

      {/* Additional options */}
      <div>
        <h3 className="text-sm font-medium mb-3">Additional Options</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.printBackground}
              onChange={(e) => updateSettings({ printBackground: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Print background colors and images</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default AdvancedPrintSettings;
