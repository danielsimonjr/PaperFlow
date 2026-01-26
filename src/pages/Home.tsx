import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, FolderOpen, Clock } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function Home() {
  const navigate = useNavigate();

  const handleFileOpen = useCallback(async () => {
    // TODO: Implement file picker with browser-fs-access
    navigate('/editor');
  }, [navigate]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      // TODO: Handle dropped files
      navigate('/editor');
    },
    [navigate]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

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
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex w-full max-w-2xl flex-col items-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-colors hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800"
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
            <Button onClick={handleFileOpen} variant="primary" size="lg">
              <FolderOpen className="mr-2 h-5 w-5" />
              Open File
            </Button>
          </div>
        </div>

        <section className="mt-12 w-full max-w-2xl">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <h3 className="text-sm font-medium">Recent Files</h3>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-500">
            No recent files yet
          </p>
        </section>
      </main>
    </div>
  );
}
