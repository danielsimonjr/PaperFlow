import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard, copyToClipboard } from '@hooks/useClipboard';

describe('useClipboard', () => {
  let originalClipboard: Clipboard | undefined;

  beforeEach(() => {
    // Save original clipboard
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    // Restore original clipboard
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    }
    vi.restoreAllMocks();
  });

  describe('useClipboard hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useClipboard());

      expect(result.current.copied).toBe(false);
      expect(result.current.copying).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should successfully copy text using modern API', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useClipboard());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyText('Hello World');
      });

      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('Hello World');
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should call onCopySuccess callback', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const onCopySuccess = vi.fn();
      const { result } = renderHook(() => useClipboard({ onCopySuccess }));

      await act(async () => {
        await result.current.copyText('Test');
      });

      expect(onCopySuccess).toHaveBeenCalled();
    });

    it('should handle copy error', async () => {
      const error = new Error('Copy failed');
      const writeTextMock = vi.fn().mockRejectedValue(error);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const onCopyError = vi.fn();
      const { result } = renderHook(() => useClipboard({ onCopyError }));

      let success: boolean = true;
      await act(async () => {
        success = await result.current.copyText('Test');
      });

      expect(success).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toEqual(error);
      expect(onCopyError).toHaveBeenCalledWith(error);
    });

    it('should return false for empty text', async () => {
      const { result } = renderHook(() => useClipboard());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.copyText('');
      });

      expect(success).toBe(false);
    });

    it('should reset copied state after timeout', async () => {
      vi.useFakeTimers();

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() =>
        useClipboard({ successTimeout: 1000 })
      );

      await act(async () => {
        await result.current.copyText('Test');
      });

      expect(result.current.copied).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copied).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('copyToClipboard function', () => {
    it('should successfully copy text', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const success = await copyToClipboard('Test text');

      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('Test text');
    });

    it('should return false for empty text', async () => {
      const success = await copyToClipboard('');
      expect(success).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const success = await copyToClipboard('Test');

      expect(success).toBe(false);
    });
  });
});
