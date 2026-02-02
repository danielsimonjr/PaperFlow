/**
 * Keyboard Shortcuts Dialog
 *
 * A modal dialog displaying all available keyboard shortcuts.
 * Can be opened via Help menu or Cmd/Ctrl+/ shortcut.
 */

import { useEffect, useState } from 'react';
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
  global: 'Global',
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
 * Props for the dialog
 */
interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shortcut item component
 */
interface ShortcutItemProps {
  shortcut: ShortcutDefinition;
}

function ShortcutItem({ shortcut }: ShortcutItemProps) {
  const accelerator = shortcut.customAccelerator || shortcut.defaultAccelerator;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.name}</span>
      <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
        {formatAccelerator(accelerator)}
      </kbd>
    </div>
  );
}

/**
 * Category section component
 */
interface CategorySectionProps {
  category: ShortcutDefinition['category'];
  shortcuts: ShortcutDefinition[];
}

function CategorySection({ category, shortcuts }: CategorySectionProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {CATEGORY_LABELS[category]}
      </h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut) => (
          <ShortcutItem key={shortcut.id} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/**
 * Main keyboard shortcuts dialog component
 */
export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const shortcuts = useShortcutsStore((state) => state.shortcuts);
  const loadShortcuts = useShortcutsStore((state) => state.loadShortcuts);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadShortcuts();
    }
  }, [isOpen, loadShortcuts]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter shortcuts by search query
  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customAccelerator || s.defaultAccelerator)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Group shortcuts by category
  const shortcutsByCategory = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = filteredShortcuts.filter((s) => s.category === category);
      return acc;
    },
    {} as Record<ShortcutDefinition['category'], ShortcutDefinition[]>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="shortcuts-dialog-title"
              className="text-xl font-semibold text-gray-900 dark:text-white"
            >
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <CategorySection
                  category="file"
                  shortcuts={shortcutsByCategory['file']}
                />
                <CategorySection
                  category="edit"
                  shortcuts={shortcutsByCategory['edit']}
                />
                <CategorySection
                  category="view"
                  shortcuts={shortcutsByCategory['view']}
                />
              </div>
              <div>
                <CategorySection
                  category="document"
                  shortcuts={shortcutsByCategory['document']}
                />
                <CategorySection
                  category="annotation"
                  shortcuts={shortcutsByCategory['annotation']}
                />
                <CategorySection
                  category="navigation"
                  shortcuts={shortcutsByCategory['navigation']}
                />
                <CategorySection
                  category="global"
                  shortcuts={shortcutsByCategory['global']}
                />
              </div>
            </div>

            {filteredShortcuts.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No shortcuts match your search.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <span>Press </span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
              Esc
            </kbd>
            <span> to close</span>
            <span className="mx-2">|</span>
            <span>Customize shortcuts in Settings</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcutsDialog;
