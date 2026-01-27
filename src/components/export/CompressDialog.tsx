import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Minimize2, Download } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useDocumentStore } from '@stores/documentStore';
import { compressPdf, analyzePdfSize, formatFileSize, type CompressionResult } from '@lib/export/compressPdf';
import { saveAs } from 'file-saver';

interface CompressDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompressDialog({ isOpen, onClose }: CompressDialogProps) {
  const [imageQuality, setImageQuality] = useState(0.7);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [subsampleImages, setSubsampleImages] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const fileData = useDocumentStore((s) => s.fileData);
  const fileName = useDocumentStore((s) => s.fileName) ?? 'document.pdf';

  const analysis = fileData ? analyzePdfSize(fileData) : null;

  const handleCompress = async () => {
    if (!fileData) return;
    setIsCompressing(true);
    setResult(null);

    try {
      const compressed = await compressPdf(fileData, {
        imageQuality,
        removeMetadata,
        subsampleImages,
      });
      setResult(compressed);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const compressedName = fileName.replace(/\.pdf$/i, '_compressed.pdf');
    saveAs(blob, compressedName);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold dark:text-white">
              <Minimize2 className="h-5 w-5" />
              Compress PDF
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-4 w-4 dark:text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          {analysis && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current file size: <span className="font-medium text-gray-900 dark:text-white">{analysis.formattedSize}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Image Quality */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-300">
                Image Quality: {Math.round(imageQuality * 100)}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={imageQuality * 100}
                onChange={(e) => setImageQuality(Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>

            {/* Remove Metadata */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={removeMetadata}
                onChange={(e) => setRemoveMetadata(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm dark:text-gray-300">Remove metadata (title, author, etc.)</span>
            </label>

            {/* Subsample Images */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={subsampleImages}
                onChange={(e) => setSubsampleImages(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm dark:text-gray-300">Downsample images</span>
            </label>
          </div>

          {/* Compression Result */}
          {result && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Compressed: {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                {result.compressionRatio.toFixed(1)}% reduction
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {result ? (
              <Button variant="primary" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Compressed
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCompress}
                disabled={isCompressing || !fileData}
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                {isCompressing ? 'Compressing...' : 'Compress'}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
