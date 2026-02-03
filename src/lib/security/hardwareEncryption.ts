/**
 * Hardware Encryption
 *
 * Document encryption using hardware security keys for key wrapping.
 */

import { bufferToBase64url, base64urlToBuffer } from './webauthn';

/**
 * Encryption algorithm configuration
 */
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

/**
 * Encrypted document metadata
 */
export interface EncryptedDocument {
  /** Encrypted content */
  ciphertext: string;
  /** Initialization vector */
  iv: string;
  /** Wrapped encryption key (per hardware key) */
  wrappedKeys: WrappedKey[];
  /** Algorithm used */
  algorithm: string;
  /** Encryption timestamp */
  encryptedAt: string;
}

/**
 * Wrapped key for a specific hardware key
 */
export interface WrappedKey {
  /** Hardware key ID */
  keyId: string;
  /** Key name for display */
  keyName: string;
  /** Wrapped DEK (encrypted with KEK derived from hardware key) */
  wrappedDEK: string;
  /** Salt used for key derivation */
  salt: string;
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /** Hardware key IDs to encrypt for */
  keyIds: string[];
  /** Document metadata */
  metadata?: Record<string, string>;
}

/**
 * Hardware Encryption Service
 */
export class HardwareEncryption {
  /**
   * Generate a random data encryption key (DEK)
   */
  static async generateDEK(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a key encryption key (KEK) from a hardware key
   */
  static async deriveKEK(
    hardwareKeySecret: ArrayBuffer,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // Import the hardware key secret as base key material
    const baseKey = await crypto.subtle.importKey(
      'raw',
      hardwareKeySecret,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the KEK using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength)) as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-KW',
        length: KEY_LENGTH,
      },
      false,
      ['wrapKey', 'unwrapKey']
    );
  }

  /**
   * Wrap a DEK with a KEK
   */
  static async wrapKey(dek: CryptoKey, kek: CryptoKey): Promise<ArrayBuffer> {
    return crypto.subtle.wrapKey('raw', dek, kek, 'AES-KW');
  }

  /**
   * Unwrap a DEK with a KEK
   */
  static async unwrapKey(
    wrappedDEK: ArrayBuffer,
    kek: CryptoKey
  ): Promise<CryptoKey> {
    return crypto.subtle.unwrapKey(
      'raw',
      wrappedDEK,
      kek,
      'AES-KW',
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      false,
      ['decrypt']
    );
  }

  /**
   * Encrypt data with a DEK
   */
  static async encrypt(
    data: ArrayBuffer,
    dek: CryptoKey
  ): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      dek,
      data
    );

    return { ciphertext, iv };
  }

  /**
   * Decrypt data with a DEK
   */
  static async decrypt(
    ciphertext: ArrayBuffer,
    iv: Uint8Array,
    dek: CryptoKey
  ): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength)) as unknown as BufferSource,
        tagLength: TAG_LENGTH,
      },
      dek,
      ciphertext
    );
  }

  /**
   * Encrypt a document for multiple hardware keys
   */
  static async encryptDocument(
    data: ArrayBuffer,
    hardwareKeys: { id: string; name: string; secret: ArrayBuffer }[]
  ): Promise<EncryptedDocument> {
    if (hardwareKeys.length === 0) {
      throw new Error('At least one hardware key is required');
    }

    // Generate DEK
    const dek = await this.generateDEK();

    // Encrypt data
    const { ciphertext, iv } = await this.encrypt(data, dek);

    // Wrap DEK for each hardware key
    const wrappedKeys: WrappedKey[] = await Promise.all(
      hardwareKeys.map(async (key) => {
        const salt = crypto.getRandomValues(new Uint8Array(32));
        const kek = await this.deriveKEK(key.secret, salt);
        const wrappedDEK = await this.wrapKey(dek, kek);

        return {
          keyId: key.id,
          keyName: key.name,
          wrappedDEK: bufferToBase64url(wrappedDEK),
          salt: bufferToBase64url(salt.buffer),
        };
      })
    );

    return {
      ciphertext: bufferToBase64url(ciphertext),
      iv: bufferToBase64url(iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer),
      wrappedKeys,
      algorithm: ALGORITHM,
      encryptedAt: new Date().toISOString(),
    };
  }

  /**
   * Decrypt a document using a hardware key
   */
  static async decryptDocument(
    encryptedDoc: EncryptedDocument,
    hardwareKeyId: string,
    hardwareKeySecret: ArrayBuffer
  ): Promise<ArrayBuffer> {
    // Find the wrapped key for this hardware key
    const wrappedKey = encryptedDoc.wrappedKeys.find(
      (k) => k.keyId === hardwareKeyId
    );

    if (!wrappedKey) {
      throw new Error('Document was not encrypted for this hardware key');
    }

    // Derive KEK
    const salt = new Uint8Array(base64urlToBuffer(wrappedKey.salt));
    const kek = await this.deriveKEK(hardwareKeySecret, salt);

    // Unwrap DEK
    const wrappedDEKBuffer = base64urlToBuffer(wrappedKey.wrappedDEK);
    const dek = await this.unwrapKey(wrappedDEKBuffer, kek);

    // Decrypt data
    const ciphertext = base64urlToBuffer(encryptedDoc.ciphertext);
    const iv = new Uint8Array(base64urlToBuffer(encryptedDoc.iv));

    return this.decrypt(ciphertext, iv, dek);
  }

  /**
   * Add a hardware key to an encrypted document
   */
  static async addKeyToDocument(
    encryptedDoc: EncryptedDocument,
    existingKeyId: string,
    existingKeySecret: ArrayBuffer,
    newKey: { id: string; name: string; secret: ArrayBuffer }
  ): Promise<EncryptedDocument> {
    // First, decrypt to get the DEK
    const wrappedKey = encryptedDoc.wrappedKeys.find(
      (k) => k.keyId === existingKeyId
    );

    if (!wrappedKey) {
      throw new Error('Existing key not found');
    }

    // Derive existing KEK
    const existingSalt = new Uint8Array(base64urlToBuffer(wrappedKey.salt));
    const existingKEK = await this.deriveKEK(existingKeySecret, existingSalt);

    // Unwrap DEK
    const wrappedDEKBuffer = base64urlToBuffer(wrappedKey.wrappedDEK);
    const dek = await crypto.subtle.unwrapKey(
      'raw',
      wrappedDEKBuffer,
      existingKEK,
      'AES-KW',
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true, // extractable to allow re-wrapping
      ['encrypt', 'decrypt']
    );

    // Wrap DEK for new key
    const newSalt = crypto.getRandomValues(new Uint8Array(32));
    const newKEK = await this.deriveKEK(newKey.secret, newSalt);
    const newWrappedDEK = await this.wrapKey(dek, newKEK);

    // Add new wrapped key
    return {
      ...encryptedDoc,
      wrappedKeys: [
        ...encryptedDoc.wrappedKeys,
        {
          keyId: newKey.id,
          keyName: newKey.name,
          wrappedDEK: bufferToBase64url(newWrappedDEK),
          salt: bufferToBase64url(newSalt.buffer),
        },
      ],
    };
  }

  /**
   * Remove a hardware key from an encrypted document
   */
  static removeKeyFromDocument(
    encryptedDoc: EncryptedDocument,
    keyIdToRemove: string
  ): EncryptedDocument {
    if (encryptedDoc.wrappedKeys.length <= 1) {
      throw new Error('Cannot remove the last key');
    }

    return {
      ...encryptedDoc,
      wrappedKeys: encryptedDoc.wrappedKeys.filter(
        (k) => k.keyId !== keyIdToRemove
      ),
    };
  }

  /**
   * Check if a hardware key can decrypt a document
   */
  static canDecrypt(encryptedDoc: EncryptedDocument, keyId: string): boolean {
    return encryptedDoc.wrappedKeys.some((k) => k.keyId === keyId);
  }
}

export default HardwareEncryption;
