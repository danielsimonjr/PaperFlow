/**
 * Notification Settings Component
 *
 * Allows users to configure notification preferences including
 * types, sounds, and quiet hours.
 */

import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { isElectron } from '@/lib/electron/platform';

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  label: string;
}

/**
 * Simple time picker component
 */
function TimePicker({ hour, minute, onChange, label }: TimePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 dark:text-gray-400 w-16">{label}</label>
      <select
        value={hour}
        onChange={(e) => onChange(Number(e.target.value), minute)}
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="text-gray-500">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(hour, Number(e.target.value))}
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Toggle switch component
 */
function ToggleSwitch({ enabled, onChange, label, description, disabled }: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <label className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {label}
        </label>
        {description && (
          <p className={`text-sm mt-0.5 ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${enabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

/**
 * Notification Settings Component
 */
export function NotificationSettings() {
  const {
    notificationsEnabled,
    notificationSound,
    notificationQuietHours,
    notifyOnSave,
    notifyOnExport,
    notifyOnBackgroundComplete,
    minimizeToTray,
    closeToTray,
    showTrayIcon,
    setNotificationsEnabled,
    setNotificationSound,
    setNotificationQuietHours,
    setNotifyOnSave,
    setNotifyOnExport,
    setNotifyOnBackgroundComplete,
    setMinimizeToTray,
    setCloseToTray,
    setShowTrayIcon,
  } = useSettingsStore();

  const isDesktopApp = isElectron();

  const handleQuietHoursToggle = useCallback(
    (enabled: boolean) => {
      setNotificationQuietHours({
        ...notificationQuietHours,
        enabled,
      });
    },
    [notificationQuietHours, setNotificationQuietHours]
  );

  const handleStartTimeChange = useCallback(
    (hour: number, minute: number) => {
      setNotificationQuietHours({
        ...notificationQuietHours,
        startHour: hour,
        startMinute: minute,
      });
    },
    [notificationQuietHours, setNotificationQuietHours]
  );

  const handleEndTimeChange = useCallback(
    (hour: number, minute: number) => {
      setNotificationQuietHours({
        ...notificationQuietHours,
        endHour: hour,
        endMinute: minute,
      });
    },
    [notificationQuietHours, setNotificationQuietHours]
  );

  if (!isDesktopApp) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Desktop notification settings are only available in the PaperFlow desktop application.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Tray Settings */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          System Tray
        </h3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <ToggleSwitch
            enabled={showTrayIcon}
            onChange={setShowTrayIcon}
            label="Show tray icon"
            description="Display PaperFlow icon in the system tray"
          />
          <ToggleSwitch
            enabled={minimizeToTray}
            onChange={setMinimizeToTray}
            label="Minimize to tray"
            description="Minimize to system tray instead of taskbar"
            disabled={!showTrayIcon}
          />
          <ToggleSwitch
            enabled={closeToTray}
            onChange={setCloseToTray}
            label="Close to tray"
            description="Close button minimizes to tray instead of quitting"
            disabled={!showTrayIcon}
          />
        </div>
      </section>

      {/* Notification Settings */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notifications
        </h3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <ToggleSwitch
            enabled={notificationsEnabled}
            onChange={setNotificationsEnabled}
            label="Enable notifications"
            description="Show desktop notifications for important events"
          />
          <ToggleSwitch
            enabled={notificationSound}
            onChange={setNotificationSound}
            label="Notification sounds"
            description="Play sound when notifications appear"
            disabled={!notificationsEnabled}
          />
        </div>
      </section>

      {/* Notification Events */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notify me when
        </h3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <ToggleSwitch
            enabled={notifyOnSave}
            onChange={setNotifyOnSave}
            label="File saved"
            description="Show notification after saving a document"
            disabled={!notificationsEnabled}
          />
          <ToggleSwitch
            enabled={notifyOnExport}
            onChange={setNotifyOnExport}
            label="Export complete"
            description="Show notification when export finishes"
            disabled={!notificationsEnabled}
          />
          <ToggleSwitch
            enabled={notifyOnBackgroundComplete}
            onChange={setNotifyOnBackgroundComplete}
            label="Background operation complete"
            description="Show notification when background tasks finish"
            disabled={!notificationsEnabled}
          />
        </div>
      </section>

      {/* Quiet Hours */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quiet Hours
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={notificationQuietHours.enabled}
            onChange={handleQuietHoursToggle}
            label="Enable quiet hours"
            description="Suppress notifications during specified hours"
            disabled={!notificationsEnabled}
          />

          {notificationQuietHours.enabled && notificationsEnabled && (
            <div className="ml-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <TimePicker
                hour={notificationQuietHours.startHour}
                minute={notificationQuietHours.startMinute}
                onChange={handleStartTimeChange}
                label="From"
              />
              <TimePicker
                hour={notificationQuietHours.endHour}
                minute={notificationQuietHours.endMinute}
                onChange={handleEndTimeChange}
                label="To"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Notifications will be silenced during these hours.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default NotificationSettings;
