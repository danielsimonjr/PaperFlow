/**
 * Electron Notification Utilities
 *
 * Renderer-side utilities for working with desktop notifications
 * and system tray in the Electron app.
 */

import { isElectron } from './platform';
import type {
  ExtendedNotificationOptions,
  NotificationPreferences,
  NotificationHistory,
  TrayStatus,
  TrayStatusInfo,
} from '@/types/electronTypes';

/**
 * Check if desktop notifications are available
 */
export function isNotificationAvailable(): boolean {
  if (isElectron()) {
    return true;
  }
  return 'Notification' in window;
}

/**
 * Show a desktop notification
 */
export async function showNotification(
  title: string,
  body: string,
  type?: 'info' | 'success' | 'error'
): Promise<string | null> {
  if (!isElectron() || !window.electron) {
    // Fall back to web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return null;
  }

  const result = await window.electron.showSimpleNotification(title, body, type);
  return result.id;
}

/**
 * Show an extended notification with actions
 */
export async function showExtendedNotification(
  options: ExtendedNotificationOptions
): Promise<string | null> {
  if (!isElectron() || !window.electron) {
    // Fall back to simple web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, { body: options.body });
    }
    return null;
  }

  const result = await window.electron.showExtendedNotification(options);
  return result.id;
}

/**
 * Show a file operation notification
 */
export async function showFileOperationNotification(
  operation: 'save' | 'export' | 'import' | 'open',
  fileName: string,
  success: boolean,
  error?: string
): Promise<string | null> {
  if (!isElectron() || !window.electron) {
    // Fall back to simple web notification
    const title = success ? `${operation} Complete` : `${operation} Failed`;
    const body = success ? fileName : `${fileName}: ${error || 'Unknown error'}`;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return null;
  }

  const result = await window.electron.showFileOperationNotification(
    operation,
    fileName,
    success,
    error
  );
  return result.id;
}

/**
 * Show a batch operation notification
 */
export async function showBatchOperationNotification(
  operation: string,
  successCount: number,
  totalCount: number
): Promise<string | null> {
  if (!isElectron() || !window.electron) {
    // Fall back to simple web notification
    const title = successCount === totalCount ? `${operation} Complete` : `${operation} Partial`;
    const body = `${successCount} of ${totalCount} files processed`;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return null;
  }

  const result = await window.electron.showBatchOperationNotification(
    operation,
    successCount,
    totalCount
  );
  return result.id;
}

/**
 * Close a notification
 */
export async function closeNotification(id: string): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.closeNotification(id);
  return result.success;
}

/**
 * Close all notifications
 */
export async function closeAllNotifications(): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.closeAllNotifications();
  return result.success;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  if (!isElectron() || !window.electron) {
    return null;
  }

  return window.electron.getNotificationPreferences();
}

/**
 * Set notification preferences
 */
export async function setNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  if (!isElectron() || !window.electron) {
    return null;
  }

  return window.electron.setNotificationPreferences(preferences);
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<NotificationHistory[]> {
  if (!isElectron() || !window.electron) {
    return [];
  }

  return window.electron.getNotificationHistory();
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  if (!isElectron() || !window.electron) {
    return 0;
  }

  return window.electron.getUnreadNotificationCount();
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(id: string): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.markNotificationRead(id);
  return result.success;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.markAllNotificationsRead();
  return result.success;
}

/**
 * Clear notification history
 */
export async function clearNotificationHistory(): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.clearNotificationHistory();
  return result.success;
}

// ============== Tray Functions ==============

/**
 * Get tray status
 */
export async function getTrayStatus(): Promise<TrayStatusInfo | null> {
  if (!isElectron() || !window.electron) {
    return null;
  }

  return window.electron.getTrayStatus();
}

/**
 * Set tray status
 */
export async function setTrayStatus(status: TrayStatus): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.setTrayStatus(status);
  return result.success;
}

/**
 * Set tray progress
 */
export async function setTrayProgress(
  operation: string | null,
  percent?: number,
  detail?: string
): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.setTrayProgress(operation, percent, detail);
  return result.success;
}

/**
 * Set tray tooltip
 */
export async function setTrayTooltip(text: string): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.setTrayTooltip(text);
  return result.success;
}

/**
 * Flash tray icon
 */
export async function flashTray(duration?: number): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.flashTray(duration);
  return result.success;
}

// ============== Dock Functions (macOS) ==============

/**
 * Set dock badge count (macOS only)
 */
export async function setDockBadge(count: number): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.setDockBadge(count);
  return result.success;
}

/**
 * Clear dock badge (macOS only)
 */
export async function clearDockBadge(): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.clearDockBadge();
  return result.success;
}

/**
 * Bounce dock icon (macOS only)
 */
export async function bounceDock(type?: 'critical' | 'informational'): Promise<boolean> {
  if (!isElectron() || !window.electron) {
    return false;
  }

  const result = await window.electron.bounceDock(type);
  return result.success;
}

/**
 * Get dock badge count (macOS only)
 */
export async function getDockBadge(): Promise<number> {
  if (!isElectron() || !window.electron) {
    return 0;
  }

  const result = await window.electron.getDockBadge();
  return result.count;
}

// ============== Event Listeners ==============

/**
 * Subscribe to notification click events
 */
export function onNotificationClicked(callback: (id: string) => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onNotificationClicked(callback);
}

/**
 * Subscribe to notification close events
 */
export function onNotificationClosed(callback: (id: string) => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onNotificationClosed(callback);
}

/**
 * Subscribe to notification action events
 */
export function onNotificationAction(
  callback: (id: string, actionId: string) => void
): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onNotificationAction(callback);
}

/**
 * Subscribe to tray click events
 */
export function onTrayClicked(callback: () => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onTrayClicked(callback);
}

/**
 * Subscribe to tray double-click events
 */
export function onTrayDoubleClicked(callback: () => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onTrayDoubleClicked(callback);
}

/**
 * Subscribe to window hidden events
 */
export function onWindowHidden(callback: () => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onWindowHidden(callback);
}

/**
 * Subscribe to window shown events
 */
export function onWindowShown(callback: () => void): () => void {
  if (!isElectron() || !window.electron) {
    return () => {};
  }

  return window.electron.onWindowShown(callback);
}

/**
 * Request notification permission (web only)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isElectron()) {
    return true; // Electron always has permission
  }

  if (!('Notification' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
