/**
 * Platform Detection Utility
 *
 * Provides utilities for detecting whether the app is running in Electron
 * or a web browser, and accessing platform-specific information.
 */

import type { PlatformInfo, AppPathInfo } from '@/types/electronTypes';

/**
 * Cached platform info
 */
let cachedPlatformInfo: PlatformInfo | null = null;
let cachedAppPathInfo: AppPathInfo | null = null;

/**
 * Check if running in Electron
 *
 * @returns true if running in Electron, false if running in browser
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.electron !== 'undefined';
}

/**
 * Check if running in a web browser
 *
 * @returns true if running in browser, false if running in Electron
 */
export function isBrowser(): boolean {
  return !isElectron();
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  if (isElectron() && cachedPlatformInfo) {
    return cachedPlatformInfo.platform === 'win32';
  }
  return typeof navigator !== 'undefined' && /win/i.test(navigator.platform);
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  if (isElectron() && cachedPlatformInfo) {
    return cachedPlatformInfo.platform === 'darwin';
  }
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  if (isElectron() && cachedPlatformInfo) {
    return cachedPlatformInfo.platform === 'linux';
  }
  return typeof navigator !== 'undefined' && /linux/i.test(navigator.platform);
}

/**
 * Get detailed platform information
 *
 * @returns Platform info if in Electron, null if in browser
 */
export async function getPlatformInfo(): Promise<PlatformInfo | null> {
  if (!isElectron()) {
    return null;
  }

  if (cachedPlatformInfo) {
    return cachedPlatformInfo;
  }

  try {
    cachedPlatformInfo = await window.electron!.getPlatformInfo();
    return cachedPlatformInfo;
  } catch (error) {
    console.error('Failed to get platform info:', error);
    return null;
  }
}

/**
 * Get app path information
 *
 * @returns App path info if in Electron, null if in browser
 */
export async function getAppPathInfo(): Promise<AppPathInfo | null> {
  if (!isElectron()) {
    return null;
  }

  if (cachedAppPathInfo) {
    return cachedAppPathInfo;
  }

  try {
    cachedAppPathInfo = await window.electron!.getAppPath();
    return cachedAppPathInfo;
  } catch (error) {
    console.error('Failed to get app path info:', error);
    return null;
  }
}

/**
 * Get the app version
 *
 * @returns App version string if in Electron, null if in browser
 */
export async function getAppVersion(): Promise<string | null> {
  if (!isElectron()) {
    return null;
  }

  try {
    return await window.electron!.getAppVersion();
  } catch (error) {
    console.error('Failed to get app version:', error);
    return null;
  }
}

/**
 * Get the user's documents directory
 *
 * @returns Documents path if in Electron, null if in browser
 */
export async function getDocumentsPath(): Promise<string | null> {
  const pathInfo = await getAppPathInfo();
  return pathInfo?.documents ?? null;
}

/**
 * Get the user's downloads directory
 *
 * @returns Downloads path if in Electron, null if in browser
 */
export async function getDownloadsPath(): Promise<string | null> {
  const pathInfo = await getAppPathInfo();
  return pathInfo?.downloads ?? null;
}

/**
 * Check if a feature is available based on platform
 *
 * @param feature - Feature name to check
 * @returns true if feature is available
 */
export function isFeatureAvailable(feature: PlatformFeature): boolean {
  switch (feature) {
    case 'native-file-dialogs':
      return isElectron();
    case 'native-notifications':
      return isElectron() || 'Notification' in window;
    case 'file-system-access':
      return isElectron() || 'showOpenFilePicker' in window;
    case 'clipboard-images':
      return isElectron() || (typeof navigator !== 'undefined' && 'clipboard' in navigator);
    case 'window-controls':
      return isElectron();
    case 'recent-files':
      return isElectron();
    case 'shell-integration':
      return isElectron();
    default:
      return false;
  }
}

/**
 * Platform-specific features
 */
export type PlatformFeature =
  | 'native-file-dialogs'
  | 'native-notifications'
  | 'file-system-access'
  | 'clipboard-images'
  | 'window-controls'
  | 'recent-files'
  | 'shell-integration';

/**
 * Get the command key based on platform
 *
 * @returns 'Cmd' on macOS, 'Ctrl' on other platforms
 */
export function getCommandKey(): string {
  return isMacOS() ? 'Cmd' : 'Ctrl';
}

/**
 * Get the alt key based on platform
 *
 * @returns 'Option' on macOS, 'Alt' on other platforms
 */
export function getAltKey(): string {
  return isMacOS() ? 'Option' : 'Alt';
}

/**
 * Format a keyboard shortcut for display
 *
 * @param shortcut - Shortcut with modifiers (e.g., 'Ctrl+S')
 * @returns Platform-appropriate shortcut string
 */
export function formatShortcut(shortcut: string): string {
  if (isMacOS()) {
    return shortcut
      .replace(/Ctrl\+/gi, '\u2318')
      .replace(/Alt\+/gi, '\u2325')
      .replace(/Shift\+/gi, '\u21E7');
  }
  return shortcut;
}

/**
 * Initialize platform detection
 *
 * Call this early in app initialization to cache platform info
 */
export async function initializePlatform(): Promise<void> {
  if (isElectron()) {
    try {
      cachedPlatformInfo = await window.electron!.getPlatformInfo();
      cachedAppPathInfo = await window.electron!.getAppPath();
    } catch (error) {
      console.error('Failed to initialize platform info:', error);
    }
  }
}
