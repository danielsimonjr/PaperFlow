/**
 * Field Palette Component
 * Provides draggable field types for the form designer.
 */

import { type DragEvent } from 'react';
import { type FieldType, useFormDesignerStore } from '@/stores/formDesignerStore';

interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}

const FIELD_TYPES: FieldTypeInfo[] = [
  {
    type: 'textField',
    label: 'Text Field',
    icon: '📝',
    description: 'Single-line text input',
  },
  {
    type: 'textArea',
    label: 'Text Area',
    icon: '📄',
    description: 'Multi-line text input',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑️',
    description: 'Checkbox for yes/no selection',
  },
  {
    type: 'radioGroup',
    label: 'Radio Buttons',
    icon: '🔘',
    description: 'Radio button group for single selection',
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: '📋',
    description: 'Dropdown selection list',
  },
  {
    type: 'datePicker',
    label: 'Date Picker',
    icon: '📅',
    description: 'Date selection field',
  },
  {
    type: 'signature',
    label: 'Signature',
    icon: '✍️',
    description: 'Signature capture field',
  },
  {
    type: 'button',
    label: 'Button',
    icon: '🔲',
    description: 'Action button (submit, reset, print)',
  },
];

export function FieldPalette() {
  const { setDragging, isPreviewMode } = useFormDesignerStore();

  const handleDragStart = (e: DragEvent, fieldType: FieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
    setDragging(true, fieldType);
  };

  const handleDragEnd = () => {
    setDragging(false, null);
  };

  if (isPreviewMode) {
    return null;
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Form Fields</h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag and drop fields onto the PDF page
      </p>

      <div className="space-y-2">
        {FIELD_TYPES.map((field) => (
          <div
            key={field.type}
            draggable
            onDragStart={(e) => handleDragStart(e, field.type)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-gray-100 hover:border-gray-300 transition-colors active:cursor-grabbing"
            title={field.description}
          >
            <span className="text-xl" role="img" aria-label={field.label}>
              {field.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700">{field.label}</div>
              <div className="text-xs text-gray-500 truncate">{field.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">Tips</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Drag fields to position them</li>
          <li>• Click to select and edit</li>
          <li>• Shift+click for multi-select</li>
          <li>• Use arrow keys to nudge</li>
        </ul>
      </div>
    </div>
  );
}
