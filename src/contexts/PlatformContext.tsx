/**
 * Platform Context
 *
 * Provides platform information to React components through context.
 * Includes platform detection, capabilities, and theme preferences.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  getPlatformInfo,
  type PlatformInfo,
  type PlatformCapabilities,
  getModifierKey,
  getAltKey,
  formatShortcut,
  isHighContrastMode,
  prefersReducedMotion,
  getDevicePixelRatio,
  isTouchDevice,
} from '@utils/platform';

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Platform context value
 */
export interface PlatformContextValue {
  /** Platform information */
  platform: PlatformInfo;
  /** Platform capabilities */
  capabilities: PlatformCapabilities;
  /** Whether platform info is loading */
  isLoading: boolean;

  /** Theme */
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  /** Accessibility */
  isHighContrast: boolean;
  prefersReducedMotion: boolean;
  devicePixelRatio: number;
  isTouch: boolean;

  /** Helpers */
  modifierKey: 'Cmd' | 'Ctrl';
  altKey: 'Option' | 'Alt';
  formatShortcut: (shortcut: string) => string;

  /** Platform checks */
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  isElectron: boolean;
  isBrowser: boolean;
}

// Create context with default value
const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Platform Provider Props
 */
interface PlatformProviderProps {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
}

/**
 * Get system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Platform Provider Component
 */
export function PlatformProvider({ children, initialTheme = 'system' }: PlatformProviderProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);
  const [platform, setPlatform] = useState<PlatformInfo>(() => getPlatformInfo());
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const [isHighContrast, setIsHighContrast] = useState(isHighContrastMode);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [pixelRatio, setPixelRatio] = useState(getDevicePixelRatio);
  const [isTouch] = useState(isTouchDevice);

  // Initialize platform info
  useEffect(() => {
    const info = getPlatformInfo();
    setPlatform(info);
    setIsLoading(false);

    // Add platform class to document
    const platformClass = `platform-${info.platform}`;
    document.documentElement.classList.add(platformClass);

    if (info.isElectron) {
      document.documentElement.classList.add('electron');
    }

    return () => {
      document.documentElement.classList.remove(platformClass);
      document.documentElement.classList.remove('electron');
    };
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for high contrast changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(forced-colors: active)');

    const handleChange = () => {
      setIsHighContrast(isHighContrastMode());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for reduced motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setReducedMotion(prefersReducedMotion());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for pixel ratio changes
  useEffect(() => {
    const handleChange = () => {
      setPixelRatio(getDevicePixelRatio());
    };

    window.addEventListener('resize', handleChange);
    return () => window.removeEventListener('resize', handleChange);
  }, []);

  // Compute effective theme
  const theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemTheme;
    }
    return themeMode;
  }, [themeMode, systemTheme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Also set data attribute for Tailwind
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply high contrast class
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  // Apply reduced motion class
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // Theme mode setter with persistence
  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem('paperflow-theme', mode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('paperflow-theme') as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemeMode(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Memoize context value
  const value = useMemo<PlatformContextValue>(() => ({
    platform,
    capabilities: platform.capabilities,
    isLoading,

    theme,
    themeMode,
    setThemeMode: handleSetThemeMode,

    isHighContrast,
    prefersReducedMotion: reducedMotion,
    devicePixelRatio: pixelRatio,
    isTouch,

    modifierKey: getModifierKey(),
    altKey: getAltKey(),
    formatShortcut,

    isWindows: platform.platform === 'windows',
    isMacOS: platform.platform === 'macos',
    isLinux: platform.platform === 'linux',
    isElectron: platform.isElectron,
    isBrowser: platform.isBrowser,
  }), [
    platform,
    isLoading,
    theme,
    themeMode,
    handleSetThemeMode,
    isHighContrast,
    reducedMotion,
    pixelRatio,
    isTouch,
  ]);

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

/**
 * Hook to access platform context
 */
// eslint-disable-next-line react-refresh/only-export-components -- Hook must be exported with provider
export function usePlatformContext(): PlatformContextValue {
  const context = useContext(PlatformContext);

  if (!context) {
    throw new Error('usePlatformContext must be used within a PlatformProvider');
  }

  return context;
}

/**
 * Hook for platform-specific values
 */
// eslint-disable-next-line react-refresh/only-export-components -- Hook must be exported with provider
export function usePlatformValue<T>(values: {
  windows?: T;
  macos?: T;
  linux?: T;
  default: T;
}): T {
  const { platform } = usePlatformContext();

  switch (platform.platform) {
    case 'windows':
      return values.windows ?? values.default;
    case 'macos':
      return values.macos ?? values.default;
    case 'linux':
      return values.linux ?? values.default;
    default:
      return values.default;
  }
}

/**
 * Hook for conditional rendering based on platform
 */
// eslint-disable-next-line react-refresh/only-export-components -- Hook must be exported with provider
export function usePlatformCondition(condition: {
  windows?: boolean;
  macos?: boolean;
  linux?: boolean;
  electron?: boolean;
  browser?: boolean;
}): boolean {
  const ctx = usePlatformContext();

  if (condition.windows !== undefined && ctx.isWindows !== condition.windows) {
    return false;
  }
  if (condition.macos !== undefined && ctx.isMacOS !== condition.macos) {
    return false;
  }
  if (condition.linux !== undefined && ctx.isLinux !== condition.linux) {
    return false;
  }
  if (condition.electron !== undefined && ctx.isElectron !== condition.electron) {
    return false;
  }
  if (condition.browser !== undefined && ctx.isBrowser !== condition.browser) {
    return false;
  }

  return true;
}

export default PlatformContext;
