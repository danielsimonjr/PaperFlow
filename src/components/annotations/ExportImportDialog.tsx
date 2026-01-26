import { useState, useCallback, useRef } from 'react';
import { Download, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAnnotationStore } from '@stores/annotationStore';
import { useDocumentStore } from '@stores/documentStore';
import {
  exportAnnotations,
  importAnnotations,
  mergeAnnotations,
} from '@lib/annotations/serializer';

interface ExportImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'replace' | 'merge';

/**
 * Dialog for exporting and importing annotations.
 */
export function ExportImportDialog({ isOpen, onClose }: ExportImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const annotations = useAnnotationStore((state) => state.annotations);
  const importAnnotationsToStore = useAnnotationStore(
    (state) => state.importAnnotations
  );
  const clearAnnotations = useAnnotationStore((state) => state.clearAnnotations);
  const fileName = useDocumentStore((state) => state.fileName);

  // Handle export
  const handleExport = useCallback(() => {
    try {
      const json = exportAnnotations(annotations, fileName || undefined);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || 'annotations'}.paperflow.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [annotations, fileName, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImportError(null);
      setImportSuccess(null);

      try {
        const text = await file.text();
        const imported = importAnnotations(text);

        if (importMode === 'replace') {
          clearAnnotations();
          const json = JSON.stringify(imported);
          importAnnotationsToStore(json);
        } else {
          const merged = mergeAnnotations(annotations, imported);
          const json = JSON.stringify(merged);
          // Clear first to avoid duplicates
          clearAnnotations();
          importAnnotationsToStore(json);
        }

        setImportSuccess(
          `Successfully imported ${imported.length} annotation${imported.length !== 1 ? 's' : ''}`
        );

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        setImportError(
          error instanceof Error ? error.message : 'Failed to import annotations'
        );
      }
    },
    [importMode, annotations, importAnnotationsToStore, clearAnnotations]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Annotations
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'export'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={16} className="mr-2 inline" />
            Export
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={16} className="mr-2 inline" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'export' ? (
            <div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Export all annotations to a JSON file that can be imported later
                or shared with others.
              </p>

              <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>{annotations.length}</strong> annotation
                  {annotations.length !== 1 ? 's' : ''} will be exported
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 disabled:opacity-50"
                onClick={handleExport}
                disabled={annotations.length === 0}
              >
                <Download size={16} />
                Export Annotations
              </button>

              {annotations.length === 0 && (
                <p className="mt-2 text-center text-sm text-gray-500">
                  No annotations to export
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Import annotations from a previously exported JSON file.
              </p>

              {/* Import mode selection */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Import Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Merge with existing
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Replace all
                    </span>
                  </label>
                </div>
              </div>

              {/* File input */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.paperflow.json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                />
              </div>

              {/* Error message */}
              {importError && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{importError}</span>
                </div>
              )}

              {/* Success message */}
              {importSuccess && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{importSuccess}</span>
                </div>
              )}

              {importMode === 'replace' && annotations.length > 0 && (
                <p className="text-center text-sm text-amber-600 dark:text-amber-400">
                  Warning: This will replace {annotations.length} existing
                  annotation{annotations.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
