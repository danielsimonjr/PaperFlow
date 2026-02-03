#!/usr/bin/env node
/**
 * Configuration Schema Check CLI (Sprint 20)
 *
 * Command-line tool to check configuration against JSON schema.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Schema check options
 */
interface CheckOptions {
  config?: string;
  schema?: string;
  verbose?: boolean;
  format?: 'text' | 'json';
}

/**
 * Schema check result
 */
interface CheckResult {
  valid: boolean;
  configFile: string;
  schemaFile: string;
  errors: SchemaError[];
  coverage: {
    total: number;
    matched: number;
    missing: string[];
    extra: string[];
  };
}

/**
 * Schema error
 */
interface SchemaError {
  path: string;
  message: string;
  expected?: string;
  actual?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CheckOptions {
  const options: CheckOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-c' || arg === '--config') {
      options.config = args[++i];
    } else if (arg === '-s' || arg === '--schema') {
      options.schema = args[++i];
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-f' || arg === '--format') {
      options.format = args[++i] as 'text' | 'json';
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      if (!options.config) {
        options.config = arg;
      } else if (!options.schema) {
        options.schema = arg;
      }
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
PaperFlow Configuration Schema Check

Usage: config-schema-check [options] <config-file> [schema-file]

Options:
  -c, --config <path>   Path to configuration file
  -s, --schema <path>   Path to JSON schema file
  -v, --verbose         Show detailed output
  -f, --format <type>   Output format (text or json)
  -h, --help            Show this help message

If schema is not specified, uses the built-in schema from:
  enterprise/config/config-schema.json

Examples:
  config-schema-check config.json
  config-schema-check -c config.json -s custom-schema.json
  config-schema-check --verbose config.json

Exit codes:
  0 - Configuration matches schema
  1 - Configuration does not match schema
  2 - File not found or read error
`);
}

/**
 * Read and parse JSON file
 */
function readJsonFile(filePath: string): unknown {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${absolutePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all paths from an object
 */
function getAllPaths(obj: unknown, prefix = ''): string[] {
  const paths: string[] = [];

  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(currentPath);

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...getAllPaths(value, currentPath));
      }
    }
  }

  return paths;
}

/**
 * Get schema paths from JSON schema
 */
function getSchemaPropertyPaths(schema: unknown, prefix = ''): string[] {
  const paths: string[] = [];

  if (schema !== null && typeof schema === 'object') {
    const schemaObj = schema as Record<string, unknown>;

    if (schemaObj.properties && typeof schemaObj.properties === 'object') {
      for (const [key, propSchema] of Object.entries(schemaObj.properties)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);

        if (propSchema && typeof propSchema === 'object') {
          paths.push(...getSchemaPropertyPaths(propSchema, currentPath));
        }
      }
    }
  }

  return paths;
}

/**
 * Basic schema validation
 */
function validateAgainstSchema(
  config: unknown,
  schema: unknown,
  configPath: string,
  schemaPath: string
): CheckResult {
  const errors: SchemaError[] = [];
  const configPaths = getAllPaths(config);
  const schemaPaths = getSchemaPropertyPaths(schema);

  // Find missing paths (in schema but not in config)
  const missing = schemaPaths.filter((p) => !configPaths.includes(p));

  // Find extra paths (in config but not in schema)
  const extra = configPaths.filter((p) => !schemaPaths.includes(p));

  // Basic type checking
  validateTypes(config, schema, '', errors);

  return {
    valid: errors.length === 0,
    configFile: configPath,
    schemaFile: schemaPath,
    errors,
    coverage: {
      total: schemaPaths.length,
      matched: schemaPaths.filter((p) => configPaths.includes(p)).length,
      missing,
      extra,
    },
  };
}

/**
 * Validate types recursively
 */
function validateTypes(
  value: unknown,
  schema: unknown,
  path: string,
  errors: SchemaError[]
): void {
  if (schema === null || typeof schema !== 'object') {
    return;
  }

  const schemaObj = schema as Record<string, unknown>;
  const schemaType = schemaObj.type as string;

  if (schemaType) {
    const actualType = getType(value);

    if (schemaType !== actualType && value !== undefined && value !== null) {
      // Allow integer as number
      if (!(schemaType === 'integer' && actualType === 'number' && Number.isInteger(value))) {
        errors.push({
          path: path || 'root',
          message: `Type mismatch`,
          expected: schemaType,
          actual: actualType,
        });
      }
    }
  }

  // Check enum
  if (schemaObj.enum && Array.isArray(schemaObj.enum)) {
    if (!schemaObj.enum.includes(value)) {
      errors.push({
        path: path || 'root',
        message: `Value not in enum`,
        expected: schemaObj.enum.join(', '),
        actual: String(value),
      });
    }
  }

  // Check minimum/maximum
  if (typeof value === 'number') {
    if (typeof schemaObj.minimum === 'number' && value < schemaObj.minimum) {
      errors.push({
        path: path || 'root',
        message: `Value below minimum`,
        expected: `>= ${schemaObj.minimum}`,
        actual: String(value),
      });
    }
    if (typeof schemaObj.maximum === 'number' && value > schemaObj.maximum) {
      errors.push({
        path: path || 'root',
        message: `Value above maximum`,
        expected: `<= ${schemaObj.maximum}`,
        actual: String(value),
      });
    }
  }

  // Recurse into properties
  if (schemaObj.properties && value !== null && typeof value === 'object') {
    const valueObj = value as Record<string, unknown>;
    const properties = schemaObj.properties as Record<string, unknown>;

    for (const [key, propSchema] of Object.entries(properties)) {
      const propPath = path ? `${path}.${key}` : key;
      validateTypes(valueObj[key], propSchema, propPath, errors);
    }
  }
}

/**
 * Get JSON type of value
 */
function getType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Format output
 */
function formatOutput(result: CheckResult, options: CheckOptions): string {
  if (options.format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  lines.push('Schema Check Results');
  lines.push('====================');
  lines.push(`Config: ${result.configFile}`);
  lines.push(`Schema: ${result.schemaFile}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  - [${error.path}] ${error.message}`);
      if (error.expected) {
        lines.push(`    Expected: ${error.expected}`);
      }
      if (error.actual) {
        lines.push(`    Actual: ${error.actual}`);
      }
    }
    lines.push('');
  }

  if (options.verbose) {
    lines.push('Coverage:');
    lines.push(`  Total schema properties: ${result.coverage.total}`);
    lines.push(`  Matched in config: ${result.coverage.matched}`);
    lines.push(
      `  Coverage: ${((result.coverage.matched / result.coverage.total) * 100).toFixed(1)}%`
    );
    lines.push('');

    if (result.coverage.missing.length > 0) {
      lines.push(`Missing from config (${result.coverage.missing.length}):`);
      for (const p of result.coverage.missing.slice(0, 10)) {
        lines.push(`  - ${p}`);
      }
      if (result.coverage.missing.length > 10) {
        lines.push(`  ... and ${result.coverage.missing.length - 10} more`);
      }
      lines.push('');
    }

    if (result.coverage.extra.length > 0) {
      lines.push(`Extra in config (${result.coverage.extra.length}):`);
      for (const p of result.coverage.extra.slice(0, 10)) {
        lines.push(`  - ${p}`);
      }
      if (result.coverage.extra.length > 10) {
        lines.push(`  ... and ${result.coverage.extra.length - 10} more`);
      }
      lines.push('');
    }
  }

  lines.push(`Result: ${result.valid ? 'VALID' : 'INVALID'}`);

  return lines.join('\n');
}

/**
 * Main function
 */
function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.config) {
    console.error('Error: No configuration file specified');
    console.error('Use --help for usage information');
    process.exit(2);
  }

  // Default schema path
  const defaultSchemaPath = path.join(
    __dirname,
    '..',
    'enterprise',
    'config',
    'config-schema.json'
  );

  const schemaPath = options.schema || defaultSchemaPath;

  try {
    if (options.verbose) {
      console.log(`Reading config: ${options.config}`);
      console.log(`Reading schema: ${schemaPath}`);
      console.log('');
    }

    const config = readJsonFile(options.config);
    const schema = readJsonFile(schemaPath);

    const result = validateAgainstSchema(config, schema, options.config, schemaPath);
    const output = formatOutput(result, options);

    console.log(output);

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(2);
  }
}

// Run main
main();
