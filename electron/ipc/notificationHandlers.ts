/**
 * Notification IPC Handlers
 *
 * Handles IPC communication for notification and tray operations
 * between the main and renderer processes.
 */

import { IpcMain } from 'electron';
import { IPC_CHANNELS } from './channels';
import type { ExtendedNotificationOptions, NotificationPreferences } from './types';
import {
  getNotificationManager,
  showNotification,
  showSuccessNotification,
  showErrorNotification,
  showFileOperationNotification,
  showBatchOperationNotification,
} from '../notifications';
import { getTrayManager } from '../tray';
import { getDockManager, DockManager } from '../dock';

/**
 * Set up notification-related IPC handlers
 */
export function setupNotificationHandlers(ipcMain: IpcMain): void {
  // Show notification
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_SHOW_EXTENDED,
    async (_event, options: ExtendedNotificationOptions) => {
      const id = getNotificationManager().show(options);
      return { id };
    }
  );

  // Show simple notification
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_SHOW_SIMPLE,
    async (_event, title: string, body: string, type?: string) => {
      let id: string | null = null;

      switch (type) {
        case 'success':
          id = showSuccessNotification(title, body);
          break;
        case 'error':
          id = showErrorNotification(title, body);
          break;
        default:
          id = showNotification(title, body);
      }

      return { id };
    }
  );

  // Show file operation notification
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_FILE_OPERATION,
    async (
      _event,
      operation: 'save' | 'export' | 'import' | 'open',
      fileName: string,
      success: boolean,
      error?: string
    ) => {
      const id = showFileOperationNotification(operation, fileName, success, error);
      return { id };
    }
  );

  // Show batch operation notification
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_BATCH_OPERATION,
    async (_event, operation: string, successCount: number, totalCount: number) => {
      const id = showBatchOperationNotification(operation, successCount, totalCount);
      return { id };
    }
  );

  // Close notification
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_CLOSE, async (_event, id: string) => {
    getNotificationManager().close(id);
    return { success: true };
  });

  // Close all notifications
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_CLOSE_ALL, async () => {
    getNotificationManager().closeAll();
    return { success: true };
  });

  // Get notification preferences
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_GET_PREFERENCES, async () => {
    return getNotificationManager().getPreferences();
  });

  // Set notification preferences
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_SET_PREFERENCES,
    async (_event, preferences: Partial<NotificationPreferences>) => {
      getNotificationManager().setPreferences(preferences);
      return getNotificationManager().getPreferences();
    }
  );

  // Get notification history
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_GET_HISTORY, async () => {
    return getNotificationManager().getHistory();
  });

  // Get unread notification count
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_GET_UNREAD_COUNT, async () => {
    return getNotificationManager().getUnreadCount();
  });

  // Mark notification as read
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_MARK_READ, async (_event, id: string) => {
    getNotificationManager().markAsRead(id);
    return { success: true };
  });

  // Mark all notifications as read
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_MARK_ALL_READ, async () => {
    getNotificationManager().markAllAsRead();
    // Clear dock badge on macOS
    if (DockManager.isAvailable()) {
      getDockManager().clearBadge();
    }
    return { success: true };
  });

  // Clear notification history
  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_CLEAR_HISTORY, async () => {
    getNotificationManager().clearHistory();
    return { success: true };
  });
}

/**
 * Set up tray-related IPC handlers
 */
export function setupTrayHandlers(ipcMain: IpcMain): void {
  // Get tray status
  ipcMain.handle(IPC_CHANNELS.TRAY_GET_STATUS, async () => {
    const trayManager = getTrayManager();
    return {
      status: trayManager.getStatus(),
      notificationCount: trayManager.getNotificationCount(),
      isReady: trayManager.isReady(),
    };
  });

  // Set tray status
  ipcMain.handle(
    IPC_CHANNELS.TRAY_SET_STATUS,
    async (_event, status: 'idle' | 'busy' | 'notification' | 'error') => {
      getTrayManager().setStatus(status);
      return { success: true };
    }
  );

  // Set tray progress
  ipcMain.handle(
    IPC_CHANNELS.TRAY_SET_PROGRESS,
    async (_event, operation: string | null, percent?: number, detail?: string) => {
      if (operation === null) {
        getTrayManager().setProgress(null);
      } else {
        getTrayManager().setProgress({ operation, percent, detail });
      }
      return { success: true };
    }
  );

  // Set tray tooltip
  ipcMain.handle(IPC_CHANNELS.TRAY_SET_TOOLTIP, async (_event, text: string) => {
    getTrayManager().setTooltip(text);
    return { success: true };
  });

  // Flash tray icon
  ipcMain.handle(IPC_CHANNELS.TRAY_FLASH, async (_event, duration?: number) => {
    getTrayManager().flash(duration);
    return { success: true };
  });
}

/**
 * Set up dock-related IPC handlers (macOS only)
 */
export function setupDockHandlers(ipcMain: IpcMain): void {
  // Set dock badge
  ipcMain.handle(IPC_CHANNELS.DOCK_SET_BADGE, async (_event, count: number) => {
    if (DockManager.isAvailable()) {
      getDockManager().setBadgeCount(count);
      return { success: true };
    }
    return { success: false, error: 'Dock not available' };
  });

  // Clear dock badge
  ipcMain.handle(IPC_CHANNELS.DOCK_CLEAR_BADGE, async () => {
    if (DockManager.isAvailable()) {
      getDockManager().clearBadge();
      return { success: true };
    }
    return { success: false, error: 'Dock not available' };
  });

  // Bounce dock icon
  ipcMain.handle(
    IPC_CHANNELS.DOCK_BOUNCE,
    async (_event, type?: 'critical' | 'informational') => {
      if (DockManager.isAvailable()) {
        getDockManager().bounce(type);
        return { success: true };
      }
      return { success: false, error: 'Dock not available' };
    }
  );

  // Get dock badge count
  ipcMain.handle(IPC_CHANNELS.DOCK_GET_BADGE, async () => {
    if (DockManager.isAvailable()) {
      return { count: getDockManager().getBadgeCount() };
    }
    return { count: 0 };
  });
}

/**
 * Set up all notification-related IPC handlers
 */
export function setupAllNotificationHandlers(ipcMain: IpcMain): void {
  setupNotificationHandlers(ipcMain);
  setupTrayHandlers(ipcMain);
  setupDockHandlers(ipcMain);
}
