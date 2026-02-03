/**
 * Hardware Authentication Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { HardwareEncryption } from '@lib/security/hardwareEncryption';
import { KeyWrapping, MultiKeyWrapping } from '@lib/security/keyWrapping';

describe('Hardware Encryption', () => {
  describe('Key generation', () => {
    it('should generate a data encryption key', async () => {
      const dek = await HardwareEncryption.generateDEK();
      expect(dek).toBeDefined();
      expect(dek.type).toBe('secret');
      expect(dek.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('Encryption and decryption', () => {
    it('should encrypt and decrypt data', async () => {
      const dek = await HardwareEncryption.generateDEK();
      const plaintext = new TextEncoder().encode('Hello, World!');

      const { ciphertext, iv } = await HardwareEncryption.encrypt(
        plaintext.buffer,
        dek
      );

      expect(ciphertext.byteLength).toBeGreaterThan(0);
      expect(iv.length).toBe(12);

      const decrypted = await HardwareEncryption.decrypt(ciphertext, iv, dek);
      const decryptedText = new TextDecoder().decode(decrypted);

      expect(decryptedText).toBe('Hello, World!');
    });

    it('should fail decryption with wrong key', async () => {
      const dek1 = await HardwareEncryption.generateDEK();
      const dek2 = await HardwareEncryption.generateDEK();
      const plaintext = new TextEncoder().encode('Secret message');

      const { ciphertext, iv } = await HardwareEncryption.encrypt(
        plaintext.buffer,
        dek1
      );

      await expect(
        HardwareEncryption.decrypt(ciphertext, iv, dek2)
      ).rejects.toThrow();
    });
  });
});

describe('Key Wrapping', () => {
  describe('Basic key wrapping', () => {
    it('should wrap and unwrap a key', async () => {
      // Generate a key to wrap
      const keyToWrap = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Create a secret
      const secret = crypto.getRandomValues(new Uint8Array(32)).buffer;

      // Wrap the key
      const bundle = await KeyWrapping.createWrappedKeyBundle(keyToWrap, secret);

      expect(bundle.wrappedKey).toBeDefined();
      expect(bundle.salt.length).toBe(32);
      expect(bundle.iterations).toBe(100000);

      // Unwrap the key
      const unwrappedKey = await KeyWrapping.unwrapKeyFromBundle(
        bundle,
        secret,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      expect(unwrappedKey).toBeDefined();
      expect(unwrappedKey.algorithm.name).toBe('AES-GCM');
    });

    it('should fail unwrapping with wrong secret', async () => {
      const keyToWrap = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );

      const secret1 = crypto.getRandomValues(new Uint8Array(32)).buffer;
      const secret2 = crypto.getRandomValues(new Uint8Array(32)).buffer;

      const bundle = await KeyWrapping.createWrappedKeyBundle(keyToWrap, secret1);

      await expect(
        KeyWrapping.unwrapKeyFromBundle(
          bundle,
          secret2,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        )
      ).rejects.toThrow();
    });
  });

  describe('Secret verification', () => {
    it('should verify correct secret', async () => {
      const keyToWrap = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );

      const secret = crypto.getRandomValues(new Uint8Array(32)).buffer;
      const bundle = await KeyWrapping.createWrappedKeyBundle(keyToWrap, secret);

      const isValid = await KeyWrapping.verifySecret(
        bundle,
        secret,
        { name: 'AES-GCM', length: 256 }
      );

      expect(isValid).toBe(true);
    });

    it('should reject incorrect secret', async () => {
      const keyToWrap = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );

      const secret = crypto.getRandomValues(new Uint8Array(32)).buffer;
      const wrongSecret = crypto.getRandomValues(new Uint8Array(32)).buffer;
      const bundle = await KeyWrapping.createWrappedKeyBundle(keyToWrap, secret);

      const isValid = await KeyWrapping.verifySecret(
        bundle,
        wrongSecret,
        { name: 'AES-GCM', length: 256 }
      );

      expect(isValid).toBe(false);
    });
  });
});

describe('Multi-Key Wrapping', () => {
  it('should wrap key for multiple secrets', async () => {
    const keyToWrap = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const secrets = [
      { id: 'key-1', secret: crypto.getRandomValues(new Uint8Array(32)).buffer },
      { id: 'key-2', secret: crypto.getRandomValues(new Uint8Array(32)).buffer },
    ];

    const bundles = await MultiKeyWrapping.wrapForMultiple(keyToWrap, secrets);

    expect(bundles.size).toBe(2);
    expect(bundles.has('key-1')).toBe(true);
    expect(bundles.has('key-2')).toBe(true);
  });

  it('should unwrap with any of the secrets', async () => {
    const keyToWrap = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const secrets = [
      { id: 'key-1', secret: crypto.getRandomValues(new Uint8Array(32)).buffer },
      { id: 'key-2', secret: crypto.getRandomValues(new Uint8Array(32)).buffer },
    ];

    const bundles = await MultiKeyWrapping.wrapForMultiple(keyToWrap, secrets);

    // Should work with key-1
    const unwrapped1 = await MultiKeyWrapping.unwrapFromAny(
      bundles,
      'key-1',
      secrets[0].secret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    expect(unwrapped1).toBeDefined();

    // Should work with key-2
    const unwrapped2 = await MultiKeyWrapping.unwrapFromAny(
      bundles,
      'key-2',
      secrets[1].secret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    expect(unwrapped2).toBeDefined();
  });
});
