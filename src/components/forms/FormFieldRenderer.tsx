import type { FormField } from '@/types/forms';
import { TextField } from './TextField';
import { Checkbox } from './Checkbox';
import { RadioButton } from './RadioButton';
import { Dropdown } from './Dropdown';

interface FormFieldRendererProps {
  field: FormField;
  scale: number;
  pageHeight: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onValueChange?: () => void;
}

/**
 * Renders the appropriate form field component based on field type
 */
export function FormFieldRenderer({
  field,
  scale,
  pageHeight,
  onFocus,
  onBlur,
  onTab,
  onValueChange,
}: FormFieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextField
          field={field}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          field={field}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
          onValueChange={onValueChange}
        />
      );

    case 'radio':
      return (
        <RadioButton
          field={field}
          optionValue={field.value || (field.options[0]?.value ?? '')}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
          onValueChange={onValueChange}
        />
      );

    case 'dropdown':
      return (
        <Dropdown
          field={field}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
          onValueChange={onValueChange}
        />
      );

    case 'signature':
      // Signature field will be implemented in Sprint 6
      return (
        <div
          className="absolute border-2 border-dashed border-gray-400 bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-center text-gray-500 text-xs"
          style={{
            left: field.bounds.x * scale,
            top: (pageHeight - field.bounds.y - field.bounds.height) * scale,
            width: field.bounds.width * scale,
            height: field.bounds.height * scale,
          }}
        >
          Signature
        </div>
      );

    case 'date':
      // Date field rendered as text for now
      return (
        <TextField
          field={{
            id: field.id,
            type: 'text',
            pageIndex: field.pageIndex,
            name: field.name,
            bounds: field.bounds,
            required: field.required,
            readonly: field.readonly,
            tooltip: field.tooltip,
            value: field.value || '',
            multiline: false,
          }}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
        />
      );

    case 'number':
      // Number field rendered as text for now
      return (
        <TextField
          field={{
            id: field.id,
            type: 'text',
            pageIndex: field.pageIndex,
            name: field.name,
            bounds: field.bounds,
            required: field.required,
            readonly: field.readonly,
            tooltip: field.tooltip,
            value: field.value?.toString() || '',
            multiline: false,
          }}
          scale={scale}
          pageHeight={pageHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onTab={onTab}
        />
      );

    default:
      // Unknown field type - render a placeholder
      console.warn(`Unknown form field type: ${(field as FormField).type}`);
      return null;
  }
}
