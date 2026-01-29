import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useTouchGestures } from '@hooks/useTouchGestures';

describe('useTouchGestures', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
    vi.clearAllMocks();
  });

  it('does not add event listeners when disabled', () => {
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: false,
        onPinchZoom: vi.fn(),
      });
      return ref;
    });

    expect(result.current.current).toBe(element);
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
  });

  it('attaches touch event listeners when enabled', () => {
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onPinchZoom: vi.fn(),
      });
      return ref;
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onPinchZoom: vi.fn(),
      });
      return ref;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  it('calls onPinchZoom during two-finger gesture', () => {
    const onPinchZoom = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onPinchZoom,
      });
      return ref;
    });

    // Simulate two-finger touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        { identifier: 0, clientX: 100, clientY: 100 } as Touch,
        { identifier: 1, clientX: 200, clientY: 200 } as Touch,
      ],
    });
    element.dispatchEvent(touchStartEvent);

    // Simulate pinch (fingers moving apart)
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [
        { identifier: 0, clientX: 50, clientY: 50 } as Touch,
        { identifier: 1, clientX: 250, clientY: 250 } as Touch,
      ],
    });
    element.dispatchEvent(touchMoveEvent);

    expect(onPinchZoom).toHaveBeenCalled();
  });

  it('calls onSwipeLeft on left swipe', () => {
    const onSwipeLeft = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onSwipeLeft,
        swipeThreshold: 50,
      });
      return ref;
    });

    // Simulate single touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 200, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Simulate swipe left (end x < start x by more than threshold)
    const touchEndEvent = new TouchEvent('touchend', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: 50, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeLeft).toHaveBeenCalled();
  });

  it('calls onSwipeRight on right swipe', () => {
    const onSwipeRight = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onSwipeRight,
        swipeThreshold: 50,
      });
      return ref;
    });

    // Simulate single touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 50, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Simulate swipe right (end x > start x by more than threshold)
    const touchEndEvent = new TouchEvent('touchend', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: 200, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it('calls onLongPress after long press delay', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onLongPress,
        longPressDelay: 500,
      });
      return ref;
    });

    // Simulate touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 100, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Advance time past long press threshold
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onLongPress).toHaveBeenCalledWith(100, 100);
    vi.useRealTimers();
  });

  it('cancels long press on touch move', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onLongPress,
        longPressDelay: 500,
      });
      return ref;
    });

    // Simulate touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 100, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Move finger before long press triggers
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ identifier: 0, clientX: 150, clientY: 150 } as Touch],
    });
    element.dispatchEvent(touchMoveEvent);

    // Advance past long press time
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('calls onPan during single-finger drag', () => {
    const onPan = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onPan,
      });
      return ref;
    });

    // Simulate touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 100, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Simulate pan
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ identifier: 0, clientX: 120, clientY: 130 } as Touch],
    });
    element.dispatchEvent(touchMoveEvent);

    expect(onPan).toHaveBeenCalledWith(20, 30);
  });

  it('does not trigger swipe for small movements', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    renderHook(() => {
      const ref = useRef<HTMLDivElement | null>(element);
      useTouchGestures(ref, {
        enabled: true,
        onSwipeLeft,
        onSwipeRight,
        swipeThreshold: 50,
      });
      return ref;
    });

    // Simulate single touch start
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ identifier: 0, clientX: 100, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchStartEvent);

    // Small movement (less than threshold)
    const touchEndEvent = new TouchEvent('touchend', {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: 130, clientY: 100 } as Touch],
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
