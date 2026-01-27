import { useState, useCallback } from 'react';
import { Star, Trash2, Edit2, Check, X } from 'lucide-react';
import { useSignatureStore, type StoredSignature } from '@stores/signatureStore';

interface SignatureListProps {
  signatures: StoredSignature[];
  onSelect: (signature: StoredSignature) => void;
  isInitials?: boolean;
}

/**
 * Grid display of saved signatures with management options.
 */
export function SignatureList({ signatures, onSelect, isInitials = false }: SignatureListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const defaultSignatureId = useSignatureStore((state) => state.defaultSignatureId);
  const defaultInitialsId = useSignatureStore((state) => state.defaultInitialsId);
  const setDefaultSignature = useSignatureStore((state) => state.setDefaultSignature);
  const setDefaultInitials = useSignatureStore((state) => state.setDefaultInitials);
  const renameSignature = useSignatureStore((state) => state.renameSignature);
  const deleteSignature = useSignatureStore((state) => state.deleteSignature);

  const defaultId = isInitials ? defaultInitialsId : defaultSignatureId;
  const setDefault = isInitials ? setDefaultInitials : setDefaultSignature;

  const handleStartEdit = useCallback((signature: StoredSignature) => {
    setEditingId(signature.id);
    setEditName(signature.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editName.trim()) {
      renameSignature(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameSignature]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteSignature(id);
      setDeleteConfirmId(null);
    },
    [deleteSignature]
  );

  if (signatures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No saved {isInitials ? 'initials' : 'signatures'} yet.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Create one using the Draw, Type, or Image tabs.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {signatures.map((signature) => (
        <div
          key={signature.id}
          className={`group relative rounded-lg border-2 bg-white p-3 transition-colors dark:bg-gray-900 ${
            defaultId === signature.id
              ? 'border-primary-500 dark:border-primary-400'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
          }`}
        >
          {/* Signature preview */}
          <button
            className="mb-2 flex h-16 w-full items-center justify-center overflow-hidden rounded bg-gray-50 dark:bg-gray-800"
            onClick={() => onSelect(signature)}
          >
            <img
              src={signature.data}
              alt={signature.name}
              className="max-h-full max-w-full object-contain"
            />
          </button>

          {/* Name */}
          {editingId === signature.id ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <button
                onClick={handleSaveEdit}
                className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                {signature.name}
              </span>
              {defaultId === signature.id && (
                <Star size={14} className="flex-shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
          )}

          {/* Actions */}
          {editingId !== signature.id && (
            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setDefault(signature.id)}
                className={`rounded p-1 ${
                  defaultId === signature.id
                    ? 'text-yellow-500'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500 dark:hover:bg-gray-700'
                }`}
                title={defaultId === signature.id ? 'Default' : 'Set as default'}
              >
                <Star size={14} className={defaultId === signature.id ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => handleStartEdit(signature)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                title="Rename"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setDeleteConfirmId(signature.id)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* Delete confirmation */}
          {deleteConfirmId === signature.id && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/95 p-2 dark:bg-gray-900/95">
              <p className="mb-2 text-center text-xs text-gray-600 dark:text-gray-400">Delete this {isInitials ? 'initials' : 'signature'}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(signature.id)}
                  className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
