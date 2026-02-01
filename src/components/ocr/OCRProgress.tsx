/**
 * OCR Progress Component
 * Displays OCR processing progress with cancel option.
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { useOCRStore } from '@/stores/ocrStore';

function getStatusText(status?: string): string {
  switch (status) {
    case 'loading':
      return 'Loading language data...';
    case 'initializing':
      return 'Initializing OCR engine...';
    case 'recognizing':
      return 'Recognizing text...';
    case 'complete':
      return 'Complete!';
    case 'error':
      return 'Error occurred';
    default:
      return 'Processing...';
  }
}

export function OCRProgress() {
  const { progress, currentPage, totalPages, cancelOCR, error } = useOCRStore();

  const overallProgress =
    totalPages > 0 ? ((currentPage + (progress?.progress ?? 0)) / totalPages) * 100 : 0;
  const statusText = getStatusText(progress?.status);

  return (
    <div className="space-y-6 py-8" role="status" aria-live="polite">
      {/* Status with spinner */}
      <div className="flex items-center justify-center gap-3">
        {progress?.status !== 'complete' && progress?.status !== 'error' && (
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden="true" />
        )}
        <span className="text-lg font-medium">{statusText}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Page {currentPage + 1} of {totalPages}
          </span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} aria-label="Overall progress" />
      </div>

      {/* Current page progress */}
      {progress && progress.status === 'recognizing' && (
        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">Current page progress</div>
          <Progress
            value={(progress.progress ?? 0) * 100}
            className="h-1"
            aria-label="Current page progress"
          />
        </div>
      )}

      {/* Estimated time (optional enhancement) */}
      {progress?.status === 'recognizing' && totalPages > 1 && (
        <div className="text-center text-sm text-gray-500">
          {totalPages - currentPage - 1} pages remaining
        </div>
      )}

      {/* Cancel button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={cancelOCR}
          disabled={progress?.status === 'complete'}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
