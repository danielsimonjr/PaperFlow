/**
 * Configuration Watcher (Sprint 20)
 *
 * Watches configuration files for changes and triggers reloads.
 */

import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * Watcher options
 */
export interface ConfigWatcherOptions {
  /** File paths to watch */
  paths: string[];
  /** Polling interval in milliseconds (for fallback) */
  pollInterval?: number;
  /** Debounce delay for rapid changes */
  debounceDelay?: number;
  /** Use native file watching when available */
  useNativeWatch?: boolean;
}

/**
 * Watch event
 */
export interface WatchEvent {
  type: 'change' | 'add' | 'remove' | 'error';
  path: string;
  timestamp: number;
  error?: string;
}

/**
 * Watcher callback
 */
export type WatchCallback = (event: WatchEvent) => void;

/**
 * Configuration watcher class
 */
export class ConfigWatcher {
  private options: ConfigWatcherOptions;
  private callbacks: Set<WatchCallback> = new Set();
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastModified: Map<string, number> = new Map();
  private lastHash: Map<string, string> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;
  private nativeWatcher: unknown = null;

  constructor(options: ConfigWatcherOptions) {
    this.options = {
      pollInterval: 5000,
      debounceDelay: 500,
      useNativeWatch: true,
      ...options,
    };
  }

  /**
   * Start watching
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    // Try native watching first
    if (this.options.useNativeWatch) {
      const started = await this.startNativeWatch();
      if (started) return;
    }

    // Fall back to polling
    this.startPolling();
  }

  /**
   * Stop watching
   */
  stop(): void {
    this.isRunning = false;

    // Stop native watcher
    if (this.nativeWatcher) {
      this.stopNativeWatch();
    }

    // Stop polling timers
    for (const timer of this.pollingTimers.values()) {
      clearInterval(timer);
    }
    this.pollingTimers.clear();

    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Add a change callback
   */
  onchange(callback: WatchCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Remove a callback
   */
  offchange(callback: WatchCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Add a path to watch
   */
  addPath(path: string): void {
    if (!this.options.paths.includes(path)) {
      this.options.paths.push(path);

      if (this.isRunning) {
        this.watchPath(path);
      }
    }
  }

  /**
   * Remove a path from watch
   */
  removePath(path: string): void {
    const index = this.options.paths.indexOf(path);
    if (index >= 0) {
      this.options.paths.splice(index, 1);
      this.unwatchPath(path);
    }
  }

  /**
   * Trigger a manual check
   */
  async checkNow(): Promise<void> {
    for (const path of this.options.paths) {
      await this.checkFile(path);
    }
  }

  /**
   * Start native file watching
   */
  private async startNativeWatch(): Promise<boolean> {
    // Check if Electron fs.watch is available
    if (typeof window !== 'undefined' && window.electron?.watchFile) {
      try {
        // Set up the file change listener
        if (window.electron.onFileChanged) {
          window.electron.onFileChanged((event) => {
            if (this.options.paths.includes(event.path)) {
              this.handleFileChange(event.path);
            }
          });
        }

        // Watch each path
        for (const path of this.options.paths) {
          await window.electron.watchFile(path);
        }
        return true;
      } catch {
        return false;
      }
    }

    // Check if Node.js fs module is available
    if (typeof require !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');

        for (const path of this.options.paths) {
          try {
            const watcher = fs.watch(path, (_event: string, filename: string) => {
              this.handleFileChange(filename || path);
            });

            // Store reference for cleanup
            if (!this.nativeWatcher) {
              this.nativeWatcher = new Map();
            }
            (this.nativeWatcher as Map<string, unknown>).set(path, watcher);
          } catch {
            // File might not exist yet
          }
        }
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Stop native file watching
   */
  private stopNativeWatch(): void {
    if (this.nativeWatcher instanceof Map) {
      for (const watcher of this.nativeWatcher.values()) {
        if (watcher && typeof (watcher as { close?: () => void }).close === 'function') {
          (watcher as { close: () => void }).close();
        }
      }
      this.nativeWatcher = null;
    }
  }

  /**
   * Start polling for changes
   */
  private startPolling(): void {
    for (const path of this.options.paths) {
      this.watchPath(path);
    }
  }

  /**
   * Watch a single path via polling
   */
  private watchPath(path: string): void {
    // Initial check to get baseline
    this.checkFile(path);

    // Set up polling
    const timer = setInterval(() => {
      this.checkFile(path);
    }, this.options.pollInterval);

    this.pollingTimers.set(path, timer);
  }

  /**
   * Unwatch a single path
   */
  private unwatchPath(path: string): void {
    const timer = this.pollingTimers.get(path);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(path);
    }

    this.lastModified.delete(path);
    this.lastHash.delete(path);
  }

  /**
   * Check a file for changes
   */
  private async checkFile(path: string): Promise<void> {
    try {
      const info = await this.getFileInfo(path);

      if (!info.exists) {
        // File was removed
        if (this.lastModified.has(path)) {
          this.lastModified.delete(path);
          this.lastHash.delete(path);
          this.emitEvent({ type: 'remove', path, timestamp: Date.now() });
        }
        return;
      }

      const lastMod = this.lastModified.get(path);
      const lastHashValue = this.lastHash.get(path);

      // Check if this is a new file
      if (lastMod === undefined) {
        this.lastModified.set(path, info.mtime);
        this.lastHash.set(path, info.hash);
        this.emitEvent({ type: 'add', path, timestamp: Date.now() });
        return;
      }

      // Check if modified
      if (info.mtime !== lastMod || info.hash !== lastHashValue) {
        this.lastModified.set(path, info.mtime);
        this.lastHash.set(path, info.hash);
        this.emitEvent({ type: 'change', path, timestamp: Date.now() });
      }
    } catch (error) {
      this.emitEvent({
        type: 'error',
        path,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get file info
   */
  private async getFileInfo(
    path: string
  ): Promise<{ exists: boolean; mtime: number; hash: string }> {
    // Electron environment
    if (typeof window !== 'undefined' && window.electron?.getFileStats) {
      const stats = await window.electron.getFileStats(path);
      if (stats) {
        return {
          exists: true,
          mtime: stats.modified || 0,
          hash: '', // Hash will be computed via content comparison if needed
        };
      }
      return { exists: false, mtime: 0, hash: '' };
    }

    // Node.js environment
    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');

      try {
        const stats = fs.statSync(path);
        const content = fs.readFileSync(path);
        const hash = crypto.createHash('md5').update(content).digest('hex');

        return {
          exists: true,
          mtime: stats.mtimeMs,
          hash,
        };
      } catch {
        return { exists: false, mtime: 0, hash: '' };
      }
    }

    return { exists: false, mtime: 0, hash: '' };
  }

  /**
   * Handle file change from native watcher
   */
  private handleFileChange(path: string): void {
    // Debounce rapid changes
    const existing = this.debounceTimers.get(path);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(path);
      this.checkFile(path);
    }, this.options.debounceDelay);

    this.debounceTimers.set(path, timer);
  }

  /**
   * Emit event to callbacks
   */
  private emitEvent(event: WatchEvent): void {
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch {
        // Ignore callback errors
      }
    }
  }
}

/**
 * Create a configuration watcher
 */
export function createConfigWatcher(options: ConfigWatcherOptions): ConfigWatcher {
  return new ConfigWatcher(options);
}

/**
 * Watch configuration and auto-reload
 */
export function watchAndReload(
  paths: string[],
  onReload: (config: EnterpriseConfig, path: string) => void,
  onError?: (error: string, path: string) => void
): ConfigWatcher {
  const watcher = new ConfigWatcher({ paths });

  watcher.onchange(async (event) => {
    if (event.type === 'change' || event.type === 'add') {
      try {
        // Load the config
        const { loadJsonFile } = await import('./jsonConfigLoader');
        const { loadYamlFile } = await import('./yamlConfigLoader');

        const isYaml = event.path.endsWith('.yaml') || event.path.endsWith('.yml');
        const result = isYaml ? await loadYamlFile(event.path) : await loadJsonFile(event.path);

        if (result.success && result.config) {
          onReload(result.config, event.path);
        } else if (onError) {
          onError(result.errors.map((e) => e.message).join('; '), event.path);
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error.message : 'Unknown error', event.path);
        }
      }
    } else if (event.type === 'error' && onError) {
      onError(event.error || 'Unknown error', event.path);
    }
  });

  watcher.start();

  return watcher;
}

export default ConfigWatcher;
