import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentInfo, PDFPageInfo, PDFOutlineItem } from '@/types/pdf';

// Configure worker - must be set before loading any documents
// Use relative path for Electron (file:// protocol) since absolute paths resolve to drive root
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isElectron = typeof (window as any).electron !== 'undefined' ||
  (typeof window !== 'undefined' && window.location?.protocol === 'file:');
pdfjsLib.GlobalWorkerOptions.workerSrc = isElectron ? './pdf.worker.min.js' : '/pdf.worker.min.js';

export interface RenderResult {
  width: number;
  height: number;
}

export class PDFRenderer {
  private document: pdfjsLib.PDFDocumentProxy | null = null;
  private renderTasks: Map<number, pdfjsLib.RenderTask> = new Map();

  async loadDocument(
    source: ArrayBuffer | string,
    password?: string
  ): Promise<PDFDocumentInfo> {
    // Destroy existing document if any
    if (this.document) {
      this.destroy();
    }

    const loadingTask = pdfjsLib.getDocument({
      data: source instanceof ArrayBuffer ? source : undefined,
      url: typeof source === 'string' ? source : undefined,
      password,
    });

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
  ): Promise<RenderResult> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    // Cancel any existing render task for this page
    const existingTask = this.renderTasks.get(pageNumber);
    if (existingTask) {
      existingTask.cancel();
      this.renderTasks.delete(pageNumber);
    }

    const page = await this.document.getPage(pageNumber);

    // Support high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: scale * devicePixelRatio });

    // Set canvas dimensions for high-DPI
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Scale down with CSS for crisp rendering
    canvas.style.width = `${viewport.width / devicePixelRatio}px`;
    canvas.style.height = `${viewport.height / devicePixelRatio}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    });

    this.renderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
    } finally {
      this.renderTasks.delete(pageNumber);
    }

    return {
      width: viewport.width / devicePixelRatio,
      height: viewport.height / devicePixelRatio,
    };
  }

  cancelRender(pageNumber: number): void {
    const task = this.renderTasks.get(pageNumber);
    if (task) {
      task.cancel();
      this.renderTasks.delete(pageNumber);
    }
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

  async getTextContent(pageNumber: number) {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const page = await this.document.getPage(pageNumber);
    return await page.getTextContent();
  }

  async getTextContentAsString(pageNumber: number): Promise<string> {
    const textContent = await this.getTextContent(pageNumber);
    return textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
  }

  async getPage(pageNumber: number): Promise<pdfjsLib.PDFPageProxy> {
    if (!this.document) {
      throw new Error('No document loaded');
    }
    return await this.document.getPage(pageNumber);
  }

  async getOutline(): Promise<PDFOutlineItem[]> {
    if (!this.document) {
      throw new Error('No document loaded');
    }

    const outline = await this.document.getOutline();
    if (!outline) {
      return [];
    }

    interface OutlineItem {
      title: string;
      dest: string | unknown[] | null;
      items?: OutlineItem[];
    }

    const processOutlineItems = async (
      items: OutlineItem[]
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
