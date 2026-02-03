/**
 * Locked Setting Badge Component
 *
 * Visual indicator that a setting is managed by enterprise policy (GPO/MDM)
 * and cannot be modified by the user.
 */

import { useState } from 'react';
import { usePolicyValue } from '@stores/enterprisePolicyStore';
import { cn } from '@utils/cn';

interface LockedSettingBadgeProps {
  /** The policy category (e.g., 'application', 'security', 'features') */
  category: string;
  /** The setting key within the category */
  settingKey: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Icon size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Locked Setting Badge
 */
export function LockedSettingBadge({
  category,
  settingKey,
  showTooltip = true,
  className,
  size = 'sm',
}: LockedSettingBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const { isLocked, source } = usePolicyValue(category, settingKey);

  // Don't render if not locked
  if (!isLocked) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'flex items-center justify-center text-blue-600 dark:text-blue-400',
          sizeClasses[size]
        )}
        onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        role="img"
        aria-label={`This setting is managed by ${source}`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-full w-full"
        >
          <path
            fillRule="evenodd"
            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Tooltip */}
      {showTooltip && isTooltipVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700">
          Managed by {source}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}

/**
 * Locked Setting Wrapper Component
 *
 * Wraps a setting control and shows locked indicator when managed.
 */
interface LockedSettingWrapperProps {
  /** The policy category */
  category: string;
  /** The setting key */
  settingKey: string;
  /** Children to wrap */
  children: React.ReactNode;
  /** Label to show */
  label?: string;
  /** Description text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

export function LockedSettingWrapper({
  category,
  settingKey,
  children,
  label,
  description,
  className,
}: LockedSettingWrapperProps) {
  const { isLocked, source } = usePolicyValue(category, settingKey);

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label row */}
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <LockedSettingBadge
            category={category}
            settingKey={settingKey}
            size="sm"
          />
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}

      {/* Control (disabled if locked) */}
      <div
        className={cn(
          'relative',
          isLocked && 'cursor-not-allowed opacity-60'
        )}
      >
        {isLocked && (
          <div
            className="absolute inset-0 z-10"
            title={`This setting is managed by ${source}`}
          />
        )}
        {children}
      </div>

      {/* Locked message */}
      {isLocked && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          This setting is managed by your organization via {source}.
        </p>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap any setting control with lock detection
 */
interface WithLockCheckProps {
  category: string;
  settingKey: string;
  disabled?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- HOC pattern requires function export
export function withLockCheck<P extends object>(
  WrappedComponent: React.ComponentType<P & { disabled?: boolean }>
) {
  return function LockCheckedComponent(props: P & WithLockCheckProps) {
    const { category, settingKey, disabled, ...rest } = props;
    const { isLocked } = usePolicyValue(category, settingKey);

    return (
      <div className="relative">
        <WrappedComponent
          {...(rest as P)}
          disabled={disabled || isLocked}
        />
        {isLocked && (
          <LockedSettingBadge
            category={category}
            settingKey={settingKey}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            size="sm"
          />
        )}
      </div>
    );
  };
}

export default LockedSettingBadge;
