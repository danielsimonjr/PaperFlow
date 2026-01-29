# PaperFlow Performance Documentation

This document outlines the performance targets, optimization strategies, and benchmarking results for PaperFlow.

## Performance Targets

### Document Loading

| Document Size | Target Load Time | Notes |
|--------------|------------------|-------|
| Small (< 10 pages) | < 500ms | Includes parsing and initial render |
| Medium (10-50 pages) | < 1000ms | Includes metadata extraction |
| Large (50-100 pages) | < 2000ms | Uses progressive loading |
| Very Large (100+ pages) | < 5000ms | Virtualized, on-demand loading |

### Page Rendering

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Initial page render (100%) | < 100ms | First contentful paint |
| High-DPI render (200%) | < 200ms | 2x scale factor |
| Thumbnail generation | < 50ms | 0.2x scale, off-thread |
| Page navigation | < 100ms | Pre-cached adjacent pages |

### Annotations

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Create highlight | < 50ms | Includes text selection |
| Create note | < 50ms | Includes icon placement |
| Render annotation layer | < 100ms | SVG overlay |
| Undo/redo | < 50ms | State restoration |

### Save and Export

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Save modifications | < 1000ms | Using pdf-lib |
| Export as PDF | < 2000ms | With annotations flattened |
| Export as image | < 500ms | Single page at 150 DPI |
| Print preparation | < 1000ms | Render for print |

### Memory Usage

| Scenario | Target Memory | Notes |
|----------|---------------|-------|
| Idle (no document) | < 50MB | Base application |
| Small document loaded | < 100MB | 10-page PDF |
| Medium document | < 200MB | 50-page PDF |
| Large document | < 500MB | 100-page PDF with virtualization |

## Optimization Strategies

### 1. Virtualized Rendering

PaperFlow uses IntersectionObserver-based virtualization to render only visible pages plus a configurable buffer (default: 2 pages).

```typescript
// Only render pages in viewport + buffer
const visiblePages = useVisiblePages({
  pageCount,
  bufferSize: 2,
});
```

### 2. Web Worker Thumbnails

Thumbnail generation is offloaded to a Web Worker to prevent main thread blocking:

```typescript
// Thumbnail worker handles rendering off-thread
const thumbnailWorker = createThumbnailWorkerClient();
await thumbnailWorker.generateThumbnail(pageNumber, pdfData, 0.2);
```

### 3. LRU Caching

Thumbnails and rendered pages are cached using an LRU (Least Recently Used) strategy:

```typescript
// Cache up to 50 thumbnails
const cache = new ThumbnailCache({ maxSize: 50 });
```

### 4. Code Splitting

The application uses Vite's code splitting with manual chunks:

- `pdf-engine`: PDF.js and pdf-lib (~800KB)
- `ui-framework`: React and related (~50KB)
- `ui-components`: Radix UI components (~85KB)

### 5. Lazy Loading

Heavy features are lazy-loaded on demand:

```typescript
const SignatureModal = lazy(() => import('./SignatureModal'));
const DrawingCanvas = lazy(() => import('./DrawingCanvas'));
const PrintDialog = lazy(() => import('./PrintDialog'));
```

### 6. Memory Management

Canvas disposal to reclaim GPU memory:

```typescript
const disposer = new CanvasDisposer();
// When page leaves viewport
disposer.dispose(`page-${pageNumber}`);
```

## Benchmarking

### Running Benchmarks

```bash
# Run performance benchmarks
npm run test -- tests/performance/benchmarks.ts

# Run with verbose timing
npm run test -- tests/performance/benchmarks.ts --reporter=verbose
```

### Benchmark Results Template

```
Performance Benchmark Results
=============================
Date: [DATE]
Browser: Chrome [VERSION]
Device: [DEVICE_INFO]

Document Loading:
  - Small PDF (10 pages): XXXms ✓
  - Medium PDF (50 pages): XXXms ✓
  - Large PDF (100 pages): XXXms ✓

Page Rendering:
  - 100% zoom: XXms ✓
  - 200% zoom: XXms ✓
  - Thumbnail: XXms ✓

Memory Usage:
  - Idle: XXX MB
  - 10-page document: XXX MB
  - 100-page document: XXX MB
```

## Browser Compatibility

### Supported Browsers

| Browser | Min Version | Notes |
|---------|-------------|-------|
| Chrome | 90+ | Full support, best performance |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support (Chromium-based) |

### Performance Notes by Browser

- **Chrome**: Best performance for canvas operations and Web Workers
- **Firefox**: Slightly slower canvas rendering, good memory management
- **Safari**: Efficient on iOS, may use more memory on macOS
- **Edge**: Performance similar to Chrome

## Mobile Performance

### Touch Gesture Performance

| Gesture | Target Response | Notes |
|---------|-----------------|-------|
| Pinch zoom | < 16ms (60fps) | Hardware accelerated |
| Swipe navigation | < 100ms | Page transition |
| Pan/scroll | < 16ms (60fps) | Smooth scrolling |
| Long press | 500ms delay | Context menu |

### Mobile Optimizations

1. **Touch targets**: Minimum 44x44 CSS pixels
2. **Safe areas**: Proper handling for notched devices
3. **Reduced animations**: Less motion on slower devices
4. **Image compression**: Lower DPI exports for mobile

## Profiling Tips

### Chrome DevTools

1. Open DevTools → Performance tab
2. Click "Record"
3. Perform the action to profile
4. Stop recording and analyze

### Key Metrics to Watch

- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.9s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Common Performance Issues

1. **Large images in PDFs**: Consider downsampling
2. **Many annotations**: Virtualize annotation layer
3. **Complex fonts**: Use system font fallbacks
4. **Memory leaks**: Check for unmounted component subscriptions

## Future Optimizations

- [ ] WebAssembly PDF parsing for faster load times
- [ ] SharedArrayBuffer for multi-threaded rendering
- [ ] OffscreenCanvas for background rendering
- [ ] Service Worker caching for offline performance
- [ ] WebGPU acceleration for rendering (when available)
