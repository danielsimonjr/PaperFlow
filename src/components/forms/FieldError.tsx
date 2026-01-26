import { cn } from '@utils/cn';

interface FieldErrorProps {
  errors: string[];
  className?: string;
}

/**
 * Component to display field validation errors
 */
export function FieldError({ errors, className }: FieldErrorProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={cn('text-xs text-red-500 dark:text-red-400', className)}>
      {errors.length === 1 ? (
        <p>{errors[0]}</p>
      ) : (
        <ul className="list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FieldErrorTooltipProps {
  errors: string[];
  visible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tooltip version of field error display
 */
export function FieldErrorTooltip({
  errors,
  visible,
  position = 'bottom',
}: FieldErrorTooltipProps) {
  if (!visible || errors.length === 0) {
    return null;
  }

  const positionClasses = {
    top: 'bottom-full left-0 mb-1',
    bottom: 'top-full left-0 mt-1',
    left: 'right-full top-0 mr-1',
    right: 'left-full top-0 ml-1',
  };

  return (
    <div
      className={cn(
        'absolute z-50 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700',
        'rounded px-2 py-1 shadow-lg',
        'text-xs text-red-700 dark:text-red-200',
        'whitespace-nowrap',
        positionClasses[position]
      )}
      role="alert"
    >
      {errors.length === 1 ? (
        <span>{errors[0]}</span>
      ) : (
        <ul className="list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface RequiredIndicatorProps {
  className?: string;
}

/**
 * Visual indicator for required fields
 */
export function RequiredIndicator({ className }: RequiredIndicatorProps) {
  return (
    <span
      className={cn('text-red-500 dark:text-red-400', className)}
      aria-label="required"
    >
      *
    </span>
  );
}
