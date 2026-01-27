import { useState, useEffect } from 'react';
import { parsePageRange } from '@lib/print/pageRange';

export type PageRangeType = 'all' | 'current' | 'custom';

interface PageRangeSelectorProps {
  pageCount: number;
  currentPage: number;
  onRangeChange: (pages: number[]) => void;
}

export function PageRangeSelector({ pageCount, currentPage, onRangeChange }: PageRangeSelectorProps) {
  const [rangeType, setRangeType] = useState<PageRangeType>('all');
  const [customRange, setCustomRange] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (rangeType === 'all') {
      onRangeChange(Array.from({ length: pageCount }, (_, i) => i + 1));
      setError('');
    } else if (rangeType === 'current') {
      onRangeChange([currentPage]);
      setError('');
    } else if (rangeType === 'custom') {
      const pages = parsePageRange(customRange, pageCount);
      if (customRange && pages.length === 0) {
        setError(`Enter valid page numbers (1-${pageCount})`);
      } else {
        setError('');
      }
      onRangeChange(pages.length > 0 ? pages : [currentPage]);
    }
  }, [rangeType, customRange, pageCount, currentPage, onRangeChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">Pages</label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="pageRange"
            checked={rangeType === 'all'}
            onChange={() => setRangeType('all')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">All pages ({pageCount})</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="pageRange"
            checked={rangeType === 'current'}
            onChange={() => setRangeType('current')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">Current page ({currentPage})</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="pageRange"
            checked={rangeType === 'custom'}
            onChange={() => setRangeType('custom')}
            className="text-primary-600"
          />
          <span className="text-sm dark:text-gray-300">Custom range</span>
        </label>

        {rangeType === 'custom' && (
          <div className="ml-6">
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g. 1-5, 8, 10-12"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
