import { describe, it, expect } from 'vitest';
import { ThumbnailCache } from '@lib/thumbnails/cache';

describe('ThumbnailCache', () => {
  it('stores and retrieves thumbnails', () => {
    const cache = new ThumbnailCache();
    cache.set('doc1', 1, 0.2, 'data:image/png;base64,abc');
    expect(cache.get('doc1', 1, 0.2)).toBe('data:image/png;base64,abc');
  });

  it('returns null for missing entries', () => {
    const cache = new ThumbnailCache();
    expect(cache.get('doc1', 1, 0.2)).toBeNull();
  });

  it('checks if entry exists', () => {
    const cache = new ThumbnailCache();
    cache.set('doc1', 1, 0.2, 'data:abc');

    expect(cache.has('doc1', 1, 0.2)).toBe(true);
    expect(cache.has('doc1', 2, 0.2)).toBe(false);
  });

  it('evicts oldest entry when at capacity', () => {
    const cache = new ThumbnailCache(3);
    cache.set('doc1', 1, 0.2, 'page1');
    cache.set('doc1', 2, 0.2, 'page2');
    cache.set('doc1', 3, 0.2, 'page3');
    cache.set('doc1', 4, 0.2, 'page4'); // should evict page1

    expect(cache.get('doc1', 1, 0.2)).toBeNull();
    expect(cache.get('doc1', 4, 0.2)).toBe('page4');
    expect(cache.size).toBe(3);
  });

  it('updates LRU order on get', () => {
    const cache = new ThumbnailCache(3);
    cache.set('doc1', 1, 0.2, 'page1');
    cache.set('doc1', 2, 0.2, 'page2');
    cache.set('doc1', 3, 0.2, 'page3');

    // Access page1, making it most recently used
    cache.get('doc1', 1, 0.2);

    // Add page4 - should evict page2 (now the least recently used)
    cache.set('doc1', 4, 0.2, 'page4');

    expect(cache.get('doc1', 1, 0.2)).toBe('page1');
    expect(cache.get('doc1', 2, 0.2)).toBeNull();
  });

  it('invalidates by document', () => {
    const cache = new ThumbnailCache();
    cache.set('doc1', 1, 0.2, 'p1');
    cache.set('doc1', 2, 0.2, 'p2');
    cache.set('doc2', 1, 0.2, 'p1');

    cache.invalidate('doc1');

    expect(cache.has('doc1', 1, 0.2)).toBe(false);
    expect(cache.has('doc1', 2, 0.2)).toBe(false);
    expect(cache.has('doc2', 1, 0.2)).toBe(true);
  });

  it('clears all entries', () => {
    const cache = new ThumbnailCache();
    cache.set('doc1', 1, 0.2, 'p1');
    cache.set('doc1', 2, 0.2, 'p2');

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('reports correct size', () => {
    const cache = new ThumbnailCache();
    expect(cache.size).toBe(0);

    cache.set('doc1', 1, 0.2, 'data');
    expect(cache.size).toBe(1);

    cache.set('doc1', 2, 0.2, 'data');
    expect(cache.size).toBe(2);
  });

  it('differentiates by scale', () => {
    const cache = new ThumbnailCache();
    cache.set('doc1', 1, 0.2, 'small');
    cache.set('doc1', 1, 0.5, 'large');

    expect(cache.get('doc1', 1, 0.2)).toBe('small');
    expect(cache.get('doc1', 1, 0.5)).toBe('large');
  });
});
