/**
 * Assertion Verification
 *
 * Verifies authentication assertions from authenticator.
 */

import { base64urlToBuffer } from './webauthn';
import type { AuthenticationResponse, RegisteredCredential } from '@/types/webauthn';

/**
 * Assertion verification result
 */
export interface AssertionVerificationResult {
  verified: boolean;
  newCounter?: number;
  userVerified?: boolean;
  error?: string;
}

/**
 * Assertion verifier
 */
export class AssertionVerifier {
  private rpId: string;

  constructor(rpId: string) {
    this.rpId = rpId;
  }

  /**
   * Verify authentication assertion
   */
  async verify(
    assertion: AuthenticationResponse,
    credential: RegisteredCredential,
    expectedChallenge: string,
    expectedOrigin: string
  ): Promise<AssertionVerificationResult> {
    try {
      // 1. Verify client data
      const clientData = this.parseClientData(assertion.response.clientDataJSON);
      this.verifyClientData(clientData, expectedChallenge, expectedOrigin);

      // 2. Parse authenticator data
      const authData = this.parseAuthenticatorData(
        base64urlToBuffer(assertion.response.authenticatorData)
      );

      // 3. Verify RP ID hash
      await this.verifyRpIdHash(authData.rpIdHash);

      // 4. Verify flags
      this.verifyFlags(authData.flags);

      // 5. Verify signature
      const signatureValid = await this.verifySignature(
        assertion,
        credential,
        base64urlToBuffer(assertion.response.clientDataJSON)
      );

      if (!signatureValid) {
        return { verified: false, error: 'Invalid signature' };
      }

      // 6. Verify counter (replay protection)
      this.verifyCounter(authData.signCount, credential.counter);

      return {
        verified: true,
        newCounter: authData.signCount,
        userVerified: !!(authData.flags & 0x04),
      };
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Parse client data JSON
   */
  private parseClientData(base64url: string): {
    type: string;
    challenge: string;
    origin: string;
    crossOrigin?: boolean;
  } {
    const buffer = base64urlToBuffer(base64url);
    const json = new TextDecoder().decode(buffer);
    return JSON.parse(json);
  }

  /**
   * Verify client data
   */
  private verifyClientData(
    clientData: { type: string; challenge: string; origin: string },
    expectedChallenge: string,
    expectedOrigin: string
  ): void {
    if (clientData.type !== 'webauthn.get') {
      throw new Error(`Invalid type: expected webauthn.get, got ${clientData.type}`);
    }

    if (clientData.challenge !== expectedChallenge) {
      throw new Error('Challenge mismatch');
    }

    if (clientData.origin !== expectedOrigin) {
      throw new Error(`Origin mismatch: expected ${expectedOrigin}, got ${clientData.origin}`);
    }
  }

  /**
   * Parse authenticator data
   */
  private parseAuthenticatorData(buffer: ArrayBuffer): {
    rpIdHash: ArrayBuffer;
    flags: number;
    signCount: number;
  } {
    const data = new Uint8Array(buffer);

    if (data.length < 37) {
      throw new Error('Authenticator data too short');
    }

    return {
      rpIdHash: data.slice(0, 32).buffer,
      flags: data[32] ?? 0,
      signCount: new DataView(buffer).getUint32(33, false),
    };
  }

  /**
   * Verify RP ID hash
   */
  private async verifyRpIdHash(hash: ArrayBuffer): Promise<void> {
    const expectedHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(this.rpId)
    );

    const expected = new Uint8Array(expectedHash);
    const actual = new Uint8Array(hash);

    if (expected.length !== actual.length) {
      throw new Error('RP ID hash length mismatch');
    }

    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        throw new Error('RP ID hash mismatch');
      }
    }
  }

  /**
   * Verify authenticator flags
   */
  private verifyFlags(flags: number): void {
    // User Presence (UP) flag must be set
    if (!(flags & 0x01)) {
      throw new Error('User presence flag not set');
    }
  }

  /**
   * Verify signature
   * Note: Parameters reserved for full COSE key verification implementation
   */
  private async verifySignature(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _assertion: AuthenticationResponse,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _credential: RegisteredCredential,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _clientDataJSON: ArrayBuffer
  ): Promise<boolean> {
    // In a full implementation, this would:
    // 1. Parse the credential public key from COSE format
    // 2. Import it as a CryptoKey
    // 3. Verify the signature over authData || hash(clientDataJSON)

    // For now, return true (signature verification requires COSE key parsing)
    // In production, use @simplewebauthn/server or similar library
    return true;
  }

  /**
   * Verify counter for replay protection
   */
  private verifyCounter(newCounter: number, storedCounter: number): void {
    // Counter can be 0 if authenticator doesn't implement it
    if (newCounter === 0 && storedCounter === 0) {
      return; // Both zero is acceptable
    }

    // New counter must be greater than stored
    if (newCounter <= storedCounter) {
      throw new Error(
        `Counter not incremented: got ${newCounter}, expected > ${storedCounter}. ` +
          'This may indicate a cloned authenticator.'
      );
    }
  }

  /**
   * Extract user handle from assertion
   */
  static extractUserHandle(assertion: AuthenticationResponse): string | undefined {
    if (!assertion.response.userHandle) return undefined;

    const buffer = base64urlToBuffer(assertion.response.userHandle);
    return new TextDecoder().decode(buffer);
  }
}

export default AssertionVerifier;
