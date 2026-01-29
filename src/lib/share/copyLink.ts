/**
 * Copy a URL to the clipboard.
 * Returns true if successful, false otherwise.
 */
export async function copyLinkToClipboard(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers
    return copyLinkFallback(url);
  }
}

/**
 * Fallback clipboard copy using a temporary textarea.
 */
function copyLinkFallback(url: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const result = document.execCommand('copy');
    return result;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Check if the current document was loaded from a URL
 * (as opposed to a local file).
 */
export function isDocumentFromUrl(source: string | null): boolean {
  if (!source) return false;
  return source.startsWith('http://') || source.startsWith('https://');
}
