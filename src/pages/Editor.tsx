import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import { Sidebar } from '@components/layout/Sidebar';
import { Toolbar } from '@components/layout/Toolbar';
import { PDFViewer } from '@components/viewer/PDFViewer';
import { SearchBar } from '@components/toolbar/SearchBar';
import { LoadingOverlay } from '@components/ui/LoadingIndicator';
import { useFileSystem } from '@hooks/useFileSystem';
import { useBeforeUnload } from '@hooks/useBeforeUnload';
import { useAutoSave } from '@hooks/useAutoSave';
import { useDocumentStore } from '@stores/documentStore';

export default function Editor() {
  const [searchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openFromUrl, isLoading, loadProgress, error } = useFileSystem();
  const isModified = useDocumentStore((state) => state.isModified);
  const documentError = useDocumentStore((state) => state.error);
  const fileName = useDocumentStore((state) => state.fileName);

  // Warn before leaving with unsaved changes
  useBeforeUnload(isModified);

  // Enable auto-save
  useAutoSave({
    enabled: true,
    onAutoSave: () => {
      console.debug('Auto-saved document');
    },
    onAutoSaveError: (err) => {
      console.error('Auto-save failed:', err);
    },
  });

  // Load PDF from URL parameter on mount
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      openFromUrl(urlParam);
    }
  }, [searchParams, openFromUrl]);

  // Handle Ctrl+F for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && fileName) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileName]);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <Toolbar />

      {/* Search bar */}
      {isSearchOpen && (
        <div className="absolute left-1/2 top-28 z-50 w-full max-w-md -translate-x-1/2 px-4">
          <SearchBar
            isOpen={isSearchOpen}
            onClose={handleSearchClose}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <PDFViewer />
        </main>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <LoadingOverlay
          message="Loading PDF from URL..."
          progress={loadProgress}
          showProgress={loadProgress > 0}
        />
      )}

      {/* Error display */}
      {(error || documentError) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg bg-red-50 p-4 shadow-lg dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || documentError}
          </p>
        </div>
      )}
    </div>
  );
}
