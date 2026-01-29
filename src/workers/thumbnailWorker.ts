/**
 * Web Worker for generating PDF page thumbnails off the main thread.
 *
 * Messages:
 * - { type: 'generate', pageNumber, pdfData, scale }
 * - Response: { type: 'thumbnail', pageNumber, imageData } or { type: 'error', pageNumber, error }
 *
 * Note: In the actual worker context, pdfjs-dist would be imported.
 * This module provides the message handling protocol.
 */

export interface ThumbnailRequest {
  type: 'generate';
  pageNumber: number;
  pdfData: ArrayBuffer;
  scale: number;
}

export interface ThumbnailResponse {
  type: 'thumbnail';
  pageNumber: number;
  imageData: ImageBitmap | null;
  width: number;
  height: number;
}

export interface ThumbnailError {
  type: 'error';
  pageNumber: number;
  error: string;
}

export type ThumbnailWorkerMessage = ThumbnailResponse | ThumbnailError;

/**
 * Create a thumbnail worker and provide a simple API for generating thumbnails.
 */
export function createThumbnailWorkerClient() {
  let worker: Worker | null = null;
  const pendingRequests = new Map<number, {
    resolve: (result: ThumbnailResponse) => void;
    reject: (error: Error) => void;
  }>();

  function getWorker(): Worker | null {
    if (worker) return worker;

    try {
      // Worker initialization - in production this would load the actual worker script
      worker = new Worker(
        new URL('./thumbnailWorkerScript.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e: MessageEvent<ThumbnailWorkerMessage>) => {
        const msg = e.data;
        if (msg.type === 'thumbnail') {
          const pending = pendingRequests.get(msg.pageNumber);
          if (pending) {
            pending.resolve(msg);
            pendingRequests.delete(msg.pageNumber);
          }
        } else if (msg.type === 'error') {
          const pending = pendingRequests.get(msg.pageNumber);
          if (pending) {
            pending.reject(new Error(msg.error));
            pendingRequests.delete(msg.pageNumber);
          }
        }
      };

      worker.onerror = () => {
        // Worker failed to load, clean up
        worker = null;
      };

      return worker;
    } catch {
      // Workers not supported or script failed to load
      return null;
    }
  }

  return {
    generateThumbnail(
      pageNumber: number,
      pdfData: ArrayBuffer,
      scale: number = 0.2
    ): Promise<ThumbnailResponse> {
      const w = getWorker();
      if (!w) {
        return Promise.reject(new Error('Worker not available'));
      }

      return new Promise((resolve, reject) => {
        pendingRequests.set(pageNumber, { resolve, reject });

        // Clone the buffer before transfer to avoid detaching the original
        // This allows the same PDF data to be used for multiple thumbnail requests
        const clonedData = pdfData.slice(0);

        const request: ThumbnailRequest = {
          type: 'generate',
          pageNumber,
          pdfData: clonedData,
          scale,
        };

        // Transfer ownership of the cloned buffer to the worker
        w.postMessage(request, [clonedData]);
      });
    },

    terminate() {
      worker?.terminate();
      worker = null;
      pendingRequests.clear();
    },
  };
}
