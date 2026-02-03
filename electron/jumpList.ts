/**
 * Windows Jump List Manager
 *
 * Manages Windows Jump List with recent documents, pinned items, and common tasks.
 */

import { app, JumpListCategory, JumpListItem } from 'electron';
import path from 'path';
import fs from 'fs/promises';

/**
 * Recent file entry
 */
interface RecentFile {
  path: string;
  name: string;
  lastOpened: Date;
  pinned?: boolean;
}

/**
 * Jump List configuration
 */
interface JumpListConfig {
  maxRecentFiles: number;
  showTasks: boolean;
  showFrequent: boolean;
}

const DEFAULT_CONFIG: JumpListConfig = {
  maxRecentFiles: 10,
  showTasks: true,
  showFrequent: true,
};

/**
 * Jump List Manager class
 */
export class JumpListManager {
  private config: JumpListConfig;
  private recentFiles: RecentFile[] = [];
  private pinnedFiles: RecentFile[] = [];

  constructor(config?: Partial<JumpListConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Only initialize on Windows
    if (process.platform !== 'win32') {
      console.log('[JumpListManager] Not Windows, Jump Lists disabled');
      return;
    }

    this.initialize();
  }

  /**
   * Initialize Jump Lists
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadRecentFiles();
      await this.updateJumpList();
      console.log('[JumpListManager] Initialized');
    } catch (error) {
      console.error('[JumpListManager] Failed to initialize:', error);
    }
  }

  /**
   * Load recent files from storage
   */
  private async loadRecentFiles(): Promise<void> {
    try {
      const dataPath = path.join(app.getPath('userData'), 'recent-files.json');
      const data = await fs.readFile(dataPath, 'utf-8');
      const parsed = JSON.parse(data);

      this.recentFiles = parsed.recent || [];
      this.pinnedFiles = parsed.pinned || [];
    } catch {
      // File doesn't exist or is invalid
      this.recentFiles = [];
      this.pinnedFiles = [];
    }
  }

  /**
   * Save recent files to storage
   */
  private async saveRecentFiles(): Promise<void> {
    try {
      const dataPath = path.join(app.getPath('userData'), 'recent-files.json');
      const data = JSON.stringify({
        recent: this.recentFiles,
        pinned: this.pinnedFiles,
      });
      await fs.writeFile(dataPath, data, 'utf-8');
    } catch (error) {
      console.error('[JumpListManager] Failed to save recent files:', error);
    }
  }

  /**
   * Update the Windows Jump List
   */
  async updateJumpList(): Promise<void> {
    if (process.platform !== 'win32') return;

    try {
      const categories: JumpListCategory[] = [];

      // Tasks category - common actions
      if (this.config.showTasks) {
        categories.push({
          type: 'tasks',
          items: this.createTaskItems(),
        });
      }

      // Pinned files
      if (this.pinnedFiles.length > 0) {
        categories.push({
          type: 'custom',
          name: 'Pinned',
          items: this.createFileItems(this.pinnedFiles),
        });
      }

      // Recent files
      if (this.recentFiles.length > 0) {
        categories.push({
          type: 'custom',
          name: 'Recent',
          items: this.createFileItems(this.recentFiles.slice(0, this.config.maxRecentFiles)),
        });
      }

      // Frequent files (optional)
      if (this.config.showFrequent) {
        categories.push({
          type: 'frequent',
        });
      }

      app.setJumpList(categories);
      console.log('[JumpListManager] Jump List updated');
    } catch (error) {
      console.error('[JumpListManager] Failed to update Jump List:', error);
    }
  }

  /**
   * Create task items for Jump List
   */
  private createTaskItems(): JumpListItem[] {
    const exePath = process.execPath;

    return [
      {
        type: 'task',
        title: 'New Window',
        description: 'Open a new PaperFlow window',
        program: exePath,
        args: '--new-window',
        iconPath: exePath,
        iconIndex: 0,
      },
      {
        type: 'task',
        title: 'Open File...',
        description: 'Open a PDF file',
        program: exePath,
        args: '--open',
        iconPath: exePath,
        iconIndex: 0,
      },
      {
        type: 'separator',
      },
      {
        type: 'task',
        title: 'Print...',
        description: 'Print the current document',
        program: exePath,
        args: '--print',
        iconPath: exePath,
        iconIndex: 0,
      },
    ];
  }

  /**
   * Create file items for Jump List
   */
  private createFileItems(files: RecentFile[]): JumpListItem[] {
    return files.map((file) => ({
      type: 'file' as const,
      path: file.path,
      title: file.name,
    }));
  }

  /**
   * Add a file to recent files
   */
  async addRecentFile(filePath: string): Promise<void> {
    if (process.platform !== 'win32') return;

    const name = path.basename(filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log('[JumpListManager] File not accessible, skipping:', filePath);
      return;
    }

    // Remove if already exists
    this.recentFiles = this.recentFiles.filter((f) => f.path !== filePath);

    // Add to front
    this.recentFiles.unshift({
      path: filePath,
      name,
      lastOpened: new Date(),
    });

    // Trim to max
    if (this.recentFiles.length > this.config.maxRecentFiles) {
      this.recentFiles = this.recentFiles.slice(0, this.config.maxRecentFiles);
    }

    await this.saveRecentFiles();
    await this.updateJumpList();
  }

  /**
   * Remove a file from recent files
   */
  async removeRecentFile(filePath: string): Promise<void> {
    this.recentFiles = this.recentFiles.filter((f) => f.path !== filePath);
    await this.saveRecentFiles();
    await this.updateJumpList();
  }

  /**
   * Pin a file
   */
  async pinFile(filePath: string): Promise<void> {
    if (process.platform !== 'win32') return;

    const existing = this.recentFiles.find((f) => f.path === filePath);
    if (!existing) return;

    // Remove from recent
    this.recentFiles = this.recentFiles.filter((f) => f.path !== filePath);

    // Add to pinned
    if (!this.pinnedFiles.find((f) => f.path === filePath)) {
      this.pinnedFiles.unshift({ ...existing, pinned: true });
    }

    await this.saveRecentFiles();
    await this.updateJumpList();
  }

  /**
   * Unpin a file
   */
  async unpinFile(filePath: string): Promise<void> {
    if (process.platform !== 'win32') return;

    const pinned = this.pinnedFiles.find((f) => f.path === filePath);
    if (!pinned) return;

    // Remove from pinned
    this.pinnedFiles = this.pinnedFiles.filter((f) => f.path !== filePath);

    // Add back to recent
    this.recentFiles.unshift({ ...pinned, pinned: false });

    await this.saveRecentFiles();
    await this.updateJumpList();
  }

  /**
   * Clear all recent files
   */
  async clearRecentFiles(): Promise<void> {
    this.recentFiles = [];
    await this.saveRecentFiles();
    await this.updateJumpList();
  }

  /**
   * Get recent files
   */
  getRecentFiles(): RecentFile[] {
    return [...this.recentFiles];
  }

  /**
   * Get pinned files
   */
  getPinnedFiles(): RecentFile[] {
    return [...this.pinnedFiles];
  }
}

// Singleton instance
let jumpListManager: JumpListManager | null = null;

/**
 * Get or create Jump List manager
 */
export function getJumpListManager(): JumpListManager {
  if (!jumpListManager) {
    jumpListManager = new JumpListManager();
  }
  return jumpListManager;
}

/**
 * Initialize Jump List on app ready
 */
export function initializeJumpList(): JumpListManager {
  return getJumpListManager();
}
