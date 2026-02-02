/**
 * System Tray Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetMocks, mockTray } from './setup';

// Get instance of the mock tray object
const getMockTrayInstance = () => {
  // mockTray is a constructor mock, get the last instance
  const calls = mockTray.mock.results;
  if (calls.length > 0) {
    return calls[calls.length - 1].value;
  }
  return null;
};

// Import after mocks are set up in setup.ts
import { TrayManager, getTrayManager, destroyTray } from '../../electron/tray';

describe('TrayManager', () => {
  let trayManager: TrayManager;

  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    mockTray.mockClear();
    trayManager = new TrayManager();
  });

  afterEach(() => {
    if (trayManager) {
      trayManager.destroy();
    }
  });

  describe('initialization', () => {
    it('should not be initialized initially', () => {
      expect(trayManager.isReady()).toBe(false);
    });

    it('should initialize system tray', async () => {
      await trayManager.initialize();
      expect(trayManager.isReady()).toBe(true);
    });

    it('should create Tray instance on initialize', async () => {
      await trayManager.initialize();
      expect(mockTray).toHaveBeenCalled();
    });

    it('should set default tooltip on initialize', async () => {
      await trayManager.initialize();
      const instance = getMockTrayInstance();
      expect(instance?.setToolTip).toHaveBeenCalled();
    });

    it('should set up event handlers on initialize', async () => {
      await trayManager.initialize();
      const instance = getMockTrayInstance();
      expect(instance?.on).toHaveBeenCalledWith('click', expect.any(Function));
      expect(instance?.on).toHaveBeenCalledWith('double-click', expect.any(Function));
      expect(instance?.on).toHaveBeenCalledWith('right-click', expect.any(Function));
    });

    it('should not re-initialize if already initialized', async () => {
      await trayManager.initialize();
      await trayManager.initialize();
      expect(mockTray).toHaveBeenCalledTimes(1);
    });
  });

  describe('status management', () => {
    beforeEach(async () => {
      await trayManager.initialize();
    });

    it('should start with idle status', () => {
      expect(trayManager.getStatus()).toBe('idle');
    });

    it('should update status', () => {
      trayManager.setStatus('busy');
      expect(trayManager.getStatus()).toBe('busy');
    });

    it('should update icon when status changes', () => {
      const instance = getMockTrayInstance();
      trayManager.setStatus('notification');
      expect(instance?.setImage).toHaveBeenCalled();
    });

    it('should update tooltip when status changes', () => {
      const instance = getMockTrayInstance();
      trayManager.setStatus('error');
      expect(instance?.setToolTip).toHaveBeenCalled();
    });
  });

  describe('notification count', () => {
    beforeEach(async () => {
      await trayManager.initialize();
    });

    it('should start with zero notification count', () => {
      expect(trayManager.getNotificationCount()).toBe(0);
    });

    it('should increment notification count', () => {
      trayManager.incrementNotificationCount();
      expect(trayManager.getNotificationCount()).toBe(1);
    });

    it('should set notification count directly', () => {
      trayManager.setNotificationCount(5);
      expect(trayManager.getNotificationCount()).toBe(5);
    });

    it('should clear notification count', () => {
      trayManager.setNotificationCount(10);
      trayManager.clearNotificationCount();
      expect(trayManager.getNotificationCount()).toBe(0);
    });

    it('should change status to notification when count > 0', () => {
      trayManager.setNotificationCount(1);
      expect(trayManager.getStatus()).toBe('notification');
    });

    it('should change status back to idle when count = 0', () => {
      trayManager.setNotificationCount(5);
      trayManager.clearNotificationCount();
      expect(trayManager.getStatus()).toBe('idle');
    });
  });

  describe('progress tracking', () => {
    beforeEach(async () => {
      await trayManager.initialize();
    });

    it('should set progress info', () => {
      const instance = getMockTrayInstance();
      trayManager.setProgress({
        operation: 'Saving',
        percent: 50,
        detail: 'document.pdf',
      });

      expect(trayManager.getStatus()).toBe('busy');
      expect(instance?.setToolTip).toHaveBeenCalled();
    });

    it('should clear progress and return to idle', () => {
      trayManager.setProgress({
        operation: 'Saving',
        percent: 50,
      });
      trayManager.setProgress(null);

      expect(trayManager.getStatus()).toBe('idle');
    });
  });

  describe('tooltip', () => {
    beforeEach(async () => {
      await trayManager.initialize();
    });

    it('should set custom tooltip', () => {
      const instance = getMockTrayInstance();
      trayManager.setTooltip('Custom tooltip');
      expect(instance?.setToolTip).toHaveBeenCalledWith('Custom tooltip');
    });
  });

  describe('flash', () => {
    beforeEach(async () => {
      await trayManager.initialize();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should flash tray icon', () => {
      const instance = getMockTrayInstance();
      trayManager.flash(500);

      // Should toggle icon
      vi.advanceTimersByTime(250);
      expect(instance?.setImage).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy tray', async () => {
      await trayManager.initialize();
      const instance = getMockTrayInstance();
      trayManager.destroy();

      expect(instance?.destroy).toHaveBeenCalled();
      expect(trayManager.isReady()).toBe(false);
    });
  });

  describe('event callbacks', () => {
    it('should call onTrayClick callback', async () => {
      const onTrayClick = vi.fn();
      const manager = new TrayManager({ onTrayClick });
      await manager.initialize();

      // Get the click handler from the mock instance
      const instance = getMockTrayInstance();
      const clickHandler = instance?.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'click'
      )?.[1] as (() => void) | undefined;

      clickHandler?.();
      expect(onTrayClick).toHaveBeenCalled();
      manager.destroy();
    });

    it('should call onTrayDoubleClick callback', async () => {
      const onTrayDoubleClick = vi.fn();
      const manager = new TrayManager({ onTrayDoubleClick });
      await manager.initialize();

      const instance = getMockTrayInstance();
      const doubleClickHandler = instance?.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'double-click'
      )?.[1] as (() => void) | undefined;

      doubleClickHandler?.();
      expect(onTrayDoubleClick).toHaveBeenCalled();
      manager.destroy();
    });

    it('should call onTrayRightClick callback', async () => {
      const onTrayRightClick = vi.fn();
      const manager = new TrayManager({ onTrayRightClick });
      await manager.initialize();

      const instance = getMockTrayInstance();
      const rightClickHandler = instance?.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'right-click'
      )?.[1] as (() => void) | undefined;

      rightClickHandler?.();
      expect(onTrayRightClick).toHaveBeenCalled();
      manager.destroy();
    });
  });
});

describe('Tray singleton', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
    destroyTray();
  });

  it('should return same instance from getTrayManager', () => {
    const instance1 = getTrayManager();
    const instance2 = getTrayManager();
    expect(instance1).toBe(instance2);
  });
});
