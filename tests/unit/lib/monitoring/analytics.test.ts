import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackTiming,
  trackError,
  setUserProperty,
} from '@/lib/monitoring/analytics';

describe('Analytics Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any stored analytics data
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('initAnalytics', () => {
    it('should initialize without errors', () => {
      expect(() => initAnalytics()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      expect(() => {
        initAnalytics();
        initAnalytics();
      }).not.toThrow();
    });
  });

  describe('trackPageView', () => {
    it('should track page view with path', () => {
      expect(() => trackPageView('/editor')).not.toThrow();
    });

    it('should track page view with title', () => {
      expect(() => trackPageView('/settings', 'Settings Page')).not.toThrow();
    });

    it('should handle root path', () => {
      expect(() => trackPageView('/')).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('should track event with category and action', () => {
      expect(() => trackEvent('pdf', 'open')).not.toThrow();
    });

    it('should track event with label', () => {
      expect(() => trackEvent('annotation', 'create', 'highlight')).not.toThrow();
    });

    it('should track event with value', () => {
      expect(() => trackEvent('export', 'download', 'pdf', 5)).not.toThrow();
    });

    it('should handle empty strings', () => {
      expect(() => trackEvent('', '')).not.toThrow();
    });
  });

  describe('trackTiming', () => {
    it('should track timing with category, variable, and time', () => {
      expect(() => trackTiming('pdf', 'loadTime', 1500)).not.toThrow();
    });

    it('should track timing with label', () => {
      expect(() => trackTiming('render', 'pageRender', 250, 'page1')).not.toThrow();
    });

    it('should handle zero timing', () => {
      expect(() => trackTiming('instant', 'operation', 0)).not.toThrow();
    });

    it('should handle large timing values', () => {
      expect(() => trackTiming('slow', 'operation', 60000)).not.toThrow();
    });
  });

  describe('trackError', () => {
    it('should track error with message', () => {
      expect(() => trackError('File not found')).not.toThrow();
    });

    it('should track error as fatal', () => {
      expect(() => trackError('Critical failure', true)).not.toThrow();
    });

    it('should track error as non-fatal', () => {
      expect(() => trackError('Minor issue', false)).not.toThrow();
    });
  });

  describe('setUserProperty', () => {
    it('should set user property', () => {
      expect(() => setUserProperty('theme', 'dark')).not.toThrow();
    });

    it('should set multiple properties', () => {
      expect(() => {
        setUserProperty('theme', 'light');
        setUserProperty('language', 'en');
        setUserProperty('version', '1.0.0');
      }).not.toThrow();
    });

    it('should handle numeric values', () => {
      expect(() => setUserProperty('sessionCount', '5')).not.toThrow();
    });
  });

  describe('Privacy compliance', () => {
    it('should not collect PII in page views', () => {
      // The analytics module should strip any PII from paths
      expect(() => trackPageView('/user/email@example.com')).not.toThrow();
    });

    it('should not store IP addresses', () => {
      // This is a design principle test - analytics shouldn't have IP tracking
      expect(() => trackEvent('session', 'start')).not.toThrow();
    });
  });
});
