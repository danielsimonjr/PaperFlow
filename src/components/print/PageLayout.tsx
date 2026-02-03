/**
 * Page Layout Component
 *
 * Provides page layout options including orientation, paper size,
 * and multi-page layouts (n-up).
 */

import { usePrintStore } from '@stores/printStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

/**
 * Paper sizes with display names and dimensions
 */
const PAPER_SIZES = [
  { id: 'Letter', name: 'Letter', dimensions: '8.5" x 11"' },
  { id: 'Legal', name: 'Legal', dimensions: '8.5" x 14"' },
  { id: 'Tabloid', name: 'Tabloid', dimensions: '11" x 17"' },
  { id: 'A3', name: 'A3', dimensions: '297mm x 420mm' },
  { id: 'A4', name: 'A4', dimensions: '210mm x 297mm' },
  { id: 'A5', name: 'A5', dimensions: '148mm x 210mm' },
  { id: 'B4', name: 'B4', dimensions: '250mm x 353mm' },
  { id: 'B5', name: 'B5', dimensions: '176mm x 250mm' },
];

/**
 * N-up layout options
 */
const NUP_OPTIONS = [
  { pages: 1, label: '1 page per sheet', cols: 1, rows: 1 },
  { pages: 2, label: '2 pages per sheet', cols: 2, rows: 1 },
  { pages: 4, label: '4 pages per sheet', cols: 2, rows: 2 },
  { pages: 6, label: '6 pages per sheet', cols: 3, rows: 2 },
  { pages: 9, label: '9 pages per sheet', cols: 3, rows: 3 },
  { pages: 16, label: '16 pages per sheet', cols: 4, rows: 4 },
];

interface PageLayoutProps {
  className?: string;
}

export function PageLayout({ className }: PageLayoutProps) {
  const { settings, updateSettings } = usePrintStore();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Orientation */}
      <div>
        <h3 className="text-sm font-medium mb-3">Orientation</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateSettings({ landscape: false })}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
              !settings.landscape
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="w-6 h-8 border-2 border-current rounded-sm mb-2" />
            <span className="text-xs">Portrait</span>
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ landscape: true })}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
              settings.landscape
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            )}
          >
            <div className="w-8 h-6 border-2 border-current rounded-sm mb-2" />
            <span className="text-xs">Landscape</span>
          </button>
        </div>
      </div>

      {/* Paper Size */}
      <div>
        <h3 className="text-sm font-medium mb-3">Paper Size</h3>
        <select
          value={settings.paperSize}
          onChange={(e) => updateSettings({ paperSize: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {PAPER_SIZES.map((size) => (
            <option key={size.id} value={size.id}>
              {size.name} ({size.dimensions})
            </option>
          ))}
        </select>
      </div>

      {/* Scale */}
      <div>
        <h3 className="text-sm font-medium mb-3">Scale</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="25"
            max="200"
            value={settings.scale}
            onChange={(e) => updateSettings({ scale: parseInt(e.target.value, 10) })}
            className="flex-1"
          />
          <input
            type="number"
            min="25"
            max="200"
            value={settings.scale}
            onChange={(e) => updateSettings({ scale: parseInt(e.target.value, 10) || 100 })}
            className="w-16 px-2 py-1 border rounded text-center bg-white dark:bg-gray-800 dark:border-gray-700"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ scale: 100 })}
          >
            100%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ scale: 'fit' as unknown as number })}
          >
            Fit to Page
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSettings({ scale: 'shrink' as unknown as number })}
          >
            Shrink to Fit
          </Button>
        </div>
      </div>

      {/* Pages per Sheet (N-up) */}
      <div>
        <h3 className="text-sm font-medium mb-3">Pages per Sheet</h3>
        <div className="grid grid-cols-3 gap-2">
          {NUP_OPTIONS.map((option) => (
            <button
              key={option.pages}
              type="button"
              onClick={() => {
                // N-up is handled by imposition, this is a UI placeholder
                // For now, we can adjust scale as a simple approximation
              }}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg border transition-colors',
                option.pages === 1
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div
                className="w-10 h-12 border border-gray-300 rounded-sm mb-1 p-0.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${option.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${option.rows}, 1fr)`,
                  gap: '1px',
                }}
              >
                {Array.from({ length: option.pages }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-600 rounded-[1px]"
                  />
                ))}
              </div>
              <span className="text-xs">{option.pages}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Page Order */}
      <div>
        <h3 className="text-sm font-medium mb-3">Page Order</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.collate}
              onChange={(e) => updateSettings({ collate: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Collate</span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            {settings.collate
              ? 'Print complete copies: 1,2,3 - 1,2,3 - 1,2,3'
              : 'Group pages: 1,1,1 - 2,2,2 - 3,3,3'}
          </p>
        </div>
      </div>

      {/* Print Background */}
      <div>
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
  );
}

export default PageLayout;
