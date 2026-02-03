/**
 * Key Management Component
 *
 * Manage enrolled hardware security keys.
 */

import { useState, useCallback } from 'react';
import { useSecurityStore } from '@stores/securityStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { HardwareKeyInfo } from '@/types/webauthn';

interface KeyManagementProps {
  onAddKey?: () => void;
  className?: string;
}

export function KeyManagement({ onAddKey, className }: KeyManagementProps) {
  const { getKeys, removeKey, renameKey, settings } = useSecurityStore();
  const keys = getKeys();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = useCallback((key: HardwareKeyInfo) => {
    setEditingId(key.id);
    setEditName(key.name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editName.trim()) {
      renameKey(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameKey]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      if (settings.requireHardwareKey && keys.length <= 1) {
        alert(
          'Cannot remove the last security key when hardware key authentication is required.'
        );
        return;
      }

      if (confirm('Are you sure you want to remove this security key?')) {
        removeKey(id);
      }
    },
    [removeKey, settings.requireHardwareKey, keys.length]
  );

  const getKeyIcon = (type: HardwareKeyInfo['type']) => {
    switch (type) {
      case 'usb':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        );
      case 'nfc':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'internal':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Security Keys</h2>
        <Button variant="primary" size="sm" onClick={onAddKey}>
          Add Key
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h3 className="font-medium text-gray-700 dark:text-gray-300">No Security Keys</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Add a hardware security key to protect your documents
          </p>
          <Button variant="primary" onClick={onAddKey}>
            Add Your First Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-start gap-4 p-4 border dark:border-gray-700 rounded-lg"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                {getKeyIcon(key.type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editingId === key.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-700"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Added: {formatDate(key.createdAt)}
                      {key.lastUsedAt && ` | Last used: ${formatDate(key.lastUsedAt)}`}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          key.type === 'internal'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        )}
                      >
                        {key.type === 'internal'
                          ? 'Platform'
                          : key.type.toUpperCase()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {editingId !== key.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(key)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemove(key.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                    title="Remove"
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
              )}
            </div>
          ))}
        </div>
      )}

      {/* Security tip */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> We recommend enrolling at least two security keys in case
            one is lost or damaged.
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyManagement;
