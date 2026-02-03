/**
 * WebAuthn Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isWebAuthnSupported,
  base64urlToBuffer,
  bufferToBase64url,
} from '@lib/security/webauthn';

describe('WebAuthn', () => {
  describe('base64url encoding', () => {
    it('should convert ArrayBuffer to base64url', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const result = bufferToBase64url(buffer);
      expect(result).toBe('SGVsbG8');
    });

    it('should convert base64url to ArrayBuffer', () => {
      const base64url = 'SGVsbG8';
      const result = base64urlToBuffer(base64url);
      const bytes = new Uint8Array(result);
      expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle URL-safe characters', () => {
      // base64url uses - and _ instead of + and /
      const original = new Uint8Array([251, 255, 190]).buffer;
      const encoded = bufferToBase64url(original);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');

      const decoded = base64urlToBuffer(encoded);
      expect(new Uint8Array(decoded)).toEqual(new Uint8Array(original));
    });

    it('should roundtrip encode/decode', () => {
      const original = crypto.getRandomValues(new Uint8Array(32)).buffer;
      const encoded = bufferToBase64url(original);
      const decoded = base64urlToBuffer(encoded);

      expect(new Uint8Array(decoded)).toEqual(new Uint8Array(original));
    });
  });

  describe('isWebAuthnSupported', () => {
    it('should check for PublicKeyCredential', () => {
      // In Node/test environment, WebAuthn is typically not available
      const result = isWebAuthnSupported();
      expect(typeof result).toBe('boolean');
    });
  });
});
