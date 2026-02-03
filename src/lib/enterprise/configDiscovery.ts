/**
 * Configuration Discovery (Sprint 20)
 *
 * Discovers configuration files from standard locations and environment.
 */

import { loadJsonFile } from './jsonConfigLoader';
import { loadYamlFile, isYamlContent } from './yamlConfigLoader';
import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * Configuration source
 */
export interface ConfigSource {
  path: string;
  type: 'json' | 'yaml' | 'auto';
  priority: number;
  required: boolean;
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
  found: DiscoveredConfig[];
  errors: DiscoveryError[];
}

/**
 * Discovered config
 */
export interface DiscoveredConfig {
  source: ConfigSource;
  config: EnterpriseConfig;
  loadedAt: number;
}

/**
 * Discovery error
 */
export interface DiscoveryError {
  source: ConfigSource;
  error: string;
}

/**
 * Discovery options
 */
export interface DiscoveryOptions {
  /** Additional search paths */
  additionalPaths?: string[];
  /** Environment variable for config path */
  envVar?: string;
  /** Command-line config path */
  commandLineConfig?: string;
  /** Skip default locations */
  skipDefaults?: boolean;
}

/**
 * Platform detection
 */
function getPlatform(): 'win32' | 'darwin' | 'linux' {
  if (typeof process !== 'undefined') {
    return process.platform as 'win32' | 'darwin' | 'linux';
  }
  // Browser detection fallback
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('win')) return 'win32';
  if (userAgent.includes('mac')) return 'darwin';
  return 'linux';
}

/**
 * Get home directory
 */
function getHomeDir(): string {
  if (typeof process !== 'undefined') {
    return process.env.HOME || process.env.USERPROFILE || '';
  }
  return '';
}

/**
 * Get default configuration paths based on platform
 */
export function getDefaultConfigPaths(): ConfigSource[] {
  const platform = getPlatform();
  const homeDir = getHomeDir();
  const sources: ConfigSource[] = [];

  // App directory (highest priority after CLI/env)
  sources.push({
    path: './paperflow.config.json',
    type: 'json',
    priority: 40,
    required: false,
  });

  sources.push({
    path: './paperflow.config.yaml',
    type: 'yaml',
    priority: 39,
    required: false,
  });

  sources.push({
    path: './.paperflowrc',
    type: 'auto',
    priority: 38,
    required: false,
  });

  // User config directory
  if (homeDir) {
    if (platform === 'win32') {
      sources.push({
        path: `${homeDir}\\AppData\\Local\\PaperFlow\\config.json`,
        type: 'json',
        priority: 30,
        required: false,
      });
      sources.push({
        path: `${homeDir}\\AppData\\Roaming\\PaperFlow\\config.json`,
        type: 'json',
        priority: 29,
        required: false,
      });
    } else if (platform === 'darwin') {
      sources.push({
        path: `${homeDir}/Library/Application Support/PaperFlow/config.json`,
        type: 'json',
        priority: 30,
        required: false,
      });
      sources.push({
        path: `${homeDir}/.config/paperflow/config.yaml`,
        type: 'yaml',
        priority: 29,
        required: false,
      });
    } else {
      sources.push({
        path: `${homeDir}/.config/paperflow/config.yaml`,
        type: 'yaml',
        priority: 30,
        required: false,
      });
      sources.push({
        path: `${homeDir}/.config/paperflow/config.json`,
        type: 'json',
        priority: 29,
        required: false,
      });
    }
  }

  // System-wide config (lowest priority)
  if (platform === 'win32') {
    sources.push({
      path: 'C:\\ProgramData\\PaperFlow\\config.json',
      type: 'json',
      priority: 10,
      required: false,
    });
  } else if (platform === 'darwin') {
    sources.push({
      path: '/Library/Application Support/PaperFlow/config.json',
      type: 'json',
      priority: 10,
      required: false,
    });
  } else {
    sources.push({
      path: '/etc/paperflow/config.yaml',
      type: 'yaml',
      priority: 10,
      required: false,
    });
    sources.push({
      path: '/etc/paperflow/config.json',
      type: 'json',
      priority: 9,
      required: false,
    });
  }

  // Sort by priority (descending)
  sources.sort((a, b) => b.priority - a.priority);

  return sources;
}

/**
 * Get config path from environment variable
 */
export function getEnvConfigPath(envVar = 'PAPERFLOW_CONFIG'): ConfigSource | null {
  if (typeof process !== 'undefined' && process.env[envVar]) {
    const path = process.env[envVar]!;
    const isYaml = path.endsWith('.yaml') || path.endsWith('.yml');

    return {
      path,
      type: isYaml ? 'yaml' : 'json',
      priority: 100,
      required: true, // Env-specified config should exist
    };
  }
  return null;
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && window.electron?.fileExists) {
      return await window.electron.fileExists(filePath);
    }

    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      return fs.existsSync(filePath);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Load a configuration file
 */
async function loadConfigFile(
  source: ConfigSource
): Promise<{ config: EnterpriseConfig | null; error?: string }> {
  try {
    // Determine file type for 'auto'
    let type = source.type;

    if (type === 'auto') {
      if (typeof window !== 'undefined' && window.electron?.readFile) {
        const result = await window.electron.readFile(source.path) as { success: boolean; data?: string; error?: string };
        if (result.success && result.data) {
          type = isYamlContent(result.data) ? 'yaml' : 'json';
        }
      } else if (typeof require !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        const content = fs.readFileSync(source.path, 'utf-8');
        type = isYamlContent(content) ? 'yaml' : 'json';
      }
    }

    // Load based on type
    if (type === 'yaml') {
      const result = await loadYamlFile(source.path);
      if (result.success && result.config) {
        return { config: result.config };
      }
      return {
        config: null,
        error: result.errors.map((e) => e.message).join('; '),
      };
    } else {
      const result = await loadJsonFile(source.path);
      if (result.success && result.config) {
        return { config: result.config };
      }
      return {
        config: null,
        error: result.errors.map((e) => e.message).join('; '),
      };
    }
  } catch (error) {
    return {
      config: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Discover configuration files
 */
export async function discoverConfigs(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
  const found: DiscoveredConfig[] = [];
  const errors: DiscoveryError[] = [];

  // Build list of sources to check
  const sources: ConfigSource[] = [];

  // Command-line config (highest priority)
  if (options.commandLineConfig) {
    const isYaml =
      options.commandLineConfig.endsWith('.yaml') || options.commandLineConfig.endsWith('.yml');
    sources.push({
      path: options.commandLineConfig,
      type: isYaml ? 'yaml' : 'json',
      priority: 1000,
      required: true,
    });
  }

  // Environment variable config
  const envSource = getEnvConfigPath(options.envVar);
  if (envSource) {
    sources.push(envSource);
  }

  // Additional paths
  if (options.additionalPaths) {
    for (let i = 0; i < options.additionalPaths.length; i++) {
      const additionalPath = options.additionalPaths[i];
      if (additionalPath) {
        const isYaml = additionalPath.endsWith('.yaml') || additionalPath.endsWith('.yml');
        sources.push({
          path: additionalPath,
          type: isYaml ? 'yaml' : 'json',
          priority: 90 - i,
          required: false,
        });
      }
    }
  }

  // Default locations
  if (!options.skipDefaults) {
    sources.push(...getDefaultConfigPaths());
  }

  // Sort by priority
  sources.sort((a, b) => b.priority - a.priority);

  // Check each source
  for (const source of sources) {
    const exists = await fileExists(source.path);

    if (!exists) {
      if (source.required) {
        errors.push({
          source,
          error: `Required configuration file not found: ${source.path}`,
        });
      }
      continue;
    }

    const result = await loadConfigFile(source);

    if (result.config) {
      found.push({
        source,
        config: result.config,
        loadedAt: Date.now(),
      });
    } else if (result.error) {
      errors.push({
        source,
        error: result.error,
      });
    }
  }

  return { found, errors };
}

/**
 * Find and load the first valid configuration
 */
export async function findConfig(options: DiscoveryOptions = {}): Promise<{
  config: EnterpriseConfig | null;
  source: string | null;
  errors: DiscoveryError[];
}> {
  const result = await discoverConfigs(options);

  const firstFound = result.found[0];
  if (result.found.length > 0 && firstFound) {
    return {
      config: firstFound.config,
      source: firstFound.source.path,
      errors: result.errors,
    };
  }

  return {
    config: null,
    source: null,
    errors: result.errors,
  };
}

export default discoverConfigs;
