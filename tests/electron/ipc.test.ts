/**
 * IPC Channel and Handler Tests
 */

import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS, IPC_EVENTS } from '../../electron/ipc/channels';

describe('IPC Channels', () => {
  describe('IPC_CHANNELS', () => {
    it('should define platform info channels', () => {
      expect(IPC_CHANNELS.GET_PLATFORM_INFO).toBe('get-platform-info');
      expect(IPC_CHANNELS.GET_APP_PATH).toBe('get-app-path');
      expect(IPC_CHANNELS.GET_APP_VERSION).toBe('get-app-version');
    });

    it('should define file operation channels', () => {
      expect(IPC_CHANNELS.FILE_OPEN).toBe('file-open');
      expect(IPC_CHANNELS.FILE_SAVE).toBe('file-save');
      expect(IPC_CHANNELS.FILE_SAVE_AS).toBe('file-save-as');
      expect(IPC_CHANNELS.FILE_READ).toBe('file-read');
      expect(IPC_CHANNELS.FILE_EXISTS).toBe('file-exists');
      expect(IPC_CHANNELS.FILE_GET_RECENT).toBe('file-get-recent');
      expect(IPC_CHANNELS.FILE_ADD_RECENT).toBe('file-add-recent');
      expect(IPC_CHANNELS.FILE_CLEAR_RECENT).toBe('file-clear-recent');
    });

    it('should define dialog channels', () => {
      expect(IPC_CHANNELS.DIALOG_OPEN_FILE).toBe('dialog-open-file');
      expect(IPC_CHANNELS.DIALOG_SAVE_FILE).toBe('dialog-save-file');
      expect(IPC_CHANNELS.DIALOG_MESSAGE).toBe('dialog-message');
    });

    it('should define window channels', () => {
      expect(IPC_CHANNELS.WINDOW_MINIMIZE).toBe('window-minimize');
      expect(IPC_CHANNELS.WINDOW_MAXIMIZE).toBe('window-maximize');
      expect(IPC_CHANNELS.WINDOW_CLOSE).toBe('window-close');
      expect(IPC_CHANNELS.WINDOW_IS_MAXIMIZED).toBe('window-is-maximized');
      expect(IPC_CHANNELS.WINDOW_SET_TITLE).toBe('window-set-title');
    });

    it('should define shell channels', () => {
      expect(IPC_CHANNELS.SHELL_OPEN_EXTERNAL).toBe('shell-open-external');
      expect(IPC_CHANNELS.SHELL_OPEN_PATH).toBe('shell-open-path');
      expect(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER).toBe('shell-show-item-in-folder');
      expect(IPC_CHANNELS.SHELL_TRASH_ITEM).toBe('shell-trash-item');
    });

    it('should define clipboard channels', () => {
      expect(IPC_CHANNELS.CLIPBOARD_READ_TEXT).toBe('clipboard-read-text');
      expect(IPC_CHANNELS.CLIPBOARD_WRITE_TEXT).toBe('clipboard-write-text');
      expect(IPC_CHANNELS.CLIPBOARD_READ_IMAGE).toBe('clipboard-read-image');
      expect(IPC_CHANNELS.CLIPBOARD_WRITE_IMAGE).toBe('clipboard-write-image');
    });

    it('should define notification channel', () => {
      expect(IPC_CHANNELS.NOTIFICATION_SHOW).toBe('notification-show');
    });

    it('should define system channels', () => {
      expect(IPC_CHANNELS.SYSTEM_GET_MEMORY_INFO).toBe('system-get-memory-info');
    });

    it('should have unique channel names', () => {
      const values = Object.values(IPC_CHANNELS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('IPC_EVENTS', () => {
    it('should define file events', () => {
      expect(IPC_EVENTS.FILE_OPENED).toBe('file-opened');
      expect(IPC_EVENTS.FILE_SAVED).toBe('file-saved');
    });

    it('should define window events', () => {
      expect(IPC_EVENTS.WINDOW_FOCUS).toBe('window-focus');
      expect(IPC_EVENTS.WINDOW_BLUR).toBe('window-blur');
      expect(IPC_EVENTS.WINDOW_ENTER_FULLSCREEN).toBe('window-enter-fullscreen');
      expect(IPC_EVENTS.WINDOW_LEAVE_FULLSCREEN).toBe('window-leave-fullscreen');
    });

    it('should define app events', () => {
      expect(IPC_EVENTS.APP_BEFORE_QUIT).toBe('app-before-quit');
      expect(IPC_EVENTS.APP_SECOND_INSTANCE).toBe('app-second-instance');
    });

    it('should define menu events', () => {
      expect(IPC_EVENTS.MENU_FILE_NEW).toBe('menu-file-new');
      expect(IPC_EVENTS.MENU_FILE_OPEN).toBe('menu-file-open');
      expect(IPC_EVENTS.MENU_FILE_SAVE).toBe('menu-file-save');
      expect(IPC_EVENTS.MENU_FILE_SAVE_AS).toBe('menu-file-save-as');
      expect(IPC_EVENTS.MENU_EDIT_UNDO).toBe('menu-edit-undo');
      expect(IPC_EVENTS.MENU_EDIT_REDO).toBe('menu-edit-redo');
      expect(IPC_EVENTS.MENU_VIEW_ZOOM_IN).toBe('menu-view-zoom-in');
      expect(IPC_EVENTS.MENU_VIEW_ZOOM_OUT).toBe('menu-view-zoom-out');
      expect(IPC_EVENTS.MENU_VIEW_ZOOM_RESET).toBe('menu-view-zoom-reset');
    });

    it('should have unique event names', () => {
      const values = Object.values(IPC_EVENTS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });
});
