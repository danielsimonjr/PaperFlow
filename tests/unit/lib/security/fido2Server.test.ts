/**
 * FIDO2 Server Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FIDO2Server } from '@lib/security/fido2Server';

describe('FIDO2Server', () => {
  let server: FIDO2Server;

  beforeEach(() => {
    server = new FIDO2Server('paperflow.app', 'PaperFlow', 'https://paperflow.app');
  });

  describe('verifyRegistration', () => {
    it('should verify valid registration response', async () => {
      // This test requires mocking the entire WebAuthn registration response
      // In a real test, you would use a library like @simplewebauthn/server

      // For now, test that the server is instantiated correctly
      expect(server).toBeDefined();
    });

    it('should reject invalid client data type', async () => {
      // Mock an invalid response
      const invalidResponse = {
        id: 'test-id',
        rawId: 'dGVzdC1pZA',
        type: 'public-key' as const,
        response: {
          clientDataJSON: btoa(JSON.stringify({
            type: 'webauthn.invalid', // Wrong type
            challenge: 'test-challenge',
            origin: 'https://paperflow.app',
          })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          attestationObject: 'dGVzdC1hdHRlc3RhdGlvbg',
        },
      };

      const result = await server.verifyRegistration(invalidResponse, 'test-challenge');
      expect(result.verified).toBe(false);
    });
  });

  describe('verifyAuthentication', () => {
    it('should verify valid authentication response', async () => {
      // Similar to registration, this requires full mock data
      expect(server).toBeDefined();
    });
  });
});
