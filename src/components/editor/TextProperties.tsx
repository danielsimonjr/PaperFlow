import { useMemo } from 'react';
import { cn } from '@utils/cn';
import type { TextSelectorSelection } from './TextSelector';
import type { TextBox } from '@/types/text';
import { Type, Bold, Italic, Underline } from 'lucide-react';

interface TextPropertiesProps {
  /** Selection from TextSelector */
  selection?: TextSelectorSelection | null;
  /** Text box being edited */
  textBox?: TextBox | null;
  /** Additional class names */
  className?: string;
}

/**
 * Panel displaying detected text properties for selected text or text box.
 */
export function TextProperties({
  selection,
  textBox,
  className,
}: TextPropertiesProps) {
  const properties = useMemo(() => {
    if (textBox) {
      return {
        fontFamily: textBox.fontFamily,
        fontSize: textBox.fontSize,
        fontWeight: textBox.fontWeight,
        fontStyle: textBox.fontStyle,
        textDecoration: textBox.textDecoration,
        color: textBox.color,
        alignment: textBox.alignment,
      };
    }

    if (selection?.fontInfo) {
      return {
        fontFamily: selection.fontInfo.fontFamily,
        fontSize: selection.fontInfo.fontSize,
        fontWeight: selection.fontInfo.isBold ? 'bold' : 'normal',
        fontStyle: selection.fontInfo.isItalic ? 'italic' : 'normal',
        textDecoration: 'none' as const,
        color: '#000000',
        alignment: 'left' as const,
      };
    }

    return null;
  }, [selection, textBox]);

  if (!properties) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
          className
        )}
      >
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Type className="h-4 w-4" />
          <span className="text-sm">No text selected</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        <Type className="h-4 w-4" />
        Text Properties
      </h3>

      <div className="space-y-3">
        {/* Font Family */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Font Family
          </span>
          <span
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
            style={{ fontFamily: properties.fontFamily }}
          >
            {properties.fontFamily}
          </span>
        </div>

        {/* Font Size */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Font Size
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {properties.fontSize}pt
          </span>
        </div>

        {/* Text Styles */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Style
          </span>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded',
                properties.fontWeight === 'bold'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <Bold className="h-3.5 w-3.5" />
            </span>
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded',
                properties.fontStyle === 'italic'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <Italic className="h-3.5 w-3.5" />
            </span>
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded',
                properties.textDecoration === 'underline'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <Underline className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Color */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Color
          </span>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: properties.color }}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {properties.color.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Alignment (only show for text boxes) */}
        {textBox && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Alignment
            </span>
            <span className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
              {properties.alignment}
            </span>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <span className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
          Preview
        </span>
        <div
          className="rounded bg-gray-50 p-2 dark:bg-gray-900"
          style={{
            fontFamily: properties.fontFamily,
            fontSize: `${Math.min(properties.fontSize, 16)}px`,
            fontWeight: properties.fontWeight,
            fontStyle: properties.fontStyle,
            textDecoration: properties.textDecoration,
            color: properties.color,
            textAlign: properties.alignment,
          }}
        >
          {selection?.text?.substring(0, 50) || textBox?.content?.substring(0, 50) || 'Sample Text'}
          {((selection?.text?.length ?? 0) > 50 || (textBox?.content?.length ?? 0) > 50) && '...'}
        </div>
      </div>
    </div>
  );
}
