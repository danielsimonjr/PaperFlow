import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@stores/documentStore';
import {
  openPdfFile,
  savePdfFile,
  savePdfFileAs,
  downloadPdf,
  fetchPdfFromUrl,
  isFileSystemAccessSupported,
} from '@lib/storage/fileHandler';

interface UseFileSystemReturn {
  fileHandle: FileSystemFileHandle | null;
  isLoading: boolean;
  isSaving: boolean;
  loadProgress: number;
  error: string | null;
  open: () => Promise<void>;
  openFromUrl: (url: string) => Promise<void>;
  save: (pdfBytes: Uint8Array) => Promise<boolean>;
  saveAs: (pdfBytes: Uint8Array) => Promise<boolean>;
  download: (pdfBytes: Uint8Array, fileName?: string) => void;
  clearError: () => void;
  hasUnsavedChanges: boolean;
  canSaveToOriginal: boolean;
}

export function useFileSystem(): UseFileSystemReturn {
  const navigate = useNavigate();
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadDocument = useDocumentStore((state) => state.loadDocument);
  const loadDocumentFromArrayBuffer = useDocumentStore(
    (state) => state.loadDocumentFromArrayBuffer
  );
  const fileName = useDocumentStore((state) => state.fileName);
  const isModified = useDocumentStore((state) => state.isModified);
  const setModified = useDocumentStore((state) => state.setModified);

  const open = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadProgress(0);

      const { file, handle } = await openPdfFile();
      setFileHandle(handle);

      await loadDocument(file);
      navigate('/editor');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled - not an error
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to open file';
      setError(message);
      console.error('Failed to open file:', err);
    } finally {
      setIsLoading(false);
      setLoadProgress(100);
    }
  }, [loadDocument, navigate]);

  const openFromUrl = useCallback(
    async (url: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadProgress(0);
        setFileHandle(null); // URL-loaded files can't be saved back

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        const arrayBuffer = await fetchPdfFromUrl(url, (loaded, total) => {
          if (total > 0) {
            setLoadProgress(Math.round((loaded / total) * 100));
          }
        });

        // Extract filename from URL or use default
        const urlFileName = url.split('/').pop()?.split('?')[0] || 'document.pdf';

        await loadDocumentFromArrayBuffer(arrayBuffer, urlFileName);
        navigate('/editor');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load PDF from URL';
        setError(message);
        console.error('Failed to load PDF from URL:', err);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [loadDocumentFromArrayBuffer, navigate]
  );

  const save = useCallback(
    async (pdfBytes: Uint8Array): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        // Use slice() to ensure we have a proper ArrayBuffer
        const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const suggestedName = fileName || 'document.pdf';

        if (!isFileSystemAccessSupported || !fileHandle) {
          // Fall back to save as or download
          if (isFileSystemAccessSupported) {
            const newHandle = await savePdfFileAs(blob, suggestedName);
            if (newHandle) {
              setFileHandle(newHandle);
              setModified(false);
              return true;
            }
            return false;
          } else {
            downloadPdf(blob, suggestedName);
            setModified(false);
            return true;
          }
        }

        // Save to existing handle
        const savedHandle = await savePdfFile(blob, fileHandle, suggestedName);
        if (savedHandle) {
          setFileHandle(savedHandle);
          setModified(false);
          return true;
        }
        return false;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }
        const message = err instanceof Error ? err.message : 'Failed to save file';
        setError(message);
        console.error('Failed to save file:', err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [fileHandle, fileName, setModified]
  );

  const saveAs = useCallback(
    async (pdfBytes: Uint8Array): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const suggestedName = fileName || 'document.pdf';

        if (!isFileSystemAccessSupported) {
          downloadPdf(blob, suggestedName);
          setModified(false);
          return true;
        }

        const newHandle = await savePdfFileAs(blob, suggestedName);
        if (newHandle) {
          setFileHandle(newHandle);
          setModified(false);
          return true;
        }
        return false;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return false;
        }
        const message = err instanceof Error ? err.message : 'Failed to save file';
        setError(message);
        console.error('Failed to save file:', err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [fileName, setModified]
  );

  const download = useCallback(
    (pdfBytes: Uint8Array, downloadFileName?: string) => {
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      downloadPdf(blob, downloadFileName || fileName || 'document.pdf');
    },
    [fileName]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fileHandle,
    isLoading,
    isSaving,
    loadProgress,
    error,
    open,
    openFromUrl,
    save,
    saveAs,
    download,
    clearError,
    hasUnsavedChanges: isModified,
    canSaveToOriginal: isFileSystemAccessSupported && fileHandle !== null,
  };
}
