import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyLinkToClipboard, isDocumentFromUrl } from '@lib/share/copyLink';

describe('copyLink', () => {
  describe('copyLinkToClipboard', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('uses navigator.clipboard when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      const result = await copyLinkToClipboard('https://example.com');
      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalledWith('https://example.com');
    });

    it('returns false when clipboard API fails and fallback fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Denied')),
        },
      });

      // Mock fallback - define execCommand if it doesn't exist
      document.execCommand = vi.fn().mockReturnValue(false);
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      const result = await copyLinkToClipboard('https://example.com');
      expect(result).toBe(false);
    });
  });

  describe('isDocumentFromUrl', () => {
    it('returns true for http URLs', () => {
      expect(isDocumentFromUrl('http://example.com/doc.pdf')).toBe(true);
    });

    it('returns true for https URLs', () => {
      expect(isDocumentFromUrl('https://example.com/doc.pdf')).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDocumentFromUrl(null)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isDocumentFromUrl('')).toBe(false);
    });

    it('returns false for file paths', () => {
      expect(isDocumentFromUrl('/path/to/file.pdf')).toBe(false);
    });

    it('returns false for blob URLs', () => {
      expect(isDocumentFromUrl('blob:http://localhost/abc')).toBe(false);
    });
  });
});
