import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureOptions {
  onPinchZoom?: (scale: number) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: (x: number, y: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  enabled?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  startScale: number;
  isMultiTouch: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
}

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  options: TouchGestureOptions
) {
  const {
    onPinchZoom,
    onSwipeLeft,
    onSwipeRight,
    onLongPress,
    onPan,
    enabled = true,
    swipeThreshold = 50,
    longPressDelay = 500,
  } = options;

  const stateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    startScale: 1,
    isMultiTouch: false,
    longPressTimer: null,
  });

  const clearLongPress = useCallback(() => {
    const state = stateRef.current;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;
      clearLongPress();

      if (e.touches.length === 2) {
        // Pinch gesture start
        state.isMultiTouch = true;
        state.startDistance = getDistance(e.touches[0]!, e.touches[1]!);
        state.startScale = 1;
      } else if (e.touches.length === 1) {
        state.isMultiTouch = false;
        state.startX = e.touches[0]!.clientX;
        state.startY = e.touches[0]!.clientY;

        // Long press detection
        if (onLongPress) {
          state.longPressTimer = setTimeout(() => {
            onLongPress(state.startX, state.startY);
          }, longPressDelay);
        }
      }
    },
    [clearLongPress, onLongPress, longPressDelay]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;
      clearLongPress();

      if (e.touches.length === 2 && state.isMultiTouch && onPinchZoom) {
        // Pinch zoom
        const currentDistance = getDistance(e.touches[0]!, e.touches[1]!);
        const scale = currentDistance / state.startDistance;
        onPinchZoom(scale);
        e.preventDefault();
      } else if (e.touches.length === 1 && !state.isMultiTouch && onPan) {
        const deltaX = e.touches[0]!.clientX - state.startX;
        const deltaY = e.touches[0]!.clientY - state.startY;
        onPan(deltaX, deltaY);
      }
    },
    [clearLongPress, onPinchZoom, onPan]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const state = stateRef.current;
      clearLongPress();

      if (!state.isMultiTouch && e.changedTouches.length === 1) {
        const endX = e.changedTouches[0]!.clientX;
        const deltaX = endX - state.startX;
        const endY = e.changedTouches[0]!.clientY;
        const deltaY = endY - state.startY;

        // Only trigger swipe if horizontal movement is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      if (e.touches.length === 0) {
        state.isMultiTouch = false;
      }
    },
    [clearLongPress, swipeThreshold, onSwipeLeft, onSwipeRight]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearLongPress();
    };
  }, [elementRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPress]);
}
