import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (isShiftTab: boolean) => void;
}

/**
 * Hook for keyboard navigation support.
 * Handles common keyboard interactions for accessibility.
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    enabled = true,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        // Still handle Escape in inputs
        if (e.key === 'Escape' && onEscape) {
          onEscape();
          return;
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
        case ' ':
          onEnter?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          onArrowRight?.();
          break;
        case 'Tab':
          onTab?.(e.shiftKey);
          break;
      }
    },
    [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Trap focus within a container element (for modals and dialogs).
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0]!;
      const lastFocusable = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);

    // Focus the first focusable element
    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [containerRef, active]);
}
