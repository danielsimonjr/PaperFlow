import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '@hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardNavigation({ onEscape }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls onEnter when Enter is pressed', () => {
    const onEnter = vi.fn();
    renderHook(() => useKeyboardNavigation({ onEnter }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('calls onArrowUp when ArrowUp is pressed', () => {
    const onArrowUp = vi.fn();
    renderHook(() => useKeyboardNavigation({ onArrowUp }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(onArrowUp).toHaveBeenCalledTimes(1);
  });

  it('calls onArrowDown when ArrowDown is pressed', () => {
    const onArrowDown = vi.fn();
    renderHook(() => useKeyboardNavigation({ onArrowDown }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(onArrowDown).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', () => {
    const onEscape = vi.fn();
    renderHook(() => useKeyboardNavigation({ onEscape, enabled: false }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('calls onTab with shift state', () => {
    const onTab = vi.fn();
    renderHook(() => useKeyboardNavigation({ onTab }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
    expect(onTab).toHaveBeenCalledWith(true);
  });

  it('calls onArrowLeft on ArrowLeft', () => {
    const onArrowLeft = vi.fn();
    renderHook(() => useKeyboardNavigation({ onArrowLeft }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onArrowLeft).toHaveBeenCalledTimes(1);
  });

  it('calls onArrowRight on ArrowRight', () => {
    const onArrowRight = vi.fn();
    renderHook(() => useKeyboardNavigation({ onArrowRight }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onArrowRight).toHaveBeenCalledTimes(1);
  });
});
