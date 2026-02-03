/**
 * macOS Preferences Access Module
 *
 * Provides access to macOS managed preferences (MCX) and standard user preferences.
 * This module reads from the PaperFlow preferences domain.
 */

/**
 * Preference source types
 */
export type PreferenceSource =
  | 'managed'      // /Library/Managed Preferences (MDM forced)
  | 'managed-user' // ~/Library/Managed Preferences (user MDM)
  | 'global'       // /Library/Preferences (system default)
  | 'user'         // ~/Library/Preferences (user preference)
  | 'default';     // Application default

/**
 * Preference value result
 */
export interface PreferenceValue<T = unknown> {
  exists: boolean;
  value: T | null;
  source: PreferenceSource;
  isManaged: boolean;
}

/**
 * PaperFlow preferences domain
 */
export const PREFERENCES_DOMAIN = 'com.paperflow.desktop';

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return typeof process !== 'undefined' && process.platform === 'darwin';
}

/**
 * Preferences access implementation for macOS
 */
class MacPreferencesImpl {
  private cachedPreferences: Map<string, PreferenceValue> = new Map();
  private initialized = false;

  /**
   * Initialize the preferences module (macOS only)
   */
  async initialize(): Promise<boolean> {
    if (!isMacOS()) {
      return false;
    }

    if (this.initialized) {
      return true;
    }

    try {
      // In a real implementation, this would:
      // 1. Use NSUserDefaults via Electron's native module
      // 2. Or use CFPreferences via node-objc
      // 3. Or read from plist files directly
      this.initialized = true;
      return true;
    } catch {
      console.warn('macOS preferences access not available');
      return false;
    }
  }

  /**
   * Read a string preference
   */
  async readString(key: string): Promise<PreferenceValue<string>> {
    return this.readPreference<string>(key, 'string');
  }

  /**
   * Read an integer preference
   */
  async readInteger(key: string): Promise<PreferenceValue<number>> {
    return this.readPreference<number>(key, 'integer');
  }

  /**
   * Read a float preference
   */
  async readFloat(key: string): Promise<PreferenceValue<number>> {
    return this.readPreference<number>(key, 'float');
  }

  /**
   * Read a boolean preference
   */
  async readBoolean(key: string): Promise<PreferenceValue<boolean>> {
    return this.readPreference<boolean>(key, 'boolean');
  }

  /**
   * Read an array preference
   */
  async readArray(key: string): Promise<PreferenceValue<string[]>> {
    return this.readPreference<string[]>(key, 'array');
  }

  /**
   * Read a dictionary preference
   */
  async readDictionary(key: string): Promise<PreferenceValue<Record<string, unknown>>> {
    return this.readPreference<Record<string, unknown>>(key, 'dictionary');
  }

  /**
   * Internal method to read preference with type coercion
   */
  private async readPreference<T>(
    key: string,
    type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'dictionary'
  ): Promise<PreferenceValue<T>> {
    if (!isMacOS()) {
      return {
        exists: false,
        value: null,
        source: 'default',
        isManaged: false,
      };
    }

    // Check cache first
    const cacheKey = `${key}:${type}`;
    if (this.cachedPreferences.has(cacheKey)) {
      return this.cachedPreferences.get(cacheKey) as PreferenceValue<T>;
    }

    // In a real implementation, this would check preference sources in order:
    // 1. Managed (forced by MDM)
    // 2. User preference
    // 3. Global (system-wide default)
    // 4. Application default

    // Check mock values for testing
    const mockValue = getMockPreferenceValue(key);

    if (mockValue !== undefined) {
      const result: PreferenceValue<T> = {
        exists: true,
        value: this.coerceType(mockValue.value, type) as T,
        source: mockValue.source || 'managed',
        isManaged: mockValue.source === 'managed' || mockValue.source === 'managed-user',
      };
      this.cachedPreferences.set(cacheKey, result as PreferenceValue);
      return result;
    }

    return {
      exists: false,
      value: null,
      source: 'default',
      isManaged: false,
    };
  }

  /**
   * Coerce value to expected type
   */
  private coerceType(
    value: unknown,
    type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'dictionary'
  ): unknown {
    switch (type) {
      case 'string':
        return String(value);
      case 'integer':
        return Math.round(Number(value));
      case 'float':
        return Number(value);
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'dictionary':
        return typeof value === 'object' && value !== null ? value : {};
      default:
        return value;
    }
  }

  /**
   * Check if a preference is managed (set by MDM)
   */
  async isManaged(key: string): Promise<boolean> {
    const result = await this.readPreference(key, 'string');
    return result.isManaged;
  }

  /**
   * Get all managed preferences
   */
  async getAllManagedPreferences(): Promise<Record<string, PreferenceValue>> {
    const result: Record<string, PreferenceValue> = {};

    // In a real implementation, this would enumerate all keys
    // from the managed preferences domain

    for (const [key, mock] of Object.entries(mockPreferences)) {
      if (mock.source === 'managed' || mock.source === 'managed-user') {
        result[key] = {
          exists: true,
          value: mock.value,
          source: mock.source,
          isManaged: true,
        };
      }
    }

    return result;
  }

  /**
   * Clear the preferences cache
   */
  clearCache(): void {
    this.cachedPreferences.clear();
  }

  /**
   * Refresh all preferences from disk
   */
  async refresh(): Promise<void> {
    this.clearCache();
    // In a real implementation, this would re-read all preferences
  }
}

// Mock preferences storage for testing
interface MockPreference {
  value: unknown;
  source: PreferenceSource;
}

const mockPreferences: Record<string, MockPreference> = {};

/**
 * Set mock preference value for testing
 */
export function setMockPreferenceValue(
  key: string,
  value: unknown,
  source: PreferenceSource = 'managed'
): void {
  mockPreferences[key] = { value, source };
}

/**
 * Get mock preference value
 */
export function getMockPreferenceValue(key: string): MockPreference | undefined {
  return mockPreferences[key];
}

/**
 * Clear all mock preferences
 */
export function clearMockPreferences(): void {
  Object.keys(mockPreferences).forEach((key) => {
    delete mockPreferences[key];
  });
}

/**
 * Set multiple mock preferences for testing
 */
export function setMockPreferences(
  prefs: Record<string, { value: unknown; source?: PreferenceSource }>
): void {
  for (const [key, pref] of Object.entries(prefs)) {
    mockPreferences[key] = {
      value: pref.value,
      source: pref.source || 'managed',
    };
  }
}

// Singleton instance
export const macPreferences = new MacPreferencesImpl();

export default macPreferences;
