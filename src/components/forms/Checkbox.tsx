import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@utils/cn';
import type { CheckboxFormField } from '@/types/forms';
import { useFormStore } from '@stores/formStore';

interface CheckboxProps {
  field: CheckboxFormField;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onValueChange?: () => void;
}

export function Checkbox({
  field,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
  onValueChange,
}: CheckboxProps) {
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const updateFieldValue = useFormStore((state) => state.updateFieldValue);
  const focusedFieldId = useFormStore((state) => state.focusedFieldId);
  const validationErrors = useFormStore((state) => state.validationErrors);
  const setFocusedField = useFormStore((state) => state.setFocusedField);

  const errors = validationErrors.get(field.id) || [];
  const hasError = errors.length > 0;

  // Focus management
  useEffect(() => {
    if (focusedFieldId === field.id && checkboxRef.current) {
      checkboxRef.current.focus();
    }
  }, [focusedFieldId, field.id]);

  // Convert PDF coordinates to screen coordinates
  const screenX = field.bounds.x * scale;
  const screenY = (pageHeight - field.bounds.y - field.bounds.height) * scale;
  const screenWidth = field.bounds.width * scale;
  const screenHeight = field.bounds.height * scale;
  const size = Math.min(screenWidth, screenHeight);

  const handleClick = useCallback(() => {
    if (field.readonly) return;

    updateFieldValue(field.id, !field.value);
    onValueChange?.();
  }, [field.id, field.value, field.readonly, updateFieldValue, onValueChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setFocusedField(field.id);
    onFocus?.();
  }, [field.id, setFocusedField, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onTab?.(e.shiftKey);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick, onTab]
  );

  return (
    <div
      className="absolute"
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
      }}
    >
      <button
        ref={checkboxRef}
        type="button"
        role="checkbox"
        aria-checked={field.value}
        aria-label={field.name || 'Checkbox'}
        aria-required={field.required}
        aria-invalid={hasError}
        disabled={field.readonly}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-center border-2 transition-colors',
          'rounded-sm',
          {
            'border-gray-400 dark:border-gray-500': !isFocused && !hasError,
            'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200':
              isFocused && !hasError,
            'border-red-500 dark:border-red-400': hasError,
            'bg-blue-500 dark:bg-blue-600': field.value,
            'bg-white dark:bg-gray-700': !field.value,
            'cursor-not-allowed opacity-60': field.readonly,
            'cursor-pointer hover:border-blue-400': !field.readonly,
          }
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {field.value && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3/4 h-3/4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      {hasError && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
          {errors[0]}
        </div>
      )}
    </div>
  );
}
