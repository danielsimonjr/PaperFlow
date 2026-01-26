import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      sidebarOpen: true,
      sidebarWidth: 256,
      activeDialog: null,
      darkMode: false,
    });
    // Clean up dark mode class
    document.documentElement.classList.remove('dark');
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUIStore.getState();

      expect(state.sidebarOpen).toBe(true);
      expect(state.sidebarWidth).toBe(256);
      expect(state.activeDialog).toBeNull();
      expect(state.darkMode).toBe(false);
    });
  });

  describe('sidebar controls', () => {
    it('should toggle sidebar', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar width within bounds', () => {
      useUIStore.getState().setSidebarWidth(300);
      expect(useUIStore.getState().sidebarWidth).toBe(300);
    });

    it('should clamp sidebar width to minimum', () => {
      useUIStore.getState().setSidebarWidth(100);
      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });

    it('should clamp sidebar width to maximum', () => {
      useUIStore.getState().setSidebarWidth(500);
      expect(useUIStore.getState().sidebarWidth).toBe(400);
    });
  });

  describe('dialog controls', () => {
    it('should open dialog', () => {
      useUIStore.getState().openDialog('settings');
      expect(useUIStore.getState().activeDialog).toBe('settings');
    });

    it('should close dialog', () => {
      useUIStore.setState({ activeDialog: 'settings' });
      useUIStore.getState().closeDialog();
      expect(useUIStore.getState().activeDialog).toBeNull();
    });
  });

  describe('dark mode', () => {
    it('should toggle dark mode', () => {
      useUIStore.getState().toggleDarkMode();
      expect(useUIStore.getState().darkMode).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      useUIStore.getState().toggleDarkMode();
      expect(useUIStore.getState().darkMode).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should set dark mode directly', () => {
      useUIStore.getState().setDarkMode(true);
      expect(useUIStore.getState().darkMode).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      useUIStore.getState().setDarkMode(false);
      expect(useUIStore.getState().darkMode).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
