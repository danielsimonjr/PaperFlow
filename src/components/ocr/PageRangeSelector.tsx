/**
 * Page Range Selector Component for OCR
 * Allows users to select which pages to process.
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { useDocumentStore } from '@/stores/documentStore';

export type PageRangeType = 'current' | 'all' | 'custom';

interface PageRangeSelectorProps {
  onRangeChange: (pages: number[]) => void;
}

export function PageRangeSelector({ onRangeChange }: PageRangeSelectorProps) {
  const pageCount = useDocumentStore((s) => s.pageCount);
  const currentPage = useDocumentStore((s) => s.currentPage);

  const [rangeType, setRangeType] = useState<PageRangeType>('current');
  const [customRange, setCustomRange] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    let pages: number[] = [];
    setRangeError(null);

    if (rangeType === 'current') {
      pages = [currentPage];
    } else if (rangeType === 'all') {
      pages = Array.from({ length: pageCount }, (_, i) => i);
    } else if (rangeType === 'custom') {
      const result = parsePageRange(customRange, pageCount);
      if (result.error) {
        setRangeError(result.error);
        pages = [];
      } else {
        pages = result.pages;
      }
    }

    onRangeChange(pages);
  }, [rangeType, customRange, currentPage, pageCount, onRangeChange]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Pages to Process</label>

      <div className="space-y-2" role="radiogroup" aria-label="Page range selection">
        {/* Current page */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pageRange"
            value="current"
            checked={rangeType === 'current'}
            onChange={() => setRangeType('current')}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm">Current page ({currentPage + 1})</span>
        </label>

        {/* All pages */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pageRange"
            value="all"
            checked={rangeType === 'all'}
            onChange={() => setRangeType('all')}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm">All pages ({pageCount})</span>
        </label>

        {/* Custom range */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="pageRange"
            value="custom"
            checked={rangeType === 'custom'}
            onChange={() => setRangeType('custom')}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm">Custom range</span>
        </label>

        {rangeType === 'custom' && (
          <div className="ml-6 space-y-1">
            <Input
              placeholder="e.g., 1-5, 8, 10-12"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              error={!!rangeError}
              aria-label="Custom page range"
              aria-describedby={rangeError ? 'range-error' : undefined}
            />
            {rangeError && (
              <p id="range-error" className="text-xs text-red-500">
                {rangeError}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Enter page numbers or ranges separated by commas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parses a page range string into an array of page indices (0-based)
 */
function parsePageRange(
  input: string,
  maxPages: number
): { pages: number[]; error: string | null } {
  if (!input.trim()) {
    return { pages: [], error: 'Please enter a page range' };
  }

  const pages = new Set<number>();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check for range (e.g., "1-5")
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((s) => parseInt(s.trim(), 10));

      if (isNaN(start!) || isNaN(end!)) {
        return { pages: [], error: `Invalid range: ${trimmed}` };
      }

      if (start! < 1 || end! > maxPages) {
        return { pages: [], error: `Page numbers must be between 1 and ${maxPages}` };
      }

      if (start! > end!) {
        return { pages: [], error: `Invalid range: ${trimmed} (start > end)` };
      }

      for (let i = start!; i <= end!; i++) {
        pages.add(i - 1); // Convert to 0-based
      }
    } else {
      // Single page number
      const pageNum = parseInt(trimmed, 10);

      if (isNaN(pageNum)) {
        return { pages: [], error: `Invalid page number: ${trimmed}` };
      }

      if (pageNum < 1 || pageNum > maxPages) {
        return { pages: [], error: `Page ${pageNum} is out of range (1-${maxPages})` };
      }

      pages.add(pageNum - 1); // Convert to 0-based
    }
  }

  return { pages: Array.from(pages).sort((a, b) => a - b), error: null };
}
