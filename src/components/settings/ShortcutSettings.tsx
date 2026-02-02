/**
 * Shortcut Settings Component
 *
 * Allows users to view and customize keyboard shortcuts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useShortcutsStore,
  formatAccelerator,
  type ShortcutDefinition,
} from '@stores/shortcutsStore';

/**
 * Category labels for display
 */
const CATEGORY_LABELS: Record<ShortcutDefinition['category'], string> = {
  file: 'File',
  edit: 'Edit',
  view: 'View',
  document: 'Document',
  annotation: 'Annotation',
  navigation: 'Navigation',
  global: 'Global (Work in Background)',
};

/**
 * Category order for display
 */
const CATEGORY_ORDER: ShortcutDefinition['category'][] = [
  'file',
  'edit',
  'view',
  'document',
  'annotation',
  'navigation',
  'global',
];

/**
 * Key code to key name mapping
 */
const KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
};

/**
 * Shortcut editor component
 */
interface ShortcutEditorProps {
  shortcut: ShortcutDefinition;
  onSave: (accelerator: string) => void;
  onCancel: () => void;
  onReset: () => void;
}

function ShortcutEditor({ shortcut, onSave, onCancel, onReset }: ShortcutEditorProps) {
  const [keys, setKeys] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkConflict = useShortcutsStore((state) => state.checkConflict);
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isRecording) return;

      // Build key combination
      const newKeys: string[] = [];

      if (e.ctrlKey) newKeys.push('Ctrl');
      if (e.metaKey) newKeys.push('Cmd');
      if (e.altKey) newKeys.push('Alt');
      if (e.shiftKey) newKeys.push('Shift');

      // Add the actual key (not modifier)
      const key = e.key;
      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
        const keyName = KEY_NAMES[key] || key.toUpperCase();
        newKeys.push(keyName);

        setKeys(newKeys);
        setIsRecording(false);

        // Check for conflict
        const accelerator = newKeys.join('+');
        const conflictResult = checkConflict(shortcut.id, accelerator);
        if (conflictResult) {
          setConflict(`Conflicts with "${conflictResult.conflictWith.name}"`);
        } else {
          setConflict(null);
        }
      }
    },
    [isRecording, checkConflict, shortcut.id]
  );

  const handleSave = () => {
    if (keys.length > 0 && !conflict) {
      // Convert to Electron accelerator format
      const accelerator = keys
        .map((k) => {
          if (k === 'Ctrl' || k === 'Cmd') return 'CmdOrCtrl';
          return k;
        })
        .join('+');
      onSave(accelerator);
    }
  };

  const handleClear = () => {
    setKeys([]);
    setIsRecording(true);
    setConflict(null);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={keys.length > 0 ? keys.join(' + ') : 'Press a key combination...'}
          onKeyDown={handleKeyDown}
          className={`flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-900
            ${conflict ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            focus:outline-none focus:ring-2 focus:ring-primary-500`}
        />
        <button
          onClick={handleClear}
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Clear
        </button>
      </div>

      {conflict && <p className="text-sm text-red-500">{conflict}</p>}

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Reset to Default
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={keys.length === 0 || !!conflict}
          className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * Single shortcut row component
 */
interface ShortcutRowProps {
  shortcut: ShortcutDefinition;
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const setShortcut = useShortcutsStore((state) => state.setShortcut);
  const resetShortcut = useShortcutsStore((state) => state.resetShortcut);

  const currentAccelerator = shortcut.customAccelerator || shortcut.defaultAccelerator;
  const isCustomized = !!shortcut.customAccelerator;

  const handleSave = async (accelerator: string) => {
    const success = await setShortcut(shortcut.id, accelerator);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleReset = async () => {
    await resetShortcut(shortcut.id);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-medium">{shortcut.name}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {shortcut.description}
            </span>
          </div>
        </div>
        <ShortcutEditor
          shortcut={shortcut}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          onReset={handleReset}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex-1">
        <span className="font-medium">{shortcut.name}</span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {shortcut.description}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isCustomized && (
          <span className="text-xs text-primary-500 dark:text-primary-400">Modified</span>
        )}
        <kbd className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
          {formatAccelerator(currentAccelerator)}
        </kbd>
      </div>
    </div>
  );
}

/**
 * Shortcut category section
 */
interface ShortcutCategoryProps {
  category: ShortcutDefinition['category'];
  shortcuts: ShortcutDefinition[];
}

function ShortcutCategory({ category, shortcuts }: ShortcutCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (shortcuts.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        <svg
          className={`w-4 h-4 transform transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
        <span className="text-sm text-gray-500">({shortcuts.length})</span>
      </button>

      {isExpanded && (
        <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {shortcuts.map((shortcut) => (
            <ShortcutRow key={shortcut.id} shortcut={shortcut} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main shortcut settings component
 */
export function ShortcutSettings() {
  const shortcuts = useShortcutsStore((state) => state.shortcuts);
  const isLoading = useShortcutsStore((state) => state.isLoading);
  const error = useShortcutsStore((state) => state.error);
  const loadShortcuts = useShortcutsStore((state) => state.loadShortcuts);
  const resetAllShortcuts = useShortcutsStore((state) => state.resetAllShortcuts);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Filter shortcuts by search query
  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group shortcuts by category
  const shortcutsByCategory = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = filteredShortcuts.filter((s) => s.category === category);
      return acc;
    },
    {} as Record<ShortcutDefinition['category'], ShortcutDefinition[]>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
        <button
          onClick={resetAllShortcuts}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Reset All to Defaults
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Click on a shortcut to customize it. Press the new key combination and click Save.
      </div>

      {CATEGORY_ORDER.map((category) => (
        <ShortcutCategory
          key={category}
          category={category}
          shortcuts={shortcutsByCategory[category]}
        />
      ))}

      {filteredShortcuts.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No shortcuts match your search.
        </div>
      )}
    </div>
  );
}

export default ShortcutSettings;
