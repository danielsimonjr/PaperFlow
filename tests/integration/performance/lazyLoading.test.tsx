import { describe, it, expect } from 'vitest';

describe('Lazy Loading', () => {
  it('lazy components are importable', async () => {
    // Verify that the lazy component module exports correctly
    const module = await import('@components/lazy/index');
    expect(module.LazySignatureModal).toBeDefined();
    expect(module.LazyDrawingCanvas).toBeDefined();
    expect(module.LazyImageExportDialog).toBeDefined();
    expect(module.LazyCompressDialog).toBeDefined();
    expect(module.LazyPrintDialog).toBeDefined();
    expect(module.LazyMergeDialog).toBeDefined();
    expect(module.LazySplitDialog).toBeDefined();
  });

  it('thumbnail cache module is importable', async () => {
    const module = await import('@lib/thumbnails/cache');
    expect(module.ThumbnailCache).toBeDefined();
    expect(module.thumbnailCache).toBeDefined();
  });

  it('memory manager module is importable', async () => {
    const module = await import('@lib/performance/memoryManager');
    expect(module.formatMemory).toBeDefined();
    expect(module.estimateDocumentMemory).toBeDefined();
    expect(module.CanvasDisposer).toBeDefined();
  });

  it('page range parser module is importable', async () => {
    const module = await import('@lib/print/pageRange');
    expect(module.parsePageRange).toBeDefined();
  });
});
