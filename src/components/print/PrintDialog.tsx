import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useDocumentStore } from '@stores/documentStore';
import { useAnnotationStore } from '@stores/annotationStore';
import { useFormStore } from '@stores/formStore';
import { PageRangeSelector } from './PageRangeSelector';
import { ScaleOptions, type ScaleType } from './ScaleOptions';
import { OrientationOptions, type Orientation } from './OrientationOptions';
import { PrintPreview } from './PrintPreview';
import { executePrint, type PrintOptions } from '@lib/print/executePrint';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrintDialog({ isOpen, onClose }: PrintDialogProps) {
  const [pages, setPages] = useState<number[]>([]);
  const [scaleType, setScaleType] = useState<ScaleType>('fit');
  const [customScale, setCustomScale] = useState(100);
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [copies, setCopies] = useState(1);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeFormFields, setIncludeFormFields] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  const renderer = useDocumentStore((s) => s.renderer);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const annotations = useAnnotationStore((s) => s.annotations);
  const formFields = useFormStore((s) => s.fields);

  const handleRangeChange = useCallback((newPages: number[]) => {
    setPages(newPages);
    setPreviewIndex(0);
  }, []);

  const handlePrint = async () => {
    if (!renderer) return;
    setIsPrinting(true);

    try {
      const printOptions: PrintOptions = {
        pages: pages.length > 0 ? pages : [currentPage],
        scaleType,
        customScale,
        orientation,
        copies,
        includeAnnotations,
        includeFormFields,
        annotations: includeAnnotations ? annotations : undefined,
        formFields: includeFormFields ? formFields : undefined,
      };

      await executePrint(renderer, printOptions);
      onClose();
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const displayPages = pages.length > 0 ? pages : [currentPage];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900" style={{ maxHeight: '90vh' }}>
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold dark:text-white">
              <Printer className="h-5 w-5" />
              Print Document
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {/* Print Preview */}
            <PrintPreview
              pages={displayPages}
              currentPreviewIndex={previewIndex}
              onPreviewIndexChange={setPreviewIndex}
            />

            {/* Page Range */}
            <PageRangeSelector
              pageCount={pageCount}
              currentPage={currentPage}
              onRangeChange={handleRangeChange}
            />

            {/* Scale */}
            <ScaleOptions
              scaleType={scaleType}
              customScale={customScale}
              onScaleTypeChange={setScaleType}
              onCustomScaleChange={setCustomScale}
            />

            {/* Orientation */}
            <OrientationOptions
              orientation={orientation}
              onOrientationChange={setOrientation}
            />

            {/* Copies */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-300">Copies</label>
              <input
                type="number"
                min={1}
                max={99}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(99, Number(e.target.value))))}
                className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Include Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm dark:text-gray-300">Include annotations</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeFormFields}
                  onChange={(e) => setIncludeFormFields(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm dark:text-gray-300">Include form field values</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={isPrinting || !renderer}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isPrinting ? 'Preparing...' : 'Print'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
