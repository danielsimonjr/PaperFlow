import type { PageRenderer } from '@lib/export/imageExport';

export interface PrintRenderOptions {
  includeAnnotations: boolean;
  includeFormFields: boolean;
  scale: number;
}

/**
 * Render a PDF page to a canvas for printing.
 */
export async function renderPageForPrint(
  renderer: PageRenderer,
  pageNumber: number,
  options: PrintRenderOptions
): Promise<HTMLCanvasElement> {
  const page = await renderer.getPage(pageNumber);
  const viewport = page.getViewport({ scale: options.scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

/**
 * Render multiple pages for printing.
 */
export async function renderPagesForPrint(
  renderer: PageRenderer,
  pageNumbers: number[],
  options: PrintRenderOptions,
  onProgress?: (current: number, total: number) => void
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 0; i < pageNumbers.length; i++) {
    const pageNumber = pageNumbers[i]!;
    const canvas = await renderPageForPrint(renderer, pageNumber, options);
    canvases.push(canvas);
    onProgress?.(i + 1, pageNumbers.length);
  }

  return canvases;
}
