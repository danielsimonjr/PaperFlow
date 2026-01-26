import { useEffect, useCallback } from 'react';

/**
 * Hook that shows a browser confirmation dialog when attempting to leave
 * the page with unsaved changes.
 *
 * @param shouldWarn - Whether to show the warning dialog
 * @param message - Custom message (note: most browsers ignore this)
 */
export function useBeforeUnload(
  shouldWarn: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
): void {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        // Most modern browsers ignore the custom message for security reasons
        // but we still set it for older browsers
        e.returnValue = message;
        return message;
      }
    },
    [shouldWarn, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
}

/**
 * Hook variant that takes a function to determine if warning should show.
 * Useful when the warning condition depends on multiple factors.
 */
export function useBeforeUnloadCallback(
  shouldWarnFn: () => boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
): void {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (shouldWarnFn()) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    },
    [shouldWarnFn, message]
  );

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
}
