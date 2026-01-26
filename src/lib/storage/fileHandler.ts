import { fileOpen, fileSave, supported } from 'browser-fs-access';

export interface FileHandle {
  handle: FileSystemFileHandle | null;
  fileName: string;
  lastModified: number;
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = supported;

// Open a PDF file using the file picker
export async function openPdfFile(): Promise<{ file: File; handle: FileSystemFileHandle | null }> {
  const file = await fileOpen({
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    description: 'PDF Documents',
  });

  // browser-fs-access attaches the handle to the file object
  const handle = (file as File & { handle?: FileSystemFileHandle }).handle ?? null;

  return { file, handle };
}

// Save PDF to file
export async function savePdfFile(
  blob: Blob,
  existingHandle: FileSystemFileHandle | null,
  suggestedName: string = 'document.pdf'
): Promise<FileSystemFileHandle | null> {
  try {
    const savedHandle = await fileSave(
      blob,
      {
        fileName: suggestedName,
        extensions: ['.pdf'],
        description: 'PDF Documents',
      },
      existingHandle
    );

    return savedHandle ?? null;
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

// Save PDF as a new file (always show file picker)
export async function savePdfFileAs(
  blob: Blob,
  suggestedName: string = 'document.pdf'
): Promise<FileSystemFileHandle | null> {
  return savePdfFile(blob, null, suggestedName);
}

// Download PDF as fallback when File System Access API is not supported
export function downloadPdf(blob: Blob, fileName: string = 'document.pdf'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Fetch PDF from URL
export async function fetchPdfFromUrl(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
    throw new Error('URL does not point to a PDF file');
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    return response.arrayBuffer();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  // Combine chunks into single ArrayBuffer
  const result = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result.buffer;
}

// Generate a unique file ID for IndexedDB storage
export function generateFileId(fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const nameHash = fileName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  return `${nameHash}-${timestamp}-${random}`;
}
