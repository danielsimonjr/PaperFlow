/**
 * Backup Module
 *
 * Manages backup creation and restoration for PDF files.
 * Backups are stored in a configurable directory with configurable retention.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import type { BackupInfo, BackupOptions } from './ipc/types';

// Default configuration
const DEFAULT_BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
const DEFAULT_MAX_BACKUPS = 5;
const BACKUP_INDEX_FILE = 'backup-index.json';

/**
 * Backup index structure
 */
interface BackupIndex {
  backups: Array<{
    id: string;
    originalPath: string;
    backupPath: string;
    timestamp: number;
    size: number;
  }>;
}

// Cache backup index
let backupIndexCache: BackupIndex | null = null;

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(backupDir: string = DEFAULT_BACKUP_DIR): Promise<void> {
  try {
    await fs.mkdir(backupDir, { recursive: true });
  } catch (error) {
    console.error('[Backup] Failed to create backup directory:', error);
  }
}

/**
 * Get path to backup index file
 */
function getBackupIndexPath(backupDir: string = DEFAULT_BACKUP_DIR): string {
  return path.join(backupDir, BACKUP_INDEX_FILE);
}

/**
 * Load backup index
 */
async function loadBackupIndex(backupDir: string = DEFAULT_BACKUP_DIR): Promise<BackupIndex> {
  if (backupIndexCache) {
    return backupIndexCache;
  }

  try {
    const data = await fs.readFile(getBackupIndexPath(backupDir), 'utf-8');
    backupIndexCache = JSON.parse(data) as BackupIndex;
    return backupIndexCache;
  } catch {
    backupIndexCache = { backups: [] };
    return backupIndexCache;
  }
}

/**
 * Save backup index
 */
async function saveBackupIndex(index: BackupIndex, backupDir: string = DEFAULT_BACKUP_DIR): Promise<void> {
  backupIndexCache = index;
  await ensureBackupDir(backupDir);
  await fs.writeFile(getBackupIndexPath(backupDir), JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Generate unique backup ID
 */
function generateBackupId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Generate backup file path
 */
function generateBackupPath(originalPath: string, backupDir: string, timestamp: number): string {
  const ext = path.extname(originalPath);
  const name = path.basename(originalPath, ext);
  const date = new Date(timestamp);
  const dateStr = date.toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return path.join(backupDir, `${name}_backup_${dateStr}${ext}`);
}

/**
 * Create a backup of a file
 */
export async function createBackup(filePath: string, options: BackupOptions = {}): Promise<BackupInfo | null> {
  const {
    maxBackups = DEFAULT_MAX_BACKUPS,
    backupDir = DEFAULT_BACKUP_DIR,
  } = options;

  const normalizedPath = path.normalize(filePath);

  try {
    await ensureBackupDir(backupDir);

    // Check if source file exists
    const stats = await fs.stat(normalizedPath);
    if (!stats.isFile()) {
      console.error('[Backup] Source is not a file:', normalizedPath);
      return null;
    }

    // Generate backup info
    const timestamp = Date.now();
    const id = generateBackupId();
    const backupPath = generateBackupPath(normalizedPath, backupDir, timestamp);

    // Copy file to backup location
    await fs.copyFile(normalizedPath, backupPath);

    // Update index
    const index = await loadBackupIndex(backupDir);

    // Add new backup
    const newBackup = {
      id,
      originalPath: normalizedPath,
      backupPath,
      timestamp,
      size: stats.size,
    };
    index.backups.push(newBackup);

    // Clean up old backups for this file if exceeding max
    const fileBackups = index.backups.filter((b) => b.originalPath === normalizedPath);
    if (fileBackups.length > maxBackups) {
      // Sort by timestamp (oldest first)
      fileBackups.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest backups
      const toRemove = fileBackups.slice(0, fileBackups.length - maxBackups);
      for (const backup of toRemove) {
        try {
          await fs.unlink(backup.backupPath);
        } catch {
          // Ignore if file doesn't exist
        }
        index.backups = index.backups.filter((b) => b.id !== backup.id);
      }
    }

    await saveBackupIndex(index, backupDir);

    console.log(`[Backup] Created backup for ${normalizedPath}: ${backupPath}`);
    return newBackup;
  } catch (error) {
    console.error('[Backup] Failed to create backup:', error);
    return null;
  }
}

/**
 * List all backups for a file
 */
export async function listBackups(filePath: string, backupDir: string = DEFAULT_BACKUP_DIR): Promise<BackupInfo[]> {
  const normalizedPath = path.normalize(filePath);
  const index = await loadBackupIndex(backupDir);

  const backups = index.backups
    .filter((b) => b.originalPath === normalizedPath)
    .sort((a, b) => b.timestamp - a.timestamp); // Newest first

  // Verify files still exist
  const validBackups: BackupInfo[] = [];
  for (const backup of backups) {
    try {
      await fs.access(backup.backupPath);
      validBackups.push(backup);
    } catch {
      // Backup file no longer exists, skip it
    }
  }

  return validBackups;
}

/**
 * Restore a backup
 */
export async function restoreBackup(backupId: string, backupDir: string = DEFAULT_BACKUP_DIR): Promise<boolean> {
  const index = await loadBackupIndex(backupDir);
  const backup = index.backups.find((b) => b.id === backupId);

  if (!backup) {
    console.error('[Backup] Backup not found:', backupId);
    return false;
  }

  try {
    // Verify backup file exists
    await fs.access(backup.backupPath);

    // Copy backup to original location
    await fs.copyFile(backup.backupPath, backup.originalPath);

    console.log(`[Backup] Restored backup ${backupId} to ${backup.originalPath}`);
    return true;
  } catch (error) {
    console.error('[Backup] Failed to restore backup:', error);
    return false;
  }
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(backupId: string, backupDir: string = DEFAULT_BACKUP_DIR): Promise<boolean> {
  const index = await loadBackupIndex(backupDir);
  const backupIndex = index.backups.findIndex((b) => b.id === backupId);

  if (backupIndex === -1) {
    console.error('[Backup] Backup not found:', backupId);
    return false;
  }

  const backup = index.backups[backupIndex];

  try {
    // Delete backup file
    await fs.unlink(backup.backupPath);
  } catch {
    // Ignore if file doesn't exist
  }

  // Remove from index
  index.backups.splice(backupIndex, 1);
  await saveBackupIndex(index, backupDir);

  console.log(`[Backup] Deleted backup: ${backupId}`);
  return true;
}

/**
 * Delete all backups for a file
 */
export async function deleteAllBackups(filePath: string, backupDir: string = DEFAULT_BACKUP_DIR): Promise<void> {
  const normalizedPath = path.normalize(filePath);
  const index = await loadBackupIndex(backupDir);

  const fileBackups = index.backups.filter((b) => b.originalPath === normalizedPath);

  for (const backup of fileBackups) {
    try {
      await fs.unlink(backup.backupPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  index.backups = index.backups.filter((b) => b.originalPath !== normalizedPath);
  await saveBackupIndex(index, backupDir);

  console.log(`[Backup] Deleted all backups for: ${normalizedPath}`);
}

/**
 * Get backup by ID
 */
export async function getBackup(backupId: string, backupDir: string = DEFAULT_BACKUP_DIR): Promise<BackupInfo | null> {
  const index = await loadBackupIndex(backupDir);
  const backup = index.backups.find((b) => b.id === backupId);
  return backup ?? null;
}

/**
 * Clear backup index cache
 */
export function clearBackupCache(): void {
  backupIndexCache = null;
}

/**
 * Get all backups
 */
export async function getAllBackups(backupDir: string = DEFAULT_BACKUP_DIR): Promise<BackupInfo[]> {
  const index = await loadBackupIndex(backupDir);
  return [...index.backups].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Clean up orphaned backup files
 */
export async function cleanupOrphanedBackups(backupDir: string = DEFAULT_BACKUP_DIR): Promise<number> {
  let cleaned = 0;

  try {
    await ensureBackupDir(backupDir);
    const index = await loadBackupIndex(backupDir);
    const indexedPaths = new Set(index.backups.map((b) => b.backupPath));

    // List all files in backup directory
    const files = await fs.readdir(backupDir);

    for (const file of files) {
      if (file === BACKUP_INDEX_FILE) continue;

      const filePath = path.join(backupDir, file);
      if (!indexedPaths.has(filePath)) {
        try {
          await fs.unlink(filePath);
          cleaned++;
        } catch {
          // Ignore errors
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[Backup] Cleaned up ${cleaned} orphaned backup files`);
    }
  } catch (error) {
    console.error('[Backup] Failed to cleanup orphaned backups:', error);
  }

  return cleaned;
}
