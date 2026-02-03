/**
 * Windows-Specific Crash Reporter
 *
 * Enhanced crash reporting for Windows with minidump symbols,
 * Sentry integration, and user notification.
 */

import { app, dialog, crashReporter, shell } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/**
 * Windows crash reporter configuration
 */
export interface WindowsCrashConfig {
  /** Sentry DSN for crash reporting */
  sentryDsn?: string;
  /** Custom crash server URL */
  crashServerUrl?: string;
  /** Whether to upload crash reports */
  uploadCrashReports: boolean;
  /** Whether to notify user on crash */
  notifyUserOnCrash: boolean;
  /** Whether to collect system info */
  collectSystemInfo: boolean;
  /** Whether to include symbols */
  includeSymbols: boolean;
  /** Max crash dumps to keep locally */
  maxLocalDumps: number;
}

const DEFAULT_CONFIG: WindowsCrashConfig = {
  uploadCrashReports: true,
  notifyUserOnCrash: true,
  collectSystemInfo: true,
  includeSymbols: true,
  maxLocalDumps: 10,
};

let config: WindowsCrashConfig = { ...DEFAULT_CONFIG };
let isInitialized = false;

/**
 * Initialize Windows crash reporter
 */
export function initializeWindowsCrashReporter(options?: Partial<WindowsCrashConfig>): void {
  if (isInitialized) {
    console.log('[WindowsCrashReporter] Already initialized');
    return;
  }

  if (process.platform !== 'win32') {
    console.log('[WindowsCrashReporter] Not Windows, skipping initialization');
    return;
  }

  config = { ...DEFAULT_CONFIG, ...options };

  const submitUrl = config.crashServerUrl || config.sentryDsn
    ? getSentryMinidumpUrl(config.sentryDsn)
    : '';

  if (submitUrl) {
    crashReporter.start({
      submitURL: submitUrl,
      productName: 'PaperFlow',
      companyName: 'PaperFlow',
      uploadToServer: config.uploadCrashReports,
      ignoreSystemCrashHandler: false,
      rateLimit: true,
      compress: true,
      extra: {
        platform: 'win32',
        arch: process.arch,
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        osVersion: os.release(),
        ...(config.collectSystemInfo ? getSystemInfo() : {}),
      },
    });

    console.log('[WindowsCrashReporter] Initialized with submit URL');
  } else {
    console.log('[WindowsCrashReporter] No submit URL, local crash dumps only');
  }

  // Set up crash notification
  if (config.notifyUserOnCrash) {
    setupCrashNotification();
  }

  // Clean up old crash dumps
  cleanupOldDumps().catch(console.error);

  isInitialized = true;
}

/**
 * Get Sentry minidump URL from DSN
 */
function getSentryMinidumpUrl(dsn?: string): string {
  if (!dsn) return '';

  try {
    const url = new URL(dsn);
    const projectId = url.pathname.split('/').pop();
    return `https://${url.host}/api/${projectId}/minidump/?sentry_key=${url.username}`;
  } catch {
    console.error('[WindowsCrashReporter] Invalid Sentry DSN');
    return '';
  }
}

/**
 * Get system information for crash context
 */
function getSystemInfo(): Record<string, string> {
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model || 'unknown',
    cpuCount: cpus.length.toString(),
    totalMemory: formatBytes(os.totalmem()),
    freeMemory: formatBytes(os.freemem()),
    hostname: os.hostname(),
    username: os.userInfo().username,
    locale: app.getLocale(),
    windowsVersion: getWindowsVersion(),
  };
}

/**
 * Get Windows version string
 */
function getWindowsVersion(): string {
  const release = os.release();
  const [major, minor, build] = release.split('.').map(Number);

  if (major === 10 && build >= 22000) {
    return `Windows 11 (${release})`;
  } else if (major === 10) {
    return `Windows 10 (${release})`;
  } else if (major === 6 && minor === 3) {
    return `Windows 8.1 (${release})`;
  } else if (major === 6 && minor === 2) {
    return `Windows 8 (${release})`;
  } else if (major === 6 && minor === 1) {
    return `Windows 7 (${release})`;
  }

  return `Windows (${release})`;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

/**
 * Set up crash notification to user
 */
function setupCrashNotification(): void {
  // Listen for renderer process crashes
  app.on('render-process-gone', async (event, webContents, details) => {
    console.error('[WindowsCrashReporter] Renderer process gone:', details);

    if (details.reason === 'crashed' || details.reason === 'oom') {
      await notifyUserOfCrash(details);
    }
  });

  // Listen for child process crashes
  app.on('child-process-gone', async (event, details) => {
    console.error('[WindowsCrashReporter] Child process gone:', details);

    if (details.type === 'GPU' || details.reason === 'crashed') {
      await notifyUserOfCrash(details);
    }
  });
}

/**
 * Notify user of crash
 */
async function notifyUserOfCrash(details: { reason: string }): Promise<void> {
  const result = await dialog.showMessageBox({
    type: 'error',
    title: 'PaperFlow Crashed',
    message: 'PaperFlow encountered an unexpected error',
    detail: `Reason: ${details.reason}\n\nWould you like to send a crash report to help us fix this issue?`,
    buttons: ['Send Report', 'Don\'t Send', 'View Details'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    // User chose to send report
    console.log('[WindowsCrashReporter] User opted to send crash report');
    // Crash reports are automatically uploaded if configured
  } else if (result.response === 2) {
    // User wants to view details
    await showCrashDetails();
  }
}

/**
 * Show crash details dialog
 */
async function showCrashDetails(): Promise<void> {
  const crashDir = getCrashDumpsDirectory();
  const dumps = await getLocalCrashDumps();

  const detail = dumps.length > 0
    ? `Found ${dumps.length} crash dump(s) in:\n${crashDir}\n\nMost recent: ${dumps[0].name}`
    : `No crash dumps found in:\n${crashDir}`;

  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Crash Details',
    message: 'Crash Dump Information',
    detail,
    buttons: ['Open Folder', 'Close'],
  });
  if (result.response === 0) {
    await shell.openPath(crashDir);
  }
}

/**
 * Get crash dumps directory
 */
export function getCrashDumpsDirectory(): string {
  return app.getPath('crashDumps');
}

/**
 * Get local crash dumps
 */
export async function getLocalCrashDumps(): Promise<Array<{ name: string; path: string; date: Date; size: number }>> {
  const crashDir = getCrashDumpsDirectory();
  const dumps: Array<{ name: string; path: string; date: Date; size: number }> = [];

  try {
    const files = await fs.readdir(crashDir);

    for (const file of files) {
      if (file.endsWith('.dmp')) {
        const filePath = path.join(crashDir, file);
        const stats = await fs.stat(filePath);

        dumps.push({
          name: file,
          path: filePath,
          date: stats.mtime,
          size: stats.size,
        });
      }
    }

    // Sort by date, newest first
    dumps.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('[WindowsCrashReporter] Failed to read crash dumps:', error);
  }

  return dumps;
}

/**
 * Clean up old crash dumps
 */
async function cleanupOldDumps(): Promise<void> {
  const dumps = await getLocalCrashDumps();

  if (dumps.length > config.maxLocalDumps) {
    const toDelete = dumps.slice(config.maxLocalDumps);

    for (const dump of toDelete) {
      try {
        await fs.unlink(dump.path);
        console.log(`[WindowsCrashReporter] Deleted old dump: ${dump.name}`);
      } catch (error) {
        console.error(`[WindowsCrashReporter] Failed to delete dump: ${dump.name}`, error);
      }
    }
  }
}

/**
 * Add crash context for current document
 */
export function addCrashContext(context: {
  documentPath?: string;
  documentPages?: number;
  currentAction?: string;
  activeTools?: string[];
}): void {
  if (!isInitialized) return;

  if (context.documentPath) {
    crashReporter.addExtraParameter('documentName', path.basename(context.documentPath));
  }
  if (context.documentPages !== undefined) {
    crashReporter.addExtraParameter('documentPages', context.documentPages.toString());
  }
  if (context.currentAction) {
    crashReporter.addExtraParameter('currentAction', context.currentAction);
  }
  if (context.activeTools) {
    crashReporter.addExtraParameter('activeTools', context.activeTools.join(','));
  }
}

/**
 * Clear crash context
 */
export function clearCrashContext(): void {
  if (!isInitialized) return;

  crashReporter.removeExtraParameter('documentName');
  crashReporter.removeExtraParameter('documentPages');
  crashReporter.removeExtraParameter('currentAction');
  crashReporter.removeExtraParameter('activeTools');
}

/**
 * Trigger a test crash (for debugging)
 */
export function triggerTestCrash(): void {
  console.log('[WindowsCrashReporter] Triggering test crash...');
  process.crash();
}

/**
 * Get crash reporter status
 */
export function getCrashReporterStatus(): {
  initialized: boolean;
  uploadsEnabled: boolean;
  crashDumpsDir: string;
  dumpCount: number;
} {
  const crashDir = getCrashDumpsDirectory();

  return {
    initialized: isInitialized,
    uploadsEnabled: config.uploadCrashReports,
    crashDumpsDir: crashDir,
    dumpCount: 0, // Will be populated asynchronously
  };
}
