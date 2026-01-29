import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, Image } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useDocumentStore } from '@stores/documentStore';
import { useAnnotationStore } from '@stores/annotationStore';
import type { ImageFormat, ImageDpi } from '@lib/export/imageExport';
import { exportSinglePage, exportPagesAsZip } from '@lib/export/imageExport';

interface ImageExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageExportDialog({ isOpen, onClose }: ImageExportDialogProps) {
  const [format, setFormat] = useState<ImageFormat>('png');
  const [dpi, setDpi] = useState<ImageDpi>(150);
  const [quality, setQuality] = useState(0.85);
  const [exportRange, setExportRange] = useState<'current' | 'all'>('current');
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const renderer = useDocumentStore((s) => s.renderer);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const pageCount = useDocumentStore((s) => s.pageCount);
  const fileName = useDocumentStore((s) => s.fileName) ?? 'document';
  const annotations = useAnnotationStore((s) => s.annotations);

  const baseName = fileName.replace(/\.pdf$/i, '');

  const handleExport = async () => {
    if (!renderer) return;
    setIsExporting(true);

    try {
      const options = {
        format,
        dpi,
        quality,
        pageNumbers: exportRange === 'current'
          ? [currentPage]
          : Array.from({ length: pageCount }, (_, i) => i + 1),
        includeAnnotations,
        annotations: includeAnnotations ? annotations : undefined,
      };

      if (exportRange === 'current' || pageCount === 1) {
        await exportSinglePage(renderer, options.pageNumbers[0]!, options, baseName);
      } else {
        await exportPagesAsZip(renderer, options, baseName);
      }

      onClose();
    } catch (error) {
      console.error('Image export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold dark:text-white">
              <Image className="h-5 w-5" />
              Export as Image
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Format */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-300">Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('png')}
                  className={`rounded-lg px-4 py-2 text-sm ${format === 'png' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setFormat('jpeg')}
                  className={`rounded-lg px-4 py-2 text-sm ${format === 'jpeg' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  JPEG
                </button>
              </div>
            </div>

            {/* DPI */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-300">Resolution</label>
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value) as ImageDpi)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value={72}>72 DPI (Screen)</option>
                <option value={150}>150 DPI (Standard)</option>
                <option value={300}>300 DPI (Print Quality)</option>
              </select>
            </div>

            {/* JPEG Quality */}
            {format === 'jpeg' && (
              <div>
                <label className="mb-1 block text-sm font-medium dark:text-gray-300">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min={60}
                  max={100}
                  value={quality * 100}
                  onChange={(e) => setQuality(Number(e.target.value) / 100)}
                  className="w-full"
                />
              </div>
            )}

            {/* Page Range */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-300">Pages</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportRange('current')}
                  className={`rounded-lg px-4 py-2 text-sm ${exportRange === 'current' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  Current Page
                </button>
                <button
                  onClick={() => setExportRange('all')}
                  className={`rounded-lg px-4 py-2 text-sm ${exportRange === 'all' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  All Pages ({pageCount})
                </button>
              </div>
            </div>

            {/* Include Annotations */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Include annotations
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Render highlights, notes, shapes, and drawings onto the image
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || !renderer}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
