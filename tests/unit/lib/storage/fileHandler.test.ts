import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadPdf,
  generateFileId,
} from '@lib/storage/fileHandler';

describe('fileHandler', () => {
  describe('downloadPdf', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    let appendedElements: Node[] = [];
    let removedElements: Node[] = [];

    beforeEach(() => {
      // Store originals
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;

      // Create mocks
      mockCreateObjectURL = vi.fn(() => 'blob:test-url');
      mockRevokeObjectURL = vi.fn();
      mockClick = vi.fn();

      // Replace URL methods
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;

      // Track appended/removed elements
      appendedElements = [];
      removedElements = [];

      vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
        appendedElements.push(node);
        return node;
      });

      vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
        removedElements.push(node);
        return node;
      });

      // Mock HTMLAnchorElement.click
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(mockClick);
    });

    afterEach(() => {
      // Restore originals
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it('creates blob URL for download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob, 'test.pdf');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    });

    it('creates download link with correct attributes', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob, 'document.pdf');

      expect(appendedElements.length).toBe(1);
      const link = appendedElements[0] as HTMLAnchorElement;
      expect(link.href).toBe('blob:test-url');
      expect(link.download).toBe('document.pdf');
    });

    it('clicks the link to trigger download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob, 'test.pdf');

      expect(mockClick).toHaveBeenCalled();
    });

    it('cleans up blob URL after download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob, 'test.pdf');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('removes link from DOM after download', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob, 'test.pdf');

      expect(removedElements.length).toBe(1);
    });

    it('uses default filename when not provided', () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      downloadPdf(blob);

      const link = appendedElements[0] as HTMLAnchorElement;
      expect(link.download).toBe('document.pdf');
    });
  });

  describe('generateFileId', () => {
    it('generates unique IDs for different filenames', () => {
      const id1 = generateFileId('file1.pdf');
      const id2 = generateFileId('file2.pdf');

      expect(id1).not.toBe(id2);
    });

    it('includes sanitized filename in ID', () => {
      const id = generateFileId('my-document.pdf');

      expect(id).toMatch(/mydocument/i);
    });

    it('handles special characters in filename', () => {
      const id = generateFileId('file with spaces & special.pdf');

      expect(id).toBeDefined();
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates ID with timestamp component', () => {
      const id = generateFileId('test.pdf');

      // ID should contain a timestamp between before and after
      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
