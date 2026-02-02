/**
 * Crash Reporter Module
 *
 * Sets up crash reporting for the Electron application.
 * Collects and submits crash reports for analysis.
 */

import { crashReporter, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

/**
 * Crash reporter configuration
 */
export interface CrashReporterConfig {
  /** URL to submit crash reports to */
  submitURL: string;
  /** Product name */
  productName?: string;
  /** Company name */
  companyName?: string;
  /** Whether to upload crash reports */
  uploadToServer?: boolean;
  /** Whether to ignore system crash handler */
  ignoreSystemCrashHandler?: boolean;
  /** Additional metadata to include */
  extra?: Record<string, string>;
  /** Whether to rate limit uploads */
  rateLimit?: boolean;
  /** Whether to compress crash dumps */
  compress?: boolean;
}

/**
 * Crash report info
 */
export interface CrashReport {
  id: string;
  date: Date;
  path: string;
  size: number;
}

// Default configuration
const DEFAULT_CONFIG: CrashReporterConfig = {
  submitURL: '', // Must be configured
  productName: 'PaperFlow',
  companyName: 'PaperFlow',
  uploadToServer: true,
  ignoreSystemCrashHandler: false,
  rateLimit: true,
  compress: true,
};

// Store for user consent
let userConsentGiven = false;

/**
 * Check if user has given consent to crash reporting
 */
export function hasUserConsent(): boolean {
  return userConsentGiven;
}

/**
 * Set user consent for crash reporting
 */
export function setUserConsent(consent: boolean): void {
  userConsentGiven = consent;
  console.log(`[CrashReporter] User consent: ${consent}`);
}

/**
 * Initialize the crash reporter
 *
 * @param config - Crash reporter configuration
 */
export function initializeCrashReporter(config?: Partial<CrashReporterConfig>): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Don't initialize if no submit URL or no user consent
  if (!finalConfig.submitURL) {
    console.log('[CrashReporter] No submit URL configured, crash reporting disabled');
    return;
  }

  if (!userConsentGiven && finalConfig.uploadToServer) {
    console.log('[CrashReporter] User consent not given, uploads disabled');
    finalConfig.uploadToServer = false;
  }

  try {
    crashReporter.start({
      submitURL: finalConfig.submitURL,
      productName: finalConfig.productName,
      companyName: finalConfig.companyName,
      uploadToServer: finalConfig.uploadToServer,
      ignoreSystemCrashHandler: finalConfig.ignoreSystemCrashHandler,
      rateLimit: finalConfig.rateLimit,
      compress: finalConfig.compress,
      extra: {
        ...finalConfig.extra,
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        appVersion: app.getVersion(),
      },
    });

    console.log('[CrashReporter] Initialized');
  } catch (error) {
    console.error('[CrashReporter] Failed to initialize:', error);
  }
}

/**
 * Add extra parameters to crash reports
 *
 * @param key - Parameter key
 * @param value - Parameter value
 */
export function addExtraParameter(key: string, value: string): void {
  crashReporter.addExtraParameter(key, value);
}

/**
 * Remove an extra parameter
 *
 * @param key - Parameter key to remove
 */
export function removeExtraParameter(key: string): void {
  crashReporter.removeExtraParameter(key);
}

/**
 * Get all extra parameters
 */
export function getExtraParameters(): Record<string, string> {
  return crashReporter.getParameters();
}

/**
 * Get the path to crash dumps directory
 */
export function getCrashDumpsDirectory(): string {
  return app.getPath('crashDumps');
}

/**
 * Get the path to uploaded crash reports
 */
export function getUploadedReportsPath(): string {
  return crashReporter.getUploadedReports
    ? path.dirname(crashReporter.getUploadedReports()[0]?.id || getCrashDumpsDirectory())
    : getCrashDumpsDirectory();
}

/**
 * Get list of uploaded crash reports
 */
export function getUploadedReports(): CrashReport[] {
  const reports = crashReporter.getUploadedReports();

  return reports.map((report) => ({
    id: report.id,
    date: report.date,
    path: '', // Path is not provided by Electron API
    size: 0,
  }));
}

/**
 * Get list of local crash dumps
 */
export async function getLocalCrashDumps(): Promise<CrashReport[]> {
  const crashDir = getCrashDumpsDirectory();
  const reports: CrashReport[] = [];

  try {
    const files = await fs.readdir(crashDir);

    for (const file of files) {
      if (file.endsWith('.dmp') || file.endsWith('.txt')) {
        const filePath = path.join(crashDir, file);
        const stats = await fs.stat(filePath);

        reports.push({
          id: file,
          date: stats.mtime,
          path: filePath,
          size: stats.size,
        });
      }
    }

    // Sort by date, newest first
    reports.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('[CrashReporter] Failed to read crash dumps:', error);
  }

  return reports;
}

/**
 * Delete a crash dump
 */
export async function deleteCrashDump(path: string): Promise<boolean> {
  try {
    await fs.unlink(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete all local crash dumps
 */
export async function deleteAllCrashDumps(): Promise<number> {
  const dumps = await getLocalCrashDumps();
  let deleted = 0;

  for (const dump of dumps) {
    if (await deleteCrashDump(dump.path)) {
      deleted++;
    }
  }

  return deleted;
}

/**
 * Get last crash information (if available)
 */
export function getLastCrashReport(): CrashReport | null {
  const reports = crashReporter.getUploadedReports();
  if (reports.length === 0) {
    return null;
  }

  const last = reports[reports.length - 1];
  return {
    id: last.id,
    date: last.date,
    path: '',
    size: 0,
  };
}

/**
 * Request user consent for crash reporting
 */
export async function requestUserConsent(): Promise<boolean> {
  const result = await dialog.showMessageBox({
    type: 'question',
    title: 'Help Improve PaperFlow',
    message: 'Would you like to send crash reports?',
    detail:
      'Crash reports help us identify and fix problems. They contain technical information about the crash but no personal data or document contents.',
    buttons: ['Send Crash Reports', 'No Thanks'],
    defaultId: 0,
    cancelId: 1,
    checkboxLabel: 'Remember my choice',
    checkboxChecked: true,
  });

  const consent = result.response === 0;
  setUserConsent(consent);

  return consent;
}

/**
 * System information for crash context
 */
export function getSystemInfo(): Record<string, string> {
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length.toString(),
    totalMemory: os.totalmem().toString(),
    freeMemory: os.freemem().toString(),
    osVersion: os.release(),
    hostname: os.hostname(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    appVersion: app.getVersion(),
    locale: app.getLocale(),
  };
}

/**
 * Update crash reporter with current app state
 */
export function updateCrashContext(context: {
  documentOpen?: boolean;
  documentPath?: string;
  pageCount?: number;
  lastAction?: string;
}): void {
  if (context.documentOpen !== undefined) {
    addExtraParameter('documentOpen', context.documentOpen.toString());
  }
  if (context.documentPath) {
    // Only store the filename, not the full path for privacy
    addExtraParameter('documentName', path.basename(context.documentPath));
  }
  if (context.pageCount !== undefined) {
    addExtraParameter('pageCount', context.pageCount.toString());
  }
  if (context.lastAction) {
    addExtraParameter('lastAction', context.lastAction);
  }
}

/**
 * IPC channel names for crash reporter
 */
export const CRASH_REPORTER_CHANNELS = {
  GET_CONSENT: 'crash-reporter-get-consent',
  SET_CONSENT: 'crash-reporter-set-consent',
  REQUEST_CONSENT: 'crash-reporter-request-consent',
  GET_UPLOADS: 'crash-reporter-get-uploads',
  GET_LOCAL_DUMPS: 'crash-reporter-get-local-dumps',
  DELETE_DUMP: 'crash-reporter-delete-dump',
  DELETE_ALL_DUMPS: 'crash-reporter-delete-all-dumps',
  GET_SYSTEM_INFO: 'crash-reporter-get-system-info',
  ADD_CONTEXT: 'crash-reporter-add-context',
} as const;
