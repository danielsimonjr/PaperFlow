/**
 * Notification Manager Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetMocks, mockNotification, mockBrowserWindow } from './setup';

// Import after mocks
import {
  NotificationManager,
  getNotificationManager,
  initializeNotifications,
  showNotification,
  showSuccessNotification,
  showErrorNotification,
  showFileOperationNotification,
  showBatchOperationNotification,
} from '../../electron/notifications';

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    notificationManager = new NotificationManager();

    // Mock BrowserWindow.getAllWindows to return a focused window
    mockBrowserWindow.getAllWindows.mockReturnValue([
      {
        isFocused: vi.fn(() => false),
        isMinimized: vi.fn(() => false),
        isVisible: vi.fn(() => true),
        restore: vi.fn(),
        show: vi.fn(),
        focus: vi.fn(),
      },
    ]);
  });

  describe('static methods', () => {
    it('should check if notifications are supported', () => {
      const supported = NotificationManager.isSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('preferences', () => {
    it('should have default preferences', () => {
      const prefs = notificationManager.getPreferences();

      expect(prefs.enabled).toBe(true);
      expect(prefs.soundEnabled).toBe(true);
      expect(prefs.showWhenFocused).toBe(false);
      expect(prefs.groupSimilar).toBe(true);
    });

    it('should update preferences', () => {
      notificationManager.setPreferences({ soundEnabled: false });
      const prefs = notificationManager.getPreferences();

      expect(prefs.soundEnabled).toBe(false);
    });

    it('should initialize with custom preferences', () => {
      const customManager = new NotificationManager({
        enabled: false,
        soundEnabled: false,
      });
      const prefs = customManager.getPreferences();

      expect(prefs.enabled).toBe(false);
      expect(prefs.soundEnabled).toBe(false);
    });
  });

  describe('show notification', () => {
    it('should show a notification', () => {
      const id = notificationManager.show({
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBeTruthy();
      expect(mockNotification).toHaveBeenCalled();
    });

    it('should return null if notifications are disabled', () => {
      notificationManager.setPreferences({ enabled: false });

      const id = notificationManager.show({
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBeNull();
    });

    it('should return null if notification type is disabled', () => {
      notificationManager.setPreferences({ enabledTypes: ['info'] });

      const id = notificationManager.show({
        type: 'error',
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBeNull();
    });

    it('should not show when app is focused and showWhenFocused is false', () => {
      mockBrowserWindow.getAllWindows.mockReturnValue([
        { isFocused: vi.fn(() => true) },
      ]);

      const id = notificationManager.show({
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBeNull();
    });

    it('should show when app is focused if showWhenFocused is true', () => {
      notificationManager.setPreferences({ showWhenFocused: true });
      mockBrowserWindow.getAllWindows.mockReturnValue([
        { isFocused: vi.fn(() => true) },
      ]);

      const id = notificationManager.show({
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBeTruthy();
    });

    it('should generate unique notification IDs', () => {
      const id1 = notificationManager.show({ title: 'Test 1', body: 'Body 1' });
      const id2 = notificationManager.show({ title: 'Test 2', body: 'Body 2' });

      expect(id1).not.toBe(id2);
    });

    it('should use provided notification ID', () => {
      const id = notificationManager.show({
        id: 'custom-id',
        title: 'Test',
        body: 'Test body',
      });

      expect(id).toBe('custom-id');
    });
  });

  describe('notification history', () => {
    it('should track notifications in history', () => {
      notificationManager.show({ title: 'Test', body: 'Body' });

      const history = notificationManager.getHistory();
      expect(history).toHaveLength(1);
    });

    it('should mark notifications as unread by default', () => {
      notificationManager.show({ title: 'Test', body: 'Body' });

      expect(notificationManager.getUnreadCount()).toBe(1);
    });

    it('should mark notification as read', () => {
      const id = notificationManager.show({ title: 'Test', body: 'Body' });
      if (id) {
        notificationManager.markAsRead(id);
      }

      expect(notificationManager.getUnreadCount()).toBe(0);
    });

    it('should mark all notifications as read', () => {
      notificationManager.show({ title: 'Test 1', body: 'Body 1' });
      notificationManager.show({ title: 'Test 2', body: 'Body 2' });

      notificationManager.markAllAsRead();

      expect(notificationManager.getUnreadCount()).toBe(0);
    });

    it('should clear history', () => {
      notificationManager.show({ title: 'Test', body: 'Body' });
      notificationManager.clearHistory();

      expect(notificationManager.getHistory()).toHaveLength(0);
    });

    it('should limit history to 100 entries', () => {
      for (let i = 0; i < 110; i++) {
        notificationManager.show({ title: `Test ${i}`, body: `Body ${i}` });
      }

      expect(notificationManager.getHistory().length).toBeLessThanOrEqual(100);
    });
  });

  describe('close notification', () => {
    it('should close a notification by ID', () => {
      const mockClose = vi.fn();
      mockNotification.mockImplementationOnce(() => ({
        show: vi.fn(),
        close: mockClose,
        on: vi.fn(),
      }));

      const id = notificationManager.show({ title: 'Test', body: 'Body' });
      if (id) {
        notificationManager.close(id);
      }

      expect(mockClose).toHaveBeenCalled();
    });

    it('should close all notifications', () => {
      const mockClose = vi.fn();
      mockNotification.mockImplementation(() => ({
        show: vi.fn(),
        close: mockClose,
        on: vi.fn(),
      }));

      notificationManager.show({ title: 'Test 1', body: 'Body 1' });
      notificationManager.show({ title: 'Test 2', body: 'Body 2' });

      notificationManager.closeAll();

      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('quiet hours', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should suppress notifications during quiet hours', () => {
      // Set time to 23:00
      vi.setSystemTime(new Date(2024, 0, 1, 23, 0, 0));

      notificationManager.setPreferences({
        quietHours: {
          enabled: true,
          startHour: 22,
          startMinute: 0,
          endHour: 8,
          endMinute: 0,
        },
      });

      const id = notificationManager.show({ title: 'Test', body: 'Body' });

      expect(id).toBeNull();
    });

    it('should allow notifications outside quiet hours', () => {
      // Set time to 12:00
      vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));

      notificationManager.setPreferences({
        quietHours: {
          enabled: true,
          startHour: 22,
          startMinute: 0,
          endHour: 8,
          endMinute: 0,
        },
      });

      const id = notificationManager.show({ title: 'Test', body: 'Body' });

      expect(id).toBeTruthy();
    });

    it('should not suppress notifications when quiet hours disabled', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 23, 0, 0));

      notificationManager.setPreferences({
        quietHours: {
          enabled: false,
          startHour: 22,
          startMinute: 0,
          endHour: 8,
          endMinute: 0,
        },
      });

      const id = notificationManager.show({ title: 'Test', body: 'Body' });

      expect(id).toBeTruthy();
    });
  });

  describe('callback handling', () => {
    it('should call callback on click', () => {
      const callback = vi.fn();
      let clickHandler: (() => void) | undefined;

      mockNotification.mockImplementationOnce(() => ({
        show: vi.fn(),
        on: vi.fn((event: string, handler: () => void) => {
          if (event === 'click') {
            clickHandler = handler;
          }
        }),
      }));

      notificationManager.show({ title: 'Test', body: 'Body' }, callback);

      // Simulate click
      clickHandler?.();

      expect(callback).toHaveBeenCalledWith('click');
    });

    it('should call callback on close', () => {
      const callback = vi.fn();
      let closeHandler: (() => void) | undefined;

      mockNotification.mockImplementationOnce(() => ({
        show: vi.fn(),
        on: vi.fn((event: string, handler: () => void) => {
          if (event === 'close') {
            closeHandler = handler;
          }
        }),
      }));

      notificationManager.show({ title: 'Test', body: 'Body' }, callback);

      // Simulate close
      closeHandler?.();

      expect(callback).toHaveBeenCalledWith('close');
    });
  });
});

describe('Notification helper functions', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    initializeNotifications();

    mockBrowserWindow.getAllWindows.mockReturnValue([
      { isFocused: vi.fn(() => false) },
    ]);
  });

  describe('showNotification', () => {
    it('should show a simple notification', () => {
      const id = showNotification('Title', 'Body');
      expect(id).toBeTruthy();
    });
  });

  describe('showSuccessNotification', () => {
    it('should show a success notification', () => {
      const id = showSuccessNotification('Success', 'Operation completed');
      expect(id).toBeTruthy();
    });
  });

  describe('showErrorNotification', () => {
    it('should show an error notification', () => {
      const id = showErrorNotification('Error', 'Something went wrong');
      expect(id).toBeTruthy();
    });
  });

  describe('showFileOperationNotification', () => {
    it('should show save success notification', () => {
      const id = showFileOperationNotification('save', 'document.pdf', true);
      expect(id).toBeTruthy();
    });

    it('should show save failure notification', () => {
      const id = showFileOperationNotification('save', 'document.pdf', false, 'Permission denied');
      expect(id).toBeTruthy();
    });

    it('should show export notification', () => {
      const id = showFileOperationNotification('export', 'images.zip', true);
      expect(id).toBeTruthy();
    });
  });

  describe('showBatchOperationNotification', () => {
    it('should show batch success notification', () => {
      const id = showBatchOperationNotification('Export', 5, 5);
      expect(id).toBeTruthy();
    });

    it('should show partial success notification', () => {
      const id = showBatchOperationNotification('Export', 3, 5);
      expect(id).toBeTruthy();
    });
  });
});

describe('Notification singleton', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should return same instance from getNotificationManager', () => {
    const instance1 = getNotificationManager();
    const instance2 = getNotificationManager();
    expect(instance1).toBe(instance2);
  });

  it('should create new instance with initializeNotifications', () => {
    // First get a manager
    getNotificationManager();
    // Then initialize with different prefs
    const instance2 = initializeNotifications({ soundEnabled: false });

    // New instance has different preferences
    expect(instance2.getPreferences().soundEnabled).toBe(false);
  });
});
