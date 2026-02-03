/**
 * Auto-Reload Settings Panel
 *
 * Settings panel for configuring auto-reload behavior including
 * enable/disable, notification preferences, and merge defaults.
 */

import React from 'react';
import {
  Eye,
  EyeOff,
  Bell,
  BellOff,
  RefreshCw,
  GitMerge,
  AlertCircle,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useFileWatchStore, type FileWatchSettings } from '@stores/fileWatchStore';
import { MERGE_STRATEGIES } from '@lib/fileWatch/mergeStrategy';

interface AutoReloadSettingsProps {
  className?: string;
}

export function AutoReloadSettings({ className = '' }: AutoReloadSettingsProps) {
  const { settings, updateSettings, setEnabled } = useFileWatchStore();

  const handleSettingChange = <K extends keyof FileWatchSettings>(
    key: K,
    value: FileWatchSettings[K]
  ) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Eye className="w-5 h-5 text-green-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              File Watching
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Monitor open files for external changes
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => {
              handleSettingChange('enabled', e.target.checked);
              setEnabled(e.target.checked);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Settings sections */}
      <div className={`space-y-4 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Auto-reload */}
        <SettingToggle
          icon={<RefreshCw className="w-4 h-4" />}
          title="Auto-reload on change"
          description="Automatically reload documents when external changes are detected"
          checked={settings.autoReload}
          onChange={(checked) => handleSettingChange('autoReload', checked)}
        />

        {/* Notifications */}
        <SettingToggle
          icon={settings.showNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          title="Show change notifications"
          description="Display notifications when files change externally"
          checked={settings.showNotifications}
          onChange={(checked) => handleSettingChange('showNotifications', checked)}
        />

        {/* Notification style */}
        {settings.showNotifications && (
          <div className="pl-7 space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification style
            </label>
            <div className="flex gap-2">
              {(['banner', 'toast', 'dialog'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSettingChange('notificationStyle', style)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    settings.notificationStyle === style
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Default merge strategy */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default merge strategy
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            How to handle conflicts between local and external changes
          </p>

          <div className="ml-6 mt-2 space-y-2">
            {MERGE_STRATEGIES.map((strategy) => (
              <button
                key={strategy.strategy}
                onClick={() =>
                  handleSettingChange(
                    'defaultAction',
                    strategy.strategy === 'merge-prefer-local'
                      ? 'reload'
                      : strategy.strategy === 'manual'
                      ? 'pending'
                      : 'reload'
                  )
                }
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  settings.defaultAction ===
                  (strategy.strategy === 'manual' ? 'pending' : 'reload')
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {strategy.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {strategy.description}
                  </p>
                </div>
                {settings.defaultAction ===
                  (strategy.strategy === 'manual' ? 'pending' : 'reload') && (
                  <ChevronRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Check interval */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Check interval
            </label>
          </div>
          <div className="ml-6 flex items-center gap-2">
            <input
              type="number"
              value={settings.checkInterval / 1000}
              onChange={(e) =>
                handleSettingChange(
                  'checkInterval',
                  Math.max(1, Math.min(60, parseInt(e.target.value) || 5)) * 1000
                )
              }
              min={1}
              max={60}
              className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">seconds</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
            How often to manually check for file changes (in addition to native file system events)
          </p>
        </div>
      </div>

      {/* Warning about disabled state */}
      {!settings.enabled && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              File watching is disabled
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You won't be notified when files are modified externally. Enable file watching to
              automatically detect changes made by other applications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable setting toggle component
 */
function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="text-gray-400 mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}
