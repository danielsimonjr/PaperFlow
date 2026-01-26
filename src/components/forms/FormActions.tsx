import { useState, useCallback } from 'react';
import { cn } from '@utils/cn';
import { useFormStore } from '@stores/formStore';
import { downloadFormDataAsJSON } from '@lib/forms/exportImport';
import { downloadFormDataAsFDF } from '@lib/forms/fdfExport';
import { downloadFormDataAsXFDF } from '@lib/forms/xfdfExport';
import { triggerImportDialog } from '@lib/forms/importData';
import { validateForm, getValidationSummary } from '@lib/forms/validation';

interface FormActionsProps {
  pdfFilename?: string;
  onValidationError?: (message: string) => void;
  className?: string;
}

type ExportFormat = 'json' | 'fdf' | 'xfdf';

/**
 * Form actions toolbar component
 */
export function FormActions({
  pdfFilename,
  onValidationError,
  className,
}: FormActionsProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const fields = useFormStore((state) => state.fields);
  const isDirty = useFormStore((state) => state.isDirty);
  const clearAllFields = useFormStore((state) => state.clearAllFields);
  const resetToDefaults = useFormStore((state) => state.resetToDefaults);
  const importFormData = useFormStore((state) => state.importFormData);
  const setValidationErrors = useFormStore((state) => state.setValidationErrors);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const baseFilename = pdfFilename
        ? pdfFilename.replace(/\.pdf$/i, '')
        : 'form-data';

      switch (format) {
        case 'json':
          downloadFormDataAsJSON(fields, `${baseFilename}.json`);
          break;
        case 'fdf':
          downloadFormDataAsFDF(fields, `${baseFilename}.fdf`, pdfFilename);
          break;
        case 'xfdf':
          downloadFormDataAsXFDF(fields, `${baseFilename}.xfdf`, pdfFilename);
          break;
      }

      setShowExportMenu(false);
    },
    [fields, pdfFilename]
  );

  const handleImport = useCallback(() => {
    triggerImportDialog(
      (data) => {
        importFormData(data);
      },
      (error) => {
        onValidationError?.(error.message);
      }
    );
  }, [importFormData, onValidationError]);

  const handleClear = useCallback(() => {
    clearAllFields();
    setShowConfirmClear(false);
  }, [clearAllFields]);

  const handleReset = useCallback(() => {
    resetToDefaults();
    setShowConfirmReset(false);
  }, [resetToDefaults]);

  const handleValidate = useCallback(() => {
    const result = validateForm(fields);
    setValidationErrors(result.errors);

    if (!result.isValid) {
      onValidationError?.(getValidationSummary(result));
    }

    return result.isValid;
  }, [fields, setValidationErrors, onValidationError]);

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Export dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowExportMenu(!showExportMenu)}
          className={cn(
            'px-3 py-1.5 text-sm rounded border transition-colors',
            'bg-white dark:bg-gray-700',
            'border-gray-300 dark:border-gray-600',
            'hover:bg-gray-50 dark:hover:bg-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          Export
          <svg
            className="w-4 h-4 ml-1 inline-block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {showExportMenu && (
          <div
            className={cn(
              'absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50'
            )}
          >
            <button
              type="button"
              onClick={() => handleExport('json')}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              JSON
            </button>
            <button
              type="button"
              onClick={() => handleExport('fdf')}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              FDF
            </button>
            <button
              type="button"
              onClick={() => handleExport('xfdf')}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              XFDF
            </button>
          </div>
        )}
      </div>

      {/* Import button */}
      <button
        type="button"
        onClick={handleImport}
        className={cn(
          'px-3 py-1.5 text-sm rounded border transition-colors',
          'bg-white dark:bg-gray-700',
          'border-gray-300 dark:border-gray-600',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
      >
        Import
      </button>

      {/* Validate button */}
      <button
        type="button"
        onClick={handleValidate}
        className={cn(
          'px-3 py-1.5 text-sm rounded border transition-colors',
          'bg-white dark:bg-gray-700',
          'border-gray-300 dark:border-gray-600',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
      >
        Validate
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Clear button */}
      <div className="relative">
        {showConfirmClear ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'px-3 py-1.5 text-sm rounded transition-colors',
                'bg-red-500 text-white',
                'hover:bg-red-600',
                'focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className={cn(
                'px-3 py-1.5 text-sm rounded border transition-colors',
                'bg-white dark:bg-gray-700',
                'border-gray-300 dark:border-gray-600',
                'hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmClear(true)}
            className={cn(
              'px-3 py-1.5 text-sm rounded border transition-colors',
              'bg-white dark:bg-gray-700',
              'border-gray-300 dark:border-gray-600',
              'hover:bg-gray-50 dark:hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Reset button */}
      {isDirty && (
        <div className="relative">
          {showConfirmReset ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'px-3 py-1.5 text-sm rounded transition-colors',
                  'bg-yellow-500 text-white',
                  'hover:bg-yellow-600',
                  'focus:outline-none focus:ring-2 focus:ring-yellow-500'
                )}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded border transition-colors',
                  'bg-white dark:bg-gray-700',
                  'border-gray-300 dark:border-gray-600',
                  'hover:bg-gray-50 dark:hover:bg-gray-600'
                )}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className={cn(
                'px-3 py-1.5 text-sm rounded border transition-colors',
                'bg-white dark:bg-gray-700',
                'border-gray-300 dark:border-gray-600',
                'hover:bg-gray-50 dark:hover:bg-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Click outside handler for export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
