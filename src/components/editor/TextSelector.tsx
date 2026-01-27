import { useCallback, useEffect, useRef } from 'react';
import type { PDFRenderer } from '@lib/pdf/renderer';
import { useClipboard } from '@hooks/useClipboard';
import { extractFontInfo, type PDFTextItem } from '@lib/fonts/fontMatcher';

export interface TextSelectorSelection {
  text: string;
  pageIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
  fontInfo?: {
    fontFamily: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
  };
}

interface TextSelectorProps {
  renderer: PDFRenderer;
  pageNumber: number;
  pageHeight: number;
  scale: number;
  onSelectionChange?: (selection: TextSelectorSelection | null) => void;
  onDoubleClick?: (selection: TextSelectorSelection) => void;
  containerRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
}

/**
 * Component for handling text selection on PDF pages.
 * Supports click-drag, double-click for word, triple-click for paragraph.
 */
export function TextSelector({
  renderer,
  pageNumber,
  pageHeight,
  scale,
  onSelectionChange,
  onDoubleClick,
  containerRef,
  disabled = false,
}: TextSelectorProps) {
  const lastClickTimeRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  const textContentRef = useRef<PDFTextItem[] | null>(null);
  const { copyText } = useClipboard();

  // Load text content when page changes
  useEffect(() => {
    const loadTextContent = async () => {
      try {
        const content = await renderer.getTextContent(pageNumber);
        textContentRef.current = content.items.filter(
          (item): item is PDFTextItem => 'str' in item && typeof item.str === 'string'
        );
      } catch (error) {
        console.error('Failed to load text content:', error);
        textContentRef.current = null;
      }
    };

    loadTextContent();
  }, [renderer, pageNumber]);

  // Get font info from the first selected text item
  const getFontInfoFromSelection = useCallback(
    (
      selection: Selection
    ): TextSelectorSelection['fontInfo'] | undefined => {
      if (!textContentRef.current || textContentRef.current.length === 0) {
        return undefined;
      }

      // Try to find matching text item
      const selectedText = selection.toString();
      const textItem = textContentRef.current.find((item) =>
        selectedText.includes(item.str) || item.str.includes(selectedText)
      );

      if (textItem) {
        const fontInfo = extractFontInfo(textItem);
        return {
          fontFamily: fontInfo.fontFamily,
          fontSize: fontInfo.fontSize,
          isBold: fontInfo.isBold,
          isItalic: fontInfo.isItalic,
        };
      }

      return undefined;
    },
    []
  );

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      onSelectionChange?.(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      onSelectionChange?.(null);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      onSelectionChange?.(null);
      return;
    }

    // Check if selection is within our container
    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      return;
    }

    // Get bounding rect of selection
    const rects = range.getClientRects();
    if (rects.length === 0) {
      onSelectionChange?.(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();

    // Calculate combined bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const rect of Array.from(rects)) {
      minX = Math.min(minX, rect.left - containerRect.left);
      minY = Math.min(minY, rect.top - containerRect.top);
      maxX = Math.max(maxX, rect.right - containerRect.left);
      maxY = Math.max(maxY, rect.bottom - containerRect.top);
    }

    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Convert to PDF coordinates
    const scaleFactor = scale / 100;
    const pdfBounds = {
      x: bounds.x / scaleFactor,
      y: pageHeight - (bounds.y + bounds.height) / scaleFactor,
      width: bounds.width / scaleFactor,
      height: bounds.height / scaleFactor,
    };

    const fontInfo = getFontInfoFromSelection(selection);

    onSelectionChange?.({
      text,
      pageIndex: pageNumber - 1,
      bounds: pdfBounds,
      fontInfo,
    });
  }, [
    disabled,
    containerRef,
    pageNumber,
    pageHeight,
    scale,
    onSelectionChange,
    getFontInfoFromSelection,
  ]);

  // Handle mouse up for selection
  const handleMouseUp = useCallback(
    () => {
      if (disabled) return;

      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      if (timeSinceLastClick < 500) {
        clickCountRef.current += 1;
      } else {
        clickCountRef.current = 1;
      }
      lastClickTimeRef.current = now;

      const container = containerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection) return;

      // Handle click count for word/paragraph selection
      if (clickCountRef.current === 2) {
        // Double-click: select word (browser handles this automatically)
        setTimeout(() => {
          handleSelectionChange();
          if (selection && !selection.isCollapsed && onDoubleClick) {
            const text = selection.toString().trim();
            if (text) {
              const containerRect = container.getBoundingClientRect();
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();

              const bounds = {
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
                width: rect.width,
                height: rect.height,
              };

              const scaleFactor = scale / 100;
              const pdfBounds = {
                x: bounds.x / scaleFactor,
                y: pageHeight - (bounds.y + bounds.height) / scaleFactor,
                width: bounds.width / scaleFactor,
                height: bounds.height / scaleFactor,
              };

              onDoubleClick({
                text,
                pageIndex: pageNumber - 1,
                bounds: pdfBounds,
                fontInfo: getFontInfoFromSelection(selection),
              });
            }
          }
        }, 10);
      } else if (clickCountRef.current >= 3) {
        // Triple-click: select paragraph (entire text block)
        // Browser might select the entire paragraph or we need to extend selection
        setTimeout(handleSelectionChange, 10);
      } else {
        // Single click - let normal selection happen
        setTimeout(handleSelectionChange, 10);
      }
    },
    [
      disabled,
      containerRef,
      pageNumber,
      pageHeight,
      scale,
      handleSelectionChange,
      onDoubleClick,
      getFontInfoFromSelection,
    ]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      const container = containerRef.current;
      if (!container || !container.contains(document.activeElement)) {
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();

        // Select all text in the container
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(container);
          selection.removeAllRanges();
          selection.addRange(range);

          setTimeout(handleSelectionChange, 10);
        }
      }

      // Ctrl/Cmd + C: Copy
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const text = selection.toString();
          if (text) {
            copyText(text);
          }
        }
      }
    },
    [disabled, containerRef, handleSelectionChange, copyText]
  );

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef, handleMouseUp, handleKeyDown, handleSelectionChange]);

  // This component doesn't render anything visible
  return null;
}
