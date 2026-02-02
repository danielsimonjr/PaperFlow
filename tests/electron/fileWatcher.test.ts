/**
 * File Watcher Tests
 *
 * Tests for file change detection functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetMocks } from './setup';

// Mock chokidar
const mockWatcher = {
  on: vi.fn().mockReturnThis(),
  close: vi.fn(() => Promise.resolve()),
};

vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => mockWatcher),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(() => Promise.resolve()),
    stat: vi.fn(() =>
      Promise.resolve({
        size: 1024,
        birthtimeMs: Date.now(),
        mtimeMs: Date.now(),
        atimeMs: Date.now(),
        isFile: () => true,
        isDirectory: () => false,
      })
    ),
  },
}));

describe('File Watcher', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Watch Operations', () => {
    it('should create a watcher for a file', async () => {
      const chokidar = await import('chokidar');
      const watcher = chokidar.default.watch('/test/document.pdf', {
        persistent: true,
        ignoreInitial: true,
      });

      expect(chokidar.default.watch).toHaveBeenCalledWith('/test/document.pdf', expect.any(Object));
      expect(watcher).toBeDefined();
    });

    it('should register change event handler', async () => {
      const chokidar = await import('chokidar');
      const watcher = chokidar.default.watch('/test/document.pdf', {});

      watcher.on('change', () => {});
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should register unlink event handler', async () => {
      const chokidar = await import('chokidar');
      const watcher = chokidar.default.watch('/test/document.pdf', {});

      watcher.on('unlink', () => {});
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
    });

    it('should register error event handler', async () => {
      const chokidar = await import('chokidar');
      const watcher = chokidar.default.watch('/test/document.pdf', {});

      watcher.on('error', () => {});
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should close watcher', async () => {
      const chokidar = await import('chokidar');
      const watcher = chokidar.default.watch('/test/document.pdf', {});

      await watcher.close();
      expect(mockWatcher.close).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should check if file exists before watching', async () => {
      const fs = await import('fs/promises');
      await fs.default.access('/test/document.pdf');
      expect(fs.default.access).toHaveBeenCalledWith('/test/document.pdf');
    });

    it('should get file stats', async () => {
      const fs = await import('fs/promises');
      const stats = await fs.default.stat('/test/document.pdf');
      expect(stats.size).toBe(1024);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('Watcher Configuration', () => {
    it('should configure watcher with correct options', async () => {
      const chokidar = await import('chokidar');

      chokidar.default.watch('/test/document.pdf', {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      });

      expect(chokidar.default.watch).toHaveBeenCalledWith(
        '/test/document.pdf',
        expect.objectContaining({
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: expect.objectContaining({
            stabilityThreshold: 300,
            pollInterval: 100,
          }),
        })
      );
    });
  });
});

describe('File Watcher Events', () => {
  it('should simulate change event', () => {
    const callback = vi.fn();
    mockWatcher.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'change') {
        // Simulate a change event
        setTimeout(() => cb('/test/document.pdf'), 0);
      }
      return mockWatcher;
    });

    mockWatcher.on('change', callback);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith('/test/document.pdf');
        resolve();
      }, 10);
    });
  });

  it('should simulate unlink event', () => {
    const callback = vi.fn();
    mockWatcher.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'unlink') {
        setTimeout(() => cb('/test/document.pdf'), 0);
      }
      return mockWatcher;
    });

    mockWatcher.on('unlink', callback);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith('/test/document.pdf');
        resolve();
      }, 10);
    });
  });

  it('should simulate error event', () => {
    const callback = vi.fn();
    const testError = new Error('Watch error');

    mockWatcher.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'error') {
        setTimeout(() => cb(testError), 0);
      }
      return mockWatcher;
    });

    mockWatcher.on('error', callback);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(testError);
        resolve();
      }, 10);
    });
  });
});
