/**
 * Designer Toolbar Component
 * Provides actions and settings for the form designer.
 */

import { useFormDesignerStore } from '@/stores/formDesignerStore';
import { Button } from '@/components/ui/Button';

interface DesignerToolbarProps {
  onSave?: () => void;
  onClose?: () => void;
}

export function DesignerToolbar({ onSave, onClose }: DesignerToolbarProps) {
  const {
    isPreviewMode,
    togglePreviewMode,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    selectedFieldId,
    selectedFieldIds,
    deleteSelectedFields,
    duplicateField,
    copyField,
    clipboard,
    pasteField,
    clearAllFields,
    fields,
  } = useFormDesignerStore();

  const handlePaste = () => {
    if (clipboard) {
      // Paste at center of page (assuming standard page size)
      pasteField({ x: 300, y: 400 }, 0);
    }
  };

  const fieldCount = fields.length;
  const selectedCount = selectedFieldIds.length;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mode:</span>
          <Button
            variant={isPreviewMode ? 'secondary' : 'primary'}
            size="sm"
            onClick={togglePreviewMode}
          >
            {isPreviewMode ? '📝 Edit' : '👁️ Preview'}
          </Button>
        </div>

        {/* Grid Settings */}
        {!isPreviewMode && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded"
              />
              Snap to Grid
            </label>
            {snapToGrid && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">Size:</span>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-1 py-0.5"
                >
                  <option value="5">5px</option>
                  <option value="10">10px</option>
                  <option value="15">15px</option>
                  <option value="20">20px</option>
                  <option value="25">25px</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Edit Actions */}
        {!isPreviewMode && (
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyField}
              disabled={!selectedFieldId}
              title="Copy (Ctrl+C)"
            >
              📋 Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              disabled={!clipboard}
              title="Paste (Ctrl+V)"
            >
              📎 Paste
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedFieldId && duplicateField(selectedFieldId)}
              disabled={!selectedFieldId}
              title="Duplicate (Ctrl+D)"
            >
              ➕ Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteSelectedFields}
              disabled={selectedCount === 0}
              title="Delete (Delete/Backspace)"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              🗑️ Delete
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Field Count */}
        <div className="text-sm text-gray-500">
          {fieldCount} field{fieldCount !== 1 ? 's' : ''}
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </div>

        {/* Clear All */}
        {!isPreviewMode && fieldCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to remove all fields?')) {
                clearAllFields();
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All
          </Button>
        )}

        {/* Save & Close */}
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
          {onSave && (
            <Button variant="primary" size="sm" onClick={onSave}>
              💾 Save Form
            </Button>
          )}
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              ✕ Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
