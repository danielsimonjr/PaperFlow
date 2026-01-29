import { useCallback } from 'react';
import { cn } from '@utils/cn';

/**
 * Skip navigation link for keyboard users.
 * Invisible until focused, appears at the top of the page.
 */
export function SkipNav({ targetId = 'main-content' }: { targetId?: string }) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  }, [targetId]);

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

/**
 * ARIA live region for announcing dynamic content changes to screen readers.
 */
export function LiveRegion({
  message,
  politeness = 'polite',
}: {
  message: string;
  politeness?: 'polite' | 'assertive';
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Visually hidden component for screen reader-only text.
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
}: {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3';
}) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * Accessible icon button with required aria-label.
 */
export function IconButton({
  'aria-label': ariaLabel,
  onClick,
  disabled,
  className,
  children,
}: {
  'aria-label': string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2',
        'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}
