import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '@hooks/useKeyboardNavigation';

describe('Keyboard Navigation Integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('supports full keyboard navigation cycle', () => {
    const handlers = {
      onEscape: vi.fn(),
      onEnter: vi.fn(),
      onArrowUp: vi.fn(),
      onArrowDown: vi.fn(),
      onArrowLeft: vi.fn(),
      onArrowRight: vi.fn(),
    };

    renderHook(() => useKeyboardNavigation(handlers));

    // Simulate a full navigation cycle
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(handlers.onArrowDown).toHaveBeenCalledTimes(2);
    expect(handlers.onEnter).toHaveBeenCalledTimes(1);
    expect(handlers.onEscape).toHaveBeenCalledTimes(1);
    expect(handlers.onArrowUp).toHaveBeenCalledTimes(1);
  });

  it('supports horizontal navigation', () => {
    const onArrowLeft = vi.fn();
    const onArrowRight = vi.fn();

    renderHook(() => useKeyboardNavigation({ onArrowLeft, onArrowRight }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

    expect(onArrowLeft).toHaveBeenCalledTimes(1);
    expect(onArrowRight).toHaveBeenCalledTimes(2);
  });

  it('toggle enabled/disabled', () => {
    const onEscape = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) => useKeyboardNavigation({ onEscape, enabled }),
      { initialProps: { enabled: true } }
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1);

    // Disable
    rerender({ enabled: false });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1); // no additional call

    // Re-enable
    rerender({ enabled: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(2);
  });
});
