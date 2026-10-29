import { Link } from 'react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { ThemeSelector } from '@components/ui/ThemeToggle';
import { Button } from '@components/ui/Button';
import { useSettingsStore } from '@stores/settingsStore';
import { OPTIONAL_MODULES } from '@/core/features';
import { OptionalModuleHost } from '@/modules/optional/OptionalModuleHost';

/**
 * Render the settings page for the saved user preferences.
 *
 * The reset button restores the defaults of `settingsStore` only. The reset button does not change the theme. `uiStore`
 * keeps the theme.
 */
export default function Settings() {
  const settings = useSettingsStore();

  const zoomOptions = [50, 75, 100, 125, 150, 200];
  const viewModeOptions: { value: 'single' | 'continuous' | 'spread'; label: string }[] = [
    { value: 'single', label: 'Single Page' },
    { value: 'continuous', label: 'Continuous' },
    { value: 'spread', label: 'Two Pages' },
  ];

  const highlightColors = [
    { value: '#FFEB3B', label: 'Yellow' },
    { value: '#4CAF50', label: 'Green' },
    { value: '#2196F3', label: 'Blue' },
    { value: '#E91E63', label: 'Pink' },
    { value: '#FF9800', label: 'Orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={settings.resetToDefaults}
            title="Reset to defaults"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-6">
        {/* Appearance */}
        <section className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Theme</span>
              <ThemeSelector />
            </div>
          </div>
        </section>

        {/* Viewing */}
        <section className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Viewing
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Default Zoom</span>
              <select
                value={settings.defaultZoom}
                onChange={(e) => settings.setDefaultZoom(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                {zoomOptions.map((zoom) => (
                  <option key={zoom} value={zoom}>
                    {zoom}%
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Default View Mode</span>
              <select
                value={settings.defaultViewMode}
                onChange={(e) =>
                  settings.setDefaultViewMode(e.target.value as 'single' | 'continuous' | 'spread')
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                {viewModeOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Smooth Scrolling</span>
              <button
                onClick={() => settings.setSmoothScrolling(!settings.smoothScrolling)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.smoothScrolling ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.smoothScrolling ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Editing */}
        <section className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Editing
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Auto-Save</span>
              <button
                onClick={() => settings.setAutoSave(!settings.autoSave)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.autoSave ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.autoSave ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.autoSave && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Auto-Save Interval</span>
                <select
                  value={settings.autoSaveInterval}
                  onChange={(e) => settings.setAutoSaveInterval(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Annotations */}
        <section className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Annotations
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Default Highlight Color</span>
              <div className="flex gap-2">
                {highlightColors.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => settings.setDefaultHighlightColor(value)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.defaultHighlightColor === value
                        ? 'border-gray-900 dark:border-white'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                Annotation Opacity: {Math.round(settings.defaultAnnotationOpacity * 100)}%
              </span>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.defaultAnnotationOpacity * 100}
                onChange={(e) => settings.setDefaultAnnotationOpacity(Number(e.target.value) / 100)}
                className="w-32"
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
            Optional modules
          </h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            These modules stay off until you enable them. The app loads a module only after it is on.
          </p>
          <div className="space-y-3">
            {OPTIONAL_MODULES.map((module) => {
              const enabled = settings.optionalModules?.[module.id] ?? false;
              return (
                <div key={module.id} className="flex items-center justify-between gap-4">
                  <span className="text-gray-700 dark:text-gray-300">{module.name}</span>
                  <button
                    type="button"
                    aria-pressed={enabled}
                    data-testid={`optional-toggle-${module.id}`}
                    onClick={() => settings.setOptionalModule(module.id, !enabled)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <OptionalModuleHost />
          </div>
        </section>
      </main>
    </div>
  );
}
