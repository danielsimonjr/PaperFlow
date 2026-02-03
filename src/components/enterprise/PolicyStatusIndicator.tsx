/**
 * Policy Status Indicator Component
 *
 * Displays the enterprise policy status, showing when settings are managed
 * by GPO (Windows) or MDM (macOS), along with admin contact information.
 */

import { useState } from 'react';
import { useEnterprisePolicyStore, useAdminContact, useIsManaged } from '@stores/enterprisePolicyStore';
import { cn } from '@utils/cn';

interface PolicyStatusIndicatorProps {
  /** Show as compact badge or full panel */
  variant?: 'badge' | 'panel';
  /** Additional CSS classes */
  className?: string;
  /** Show even when not managed */
  showWhenNotManaged?: boolean;
}

/**
 * Policy Status Indicator
 */
export function PolicyStatusIndicator({
  variant = 'badge',
  className,
  showWhenNotManaged = false,
}: PolicyStatusIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isManaged = useIsManaged();
  const adminContact = useAdminContact();
  const managedSettingsCount = useEnterprisePolicyStore((s) => s.managedSettingsCount);
  const platform = useEnterprisePolicyStore((s) => s.platform);
  const lastRefreshed = useEnterprisePolicyStore((s) => s.lastRefreshed);

  // Don't render if not managed and not forced to show
  if (!isManaged && !showWhenNotManaged) {
    return null;
  }

  const policyType = platform === 'windows' ? 'Group Policy' : platform === 'macos' ? 'MDM Profile' : 'Configuration';

  if (variant === 'badge') {
    return (
      <div className={cn('relative inline-block', className)}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            isManaged
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          )}
          title={isManaged ? `${managedSettingsCount} settings managed by ${policyType}` : 'No enterprise policies'}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          {isManaged ? 'Managed' : 'Not Managed'}
        </button>

        {/* Expanded details dropdown */}
        {isExpanded && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <PolicyDetails
              isManaged={isManaged}
              policyType={policyType}
              managedSettingsCount={managedSettingsCount}
              adminContact={adminContact}
              lastRefreshed={lastRefreshed}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Panel variant
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isManaged
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
        className
      )}
    >
      <PolicyDetails
        isManaged={isManaged}
        policyType={policyType}
        managedSettingsCount={managedSettingsCount}
        adminContact={adminContact}
        lastRefreshed={lastRefreshed}
      />
    </div>
  );
}

/**
 * Policy Details Component (used in both variants)
 */
interface PolicyDetailsProps {
  isManaged: boolean;
  policyType: string;
  managedSettingsCount: number;
  adminContact: {
    email: string | null;
    name: string | null;
    organization: string | null;
  };
  lastRefreshed: number | null;
  onClose?: () => void;
}

function PolicyDetails({
  isManaged,
  policyType,
  managedSettingsCount,
  adminContact,
  lastRefreshed,
  onClose,
}: PolicyDetailsProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              isManaged ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
            )}
          >
            <svg
              className={cn(
                'h-4 w-4',
                isManaged ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {isManaged ? 'Enterprise Managed' : 'Not Managed'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isManaged ? policyType : 'No enterprise policies active'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Statistics */}
      {isManaged && (
        <div className="rounded-md bg-white/50 p-2 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Managed Settings</span>
            <span className="font-medium text-gray-900 dark:text-white">{managedSettingsCount}</span>
          </div>
        </div>
      )}

      {/* Admin Contact */}
      {isManaged && (adminContact.name || adminContact.email || adminContact.organization) && (
        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            IT Support Contact
          </h5>
          <div className="space-y-1 text-sm">
            {adminContact.organization && (
              <p className="text-gray-900 dark:text-white">{adminContact.organization}</p>
            )}
            {adminContact.name && (
              <p className="text-gray-600 dark:text-gray-300">{adminContact.name}</p>
            )}
            {adminContact.email && (
              <a
                href={`mailto:${adminContact.email}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {adminContact.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Last refreshed */}
      {lastRefreshed && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Last updated: {new Date(lastRefreshed).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default PolicyStatusIndicator;
