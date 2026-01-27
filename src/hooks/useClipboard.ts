import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  /** Callback when copy succeeds */
  onCopySuccess?: () => void;
  /** Callback when copy fails */
  onCopyError?: (error: Error) => void;
  /** Timeout for success state in ms */
  successTimeout?: number;
}

interface UseClipboardReturn {
  /** Copy text to clipboard */
  copyText: (text: string) => Promise<boolean>;
  /** Whether last copy was successful */
  copied: boolean;
  /** Whether copy is in progress */
  copying: boolean;
  /** Last error if any */
  error: Error | null;
}

/**
 * Hook for clipboard operations with support for both modern and legacy APIs.
 */
export function useClipboard(
  options: UseClipboardOptions = {}
): UseClipboardReturn {
  const { onCopySuccess, onCopyError, successTimeout = 2000 } = options;

  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyText = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) {
        return false;
      }

      setCopying(true);
      setError(null);

      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback to legacy method
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.style.top = '-9999px';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (!successful) {
            throw new Error('Failed to copy text using legacy method');
          }
        }

        setCopied(true);
        setCopying(false);
        onCopySuccess?.();

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, successTimeout);

        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to copy text');
        setError(error);
        setCopying(false);
        setCopied(false);
        onCopyError?.(error);
        return false;
      }
    },
    [onCopySuccess, onCopyError, successTimeout]
  );

  return {
    copyText,
    copied,
    copying,
    error,
  };
}

/**
 * Copy text to clipboard without using the hook.
 * Useful for one-off copy operations.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback to legacy method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch {
    return false;
  }
}
