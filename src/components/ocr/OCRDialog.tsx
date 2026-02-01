/**
 * OCR Dialog Component
 * Main dialog for configuring and running OCR on PDF pages.
 */

import { useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useOCRStore } from '@/stores/ocrStore';
import { useDocumentStore } from '@/stores/documentStore';
import { LanguageSelector } from './LanguageSelector';
import { PageRangeSelector } from './PageRangeSelector';
import { PreprocessingOptions } from './PreprocessingOptions';
import { OCRProgress } from './OCRProgress';
import { OCREngine } from '@/lib/ocr/ocrEngine';
import { preprocessImage, renderPageToCanvas } from '@/lib/ocr/imagePreprocessor';

export function OCRDialog() {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const {
    isProcessing,
    language,
    preprocessingOptions,
    startProcessing,
    updateProgress,
    setCurrentPage,
    addResult,
    stopProcessing,
    setError,
    cancelOCR,
  } = useOCRStore();

  const renderer = useDocumentStore((s) => s.renderer);

  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [ocrEngine, setOcrEngine] = useState<OCREngine | null>(null);

  const isOpen = activeDialog === 'ocr';

  const handlePageRangeChange = useCallback((pages: number[]) => {
    setSelectedPages(pages);
  }, []);

  const handleStartOCR = async () => {
    if (!renderer || selectedPages.length === 0) {
      setError('No pages selected for OCR');
      return;
    }

    startProcessing(selectedPages.length);

    // Create OCR engine with progress callback
    const engine = new OCREngine((progress) => {
      updateProgress(progress);
    });
    setOcrEngine(engine);

    try {
      // Initialize with selected language
      await engine.initialize(language);

      // Process each page
      for (let i = 0; i < selectedPages.length; i++) {
        const pageIndex = selectedPages[i]!;
        setCurrentPage(i);

        // Check if cancelled
        if (!useOCRStore.getState().isProcessing) {
          break;
        }

        try {
          // Get page from PDF.js renderer
          const pdfPage = await renderer.getPage(pageIndex + 1);

          // Render page to canvas
          const canvas = await renderPageToCanvas(
            pdfPage,
            preprocessingOptions.scale ?? 2.0
          );

          // Apply preprocessing
          const processedCanvas = preprocessImage(canvas, preprocessingOptions);

          // Run OCR
          const result = await engine.recognize(processedCanvas, undefined, pageIndex);

          // Store result
          addResult(pageIndex, result);
        } catch (pageError) {
          console.error(`Error processing page ${pageIndex + 1}:`, pageError);
          // Continue with other pages
        }
      }

      stopProcessing();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'OCR failed');
    } finally {
      await engine.terminate();
      setOcrEngine(null);
    }
  };

  const handleCancel = async () => {
    if (ocrEngine) {
      await ocrEngine.terminate();
      setOcrEngine(null);
    }
    cancelOCR();
  };

  const handleClose = () => {
    if (isProcessing) {
      handleCancel();
    }
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recognize Text (OCR)
          </DialogTitle>
        </DialogHeader>

        {isProcessing ? (
          <OCRProgress />
        ) : (
          <div className="space-y-6">
            {/* Page Selection */}
            <PageRangeSelector onRangeChange={handlePageRangeChange} />

            {/* Language Selection */}
            <LanguageSelector />

            {/* Preprocessing Options */}
            <PreprocessingOptions />

            {/* Info */}
            <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <p>
                OCR will recognize text in the selected pages. The recognized text can be
                searched, copied, and embedded into the PDF for text selection.
              </p>
              <p className="mt-2">
                <strong>Tip:</strong> For best results, use high-quality scans at 300 DPI or
                higher.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleStartOCR}
                disabled={selectedPages.length === 0}
              >
                Start OCR ({selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
