/**
 * Change Preview Component
 *
 * Shows a preview of what changed in the document before reloading.
 */

import React from 'react';
import {
  FileEdit,
  FilePlus,
  FileMinus,
  RotateCw,
  FileText,
  FormInput,
  AlertCircle,
} from 'lucide-react';
import type { ChangeSummary, ChangeType } from '@lib/fileWatch/changeDetector';

interface ChangePreviewProps {
  changeSummary: ChangeSummary;
  className?: string;
}

const changeTypeIcons: Record<ChangeType, React.ReactNode> = {
  'pages-added': <FilePlus className="w-4 h-4 text-green-500" />,
  'pages-removed': <FileMinus className="w-4 h-4 text-red-500" />,
  'pages-reordered': <RotateCw className="w-4 h-4 text-blue-500" />,
  'page-content-changed': <FileEdit className="w-4 h-4 text-amber-500" />,
  'annotations-changed': <FileText className="w-4 h-4 text-purple-500" />,
  'form-fields-changed': <FormInput className="w-4 h-4 text-indigo-500" />,
  'metadata-changed': <FileEdit className="w-4 h-4 text-gray-500" />,
  'attachments-changed': <FilePlus className="w-4 h-4 text-cyan-500" />,
  'bookmarks-changed': <FileText className="w-4 h-4 text-teal-500" />,
  'security-changed': <AlertCircle className="w-4 h-4 text-red-600" />,
};

const severityColors = {
  minor: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  major: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export function ChangePreview({ changeSummary, className = '' }: ChangePreviewProps) {
  if (!changeSummary.hasChanges) {
    return (
      <div className={`p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        No changes detected
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {changeSummary.totalChanges} change{changeSummary.totalChanges !== 1 ? 's' : ''} detected
        </span>
        <div className="flex gap-2">
          {changeSummary.majorChanges > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
              {changeSummary.majorChanges} major
            </span>
          )}
          {changeSummary.moderateChanges > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              {changeSummary.moderateChanges} moderate
            </span>
          )}
          {changeSummary.minorChanges > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
              {changeSummary.minorChanges} minor
            </span>
          )}
        </div>
      </div>

      {/* Change list */}
      <ul className="space-y-2">
        {changeSummary.changes.map((change, index) => (
          <li
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg ${severityColors[change.severity]}`}
          >
            <span className="flex-shrink-0 mt-0.5">
              {changeTypeIcons[change.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{change.description}</p>
              {change.pageNumbers && change.pageNumbers.length > 0 && (
                <p className="text-xs mt-1 opacity-75">
                  Pages: {change.pageNumbers.slice(0, 10).join(', ')}
                  {change.pageNumbers.length > 10 && ` and ${change.pageNumbers.length - 10} more`}
                </p>
              )}
            </div>
            <span
              className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                change.severity === 'major'
                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                  : change.severity === 'moderate'
                  ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {change.severity}
            </span>
          </li>
        ))}
      </ul>

      {/* Affected pages summary */}
      {changeSummary.affectedPages.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{changeSummary.affectedPages.length}</span> page
            {changeSummary.affectedPages.length !== 1 ? 's' : ''} affected
          </p>
        </div>
      )}

      {/* Reload recommendation */}
      {changeSummary.requiresFullReload && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 inline-block mr-2" />
            Full document reload is recommended due to structural changes.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact change summary badge
 */
export function ChangeCountBadge({
  count,
  severity,
  className = '',
}: {
  count: number;
  severity: 'minor' | 'moderate' | 'major';
  className?: string;
}) {
  if (count === 0) return null;

  const colors = {
    minor: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    moderate: 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200',
    major: 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200',
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[severity]} ${className}`}
    >
      {count}
    </span>
  );
}
