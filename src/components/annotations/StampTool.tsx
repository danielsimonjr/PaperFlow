import { useCallback, useState } from 'react';
import { useAnnotationStore } from '@stores/annotationStore';
import { getStampById, DEFAULT_STAMP_WIDTH, DEFAULT_STAMP_HEIGHT } from '@/constants/stamps';

interface StampToolProps {
  /** Page index (0-based) */
  pageIndex: number;
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current zoom scale */
  scale: number;
  /** Page height in PDF points */
  pageHeight: number;
  /** Whether stamp tool is active */
  isActive: boolean;
  /** Selected stamp type */
  stampType: string;
  /** Custom stamp text (for custom stamps) */
  customText?: string;
  /** Custom stamp color */
  customColor?: string;
}

/**
 * Stamp placement tool with preview on hover.
 */
export function StampTool({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
  isActive,
  stampType,
  customText,
  customColor,
}: StampToolProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const addAnnotation = useAnnotationStore((state) => state.addAnnotation);

  // Get stamp configuration
  const stampConfig = getStampById(stampType);
  const displayText = customText || stampConfig?.text || 'STAMP';
  const displayColor = customColor || stampConfig?.color || '#374151';
  const backgroundColor = stampConfig?.backgroundColor || '#D1D5DB';
  const borderColor = stampConfig?.borderColor || '#9CA3AF';

  // Calculate stamp dimensions based on text
  const stampWidth = DEFAULT_STAMP_WIDTH;
  const stampHeight = DEFAULT_STAMP_HEIGHT;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isActive) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [isActive]);

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isActive || !mousePosition) return;

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to PDF coordinates (center of stamp)
      const pdfX = (x - stampWidth / 2) / scale;
      const pdfY = pageHeight - (y + stampHeight / 2) / scale;

      addAnnotation({
        type: 'stamp',
        pageIndex,
        rects: [],
        color: displayColor,
        opacity: 1,
        stampType: stampType as 'approved' | 'rejected' | 'confidential' | 'draft' | 'custom',
        position: { x: pdfX, y: pdfY },
        scale: 1,
        rotation: 0,
        customText: stampType === 'custom' ? customText : undefined,
        backgroundColor,
        borderColor,
      });
    },
    [
      isActive,
      mousePosition,
      stampWidth,
      stampHeight,
      scale,
      pageHeight,
      pageIndex,
      displayColor,
      stampType,
      customText,
      backgroundColor,
      borderColor,
      addAnnotation,
    ]
  );

  if (!isActive) {
    return null;
  }

  return (
    <svg
      className="absolute left-0 top-0 cursor-pointer"
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Stamp preview following cursor */}
      {mousePosition && (
        <g
          transform={`translate(${mousePosition.x - stampWidth / 2}, ${mousePosition.y - stampHeight / 2})`}
          opacity={0.7}
        >
          <rect
            x={0}
            y={0}
            width={stampWidth}
            height={stampHeight}
            fill={backgroundColor}
            stroke={borderColor}
            strokeWidth={2}
            rx={4}
          />
          <text
            x={stampWidth / 2}
            y={stampHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={displayColor}
            fontSize="14"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {displayText}
          </text>
        </g>
      )}
    </svg>
  );
}
