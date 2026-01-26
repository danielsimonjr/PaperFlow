import { useDocumentStore } from '@stores/documentStore';

export function PDFViewer() {
  const fileName = useDocumentStore((state) => state.fileName);
  const isLoading = useDocumentStore((state) => state.isLoading);
  const error = useDocumentStore((state) => state.error);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!fileName) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          Open a PDF file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-200 dark:bg-gray-800">
      {/* TODO: Render PDF pages with canvas */}
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-700">
        <p className="text-gray-600 dark:text-gray-300">
          PDF Viewer - {fileName}
        </p>
      </div>
    </div>
  );
}
