/**
 * Configuration Merger (Sprint 20)
 *
 * Merges configurations from multiple sources with defined precedence.
 */

import type { EnterpriseConfig } from '@/types/enterpriseConfig';
import { DEFAULT_CONFIG } from './configParser';

/**
 * Configuration source types in precedence order (lowest to highest)
 */
export type ConfigSourceType =
  | 'default'
  | 'system'
  | 'user'
  | 'file'
  | 'remote'
  | 'env'
  | 'cli'
  | 'gpo'
  | 'mdm';

/**
 * Configuration with source tracking
 */
export interface TrackedConfig {
  config: Partial<EnterpriseConfig>;
  source: ConfigSourceType;
  sourcePath?: string;
  loadedAt: number;
}

/**
 * Merge options
 */
export interface MergeOptions {
  /** How to handle array merging */
  arrayMergeStrategy: 'replace' | 'concat' | 'union';
  /** Log merge conflicts */
  logConflicts: boolean;
  /** Track source of each value */
  trackSources: boolean;
}

/**
 * Merge result
 */
export interface MergeResult {
  config: EnterpriseConfig;
  sources: Map<string, ConfigSourceType>;
  conflicts: MergeConflict[];
}

/**
 * Merge conflict
 */
export interface MergeConflict {
  path: string;
  previousValue: unknown;
  previousSource: ConfigSourceType;
  newValue: unknown;
  newSource: ConfigSourceType;
}

/**
 * Default merge options
 */
const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  arrayMergeStrategy: 'replace',
  logConflicts: false,
  trackSources: true,
};

/**
 * Source precedence (higher number = higher priority)
 */
const SOURCE_PRECEDENCE: Record<ConfigSourceType, number> = {
  default: 0,
  system: 10,
  user: 20,
  file: 30,
  remote: 40,
  env: 50,
  cli: 60,
  gpo: 70,
  mdm: 70,
};

/**
 * Configuration merger class
 */
export class ConfigMerger {
  private configs: TrackedConfig[] = [];
  private options: MergeOptions;

  constructor(options: Partial<MergeOptions> = {}) {
    this.options = { ...DEFAULT_MERGE_OPTIONS, ...options };

    // Add default config
    this.addConfig(DEFAULT_CONFIG, 'default');
  }

  /**
   * Add a configuration source
   */
  addConfig(
    config: Partial<EnterpriseConfig>,
    source: ConfigSourceType,
    sourcePath?: string
  ): void {
    this.configs.push({
      config,
      source,
      sourcePath,
      loadedAt: Date.now(),
    });
  }

  /**
   * Clear all configurations except defaults
   */
  clear(): void {
    this.configs = this.configs.filter((c) => c.source === 'default');
  }

  /**
   * Merge all configurations
   */
  merge(): MergeResult {
    const sources = new Map<string, ConfigSourceType>();
    const conflicts: MergeConflict[] = [];

    // Sort by precedence
    const sorted = [...this.configs].sort(
      (a, b) => SOURCE_PRECEDENCE[a.source] - SOURCE_PRECEDENCE[b.source]
    );

    // Start with empty object
    let result: Record<string, unknown> = {};

    // Merge each config
    for (const tracked of sorted) {
      const mergeInfo = this.deepMerge(result, tracked.config, '', tracked.source, sources);
      result = mergeInfo.merged;
      conflicts.push(...mergeInfo.conflicts);
    }

    return {
      config: result as EnterpriseConfig,
      sources,
      conflicts,
    };
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    path: string,
    sourceType: ConfigSourceType,
    sourcesMap: Map<string, ConfigSourceType>
  ): { merged: Record<string, unknown>; conflicts: MergeConflict[] } {
    const result = { ...target };
    const conflicts: MergeConflict[] = [];

    for (const key of Object.keys(source)) {
      const sourcValue = source[key];
      const targetValue = result[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (sourcValue === undefined) {
        continue;
      }

      // Track conflict if overwriting
      if (this.options.trackSources && targetValue !== undefined && targetValue !== sourcValue) {
        const previousSource = sourcesMap.get(currentPath);
        if (previousSource) {
          conflicts.push({
            path: currentPath,
            previousValue: targetValue,
            previousSource,
            newValue: sourcValue,
            newSource: sourceType,
          });
        }
      }

      // Handle nested objects
      if (this.isPlainObject(sourcValue) && this.isPlainObject(targetValue)) {
        const nestedResult = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourcValue as Record<string, unknown>,
          currentPath,
          sourceType,
          sourcesMap
        );
        result[key] = nestedResult.merged;
        conflicts.push(...nestedResult.conflicts);
      }
      // Handle arrays
      else if (Array.isArray(sourcValue)) {
        result[key] = this.mergeArrays(
          targetValue as unknown[],
          sourcValue,
          this.options.arrayMergeStrategy
        );
        sourcesMap.set(currentPath, sourceType);
      }
      // Simple value
      else {
        result[key] = sourcValue;
        sourcesMap.set(currentPath, sourceType);
      }
    }

    return { merged: result, conflicts };
  }

  /**
   * Merge arrays based on strategy
   */
  private mergeArrays(
    target: unknown[] | undefined,
    source: unknown[],
    strategy: MergeOptions['arrayMergeStrategy']
  ): unknown[] {
    if (!target || strategy === 'replace') {
      return [...source];
    }

    if (strategy === 'concat') {
      return [...target, ...source];
    }

    // Union - combine unique values
    const result = [...target];
    for (const item of source) {
      if (!result.some((existing) => this.isEqual(existing, item))) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Check if value is a plain object
   */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Deep equality check
   */
  private isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.isEqual(item, b[index]));
    }

    if (this.isPlainObject(a) && this.isPlainObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this.isEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Get value at path with source info
   */
  getValueInfo(
    path: string
  ): { value: unknown; source: ConfigSourceType | null; sourcePath?: string } {
    const result = this.merge();
    const pathParts = path.split('.');

    let value: unknown = result.config;
    for (const part of pathParts) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return { value: undefined, source: null };
      }
    }

    const source = result.sources.get(path) || null;
    const tracked = this.configs.find((c) => c.source === source);

    return {
      value,
      source,
      sourcePath: tracked?.sourcePath,
    };
  }
}

/**
 * Create a configuration merger
 */
export function createConfigMerger(options?: Partial<MergeOptions>): ConfigMerger {
  return new ConfigMerger(options);
}

/**
 * Merge multiple configurations with precedence
 */
export function mergeConfigs(
  configs: Array<{ config: Partial<EnterpriseConfig>; source: ConfigSourceType; sourcePath?: string }>,
  options?: Partial<MergeOptions>
): MergeResult {
  const merger = new ConfigMerger(options);

  for (const { config, source, sourcePath } of configs) {
    merger.addConfig(config, source, sourcePath);
  }

  return merger.merge();
}

export default ConfigMerger;
