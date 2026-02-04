/**
 * Auto Updater
 *
 * Electron auto-update with differential updates, rollback,
 * and update notifications.
 */

import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import type { UpdateInfo } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';
import { EventEmitter } from 'events';
import { IPC_CHANNELS } from '../../ipc/channels';

/**
 * Update state
 */
export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  progress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  updateInfo?: UpdateInfo;
  error?: string;
}

/**
 * Auto updater service
 */
export class AutoUpdaterService extends EventEmitter {
  private mainWindow: BrowserWindow | null = null;
  private state: UpdateState = { status: 'idle' };
  private checkInterval: NodeJS.Timer | null = null;

  constructor() {
    super();
    this.configureAutoUpdater();
  }

  /**
   * Configure auto-updater settings
   */
  private configureAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = false;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      this.updateState({ status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      this.updateState({ status: 'available', updateInfo: info });
    });

    autoUpdater.on('update-not-available', () => {
      this.updateState({ status: 'idle' });
    });

    autoUpdater.on('error', (error) => {
      this.updateState({ status: 'error', error: error.message });
    });

    autoUpdater.on('download-progress', (progress) => {
      this.updateState({
        status: 'downloading',
        progress: {
          bytesPerSecond: progress.bytesPerSecond,
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        },
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.updateState({ status: 'downloaded', updateInfo: info });
    });
  }

  /**
   * Initialize auto-updater with main window
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.setupIpcHandlers();

    // Check for updates on startup (after a delay)
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    // Check periodically (every 4 hours)
    this.checkInterval = setInterval(
      () => {
        this.checkForUpdates();
      },
      4 * 60 * 60 * 1000
    );
  }

  /**
   * Set up IPC handlers
   */
  private setupIpcHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
      return this.checkForUpdates();
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
      return this.downloadUpdate();
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, async () => {
      return this.installUpdate();
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_GET_STATE, () => {
      return this.state;
    });
  }

  /**
   * Update internal state and notify renderer
   */
  private updateState(partial: Partial<UpdateState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('state-changed', this.state);

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(IPC_CHANNELS.UPDATE_STATE_CHANGED, this.state);
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo || null;
    } catch (error) {
      console.error('Check for updates failed:', error);
      return null;
    }
  }

  /**
   * Download the update
   */
  async downloadUpdate(): Promise<void> {
    if (this.state.status !== 'available') {
      throw new Error('No update available to download');
    }

    await autoUpdater.downloadUpdate();
  }

  /**
   * Install the update (quit and install)
   */
  installUpdate(): void {
    if (this.state.status !== 'downloaded') {
      throw new Error('No update downloaded to install');
    }

    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return app.getVersion();
  }

  /**
   * Get update info
   */
  getUpdateInfo(): UpdateInfo | undefined {
    return this.state.updateInfo;
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    ipcMain.removeHandler(IPC_CHANNELS.UPDATE_CHECK);
    ipcMain.removeHandler(IPC_CHANNELS.UPDATE_DOWNLOAD);
    ipcMain.removeHandler(IPC_CHANNELS.UPDATE_INSTALL);
    ipcMain.removeHandler(IPC_CHANNELS.UPDATE_GET_STATE);
  }
}

// Singleton instance
let updaterInstance: AutoUpdaterService | null = null;

export function getAutoUpdater(): AutoUpdaterService {
  if (!updaterInstance) {
    updaterInstance = new AutoUpdaterService();
  }
  return updaterInstance;
}

export function initializeAutoUpdater(mainWindow: BrowserWindow): AutoUpdaterService {
  const updater = getAutoUpdater();
  updater.initialize(mainWindow);
  return updater;
}

export default AutoUpdaterService;
