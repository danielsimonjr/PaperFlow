import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openEmailWithDocument } from '@lib/share/emailShare';

describe('emailShare', () => {
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  describe('openEmailWithDocument', () => {
    it('opens mailto link with document name in subject', () => {
      openEmailWithDocument('test-document.pdf');

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      const [url, target] = windowOpenSpy.mock.calls[0] as [string, string];

      expect(url).toContain('mailto:?subject=');
      expect(url).toContain(encodeURIComponent('Shared document: test-document.pdf'));
      expect(target).toBe('_self');
    });

    it('includes document name in email body', () => {
      openEmailWithDocument('my-report.pdf');

      const [url] = windowOpenSpy.mock.calls[0] as [string];
      expect(url).toContain('body=');
      expect(url).toContain(encodeURIComponent('my-report.pdf'));
    });

    it('includes document URL when provided', () => {
      openEmailWithDocument('shared-file.pdf', 'https://example.com/files/shared-file.pdf');

      const [url] = windowOpenSpy.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent('https://example.com/files/shared-file.pdf'));
      expect(url).toContain(encodeURIComponent('Document link:'));
    });

    it('asks user to attach file when no URL provided', () => {
      openEmailWithDocument('local-file.pdf');

      const [url] = windowOpenSpy.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent('Please find the document attached'));
    });

    it('properly encodes special characters in filename', () => {
      openEmailWithDocument('report (final) #1.pdf');

      const [url] = windowOpenSpy.mock.calls[0] as [string];
      expect(url).toContain(encodeURIComponent('report (final) #1.pdf'));
    });

    it('handles empty filename', () => {
      openEmailWithDocument('');

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      const [url] = windowOpenSpy.mock.calls[0] as [string];
      expect(url).toContain('mailto:');
    });

    it('generates valid mailto URL format', () => {
      openEmailWithDocument('document.pdf');

      const [url] = windowOpenSpy.mock.calls[0] as [string];

      // Validate URL structure
      expect(url.startsWith('mailto:?')).toBe(true);
      expect(url).toContain('subject=');
      expect(url).toContain('&body=');
    });
  });
});
