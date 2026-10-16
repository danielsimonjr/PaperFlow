import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@stores/uiStore';
import { cn } from '@utils/cn';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

/**
 * The button switches between light and dark mode.
 * The button shows a sun in dark mode. The button shows a moon in light mode. `showLabel` adds a text label. The text
 * label shows the mode the button switches to.
 */
export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const darkMode = useUIStore((state) => state.darkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        'flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
        className
      )}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="text-sm">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}

/**
 * The selector has two buttons, for the Light and Dark theme.
 * On mount with no stored UI settings, `ThemeSelector` applies the system scheme. The apply call stores the settings,
 * so the system-change listener of `ThemeSelector` never applies a later change. The selector highlights the button for
 * the active theme.
 */
export function ThemeSelector({ className }: { className?: string }) {
  const darkMode = useUIStore((state) => state.darkMode);
  const setDarkMode = useUIStore((state) => state.setDarkMode);

  // Check system preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Only apply system preference if no stored preference exists
    const stored = localStorage.getItem('paperflow-ui');
    if (!stored) {
      setDarkMode(mediaQuery.matches);
    }

    // Listen for system preference changes
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('paperflow-ui');
      if (!stored) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [setDarkMode]);

  const options: { value: boolean; label: string; icon: typeof Sun }[] = [
    { value: false, label: 'Light', icon: Sun },
    { value: true, label: 'Dark', icon: Moon },
  ];

  return (
    <div className={cn('flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800', className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => setDarkMode(value)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
            darkMode === value
              ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
