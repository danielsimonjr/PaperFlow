/**
 * TemplateManager - Manage batch operation templates
 */

import React, { useState, useCallback } from 'react';
import type { BatchTemplate, BatchOperationType } from '@/types/batch';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import { Button } from '@/components/ui/Button';

export interface TemplateManagerProps {
  /** Filter by operation type */
  operationType?: BatchOperationType;
  /** Callback when template is selected */
  onSelectTemplate?: (template: BatchTemplate) => void;
  /** Show only templates for selection */
  selectionMode?: boolean;
}

const OPERATION_LABELS: Record<BatchOperationType, string> = {
  compress: 'Compress',
  merge: 'Merge',
  split: 'Split',
  watermark: 'Watermark',
  ocr: 'OCR',
  'export-pdf': 'Export PDF',
  'export-images': 'Export Images',
  'header-footer': 'Header/Footer',
  'bates-number': 'Bates Numbering',
  flatten: 'Flatten',
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TemplateManager({
  operationType,
  onSelectTemplate,
  selectionMode = false,
}: TemplateManagerProps): React.ReactElement {
  const { templates, addTemplate, removeTemplate } = useNativeBatchStore();

  const [filter, setFilter] = useState<BatchOperationType | 'all'>(operationType || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BatchTemplate | null>(null);

  // New template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<BatchOperationType>('compress');

  const filteredTemplates = templates.filter((t) => {
    if (filter !== 'all' && t.operationType !== filter) return false;
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCreateTemplate = useCallback(() => {
    if (!newTemplateName.trim()) return;

    const now = Date.now();
    const template: BatchTemplate = {
      id: `tpl_${now}_${Math.random().toString(36).substring(2, 9)}`,
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || undefined,
      operationType: newTemplateType,
      options: {
        errorStrategy: 'skip',
        maxRetries: 2,
        parallelism: 2,
      },
      createdAt: now,
      updatedAt: now,
    };

    addTemplate(template);
    setIsCreating(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateType('compress');
  }, [addTemplate, newTemplateName, newTemplateDescription, newTemplateType]);

  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      if (confirm('Are you sure you want to delete this template?')) {
        removeTemplate(templateId);
      }
    },
    [removeTemplate]
  );

  const handleExportTemplates = useCallback(() => {
    const exportData = JSON.stringify(templates, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-templates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [templates]);

  const handleImportTemplates = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported: BatchTemplate[] = JSON.parse(text);

        for (const template of imported) {
          // Generate new ID to avoid conflicts
          const now = Date.now();
          addTemplate({
            ...template,
            id: `tpl_${now}_${Math.random().toString(36).substring(2, 9)}`,
            createdAt: now,
            updatedAt: now,
            isDefault: false,
          });
        }

        alert(`Imported ${imported.length} template(s)`);
      } catch {
        alert('Failed to import templates. Please check the file format.');
      }
    };

    input.click();
  }, [addTemplate]);

  return (
    <div className="template-manager p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Templates</h2>
        {!selectionMode && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleImportTemplates}>
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportTemplates}>
              Export
            </Button>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              New Template
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        {!operationType && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BatchOperationType | 'all')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            {(Object.keys(OPERATION_LABELS) as BatchOperationType[]).map((type) => (
              <option key={type} value={type}>
                {OPERATION_LABELS[type]}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Create template form */}
      {isCreating && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-3">Create New Template</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Template name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description (optional)</span>
              <input
                type="text"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Brief description"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Operation Type</span>
              <select
                value={newTemplateType}
                onChange={(e) =>
                  setNewTemplateType(e.target.value as BatchOperationType)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {(Object.keys(OPERATION_LABELS) as BatchOperationType[]).map(
                  (type) => (
                    <option key={type} value={type}>
                      {OPERATION_LABELS[type]}
                    </option>
                  )
                )}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No templates found</p>
          {!selectionMode && (
            <Button className="mt-4" variant="outline" onClick={() => setIsCreating(true)}>
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 ${
                selectionMode ? 'cursor-pointer hover:border-primary-500' : ''
              } ${template.isDefault ? 'bg-blue-50 border-blue-200' : ''}`}
              onClick={selectionMode ? () => onSelectTemplate?.(template) : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{template.name}</h4>
                    {template.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="capitalize">{OPERATION_LABELS[template.operationType]}</span>
                    <span>Created {formatDate(template.createdAt)}</span>
                  </div>
                </div>
                {!selectionMode && !template.isDefault && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTemplate(template);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
                {selectionMode && (
                  <Button size="sm" onClick={() => onSelectTemplate?.(template)}>
                    Use
                  </Button>
                )}
              </div>

              {/* Settings preview */}
              <div className="mt-3 pt-3 border-t text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                  <span>Parallelism: {template.options.parallelism || 2}</span>
                  <span>Retries: {template.options.maxRetries || 0}</span>
                  <span className="capitalize">
                    On Error: {template.options.errorStrategy || 'skip'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal would go here in a full implementation */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Template</h3>
            <p className="text-gray-600 mb-4">
              Editing: {editingTemplate.name}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Template editing is not yet implemented. Please delete and recreate the template with new settings.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
