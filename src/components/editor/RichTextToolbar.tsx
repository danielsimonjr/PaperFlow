import { cn } from '@utils/cn';
import { useTextStore } from '@stores/textStore';
import { FontPicker } from './FontPicker';
import { FontSizePicker } from './FontSizePicker';
import { TextColorPicker } from './TextColorPicker';
import { AlignmentPicker } from './AlignmentPicker';
import { LineSpacing } from './LineSpacing';
import {
  Bold,
  Italic,
  Underline,
  Type,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useHistoryStore } from '@stores/historyStore';

interface RichTextToolbarProps {
  /** Additional class names */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Toolbar for text formatting controls.
 */
export function RichTextToolbar({ className, compact = false }: RichTextToolbarProps) {
  const {
    selectedId,
    textBoxes,
    updateTextBox,
    activeTool,
    setActiveTool,
    defaultProperties,
    setDefaultProperties,
  } = useTextStore();

  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  // Get selected text box
  const selectedTextBox = selectedId
    ? textBoxes.find((t) => t.id === selectedId)
    : null;

  // Get current properties (from selected text box or defaults)
  const currentProps = selectedTextBox || defaultProperties;

  // Update handler
  const handleUpdate = <K extends keyof typeof currentProps>(
    key: K,
    value: (typeof currentProps)[K]
  ) => {
    if (selectedTextBox) {
      updateTextBox(selectedTextBox.id, { [key]: value });
    } else {
      setDefaultProperties({ [key]: value });
    }
  };

  // Toggle handlers
  const toggleBold = () => {
    handleUpdate(
      'fontWeight',
      currentProps.fontWeight === 'bold' ? 'normal' : 'bold'
    );
  };

  const toggleItalic = () => {
    handleUpdate(
      'fontStyle',
      currentProps.fontStyle === 'italic' ? 'normal' : 'italic'
    );
  };

  const toggleUnderline = () => {
    handleUpdate(
      'textDecoration',
      currentProps.textDecoration === 'underline' ? 'none' : 'underline'
    );
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800',
        compact ? 'flex-wrap' : 'flex-nowrap',
        className
      )}
    >
      {/* Text tool toggle */}
      <Button
        variant={activeTool === 'textbox' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setActiveTool(activeTool === 'textbox' ? null : 'textbox')}
        title="Add Text Box (T)"
      >
        <Type className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Font family */}
      <FontPicker
        value={currentProps.fontFamily}
        onChange={(value) => handleUpdate('fontFamily', value)}
      />

      {/* Font size */}
      <FontSizePicker
        value={currentProps.fontSize}
        onChange={(value) => handleUpdate('fontSize', value)}
      />

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Bold */}
      <Button
        variant={currentProps.fontWeight === 'bold' ? 'primary' : 'ghost'}
        size="sm"
        onClick={toggleBold}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic */}
      <Button
        variant={currentProps.fontStyle === 'italic' ? 'primary' : 'ghost'}
        size="sm"
        onClick={toggleItalic}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Underline */}
      <Button
        variant={currentProps.textDecoration === 'underline' ? 'primary' : 'ghost'}
        size="sm"
        onClick={toggleUnderline}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Text color */}
      <TextColorPicker
        value={currentProps.color}
        onChange={(value) => handleUpdate('color', value)}
      />

      {!compact && (
        <>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Alignment */}
          <AlignmentPicker
            value={currentProps.alignment}
            onChange={(value) => handleUpdate('alignment', value)}
          />

          {/* Line spacing */}
          <LineSpacing
            value={currentProps.lineSpacing}
            onChange={(value) => handleUpdate('lineSpacing', value)}
          />
        </>
      )}

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}
