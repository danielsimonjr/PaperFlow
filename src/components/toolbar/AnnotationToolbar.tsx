import { useCallback, useState } from 'react';
import {
  MousePointer2,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  StickyNote,
  ChevronDown,
  Pencil,
  Eraser,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  Stamp,
} from 'lucide-react';
import { useAnnotationStore, type ShapeType, type StampType } from '@stores/annotationStore';
import { HIGHLIGHT_COLORS } from '@components/annotations/SelectionPopup';
import { OpacitySlider } from '@components/annotations/OpacitySlider';
import { DrawingToolOptions } from '@components/annotations/DrawingToolOptions';
import { ShapeOptions } from '@components/annotations/ShapeOptions';
import { StampPicker } from '@components/annotations/StampPicker';
import type { AnnotationType } from '@/types';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, shortcut, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Shape tool icons mapping
const SHAPE_ICONS: Record<ShapeType, React.ComponentType<{ size?: number }>> = {
  rectangle: Square,
  ellipse: Circle,
  arrow: ArrowUpRight,
  line: Minus,
};

/**
 * Floating toolbar for annotation tools.
 */
export function AnnotationToolbar() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showDrawingOptions, setShowDrawingOptions] = useState(false);
  const [showShapeOptions, setShowShapeOptions] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);

  const activeTool = useAnnotationStore((state) => state.activeTool);
  const activeColor = useAnnotationStore((state) => state.activeColor);
  const activeOpacity = useAnnotationStore((state) => state.activeOpacity);
  const activeShapeType = useAnnotationStore((state) => state.activeShapeType);
  const activeStampType = useAnnotationStore((state) => state.activeStampType);
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const setActiveColor = useAnnotationStore((state) => state.setActiveColor);
  const setActiveOpacity = useAnnotationStore((state) => state.setActiveOpacity);
  const setActiveShapeType = useAnnotationStore((state) => state.setActiveShapeType);
  const setActiveStampType = useAnnotationStore((state) => state.setActiveStampType);

  const handleToolClick = useCallback(
    (tool: AnnotationType | null) => {
      setActiveTool(activeTool === tool ? null : tool);
      // Close all dropdowns
      setShowColorPicker(false);
      setShowOpacitySlider(false);
      setShowDrawingOptions(false);
      setShowShapeOptions(false);
      setShowStampPicker(false);
    },
    [activeTool, setActiveTool]
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      setActiveColor(color);
      setShowColorPicker(false);
    },
    [setActiveColor]
  );

  const handleShapeTypeSelect = useCallback(
    (shapeType: ShapeType) => {
      setActiveShapeType(shapeType);
      setActiveTool('shape');
    },
    [setActiveShapeType, setActiveTool]
  );

  const handleStampSelect = useCallback(
    (stampId: string) => {
      setActiveStampType(stampId as StampType);
      setActiveTool('stamp');
      setShowStampPicker(false);
    },
    [setActiveStampType, setActiveTool]
  );

  // Get the current shape icon
  const CurrentShapeIcon = SHAPE_ICONS[activeShapeType];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Select tool */}
      <ToolButton
        icon={<MousePointer2 size={16} />}
        label="Select"
        shortcut="V"
        isActive={activeTool === null}
        onClick={() => handleToolClick(null)}
      />

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Highlight tool with color picker */}
      <div className="relative flex">
        <ToolButton
          icon={<Highlighter size={16} style={{ color: activeColor }} />}
          label="Highlight"
          shortcut="H"
          isActive={activeTool === 'highlight'}
          onClick={() => handleToolClick('highlight')}
        />
        <button
          className="rounded-r px-1 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Choose color"
        >
          <ChevronDown size={12} />
        </button>

        {/* Color picker dropdown */}
        {showColorPicker && (
          <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-xs text-gray-500">Highlight Color</div>
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                    activeColor === color.value
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Underline tool */}
      <ToolButton
        icon={<UnderlineIcon size={16} />}
        label="Underline"
        shortcut="U"
        isActive={activeTool === 'underline'}
        onClick={() => handleToolClick('underline')}
      />

      {/* Strikethrough tool */}
      <ToolButton
        icon={<StrikethroughIcon size={16} />}
        label="Strikethrough"
        shortcut="S"
        isActive={activeTool === 'strikethrough'}
        onClick={() => handleToolClick('strikethrough')}
      />

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Note tool */}
      <ToolButton
        icon={<StickyNote size={16} />}
        label="Note"
        shortcut="N"
        isActive={activeTool === 'note'}
        onClick={() => handleToolClick('note')}
      />

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Drawing tool with options */}
      <div className="relative flex">
        <ToolButton
          icon={<Pencil size={16} style={{ color: activeColor }} />}
          label="Draw"
          shortcut="D"
          isActive={activeTool === 'drawing'}
          onClick={() => handleToolClick('drawing')}
        />
        <button
          className="rounded-r px-1 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowDrawingOptions(!showDrawingOptions)}
          title="Drawing options"
        >
          <ChevronDown size={12} />
        </button>

        {showDrawingOptions && (
          <div className="absolute left-0 top-full z-50 mt-1">
            <DrawingToolOptions onClose={() => setShowDrawingOptions(false)} />
          </div>
        )}
      </div>

      {/* Eraser tool */}
      <ToolButton
        icon={<Eraser size={16} />}
        label="Eraser"
        shortcut="E"
        isActive={activeTool === 'eraser' as AnnotationType}
        onClick={() => handleToolClick('eraser' as AnnotationType)}
      />

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Shape tools with dropdown */}
      <div className="relative flex">
        <ToolButton
          icon={<CurrentShapeIcon size={16} />}
          label="Shape"
          shortcut="R"
          isActive={activeTool === 'shape'}
          onClick={() => handleToolClick('shape')}
        />
        <button
          className="rounded-r px-1 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowShapeOptions(!showShapeOptions)}
          title="Shape options"
        >
          <ChevronDown size={12} />
        </button>

        {showShapeOptions && (
          <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {/* Shape type selection */}
            <div className="mb-2 text-xs text-gray-500">Shape Type</div>
            <div className="mb-3 grid grid-cols-4 gap-1">
              {(Object.keys(SHAPE_ICONS) as ShapeType[]).map((shapeType) => {
                const Icon = SHAPE_ICONS[shapeType];
                return (
                  <button
                    key={shapeType}
                    className={`flex items-center justify-center rounded-md p-2 transition-colors ${
                      activeShapeType === shapeType
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleShapeTypeSelect(shapeType)}
                    title={shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
            {/* Shape options (color, stroke, fill) */}
            <ShapeOptions onClose={() => setShowShapeOptions(false)} />
          </div>
        )}
      </div>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Stamp tool with picker */}
      <div className="relative flex">
        <ToolButton
          icon={<Stamp size={16} />}
          label="Stamp"
          isActive={activeTool === 'stamp'}
          onClick={() => handleToolClick('stamp')}
        />
        <button
          className="rounded-r px-1 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowStampPicker(!showStampPicker)}
          title="Choose stamp"
        >
          <ChevronDown size={12} />
        </button>

        {showStampPicker && (
          <div className="absolute left-0 top-full z-50 mt-1">
            <StampPicker
              selectedStamp={activeStampType}
              onSelect={handleStampSelect}
              onClose={() => setShowStampPicker(false)}
            />
          </div>
        )}
      </div>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Opacity control */}
      <div className="relative">
        <button
          className="rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => setShowOpacitySlider(!showOpacitySlider)}
        >
          {Math.round(activeOpacity * 100)}%
        </button>

        {showOpacitySlider && (
          <div className="absolute right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <OpacitySlider
              value={activeOpacity}
              onChange={setActiveOpacity}
            />
          </div>
        )}
      </div>
    </div>
  );
}
