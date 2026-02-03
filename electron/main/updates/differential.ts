/**
 * Differential Updates
 *
 * Support for differential/delta updates to reduce download size.
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * File hash entry
 */
interface FileHashEntry {
  path: string;
  hash: string;
  size: number;
}

/**
 * Delta manifest
 */
interface DeltaManifest {
  fromVersion: string;
  toVersion: string;
  files: {
    added: FileHashEntry[];
    modified: FileHashEntry[];
    removed: string[];
  };
  totalSize: number;
  deltaSize: number;
}

/**
 * Differential update service
 */
export class DifferentialUpdater {
  private appPath: string;
  private cacheDir: string;

  constructor() {
    this.appPath = app.getAppPath();
    this.cacheDir = path.join(app.getPath('userData'), 'update-cache');

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Calculate file hash
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Generate manifest of current installation
   */
  async generateCurrentManifest(): Promise<FileHashEntry[]> {
    const manifest: FileHashEntry[] = [];
    const resourcesPath = path.join(this.appPath, '..');

    const walkDir = async (dir: string, base: string = ''): Promise<void> => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name);

        if (entry.isDirectory()) {
          await walkDir(fullPath, relativePath);
        } else if (entry.isFile()) {
          const hash = await this.calculateFileHash(fullPath);
          const stats = fs.statSync(fullPath);
          manifest.push({
            path: relativePath,
            hash,
            size: stats.size,
          });
        }
      }
    };

    await walkDir(resourcesPath);
    return manifest;
  }

  /**
   * Compare manifests to generate delta
   */
  compareManifesets(
    current: FileHashEntry[],
    target: FileHashEntry[]
  ): DeltaManifest['files'] {
    const currentMap = new Map(current.map((f) => [f.path, f]));
    const targetMap = new Map(target.map((f) => [f.path, f]));

    const added: FileHashEntry[] = [];
    const modified: FileHashEntry[] = [];
    const removed: string[] = [];

    // Find added and modified
    for (const [path, entry] of targetMap) {
      const currentEntry = currentMap.get(path);
      if (!currentEntry) {
        added.push(entry);
      } else if (currentEntry.hash !== entry.hash) {
        modified.push(entry);
      }
    }

    // Find removed
    for (const path of currentMap.keys()) {
      if (!targetMap.has(path)) {
        removed.push(path);
      }
    }

    return { added, modified, removed };
  }

  /**
   * Calculate delta size vs full update size
   */
  calculateSavings(delta: DeltaManifest): {
    fullSize: number;
    deltaSize: number;
    savings: number;
    savingsPercent: number;
  } {
    const fullSize = delta.totalSize;
    const deltaSize = delta.deltaSize;
    const savings = fullSize - deltaSize;
    const savingsPercent = (savings / fullSize) * 100;

    return { fullSize, deltaSize, savings, savingsPercent };
  }

  /**
   * Check if differential update is available
   * Note: updateUrl parameter reserved for future server implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isDifferentialAvailable(updateUrl: string): Promise<boolean> {
    // In a real implementation, check the update server for delta availability
    // For now, return false to use full updates
    return false;
  }

  /**
   * Apply differential update
   * Note: delta parameter reserved for future implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async applyDelta(delta: DeltaManifest): Promise<void> {
    // In a real implementation:
    // 1. Download only changed/added files
    // 2. Apply binary diff patches for modified files
    // 3. Remove deleted files
    // 4. Verify integrity
    throw new Error('Differential updates not yet implemented');
  }

  /**
   * Clean up cache
   */
  cleanCache(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true });
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
}

export default DifferentialUpdater;
