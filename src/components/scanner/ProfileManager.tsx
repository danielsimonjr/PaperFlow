/**
 * Profile Manager Component
 *
 * UI for managing scan profiles - create, edit, delete, import/export.
 */

import { useState, useCallback } from 'react';
import { useScannerStore } from '@stores/scannerStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { ScanProfile } from '@lib/scanner/types';

interface ProfileManagerProps {
  onSelect?: (profile: ScanProfile) => void;
  onClose?: () => void;
  className?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export function ProfileManager({ onSelect, onClose, className }: ProfileManagerProps) {
  const { profiles, settings, addProfile, updateProfile, deleteProfile } = useScannerStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProfile, setEditingProfile] = useState<ScanProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreate = useCallback(() => {
    setFormData({ name: '', description: '' });
    setViewMode('create');
  }, []);

  const handleEdit = useCallback((profile: ScanProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
    });
    setViewMode('edit');
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) return;

    if (viewMode === 'create') {
      addProfile({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        settings: { ...settings },
        isDefault: false,
      });
    } else if (viewMode === 'edit' && editingProfile) {
      updateProfile(editingProfile.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    }

    setViewMode('list');
    setEditingProfile(null);
  }, [formData, viewMode, editingProfile, settings, addProfile, updateProfile]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this profile?')) {
        deleteProfile(id);
      }
    },
    [deleteProfile]
  );

  const handleExport = useCallback(() => {
    const customProfiles = profiles.filter((p) => !p.isDefault);
    const json = JSON.stringify(customProfiles, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scan-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [profiles]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text) as ScanProfile[];
        let count = 0;

        for (const profile of imported) {
          if (profile.name && profile.settings) {
            addProfile({
              name: profile.name,
              description: profile.description,
              settings: profile.settings,
              isDefault: false,
            });
            count++;
          }
        }

        alert(`Imported ${count} profile(s)`);
      } catch {
        alert('Failed to import profiles. Please check the file format.');
      }
    };
    input.click();
  }, [addProfile]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">
          {viewMode === 'list'
            ? 'Scan Profiles'
            : viewMode === 'create'
              ? 'New Profile'
              : 'Edit Profile'}
        </h2>
        {viewMode === 'list' ? (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => {
              setViewMode('list');
              setEditingProfile(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* List view */}
        {viewMode === 'list' && (
          <div className="divide-y dark:divide-gray-700">
            {/* Default profiles section */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Built-in Profiles
              </h3>
              <div className="space-y-2">
                {profiles
                  .filter((p) => p.isDefault)
                  .map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => onSelect?.(profile)}
                      className="w-full p-3 text-left rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium text-sm">{profile.name}</div>
                      {profile.description && (
                        <div className="text-xs text-gray-500 mt-0.5">{profile.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span>{profile.settings.resolution} DPI</span>
                        <span>-</span>
                        <span className="capitalize">{profile.settings.colorMode}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom profiles section */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Custom Profiles
              </h3>
              {profiles.filter((p) => !p.isDefault).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="text-sm">No custom profiles yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles
                    .filter((p) => !p.isDefault)
                    .map((profile) => (
                      <div
                        key={profile.id}
                        className="group relative p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <button
                          onClick={() => onSelect?.(profile)}
                          className="w-full text-left"
                        >
                          <div className="font-medium text-sm">{profile.name}</div>
                          {profile.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {profile.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>{profile.settings.resolution} DPI</span>
                            <span>-</span>
                            <span className="capitalize">{profile.settings.colorMode}</span>
                          </div>
                        </button>

                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(profile);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(profile.id);
                            }}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit form */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Profile Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., My Documents"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe when to use this profile..."
                rows={2}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
              />
            </div>

            {viewMode === 'create' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This profile will use your current scan settings:
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-0.5">
                  <li>Resolution: {settings.resolution} DPI</li>
                  <li>Color mode: {settings.colorMode}</li>
                  <li>Paper size: {settings.paperSize}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-700">
        {viewMode === 'list' ? (
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleCreate} className="flex-1">
              Create Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} title="Export profiles">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleImport} title="Import profiles">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setViewMode('list');
                setEditingProfile(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="flex-1"
            >
              {viewMode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileManager;
