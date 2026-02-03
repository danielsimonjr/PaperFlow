/**
 * Scanner Info Component
 *
 * Displays detailed scanner device information and capabilities.
 */

import type { ScannerDevice } from '@lib/scanner/types';
import { cn } from '@utils/cn';

interface ScannerInfoProps {
  device: ScannerDevice;
  className?: string;
  compact?: boolean;
}

export function ScannerInfo({ device, className, compact = false }: ScannerInfoProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            device.available ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
        <span className="text-sm truncate">{device.name}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* Basic info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{device.name}</span>
            {device.available ? (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                Online
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 rounded">
                Offline
              </span>
            )}
          </div>
          {device.manufacturer && (
            <p className="text-sm text-gray-500">
              {device.manufacturer}
              {device.model && ` ${device.model}`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Driver: {device.platform.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Capabilities</h4>

        {/* Scan sources */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className={cn(
              'p-3 rounded-lg border',
              device.capabilities.hasFlatbed
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
              </svg>
              <span className="text-sm">Flatbed</span>
            </div>
          </div>
          <div
            className={cn(
              'p-3 rounded-lg border',
              device.capabilities.hasADF
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="text-sm">Document Feeder</span>
            </div>
          </div>
        </div>

        {/* Duplex */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-4 h-4 rounded border flex items-center justify-center',
              device.capabilities.duplex
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {device.capabilities.duplex && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className="text-sm">Duplex scanning (both sides)</span>
        </div>

        {/* Resolution */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Supported resolutions
          </label>
          <div className="flex flex-wrap gap-1">
            {device.capabilities.resolutions.map((dpi) => (
              <span
                key={dpi}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded"
              >
                {dpi} DPI
              </span>
            ))}
          </div>
        </div>

        {/* Color modes */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Color modes</label>
          <div className="flex flex-wrap gap-1">
            {device.capabilities.colorModes.map((mode) => (
              <span
                key={mode}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded capitalize"
              >
                {mode === 'blackwhite' ? 'Black & White' : mode}
              </span>
            ))}
          </div>
        </div>

        {/* Paper sizes */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Paper sizes</label>
          <div className="flex flex-wrap gap-1">
            {device.capabilities.paperSizes.map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded uppercase"
              >
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Max size */}
        <div className="text-sm text-gray-500">
          Max scan area: {device.capabilities.maxWidth}" x {device.capabilities.maxHeight}"
        </div>
      </div>
    </div>
  );
}

export default ScannerInfo;
