import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentInfo, PDFPageInfo, PDFOutlineItem } from '@/types/pdf';

// Configure worker - must be set before loading any documents
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export class PDFRenderer {
  private document: pdfjsLib.PDFDocumentProxy | null = null;

  async loadDocument(
    source: ArrayBuffer | string
  ): Promise<PDFDocumentInfo> {
    const loadingTask = pdfjsLib.getDocument(source);
    this.document = await loadingTask.promise;

    const metadata = await this.document.getMetadata();
    const info = metadata.info as Record<string, unknown>;

    return {
      numPages: this.document.numPages,
      title: info?.Title as string | undefined,
      author: info?.Author as string | undefined,
      subject: info?.Subject as string | undefined,
      keywords: info?.Keywords as string | undefined,
      creator: info?.Creator as string | undefined,
      producer: info?.Producer as string | undefined,
    };
  }

  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0
  ): Promise<void> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  }

  async getPageInfo(pageNumber: number): Promise<PDFPageInfo> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });

    return {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate,
    };
  }

  async getTextContent(pageNumber: number): Promise<string> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const page = await this.document.getPage(pageNumber);
    const textContent = await page.getTextContent();

    return textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
  }

  async getOutline(): Promise<PDFOutlineItem[]> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const outline = await this.document.getOutline();
    if (!outline) {
      return [];
    }

    const processOutlineItems = async (
      items: pdfjsLib.PDFDocumentOutline[]
    ): Promise<PDFOutlineItem[]> => {
      const result: PDFOutlineItem[] = [];

      for (const item of items) {
        let pageNumber = 1;

        if (item.dest) {
          try {
            const dest = typeof item.dest === 'string'
              ? await this.document!.getDestination(item.dest)
              : item.dest;

            if (dest && dest[0]) {
              const pageIndex = await this.document!.getPageIndex(dest[0]);
              pageNumber = pageIndex + 1;
            }
          } catch {
            // Ignore errors getting page number
          }
        }

        const outlineItem: PDFOutlineItem = {
          title: item.title,
          pageNumber,
        };

        if (item.items && item.items.length > 0) {
          outlineItem.children = await processOutlineItems(item.items);
        }

        result.push(outlineItem);
      }

      return result;
    };

    return processOutlineItems(outline);
  }

  getPageCount(): number {
    return this.document?.numPages ?? 0;
  }

  destroy(): void {
    if (this.document) {
      this.document.destroy();
      this.document = null;
    }
  }
}
