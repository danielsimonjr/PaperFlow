import { useCallback, useEffect, useRef } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface DrawingCanvasProps {
  pageIndex: number;
  width: number;
  height: number;
  scale: number;
  pageHeight: number;
  isActive: boolean;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Canvas overlay for freehand drawing.
 * Handles pointer events with proper high-DPI support.
 */
export function DrawingCanvas({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const lastPosRef = useRef<Point | null>(null);
  const dprRef = useRef(1);

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Setup canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    // Get device pixel ratio for high-DPI support
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    // Set canvas internal resolution (scaled for DPI)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Get 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Store context in ref for use in event handlers
    ctxRef.current = ctx;

    // Scale context to match DPI
    ctx.scale(dpr, dpr);
  }, [width, height, isActive]);

  // Get coordinates from pointer event
  const getCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Draw a dot at the given position
  const drawDot = useCallback((pos: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const radius = Math.max(activeStrokeWidth, 2);

    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }, [activeColor, activeStrokeWidth]);

  // Draw a line between two points
  const drawLine = useCallback((from: Point, to: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = activeStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [activeColor, activeStrokeWidth]);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer for reliable tracking
    canvas.setPointerCapture(e.pointerId);

    const pos = getCoords(e);
    isDrawingRef.current = true;
    pointsRef.current = [pos];
    lastPosRef.current = pos;

    // Draw initial dot
    drawDot(pos);
  }, [getCoords, drawDot]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const pos = getCoords(e);

    if (lastPosRef.current) {
      drawLine(lastPosRef.current, pos);
    }

    pointsRef.current.push(pos);
    lastPosRef.current = pos;
  }, [getCoords, drawLine]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const pointCount = pointsRef.current.length;

    if (pointCount >= 1) {
      addAnnotation({
        type: 'drawing',
        pageIndex,
        rects: [],
        color: activeColor,
        opacity: 1,
        paths: [{
          points: pointsRef.current.map((p) => ({
            // Convert screen coordinates to PDF coordinates
            // PDF has origin at bottom-left, screen has origin at top-left
            x: p.x / scale,
            y: pageHeight - p.y / scale,
            pressure: 0.5,
          })),
        }],
        strokeWidth: activeStrokeWidth,
      });
    }

    isDrawingRef.current = false;
    pointsRef.current = [];
    lastPosRef.current = null;
  }, [addAnnotation, pageIndex, activeColor, activeStrokeWidth, scale, pageHeight]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    isDrawingRef.current = false;
    pointsRef.current = [];
    lastPosRef.current = null;
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 50,
        pointerEvents: 'auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width,
          height,
          cursor: 'crosshair',
          touchAction: 'none',
          display: 'block',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}
