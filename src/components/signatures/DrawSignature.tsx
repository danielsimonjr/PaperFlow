import { useRef, useCallback, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface DrawSignatureProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  lineWidth?: number;
  isInitials?: boolean;
}

type LineThickness = 'thin' | 'medium' | 'thick';

const LINE_WIDTHS: Record<LineThickness, number> = {
  thin: 2,
  medium: 3,
  thick: 5,
};

/**
 * Canvas component for drawing signatures with smooth bezier curves.
 * Supports mouse, touch, and stylus input.
 */
export function DrawSignature({
  onSignatureChange,
  width,
  height,
  isInitials = false,
}: DrawSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [thickness, setThickness] = useState<LineThickness>('medium');
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const canvasWidth = width ?? (isInitials ? 200 : 400);
  const canvasHeight = height ?? (isInitials ? 100 : 150);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual size in memory (scaled for DPR)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    // Set display size
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale for DPR
    ctx.scale(dpr, dpr);

    // Setup context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = LINE_WIDTHS[thickness];

    contextRef.current = ctx;

    // Clear canvas initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight, thickness]);

  // Update line width when thickness changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = LINE_WIDTHS[thickness];
    }
  }, [thickness]);

  const getPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // Draw smooth bezier curve through points
  const drawSmoothLine = useCallback(() => {
    const ctx = contextRef.current;
    const points = pointsRef.current;

    if (!ctx || points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);

    if (points.length === 2) {
      // Just draw a line for 2 points
      ctx.lineTo(points[1]!.x, points[1]!.y);
    } else {
      // Draw smooth curve through points
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i]!;
        const p2 = points[i + 1]!;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }

      // Draw last segment
      const lastPoint = points[points.length - 1]!;
      ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.stroke();
  }, []);

  const startDrawing = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const point = getPoint(e);
      if (!point) return;

      setIsDrawing(true);
      setHasContent(true);

      lastPointRef.current = point;
      pointsRef.current = [point];

      // Capture pointer
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getPoint]
  );

  const draw = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const point = getPoint(e);
      if (!point) return;

      pointsRef.current.push(point);

      // Keep only last few points for smooth drawing
      if (pointsRef.current.length > 5) {
        pointsRef.current = pointsRef.current.slice(-5);
      }

      drawSmoothLine();
      lastPointRef.current = point;
    },
    [isDrawing, getPoint, drawSmoothLine]
  );

  const stopDrawing = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      setIsDrawing(false);
      pointsRef.current = [];
      lastPointRef.current = null;

      // Release pointer
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      // Export signature
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureChange(canvas.toDataURL('image/png'));
      }
    },
    [isDrawing, onSignatureChange]
  );

  const clearCanvas = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    setHasContent(false);
    onSignatureChange(null);
  }, [canvasWidth, canvasHeight, onSignatureChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas */}
      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white dark:border-gray-600">
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair"
          style={{ width: canvasWidth, height: canvasHeight }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />

        {/* Placeholder text */}
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-400">
            {isInitials ? 'Draw your initials here' : 'Draw your signature here'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Line thickness */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Thickness:</span>
          <div className="flex gap-1">
            {(['thin', 'medium', 'thick'] as LineThickness[]).map((t) => (
              <button
                key={t}
                className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                  thickness === t
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
                onClick={() => setThickness(t)}
                title={t.charAt(0).toUpperCase() + t.slice(1)}
              >
                <div
                  className="rounded-full bg-current"
                  style={{
                    width: LINE_WIDTHS[t] * 2,
                    height: LINE_WIDTHS[t] * 2,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Clear button */}
        <Button variant="ghost" size="sm" onClick={clearCanvas} disabled={!hasContent}>
          <Trash2 size={14} className="mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
