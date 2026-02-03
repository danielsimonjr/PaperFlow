/**
 * Environment Variable Expansion (Sprint 20)
 *
 * Expands environment variables in configuration values.
 */

/**
 * Expansion options
 */
export interface ExpansionOptions {
  /** Use process.env (Node.js) */
  useProcessEnv?: boolean;
  /** Custom environment variables */
  customEnv?: Record<string, string>;
  /** Log warnings for undefined variables */
  warnUndefined?: boolean;
  /** Throw on undefined variables without defaults */
  throwOnUndefined?: boolean;
  /** Prefix for PaperFlow-specific variables */
  prefix?: string;
}

/**
 * Expansion result
 */
export interface ExpansionResult {
  value: string;
  expanded: boolean;
  warnings: string[];
  variables: string[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: ExpansionOptions = {
  useProcessEnv: true,
  warnUndefined: true,
  throwOnUndefined: false,
  prefix: 'PAPERFLOW_',
};

/**
 * Environment variable pattern: ${VAR} or ${VAR:-default}
 */
const ENV_VAR_PATTERN = /\$\{([^}:]+)(?::-([^}]*))?\}/g;

/**
 * Environment expansion class
 */
export class EnvExpansion {
  private options: ExpansionOptions;
  private env: Record<string, string>;

  constructor(options: ExpansionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.env = this.buildEnvMap();
  }

  /**
   * Build environment variable map
   */
  private buildEnvMap(): Record<string, string> {
    const env: Record<string, string> = {};

    // Add process.env
    if (this.options.useProcessEnv && typeof process !== 'undefined' && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
    }

    // Add custom environment variables (override process.env)
    if (this.options.customEnv) {
      for (const [key, value] of Object.entries(this.options.customEnv)) {
        env[key] = value;
      }
    }

    return env;
  }

  /**
   * Expand environment variables in a string
   */
  expand(value: string): ExpansionResult {
    const warnings: string[] = [];
    const variables: string[] = [];
    let expanded = false;

    const result = value.replace(ENV_VAR_PATTERN, (match, varName, defaultValue) => {
      variables.push(varName);
      expanded = true;

      // Check for the variable
      let envValue = this.env[varName];

      // Try with prefix if not found
      if (envValue === undefined && this.options.prefix) {
        envValue = this.env[`${this.options.prefix}${varName}`];
      }

      // Use default if provided and variable not found
      if (envValue === undefined && defaultValue !== undefined) {
        envValue = defaultValue;
      }

      // Handle undefined
      if (envValue === undefined) {
        if (this.options.throwOnUndefined) {
          throw new Error(`Undefined environment variable: ${varName}`);
        }
        if (this.options.warnUndefined) {
          warnings.push(`Undefined environment variable: ${varName}`);
        }
        return match; // Keep original
      }

      // Recursively expand nested variables
      if (envValue.includes('${')) {
        const nested = this.expand(envValue);
        warnings.push(...nested.warnings);
        variables.push(...nested.variables);
        return nested.value;
      }

      return envValue;
    });

    return {
      value: result,
      expanded,
      warnings,
      variables,
    };
  }

  /**
   * Expand all string values in an object
   */
  expandObject(obj: unknown): { value: unknown; warnings: string[] } {
    const warnings: string[] = [];

    const expandValue = (val: unknown): unknown => {
      if (typeof val === 'string') {
        const result = this.expand(val);
        warnings.push(...result.warnings);
        return result.value;
      }

      if (Array.isArray(val)) {
        return val.map(expandValue);
      }

      if (val !== null && typeof val === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(val)) {
          result[key] = expandValue(value);
        }
        return result;
      }

      return val;
    };

    return {
      value: expandValue(obj),
      warnings,
    };
  }

  /**
   * Check if a string contains environment variables
   */
  hasVariables(value: string): boolean {
    return ENV_VAR_PATTERN.test(value);
  }

  /**
   * Extract variable names from a string
   */
  extractVariables(value: string): string[] {
    const variables: string[] = [];
    let match;

    const pattern = new RegExp(ENV_VAR_PATTERN.source, 'g');
    while ((match = pattern.exec(value)) !== null) {
      const varName = match[1];
      if (varName !== undefined) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * Get an environment variable value
   */
  get(name: string): string | undefined {
    return this.env[name] ?? this.env[`${this.options.prefix}${name}`];
  }

  /**
   * Set a custom environment variable
   */
  set(name: string, value: string): void {
    this.env[name] = value;
  }

  /**
   * Update custom environment variables
   */
  updateCustomEnv(env: Record<string, string>): void {
    for (const [key, value] of Object.entries(env)) {
      this.env[key] = value;
    }
  }

  /**
   * List all available variables
   */
  listVariables(): string[] {
    return Object.keys(this.env);
  }
}

/**
 * Create an environment expansion instance
 */
export function createEnvExpansion(options?: ExpansionOptions): EnvExpansion {
  return new EnvExpansion(options);
}

/**
 * Global expansion instance
 */
let globalExpansion: EnvExpansion | null = null;

/**
 * Get global expansion instance
 */
export function getGlobalExpansion(): EnvExpansion {
  if (!globalExpansion) {
    globalExpansion = new EnvExpansion();
  }
  return globalExpansion;
}

/**
 * Quick expand helper
 */
export function expandEnv(value: string, customEnv?: Record<string, string>): string {
  const expansion = customEnv ? new EnvExpansion({ customEnv }) : getGlobalExpansion();
  return expansion.expand(value).value;
}

/**
 * Expand all strings in a configuration object
 */
export function expandConfigEnv(
  config: Record<string, unknown>,
  customEnv?: Record<string, string>
): { config: Record<string, unknown>; warnings: string[] } {
  const expansion = customEnv ? new EnvExpansion({ customEnv }) : getGlobalExpansion();
  const result = expansion.expandObject(config);
  return {
    config: result.value as Record<string, unknown>,
    warnings: result.warnings,
  };
}

/**
 * Parse environment string like "KEY=value KEY2=value2"
 */
export function parseEnvString(envString: string): Record<string, string> {
  const env: Record<string, string> = {};
  const parts = envString.split(/\s+/);

  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex > 0) {
      const key = part.substring(0, eqIndex);
      let value = part.substring(eqIndex + 1);

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  }

  return env;
}

export default EnvExpansion;
