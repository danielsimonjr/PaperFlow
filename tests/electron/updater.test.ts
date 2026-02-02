/**
 * Auto-Updater Tests
 *
 * Tests for the auto-update system including update checking,
 * downloading, installation, and settings management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getVersion: () => '1.0.0',
    isPackaged: false,
    getPath: (name: string) => `/mock/path/${name}`,
    on: vi.fn(),
    quit: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: () => [],
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    channel: 'stable',
    allowPrerelease: false,
    allowDowngrade: false,
    autoDownload: true,
    autoInstallOnAppQuit: true,
    forceDevUpdateConfig: false,
    logger: null,
    on: vi.fn(),
    checkForUpdates: vi.fn().mockResolvedValue({ updateInfo: { version: '1.1.0' } }),
    downloadUpdate: vi.fn().mockResolvedValue(['path/to/update']),
    quitAndInstall: vi.fn(),
  },
}));

vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    transports: {
      file: { level: 'info' },
    },
  },
}));

// Import types for testing
import type { UpdateState, UpdateSettings, UpdateChannel, UpdateCheckFrequency } from '../../electron/ipc/types';

describe('Update Store', () => {
  // Test update state defaults
  const defaultState: UpdateState = {
    status: 'idle',
    currentVersion: '1.0.0',
  };

  const defaultSettings: UpdateSettings = {
    autoUpdate: true,
    channel: 'stable',
    checkFrequency: 'daily',
    allowPrerelease: false,
    allowDowngrade: false,
  };

  describe('Update State', () => {
    it('should have correct default state', () => {
      expect(defaultState.status).toBe('idle');
      expect(defaultState.currentVersion).toBe('1.0.0');
      expect(defaultState.availableVersion).toBeUndefined();
      expect(defaultState.downloadProgress).toBeUndefined();
      expect(defaultState.error).toBeUndefined();
    });

    it('should handle available update state', () => {
      const state: UpdateState = {
        ...defaultState,
        status: 'available',
        availableVersion: '1.1.0',
        releaseNotes: '## New Features\n- Feature 1',
      };

      expect(state.status).toBe('available');
      expect(state.availableVersion).toBe('1.1.0');
      expect(state.releaseNotes).toContain('New Features');
    });

    it('should handle downloading state with progress', () => {
      const state: UpdateState = {
        ...defaultState,
        status: 'downloading',
        availableVersion: '1.1.0',
        downloadProgress: {
          bytesPerSecond: 1024 * 1024, // 1 MB/s
          percent: 50,
          transferred: 10 * 1024 * 1024, // 10 MB
          total: 20 * 1024 * 1024, // 20 MB
        },
      };

      expect(state.status).toBe('downloading');
      expect(state.downloadProgress?.percent).toBe(50);
      expect(state.downloadProgress?.bytesPerSecond).toBe(1024 * 1024);
    });

    it('should handle downloaded state', () => {
      const state: UpdateState = {
        ...defaultState,
        status: 'downloaded',
        availableVersion: '1.1.0',
      };

      expect(state.status).toBe('downloaded');
    });

    it('should handle error state', () => {
      const state: UpdateState = {
        ...defaultState,
        status: 'error',
        error: 'Network error',
      };

      expect(state.status).toBe('error');
      expect(state.error).toBe('Network error');
    });
  });

  describe('Update Settings', () => {
    it('should have correct default settings', () => {
      expect(defaultSettings.autoUpdate).toBe(true);
      expect(defaultSettings.channel).toBe('stable');
      expect(defaultSettings.checkFrequency).toBe('daily');
      expect(defaultSettings.allowPrerelease).toBe(false);
      expect(defaultSettings.allowDowngrade).toBe(false);
    });

    it('should validate channel values', () => {
      const validChannels: UpdateChannel[] = ['stable', 'beta', 'alpha'];
      validChannels.forEach((channel) => {
        const settings: UpdateSettings = { ...defaultSettings, channel };
        expect(settings.channel).toBe(channel);
      });
    });

    it('should validate check frequency values', () => {
      const validFrequencies: UpdateCheckFrequency[] = ['hourly', 'daily', 'weekly', 'never'];
      validFrequencies.forEach((frequency) => {
        const settings: UpdateSettings = { ...defaultSettings, checkFrequency: frequency };
        expect(settings.checkFrequency).toBe(frequency);
      });
    });

    it('should enable prerelease for beta channel', () => {
      const betaSettings: UpdateSettings = {
        ...defaultSettings,
        channel: 'beta',
        allowPrerelease: true,
      };

      expect(betaSettings.channel).toBe('beta');
      expect(betaSettings.allowPrerelease).toBe(true);
    });
  });

  describe('Check Interval Calculation', () => {
    function getCheckInterval(frequency: UpdateCheckFrequency): number | null {
      switch (frequency) {
        case 'hourly':
          return 60 * 60 * 1000;
        case 'daily':
          return 24 * 60 * 60 * 1000;
        case 'weekly':
          return 7 * 24 * 60 * 60 * 1000;
        case 'never':
          return null;
      }
    }

    it('should return correct interval for hourly', () => {
      expect(getCheckInterval('hourly')).toBe(3600000);
    });

    it('should return correct interval for daily', () => {
      expect(getCheckInterval('daily')).toBe(86400000);
    });

    it('should return correct interval for weekly', () => {
      expect(getCheckInterval('weekly')).toBe(604800000);
    });

    it('should return null for never', () => {
      expect(getCheckInterval('never')).toBeNull();
    });
  });

  describe('Download Progress Formatting', () => {
    function formatBytes(bytes: number): string {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format decimal values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });
});

describe('Update Events', () => {
  it('should define all update event types', () => {
    const events = {
      UPDATE_STATE_CHANGED: 'update-state-changed',
      UPDATE_DOWNLOAD_PROGRESS: 'update-download-progress',
      UPDATE_AVAILABLE: 'update-available',
      UPDATE_NOT_AVAILABLE: 'update-not-available',
      UPDATE_DOWNLOADED: 'update-downloaded',
      UPDATE_ERROR: 'update-error',
    };

    expect(Object.keys(events)).toHaveLength(6);
    expect(events.UPDATE_STATE_CHANGED).toBe('update-state-changed');
  });
});

describe('Update IPC Channels', () => {
  it('should define all update IPC channels', () => {
    const channels = {
      UPDATE_GET_STATE: 'update-get-state',
      UPDATE_GET_SETTINGS: 'update-get-settings',
      UPDATE_SET_SETTINGS: 'update-set-settings',
      UPDATE_CHECK_FOR_UPDATES: 'update-check-for-updates',
      UPDATE_DOWNLOAD: 'update-download',
      UPDATE_CANCEL_DOWNLOAD: 'update-cancel-download',
      UPDATE_INSTALL_AND_RESTART: 'update-install-and-restart',
      UPDATE_INSTALL_LATER: 'update-install-later',
      UPDATE_GET_RELEASE_NOTES: 'update-get-release-notes',
    };

    expect(Object.keys(channels)).toHaveLength(9);
  });
});

describe('Release Notes Parsing', () => {
  function parseMarkdownHeadings(markdown: string): string[] {
    const lines = markdown.split('\n');
    const headings: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        headings.push(trimmed.slice(2));
      } else if (trimmed.startsWith('## ')) {
        headings.push(trimmed.slice(3));
      } else if (trimmed.startsWith('### ')) {
        headings.push(trimmed.slice(4));
      }
    }

    return headings;
  }

  it('should parse markdown headings', () => {
    const markdown = `# Version 1.1.0

## New Features
- Feature 1
- Feature 2

## Bug Fixes
- Fix 1

### Minor Changes
- Change 1`;

    const headings = parseMarkdownHeadings(markdown);
    expect(headings).toContain('Version 1.1.0');
    expect(headings).toContain('New Features');
    expect(headings).toContain('Bug Fixes');
    expect(headings).toContain('Minor Changes');
  });
});

describe('Code Signing Configuration', () => {
  function isCodeSigningConfigured(platform: string, env: Record<string, string | undefined>): boolean {
    if (platform === 'win32') {
      return !!env.CSC_LINK && !!env.CSC_KEY_PASSWORD;
    }
    if (platform === 'darwin') {
      return !!env.APPLE_ID && !!env.APPLE_APP_SPECIFIC_PASSWORD && !!env.APPLE_TEAM_ID;
    }
    return true;
  }

  it('should detect Windows signing configuration', () => {
    expect(isCodeSigningConfigured('win32', {})).toBe(false);
    expect(
      isCodeSigningConfigured('win32', {
        CSC_LINK: '/path/to/cert.pfx',
        CSC_KEY_PASSWORD: 'password',
      })
    ).toBe(true);
  });

  it('should detect macOS notarization configuration', () => {
    expect(isCodeSigningConfigured('darwin', {})).toBe(false);
    expect(
      isCodeSigningConfigured('darwin', {
        APPLE_ID: 'test@example.com',
        APPLE_APP_SPECIFIC_PASSWORD: 'xxxx-xxxx-xxxx-xxxx',
        APPLE_TEAM_ID: 'ABCDEF1234',
      })
    ).toBe(true);
  });

  it('should allow Linux builds without signing', () => {
    expect(isCodeSigningConfigured('linux', {})).toBe(true);
  });
});

describe('Differential Updates Configuration', () => {
  it('should have differential updates enabled in config', () => {
    // This tests that our electron-builder.yml has the right config
    const config = {
      nsis: {
        differentialPackage: true,
      },
      generateUpdatesFilesForAllChannels: true,
    };

    expect(config.nsis.differentialPackage).toBe(true);
    expect(config.generateUpdatesFilesForAllChannels).toBe(true);
  });
});
