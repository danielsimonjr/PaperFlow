/**
 * Batch Scan Workflow Component
 *
 * Multi-page scanning workflow with automatic page detection,
 * naming, and organization.
 */

import { useState, useCallback } from 'react';
import { useScannerStore } from '@stores/scannerStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { ScanResult } from '@lib/scanner/types';

interface BatchScanWorkflowProps {
  onComplete?: (scans: ScanResult[]) => void;
  onCancel?: () => void;
  className?: string;
}

type WorkflowStep = 'setup' | 'scanning' | 'review' | 'complete';

export function BatchScanWorkflow({
  onComplete,
  onCancel,
  className,
}: BatchScanWorkflowProps) {
  const {
    scanHistory,
    isScanning,
    selectedDevice,
    settings,
    startScan,
    clearHistory,
  } = useScannerStore();

  const [step, setStep] = useState<WorkflowStep>('setup');
  const [batchScans, setBatchScans] = useState<ScanResult[]>([]);
  const [autoDetectPages, setAutoDetectPages] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  const handleStartBatch = useCallback(async () => {
    setStep('scanning');
    setBatchScans([]);
    setScanCount(0);
  }, []);

  const handleScanPage = useCallback(async () => {
    if (!selectedDevice) return;

    try {
      await startScan();
      setScanCount((c) => c + 1);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  }, [selectedDevice, startScan]);

  const handleFinishScanning = useCallback(() => {
    setBatchScans([...scanHistory].reverse());
    setStep('review');
  }, [scanHistory]);

  const handleComplete = useCallback(() => {
    onComplete?.(batchScans);
    setStep('complete');
    clearHistory();
  }, [batchScans, onComplete, clearHistory]);

  const handleRestart = useCallback(() => {
    setBatchScans([]);
    setScanCount(0);
    clearHistory();
    setStep('setup');
  }, [clearHistory]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Progress steps */}
      <div className="flex items-center justify-center py-4 border-b dark:border-gray-700">
        {(['setup', 'scanning', 'review', 'complete'] as WorkflowStep[]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === s
                  ? 'bg-primary-500 text-white'
                  : idx < ['setup', 'scanning', 'review', 'complete'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}
            >
              {idx < ['setup', 'scanning', 'review', 'complete'].indexOf(step) ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-2',
                  idx < ['setup', 'scanning', 'review', 'complete'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Setup step */}
        {step === 'setup' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Batch Scan Setup</h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure settings for multi-page scanning
              </p>
            </div>

            {/* Scanner info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{selectedDevice?.name || 'No scanner selected'}</div>
                  <div className="text-xs text-gray-500">
                    {settings.resolution} DPI, {settings.colorMode}
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetectPages}
                  onChange={(e) => setAutoDetectPages(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <span className="font-medium text-sm">Auto-detect document edges</span>
                  <p className="text-xs text-gray-500">
                    Automatically crop to document boundaries
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useADF}
                  disabled={!selectedDevice?.capabilities?.hasADF}
                  className="rounded"
                />
                <div>
                  <span className="font-medium text-sm">Use document feeder</span>
                  <p className="text-xs text-gray-500">
                    {selectedDevice?.capabilities?.hasADF
                      ? 'Scan all pages from ADF automatically'
                      : 'Not available on this scanner'}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStartBatch}
                disabled={!selectedDevice}
                className="flex-1"
              >
                Start Batch
              </Button>
            </div>
          </div>
        )}

        {/* Scanning step */}
        {step === 'scanning' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Scanning Pages</h2>
              <p className="text-sm text-gray-500 mt-1">
                {scanCount === 0
                  ? 'Place the first document and scan'
                  : `${scanCount} page${scanCount !== 1 ? 's' : ''} scanned`}
              </p>
            </div>

            {/* Scan count display */}
            <div className="flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-5xl font-bold text-primary-500">{scanCount}</span>
              </div>
            </div>

            {/* Recent scans preview */}
            {scanHistory.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {scanHistory.slice(-4).map((scan, idx) => (
                  <div
                    key={scan.timestamp}
                    className="flex-shrink-0 w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden"
                  >
                    {scan.dataUrl && (
                      <img
                        src={scan.dataUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="primary"
                onClick={handleScanPage}
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  `Scan Page ${scanCount + 1}`
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={handleFinishScanning}
                disabled={scanCount === 0 || isScanning}
                className="w-full"
              >
                Done Scanning ({scanCount} pages)
              </Button>
            </div>
          </div>
        )}

        {/* Review step */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Review Pages</h2>
              <p className="text-sm text-gray-500 mt-1">
                Reorder or remove pages before creating PDF
              </p>
            </div>

            {/* Page grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {batchScans.map((scan, idx) => (
                <div
                  key={scan.timestamp}
                  className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                    {scan.dataUrl && (
                      <img
                        src={scan.dataUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      className="p-2 bg-white rounded-full shadow"
                      title="Move up"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const newScans = [...batchScans];
                        const temp = newScans[idx - 1];
                        const current = newScans[idx];
                        if (temp && current) {
                          newScans[idx - 1] = current;
                          newScans[idx] = temp;
                          setBatchScans(newScans);
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      className="p-2 bg-red-500 text-white rounded-full shadow"
                      title="Remove"
                      onClick={() => {
                        setBatchScans(batchScans.filter((_, i) => i !== idx));
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    Page {idx + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
              <Button variant="secondary" onClick={handleRestart} className="flex-1">
                Start Over
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={batchScans.length === 0}
                className="flex-1"
              >
                Create PDF ({batchScans.length} pages)
              </Button>
            </div>
          </div>
        )}

        {/* Complete step */}
        {step === 'complete' && (
          <div className="max-w-md mx-auto text-center space-y-6 py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Batch Complete!</h2>
              <p className="text-sm text-gray-500 mt-1">
                {batchScans.length} pages have been scanned and converted to PDF
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRestart} className="flex-1">
                Scan More
              </Button>
              <Button variant="primary" onClick={onCancel} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BatchScanWorkflow;
