import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, FolderOpen } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { DropZone } from '@components/viewer/DropZone';
import { RecentFiles } from '@components/home/RecentFiles';
import { useDocumentStore } from '@stores/documentStore';
import { storage, RecentFile } from '@lib/storage/indexeddb';
import { generateFileId } from '@lib/storage/fileHandler';
import { useFileSystem } from '@hooks/useFileSystem';

export default function Home() {
  const navigate = useNavigate();
  const loadDocument = useDocumentStore((state) => state.loadDocument);
  const loadDocumentFromArrayBuffer = useDocumentStore(
    (state) => state.loadDocumentFromArrayBuffer
  );
  const { open: openFilePicker } = useFileSystem();

  const addToRecentFiles = useCallback(
    async (file: File, thumbnail?: string) => {
      try {
        const recentFile: RecentFile = {
          id: generateFileId(file.name),
          name: file.name,
          size: file.size,
          lastOpened: new Date(),
          thumbnail,
        };
        await storage.addRecentFile(recentFile);

        // Also store the document data for potential re-opening
        const arrayBuffer = await file.arrayBuffer();
        await storage.saveDocument(recentFile.id, arrayBuffer);
      } catch (error) {
        console.error('Failed to add to recent files:', error);
      }
    },
    []
  );

  const handleFileDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      await loadDocument(file);
      await addToRecentFiles(file);
      navigate('/editor');
    },
    [loadDocument, addToRecentFiles, navigate]
  );

  const handleFileOpen = useCallback(async () => {
    await openFilePicker();
  }, [openFilePicker]);

  const handleRecentFileSelect = useCallback(
    async (recentFile: RecentFile) => {
      try {
        // Try to load from stored document data
        const documentData = await storage.getDocument(recentFile.id);
        if (documentData) {
          await loadDocumentFromArrayBuffer(documentData, recentFile.name);
          // Update last opened time
          await storage.addRecentFile({
            ...recentFile,
            lastOpened: new Date(),
          });
          navigate('/editor');
        } else {
          // Document data not found, need to re-select the file
          console.warn('Document data not found in storage');
          await openFilePicker();
        }
      } catch (error) {
        console.error('Failed to open recent file:', error);
      }
    },
    [loadDocumentFromArrayBuffer, navigate, openFilePicker]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900 text-white">
            <FileUp className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            PaperFlow
          </h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <DropZone
            onFileDrop={handleFileDrop}
            className="mb-8"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
              <FileUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>

            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Open a PDF to get started
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              Drag and drop a file here, or click to browse
            </p>

            <div className="flex gap-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileOpen();
                }}
                variant="primary"
                size="lg"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Open File
              </Button>
            </div>
          </DropZone>

          <RecentFiles
            onFileSelect={handleRecentFileSelect}
            className="mt-8"
          />
        </div>
      </main>
    </div>
  );
}
