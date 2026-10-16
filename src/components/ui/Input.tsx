/**
 * Input UI Component
 * A simple styled input component.
 */

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Props for the Input component: the standard input attributes, plus an error flag.
 * error makes the border and focus ring red.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Text input that forwards its ref to a native input element.
 * The type defaults to text. The error flag turns the border and focus ring red.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 py-2 text-sm',
          'border-gray-300 dark:border-gray-600',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
