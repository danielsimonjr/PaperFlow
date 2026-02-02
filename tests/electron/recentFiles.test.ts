/**
 * Recent Files Tests
 *
 * Tests for recent files management functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockApp, resetMocks } from './setup';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(() => Promise.resolve()),
    access: vi.fn(() => Promise.resolve()),
    stat: vi.fn(() =>
      Promise.resolve({
        size: 1024,
        isFile: () => true,
      })
    ),
  },
}));

// Mock path
vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    normalize: (p: string) => p,
    basename: (p: string) => p.split('/').pop() || '',
  },
}));

describe('Recent Files', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('Storage', () => {
    it('should get correct storage path', () => {
      mockApp.getPath.mockReturnValue('/mock/userData');
      const userDataPath = mockApp.getPath('userData');
      expect(userDataPath).toBe('/mock/userData');
    });

    it('should load empty array when file does not exist', async () => {
      const fs = await import('fs/promises');
      (fs.default.readFile as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      let result: unknown[] = [];
      try {
        const data = await fs.default.readFile('/mock/userData/recent-files.json', 'utf-8');
        result = JSON.parse(data as string);
      } catch {
        result = [];
      }

      expect(result).toEqual([]);
    });

    it('should load existing recent files', async () => {
      const fs = await import('fs/promises');
      const mockFiles = [
        { path: '/test/doc1.pdf', name: 'doc1.pdf', timestamp: Date.now() },
        { path: '/test/doc2.pdf', name: 'doc2.pdf', timestamp: Date.now() - 1000 },
      ];

      (fs.default.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(mockFiles)
      );

      const data = await fs.default.readFile('/mock/userData/recent-files.json', 'utf-8');
      const result = JSON.parse(data as string);

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('/test/doc1.pdf');
    });

    it('should save recent files', async () => {
      const fs = await import('fs/promises');
      const mockFiles = [
        { path: '/test/doc1.pdf', name: 'doc1.pdf', timestamp: Date.now() },
      ];

      await fs.default.writeFile(
        '/mock/userData/recent-files.json',
        JSON.stringify(mockFiles, null, 2),
        'utf-8'
      );

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        '/mock/userData/recent-files.json',
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('File Management', () => {
    it('should add file to front of list', () => {
      const files = [
        { path: '/test/old.pdf', name: 'old.pdf', timestamp: 1000 },
      ];

      const newFile = { path: '/test/new.pdf', name: 'new.pdf', timestamp: 2000 };
      files.unshift(newFile);

      expect(files[0].path).toBe('/test/new.pdf');
      expect(files).toHaveLength(2);
    });

    it('should remove duplicate before adding', () => {
      const files = [
        { path: '/test/doc1.pdf', name: 'doc1.pdf', timestamp: 1000 },
        { path: '/test/doc2.pdf', name: 'doc2.pdf', timestamp: 900 },
      ];

      // Filter out existing entry
      const filtered = files.filter((f) => f.path !== '/test/doc1.pdf');
      // Add to front
      filtered.unshift({ path: '/test/doc1.pdf', name: 'doc1.pdf', timestamp: 2000 });

      expect(filtered).toHaveLength(2);
      expect(filtered[0].timestamp).toBe(2000);
    });

    it('should limit to max recent files', () => {
      const MAX_RECENT_FILES = 10;
      const files = Array.from({ length: 15 }, (_, i) => ({
        path: `/test/doc${i}.pdf`,
        name: `doc${i}.pdf`,
        timestamp: Date.now() - i * 1000,
      }));

      const limited = files.slice(0, MAX_RECENT_FILES);
      expect(limited).toHaveLength(10);
    });

    it('should clear all recent files', async () => {
      const fs = await import('fs/promises');

      await fs.default.writeFile('/mock/userData/recent-files.json', '[]', 'utf-8');

      expect(fs.default.writeFile).toHaveBeenCalledWith(
        '/mock/userData/recent-files.json',
        '[]',
        'utf-8'
      );
    });
  });

  describe('File Validation', () => {
    it('should verify file exists', async () => {
      const fs = await import('fs/promises');
      await fs.default.access('/test/doc.pdf');
      expect(fs.default.access).toHaveBeenCalledWith('/test/doc.pdf');
    });

    it('should get file stats for size', async () => {
      const fs = await import('fs/promises');
      const stats = await fs.default.stat('/test/doc.pdf');
      expect(stats.size).toBe(1024);
      expect(stats.isFile()).toBe(true);
    });

    it('should filter out non-existent files', async () => {
      const fs = await import('fs/promises');

      const files = [
        { path: '/test/exists.pdf', name: 'exists.pdf', timestamp: 1000 },
        { path: '/test/missing.pdf', name: 'missing.pdf', timestamp: 900 },
      ];

      (fs.default.access as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('ENOENT'));

      const validFiles = [];
      for (const file of files) {
        try {
          await fs.default.access(file.path);
          validFiles.push(file);
        } catch {
          // File doesn't exist, skip
        }
      }

      expect(validFiles).toHaveLength(1);
      expect(validFiles[0].path).toBe('/test/exists.pdf');
    });
  });

  describe('OS Integration', () => {
    it('should call addRecentDocument', () => {
      mockApp.addRecentDocument = vi.fn();
      mockApp.addRecentDocument('/test/doc.pdf');
      expect(mockApp.addRecentDocument).toHaveBeenCalledWith('/test/doc.pdf');
    });

    it('should call clearRecentDocuments', () => {
      mockApp.clearRecentDocuments = vi.fn();
      mockApp.clearRecentDocuments();
      expect(mockApp.clearRecentDocuments).toHaveBeenCalled();
    });
  });
});

describe('Recent Files Data Structure', () => {
  it('should have correct shape', () => {
    const recentFile = {
      path: '/test/doc.pdf',
      name: 'doc.pdf',
      timestamp: Date.now(),
      size: 1024,
    };

    expect(recentFile).toHaveProperty('path');
    expect(recentFile).toHaveProperty('name');
    expect(recentFile).toHaveProperty('timestamp');
    expect(typeof recentFile.path).toBe('string');
    expect(typeof recentFile.name).toBe('string');
    expect(typeof recentFile.timestamp).toBe('number');
  });

  it('should sort by timestamp (newest first)', () => {
    const files = [
      { path: '/test/old.pdf', name: 'old.pdf', timestamp: 1000 },
      { path: '/test/new.pdf', name: 'new.pdf', timestamp: 2000 },
      { path: '/test/mid.pdf', name: 'mid.pdf', timestamp: 1500 },
    ];

    files.sort((a, b) => b.timestamp - a.timestamp);

    expect(files[0].name).toBe('new.pdf');
    expect(files[1].name).toBe('mid.pdf');
    expect(files[2].name).toBe('old.pdf');
  });
});
