/**
 * Secrets Manager (Sprint 20)
 *
 * Manages sensitive configuration secrets using OS keychain/credential store.
 */

/**
 * Keychain API interface (for runtime check)
 */
interface KeychainAPI {
  getPassword: (service: string, account: string) => Promise<string | null>;
  setPassword: (service: string, account: string, password: string) => Promise<void>;
  deletePassword: (service: string, account: string) => Promise<boolean>;
  findCredentials?: (service: string) => Promise<Array<{ account: string; password: string }>>;
}

/**
 * Check if electron has keychain API
 */
function getKeychainAPI(): KeychainAPI | null {
  if (typeof window !== 'undefined' && window.electron) {
    const electron = window.electron as unknown as { keychain?: KeychainAPI };
    return electron.keychain || null;
  }
  return null;
}

/**
 * Secret entry
 */
export interface SecretEntry {
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, string>;
}

/**
 * Secrets manager options
 */
export interface SecretsManagerOptions {
  /** Service name for keychain */
  serviceName?: string;
  /** Account name prefix */
  accountPrefix?: string;
  /** Use in-memory fallback if keychain unavailable */
  fallbackToMemory?: boolean;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: SecretsManagerOptions = {
  serviceName: 'PaperFlow',
  accountPrefix: 'paperflow-secret-',
  fallbackToMemory: true,
};

/**
 * Secrets manager class
 */
export class SecretsManager {
  private options: SecretsManagerOptions;
  private memoryStore: Map<string, SecretEntry> = new Map();
  private keychainAvailable: boolean | null = null;

  constructor(options: SecretsManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Check if keychain is available
   */
  async isKeychainAvailable(): Promise<boolean> {
    if (this.keychainAvailable !== null) {
      return this.keychainAvailable;
    }

    // Check Electron keychain API
    const keychainAPI = getKeychainAPI();
    if (keychainAPI) {
      try {
        // Test with a dummy operation
        await keychainAPI.getPassword(this.options.serviceName!, '__test__');
        this.keychainAvailable = true;
        return true;
      } catch {
        this.keychainAvailable = false;
        return false;
      }
    }

    // Check Node.js keytar
    if (typeof require !== 'undefined') {
      try {
        require.resolve('keytar');
        this.keychainAvailable = true;
        return true;
      } catch {
        this.keychainAvailable = false;
        return false;
      }
    }

    this.keychainAvailable = false;
    return false;
  }

  /**
   * Get a secret
   */
  async get(key: string): Promise<string | null> {
    const accountName = `${this.options.accountPrefix}${key}`;

    // Try keychain first
    if (await this.isKeychainAvailable()) {
      try {
        // Electron API
        const keychainAPI = getKeychainAPI();
        if (keychainAPI) {
          const value = await keychainAPI.getPassword(
            this.options.serviceName!,
            accountName
          );
          return value;
        }

        // Node.js keytar
        if (typeof require !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const keytar = require('keytar');
          const value = await keytar.getPassword(this.options.serviceName, accountName);
          return value;
        }
      } catch {
        // Fall through to memory store
      }
    }

    // Memory fallback
    if (this.options.fallbackToMemory) {
      const entry = this.memoryStore.get(key);
      return entry?.value ?? null;
    }

    return null;
  }

  /**
   * Set a secret
   */
  async set(key: string, value: string, metadata?: Record<string, string>): Promise<boolean> {
    const accountName = `${this.options.accountPrefix}${key}`;
    const now = Date.now();

    // Try keychain first
    if (await this.isKeychainAvailable()) {
      try {
        // Electron API
        const keychainAPI = getKeychainAPI();
        if (keychainAPI) {
          await keychainAPI.setPassword(
            this.options.serviceName!,
            accountName,
            value
          );
          return true;
        }

        // Node.js keytar
        if (typeof require !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const keytar = require('keytar');
          await keytar.setPassword(this.options.serviceName, accountName, value);
          return true;
        }
      } catch {
        // Fall through to memory store
      }
    }

    // Memory fallback
    if (this.options.fallbackToMemory) {
      const existing = this.memoryStore.get(key);
      this.memoryStore.set(key, {
        key,
        value,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        metadata,
      });
      return true;
    }

    return false;
  }

  /**
   * Delete a secret
   */
  async delete(key: string): Promise<boolean> {
    const accountName = `${this.options.accountPrefix}${key}`;

    // Try keychain first
    if (await this.isKeychainAvailable()) {
      try {
        // Electron API
        const keychainAPI = getKeychainAPI();
        if (keychainAPI) {
          await keychainAPI.deletePassword(
            this.options.serviceName!,
            accountName
          );
          return true;
        }

        // Node.js keytar
        if (typeof require !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const keytar = require('keytar');
          const deleted = await keytar.deletePassword(this.options.serviceName, accountName);
          return deleted;
        }
      } catch {
        // Fall through to memory store
      }
    }

    // Memory fallback
    if (this.options.fallbackToMemory) {
      return this.memoryStore.delete(key);
    }

    return false;
  }

  /**
   * Check if a secret exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * List all secret keys
   */
  async listKeys(): Promise<string[]> {
    // Try keychain first
    if (await this.isKeychainAvailable()) {
      try {
        // Electron API
        const keychainAPI = getKeychainAPI();
        if (keychainAPI?.findCredentials) {
          const credentials = await keychainAPI.findCredentials(
            this.options.serviceName!
          );
          return credentials
            .map((c: { account: string }) => c.account)
            .filter((a: string) => a.startsWith(this.options.accountPrefix!))
            .map((a: string) => a.slice(this.options.accountPrefix!.length));
        }

        // Node.js keytar
        if (typeof require !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const keytar = require('keytar');
          const credentials = await keytar.findCredentials(this.options.serviceName);
          return credentials
            .map((c: { account: string }) => c.account)
            .filter((a: string) => a.startsWith(this.options.accountPrefix!))
            .map((a: string) => a.slice(this.options.accountPrefix!.length));
        }
      } catch {
        // Fall through to memory store
      }
    }

    // Memory fallback
    if (this.options.fallbackToMemory) {
      return Array.from(this.memoryStore.keys());
    }

    return [];
  }

  /**
   * Clear all secrets
   */
  async clear(): Promise<void> {
    const keys = await this.listKeys();

    for (const key of keys) {
      await this.delete(key);
    }

    // Clear memory store
    this.memoryStore.clear();
  }

  /**
   * Get multiple secrets
   */
  async getMany(keys: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    for (const key of keys) {
      result.set(key, await this.get(key));
    }

    return result;
  }

  /**
   * Set multiple secrets
   */
  async setMany(secrets: Record<string, string>): Promise<boolean> {
    let allSuccess = true;

    for (const [key, value] of Object.entries(secrets)) {
      const success = await this.set(key, value);
      if (!success) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * Export secrets (for backup - handle with care!)
   */
  async exportSecrets(): Promise<Record<string, string>> {
    const keys = await this.listKeys();
    const result: Record<string, string> = {};

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Import secrets
   */
  async importSecrets(secrets: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(secrets)) {
      await this.set(key, value);
    }
  }
}

/**
 * Create a secrets manager
 */
export function createSecretsManager(options?: SecretsManagerOptions): SecretsManager {
  return new SecretsManager(options);
}

/**
 * Global secrets manager instance
 */
let globalSecretsManager: SecretsManager | null = null;

/**
 * Get global secrets manager
 */
export function getGlobalSecretsManager(): SecretsManager {
  if (!globalSecretsManager) {
    globalSecretsManager = new SecretsManager();
  }
  return globalSecretsManager;
}

/**
 * Well-known secret keys
 */
export const SECRET_KEYS = {
  ENCRYPTION_KEY: 'encryption-key',
  LICENSE_KEY: 'license-key',
  PROXY_PASSWORD: 'proxy-password',
  API_KEY: 'api-key',
  KIOSK_PIN: 'kiosk-pin',
  ADMIN_PIN: 'admin-pin',
  UPDATE_SERVER_KEY: 'update-server-key',
  SYNC_TOKEN: 'sync-token',
} as const;

export type SecretKey = (typeof SECRET_KEYS)[keyof typeof SECRET_KEYS];

export default SecretsManager;
