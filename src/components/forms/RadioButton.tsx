import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@utils/cn';
import type { RadioFormField } from '@/types/forms';
import { useFormStore } from '@stores/formStore';

interface RadioButtonProps {
  field: RadioFormField;
  optionValue: string;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onValueChange?: () => void;
}

export function RadioButton({
  field,
  optionValue,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
  onValueChange,
}: RadioButtonProps) {
  const radioRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const updateFieldValue = useFormStore((state) => state.updateFieldValue);
  const focusedFieldId = useFormStore((state) => state.focusedFieldId);
  const validationErrors = useFormStore((state) => state.validationErrors);
  const setFocusedField = useFormStore((state) => state.setFocusedField);

  const errors = validationErrors.get(field.id) || [];
  const hasError = errors.length > 0;
  const isSelected = field.value === optionValue;

  // Focus management
  useEffect(() => {
    if (focusedFieldId === field.id && radioRef.current) {
      radioRef.current.focus();
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

    // For radio buttons, clicking always selects this option
    updateFieldValue(field.id, optionValue);
    onValueChange?.();
  }, [field.id, field.readonly, optionValue, updateFieldValue, onValueChange]);

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
        ref={radioRef}
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-label={`${field.name || 'Radio'}: ${optionValue}`}
        aria-required={field.required}
        aria-invalid={hasError}
        disabled={field.readonly}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-center border-2 transition-colors',
          'rounded-full',
          {
            'border-gray-400 dark:border-gray-500': !isFocused && !hasError,
            'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200':
              isFocused && !hasError,
            'border-red-500 dark:border-red-400': hasError,
            'bg-white dark:bg-gray-700': true,
            'cursor-not-allowed opacity-60': field.readonly,
            'cursor-pointer hover:border-blue-400': !field.readonly,
          }
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {isSelected && (
          <div
            className="rounded-full bg-blue-500 dark:bg-blue-400"
            style={{
              width: size * 0.5,
              height: size * 0.5,
            }}
          />
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

interface RadioGroupProps {
  field: RadioFormField;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onValueChange?: () => void;
}

/**
 * RadioGroup renders all radio buttons for a radio field group
 */
export function RadioGroup({
  field,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
  onValueChange,
}: RadioGroupProps) {
  // If the field has options defined, render a button for each option
  // Otherwise just render a single button at the field's position
  if (field.options && field.options.length > 0) {
    return (
      <>
        {field.options.map((option, index) => (
          <RadioButton
            key={`${field.id}-${index}`}
            field={field}
            optionValue={option.value}
            scale={scale}
            pageHeight={pageHeight}
            onFocus={onFocus}
            onBlur={onBlur}
            onTab={onTab}
            onValueChange={onValueChange}
          />
        ))}
      </>
    );
  }

  // Single radio button at the field position
  return (
    <RadioButton
      field={field}
      optionValue={field.value || ''}
      scale={scale}
      pageHeight={pageHeight}
      onFocus={onFocus}
      onBlur={onBlur}
      onTab={onTab}
      onValueChange={onValueChange}
    />
  );
}
