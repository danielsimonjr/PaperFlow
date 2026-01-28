import { useRef, useCallback, useEffect } from 'react';

/**
 * Announce a message to screen readers programmatically.
 */
export function useAnnounce() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    regionRef.current = region;

    return () => {
      document.body.removeChild(region);
    };
  }, []);

  return useCallback((message: string) => {
    if (regionRef.current) {
      // Clear and set to trigger re-announcement
      regionRef.current.textContent = '';
      requestAnimationFrame(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      });
    }
  }, []);
}
