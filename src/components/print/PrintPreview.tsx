import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PrintPreviewProps {
  pages: number[];
  currentPreviewIndex: number;
  onPreviewIndexChange: (index: number) => void;
}

export function PrintPreview({ pages, currentPreviewIndex, onPreviewIndexChange }: PrintPreviewProps) {
  const [, setLoadError] = useState(false);
  const pageNumber = pages[currentPreviewIndex] ?? 1;

  return (
    <div className="flex flex-col items-center">
      {/* Preview area */}
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="font-medium">Page {pageNumber}</p>
          <p className="text-xs">Preview will render when printed</p>
        </div>
      </div>

      {/* Navigation */}
      {pages.length > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => {
              setLoadError(false);
              onPreviewIndexChange(Math.max(0, currentPreviewIndex - 1));
            }}
            disabled={currentPreviewIndex === 0}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4 dark:text-gray-400" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentPreviewIndex + 1} of {pages.length}
          </span>
          <button
            onClick={() => {
              setLoadError(false);
              onPreviewIndexChange(Math.min(pages.length - 1, currentPreviewIndex + 1));
            }}
            disabled={currentPreviewIndex === pages.length - 1}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
}
