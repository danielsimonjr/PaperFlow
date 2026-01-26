import { useCallback, useState } from 'react';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RotationHandleProps {
  /** Center X coordinate of the shape */
  centerX: number;
  /** Center Y coordinate of the shape */
  centerY: number;
  /** Shape bounds for positioning the handle */
  bounds: Bounds;
  /** Current rotation in degrees */
  currentRotation: number;
  /** Callback when rotation changes */
  onRotate: (rotation: number) => void;
}

/**
 * Rotation handle for shape manipulation.
 * Positioned above the shape, supports Shift key for 15° snapping.
 */
export function RotationHandle({
  centerX,
  centerY,
  bounds,
  currentRotation,
  onRotate,
}: RotationHandleProps) {
  const [isRotating, setIsRotating] = useState(false);

  // Handle offset above the shape
  const handleOffset = 25;
  const handleY = bounds.y - handleOffset;
  const handleX = centerX;

  // Calculate rotated handle position
  const rotatedPosition = useCallback(() => {
    const angleRad = (currentRotation * Math.PI) / 180;
    const dx = handleX - centerX;
    const dy = handleY - centerY;

    return {
      x: centerX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
      y: centerY + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
    };
  }, [centerX, centerY, handleX, handleY, currentRotation]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      setIsRotating(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Calculate angle from center to mouse position
        const dx = moveEvent.clientX - centerX;
        const dy = moveEvent.clientY - centerY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // Offset by 90° since handle is above

        // Normalize to 0-360 range
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;

        // Snap to 15° increments if Shift is held
        if (moveEvent.shiftKey) {
          angle = Math.round(angle / 15) * 15;
        }

        onRotate(angle);
      };

      const handleMouseUp = () => {
        setIsRotating(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [centerX, centerY, onRotate]
  );

  const pos = rotatedPosition();

  return (
    <g className="pointer-events-auto">
      {/* Line connecting shape to handle */}
      <line
        x1={centerX}
        y1={bounds.y}
        x2={pos.x}
        y2={pos.y}
        stroke="#3B82F6"
        strokeWidth={1}
        strokeDasharray="2 2"
        transform={`rotate(${currentRotation} ${centerX} ${centerY})`}
        pointerEvents="none"
      />

      {/* Rotation handle circle */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={6}
        fill={isRotating ? '#3B82F6' : 'white'}
        stroke="#3B82F6"
        strokeWidth={2}
        cursor="grab"
        onMouseDown={handleMouseDown}
      />

      {/* Rotation icon inside the handle */}
      <g
        transform={`translate(${pos.x}, ${pos.y})`}
        pointerEvents="none"
      >
        <path
          d="M-3,-1 A3,3 0 1 1 -1,3 M-1,3 L1,2 M-1,3 L0,5"
          fill="none"
          stroke={isRotating ? 'white' : '#3B82F6'}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
