import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { cn } from '@utils/cn';
import type { TextBox } from '@/types/text';
import { useTextStore } from '@stores/textStore';
import { getFontFallback } from '@lib/fonts/fontFallback';

interface InlineTextEditorProps {
  /** Text box being edited */
  textBox: TextBox;
  /** Scale factor for display */
  scale: number;
  /** Page height for coordinate conversion */
  pageHeight: number;
  /** Called when editing is complete */
  onComplete?: (content: string) => void;
  /** Called when editing is cancelled */
  onCancel?: () => void;
  /** Maximum characters per line (0 = unlimited) */
  maxCharsPerLine?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Inline text editor for editing text boxes.
 * Supports double-click to edit, click outside to commit.
 */
export function InlineTextEditor({
  textBox,
  scale,
  pageHeight,
  onComplete,
  onCancel,
  maxCharsPerLine = 0,
  className,
}: InlineTextEditorProps) {
  const [content, setContent] = useState(textBox.content);
  const [isNearLimit, setIsNearLimit] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { updateTextBox, setEditingId } = useTextStore();

  // Calculate position in screen coordinates
  const scaleFactor = scale / 100;
  const screenX = textBox.bounds.x * scaleFactor;
  const screenY = (pageHeight - textBox.bounds.y - textBox.bounds.height) * scaleFactor;
  const screenWidth = textBox.bounds.width * scaleFactor;
  const screenHeight = textBox.bounds.height * scaleFactor;

  // Get font CSS
  const fontFallback = getFontFallback(textBox.fontFamily);
  const fontFamily = `"${textBox.fontFamily}", "${fontFallback.fontFamily}", ${fontFallback.genericFamily}`;

  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Move cursor to end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  // Handle content change
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    const newContent = editorRef.current.innerText;
    setContent(newContent);

    // Check character limit per line
    if (maxCharsPerLine > 0) {
      const lines = newContent.split('\n');
      const hasLongLine = lines.some((line) => line.length > maxCharsPerLine);
      setIsNearLimit(
        lines.some((line) => line.length > maxCharsPerLine * 0.9)
      );

      if (hasLongLine) {
        // Truncate lines that exceed limit
        const truncated = lines
          .map((line) =>
            line.length > maxCharsPerLine
              ? line.substring(0, maxCharsPerLine)
              : line
          )
          .join('\n');

        if (truncated !== newContent) {
          editorRef.current.innerText = truncated;
          setContent(truncated);

          // Restore cursor position
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [maxCharsPerLine]);

  // Commit changes
  const commitChanges = useCallback(() => {
    const trimmedContent = content.trim();
    if (trimmedContent !== textBox.content) {
      updateTextBox(textBox.id, { content: trimmedContent });
    }
    setEditingId(null);
    onComplete?.(trimmedContent);
  }, [content, textBox.id, textBox.content, updateTextBox, setEditingId, onComplete]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingId(null);
    onCancel?.();
  }, [setEditingId, onCancel]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      // Escape: cancel
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
        return;
      }

      // Ctrl/Cmd + Enter: commit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        commitChanges();
        return;
      }

      // Ctrl/Cmd + B: Bold
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        updateTextBox(textBox.id, {
          fontWeight: textBox.fontWeight === 'bold' ? 'normal' : 'bold',
        });
        return;
      }

      // Ctrl/Cmd + I: Italic
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        updateTextBox(textBox.id, {
          fontStyle: textBox.fontStyle === 'italic' ? 'normal' : 'italic',
        });
        return;
      }

      // Ctrl/Cmd + U: Underline
      if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        updateTextBox(textBox.id, {
          textDecoration:
            textBox.textDecoration === 'underline' ? 'none' : 'underline',
        });
        return;
      }
    },
    [cancelEdit, commitChanges, updateTextBox, textBox]
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current &&
        !editorRef.current.contains(event.target as Node)
      ) {
        commitChanges();
      }
    };

    // Add listener after a short delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [commitChanges]);

  return (
    <div
      className={cn(
        'absolute',
        isNearLimit && 'ring-2 ring-orange-500',
        className
      )}
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        minHeight: screenHeight,
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'min-h-full w-full bg-white/90 outline-none focus:bg-white',
          'dark:bg-gray-800/90 dark:focus:bg-gray-800',
          'border-2 border-primary-500'
        )}
        style={{
          fontFamily,
          fontSize: `${textBox.fontSize * scaleFactor}px`,
          fontWeight: textBox.fontWeight,
          fontStyle: textBox.fontStyle,
          textDecoration: textBox.textDecoration,
          color: textBox.color,
          textAlign: textBox.alignment,
          lineHeight: textBox.lineSpacing,
          padding: '2px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      >
        {textBox.content}
      </div>

      {/* Character limit warning */}
      {isNearLimit && (
        <div className="absolute -bottom-6 left-0 text-xs text-orange-500">
          Approaching character limit
        </div>
      )}
    </div>
  );
}
