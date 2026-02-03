#!/usr/bin/env node
/**
 * Configuration Validation CLI (Sprint 20)
 *
 * Command-line tool to validate configuration files against schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseJSON, validateConfig } from '../src/lib/enterprise/configParser';

/**
 * CLI options
 */
interface CliOptions {
  file?: string;
  url?: string;
  format?: 'json' | 'yaml';
  verbose?: boolean;
  quiet?: boolean;
  output?: 'text' | 'json';
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  file: string;
  errors: Array<{ path: string; message: string }>;
  warnings: Array<{ path: string; message: string }>;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-f' || arg === '--file') {
      options.file = args[++i];
    } else if (arg === '-u' || arg === '--url') {
      options.url = args[++i];
    } else if (arg === '--format') {
      options.format = args[++i] as 'json' | 'yaml';
    } else if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '-q' || arg === '--quiet') {
      options.quiet = true;
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i] as 'text' | 'json';
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-') && !options.file) {
      options.file = arg;
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
PaperFlow Configuration Validator

Usage: validate-config [options] [file]

Options:
  -f, --file <path>     Path to configuration file
  -u, --url <url>       URL to remote configuration
  --format <format>     Force format (json or yaml)
  -v, --verbose         Show detailed output
  -q, --quiet           Only show errors
  -o, --output <type>   Output format (text or json)
  -h, --help            Show this help message

Examples:
  validate-config config.json
  validate-config --file /etc/paperflow/config.yaml
  validate-config --url https://config.example.com/paperflow.json
  validate-config --output json config.json

Exit codes:
  0 - Valid configuration
  1 - Invalid configuration or errors
  2 - File not found or read error
`);
}

/**
 * Read file content
 */
function readFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  return fs.readFileSync(absolutePath, 'utf-8');
}

/**
 * Fetch remote configuration
 */
async function fetchRemoteConfig(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Detect format from content or filename
 */
function detectFormat(content: string, filename?: string): 'json' | 'yaml' {
  if (filename) {
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      return 'yaml';
    }
    if (filename.endsWith('.json')) {
      return 'json';
    }
  }

  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }

  return 'yaml';
}

/**
 * Validate configuration content
 */
function validateContent(content: string, source: string, format: 'json' | 'yaml'): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    file: source,
    errors: [],
    warnings: [],
  };

  // Parse content
  if (format === 'json') {
    const parseResult = parseJSON(content);

    if (parseResult.error) {
      result.valid = false;
      result.errors.push({
        path: parseResult.errorLine ? `line ${parseResult.errorLine}` : 'root',
        message: parseResult.error,
      });
      return result;
    }

    if (parseResult.config) {
      const validationResult = validateConfig(parseResult.config);

      result.valid = validationResult.valid;
      result.errors = validationResult.errors;
      result.warnings = validationResult.warnings;
    }
  } else {
    // YAML - would need js-yaml library
    result.errors.push({
      path: 'root',
      message: 'YAML validation requires js-yaml library. Use JSON format or install js-yaml.',
    });
    result.valid = false;
  }

  return result;
}

/**
 * Format output
 */
function formatOutput(
  result: ValidationResult,
  options: CliOptions
): string {
  if (options.output === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  // File header
  lines.push(`Validating: ${result.file}`);
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  - [${error.path}] ${error.message}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0 && !options.quiet) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      lines.push(`  - [${warning.path}] ${warning.message}`);
    }
    lines.push('');
  }

  // Summary
  if (result.valid) {
    lines.push('Result: VALID');
  } else {
    lines.push('Result: INVALID');
  }

  return lines.join('\n');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.file && !options.url) {
    console.error('Error: No configuration file or URL specified');
    console.error('Use --help for usage information');
    process.exit(2);
  }

  try {
    let content: string;
    let source: string;

    if (options.url) {
      if (options.verbose) {
        console.log(`Fetching: ${options.url}`);
      }
      content = await fetchRemoteConfig(options.url);
      source = options.url;
    } else {
      if (options.verbose) {
        console.log(`Reading: ${options.file}`);
      }
      content = readFile(options.file!);
      source = options.file!;
    }

    const format = options.format || detectFormat(content, source);

    if (options.verbose) {
      console.log(`Format: ${format}`);
      console.log(`Size: ${content.length} bytes`);
      console.log('');
    }

    const result = validateContent(content, source, format);
    const output = formatOutput(result, options);

    console.log(output);

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(2);
  }
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(2);
});
