/**
 * BatchWizard - Multi-step wizard for configuring batch operations
 */

import React, { useState, useCallback } from 'react';
import type {
  BatchOperationType,
  BatchJobOptions,
  JobPriority,
} from '@/types/batch';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import { Button } from '@/components/ui/Button';

export interface BatchWizardProps {
  /** Initial operation type */
  initialType?: BatchOperationType;
  /** Callback when wizard is completed */
  onComplete?: (jobId: string) => void;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
}

type WizardStep = 'files' | 'operation' | 'settings' | 'output' | 'review';

const OPERATION_LABELS: Record<BatchOperationType, string> = {
  compress: 'Compress',
  merge: 'Merge',
  split: 'Split',
  watermark: 'Watermark',
  ocr: 'OCR',
  'export-pdf': 'Export PDF',
  'export-images': 'Export Images',
  'header-footer': 'Header/Footer',
  'bates-number': 'Bates Numbering',
  flatten: 'Flatten',
};

const STEPS: WizardStep[] = ['files', 'operation', 'settings', 'output', 'review'];

const STEP_LABELS: Record<WizardStep, string> = {
  files: 'Select Files',
  operation: 'Choose Operation',
  settings: 'Configure Settings',
  output: 'Output Options',
  review: 'Review & Start',
};

interface FileInfo {
  name: string;
  path: string;
  size: number;
  pageCount?: number;
}

export function BatchWizard({
  initialType,
  onComplete,
  onCancel,
}: BatchWizardProps): React.ReactElement {
  const addJob = useNativeBatchStore((state) => state.addJob);

  const [currentStep, setCurrentStep] = useState<WizardStep>('files');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [operationType, setOperationType] = useState<BatchOperationType>(
    initialType || 'compress'
  );
  const [jobName, setJobName] = useState('');
  const [priority, setPriority] = useState<JobPriority>('normal');
  const [options, setOptions] = useState<Partial<BatchJobOptions>>({
    errorStrategy: 'skip',
    maxRetries: 2,
    parallelism: 2,
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]!);
    }
  }, [currentStepIndex, isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]!);
    }
  }, [currentStepIndex, isFirstStep]);

  const handleFileSelect = useCallback(async () => {
    // Use Electron API if available, otherwise use file input
    if (window.electron) {
      const result = await window.electron.showOpenDialog({
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        multiSelections: true,
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const fileInfos: FileInfo[] = [];

        for (const filePath of result.filePaths) {
          const stats = await window.electron.getFileStats(filePath);
          fileInfos.push({
            name: filePath.split(/[/\\]/).pop() || filePath,
            path: filePath,
            size: stats?.size || 0,
          });
        }

        setSelectedFiles((prev) => [...prev, ...fileInfos]);
      }
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const handleComplete = useCallback(() => {
    const fullOptions: BatchJobOptions = {
      errorStrategy: options.errorStrategy || 'skip',
      maxRetries: options.maxRetries || 2,
      parallelism: options.parallelism || 2,
      compress: operationType === 'compress' ? options.compress : undefined,
      merge: operationType === 'merge' ? options.merge : undefined,
      split: operationType === 'split' ? options.split : undefined,
      watermark: operationType === 'watermark' ? options.watermark : undefined,
      ocr: operationType === 'ocr' ? options.ocr : undefined,
      exportImages:
        operationType === 'export-images' ? options.exportImages : undefined,
    };

    const jobId = addJob(
      operationType,
      jobName || `${OPERATION_LABELS[operationType]} - ${new Date().toLocaleString()}`,
      selectedFiles,
      fullOptions,
      priority
    );

    onComplete?.(jobId);
  }, [addJob, operationType, jobName, selectedFiles, options, priority, onComplete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'files':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select PDF Files</h3>
              <div className="flex gap-2">
                <Button onClick={handleFileSelect}>Add Files</Button>
                {selectedFiles.length > 0 && (
                  <Button variant="ghost" onClick={handleClearFiles}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {selectedFiles.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  No files selected. Click &quot;Add Files&quot; to select PDF files.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.path}-${index}`}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500">
              {selectedFiles.length} file(s) selected,{' '}
              {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))} total
            </p>
          </div>
        );

      case 'operation':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Operation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(OPERATION_LABELS) as BatchOperationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setOperationType(type)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    operationType === type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{OPERATION_LABELS[type]}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configure Settings</h3>

            {/* Operation-specific settings */}
            {operationType === 'compress' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Quality</span>
                  <select
                    value={options.compress?.quality || 'medium'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        compress: {
                          ...options.compress,
                          quality: e.target.value as 'low' | 'medium' | 'high' | 'maximum',
                          imageQuality: options.compress?.imageQuality || 0.7,
                          removeMetadata: options.compress?.removeMetadata ?? true,
                          subsampleImages: options.compress?.subsampleImages ?? true,
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="low">Low (smallest size)</option>
                    <option value="medium">Medium (balanced)</option>
                    <option value="high">High (good quality)</option>
                    <option value="maximum">Maximum (best quality)</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.compress?.removeMetadata ?? true}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        compress: {
                          ...options.compress!,
                          removeMetadata: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Remove metadata</span>
                </label>
              </div>
            )}

            {operationType === 'merge' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Output Name</span>
                  <input
                    type="text"
                    value={options.merge?.outputName || 'merged'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        merge: {
                          ...options.merge,
                          outputName: e.target.value,
                          strategy: options.merge?.strategy || 'append',
                          addBookmarks: options.merge?.addBookmarks ?? true,
                          bookmarkLevel: options.merge?.bookmarkLevel || 1,
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="merged"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Merge Strategy</span>
                  <select
                    value={options.merge?.strategy || 'append'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        merge: {
                          ...options.merge!,
                          strategy: e.target.value as 'append' | 'interleave' | 'by-bookmark',
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="append">Append (sequential)</option>
                    <option value="interleave">Interleave pages</option>
                  </select>
                </label>
              </div>
            )}

            {operationType === 'split' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Split Method</span>
                  <select
                    value={options.split?.method || 'page-count'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        split: {
                          ...options.split,
                          method: e.target.value as 'page-count' | 'file-size' | 'range',
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="page-count">By page count</option>
                    <option value="file-size">By file size</option>
                    <option value="range">By page ranges</option>
                  </select>
                </label>
                {options.split?.method === 'page-count' && (
                  <label className="block">
                    <span className="text-sm font-medium">Pages per file</span>
                    <input
                      type="number"
                      min="1"
                      value={options.split?.pagesPerFile || 10}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          split: {
                            ...options.split!,
                            pagesPerFile: parseInt(e.target.value) || 10,
                          },
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </label>
                )}
              </div>
            )}

            {operationType === 'watermark' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Watermark Text</span>
                  <input
                    type="text"
                    value={options.watermark?.content || 'DRAFT'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        watermark: {
                          ...options.watermark,
                          content: e.target.value,
                          type: 'text',
                          position: options.watermark?.position || 'diagonal',
                          opacity: options.watermark?.opacity || 0.3,
                          rotation: options.watermark?.rotation || -45,
                          scale: options.watermark?.scale || 1,
                          layer: options.watermark?.layer || 'over',
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Opacity</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={options.watermark?.opacity || 0.3}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        watermark: {
                          ...options.watermark!,
                          opacity: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full"
                  />
                  <span className="text-sm text-gray-500">
                    {Math.round((options.watermark?.opacity || 0.3) * 100)}%
                  </span>
                </label>
              </div>
            )}

            {operationType === 'ocr' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Language</span>
                  <select
                    value={options.ocr?.language || 'eng'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        ocr: {
                          ...options.ocr,
                          language: e.target.value,
                          outputFormat: options.ocr?.outputFormat || 'searchable-pdf',
                          preprocessing: options.ocr?.preprocessing || {
                            deskew: true,
                            denoise: false,
                            contrast: true,
                          },
                          accuracy: options.ocr?.accuracy || 'balanced',
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="eng">English</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="spa">Spanish</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Accuracy</span>
                  <select
                    value={options.ocr?.accuracy || 'balanced'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        ocr: {
                          ...options.ocr!,
                          accuracy: e.target.value as 'fast' | 'balanced' | 'best',
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="fast">Fast (lower accuracy)</option>
                    <option value="balanced">Balanced</option>
                    <option value="best">Best (slower)</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        );

      case 'output':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Output Options</h3>

            <label className="block">
              <span className="text-sm font-medium">Job Name</span>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder={`${OPERATION_LABELS[operationType]} - ${new Date().toLocaleDateString()}`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as JobPriority)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Error Handling</span>
              <select
                value={options.errorStrategy || 'skip'}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    errorStrategy: e.target.value as 'stop' | 'skip' | 'retry',
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="skip">Skip failed files</option>
                <option value="retry">Retry failed files</option>
                <option value="stop">Stop on error</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Parallel Processing</span>
              <input
                type="number"
                min="1"
                max="8"
                value={options.parallelism || 2}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    parallelism: parseInt(e.target.value) || 2,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              <span className="text-xs text-gray-500">
                Number of files to process simultaneously
              </span>
            </label>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Start</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Operation:</span>
                <span className="font-medium">{OPERATION_LABELS[operationType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Files:</span>
                <span className="font-medium">{selectedFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Size:</span>
                <span className="font-medium">
                  {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium capitalize">{priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Handling:</span>
                <span className="font-medium capitalize">{options.errorStrategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parallelism:</span>
                <span className="font-medium">{options.parallelism} workers</span>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
              {selectedFiles.slice(0, 5).map((file, index) => (
                <div key={`${file.path}-${index}`} className="p-2 text-sm">
                  {file.name}
                </div>
              ))}
              {selectedFiles.length > 5 && (
                <div className="p-2 text-sm text-gray-500">
                  ... and {selectedFiles.length - 5} more files
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'files':
        return selectedFiles.length > 0;
      case 'operation':
        return true;
      case 'settings':
        return true;
      case 'output':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="batch-wizard max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:block">
                  {STEP_LABELS[step]}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!isFirstStep && (
            <Button variant="outline" onClick={goToPreviousStep}>
              Back
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={handleComplete} disabled={!canProceed()}>
              Start Processing
            </Button>
          ) : (
            <Button onClick={goToNextStep} disabled={!canProceed()}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
