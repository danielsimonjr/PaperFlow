/**
 * Configuration Encryption (Sprint 20)
 *
 * Encrypts and decrypts sensitive configuration values.
 */

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /** Encryption algorithm */
  algorithm?: 'AES-256-GCM' | 'AES-128-GCM';
  /** Key derivation iterations */
  iterations?: number;
  /** Prefix for encrypted values */
  encryptedPrefix?: string;
}

/**
 * Encrypted value structure
 */
export interface EncryptedValue {
  /** Encrypted data (base64) */
  data: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  tag: string;
  /** Algorithm used */
  algorithm: string;
  /** Version */
  version: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: EncryptionOptions = {
  algorithm: 'AES-256-GCM',
  iterations: 100000,
  encryptedPrefix: 'ENC:',
};

/**
 * Configuration encryption class
 */
export class ConfigEncryption {
  private options: EncryptionOptions;
  private key: CryptoKey | null = null;

  constructor(options: EncryptionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize encryption with a password
   */
  async initWithPassword(password: string, salt?: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Generate or use provided salt
    const usedSalt = salt || crypto.getRandomValues(new Uint8Array(16));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey',
    ]);

    // Derive the actual encryption key
    const keyLength = this.options.algorithm === 'AES-256-GCM' ? 256 : 128;

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: usedSalt.buffer as ArrayBuffer,
        iterations: this.options.iterations || 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: keyLength },
      false,
      ['encrypt', 'decrypt']
    );

    return usedSalt;
  }

  /**
   * Initialize encryption with a raw key
   */
  async initWithKey(keyData: Uint8Array): Promise<void> {
    this.key = await crypto.subtle.importKey('raw', keyData.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
  }

  /**
   * Encrypt a string value
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption not initialized. Call initWithPassword or initWithKey first.');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, data);

    // Extract ciphertext and tag (last 16 bytes)
    const ciphertext = new Uint8Array(encrypted.slice(0, -16));
    const tag = new Uint8Array(encrypted.slice(-16));

    // Create encrypted value structure
    const encryptedValue: EncryptedValue = {
      data: this.arrayToBase64(ciphertext),
      iv: this.arrayToBase64(iv),
      tag: this.arrayToBase64(tag),
      algorithm: this.options.algorithm || 'AES-256-GCM',
      version: 1,
    };

    // Return as prefixed JSON string
    return `${this.options.encryptedPrefix}${JSON.stringify(encryptedValue)}`;
  }

  /**
   * Decrypt a string value
   */
  async decrypt(encrypted: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption not initialized. Call initWithPassword or initWithKey first.');
    }

    // Check for prefix
    const prefix = this.options.encryptedPrefix || 'ENC:';
    if (!encrypted.startsWith(prefix)) {
      throw new Error('Invalid encrypted value format');
    }

    // Parse JSON
    const jsonStr = encrypted.slice(prefix.length);
    const encryptedValue: EncryptedValue = JSON.parse(jsonStr);

    // Decode base64
    const ciphertext = this.base64ToArray(encryptedValue.data);
    const iv = this.base64ToArray(encryptedValue.iv);
    const tag = this.base64ToArray(encryptedValue.tag);

    // Combine ciphertext and tag for decryption
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, this.key, combined.buffer as ArrayBuffer);

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Check if a value is encrypted
   */
  isEncrypted(value: string): boolean {
    const prefix = this.options.encryptedPrefix || 'ENC:';
    return value.startsWith(prefix);
  }

  /**
   * Encrypt sensitive fields in a config object
   */
  async encryptSensitiveFields(
    config: Record<string, unknown>,
    sensitiveFields: string[]
  ): Promise<Record<string, unknown>> {
    const result = { ...config };

    for (const field of sensitiveFields) {
      const value = this.getNestedValue(result, field);
      if (typeof value === 'string' && !this.isEncrypted(value)) {
        const encrypted = await this.encrypt(value);
        this.setNestedValue(result, field, encrypted);
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive fields in a config object
   */
  async decryptSensitiveFields(
    config: Record<string, unknown>,
    sensitiveFields: string[]
  ): Promise<Record<string, unknown>> {
    const result = { ...config };

    for (const field of sensitiveFields) {
      const value = this.getNestedValue(result, field);
      if (typeof value === 'string' && this.isEncrypted(value)) {
        const decrypted = await this.decrypt(value);
        this.setNestedValue(result, field, decrypted);
      }
    }

    return result;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part !== undefined) {
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart !== undefined) {
      current[lastPart] = value;
    }
  }

  /**
   * Convert Uint8Array to base64
   */
  private arrayToBase64(array: Uint8Array): string {
    const binary = String.fromCharCode(...array);
    return btoa(binary);
  }

  /**
   * Convert base64 to Uint8Array
   */
  private base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }
}

/**
 * Create a config encryption instance
 */
export function createConfigEncryption(options?: EncryptionOptions): ConfigEncryption {
  return new ConfigEncryption(options);
}

/**
 * Default sensitive fields in configuration
 */
export const DEFAULT_SENSITIVE_FIELDS = [
  'network.proxyPassword',
  'security.encryptionKey',
  'license.key',
  'updates.apiKey',
  'kiosk.exitPin',
  'kiosk.adminPin',
];

/**
 * Quick encrypt helper
 */
export async function encryptValue(value: string, password: string): Promise<string> {
  const encryption = new ConfigEncryption();
  await encryption.initWithPassword(password);
  return encryption.encrypt(value);
}

/**
 * Quick decrypt helper
 */
export async function decryptValue(encrypted: string, password: string): Promise<string> {
  const encryption = new ConfigEncryption();
  await encryption.initWithPassword(password);
  return encryption.decrypt(encrypted);
}

export default ConfigEncryption;
