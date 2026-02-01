/**
 * Field Properties Panel
 * Provides property editing for selected form fields.
 */

import { useFormDesignerStore, type FormFieldDefinition, type ButtonAction } from '@/stores/formDesignerStore';

const FONT_FAMILIES = [
  'Helvetica',
  'Times-Roman',
  'Courier',
  'Arial',
  'Georgia',
  'Verdana',
];

const BUTTON_ACTIONS: { value: ButtonAction; label: string }[] = [
  { value: 'submit', label: 'Submit Form' },
  { value: 'reset', label: 'Reset Form' },
  { value: 'print', label: 'Print Document' },
];

interface PropertySectionProps {
  title: string;
  children: React.ReactNode;
}

function PropertySection({ title, children }: PropertySectionProps) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 w-24 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function FieldProperties() {
  const { selectedFieldId, fields, updateField, isPreviewMode } = useFormDesignerStore();

  const selectedField = selectedFieldId
    ? fields.find((f) => f.id === selectedFieldId)
    : null;

  if (isPreviewMode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p className="text-sm">Preview Mode</p>
          <p className="text-xs mt-2">Exit preview to edit properties</p>
        </div>
      </div>
    );
  }

  if (!selectedField) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <p className="text-sm">No field selected</p>
          <p className="text-xs mt-2">Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<FormFieldDefinition>) => {
    updateField(selectedField.id, updates);
  };

  const handleAppearanceUpdate = (key: string, value: string | number) => {
    handleUpdate({
      appearance: {
        ...selectedField.appearance,
        [key]: value,
      },
    });
  };

  const handleOptionsUpdate = (options: string[]) => {
    handleUpdate({ options });
  };

  return (
    <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Field Properties</h3>

      {/* Basic Properties */}
      <PropertySection title="General">
        <PropertyRow label="Name">
          <input
            type="text"
            value={selectedField.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </PropertyRow>
        <PropertyRow label="Tooltip">
          <input
            type="text"
            value={selectedField.tooltip}
            onChange={(e) => handleUpdate({ tooltip: e.target.value })}
            placeholder="Hover text..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </PropertyRow>
        <PropertyRow label="Required">
          <input
            type="checkbox"
            checked={selectedField.required}
            onChange={(e) => handleUpdate({ required: e.target.checked })}
            className="rounded"
          />
        </PropertyRow>
        <PropertyRow label="Read Only">
          <input
            type="checkbox"
            checked={selectedField.readOnly}
            onChange={(e) => handleUpdate({ readOnly: e.target.checked })}
            className="rounded"
          />
        </PropertyRow>
        <PropertyRow label="Default">
          <input
            type="text"
            value={selectedField.defaultValue}
            onChange={(e) => handleUpdate({ defaultValue: e.target.value })}
            placeholder="Default value..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </PropertyRow>
      </PropertySection>

      {/* Type-specific Properties */}
      {(selectedField.type === 'textField' || selectedField.type === 'textArea') && (
        <PropertySection title="Text Options">
          <PropertyRow label="Max Length">
            <input
              type="number"
              value={selectedField.maxLength || ''}
              onChange={(e) =>
                handleUpdate({ maxLength: parseInt(e.target.value) || undefined })
              }
              min={1}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </PropertyRow>
          <PropertyRow label="Placeholder">
            <input
              type="text"
              value={selectedField.placeholder || ''}
              onChange={(e) => handleUpdate({ placeholder: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </PropertyRow>
        </PropertySection>
      )}

      {selectedField.type === 'radioGroup' && (
        <PropertySection title="Radio Options">
          <PropertyRow label="Group Name">
            <input
              type="text"
              value={selectedField.groupName || ''}
              onChange={(e) => handleUpdate({ groupName: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </PropertyRow>
          <OptionsEditor
            options={selectedField.options || []}
            onChange={handleOptionsUpdate}
          />
        </PropertySection>
      )}

      {selectedField.type === 'dropdown' && (
        <PropertySection title="Dropdown Options">
          <OptionsEditor
            options={selectedField.options || []}
            onChange={handleOptionsUpdate}
          />
        </PropertySection>
      )}

      {selectedField.type === 'datePicker' && (
        <PropertySection title="Date Options">
          <PropertyRow label="Format">
            <select
              value={selectedField.dateFormat || 'MM/DD/YYYY'}
              onChange={(e) => handleUpdate({ dateFormat: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </PropertyRow>
        </PropertySection>
      )}

      {selectedField.type === 'button' && (
        <PropertySection title="Button Options">
          <PropertyRow label="Action">
            <select
              value={selectedField.buttonAction || 'submit'}
              onChange={(e) =>
                handleUpdate({ buttonAction: e.target.value as ButtonAction })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {BUTTON_ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </PropertyRow>
        </PropertySection>
      )}

      {/* Appearance */}
      <PropertySection title="Appearance">
        <PropertyRow label="Border">
          <div className="flex gap-1">
            <input
              type="color"
              value={selectedField.appearance.borderColor}
              onChange={(e) => handleAppearanceUpdate('borderColor', e.target.value)}
              className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="number"
              value={selectedField.appearance.borderWidth}
              onChange={(e) =>
                handleAppearanceUpdate('borderWidth', parseInt(e.target.value) || 1)
              }
              min={0}
              max={5}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </PropertyRow>
        <PropertyRow label="Background">
          <input
            type="color"
            value={selectedField.appearance.backgroundColor}
            onChange={(e) => handleAppearanceUpdate('backgroundColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
          />
        </PropertyRow>
        <PropertyRow label="Font">
          <select
            value={selectedField.appearance.fontFamily}
            onChange={(e) => handleAppearanceUpdate('fontFamily', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </PropertyRow>
        <PropertyRow label="Size">
          <input
            type="number"
            value={selectedField.appearance.fontSize}
            onChange={(e) =>
              handleAppearanceUpdate('fontSize', parseInt(e.target.value) || 12)
            }
            min={6}
            max={72}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </PropertyRow>
        <PropertyRow label="Text Color">
          <input
            type="color"
            value={selectedField.appearance.fontColor}
            onChange={(e) => handleAppearanceUpdate('fontColor', e.target.value)}
            className="w-8 h-7 rounded border border-gray-300 cursor-pointer"
          />
        </PropertyRow>
        <PropertyRow label="Alignment">
          <select
            value={selectedField.appearance.textAlign}
            onChange={(e) =>
              handleAppearanceUpdate('textAlign', e.target.value)
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </PropertyRow>
      </PropertySection>

      {/* Position & Size */}
      <PropertySection title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">X</label>
            <input
              type="number"
              value={Math.round(selectedField.bounds.x)}
              onChange={(e) =>
                handleUpdate({
                  bounds: { ...selectedField.bounds, x: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Y</label>
            <input
              type="number"
              value={Math.round(selectedField.bounds.y)}
              onChange={(e) =>
                handleUpdate({
                  bounds: { ...selectedField.bounds, y: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Width</label>
            <input
              type="number"
              value={Math.round(selectedField.bounds.width)}
              onChange={(e) =>
                handleUpdate({
                  bounds: {
                    ...selectedField.bounds,
                    width: Math.max(20, parseFloat(e.target.value) || 20),
                  },
                })
              }
              min={20}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Height</label>
            <input
              type="number"
              value={Math.round(selectedField.bounds.height)}
              onChange={(e) =>
                handleUpdate({
                  bounds: {
                    ...selectedField.bounds,
                    height: Math.max(16, parseFloat(e.target.value) || 16),
                  },
                })
              }
              min={16}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </PropertySection>
    </div>
  );
}

interface OptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const handleAddOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-1">Options</div>
      {options.map((option, index) => (
        <div key={index} className="flex gap-1">
          <input
            type="text"
            value={option}
            onChange={(e) => handleUpdateOption(index, e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => handleRemoveOption(index)}
            className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            title="Remove option"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddOption}
        className="w-full px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300"
      >
        + Add Option
      </button>
    </div>
  );
}
