import { useCallback, useRef, useState } from 'react';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandlePosition =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

interface ResizeHandlesProps {
  /** Current bounds in screen coordinates */
  bounds: Bounds;
  /** Current rotation in degrees */
  rotation?: number;
  /** Callback when resize occurs */
  onResize: (newBounds: Bounds) => void;
  /** Handle size in pixels */
  handleSize?: number;
}

const HANDLE_POSITIONS: HandlePosition[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/**
 * Corner and edge resize handles for shape manipulation.
 * Supports aspect ratio locking with Shift key.
 */
export function ResizeHandles({
  bounds,
  rotation = 0,
  onResize,
  handleSize = 8,
}: ResizeHandlesProps) {
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  // Use refs to avoid stale closure issues in event handlers
  const startBoundsRef = useRef<Bounds | null>(null);
  const startMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate handle positions
  const getHandlePosition = useCallback(
    (position: HandlePosition) => {
      const { x, y, width, height } = bounds;

      switch (position) {
        case 'nw':
          return { x, y };
        case 'n':
          return { x: x + width / 2, y };
        case 'ne':
          return { x: x + width, y };
        case 'e':
          return { x: x + width, y: y + height / 2 };
        case 'se':
          return { x: x + width, y: y + height };
        case 's':
          return { x: x + width / 2, y: y + height };
        case 'sw':
          return { x, y: y + height };
        case 'w':
          return { x, y: y + height / 2 };
        default:
          return { x, y };
      }
    },
    [bounds]
  );

  // Get cursor style for handle
  const getCursor = useCallback((position: HandlePosition) => {
    const cursors: Record<HandlePosition, string> = {
      nw: 'nwse-resize',
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
    };
    return cursors[position];
  }, []);

  const handleMouseDown = useCallback(
    (position: HandlePosition, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setActiveHandle(position);
      startBoundsRef.current = { ...bounds };
      startMouseRef.current = { x: e.clientX, y: e.clientY };

      // Add document-level event listeners
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const startBounds = startBoundsRef.current;
        const startMouse = startMouseRef.current;
        if (!startBounds || !startMouse) return;

        const dx = moveEvent.clientX - startMouse.x;
        const dy = moveEvent.clientY - startMouse.y;
        const shiftKey = moveEvent.shiftKey;

        const newBounds = { ...startBounds };

        // Calculate new bounds based on handle position
        switch (position) {
          case 'nw':
            newBounds.x = startBounds.x + dx;
            newBounds.y = startBounds.y + dy;
            newBounds.width = startBounds.width - dx;
            newBounds.height = startBounds.height - dy;
            break;
          case 'n':
            newBounds.y = startBounds.y + dy;
            newBounds.height = startBounds.height - dy;
            break;
          case 'ne':
            newBounds.y = startBounds.y + dy;
            newBounds.width = startBounds.width + dx;
            newBounds.height = startBounds.height - dy;
            break;
          case 'e':
            newBounds.width = startBounds.width + dx;
            break;
          case 'se':
            newBounds.width = startBounds.width + dx;
            newBounds.height = startBounds.height + dy;
            break;
          case 's':
            newBounds.height = startBounds.height + dy;
            break;
          case 'sw':
            newBounds.x = startBounds.x + dx;
            newBounds.width = startBounds.width - dx;
            newBounds.height = startBounds.height + dy;
            break;
          case 'w':
            newBounds.x = startBounds.x + dx;
            newBounds.width = startBounds.width - dx;
            break;
        }

        // Maintain aspect ratio if Shift is held
        if (shiftKey && ['nw', 'ne', 'se', 'sw'].includes(position)) {
          const aspectRatio = startBounds.width / startBounds.height;
          if (Math.abs(dx) > Math.abs(dy)) {
            newBounds.height = newBounds.width / aspectRatio;
          } else {
            newBounds.width = newBounds.height * aspectRatio;
          }
        }

        // Ensure minimum size
        newBounds.width = Math.max(10, newBounds.width);
        newBounds.height = Math.max(10, newBounds.height);

        onResize(newBounds);
      };

      const handleMouseUp = () => {
        setActiveHandle(null);
        startBoundsRef.current = null;
        startMouseRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [bounds, onResize]
  );

  // Calculate center for rotation transform
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const transform = rotation
    ? `rotate(${rotation} ${centerX} ${centerY})`
    : undefined;

  return (
    <g transform={transform}>
      {HANDLE_POSITIONS.map((position) => {
        const pos = getHandlePosition(position);
        const isCorner = ['nw', 'ne', 'se', 'sw'].includes(position);

        return (
          <rect
            key={position}
            x={pos.x - handleSize / 2}
            y={pos.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill={activeHandle === position ? '#3B82F6' : 'white'}
            stroke="#3B82F6"
            strokeWidth={1}
            cursor={getCursor(position)}
            rx={isCorner ? 0 : handleSize / 4}
            className="pointer-events-auto"
            onMouseDown={(e) => handleMouseDown(position, e)}
          />
        );
      })}
    </g>
  );
}
