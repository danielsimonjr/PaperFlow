/**
 * Auto-Updater Module
 *
 * Handles automatic updates for the Electron application using electron-updater.
 * Supports GitHub releases as the update provider with configurable channels.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo, UpdateDownloadedEvent } from 'electron-updater';
import log from 'electron-log';
import { IPC_CHANNELS, IPC_EVENTS } from '../ipc/channels';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

/**
 * Update channel types
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha';

/**
 * Update check frequency in milliseconds
 */
export type UpdateCheckFrequency = 'hourly' | 'daily' | 'weekly' | 'never';

/**
 * Update state interface
 */
export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadProgress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  error?: string;
  lastCheckTime?: number;
}

/**
 * Update settings interface
 */
export interface UpdateSettings {
  autoUpdate: boolean;
  channel: UpdateChannel;
  checkFrequency: UpdateCheckFrequency;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
}

// Default update settings
const defaultSettings: UpdateSettings = {
  autoUpdate: true,
  channel: 'stable',
  checkFrequency: 'daily',
  allowPrerelease: false,
  allowDowngrade: false,
};

// Current update state
let updateState: UpdateState = {
  status: 'idle',
  currentVersion: app.getVersion(),
};

// Update settings (loaded from store)
let settings: UpdateSettings = { ...defaultSettings };

// Timer for periodic checks
let checkTimer: ReturnType<typeof setInterval> | null = null;

// Startup check delay in milliseconds (5 seconds)
const STARTUP_CHECK_DELAY = 5000;

/**
 * Get check interval in milliseconds from frequency setting
 */
function getCheckInterval(frequency: UpdateCheckFrequency): number | null {
  switch (frequency) {
    case 'hourly':
      return 60 * 60 * 1000; // 1 hour
    case 'daily':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'never':
      return null;
  }
}

/**
 * Configure auto-updater based on settings
 */
function configureAutoUpdater(): void {
  // Configure update channel
  autoUpdater.channel = settings.channel;

  // Allow prerelease based on channel
  autoUpdater.allowPrerelease = settings.channel !== 'stable' || settings.allowPrerelease;

  // Allow downgrade (useful for switching from beta to stable)
  autoUpdater.allowDowngrade = settings.allowDowngrade;

  // Auto-download based on settings
  autoUpdater.autoDownload = settings.autoUpdate;

  // Auto-install on quit
  autoUpdater.autoInstallOnAppQuit = settings.autoUpdate;

  // Force dev update config in development (for testing)
  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
  }

  log.info('Auto-updater configured:', {
    channel: autoUpdater.channel,
    allowPrerelease: autoUpdater.allowPrerelease,
    allowDowngrade: autoUpdater.allowDowngrade,
    autoDownload: autoUpdater.autoDownload,
    autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
  });
}

/**
 * Broadcast update state to all windows
 */
function broadcastUpdateState(): void {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_EVENTS.UPDATE_STATE_CHANGED, updateState);
    }
  }
}

/**
 * Update the state and broadcast to windows
 */
function setUpdateState(newState: Partial<UpdateState>): void {
  updateState = { ...updateState, ...newState };
  broadcastUpdateState();
}

/**
 * Set up auto-updater event handlers
 */
function setupEventHandlers(): void {
  // Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    setUpdateState({ status: 'checking' });
  });

  // Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info.version);
    setUpdateState({
      status: 'available',
      availableVersion: info.version,
      releaseNotes: typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map(n => n.note).join('\n')
          : undefined,
      releaseDate: info.releaseDate,
    });
  });

  // No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('No update available. Current version:', info.version);
    setUpdateState({
      status: 'idle',
      lastCheckTime: Date.now(),
    });
  });

  // Download progress
  autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
    log.debug('Download progress:', progressObj.percent.toFixed(2) + '%');
    setUpdateState({
      status: 'downloading',
      downloadProgress: {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      },
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
    log.info('Update downloaded:', event.version);
    setUpdateState({
      status: 'downloaded',
      availableVersion: event.version,
      releaseNotes: typeof event.releaseNotes === 'string'
        ? event.releaseNotes
        : Array.isArray(event.releaseNotes)
          ? event.releaseNotes.map(n => n.note).join('\n')
          : undefined,
      downloadProgress: undefined,
    });
  });

  // Error
  autoUpdater.on('error', (error: Error) => {
    log.error('Update error:', error);
    setUpdateState({
      status: 'error',
      error: error.message,
      downloadProgress: undefined,
    });
  });
}

/**
 * Set up IPC handlers for update operations
 */
function setupIpcHandlers(): void {
  // Get current update state
  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_STATE, () => {
    return updateState;
  });

  // Get update settings
  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_SETTINGS, () => {
    return settings;
  });

  // Update settings
  ipcMain.handle(IPC_CHANNELS.UPDATE_SET_SETTINGS, (_event, newSettings: Partial<UpdateSettings>) => {
    settings = { ...settings, ...newSettings };
    configureAutoUpdater();
    setupPeriodicCheck();
    return settings;
  });

  // Check for updates manually
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK_FOR_UPDATES, async () => {
    try {
      log.info('Manual update check requested');
      const result = await autoUpdater.checkForUpdates();
      return { success: true, result };
    } catch (error) {
      log.error('Manual update check failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Download update
  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    try {
      log.info('Download update requested');
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      log.error('Download failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Cancel download
  ipcMain.handle(IPC_CHANNELS.UPDATE_CANCEL_DOWNLOAD, () => {
    try {
      // Note: electron-updater doesn't have a direct cancel method
      // The download will complete in background, but we update state
      log.info('Download cancel requested');
      setUpdateState({ status: 'idle', downloadProgress: undefined });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Install update and restart
  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL_AND_RESTART, () => {
    log.info('Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  });

  // Install update later (on quit)
  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL_LATER, () => {
    log.info('Update will be installed on quit');
    // autoUpdater.autoInstallOnAppQuit is already set
    return { success: true };
  });

  // Get release notes for a version
  ipcMain.handle(IPC_CHANNELS.UPDATE_GET_RELEASE_NOTES, async () => {
    return updateState.releaseNotes || null;
  });
}

/**
 * Set up periodic update checks
 */
function setupPeriodicCheck(): void {
  // Clear existing timer
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }

  const interval = getCheckInterval(settings.checkFrequency);

  if (interval && settings.autoUpdate) {
    checkTimer = setInterval(() => {
      log.info('Periodic update check');
      autoUpdater.checkForUpdates().catch((error) => {
        log.error('Periodic update check failed:', error);
      });
    }, interval);

    log.info(`Periodic update check scheduled every ${settings.checkFrequency}`);
  }
}

/**
 * Perform initial update check on startup
 */
function checkOnStartup(): void {
  if (!settings.autoUpdate || settings.checkFrequency === 'never') {
    log.info('Auto-update is disabled, skipping startup check');
    return;
  }

  setTimeout(() => {
    log.info('Startup update check');
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('Startup update check failed:', error);
    });
  }, STARTUP_CHECK_DELAY);
}

/**
 * Initialize the auto-updater system
 *
 * @param savedSettings - Previously saved update settings
 */
export function initializeUpdater(savedSettings?: Partial<UpdateSettings>): void {
  // Load saved settings
  if (savedSettings) {
    settings = { ...defaultSettings, ...savedSettings };
  }

  // Configure updater
  configureAutoUpdater();

  // Set up event handlers
  setupEventHandlers();

  // Set up IPC handlers
  setupIpcHandlers();

  // Set up periodic checks
  setupPeriodicCheck();

  // Check on startup
  checkOnStartup();

  log.info('Auto-updater initialized');
}

/**
 * Clean up updater resources
 */
export function cleanupUpdater(): void {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

/**
 * Get current update state
 */
export function getUpdateState(): UpdateState {
  return { ...updateState };
}

/**
 * Get current update settings
 */
export function getUpdateSettings(): UpdateSettings {
  return { ...settings };
}

/**
 * Force check for updates (bypasses auto-update setting)
 */
export async function forceCheckForUpdates(): Promise<void> {
  await autoUpdater.checkForUpdates();
}

/**
 * Download available update
 */
export async function downloadUpdate(): Promise<void> {
  await autoUpdater.downloadUpdate();
}

/**
 * Install downloaded update and restart
 */
export function installAndRestart(): void {
  autoUpdater.quitAndInstall(false, true);
}
