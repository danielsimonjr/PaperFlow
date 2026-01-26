import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@utils/cn';
import type { TextFormField } from '@/types/forms';
import { useFormStore } from '@stores/formStore';

interface TextFieldProps {
  field: TextFormField;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
}

export function TextField({
  field,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
}: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(field.value);
  const [isFocused, setIsFocused] = useState(false);

  const updateFieldValue = useFormStore((state) => state.updateFieldValue);
  const focusedFieldId = useFormStore((state) => state.focusedFieldId);
  const validationErrors = useFormStore((state) => state.validationErrors);
  const setFocusedField = useFormStore((state) => state.setFocusedField);

  const errors = validationErrors.get(field.id) || [];
  const hasError = errors.length > 0;

  // Sync local value with store value
  useEffect(() => {
    setLocalValue(field.value);
  }, [field.value]);

  // Focus management
  useEffect(() => {
    if (focusedFieldId === field.id && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusedFieldId, field.id]);

  // Convert PDF coordinates to screen coordinates
  const screenX = field.bounds.x * scale;
  const screenY = (pageHeight - field.bounds.y - field.bounds.height) * scale;
  const screenWidth = field.bounds.width * scale;
  const screenHeight = field.bounds.height * scale;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Enforce max length if specified
      if (field.maxLength && newValue.length > field.maxLength) {
        newValue = newValue.substring(0, field.maxLength);
      }

      setLocalValue(newValue);
    },
    [field.maxLength]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setFocusedField(field.id);
    onFocus?.();
  }, [field.id, setFocusedField, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Update store value on blur
    updateFieldValue(field.id, localValue);
    onBlur?.();
  }, [field.id, localValue, updateFieldValue, onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        // Save current value before moving
        updateFieldValue(field.id, localValue);
        onTab?.(e.shiftKey);
      } else if (e.key === 'Enter' && !field.multiline) {
        e.preventDefault();
        // Save and move to next field
        updateFieldValue(field.id, localValue);
        onTab?.(false);
      }
    },
    [field.id, field.multiline, localValue, updateFieldValue, onTab]
  );

  // Calculate character count indicator position
  const showCharCount =
    field.maxLength && localValue.length >= field.maxLength * 0.8;
  const charsRemaining = field.maxLength
    ? field.maxLength - localValue.length
    : null;

  const inputClasses = cn(
    'absolute bg-transparent border transition-colors',
    'text-black dark:text-white',
    'px-1 py-0.5',
    'focus:outline-none',
    {
      'border-gray-300 dark:border-gray-600': !isFocused && !hasError,
      'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500':
        isFocused && !hasError,
      'border-red-500 dark:border-red-400': hasError,
      'bg-red-50 dark:bg-red-900/20': hasError,
      'cursor-not-allowed opacity-60': field.readonly,
    }
  );

  if (field.multiline) {
    return (
      <div className="absolute" style={{ left: screenX, top: screenY }}>
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={field.readonly}
          placeholder={field.tooltip}
          className={cn(inputClasses, 'resize-none')}
          style={{
            width: screenWidth,
            height: screenHeight,
            fontSize: Math.max(8, screenHeight * 0.15),
            lineHeight: '1.4',
            padding: '2px 4px',
          }}
          aria-label={field.name || 'Text field'}
          aria-required={field.required}
          aria-invalid={hasError}
        />
        {showCharCount && (
          <span
            className={cn(
              'absolute -bottom-4 right-0 text-xs',
              charsRemaining !== null && charsRemaining <= 0
                ? 'text-red-500'
                : 'text-gray-500'
            )}
          >
            {charsRemaining}
          </span>
        )}
        {hasError && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
            {errors[0]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute" style={{ left: screenX, top: screenY }}>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={field.readonly}
        placeholder={field.tooltip}
        maxLength={field.maxLength}
        className={inputClasses}
        style={{
          width: screenWidth,
          height: screenHeight,
          fontSize: Math.max(8, screenHeight * 0.6),
          lineHeight: `${screenHeight}px`,
          padding: '0 4px',
        }}
        aria-label={field.name || 'Text field'}
        aria-required={field.required}
        aria-invalid={hasError}
      />
      {showCharCount && (
        <span
          className={cn(
            'absolute -bottom-4 right-0 text-xs',
            charsRemaining !== null && charsRemaining <= 0
              ? 'text-red-500'
              : 'text-gray-500'
          )}
        >
          {charsRemaining}
        </span>
      )}
      {hasError && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
          {errors[0]}
        </div>
      )}
    </div>
  );
}
