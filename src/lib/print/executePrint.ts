import type { ScaleType } from '@components/print/ScaleOptions';
import type { Orientation } from '@components/print/OrientationOptions';
import type { PageRenderer } from '@lib/export/imageExport';
import { renderPageForPrint, type PrintRenderOptions } from './printRenderer';

export interface PrintOptions {
  pages: number[];
  scaleType: ScaleType;
  customScale: number;
  orientation: Orientation;
  copies: number;
  includeAnnotations: boolean;
  includeFormFields: boolean;
}

/**
 * Calculate the print scale based on scale type.
 */
export function calculatePrintScale(scaleType: ScaleType, customScale: number): number {
  switch (scaleType) {
    case 'fit':
      return 1.0;
    case 'actual':
      return 1.0;
    case 'custom':
      return customScale / 100;
    default:
      return 1.0;
  }
}

/**
 * Build CSS for the print orientation.
 */
export function getOrientationCSS(orientation: Orientation): string {
  if (orientation === 'portrait') {
    return '@page { size: portrait; }';
  } else if (orientation === 'landscape') {
    return '@page { size: landscape; }';
  }
  return '@page { size: auto; }';
}

/**
 * Execute print by rendering pages and opening the browser print dialog.
 */
export async function executePrint(
  renderer: PageRenderer,
  options: PrintOptions
): Promise<void> {
  const scale = calculatePrintScale(options.scaleType, options.customScale);

  const renderOptions: PrintRenderOptions = {
    includeAnnotations: options.includeAnnotations,
    includeFormFields: options.includeFormFields,
    scale,
  };

  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to create print iframe');
  }

  const orientationCSS = getOrientationCSS(options.orientation);

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${orientationCSS}
          body { margin: 0; padding: 0; }
          .print-page {
            page-break-after: always;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
          canvas {
            max-width: 100%;
            height: auto;
          }
          @media print {
            .print-page { page-break-after: always; }
            .print-page:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body></body>
    </html>
  `);
  iframeDoc.close();

  // Render pages
  for (let copy = 0; copy < options.copies; copy++) {
    for (const pageNumber of options.pages) {
      const canvas = await renderPageForPrint(renderer, pageNumber, renderOptions);

      const pageDiv = iframeDoc.createElement('div');
      pageDiv.className = 'print-page';
      pageDiv.appendChild(canvas);
      iframeDoc.body.appendChild(pageDiv);
    }
  }

  // Small delay to ensure rendering is complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Trigger print
  iframe.contentWindow?.print();

  // Clean up after a delay
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}
