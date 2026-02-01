/**
 * OCR Results Panel Component
 * Displays OCR text results with confidence indicators and editing capabilities.
 */

import { useState, useMemo } from 'react';
import { Search, Copy, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOCRStore } from '@/stores/ocrStore';
import { useDocumentStore } from '@/stores/documentStore';
import { cn } from '@/utils/cn';

export function OCRResultsPanel() {
  const results = useOCRStore((s) => s.results);
  const updateWordText = useOCRStore((s) => s.updateWordText);
  const currentPage = useDocumentStore((s) => s.currentPage);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const pageResult = results.get(currentPage);

  const filteredWords = useMemo(() => {
    if (!pageResult) return [];
    if (!searchQuery) return pageResult.words;
    const lower = searchQuery.toLowerCase();
    return pageResult.words.filter((w) => w.text.toLowerCase().includes(lower));
  }, [pageResult, searchQuery]);

  const handleCopyText = async () => {
    if (!pageResult) return;
    try {
      await navigator.clipboard.writeText(pageResult.text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleExportText = () => {
    if (!pageResult) return;
    const blob = new Blob([pageResult.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-page-${currentPage + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (confidence >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const handleStartEdit = (index: number, text: string) => {
    setEditingWordIndex(index);
    setEditValue(text);
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim()) {
      updateWordText(currentPage, index, editValue.trim());
    }
    setEditingWordIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingWordIndex(null);
    setEditValue('');
  };

  if (!pageResult) {
    return (
      <div className="p-4 text-center text-gray-500 h-full flex flex-col items-center justify-center">
        <Search className="h-12 w-12 mb-4 opacity-20" />
        <p className="font-medium">No OCR results for this page</p>
        <p className="text-sm mt-1">Run OCR from the toolbar to recognize text.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-2 border-b flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in results..."
            className="pl-8 h-8"
            aria-label="Search OCR results"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyText}
          aria-label="Copy all text"
          title="Copy all text"
        >
          {copySuccess ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExportText}
          aria-label="Export as text file"
          title="Export as text file"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Confidence Legend */}
      <div className="p-2 border-b flex items-center gap-4 text-xs shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
          High (≥90%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30" />
          Medium (70-89%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" />
          Low (&lt;70%)
        </span>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredWords.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            {searchQuery ? 'No matching words found' : 'No words recognized'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {filteredWords.map((word, index) => (
              <span
                key={index}
                className={cn(
                  'px-1 rounded cursor-pointer hover:ring-1 hover:ring-primary-500 inline-flex items-center',
                  getConfidenceColor(word.confidence)
                )}
                title={`Confidence: ${word.confidence.toFixed(1)}%`}
                onClick={() => handleStartEdit(index, word.text)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStartEdit(index, word.text);
                  }
                }}
              >
                {editingWordIndex === index ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 px-1 border rounded text-sm bg-white dark:bg-gray-800"
                      autoFocus
                      aria-label="Edit word"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(index);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(index);
                      }}
                      aria-label="Save edit"
                      className="p-0.5 hover:bg-green-100 rounded"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      aria-label="Cancel edit"
                      className="p-0.5 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </button>
                  </span>
                ) : (
                  word.text
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-2 border-t text-sm text-gray-600 dark:text-gray-400 shrink-0">
        <div className="flex justify-between">
          <span>{pageResult.words.length} words recognized</span>
          <span>Avg confidence: {pageResult.confidence.toFixed(1)}%</span>
        </div>
        <div className="text-xs mt-1">
          Processing time: {(pageResult.processingTime / 1000).toFixed(2)}s
        </div>
      </div>
    </div>
  );
}
