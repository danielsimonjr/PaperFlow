/**
 * YAML Configuration Loader (Sprint 20)
 *
 * Loads and parses YAML configuration files with schema validation.
 */

import { validateConfig, mergeWithDefaults } from './configParser';
import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * YAML loader options
 */
export interface YamlLoaderOptions {
  /** Validate against schema */
  validate?: boolean;
  /** Merge with default values */
  mergeDefaults?: boolean;
  /** Allow multi-document YAML */
  multiDocument?: boolean;
  /** Strict mode - fail on unknown properties */
  strict?: boolean;
}

/**
 * Load result
 */
export interface YamlLoadResult {
  success: boolean;
  config: EnterpriseConfig | null;
  configs?: EnterpriseConfig[]; // For multi-document YAML
  errors: YamlLoadError[];
  warnings: YamlLoadWarning[];
  source: string;
}

/**
 * Load error
 */
export interface YamlLoadError {
  message: string;
  line?: number;
  column?: number;
  path?: string;
}

/**
 * Load warning
 */
export interface YamlLoadWarning {
  message: string;
  path?: string;
}

/**
 * Default loader options
 */
const DEFAULT_OPTIONS: YamlLoaderOptions = {
  validate: true,
  mergeDefaults: true,
  multiDocument: false,
  strict: false,
};

/**
 * Simple YAML parser (basic implementation)
 * For full YAML support, use js-yaml library
 */
function parseYaml(content: string): { data: unknown; error?: string } {
  try {
    // Try to use js-yaml if available
    if (typeof require !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const yaml = require('js-yaml');
        const data = yaml.load(content);
        return { data };
      } catch {
        // Fall through to basic parser
      }
    }

    // Basic YAML-like parser for simple cases
    return parseBasicYaml(content);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown YAML parse error',
    };
  }
}

/**
 * Basic YAML parser for simple cases
 */
function parseBasicYaml(content: string): { data: unknown; error?: string } {
  const lines = content.split('\n');
  const result: Record<string, unknown> = {};
  const stack: { indent: number; obj: Record<string, unknown>; key: string }[] = [];
  let currentObj = result;
  let currentIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Calculate indent
    const indent = line.search(/\S/);

    // Handle indent changes
    if (indent < currentIndent) {
      // Go back up the stack
      const stackTop = stack[stack.length - 1];
      while (stack.length > 0 && stackTop && stackTop.indent >= indent) {
        stack.pop();
      }
      const newTop = stack[stack.length - 1];
      currentObj = stack.length > 0 && newTop ? newTop.obj : result;
      currentIndent = indent;
    }

    // Parse key-value or key-object
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue; // Skip invalid lines
    }

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (value === '' || value === '|' || value === '>') {
      // Nested object or multiline string
      const newObj: Record<string, unknown> = {};
      currentObj[key] = newObj;
      stack.push({ indent: currentIndent, obj: currentObj, key });
      currentObj = newObj;
      currentIndent = indent + 2; // Assume 2-space indent
    } else {
      // Simple value
      currentObj[key] = parseYamlValue(value);
    }
  }

  return { data: result };
}

/**
 * Parse a YAML value
 */
function parseYamlValue(value: string): unknown {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true' || value === 'True' || value === 'TRUE') return true;
  if (value === 'false' || value === 'False' || value === 'FALSE') return false;

  // Null
  if (value === 'null' || value === 'Null' || value === 'NULL' || value === '~') return null;

  // Number
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Array (inline)
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // Object (inline)
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

/**
 * Parse multi-document YAML
 */
function parseMultiDocYaml(content: string): { documents: unknown[]; errors: YamlLoadError[] } {
  const documents: unknown[] = [];
  const errors: YamlLoadError[] = [];

  // Split by document separator
  const docs = content.split(/^---$/m);

  for (let i = 0; i < docs.length; i++) {
    const docContent = docs[i];
    if (!docContent) continue;
    const doc = docContent.trim();
    if (!doc) continue;

    const result = parseYaml(doc);
    if (result.error) {
      errors.push({
        message: `Document ${i + 1}: ${result.error}`,
      });
    } else {
      documents.push(result.data);
    }
  }

  return { documents, errors };
}

/**
 * Load configuration from YAML string
 */
export function loadYamlString(
  content: string,
  source: string,
  options: YamlLoaderOptions = {}
): YamlLoadResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: YamlLoadError[] = [];
  const warnings: YamlLoadWarning[] = [];

  // Handle multi-document YAML
  if (opts.multiDocument && content.includes('\n---\n')) {
    const multiResult = parseMultiDocYaml(content);

    if (multiResult.errors.length > 0) {
      return {
        success: false,
        config: null,
        configs: [],
        errors: multiResult.errors,
        warnings,
        source,
      };
    }

    const configs: EnterpriseConfig[] = [];

    for (const doc of multiResult.documents) {
      const docConfig = doc as Record<string, unknown>;

      // Validate if requested
      if (opts.validate) {
        const validationResult = validateConfig(docConfig);
        if (!validationResult.valid) {
          for (const error of validationResult.errors) {
            errors.push({ message: error.message, path: error.path });
          }
          continue;
        }
      }

      // Merge with defaults
      let finalConfig: EnterpriseConfig;
      if (opts.mergeDefaults) {
        finalConfig = mergeWithDefaults(docConfig as Partial<EnterpriseConfig>);
      } else {
        finalConfig = docConfig as EnterpriseConfig;
      }

      configs.push(finalConfig);
    }

    return {
      success: errors.length === 0,
      config: configs[0] || null,
      configs,
      errors,
      warnings,
      source,
    };
  }

  // Single document YAML
  const parseResult = parseYaml(content);

  if (parseResult.error) {
    return {
      success: false,
      config: null,
      errors: [{ message: parseResult.error }],
      warnings,
      source,
    };
  }

  const parsedConfig = parseResult.data as Record<string, unknown>;

  // Validate if requested
  if (opts.validate && parsedConfig) {
    const validationResult = validateConfig(parsedConfig);

    if (!validationResult.valid) {
      for (const error of validationResult.errors) {
        errors.push({ message: error.message, path: error.path });
      }
    }

    for (const warning of validationResult.warnings) {
      warnings.push({ message: warning.message, path: warning.path });
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

  // Merge with defaults
  let finalConfig: EnterpriseConfig;
  if (opts.mergeDefaults && parsedConfig) {
    finalConfig = mergeWithDefaults(parsedConfig as Partial<EnterpriseConfig>);
  } else {
    finalConfig = parsedConfig as EnterpriseConfig;
  }

  return {
    success: true,
    config: finalConfig,
    errors,
    warnings,
    source,
  };
}

/**
 * Load configuration from YAML file
 */
export async function loadYamlFile(
  filePath: string,
  options: YamlLoaderOptions = {}
): Promise<YamlLoadResult> {
  try {
    // In Electron environment
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
      return loadYamlString(content, filePath, options);
    }

    // In Node.js environment
    if (typeof require !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      return loadYamlString(content, filePath, options);
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
 * Check if content appears to be YAML
 */
export function isYamlContent(content: string): boolean {
  const trimmed = content.trim();

  // Check for JSON (not YAML)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return false;
  }

  // Check for YAML-like patterns
  return /^\w+:/m.test(trimmed) || trimmed.startsWith('---');
}

export default loadYamlFile;
