import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { usePointerInput, type PointerPoint } from '@hooks/usePointerInput';

interface DrawingCanvasProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current zoom scale */
  scale: number;
  /** Whether drawing mode is active */
  isActive: boolean;
  /** Callback when stroke is completed */
  onStrokeComplete?: (points: PointerPoint[]) => void;
}

/**
 * Canvas overlay for freehand drawing with smooth bezier curves.
 * Supports touch, mouse, and stylus input with pressure sensitivity.
 */
export function DrawingCanvas({
  pageIndex,
  width,
  height,
  scale,
  isActive,
  onStrokeComplete,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [devicePixelRatio] = useState(() => window.devicePixelRatio || 1);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  const {
    points,
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    clearPoints,
  } = usePointerInput({
    minDistance: 2,
    pressureSensitivity: true,
    palmRejectionSize: 50,
  });

  // Initialize offscreen canvas for persistent strokes
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    offscreen.width = width * devicePixelRatio;
    offscreen.height = height * devicePixelRatio;

    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }, [width, height, devicePixelRatio]);

  // Setup main canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size for high-DPI displays
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }, [width, height, devicePixelRatio]);

  // Draw smooth bezier curve through points
  const drawSmoothLine = useCallback(
    (ctx: CanvasRenderingContext2D, pointsArray: PointerPoint[]) => {
      if (pointsArray.length < 2) return;

      ctx.strokeStyle = activeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Use quadratic curves for smooth lines
      ctx.beginPath();
      const firstPoint = pointsArray[0]!;
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < pointsArray.length - 1; i++) {
        const p1 = pointsArray[i]!;
        const p2 = pointsArray[i + 1]!;

        // Calculate control point for smooth curve
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Variable stroke width based on pressure
        const pressure = p1.pressure || 0.5;
        ctx.lineWidth = activeStrokeWidth * (0.5 + pressure);

        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }

      // Draw last segment
      if (pointsArray.length > 1) {
        const lastPoint = pointsArray[pointsArray.length - 1]!;
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }

      ctx.stroke();
    },
    [activeColor, activeStrokeWidth]
  );

  // Render current stroke in real-time
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw
    ctx.clearRect(0, 0, width, height);

    // Draw offscreen canvas (completed strokes)
    ctx.drawImage(offscreen, 0, 0, width, height);

    // Draw current stroke
    if (isDrawing && points.length > 0) {
      drawSmoothLine(ctx, points);
    }
  }, [points, isDrawing, width, height, drawSmoothLine]);

  // Handle stroke completion
  const handleStrokeEnd = useCallback(
    (e: React.PointerEvent) => {
      handlePointerUp(e);

      if (points.length >= 2) {
        // Save stroke to offscreen canvas
        const offscreen = offscreenCanvasRef.current;
        if (offscreen) {
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            drawSmoothLine(ctx, points);
          }
        }

        // Create annotation
        const drawingPaths = [{
          points: points.map((p) => ({
            x: p.x / scale, // Store in PDF coordinates
            y: p.y / scale,
            pressure: p.pressure,
          })),
        }];

        addAnnotation({
          type: 'drawing',
          pageIndex,
          rects: [], // Drawings don't use rects
          color: activeColor,
          opacity: 1,
          paths: drawingPaths,
          strokeWidth: activeStrokeWidth,
        });

        onStrokeComplete?.(points);
      }

      clearPoints();
    },
    [
      points,
      handlePointerUp,
      clearPoints,
      drawSmoothLine,
      addAnnotation,
      pageIndex,
      activeColor,
      activeStrokeWidth,
      scale,
      onStrokeComplete,
    ]
  );

  if (!isActive) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 top-0 cursor-crosshair touch-none"
      style={{
        width,
        height,
        pointerEvents: isActive ? 'auto' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleStrokeEnd}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
    />
  );
}
