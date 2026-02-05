import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';

interface DrawingCanvasProps {
  pageIndex: number;
  width: number;
  height: number;
  scale: number;
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
  isActive,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const lastPosRef = useRef<Point | null>(null);
  const dprRef = useRef(1);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeStrokeWidth = useAnnotationStore((state) => state.activeStrokeWidth ?? 2);
  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Setup canvas with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setDebugInfo('ERROR: No canvas ref');
      return;
    }

    if (!isActive) {
      setDebugInfo('Inactive');
      return;
    }

    // Get device pixel ratio for high-DPI support
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    // Set canvas internal resolution (scaled for DPI)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // Get 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDebugInfo('ERROR: No 2D context');
      return;
    }

    // Store context in ref for use in event handlers
    ctxRef.current = ctx;

    // Scale context to match DPI
    ctx.scale(dpr, dpr);

    // Draw a large, obvious test pattern
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(10, 10, 80, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('DRAW HERE', 15, 35);

    // Draw corner markers
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, 0, 20, 20);
    ctx.fillRect(width - 20, 0, 20, 20);
    ctx.fillRect(0, height - 20, 20, 20);
    ctx.fillRect(width - 20, height - 20, 20, 20);

    setDebugInfo(`Ready: ${width}x${height} @${dpr}x DPI`);

    // Log to console for debugging
    console.log('[DrawingCanvas] Setup complete:', {
      width,
      height,
      dpr,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      hasContext: !!ctx,
    });
  }, [width, height, isActive]);

  // Get coordinates from pointer event
  const getCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return { x, y };
  }, []);

  // Draw a dot at the given position
  const drawDot = useCallback((pos: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) {
      console.log('[DrawingCanvas] drawDot: No context');
      return;
    }

    const radius = Math.max(activeStrokeWidth * 2, 8);

    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    console.log('[DrawingCanvas] Drew dot at', pos, 'color:', activeColor, 'radius:', radius);
  }, [activeColor, activeStrokeWidth]);

  // Draw a line between two points
  const drawLine = useCallback((from: Point, to: Point) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = Math.max(activeStrokeWidth, 4);
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

    setDebugInfo(`Down: ${Math.round(pos.x)},${Math.round(pos.y)} [${e.pointerType}]`);
    console.log('[DrawingCanvas] Pointer down:', pos, 'type:', e.pointerType);
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

    setDebugInfo(`Move: ${Math.round(pos.x)},${Math.round(pos.y)} pts:${pointsRef.current.length}`);
  }, [getCoords, drawLine]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const pointCount = pointsRef.current.length;
    setDebugInfo(`Done: ${pointCount} points saved`);
    console.log('[DrawingCanvas] Pointer up, saving', pointCount, 'points');

    if (pointCount >= 1) {
      addAnnotation({
        type: 'drawing',
        pageIndex,
        rects: [],
        color: activeColor,
        opacity: 1,
        paths: [{
          points: pointsRef.current.map((p) => ({
            x: p.x / scale,
            y: p.y / scale,
            pressure: 0.5,
          })),
        }],
        strokeWidth: activeStrokeWidth,
      });
    }

    isDrawingRef.current = false;
    pointsRef.current = [];
    lastPosRef.current = null;
  }, [addAnnotation, pageIndex, activeColor, activeStrokeWidth, scale]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    isDrawingRef.current = false;
    pointsRef.current = [];
    lastPosRef.current = null;
    setDebugInfo('Cancelled');
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
        zIndex: 1000,  // Very high z-index
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
          backgroundColor: 'rgba(255, 200, 0, 0.1)', // Light orange tint
          display: 'block',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      {/* Debug overlay */}
      <div style={{
        position: 'absolute',
        top: 5,
        right: 5,
        background: 'rgba(0,0,0,0.9)',
        color: '#0f0',
        padding: '6px 10px',
        fontSize: '12px',
        pointerEvents: 'none',
        fontFamily: 'monospace',
        borderRadius: '4px',
        whiteSpace: 'pre',
      }}>
        {debugInfo}
      </div>
    </div>
  );
}
