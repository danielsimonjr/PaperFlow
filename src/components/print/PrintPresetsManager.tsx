/**
 * Print Presets Manager
 *
 * UI for saving, loading, and managing print presets
 * for different use cases.
 */

import { useState } from 'react';
import { usePrintStore, type PrintPreset } from '@stores/printStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface PrintPresetsManagerProps {
  className?: string;
  onApply?: (preset: PrintPreset) => void;
}

export function PrintPresetsManager({
  className,
  onApply,
}: PrintPresetsManagerProps) {
  const {
    presets,
    settings,
    applyPreset,
    addPreset,
    updatePreset,
    deletePreset,
  } = usePrintStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const handleApplyPreset = (preset: PrintPreset) => {
    applyPreset(preset.id);
    onApply?.(preset);
  };

  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) return;

    addPreset({
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      settings: { ...settings },
    });

    setIsCreating(false);
    setNewPresetName('');
    setNewPresetDescription('');
  };

  const handleUpdatePreset = (id: string) => {
    if (!newPresetName.trim()) return;

    updatePreset(id, {
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
    });

    setEditingId(null);
    setNewPresetName('');
    setNewPresetDescription('');
  };

  const handleStartEdit = (preset: PrintPreset) => {
    setEditingId(preset.id);
    setNewPresetName(preset.name);
    setNewPresetDescription(preset.description || '');
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      deletePreset(id);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Print Presets</h3>
        {!isCreating && (
          <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
            Save Current
          </Button>
        )}
      </div>

      {/* Create new preset form */}
      {isCreating && (
        <div className="p-3 border rounded-lg space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="My Preset"
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={newPresetDescription}
              onChange={(e) => setNewPresetDescription(e.target.value)}
              placeholder="Describe this preset"
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setNewPresetName('');
                setNewPresetDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAsPreset}
              disabled={!newPresetName.trim()}
            >
              Save Preset
            </Button>
          </div>
        </div>
      )}

      {/* Preset list */}
      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={cn(
              'p-3 border rounded-lg transition-colors',
              'hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            {editingId === preset.id ? (
              // Edit mode
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setNewPresetName('');
                      setNewPresetDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdatePreset(preset.id)}
                    disabled={!newPresetName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{preset.name}</span>
                    {preset.isDefault && (
                      <span className="text-xs text-gray-400">(built-in)</span>
                    )}
                  </div>
                  {preset.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {preset.description}
                    </p>
                  )}
                  {/* Preset summary */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.settings.color !== undefined && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {preset.settings.color ? 'Color' : 'Grayscale'}
                      </span>
                    )}
                    {preset.settings.duplex && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                        {preset.settings.duplex === 'longEdge'
                          ? '2-sided Long'
                          : preset.settings.duplex === 'shortEdge'
                            ? '2-sided Short'
                            : '1-sided'}
                      </span>
                    )}
                    {preset.settings.quality && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded capitalize">
                        {preset.settings.quality}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    Apply
                  </Button>
                  {!preset.isDefault && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(preset)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePreset(preset.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No presets saved yet.</p>
          <p className="text-sm">
            Configure your print settings and save them as a preset.
          </p>
        </div>
      )}
    </div>
  );
}

export default PrintPresetsManager;
