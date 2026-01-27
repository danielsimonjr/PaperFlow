import { useCallback, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface UseSignatureInputOptions {
  onStart?: (point: Point) => void;
  onMove?: (point: Point) => void;
  onEnd?: () => void;
  pressureSensitivity?: boolean;
}

/**
 * Hook for handling mouse, touch, and stylus input for signature drawing.
 * Supports pressure sensitivity for stylus input.
 */
export function useSignatureInput(options: UseSignatureInputOptions = {}) {
  const { onStart, onMove, onEnd, pressureSensitivity = true } = options;

  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getPointFromEvent = useCallback(
    (e: MouseEvent | TouchEvent | PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;
      let pressure = 0.5;

      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0];
        if (!touch) return { x: 0, y: 0 };
        clientX = touch.clientX;
        clientY = touch.clientY;
        // Some touch devices support pressure via force
        if ('force' in touch) {
          pressure = (touch as Touch & { force: number }).force;
        }
      } else if ('pressure' in e) {
        // Pointer event (supports pressure for stylus)
        clientX = e.clientX;
        clientY = e.clientY;
        if (pressureSensitivity && e.pressure > 0) {
          pressure = e.pressure;
        }
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        pressure: pressureSensitivity ? pressure : undefined,
      };
    },
    [pressureSensitivity]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDrawing(true);

      // Capture pointer for consistent tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const point = getPointFromEvent(e.nativeEvent);
      onStart?.(point);
    },
    [getPointFromEvent, onStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      const point = getPointFromEvent(e.nativeEvent);
      onMove?.(point);
    },
    [isDrawing, getPointFromEvent, onMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      setIsDrawing(false);

      // Release pointer capture
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      onEnd?.();
    },
    [isDrawing, onEnd]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      setIsDrawing(false);

      // Release pointer capture
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if capture already released
      }

      onEnd?.();
    },
    [isDrawing, onEnd]
  );

  // For touch events (fallback)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);

      const point = getPointFromEvent(e.nativeEvent);
      onStart?.(point);
    },
    [getPointFromEvent, onStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const point = getPointFromEvent(e.nativeEvent);
      onMove?.(point);
    },
    [isDrawing, getPointFromEvent, onMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    onEnd?.();
  }, [isDrawing, onEnd]);

  // For mouse events (fallback)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDrawing(true);

      const point = getPointFromEvent(e.nativeEvent);
      onStart?.(point);
    },
    [getPointFromEvent, onStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;

      const point = getPointFromEvent(e.nativeEvent);
      onMove?.(point);
    },
    [isDrawing, getPointFromEvent, onMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;

    setIsDrawing(false);
    onEnd?.();
  }, [isDrawing, onEnd]);

  return {
    canvasRef,
    isDrawing,
    // Pointer events (preferred - works for mouse, touch, and stylus)
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    },
    // Touch events (fallback)
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    // Mouse events (fallback)
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}
