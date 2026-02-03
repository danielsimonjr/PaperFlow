/**
 * Binding Options Component
 *
 * Provides binding configuration options for booklet printing
 * including binding edge, type, and related settings.
 */

import { useMemo } from 'react';
import { cn } from '@utils/cn';

/**
 * Binding type
 */
export type BindingType =
  | 'saddleStitch'
  | 'perfectBind'
  | 'coilBind'
  | 'threePunchBind';

/**
 * Binding edge
 */
export type BindingEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Binding options value
 */
export interface BindingOptionsValue {
  type: BindingType;
  edge: BindingEdge;
  gutterWidth: number;
  creepCompensation: boolean;
}

interface BindingOptionsProps {
  value: BindingOptionsValue;
  onChange: (value: BindingOptionsValue) => void;
  pageCount: number;
  className?: string;
  compact?: boolean;
}

/**
 * Binding type info
 */
const BINDING_TYPES: Record<
  BindingType,
  {
    name: string;
    description: string;
    maxPages: number;
    icon: React.ReactNode;
  }
> = {
  saddleStitch: {
    name: 'Saddle Stitch',
    description: 'Folded and stapled through the spine',
    maxPages: 60,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
        <rect x="4" y="6" width="24" height="20" rx="1" strokeWidth="1.5" />
        <line x1="16" y1="6" x2="16" y2="26" strokeWidth="1.5" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
        <circle cx="16" cy="22" r="1" fill="currentColor" />
      </svg>
    ),
  },
  perfectBind: {
    name: 'Perfect Binding',
    description: 'Glued spine for larger documents',
    maxPages: 500,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
        <rect x="4" y="6" width="24" height="20" rx="1" strokeWidth="1.5" />
        <rect x="4" y="6" width="3" height="20" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  coilBind: {
    name: 'Coil Binding',
    description: 'Spiral coil through punched holes',
    maxPages: 300,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
        <rect x="8" y="6" width="20" height="20" rx="1" strokeWidth="1.5" />
        <path d="M4 9 C6 9 6 11 4 11 C6 11 6 13 4 13 C6 13 6 15 4 15 C6 15 6 17 4 17 C6 17 6 19 4 19 C6 19 6 21 4 21 C6 21 6 23 4 23" strokeWidth="1.5" />
      </svg>
    ),
  },
  threePunchBind: {
    name: '3-Hole Punch',
    description: 'For use with ring binders',
    maxPages: 500,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor">
        <rect x="4" y="6" width="24" height="20" rx="1" strokeWidth="1.5" />
        <circle cx="8" cy="10" r="2" strokeWidth="1.5" />
        <circle cx="8" cy="16" r="2" strokeWidth="1.5" />
        <circle cx="8" cy="22" r="2" strokeWidth="1.5" />
      </svg>
    ),
  },
};

export function BindingOptions({
  value,
  onChange,
  pageCount,
  className,
  compact = false,
}: BindingOptionsProps) {
  // Check which binding types are suitable
  const suitableTypes = useMemo(() => {
    return Object.entries(BINDING_TYPES)
      .filter(([, info]) => pageCount <= info.maxPages)
      .map(([type]) => type as BindingType);
  }, [pageCount]);

  // Update handler
  const updateValue = (updates: Partial<BindingOptionsValue>) => {
    onChange({ ...value, ...updates });
  };

  if (compact) {
    return (
      <div className={cn('space-y-4', className)}>
        <div>
          <label className="text-sm font-medium block mb-2">Binding Type</label>
          <select
            value={value.type}
            onChange={(e) => updateValue({ type: e.target.value as BindingType })}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            {Object.entries(BINDING_TYPES).map(([type, info]) => (
              <option
                key={type}
                value={type}
                disabled={!suitableTypes.includes(type as BindingType)}
              >
                {info.name}
                {!suitableTypes.includes(type as BindingType)
                  ? ` (max ${info.maxPages} pages)`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Binding Edge</label>
          <div className="flex gap-2">
            {(['left', 'right', 'top'] as BindingEdge[]).map((edge) => (
              <button
                key={edge}
                type="button"
                onClick={() => updateValue({ edge })}
                className={cn(
                  'flex-1 py-2 px-3 text-sm rounded border transition-colors capitalize',
                  value.edge === edge
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {edge}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Binding type selection */}
      <div>
        <h3 className="text-sm font-medium mb-3">Binding Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(BINDING_TYPES).map(([type, info]) => {
            const isSuitable = suitableTypes.includes(type as BindingType);
            const isSelected = value.type === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => isSuitable && updateValue({ type: type as BindingType })}
                disabled={!isSuitable}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border-2 transition-colors text-center',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : isSuitable
                      ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'mb-2',
                    isSelected
                      ? 'text-primary-600'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {info.icon}
                </div>
                <div className="font-medium text-sm">{info.name}</div>
                <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                {!isSuitable && (
                  <p className="text-xs text-red-500 mt-1">
                    Max {info.maxPages} pages
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Binding edge selection */}
      <div>
        <h3 className="text-sm font-medium mb-3">Binding Edge</h3>
        <div className="flex gap-3">
          {(['left', 'right', 'top'] as BindingEdge[]).map((edge) => (
            <button
              key={edge}
              type="button"
              onClick={() => updateValue({ edge })}
              className={cn(
                'flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-colors',
                value.edge === edge
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-8 h-10 border rounded relative mb-2',
                  value.edge === edge ? 'border-primary-400' : 'border-gray-300'
                )}
              >
                <div
                  className={cn(
                    'absolute bg-primary-500',
                    edge === 'left' && 'left-0 top-0 w-0.5 h-full',
                    edge === 'right' && 'right-0 top-0 w-0.5 h-full',
                    edge === 'top' && 'top-0 left-0 w-full h-0.5'
                  )}
                />
              </div>
              <span className="text-sm capitalize">{edge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gutter width */}
      <div>
        <h3 className="text-sm font-medium mb-3">Gutter Width</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={72}
            value={value.gutterWidth}
            onChange={(e) =>
              updateValue({ gutterWidth: parseInt(e.target.value, 10) })
            }
            className="flex-1"
          />
          <span className="text-sm w-16 text-right">
            {(value.gutterWidth / 72).toFixed(2)}"
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Extra space near the binding edge to account for the spine.
        </p>
      </div>

      {/* Creep compensation */}
      {(value.type === 'saddleStitch' || value.type === 'perfectBind') && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.creepCompensation}
              onChange={(e) =>
                updateValue({ creepCompensation: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm">Enable creep compensation</span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-6">
            Adjusts inner pages to account for paper thickness when folded.
          </p>
        </div>
      )}
    </div>
  );
}

export default BindingOptions;
