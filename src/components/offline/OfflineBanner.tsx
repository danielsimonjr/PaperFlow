/**
 * Offline Mode Banner
 *
 * Dismissible banner that appears when app enters offline mode,
 * explaining available features and limitations.
 */

import { useState, useEffect } from 'react';
import { X, WifiOff, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';
import { cn } from '@/utils/cn';

export interface OfflineBannerProps {
  className?: string;
  position?: 'top' | 'bottom';
  variant?: 'full' | 'compact';
}

/**
 * Features available offline
 */
const AVAILABLE_FEATURES = [
  'View and navigate offline documents',
  'Add and edit annotations',
  'Fill out forms',
  'Save changes locally',
  'Access recently viewed documents',
];

/**
 * Features with limitations offline
 */
const LIMITED_FEATURES = [
  'Cloud sync (queued until online)',
  'Document sharing',
  'New document download',
];

export function OfflineBanner({
  className,
  position = 'top',
  variant = 'full',
}: OfflineBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const showOfflineBanner = useOfflineStore((state) => state.showOfflineBanner);
  const dismissBanner = useOfflineStore((state) => state.dismissBanner);
  const isOnline = useOfflineStore((state) => state.isOnline);

  // Animate banner appearance
  useEffect(() => {
    if (showOfflineBanner) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showOfflineBanner]);

  // Auto-hide when back online
  useEffect(() => {
    if (isOnline && showOfflineBanner) {
      dismissBanner();
    }
  }, [isOnline, showOfflineBanner, dismissBanner]);

  if (!showOfflineBanner) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 bg-gray-800 px-4 py-2 text-white',
          position === 'top' ? 'rounded-b-lg' : 'rounded-t-lg',
          isAnimating && 'animate-slide-down',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You are offline</span>
        </div>
        <button
          onClick={dismissBanner}
          className="rounded p-1 hover:bg-gray-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-gray-900 text-white',
        position === 'top' ? 'rounded-b-lg' : 'rounded-t-lg',
        isAnimating && 'animate-slide-down',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700">
            <WifiOff className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">You are offline</h3>
            <p className="text-sm text-gray-400">
              Some features may be limited
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded px-3 py-1 text-sm hover:bg-gray-700"
          >
            {isExpanded ? 'Less info' : 'More info'}
          </button>
          <button
            onClick={dismissBanner}
            className="rounded p-1 hover:bg-gray-700"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 px-4 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Available Features */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <h4 className="font-medium">Available Offline</h4>
              </div>
              <ul className="space-y-2">
                {AVAILABLE_FEATURES.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Limited Features */}
            <div>
              <div className="mb-3 flex items-center gap-2 text-amber-400">
                <AlertCircle className="h-5 w-5" />
                <h4 className="font-medium">Limited Offline</h4>
              </div>
              <ul className="space-y-2">
                {LIMITED_FEATURES.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 flex items-start gap-3 rounded-lg bg-gray-800 p-3">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-400" />
            <p className="text-sm text-gray-300">
              Changes made offline will automatically sync when you reconnect.
              Your work is safely stored on your device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
