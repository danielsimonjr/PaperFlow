/**
 * OCR Export Dialog Component
 * Allows exporting OCR results in various formats.
 */

import { useState } from 'react';
import { FileText, FileCode, FileJson, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useOCRStore } from '@/stores/ocrStore';
import {
  exportToPlainText,
  exportToHTML,
  exportToHOCR,
  exportToJSON,
  exportTablesToCSV,
  analyzeLayout,
} from '@/lib/ocr';
import { cn } from '@/utils/cn';

type ExportFormat = 'text' | 'html' | 'hocr' | 'json';

interface OCRExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OCRExportDialog({ open, onOpenChange }: OCRExportDialogProps) {
  const results = useOCRStore((s) => s.results);

  const [format, setFormat] = useState<ExportFormat>('text');
  const [includeConfidence, setIncludeConfidence] = useState(false);
  const [includeBoundingBoxes, setIncludeBoundingBoxes] = useState(false);
  const [preserveLayout, setPreserveLayout] = useState(true);
  const [exportTables, setExportTables] = useState(false);

  const formats: { id: ExportFormat; name: string; description: string; icon: typeof FileText }[] = [
    {
      id: 'text',
      name: 'Plain Text',
      description: 'Simple text file (.txt)',
      icon: FileText,
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'Formatted web page (.html)',
      icon: FileCode,
    },
    {
      id: 'hocr',
      name: 'hOCR',
      description: 'Standard OCR format with positions',
      icon: FileCode,
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data format (.json)',
      icon: FileJson,
    },
  ];

  const handleExport = () => {
    if (results.size === 0) return;

    // Analyze layout if needed
    let layout = undefined;
    if (preserveLayout) {
      const firstResult = results.values().next().value;
      if (firstResult) {
        layout = analyzeLayout(firstResult);
      }
    }

    const options = {
      includeConfidence,
      includeBoundingBoxes,
      preserveLineBreaks: true,
      preserveParagraphs: preserveLayout,
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'text':
        content = exportToPlainText(results, layout, options);
        filename = 'ocr-export.txt';
        mimeType = 'text/plain';
        break;
      case 'html':
        content = exportToHTML(results, layout, options);
        filename = 'ocr-export.html';
        mimeType = 'text/html';
        break;
      case 'hocr':
        content = exportToHOCR(results, options);
        filename = 'ocr-export.hocr';
        mimeType = 'text/html';
        break;
      case 'json':
        content = exportToJSON(results, layout, options);
        filename = 'ocr-export.json';
        mimeType = 'application/json';
        break;
      default:
        return;
    }

    // Download the file
    downloadFile(content, filename, mimeType);

    // Export tables if requested
    if (exportTables && layout && layout.tables.length > 0) {
      const tableCSVs = exportTablesToCSV(layout);
      tableCSVs.forEach((csv, tableId) => {
        downloadFile(csv, `table-${tableId}.csv`, 'text/csv');
      });
    }

    onOpenChange(false);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export OCR Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    format === f.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <f.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{f.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{f.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2 border-t">
            <label className="text-sm font-medium">Options</label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="preserveLayout"
                checked={preserveLayout}
                onCheckedChange={(checked) => setPreserveLayout(checked === true)}
              />
              <span className="text-sm">Preserve document layout</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="includeConfidence"
                checked={includeConfidence}
                onCheckedChange={(checked) => setIncludeConfidence(checked === true)}
              />
              <span className="text-sm">Include confidence scores</span>
            </label>

            {(format === 'json' || format === 'hocr') && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="includeBoundingBoxes"
                  checked={includeBoundingBoxes}
                  onCheckedChange={(checked) => setIncludeBoundingBoxes(checked === true)}
                />
                <span className="text-sm">Include bounding boxes</span>
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                id="exportTables"
                checked={exportTables}
                onCheckedChange={(checked) => setExportTables(checked === true)}
              />
              <span className="text-sm">Export tables as CSV</span>
            </label>
          </div>

          {/* Summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <p>
              Exporting <strong>{results.size}</strong> page
              {results.size !== 1 ? 's' : ''} as <strong>{format.toUpperCase()}</strong>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={results.size === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
