/**
 * Field Preview Component
 * Renders a visual preview of a form field on the design canvas.
 */

import { type FormFieldDefinition } from '@/stores/formDesignerStore';

interface FieldPreviewProps {
  field: FormFieldDefinition;
  isSelected: boolean;
  isPreviewMode: boolean;
  onValueChange?: (value: string) => void;
}

export function FieldPreview({ field, isSelected, isPreviewMode, onValueChange }: FieldPreviewProps) {
  const { appearance, defaultValue } = field;

  const baseStyle = {
    width: '100%',
    height: '100%',
    fontFamily: appearance.fontFamily,
    fontSize: `${appearance.fontSize}px`,
    color: appearance.fontColor,
    backgroundColor: appearance.backgroundColor,
    border: `${appearance.borderWidth}px solid ${appearance.borderColor}`,
    textAlign: appearance.textAlign as 'left' | 'center' | 'right',
    boxSizing: 'border-box' as const,
  };

  const renderField = () => {
    switch (field.type) {
      case 'textField':
        return (
          <input
            type="text"
            style={baseStyle}
            className="px-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder || field.name}
            defaultValue={defaultValue}
            readOnly={!isPreviewMode || field.readOnly}
            onChange={(e) => onValueChange?.(e.target.value)}
          />
        );

      case 'textArea':
        return (
          <textarea
            style={{ ...baseStyle, resize: 'none' }}
            className="px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder || field.name}
            defaultValue={defaultValue}
            readOnly={!isPreviewMode || field.readOnly}
            onChange={(e) => onValueChange?.(e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center justify-center w-full h-full">
            <input
              type="checkbox"
              style={{
                width: Math.min(field.bounds.width, field.bounds.height) - 4,
                height: Math.min(field.bounds.width, field.bounds.height) - 4,
                accentColor: appearance.borderColor,
              }}
              defaultChecked={defaultValue === 'on'}
              disabled={!isPreviewMode || field.readOnly}
              onChange={(e) => onValueChange?.(e.target.checked ? 'on' : 'off')}
            />
          </div>
        );

      case 'radioGroup':
        return (
          <div
            className="flex flex-col gap-1 p-1 overflow-hidden"
            style={{ ...baseStyle, border: 'none', backgroundColor: 'transparent' }}
          >
            {(field.options || []).map((option, idx) => (
              <label key={idx} className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="radio"
                  name={field.groupName || field.id}
                  value={option}
                  defaultChecked={defaultValue === option}
                  disabled={!isPreviewMode || field.readOnly}
                  onChange={() => onValueChange?.(option)}
                  style={{ accentColor: appearance.borderColor }}
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <select
            style={baseStyle}
            className="px-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            defaultValue={defaultValue || ''}
            disabled={!isPreviewMode || field.readOnly}
            onChange={(e) => onValueChange?.(e.target.value)}
          >
            <option value="">Select...</option>
            {(field.options || []).map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'datePicker':
        return (
          <input
            type="date"
            style={baseStyle}
            className="px-2 outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={defaultValue}
            readOnly={!isPreviewMode || field.readOnly}
            onChange={(e) => onValueChange?.(e.target.value)}
          />
        );

      case 'signature':
        return (
          <div
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb',
            }}
            className="text-gray-400 text-xs italic"
          >
            {isPreviewMode ? 'Click to sign' : 'Signature Field'}
          </div>
        );

      case 'button':
        return (
          <button
            type="button"
            style={{
              ...baseStyle,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              cursor: isPreviewMode ? 'pointer' : 'default',
            }}
            className="font-medium hover:bg-blue-600 transition-colors"
            disabled={!isPreviewMode}
          >
            {defaultValue || field.buttonAction || 'Button'}
          </button>
        );

      default:
        return (
          <div style={baseStyle} className="flex items-center justify-center text-gray-400">
            Unknown field type
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full">
      {renderField()}
      {field.required && !isPreviewMode && (
        <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">*</span>
      )}
      {isSelected && !isPreviewMode && (
        <div className="absolute -top-5 left-0 text-xs bg-blue-500 text-white px-1 rounded truncate max-w-full">
          {field.name}
        </div>
      )}
    </div>
  );
}
