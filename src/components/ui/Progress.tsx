/**
 * Progress UI Component
 * A progress bar component.
 */

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Props for the Progress component: the standard div attributes, value, max and aria-label.
 * value defaults to 0, and max defaults to 100.
 * The fill is value divided by max, clamped from 0 to 100 percent.
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  'aria-label'?: string;
}

/**
 * Progress bar that forwards its ref to a div with the progressbar role.
 * The aria-valuenow attribute is value, and aria-valuemax is max.
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className, 'aria-label': ariaLabel, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className={cn(
          'h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-primary-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
