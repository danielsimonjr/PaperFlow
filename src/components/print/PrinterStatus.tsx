/**
 * Printer Status Component
 *
 * Displays real-time printer status including paper, ink,
 * and connection status.
 */

import { useMemo } from 'react';
import { usePrintStore, type PrinterInfo } from '@stores/printStore';
import { cn } from '@utils/cn';

interface PrinterStatusProps {
  printer?: PrinterInfo;
  className?: string;
  compact?: boolean;
}

export function PrinterStatus({
  printer: propPrinter,
  className,
  compact = false,
}: PrinterStatusProps) {
  const { selectedPrinter } = usePrintStore();
  const printer = propPrinter || selectedPrinter;

  const statusInfo = useMemo(() => {
    if (!printer) return null;

    const statusColors: Record<string, { bg: string; text: string; label: string }> = {
      idle: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Ready' },
      printing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Printing' },
      paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Paused' },
      error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Error' },
      offline: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', label: 'Offline' },
      unknown: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', label: 'Unknown' },
    };

    return statusColors[printer.status] || statusColors.unknown;
  }, [printer]);

  if (!printer) {
    return (
      <div className={cn('text-gray-500 text-sm', className)}>
        No printer selected
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            printer.status === 'idle' && 'bg-green-500',
            printer.status === 'printing' && 'bg-blue-500 animate-pulse',
            printer.status === 'paused' && 'bg-yellow-500',
            printer.status === 'error' && 'bg-red-500',
            printer.status === 'offline' && 'bg-gray-400',
            printer.status === 'unknown' && 'bg-gray-400'
          )}
        />
        <span className="text-sm truncate">{printer.displayName}</span>
      </div>
    );
  }

  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{printer.displayName}</h3>
          {printer.description && (
            <p className="text-sm text-gray-500 truncate">{printer.description}</p>
          )}
        </div>
        {printer.isDefault && (
          <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded">
            Default
          </span>
        )}
      </div>

      {/* Status badge */}
      {statusInfo && (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm',
            statusInfo.bg,
            statusInfo.text
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              printer.status === 'printing' && 'animate-pulse'
            )}
            style={{
              backgroundColor: 'currentColor',
            }}
          />
          {statusInfo.label}
        </div>
      )}

      {/* Capabilities */}
      <div className="mt-4 flex flex-wrap gap-2">
        {printer.colorCapable && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
            Color
          </div>
        )}
        {printer.duplexCapable && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="8" y="8" width="8" height="8" fill="white" />
            </svg>
            Duplex
          </div>
        )}
      </div>

      {/* Ink levels (mock data for UI demo) */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-gray-500">Ink Levels</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { color: 'Black', level: 75, bg: 'bg-gray-800' },
            { color: 'Cyan', level: 60, bg: 'bg-cyan-500' },
            { color: 'Magenta', level: 45, bg: 'bg-pink-500' },
            { color: 'Yellow', level: 80, bg: 'bg-yellow-400' },
          ].map((ink) => (
            <div key={ink.color} className="text-center">
              <div className="relative h-12 w-6 mx-auto bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className={cn('absolute bottom-0 left-0 right-0 transition-all', ink.bg)}
                  style={{ height: `${ink.level}%` }}
                />
              </div>
              <div className="text-xs mt-1 text-gray-500">{ink.color[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {printer.status === 'error' && (
        <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
          Printer error. Please check the printer.
        </div>
      )}
    </div>
  );
}

export default PrinterStatus;
