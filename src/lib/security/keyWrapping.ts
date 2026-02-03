/**
 * Key Wrapping
 *
 * Secure key wrapping utilities for protecting encryption keys.
 */

/**
 * Key wrapping algorithm
 */
const WRAP_ALGORITHM = 'AES-KW';
const WRAP_KEY_LENGTH = 256;

/**
 * Key derivation parameters
 */
const KDF_ALGORITHM = 'PBKDF2';
const KDF_ITERATIONS = 100000;
const KDF_HASH = 'SHA-256';
const SALT_LENGTH = 32;

/**
 * Wrapped key bundle
 */
export interface WrappedKeyBundle {
  /** The wrapped key material */
  wrappedKey: ArrayBuffer;
  /** Salt used for KDF */
  salt: Uint8Array;
  /** Number of KDF iterations */
  iterations: number;
  /** Algorithm metadata */
  algorithm: {
    wrap: string;
    kdf: string;
    hash: string;
  };
}

/**
 * Key wrapping service
 */
export class KeyWrapping {
  /**
   * Derive a wrapping key from a password/secret
   */
  static async deriveWrappingKey(
    secret: ArrayBuffer,
    salt: Uint8Array,
    iterations: number = KDF_ITERATIONS
  ): Promise<CryptoKey> {
    // Import secret as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      secret,
      KDF_ALGORITHM,
      false,
      ['deriveKey']
    );

    // Derive wrapping key
    return crypto.subtle.deriveKey(
      {
        name: KDF_ALGORITHM,
        salt: new Uint8Array(salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength)) as unknown as BufferSource,
        iterations: iterations,
        hash: KDF_HASH,
      },
      keyMaterial,
      {
        name: WRAP_ALGORITHM,
        length: WRAP_KEY_LENGTH,
      },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  /**
   * Wrap a key with a wrapping key
   */
  static async wrapKey(
    keyToWrap: CryptoKey,
    wrappingKey: CryptoKey
  ): Promise<ArrayBuffer> {
    return crypto.subtle.wrapKey('raw', keyToWrap, wrappingKey, WRAP_ALGORITHM);
  }

  /**
   * Unwrap a key with a wrapping key
   */
  static async unwrapKey(
    wrappedKey: ArrayBuffer,
    wrappingKey: CryptoKey,
    unwrappedKeyAlgorithm: { name: string; length?: number },
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      wrappingKey,
      WRAP_ALGORITHM,
      unwrappedKeyAlgorithm,
      extractable,
      keyUsages
    );
  }

  /**
   * Create a wrapped key bundle from a key and secret
   */
  static async createWrappedKeyBundle(
    keyToWrap: CryptoKey,
    secret: ArrayBuffer
  ): Promise<WrappedKeyBundle> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const wrappingKey = await this.deriveWrappingKey(secret, salt);
    const wrappedKey = await this.wrapKey(keyToWrap, wrappingKey);

    return {
      wrappedKey,
      salt,
      iterations: KDF_ITERATIONS,
      algorithm: {
        wrap: WRAP_ALGORITHM,
        kdf: KDF_ALGORITHM,
        hash: KDF_HASH,
      },
    };
  }

  /**
   * Unwrap a key from a bundle
   */
  static async unwrapKeyFromBundle(
    bundle: WrappedKeyBundle,
    secret: ArrayBuffer,
    unwrappedKeyAlgorithm: { name: string; length?: number },
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    const wrappingKey = await this.deriveWrappingKey(
      secret,
      bundle.salt,
      bundle.iterations
    );

    return this.unwrapKey(
      bundle.wrappedKey,
      wrappingKey,
      unwrappedKeyAlgorithm,
      extractable,
      keyUsages
    );
  }

  /**
   * Re-wrap a key with a new secret
   */
  static async rewrapKey(
    bundle: WrappedKeyBundle,
    oldSecret: ArrayBuffer,
    newSecret: ArrayBuffer,
    keyAlgorithm: { name: string; length?: number },
    keyUsages: KeyUsage[]
  ): Promise<WrappedKeyBundle> {
    // Unwrap with old secret
    const key = await this.unwrapKeyFromBundle(
      bundle,
      oldSecret,
      keyAlgorithm,
      true, // extractable for re-wrapping
      keyUsages
    );

    // Wrap with new secret
    return this.createWrappedKeyBundle(key, newSecret);
  }

  /**
   * Verify that a secret can unwrap a bundle
   */
  static async verifySecret(
    bundle: WrappedKeyBundle,
    secret: ArrayBuffer,
    keyAlgorithm: { name: string; length?: number }
  ): Promise<boolean> {
    try {
      await this.unwrapKeyFromBundle(
        bundle,
        secret,
        keyAlgorithm,
        false,
        ['encrypt'] // Minimal usage for verification
      );
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Multi-key wrapping for distributing access
 */
export class MultiKeyWrapping {
  /**
   * Wrap a key for multiple secrets
   */
  static async wrapForMultiple(
    keyToWrap: CryptoKey,
    secrets: { id: string; secret: ArrayBuffer }[]
  ): Promise<Map<string, WrappedKeyBundle>> {
    const bundles = new Map<string, WrappedKeyBundle>();

    for (const { id, secret } of secrets) {
      const bundle = await KeyWrapping.createWrappedKeyBundle(keyToWrap, secret);
      bundles.set(id, bundle);
    }

    return bundles;
  }

  /**
   * Unwrap a key using any of the bundles
   */
  static async unwrapFromAny(
    bundles: Map<string, WrappedKeyBundle>,
    secretId: string,
    secret: ArrayBuffer,
    keyAlgorithm: { name: string; length?: number },
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    const bundle = bundles.get(secretId);

    if (!bundle) {
      throw new Error(`No bundle found for secret ID: ${secretId}`);
    }

    return KeyWrapping.unwrapKeyFromBundle(
      bundle,
      secret,
      keyAlgorithm,
      extractable,
      keyUsages
    );
  }

  /**
   * Add a new secret to existing bundles
   */
  static async addSecret(
    bundles: Map<string, WrappedKeyBundle>,
    existingSecretId: string,
    existingSecret: ArrayBuffer,
    newSecretId: string,
    newSecret: ArrayBuffer,
    keyAlgorithm: { name: string; length?: number },
    keyUsages: KeyUsage[]
  ): Promise<Map<string, WrappedKeyBundle>> {
    // Unwrap with existing secret
    const key = await this.unwrapFromAny(
      bundles,
      existingSecretId,
      existingSecret,
      keyAlgorithm,
      true, // extractable for re-wrapping
      keyUsages
    );

    // Create new bundle
    const newBundle = await KeyWrapping.createWrappedKeyBundle(key, newSecret);

    // Return updated map
    const newBundles = new Map(bundles);
    newBundles.set(newSecretId, newBundle);
    return newBundles;
  }

  /**
   * Remove a secret from bundles
   */
  static removeSecret(
    bundles: Map<string, WrappedKeyBundle>,
    secretId: string
  ): Map<string, WrappedKeyBundle> {
    if (bundles.size <= 1) {
      throw new Error('Cannot remove the last secret');
    }

    const newBundles = new Map(bundles);
    newBundles.delete(secretId);
    return newBundles;
  }
}

export default KeyWrapping;
