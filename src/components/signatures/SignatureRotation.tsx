import { useState, useCallback, useRef, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { useSignatureStore, type PlacedSignature } from '@stores/signatureStore';

interface SignatureRotationProps {
  signature: PlacedSignature;
  scale: number;
}

// Common angles to snap to
const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SNAP_THRESHOLD = 5;

/**
 * Rotation handle component for placed signatures.
 */
export function SignatureRotation({ signature, scale }: SignatureRotationProps) {
  const [isRotating, setIsRotating] = useState(false);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const startAngleRef = useRef<number>(0);

  const selectedPlacedId = useSignatureStore((state) => state.selectedPlacedId);
  const updatePlacedSignature = useSignatureStore((state) => state.updatePlacedSignature);

  const isSelected = selectedPlacedId === signature.id;

  // Calculate center of signature
  const centerX = (signature.position.x + signature.size.width / 2) * scale;
  const centerY = (signature.position.y + signature.size.height / 2) * scale;

  // Handle offset
  const handleOffset = 30;

  const handleRotateStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsRotating(true);
      centerRef.current = { x: centerX, y: centerY };

      // Calculate initial angle
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      startAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI) - signature.rotation;
    },
    [centerX, centerY, signature.rotation]
  );

  // Handle mouse move for rotation
  useEffect(() => {
    if (!isRotating || !centerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - centerRef.current!.x;
      const dy = e.clientY - centerRef.current!.y;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) - startAngleRef.current;

      // Normalize to 0-360
      angle = ((angle % 360) + 360) % 360;

      // Snap to common angles if close
      for (const snapAngle of SNAP_ANGLES) {
        const diff = Math.abs(angle - snapAngle);
        if (diff < SNAP_THRESHOLD || diff > 360 - SNAP_THRESHOLD) {
          angle = snapAngle;
          break;
        }
      }

      updatePlacedSignature(signature.id, { rotation: angle });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      centerRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, signature.id, updatePlacedSignature]);

  if (!isSelected) return null;

  // Calculate rotated handle position
  const rotationRad = (signature.rotation * Math.PI) / 180;
  const rotatedHandleX = centerX + Math.cos(rotationRad - Math.PI / 2) * ((signature.size.height / 2 + handleOffset) * scale);
  const rotatedHandleY = centerY + Math.sin(rotationRad - Math.PI / 2) * ((signature.size.height / 2 + handleOffset) * scale);

  return (
    <>
      {/* Line from center to handle */}
      <svg className="pointer-events-none absolute left-0 top-0 z-30 h-full w-full overflow-visible" style={{ position: 'absolute' }}>
        <line x1={centerX} y1={centerY} x2={rotatedHandleX} y2={rotatedHandleY} stroke="#3B82F6" strokeWidth="1" strokeDasharray="4 2" />
      </svg>

      {/* Rotation handle */}
      <div
        className="absolute z-30 flex h-6 w-6 cursor-grab items-center justify-center rounded-full border-2 border-primary-500 bg-white shadow-md active:cursor-grabbing"
        style={{
          left: rotatedHandleX - 12,
          top: rotatedHandleY - 12,
        }}
        onMouseDown={handleRotateStart}
        title={`Rotation: ${Math.round(signature.rotation)}°`}
      >
        <RotateCw size={12} className="text-primary-500" />
      </div>

      {/* Rotation indicator */}
      {isRotating && (
        <div
          className="absolute z-40 rounded bg-black/75 px-2 py-1 text-xs text-white"
          style={{
            left: centerX - 20,
            top: centerY + (signature.size.height * scale) / 2 + 20,
          }}
        >
          {Math.round(signature.rotation)}°
        </div>
      )}
    </>
  );
}
