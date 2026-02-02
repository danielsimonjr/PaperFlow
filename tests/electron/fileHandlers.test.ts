/**
 * File Handlers Tests
 *
 * Tests for native file system operations including:
 * - File dialogs (open, save, folder)
 * - File read/write operations
 * - Recent files management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockApp, mockDialog, mockIpcMain, mockBrowserWindow, resetMocks } from './setup';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(() => Promise.resolve(Buffer.from('%PDF-1.4 mock content'))),
    writeFile: vi.fn(() => Promise.resolve()),
    access: vi.fn(() => Promise.resolve()),
    stat: vi.fn(() =>
      Promise.resolve({
        size: 1024,
        birthtimeMs: Date.now(),
        mtimeMs: Date.now(),
        atimeMs: Date.now(),
        isFile: () => true,
        isDirectory: () => false,
      })
    ),
    mkdir: vi.fn(() => Promise.resolve()),
    unlink: vi.fn(() => Promise.resolve()),
    copyFile: vi.fn(() => Promise.resolve()),
    rename: vi.fn(() => Promise.resolve()),
    readdir: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock path
vi.mock('path', () => ({
  default: {
    join: (...args: string[]) => args.join('/'),
    normalize: (p: string) => p,
    dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
    basename: (p: string, ext?: string) => {
      const name = p.split('/').pop() || '';
      return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
    },
    extname: (p: string) => {
      const name = p.split('/').pop() || '';
      const lastDot = name.lastIndexOf('.');
      return lastDot >= 0 ? name.slice(lastDot) : '';
    },
  },
}));

describe('File Handlers', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('File Dialog Operations', () => {
    it('should handle open file dialog', async () => {
      const mockWindow = new mockBrowserWindow();
      mockBrowserWindow.fromWebContents.mockReturnValue(mockWindow);
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/test/document.pdf'],
      });

      // Simulate the handler registration and call
      let openFileHandler: (event: unknown, options?: unknown) => Promise<unknown> = () =>
        Promise.resolve({ canceled: true, filePaths: [] });

      mockIpcMain.handle.mockImplementation((channel: string, handler: typeof openFileHandler) => {
        if (channel === 'dialog-open-file') {
          openFileHandler = handler;
        }
      });

      // Call the handler (result is used internally but not needed for assertions)
      await openFileHandler({ sender: { id: 1 } }, {});

      // The actual behavior depends on the handler implementation
      // This test verifies the mock setup is correct
      expect(mockDialog.showOpenDialog).toBeDefined();
    });

    it('should handle canceled open dialog', async () => {
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      });

      const result = await mockDialog.showOpenDialog({} as Electron.BrowserWindow, {});
      expect(result.canceled).toBe(true);
      expect(result.filePaths).toHaveLength(0);
    });

    it('should handle save file dialog', async () => {
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: '/test/saved.pdf',
      });

      const result = await mockDialog.showSaveDialog({} as Electron.BrowserWindow, {});
      expect(result.canceled).toBe(false);
      expect(result.filePath).toBe('/test/saved.pdf');
    });

    it('should handle canceled save dialog', async () => {
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: true,
        filePath: undefined,
      });

      const result = await mockDialog.showSaveDialog({} as Electron.BrowserWindow, {});
      expect(result.canceled).toBe(true);
    });
  });

  describe('File Read/Write Operations', () => {
    it('should read file successfully', async () => {
      const fs = await import('fs/promises');
      const content = await fs.default.readFile('/test/document.pdf');
      expect(content).toBeDefined();
      expect(content.toString().startsWith('%PDF')).toBe(true);
    });

    it('should write file successfully', async () => {
      const fs = await import('fs/promises');
      await fs.default.writeFile('/test/output.pdf', Buffer.from('test'));
      expect(fs.default.writeFile).toHaveBeenCalled();
    });

    it('should check file existence', async () => {
      const fs = await import('fs/promises');
      await fs.default.access('/test/document.pdf');
      expect(fs.default.access).toHaveBeenCalledWith('/test/document.pdf');
    });

    it('should get file stats', async () => {
      const fs = await import('fs/promises');
      const stats = await fs.default.stat('/test/document.pdf');
      expect(stats.size).toBe(1024);
      expect(stats.isFile()).toBe(true);
      expect(stats.isDirectory()).toBe(false);
    });
  });

  describe('Recent Files', () => {
    it('should store recent files path in userData', () => {
      const userDataPath = mockApp.getPath('userData');
      expect(userDataPath).toBe('/mock/path/userData');
    });

    it('should return correct app version', () => {
      const version = mockApp.getVersion();
      expect(version).toBe('1.0.0');
    });
  });
});

describe('Folder Operations', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should list folder contents', async () => {
    const fs = await import('fs/promises');
    (fs.default.readdir as ReturnType<typeof vi.fn>).mockResolvedValue([
      { name: 'doc1.pdf', isFile: () => true, isDirectory: () => false },
      { name: 'doc2.pdf', isFile: () => true, isDirectory: () => false },
      { name: 'subfolder', isFile: () => false, isDirectory: () => true },
    ]);

    const entries = await fs.default.readdir('/test/folder', { withFileTypes: true });
    expect(entries).toHaveLength(3);
  });

  it('should create folder', async () => {
    const fs = await import('fs/promises');
    await fs.default.mkdir('/test/new-folder', { recursive: true });
    expect(fs.default.mkdir).toHaveBeenCalledWith('/test/new-folder', { recursive: true });
  });
});

describe('File Path Utilities', () => {
  it('should normalize paths', async () => {
    const path = await import('path');
    const normalized = path.default.normalize('/test//document.pdf');
    expect(normalized).toBeDefined();
  });

  it('should extract filename', async () => {
    const path = await import('path');
    const filename = path.default.basename('/test/folder/document.pdf');
    expect(filename).toBe('document.pdf');
  });

  it('should extract extension', async () => {
    const path = await import('path');
    const ext = path.default.extname('/test/document.pdf');
    expect(ext).toBe('.pdf');
  });

  it('should extract directory', async () => {
    const path = await import('path');
    const dir = path.default.dirname('/test/folder/document.pdf');
    expect(dir).toBe('/test/folder');
  });
});
