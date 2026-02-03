/**
 * JSON Configuration Loader (Sprint 20)
 *
 * Loads and parses JSON/JSONC configuration files with schema validation.
 */

import { parseJSON, validateConfig, mergeWithDefaults } from './configParser';
import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * JSON loader options
 */
export interface JsonLoaderOptions {
  /** Allow comments in JSON (JSONC) */
  allowComments?: boolean;
  /** Validate against schema */
  validate?: boolean;
  /** Merge with default values */
  mergeDefaults?: boolean;
  /** Strict mode - fail on unknown properties */
  strict?: boolean;
}

/**
 * Load result
 */
export interface JsonLoadResult {
  success: boolean;
  config: EnterpriseConfig | null;
  errors: LoadError[];
  warnings: LoadWarning[];
  source: string;
}

/**
 * Load error
 */
export interface LoadError {
  message: string;
  line?: number;
  column?: number;
  path?: string;
}

/**
 * Load warning
 */
export interface LoadWarning {
  message: string;
  path?: string;
}

/**
 * Default loader options
 */
const DEFAULT_OPTIONS: JsonLoaderOptions = {
  allowComments: true,
  validate: true,
  mergeDefaults: true,
  strict: false,
};

/**
 * Load configuration from JSON string
 */
export function loadJsonString(
  content: string,
  source: string,
  options: JsonLoaderOptions = {}
): JsonLoadResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: LoadError[] = [];
  const warnings: LoadWarning[] = [];

  // Parse JSON
  const parseResult = parseJSON(content);

  if (parseResult.error) {
    return {
      success: false,
      config: null,
      errors: [
        {
          message: parseResult.error,
        },
      ],
      warnings: [],
      source,
    };
  }

  let config = parseResult.config;

  // Validate if requested
  if (opts.validate && config) {
    const validationResult = validateConfig(config);

    if (!validationResult.valid) {
      for (const error of validationResult.errors) {
        errors.push({
          message: error.message,
          path: error.path,
        });
      }
    }

    for (const warning of validationResult.warnings) {
      warnings.push({
        message: warning.message,
        path: warning.path,
      });
    }

    if (!validationResult.valid) {
      return {
        success: false,
        config: null,
        errors,
        warnings,
        source,
      };
    }
  }

  // Merge with defaults if requested
  if (opts.mergeDefaults && config) {
    config = mergeWithDefaults(config);
  }

  return {
    success: true,
    config: config as EnterpriseConfig,
    errors,
    warnings,
    source,
  };
}

/**
 * Load configuration from file (Electron environment)
 */
export async function loadJsonFile(
  filePath: string,
  options: JsonLoaderOptions = {}
): Promise<JsonLoadResult> {
  try {
    // In Electron environment, use fs
    if (typeof window !== 'undefined' && window.electron?.readFile) {
      const result = await window.electron.readFile(filePath);

      if (!result.success || !result.data) {
        return {
          success: false,
          config: null,
          errors: [{ message: result.error || 'Failed to read file' }],
          warnings: [],
          source: filePath,
        };
      }

      const content = typeof result.data === 'string' ? result.data : result.data.toString('utf-8');
      return loadJsonString(content, filePath, options);
    }

    // In Node.js environment (for testing)
    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      return loadJsonString(content, filePath, options);
    }

    return {
      success: false,
      config: null,
      errors: [{ message: 'No file system access available' }],
      warnings: [],
      source: filePath,
    };
  } catch (error) {
    return {
      success: false,
      config: null,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown error reading file',
        },
      ],
      warnings: [],
      source: filePath,
    };
  }
}

/**
 * Check if content appears to be JSON
 */
export function isJsonContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Extract JSON from content with potential surrounding text
 */
export function extractJson(content: string): string | null {
  const trimmed = content.trim();

  // Find the start of JSON object
  const objectStart = trimmed.indexOf('{');
  const arrayStart = trimmed.indexOf('[');

  let start = -1;
  let isObject = false;

  if (objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart)) {
    start = objectStart;
    isObject = true;
  } else if (arrayStart >= 0) {
    start = arrayStart;
    isObject = false;
  }

  if (start < 0) {
    return null;
  }

  // Find the matching end bracket
  const openBracket = isObject ? '{' : '[';
  const closeBracket = isObject ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === openBracket) {
      depth++;
    } else if (char === closeBracket) {
      depth--;
      if (depth === 0) {
        return trimmed.substring(start, i + 1);
      }
    }
  }

  return null;
}

export default loadJsonFile;
