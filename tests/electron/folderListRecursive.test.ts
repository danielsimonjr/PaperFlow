/**
 * Tests for the recursive folder lister (security finding 2026-05-01 #6).
 *
 * Covers:
 *   - max-depth cap (MAX_RECURSIVE_DEPTH = 5) — never recurses beyond 5 levels
 *   - max-entries cap (MAX_RECURSIVE_ENTRIES = 10000) — never returns more
 *   - the broken self-call to ipcMain.handle() is gone (replaced by an
 *     internal helper). This is implicit in the test simply working —
 *     the previous code threw because ipcMain.handle returns void.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup'; // installs the electron module mock

// fs/promises mock - controlled per-test
const readdir = vi.fn();
const stat = vi.fn();
vi.mock('fs/promises', () => ({
  default: {
    readdir: (...args: unknown[]) => readdir(...args),
    stat: (...args: unknown[]) => stat(...args),
  },
}));

// Import the helper after mocks are set up.
let listFolderRecursive: typeof import('../../electron/ipc/fileHandlers').listFolderRecursive;
let MAX_RECURSIVE_DEPTH: number;
let MAX_RECURSIVE_ENTRIES: number;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  const mod = await import('../../electron/ipc/fileHandlers');
  listFolderRecursive = mod.listFolderRecursive;
  MAX_RECURSIVE_DEPTH = mod.MAX_RECURSIVE_DEPTH;
  MAX_RECURSIVE_ENTRIES = mod.MAX_RECURSIVE_ENTRIES;
  // Default stat - tests can override
  stat.mockResolvedValue({ size: 1, mtimeMs: 0 });
});

function makeDirent(name: string, isDir: boolean) {
  return {
    name,
    isFile: () => !isDir,
    isDirectory: () => isDir,
  };
}

describe('listFolderRecursive', () => {
  it('lists a flat folder', async () => {
    readdir.mockResolvedValueOnce([
      makeDirent('a.pdf', false),
      makeDirent('b.pdf', false),
    ]);
    const result = await listFolderRecursive('/root', undefined, 0, { count: 0 });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('a.pdf');
  });

  it('honors the max-depth cap', async () => {
    // Set up 10 levels of nested directories. The helper should stop at 5.
    let depth = 0;
    readdir.mockImplementation(async () => {
      depth++;
      // Only return one dir at each level so we can test depth strictly.
      return [makeDirent(`level${depth}`, true)];
    });

    await listFolderRecursive('/root', { recursive: true }, 0, { count: 0 });
    // depth 0 -> readdir, recurse into level1 (depth 1), ... up to depth 5.
    // After depth 5 it returns []. So at most MAX_RECURSIVE_DEPTH+1 calls.
    expect(readdir.mock.calls.length).toBeLessThanOrEqual(MAX_RECURSIVE_DEPTH + 1);
  });

  it('honors the max-entries cap', async () => {
    // Single huge flat directory.
    const items = Array.from({ length: MAX_RECURSIVE_ENTRIES + 500 }, (_, i) =>
      makeDirent(`f${i}.pdf`, false),
    );
    readdir.mockResolvedValueOnce(items);

    const counter = { count: 0 };
    const result = await listFolderRecursive('/root', undefined, 0, counter);

    expect(result.length).toBeLessThanOrEqual(MAX_RECURSIVE_ENTRIES);
    expect(counter.count).toBeLessThanOrEqual(MAX_RECURSIVE_ENTRIES);
  });

  it('filters by extension when given', async () => {
    readdir.mockResolvedValueOnce([
      makeDirent('a.pdf', false),
      makeDirent('b.txt', false),
      makeDirent('c.pdf', false),
    ]);
    const result = await listFolderRecursive(
      '/root',
      { extensions: ['pdf'] },
      0,
      { count: 0 },
    );
    expect(result.map((e) => e.name)).toEqual(['a.pdf', 'c.pdf']);
  });

  it('handles readdir errors gracefully', async () => {
    readdir.mockRejectedValueOnce(new Error('EACCES'));
    const result = await listFolderRecursive('/protected', undefined, 0, { count: 0 });
    expect(result).toEqual([]);
  });

  it('returns immediately past the depth cap', async () => {
    const result = await listFolderRecursive(
      '/root',
      { recursive: true },
      MAX_RECURSIVE_DEPTH + 1,
      { count: 0 },
    );
    expect(result).toEqual([]);
    expect(readdir).not.toHaveBeenCalled();
  });

  it('returns immediately when entry counter is at cap', async () => {
    const result = await listFolderRecursive(
      '/root',
      undefined,
      0,
      { count: MAX_RECURSIVE_ENTRIES },
    );
    expect(result).toEqual([]);
    expect(readdir).not.toHaveBeenCalled();
  });
});
