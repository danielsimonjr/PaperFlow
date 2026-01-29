import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/browser before importing the module
vi.mock('@sentry/browser', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Now import the module under test
import {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  isSentryEnabled,
  setTag,
} from '@/lib/monitoring/sentry';

describe('Sentry Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isSentryEnabled', () => {
    it('should return false when DSN is not configured', () => {
      // By default, VITE_SENTRY_DSN is undefined in test environment
      expect(isSentryEnabled()).toBe(false);
    });
  });

  describe('initSentry', () => {
    it('should not throw when called without DSN', async () => {
      await expect(initSentry()).resolves.not.toThrow();
    });
  });

  describe('captureError', () => {
    it('should log error to console when Sentry not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const context = { userId: '123', action: 'save' };

      captureError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('[Error]', error, context);
      consoleSpy.mockRestore();
    });

    it('should log error without context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      captureError(error);

      expect(consoleSpy).toHaveBeenCalledWith('[Error]', error, undefined);
      consoleSpy.mockRestore();
    });
  });

  describe('captureMessage', () => {
    it('should log message to console when Sentry not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      captureMessage('Test message', 'warning');

      expect(consoleSpy).toHaveBeenCalledWith('[WARNING]', 'Test message');
      consoleSpy.mockRestore();
    });

    it('should default to info level', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      captureMessage('Test message');

      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'Test message');
      consoleSpy.mockRestore();
    });
  });

  describe('setUser', () => {
    it('should not throw when Sentry not initialized', () => {
      expect(() => setUser('user-123')).not.toThrow();
    });
  });

  describe('clearUser', () => {
    it('should not throw when Sentry not initialized', () => {
      expect(() => clearUser()).not.toThrow();
    });
  });

  describe('addBreadcrumb', () => {
    it('should not throw when Sentry not initialized', () => {
      expect(() =>
        addBreadcrumb('navigation', 'User clicked save', { page: 'editor' }, 'info')
      ).not.toThrow();
    });

    it('should accept minimal parameters', () => {
      expect(() => addBreadcrumb('action', 'Button clicked')).not.toThrow();
    });
  });

  describe('setTag', () => {
    it('should not throw when Sentry not initialized', () => {
      expect(() => setTag('version', '1.0.0')).not.toThrow();
    });
  });
});
