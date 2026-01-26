import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { HIGHLIGHT_COLORS } from './SelectionPopup';

interface CustomStampDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
  /** Callback when stamp is created */
  onCreate: (stamp: {
    text: string;
    color: string;
    backgroundColor: string;
  }) => void;
}

const BACKGROUND_COLORS = [
  { name: 'Gray', value: '#D1D5DB' },
  { name: 'Red', value: '#FEE2E2' },
  { name: 'Orange', value: '#FFEDD5' },
  { name: 'Yellow', value: '#FEF9C3' },
  { name: 'Green', value: '#DCFCE7' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#F3E8FF' },
];

/**
 * Dialog for creating custom text stamps.
 */
export function CustomStampDialog({
  isOpen,
  onClose,
  onCreate,
}: CustomStampDialogProps) {
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#374151');
  const [backgroundColor, setBackgroundColor] = useState('#D1D5DB');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!text.trim()) return;

      onCreate({
        text: text.trim().toUpperCase(),
        color: textColor,
        backgroundColor,
      });

      // Reset form
      setText('');
      setTextColor('#374151');
      setBackgroundColor('#D1D5DB');
      onClose();
    },
    [text, textColor, backgroundColor, onCreate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Custom Stamp
          </h2>
          <button
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Text Input */}
          <div className="mb-4">
            <label
              htmlFor="stamp-text"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Stamp Text
            </label>
            <input
              id="stamp-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={30}
              placeholder="Enter stamp text..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              {text.length}/30 characters
            </p>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text Color
            </label>
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    textColor === color.value
                      ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setTextColor(color.value)}
                  title={color.name}
                />
              ))}
              {/* Black and White options */}
              <button
                type="button"
                className={`h-8 w-8 rounded-full bg-gray-800 transition-transform hover:scale-110 ${
                  textColor === '#374151'
                    ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                    : ''
                }`}
                onClick={() => setTextColor('#374151')}
                title="Dark Gray"
              />
              <button
                type="button"
                className={`h-8 w-8 rounded-full bg-white transition-transform hover:scale-110 ${
                  textColor === '#FFFFFF'
                    ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                    : ''
                }`}
                style={{ border: '1px solid #D1D5DB' }}
                onClick={() => setTextColor('#FFFFFF')}
                title="White"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Background Color
            </label>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    backgroundColor === color.value
                      ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setBackgroundColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </label>
            <div className="flex justify-center rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              <div
                className="rounded px-4 py-2 text-sm font-bold"
                style={{
                  backgroundColor,
                  color: textColor,
                  border: `2px solid ${backgroundColor}`,
                }}
              >
                {text.toUpperCase() || 'STAMP'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Stamp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
