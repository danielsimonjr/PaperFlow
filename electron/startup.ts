/**
 * Startup Module
 *
 * Handles launch-on-startup functionality for the Electron app.
 * Supports Windows, macOS, and Linux.
 */

import { app } from 'electron';
import path from 'path';

/**
 * Startup settings
 */
export interface StartupSettings {
  /** Whether to launch on login */
  openAtLogin: boolean;
  /** Whether to start minimized (to tray) */
  openAsHidden: boolean;
  /** Path to the app (optional, uses current executable by default) */
  path?: string;
  /** Arguments to pass when launching */
  args?: string[];
}

/**
 * Get the current startup settings
 */
export function getStartupSettings(): StartupSettings {
  const loginItemSettings = app.getLoginItemSettings();

  return {
    openAtLogin: loginItemSettings.openAtLogin,
    openAsHidden: loginItemSettings.openAsHidden,
    path: loginItemSettings.path,
    args: loginItemSettings.args,
  };
}

/**
 * Set the startup settings
 */
export function setStartupSettings(settings: Partial<StartupSettings>): void {
  const currentSettings = app.getLoginItemSettings();

  const newSettings: Electron.LoginItemSettings = {
    openAtLogin: settings.openAtLogin ?? currentSettings.openAtLogin,
    openAsHidden: settings.openAsHidden ?? currentSettings.openAsHidden,
  };

  // On Windows, we may need to specify the path for portable versions
  if (settings.path) {
    newSettings.path = settings.path;
  }

  // Arguments to pass when launching
  if (settings.args) {
    newSettings.args = settings.args;
  }

  // On macOS, we can also set the name and service name
  if (process.platform === 'darwin') {
    newSettings.name = app.getName();
  }

  app.setLoginItemSettings(newSettings);

  console.log('[Startup] Settings updated:', newSettings);
}

/**
 * Enable launch on startup
 *
 * @param hidden - Whether to start minimized
 */
export function enableLaunchOnStartup(hidden: boolean = false): void {
  setStartupSettings({
    openAtLogin: true,
    openAsHidden: hidden,
  });
}

/**
 * Disable launch on startup
 */
export function disableLaunchOnStartup(): void {
  setStartupSettings({
    openAtLogin: false,
    openAsHidden: false,
  });
}

/**
 * Toggle launch on startup
 *
 * @returns New state (true if now enabled)
 */
export function toggleLaunchOnStartup(): boolean {
  const current = getStartupSettings();
  const newState = !current.openAtLogin;

  setStartupSettings({
    openAtLogin: newState,
    openAsHidden: current.openAsHidden,
  });

  return newState;
}

/**
 * Check if launch on startup is enabled
 */
export function isLaunchOnStartupEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

/**
 * Check if app was launched at login
 * This can be used to decide whether to show the main window
 */
export function wasLaunchedAtLogin(): boolean {
  // Check if the app was launched at login (hidden)
  const loginItemSettings = app.getLoginItemSettings();
  return loginItemSettings.wasOpenedAtLogin || false;
}

/**
 * Check if app was launched hidden (minimized to tray)
 */
export function wasLaunchedHidden(): boolean {
  const loginItemSettings = app.getLoginItemSettings();
  return loginItemSettings.wasOpenedAsHidden || false;
}

/**
 * Get the executable path for startup registration
 */
export function getStartupExePath(): string {
  if (app.isPackaged) {
    return process.execPath;
  }

  // In development, return the electron executable
  return path.join(
    app.getAppPath(),
    'node_modules',
    'electron',
    'dist',
    process.platform === 'win32' ? 'electron.exe' : 'electron'
  );
}

/**
 * Platform-specific startup helpers
 */
export const platformStartup = {
  /**
   * Windows-specific: Get registry key path for startup
   * Note: Electron handles this internally, but useful for debugging
   */
  getWindowsRegistryPath(): string | null {
    if (process.platform !== 'win32') {
      return null;
    }
    return `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  },

  /**
   * macOS-specific: Get LaunchAgents path
   */
  getMacOSLaunchAgentPath(): string | null {
    if (process.platform !== 'darwin') {
      return null;
    }
    const home = app.getPath('home');
    return path.join(home, 'Library', 'LaunchAgents', `${app.getName()}.plist`);
  },

  /**
   * Linux-specific: Get autostart desktop file path
   */
  getLinuxAutostartPath(): string | null {
    if (process.platform !== 'linux') {
      return null;
    }
    const configHome = process.env.XDG_CONFIG_HOME || path.join(app.getPath('home'), '.config');
    return path.join(configHome, 'autostart', `${app.getName()}.desktop`);
  },
};

/**
 * Initialize startup module
 * Call this early in the app lifecycle to handle startup scenarios
 */
export function initializeStartup(): {
  wasLaunchedAtLogin: boolean;
  wasLaunchedHidden: boolean;
  settings: StartupSettings;
} {
  const launchedAtLogin = wasLaunchedAtLogin();
  const launchedHidden = wasLaunchedHidden();
  const settings = getStartupSettings();

  console.log('[Startup] Initialized:', {
    wasLaunchedAtLogin: launchedAtLogin,
    wasLaunchedHidden: launchedHidden,
    openAtLogin: settings.openAtLogin,
    openAsHidden: settings.openAsHidden,
  });

  return {
    wasLaunchedAtLogin: launchedAtLogin,
    wasLaunchedHidden: launchedHidden,
    settings,
  };
}
