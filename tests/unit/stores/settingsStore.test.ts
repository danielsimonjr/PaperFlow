import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '@stores/settingsStore';

describe('settingsStore', () => {
  const defaultSettings = {
    defaultZoom: 100,
    defaultViewMode: 'single' as const,
    smoothScrolling: true,
    autoSave: true,
    autoSaveInterval: 30,
    defaultHighlightColor: '#FFEB3B',
    defaultAnnotationOpacity: 0.5,
    savedSignatures: [],
  };

  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState(defaultSettings);
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSettingsStore.getState();

      expect(state.defaultZoom).toBe(100);
      expect(state.defaultViewMode).toBe('single');
      expect(state.smoothScrolling).toBe(true);
      expect(state.autoSave).toBe(true);
      expect(state.autoSaveInterval).toBe(30);
      expect(state.defaultHighlightColor).toBe('#FFEB3B');
      expect(state.defaultAnnotationOpacity).toBe(0.5);
      expect(state.savedSignatures).toEqual([]);
    });
  });

  describe('zoom settings', () => {
    it('should set default zoom', () => {
      useSettingsStore.getState().setDefaultZoom(150);
      expect(useSettingsStore.getState().defaultZoom).toBe(150);
    });

    it('should clamp zoom to minimum', () => {
      useSettingsStore.getState().setDefaultZoom(5);
      expect(useSettingsStore.getState().defaultZoom).toBe(10);
    });

    it('should clamp zoom to maximum', () => {
      useSettingsStore.getState().setDefaultZoom(500);
      expect(useSettingsStore.getState().defaultZoom).toBe(400);
    });
  });

  describe('view mode settings', () => {
    it('should set default view mode to continuous', () => {
      useSettingsStore.getState().setDefaultViewMode('continuous');
      expect(useSettingsStore.getState().defaultViewMode).toBe('continuous');
    });

    it('should set default view mode to spread', () => {
      useSettingsStore.getState().setDefaultViewMode('spread');
      expect(useSettingsStore.getState().defaultViewMode).toBe('spread');
    });
  });

  describe('scrolling settings', () => {
    it('should toggle smooth scrolling', () => {
      useSettingsStore.getState().setSmoothScrolling(false);
      expect(useSettingsStore.getState().smoothScrolling).toBe(false);

      useSettingsStore.getState().setSmoothScrolling(true);
      expect(useSettingsStore.getState().smoothScrolling).toBe(true);
    });
  });

  describe('auto-save settings', () => {
    it('should toggle auto-save', () => {
      useSettingsStore.getState().setAutoSave(false);
      expect(useSettingsStore.getState().autoSave).toBe(false);
    });

    it('should set auto-save interval', () => {
      useSettingsStore.getState().setAutoSaveInterval(60);
      expect(useSettingsStore.getState().autoSaveInterval).toBe(60);
    });

    it('should clamp auto-save interval to minimum', () => {
      useSettingsStore.getState().setAutoSaveInterval(5);
      expect(useSettingsStore.getState().autoSaveInterval).toBe(10);
    });

    it('should clamp auto-save interval to maximum', () => {
      useSettingsStore.getState().setAutoSaveInterval(600);
      expect(useSettingsStore.getState().autoSaveInterval).toBe(300);
    });
  });

  describe('annotation settings', () => {
    it('should set default highlight color', () => {
      useSettingsStore.getState().setDefaultHighlightColor('#4CAF50');
      expect(useSettingsStore.getState().defaultHighlightColor).toBe('#4CAF50');
    });

    it('should set annotation opacity', () => {
      useSettingsStore.getState().setDefaultAnnotationOpacity(0.8);
      expect(useSettingsStore.getState().defaultAnnotationOpacity).toBe(0.8);
    });

    it('should clamp opacity to minimum', () => {
      useSettingsStore.getState().setDefaultAnnotationOpacity(0.05);
      expect(useSettingsStore.getState().defaultAnnotationOpacity).toBe(0.1);
    });

    it('should clamp opacity to maximum', () => {
      useSettingsStore.getState().setDefaultAnnotationOpacity(1.5);
      expect(useSettingsStore.getState().defaultAnnotationOpacity).toBe(1);
    });
  });

  describe('signature management', () => {
    it('should add signature', () => {
      useSettingsStore.getState().addSignature('base64-signature-data');
      expect(useSettingsStore.getState().savedSignatures).toContain('base64-signature-data');
    });

    it('should remove signature by index', () => {
      useSettingsStore.setState({
        ...defaultSettings,
        savedSignatures: ['sig1', 'sig2', 'sig3'],
      });

      useSettingsStore.getState().removeSignature(1);
      expect(useSettingsStore.getState().savedSignatures).toEqual(['sig1', 'sig3']);
    });
  });

  describe('reset to defaults', () => {
    it('should reset all settings to defaults', () => {
      // Change some settings
      useSettingsStore.setState({
        defaultZoom: 200,
        defaultViewMode: 'spread',
        smoothScrolling: false,
        autoSave: false,
        autoSaveInterval: 120,
        defaultHighlightColor: '#E91E63',
        defaultAnnotationOpacity: 0.9,
        savedSignatures: ['sig1'],
      });

      // Reset
      useSettingsStore.getState().resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.defaultZoom).toBe(100);
      expect(state.defaultViewMode).toBe('single');
      expect(state.smoothScrolling).toBe(true);
      expect(state.autoSave).toBe(true);
      expect(state.autoSaveInterval).toBe(30);
      expect(state.defaultHighlightColor).toBe('#FFEB3B');
      expect(state.defaultAnnotationOpacity).toBe(0.5);
      expect(state.savedSignatures).toEqual([]);
    });
  });
});
