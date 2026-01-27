import { useMemo } from 'react';

interface DateStampProps {
  date?: Date;
  format?: 'short' | 'medium' | 'long' | 'iso';
  position?: 'below' | 'right' | 'left';
  className?: string;
}

const DATE_FORMATS = {
  short: { month: '2-digit', day: '2-digit', year: 'numeric' } as const,
  medium: { month: 'short', day: 'numeric', year: 'numeric' } as const,
  long: { month: 'long', day: 'numeric', year: 'numeric' } as const,
  iso: undefined,
};

/**
 * Date stamp component to display alongside signatures.
 */
export function DateStamp({ date = new Date(), format = 'medium', position = 'below', className = '' }: DateStampProps) {
  const formattedDate = useMemo(() => {
    if (format === 'iso') {
      return date.toISOString().split('T')[0];
    }

    return date.toLocaleDateString('en-US', DATE_FORMATS[format]);
  }, [date, format]);

  const positionClasses = {
    below: 'mt-1 text-center',
    right: 'ml-3 self-end',
    left: 'mr-3 self-end order-first',
  };

  return <div className={`text-xs text-gray-600 dark:text-gray-400 ${positionClasses[position]} ${className}`}>{formattedDate}</div>;
}
