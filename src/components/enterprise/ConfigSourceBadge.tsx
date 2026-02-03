/**
 * Config Source Badge Component (Sprint 20)
 *
 * Displays the source of a configuration value.
 */

import React from 'react';
import type { ConfigSourceType } from '@/lib/enterprise/configMerger';

/**
 * Config source badge props
 */
interface ConfigSourceBadgeProps {
  /** Configuration source type */
  source: ConfigSourceType;
  /** Show full label or abbreviated */
  abbreviated?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Source configuration
 */
const SOURCE_CONFIG: Record<
  ConfigSourceType,
  { label: string; abbrev: string; color: string; bgColor: string }
> = {
  default: {
    label: 'Default',
    abbrev: 'DEF',
    color: '#6c757d',
    bgColor: '#e9ecef',
  },
  system: {
    label: 'System',
    abbrev: 'SYS',
    color: '#495057',
    bgColor: '#dee2e6',
  },
  user: {
    label: 'User',
    abbrev: 'USR',
    color: '#0d6efd',
    bgColor: '#cfe2ff',
  },
  file: {
    label: 'File',
    abbrev: 'FILE',
    color: '#198754',
    bgColor: '#d1e7dd',
  },
  remote: {
    label: 'Remote',
    abbrev: 'REM',
    color: '#6f42c1',
    bgColor: '#e2d9f3',
  },
  env: {
    label: 'Environment',
    abbrev: 'ENV',
    color: '#fd7e14',
    bgColor: '#ffe5d0',
  },
  cli: {
    label: 'Command Line',
    abbrev: 'CLI',
    color: '#0dcaf0',
    bgColor: '#cff4fc',
  },
  gpo: {
    label: 'Group Policy',
    abbrev: 'GPO',
    color: '#dc3545',
    bgColor: '#f8d7da',
  },
  mdm: {
    label: 'MDM Policy',
    abbrev: 'MDM',
    color: '#dc3545',
    bgColor: '#f8d7da',
  },
};

/**
 * Config Source Badge Component
 */
export function ConfigSourceBadge({
  source,
  abbreviated = false,
  className = '',
}: ConfigSourceBadgeProps): React.ReactElement {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.default;
  const label = abbreviated ? config.abbrev : config.label;

  return (
    <span
      className={`config-source-badge ${className}`}
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bgColor,
        borderRadius: '2px',
        whiteSpace: 'nowrap',
      }}
      title={`Source: ${config.label}`}
    >
      {label}
    </span>
  );
}

export default ConfigSourceBadge;
