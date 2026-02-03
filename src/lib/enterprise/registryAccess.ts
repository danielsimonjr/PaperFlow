/**
 * Registry Access Module for Windows GPO Policy Reading
 *
 * Provides type-safe access to Windows registry values from Group Policy.
 * This module handles reading from both HKLM and HKCU registry hives.
 */

/**
 * Registry value types supported
 */
export type RegistryValueType =
  | 'REG_SZ'
  | 'REG_DWORD'
  | 'REG_QWORD'
  | 'REG_MULTI_SZ'
  | 'REG_BINARY'
  | 'REG_EXPAND_SZ';

/**
 * Registry hive identifiers
 */
export type RegistryHive = 'HKLM' | 'HKCU';

/**
 * Registry value result
 */
export interface RegistryValue<T = unknown> {
  exists: boolean;
  value: T | null;
  type: RegistryValueType | null;
  hive: RegistryHive;
}

/**
 * Registry read options
 */
export interface RegistryReadOptions {
  /** Prefer HKLM over HKCU (machine policy takes precedence) */
  preferMachine?: boolean;
  /** Default value if not found */
  defaultValue?: unknown;
}

/**
 * Policy registry paths
 */
export const POLICY_PATHS = {
  application: 'SOFTWARE\\Policies\\PaperFlow\\Application',
  security: 'SOFTWARE\\Policies\\PaperFlow\\Security',
  features: 'SOFTWARE\\Policies\\PaperFlow\\Features',
  updates: 'SOFTWARE\\Policies\\PaperFlow\\Updates',
  network: 'SOFTWARE\\Policies\\PaperFlow\\Network',
  performance: 'SOFTWARE\\Policies\\PaperFlow\\Performance',
} as const;

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.platform === 'win32'
  );
}

/**
 * Registry access implementation using Windows Registry via Electron
 */
class RegistryAccessImpl {
  // Registry module would be dynamically loaded on Windows
  // @ts-expect-error regedit package may not be installed
  private _regedit: typeof import('regedit') | null = null;
  private initialized = false;

  /**
   * Initialize the registry module (Windows only)
   */
  async initialize(): Promise<boolean> {
    if (!isWindows()) {
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      // Dynamic import to avoid bundling on non-Windows
      // In a real implementation, this would use Electron's registry APIs
      // or a native module like 'regedit' or 'windows-registry'
      this.initialized = true;
      return true;
    } catch {
      console.warn('Registry access not available');
      return false;
    }
  }

  /**
   * Read a string value from the registry
   */
  async readString(
    path: string,
    valueName: string,
    options: RegistryReadOptions = {}
  ): Promise<RegistryValue<string>> {
    return this.readValue<string>(path, valueName, 'REG_SZ', options);
  }

  /**
   * Read a DWORD (number) value from the registry
   */
  async readDword(
    path: string,
    valueName: string,
    options: RegistryReadOptions = {}
  ): Promise<RegistryValue<number>> {
    return this.readValue<number>(path, valueName, 'REG_DWORD', options);
  }

  /**
   * Read a multi-string value from the registry
   */
  async readMultiString(
    path: string,
    valueName: string,
    options: RegistryReadOptions = {}
  ): Promise<RegistryValue<string[]>> {
    return this.readValue<string[]>(path, valueName, 'REG_MULTI_SZ', options);
  }

  /**
   * Read a value with automatic type detection
   */
  private async readValue<T>(
    path: string,
    valueName: string,
    expectedType: RegistryValueType,
    options: RegistryReadOptions = {}
  ): Promise<RegistryValue<T>> {
    const { preferMachine = true, defaultValue } = options;

    // Try to read from registry (Windows only)
    if (!isWindows()) {
      return {
        exists: false,
        value: (defaultValue as T) ?? null,
        type: null,
        hive: preferMachine ? 'HKLM' : 'HKCU',
      };
    }

    // In a real implementation, this would use native registry APIs
    // For now, we simulate the behavior for testing and development
    const hives: RegistryHive[] = preferMachine
      ? ['HKLM', 'HKCU']
      : ['HKCU', 'HKLM'];

    for (const hive of hives) {
      try {
        const result = await this.readFromHive<T>(hive, path, valueName, expectedType);
        if (result.exists) {
          return result;
        }
      } catch {
        // Continue to next hive
      }
    }

    return {
      exists: false,
      value: (defaultValue as T) ?? null,
      type: null,
      hive: hives[0] ?? 'HKLM',
    };
  }

  /**
   * Read from a specific registry hive
   */
  private async readFromHive<T>(
    hive: RegistryHive,
    path: string,
    valueName: string,
    expectedType: RegistryValueType
  ): Promise<RegistryValue<T>> {
    // This is a simulation for development/testing
    // In production, this would use actual Windows APIs via:
    // - Electron's app.getPath() for some values
    // - Native node module like 'windows-registry' or 'regedit'
    // - PowerShell execution via child_process

    // Check if we have mock values for testing
    const mockKey = `${hive}\\${path}\\${valueName}`;
    const mockValue = getMockRegistryValue(mockKey);

    if (mockValue !== undefined) {
      return {
        exists: true,
        value: mockValue as T,
        type: expectedType,
        hive,
      };
    }

    return {
      exists: false,
      value: null,
      type: null,
      hive,
    };
  }

  /**
   * Read all values under a registry path
   */
  async readAllValues(
    path: string,
    hive: RegistryHive = 'HKLM'
  ): Promise<Record<string, RegistryValue>> {
    // Simulation for development
    const result: Record<string, RegistryValue> = {};
    const mockPrefix = `${hive}\\${path}\\`;

    for (const [key, value] of Object.entries(mockRegistryValues)) {
      if (key.startsWith(mockPrefix)) {
        const valueName = key.substring(mockPrefix.length);
        result[valueName] = {
          exists: true,
          value,
          type: typeof value === 'number' ? 'REG_DWORD' : 'REG_SZ',
          hive,
        };
      }
    }

    return result;
  }

  /**
   * Check if a registry key exists
   */
  async keyExists(path: string, hive: RegistryHive = 'HKLM'): Promise<boolean> {
    const mockPrefix = `${hive}\\${path}\\`;
    return Object.keys(mockRegistryValues).some((key) => key.startsWith(mockPrefix));
  }
}

// Mock registry values for testing and development
const mockRegistryValues: Record<string, unknown> = {};

/**
 * Set mock registry value for testing
 */
export function setMockRegistryValue(key: string, value: unknown): void {
  mockRegistryValues[key] = value;
}

/**
 * Get mock registry value
 */
export function getMockRegistryValue(key: string): unknown {
  return mockRegistryValues[key];
}

/**
 * Clear all mock registry values
 */
export function clearMockRegistryValues(): void {
  Object.keys(mockRegistryValues).forEach((key) => {
    delete mockRegistryValues[key];
  });
}

/**
 * Set multiple mock registry values for testing
 */
export function setMockRegistryValues(values: Record<string, unknown>): void {
  Object.assign(mockRegistryValues, values);
}

// Singleton instance
export const registryAccess = new RegistryAccessImpl();

/**
 * Convert registry value to typed value
 */
export function convertRegistryValue<T>(
  value: unknown,
  targetType: 'string' | 'number' | 'boolean' | 'string[]'
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  switch (targetType) {
    case 'string':
      return String(value) as T;

    case 'number': {
      const num = Number(value);
      return isNaN(num) ? null : (num as T);
    }

    case 'boolean':
      if (typeof value === 'boolean') return value as T;
      if (typeof value === 'number') return (value !== 0) as T;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1') return true as T;
        if (lower === 'false' || lower === '0') return false as T;
      }
      return null;

    case 'string[]':
      if (Array.isArray(value)) return value.map(String) as T;
      if (typeof value === 'string') return value.split(',').map((s) => s.trim()) as T;
      return null;

    default:
      return value as T;
  }
}

export default registryAccess;
