import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@utils/cn';
import type { DropdownFormField } from '@/types/forms';
import { useFormStore } from '@stores/formStore';

interface DropdownProps {
  field: DropdownFormField;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onValueChange?: () => void;
}

export function Dropdown({
  field,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
  onValueChange,
}: DropdownProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [filterText, setFilterText] = useState('');

  const updateFieldValue = useFormStore((state) => state.updateFieldValue);
  const focusedFieldId = useFormStore((state) => state.focusedFieldId);
  const validationErrors = useFormStore((state) => state.validationErrors);
  const setFocusedField = useFormStore((state) => state.setFocusedField);

  const errors = validationErrors.get(field.id) || [];
  const hasError = errors.length > 0;

  // Focus management
  useEffect(() => {
    if (focusedFieldId === field.id) {
      if (field.allowCustom && inputRef.current) {
        inputRef.current.focus();
      } else if (selectRef.current) {
        selectRef.current.focus();
      }
    }
  }, [focusedFieldId, field.id, field.allowCustom]);

  // Convert PDF coordinates to screen coordinates
  const screenX = field.bounds.x * scale;
  const screenY = (pageHeight - field.bounds.y - field.bounds.height) * scale;
  const screenWidth = field.bounds.width * scale;
  const screenHeight = field.bounds.height * scale;

  // Filter options for search functionality
  const filteredOptions = filterText
    ? field.options.filter((opt) =>
        opt.toLowerCase().includes(filterText.toLowerCase())
      )
    : field.options;

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      updateFieldValue(field.id, value);
      onValueChange?.();
    },
    [field.id, updateFieldValue, onValueChange]
  );

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomValue(value);
      setFilterText(value);
      updateFieldValue(field.id, value);
    },
    [field.id, updateFieldValue]
  );

  const handleOptionSelect = useCallback(
    (value: string) => {
      updateFieldValue(field.id, value);
      setCustomValue(value);
      setIsOpen(false);
      setFilterText('');
      onValueChange?.();
    },
    [field.id, updateFieldValue, onValueChange]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setFocusedField(field.id);
    onFocus?.();
  }, [field.id, setFocusedField, onFocus]);

  const handleBlur = useCallback(() => {
    // Delay blur to allow option click to register
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
      setFilterText('');
      onBlur?.();
    }, 150);
  }, [onBlur]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onTab?.(e.shiftKey);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setFilterText('');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!isOpen) {
          setIsOpen(true);
        }
      } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
        e.preventDefault();
        const firstOption = filteredOptions[0];
        if (firstOption) {
          handleOptionSelect(firstOption);
        }
      }
    },
    [isOpen, filteredOptions, handleOptionSelect, onTab]
  );

  const baseClasses = cn(
    'absolute bg-white dark:bg-gray-700 border transition-colors',
    'text-black dark:text-white',
    'focus:outline-none',
    {
      'border-gray-300 dark:border-gray-600': !isFocused && !hasError,
      'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500':
        isFocused && !hasError,
      'border-red-500 dark:border-red-400': hasError,
      'cursor-not-allowed opacity-60': field.readonly,
    }
  );

  const style: React.CSSProperties = {
    left: screenX,
    top: screenY,
    width: screenWidth,
    height: screenHeight,
  };

  // Editable dropdown with custom value support
  if (field.allowCustom) {
    return (
      <div className="absolute" style={style}>
        <div className="relative w-full h-full">
          <input
            ref={inputRef}
            type="text"
            value={customValue || field.value}
            onChange={handleCustomInputChange}
            onFocus={() => {
              handleFocus();
              setIsOpen(true);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={field.readonly}
            placeholder={field.tooltip || 'Select or type...'}
            className={cn(baseClasses, 'w-full h-full px-2')}
            style={{
              fontSize: Math.max(8, screenHeight * 0.6),
            }}
            aria-label={field.name || 'Dropdown'}
            aria-required={field.required}
            aria-invalid={hasError}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          {/* Dropdown arrow */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-3 h-3 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {/* Dropdown list */}
          {isOpen && filteredOptions.length > 0 && (
            <ul
              className={cn(
                'absolute left-0 w-full bg-white dark:bg-gray-700',
                'border border-gray-300 dark:border-gray-600',
                'shadow-lg rounded-b max-h-40 overflow-y-auto z-50'
              )}
              style={{
                top: screenHeight,
                fontSize: Math.max(8, screenHeight * 0.6),
              }}
              role="listbox"
            >
              {filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={cn(
                    'px-2 py-1 cursor-pointer',
                    'hover:bg-blue-100 dark:hover:bg-blue-900',
                    { 'bg-blue-50 dark:bg-blue-800': option === field.value }
                  )}
                  role="option"
                  aria-selected={option === field.value}
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasError && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
            {errors[0]}
          </div>
        )}
      </div>
    );
  }

  // Standard select dropdown
  return (
    <div className="absolute" style={style}>
      <select
        ref={selectRef}
        value={field.value}
        onChange={handleSelectChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={field.readonly}
        className={cn(baseClasses, 'w-full h-full px-1 appearance-none pr-6')}
        style={{
          fontSize: Math.max(8, screenHeight * 0.6),
        }}
        aria-label={field.name || 'Dropdown'}
        aria-required={field.required}
        aria-invalid={hasError}
      >
        <option value="">{field.tooltip || 'Select...'}</option>
        {field.options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      {/* Dropdown arrow */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-3 h-3 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {hasError && (
        <div className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
          {errors[0]}
        </div>
      )}
    </div>
  );
}
