/**
 * Offline Indicator Component
 *
 * Status bar indicator showing connection status, sync progress,
 * and pending operations with interactive details panel.
 */

import { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';
import { SyncStatusPanel } from './SyncStatusPanel';
import { cn } from '@/utils/cn';

export interface OfflineIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OfflineIndicator({
  className,
  showLabel = true,
  size = 'md',
}: OfflineIndicatorProps) {
  const [showPanel, setShowPanel] = useState(false);

  const isOnline = useOfflineStore((state) => state.isOnline);
  const syncStatus = useOfflineStore((state) => state.syncStatus);
  const syncProgress = useOfflineStore((state) => state.syncProgress);
  const pendingOperationsCount = useOfflineStore((state) => state.pendingOperationsCount);
  const hasUnresolvedConflicts = useOfflineStore((state) => state.hasUnresolvedConflicts);

  // Determine icon and color based on state
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        label: 'Offline',
      };
    }

    if (hasUnresolvedConflicts) {
      return {
        icon: AlertCircle,
        color: 'text-amber-500',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'Conflicts',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        label: 'Syncing...',
        animate: true,
      };
    }

    if (syncStatus === 'error') {
      return {
        icon: CloudOff,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        label: 'Sync Error',
      };
    }

    if (pendingOperationsCount > 0) {
      return {
        icon: Cloud,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        label: `${pendingOperationsCount} pending`,
      };
    }

    return {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      label: 'Online',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const sizeClasses = {
    sm: 'h-6 px-2 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={cn(
          'flex items-center rounded-full transition-colors',
          'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-500',
          statusInfo.bgColor,
          sizeClasses[size]
        )}
        aria-label={`Connection status: ${statusInfo.label}`}
        aria-expanded={showPanel}
      >
        <Icon
          className={cn(
            iconSizes[size],
            statusInfo.color,
            statusInfo.animate && 'animate-spin'
          )}
        />
        {showLabel && (
          <span className={cn('font-medium', statusInfo.color)}>
            {statusInfo.label}
          </span>
        )}
        {syncProgress && syncStatus === 'syncing' && (
          <span className="ml-1 text-gray-500">
            ({Math.round(syncProgress.bytesTransferred / syncProgress.bytesTotal * 100)}%)
          </span>
        )}
      </button>

      {/* Details Panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full z-50 mt-2">
            <SyncStatusPanel onClose={() => setShowPanel(false)} />
          </div>
        </>
      )}
    </div>
  );
}
