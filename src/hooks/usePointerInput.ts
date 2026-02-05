import { useCallback, useRef, useState } from 'react';

export interface PointerPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface UsePointerInputOptions {
  /** Minimum distance between points to register (for performance) */
  minDistance?: number;
  /** Enable pressure sensitivity */
  pressureSensitivity?: boolean;
  /** Palm rejection threshold (ignore touches larger than this) */
  palmRejectionSize?: number;
}

export interface UsePointerInputResult {
  /** Current points being captured */
  points: PointerPoint[];
  /** Whether currently drawing */
  isDrawing: boolean;
  /** Start capture on pointer down */
  handlePointerDown: (e: React.PointerEvent) => void;
  /** Continue capture on pointer move */
  handlePointerMove: (e: React.PointerEvent) => void;
  /** End capture on pointer up */
  handlePointerUp: (e: React.PointerEvent) => void;
  /** Cancel current capture */
  handlePointerCancel: () => void;
  /** Clear all points */
  clearPoints: () => void;
}

/**
 * Hook for unified pointer input handling (mouse, touch, stylus).
 * Supports pressure sensitivity and palm rejection.
 */
export function usePointerInput(
  options: UsePointerInputOptions = {}
): UsePointerInputResult {
  const {
    minDistance = 2,
    pressureSensitivity = true,
    palmRejectionSize = 50,
  } = options;

  const [points, setPoints] = useState<PointerPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  // Use a ref to track drawing state synchronously (React state is async)
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<PointerPoint | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const getPointFromEvent = useCallback(
    (e: React.PointerEvent): PointerPoint => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: pressureSensitivity ? e.pressure || 0.5 : 0.5,
        timestamp: e.timeStamp,
      };
    },
    [pressureSensitivity]
  );

  const shouldRejectTouch = useCallback(
    (e: React.PointerEvent): boolean => {
      // Palm rejection: reject large touch contacts
      if (e.pointerType === 'touch') {
        const width = e.width || 0;
        const height = e.height || 0;
        if (width > palmRejectionSize || height > palmRejectionSize) {
          return true;
        }
      }
      return false;
    },
    [palmRejectionSize]
  );

  const isMinDistanceMet = useCallback(
    (point: PointerPoint): boolean => {
      if (!lastPointRef.current) return true;
      const dx = point.x - lastPointRef.current.x;
      const dy = point.y - lastPointRef.current.y;
      return Math.sqrt(dx * dx + dy * dy) >= minDistance;
    },
    [minDistance]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (shouldRejectTouch(e)) return;

      // Only track one pointer at a time
      if (pointerIdRef.current !== null) return;

      pointerIdRef.current = e.pointerId;
      const point = getPointFromEvent(e);

      // Update ref synchronously so move events work immediately
      isDrawingRef.current = true;
      setIsDrawing(true);
      setPoints([point]);
      lastPointRef.current = point;

      // Capture pointer for continued tracking
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getPointFromEvent, shouldRejectTouch]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Use ref for synchronous check (React state is async)
      if (!isDrawingRef.current || e.pointerId !== pointerIdRef.current) return;
      if (shouldRejectTouch(e)) return;

      const point = getPointFromEvent(e);

      if (isMinDistanceMet(point)) {
        setPoints((prev) => [...prev, point]);
        lastPointRef.current = point;
      }
    },
    [getPointFromEvent, shouldRejectTouch, isMinDistanceMet]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;

      // Release pointer capture
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }

      isDrawingRef.current = false;
      setIsDrawing(false);
      pointerIdRef.current = null;
      lastPointRef.current = null;
    },
    []
  );

  const handlePointerCancel = useCallback(() => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    setPoints([]);
    pointerIdRef.current = null;
    lastPointRef.current = null;
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    lastPointRef.current = null;
  }, []);

  return {
    points,
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    clearPoints,
  };
}
