/**
 * Desktop Notification Manager
 *
 * Manages native desktop notifications with support for:
 * - Action buttons
 * - Notification preferences
 * - Quiet hours / Do Not Disturb
 * - Grouping for batch operations
 * - OS notification center integration
 */

import { Notification, BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Notification types
 */
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'file-operation'
  | 'batch-operation'
  | 'update';

/**
 * Notification action
 */
export interface NotificationAction {
  id: string;
  text: string;
  type?: 'button';
}

/**
 * Extended notification options
 */
export interface ExtendedNotificationOptions {
  id?: string;
  type?: NotificationType;
  title: string;
  body: string;
  subtitle?: string; // macOS only
  icon?: string;
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical'; // Linux only
  timeoutType?: 'default' | 'never'; // Linux only
  actions?: NotificationAction[];
  closeButtonText?: string; // macOS only
  hasReply?: boolean; // macOS only
  replyPlaceholder?: string; // macOS only
  tag?: string; // Group notifications
  data?: Record<string, unknown>;
}

/**
 * Notification callback
 */
export type NotificationCallback = (
  action: 'click' | 'close' | 'action' | 'reply',
  data?: { actionId?: string; reply?: string }
) => void;

/**
 * Quiet hours configuration
 */
export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  quietHours: QuietHoursConfig;
  enabledTypes: NotificationType[];
  showWhenFocused: boolean;
  groupSimilar: boolean;
}

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: true,
  quietHours: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
  },
  enabledTypes: ['info', 'success', 'warning', 'error', 'file-operation', 'batch-operation', 'update'],
  showWhenFocused: false,
  groupSimilar: true,
};

/**
 * NotificationManager class
 */
export class NotificationManager {
  private preferences: NotificationPreferences;
  private activeNotifications: Map<string, Notification> = new Map();
  private notificationHistory: Array<{
    id: string;
    options: ExtendedNotificationOptions;
    timestamp: number;
    read: boolean;
  }> = [];
  private callbacks: Map<string, NotificationCallback> = new Map();
  private notificationCounter = 0;
  private groupedNotifications: Map<string, ExtendedNotificationOptions[]> = new Map();
  private groupTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(preferences?: Partial<NotificationPreferences>) {
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return Notification.isSupported();
  }

  /**
   * Update notification preferences
   */
  setPreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Show a notification
   */
  show(
    options: ExtendedNotificationOptions,
    callback?: NotificationCallback
  ): string | null {
    // Check if notifications are enabled
    if (!this.preferences.enabled) {
      console.log('[NotificationManager] Notifications disabled');
      return null;
    }

    // Check if this type is enabled
    if (options.type && !this.preferences.enabledTypes.includes(options.type)) {
      console.log(`[NotificationManager] Notification type '${options.type}' disabled`);
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      console.log('[NotificationManager] In quiet hours, notification suppressed');
      return null;
    }

    // Check if app is focused and showWhenFocused is false
    if (!this.preferences.showWhenFocused) {
      const windows = BrowserWindow.getAllWindows();
      const anyFocused = windows.some((w) => w.isFocused());
      if (anyFocused) {
        console.log('[NotificationManager] App is focused, notification suppressed');
        return null;
      }
    }

    // Handle grouping
    if (this.preferences.groupSimilar && options.tag) {
      return this.handleGroupedNotification(options, callback);
    }

    return this.showImmediate(options, callback);
  }

  /**
   * Show notification immediately (bypasses grouping)
   */
  private showImmediate(
    options: ExtendedNotificationOptions,
    callback?: NotificationCallback
  ): string {
    const id = options.id || `notification-${++this.notificationCounter}`;

    // Build notification options
    const notificationOptions: Electron.NotificationConstructorOptions = {
      title: options.title,
      body: options.body,
      subtitle: options.subtitle,
      silent: !this.preferences.soundEnabled || options.silent,
      urgency: options.urgency,
      timeoutType: options.timeoutType,
      hasReply: options.hasReply,
      replyPlaceholder: options.replyPlaceholder,
      closeButtonText: options.closeButtonText,
    };

    // Set icon
    if (options.icon) {
      notificationOptions.icon = nativeImage.createFromPath(options.icon);
    } else {
      // Use app icon as default
      const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'icons', 'icon.png')
        : path.join(__dirname, '../build/icons/icon.png');
      try {
        notificationOptions.icon = nativeImage.createFromPath(iconPath);
      } catch {
        // No icon available
      }
    }

    // Set actions (if supported)
    if (options.actions && process.platform !== 'linux') {
      notificationOptions.actions = options.actions.map((action) => ({
        type: action.type || 'button',
        text: action.text,
      }));
    }

    // Create notification
    const notification = new Notification(notificationOptions);

    // Set up event handlers
    notification.on('click', () => {
      this.handleNotificationInteraction(id, 'click');
      callback?.('click');
    });

    notification.on('close', () => {
      this.activeNotifications.delete(id);
      this.handleNotificationInteraction(id, 'close');
      callback?.('close');
    });

    notification.on('action', (_event, index) => {
      const action = options.actions?.[index];
      if (action) {
        this.handleNotificationInteraction(id, 'action', { actionId: action.id });
        callback?.('action', { actionId: action.id });
      }
    });

    notification.on('reply', (_event, reply) => {
      this.handleNotificationInteraction(id, 'reply', { reply });
      callback?.('reply', { reply });
    });

    // Store callback if provided
    if (callback) {
      this.callbacks.set(id, callback);
    }

    // Show notification
    notification.show();

    // Track notification
    this.activeNotifications.set(id, notification);
    this.notificationHistory.push({
      id,
      options,
      timestamp: Date.now(),
      read: false,
    });

    // Limit history size
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(-100);
    }

    console.log(`[NotificationManager] Notification shown: ${id}`);
    return id;
  }

  /**
   * Handle grouped notifications
   */
  private handleGroupedNotification(
    options: ExtendedNotificationOptions,
    callback?: NotificationCallback
  ): string {
    const tag = options.tag!;

    // Add to group
    if (!this.groupedNotifications.has(tag)) {
      this.groupedNotifications.set(tag, []);
    }
    this.groupedNotifications.get(tag)!.push(options);

    // Clear existing timer for this group
    const existingTimer = this.groupTimers.get(tag);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set timer to show grouped notification
    const timer = setTimeout(() => {
      this.showGroupedNotification(tag, callback);
    }, 500); // Wait 500ms for more notifications

    this.groupTimers.set(tag, timer);

    return `group-${tag}-${this.notificationCounter++}`;
  }

  /**
   * Show grouped notification
   */
  private showGroupedNotification(tag: string, callback?: NotificationCallback): void {
    const notifications = this.groupedNotifications.get(tag);
    if (!notifications || notifications.length === 0) {
      return;
    }

    this.groupedNotifications.delete(tag);
    this.groupTimers.delete(tag);

    if (notifications.length === 1) {
      // Only one notification, show normally
      this.showImmediate(notifications[0], callback);
    } else {
      // Multiple notifications, show summary
      const first = notifications[0];
      const count = notifications.length;

      this.showImmediate(
        {
          ...first,
          title: first.title,
          body: `${count} items: ${notifications.map((n) => n.body).join(', ')}`.slice(0, 200),
          tag: undefined, // Prevent re-grouping
        },
        callback
      );
    }
  }

  /**
   * Close a notification
   */
  close(id: string): void {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(id);
    }
  }

  /**
   * Close all notifications
   */
  closeAll(): void {
    for (const notification of this.activeNotifications.values()) {
      notification.close();
    }
    this.activeNotifications.clear();
  }

  /**
   * Get notification history
   */
  getHistory(): typeof this.notificationHistory {
    return [...this.notificationHistory];
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.notificationHistory.filter((n) => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notificationHistory.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    for (const notification of this.notificationHistory) {
      notification.read = true;
    }
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory = [];
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    const { enabled, startHour, startMinute, endHour, endMinute } = this.preferences.quietHours;

    if (!enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 14:00 - 18:00)
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Handle notification interaction
   */
  private handleNotificationInteraction(
    id: string,
    action: 'click' | 'close' | 'action' | 'reply',
    data?: { actionId?: string; reply?: string }
  ): void {
    // Mark as read on any interaction except close
    if (action !== 'close') {
      this.markAsRead(id);
    }

    // Focus app on click
    if (action === 'click') {
      const windows = BrowserWindow.getAllWindows();
      const mainWindow = windows[0];
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
      }
    }

    console.log(`[NotificationManager] Notification ${id} - ${action}`, data);
  }
}

// Singleton instance
let notificationManager: NotificationManager | null = null;

/**
 * Get or create the notification manager instance
 */
export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }
  return notificationManager;
}

/**
 * Initialize the notification manager with preferences
 */
export function initializeNotifications(
  preferences?: Partial<NotificationPreferences>
): NotificationManager {
  notificationManager = new NotificationManager(preferences);
  return notificationManager;
}

/**
 * Show a simple notification
 */
export function showNotification(
  title: string,
  body: string,
  options?: Partial<ExtendedNotificationOptions>,
  callback?: NotificationCallback
): string | null {
  return getNotificationManager().show(
    {
      title,
      body,
      ...options,
    },
    callback
  );
}

/**
 * Show a success notification
 */
export function showSuccessNotification(
  title: string,
  body: string,
  callback?: NotificationCallback
): string | null {
  return getNotificationManager().show(
    {
      type: 'success',
      title,
      body,
    },
    callback
  );
}

/**
 * Show an error notification
 */
export function showErrorNotification(
  title: string,
  body: string,
  callback?: NotificationCallback
): string | null {
  return getNotificationManager().show(
    {
      type: 'error',
      title,
      body,
      urgency: 'critical',
    },
    callback
  );
}

/**
 * Show a file operation notification
 */
export function showFileOperationNotification(
  operation: 'save' | 'export' | 'import' | 'open',
  fileName: string,
  success: boolean,
  error?: string,
  callback?: NotificationCallback
): string | null {
  const titles: Record<string, { success: string; error: string }> = {
    save: { success: 'File Saved', error: 'Save Failed' },
    export: { success: 'Export Complete', error: 'Export Failed' },
    import: { success: 'Import Complete', error: 'Import Failed' },
    open: { success: 'File Opened', error: 'Open Failed' },
  };

  const title = success ? titles[operation].success : titles[operation].error;
  const body = success ? fileName : `${fileName}: ${error || 'Unknown error'}`;

  return getNotificationManager().show(
    {
      type: 'file-operation',
      title,
      body,
      urgency: success ? 'normal' : 'critical',
    },
    callback
  );
}

/**
 * Show a batch operation notification
 */
export function showBatchOperationNotification(
  operation: string,
  successCount: number,
  totalCount: number,
  callback?: NotificationCallback
): string | null {
  const allSucceeded = successCount === totalCount;
  const title = allSucceeded ? `${operation} Complete` : `${operation} Completed with Errors`;
  const body = allSucceeded
    ? `Successfully processed ${totalCount} files`
    : `${successCount} of ${totalCount} files processed successfully`;

  return getNotificationManager().show(
    {
      type: 'batch-operation',
      title,
      body,
      tag: `batch-${operation.toLowerCase().replace(/\s+/g, '-')}`,
    },
    callback
  );
}
