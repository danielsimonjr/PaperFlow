/**
 * WebAuthn Client
 *
 * Client-side WebAuthn manager for hardware key operations.
 */

import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  startRegistration,
  startAuthentication,
  bufferToBase64url,
} from './webauthn';
import type {
  RegistrationOptions,
  AuthenticationOptions,
  AuthenticationResponse,
  RegisteredCredential,
  HardwareKeyInfo,
  WebAuthnError,
} from '@/types/webauthn';

/**
 * WebAuthn client configuration
 */
export interface WebAuthnClientConfig {
  rpId: string;
  rpName: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: WebAuthnClientConfig = {
  rpId: 'paperflow.app',
  rpName: 'PaperFlow',
  timeout: 60000,
  userVerification: 'preferred',
};

/**
 * WebAuthn Client
 */
export class WebAuthnClient {
  private config: WebAuthnClientConfig;
  private credentials: Map<string, RegisteredCredential> = new Map();

  constructor(config: Partial<WebAuthnClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCredentials();
  }

  /**
   * Check if WebAuthn is available
   */
  isAvailable(): boolean {
    return isWebAuthnSupported();
  }

  /**
   * Check if platform authenticator is available
   */
  async hasPlatformAuthenticator(): Promise<boolean> {
    return isPlatformAuthenticatorAvailable();
  }

  /**
   * Generate registration options
   */
  generateRegistrationOptions(
    userId: string,
    userName: string,
    displayName: string
  ): RegistrationOptions {
    // Generate random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Convert user ID to bytes
    const userIdBytes = new TextEncoder().encode(userId);

    return {
      challenge: bufferToBase64url(challenge.buffer),
      rp: {
        name: this.config.rpName,
        id: this.config.rpId,
      },
      user: {
        id: bufferToBase64url(userIdBytes.buffer),
        name: userName,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: this.config.timeout,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: this.config.userVerification,
      },
      excludeCredentials: this.getExcludeCredentials(),
    };
  }

  /**
   * Register a new hardware key
   */
  async registerKey(
    userId: string,
    userName: string,
    displayName: string,
    keyName: string
  ): Promise<RegisteredCredential> {
    if (!this.isAvailable()) {
      throw { code: 'NOT_SUPPORTED', message: 'WebAuthn is not supported' } as WebAuthnError;
    }

    const options = this.generateRegistrationOptions(userId, userName, displayName);

    const response = await startRegistration(options);

    // Create credential record
    const credential: RegisteredCredential = {
      id: response.id,
      credentialId: response.rawId,
      publicKey: response.response.attestationObject,
      counter: 0,
      deviceType:
        response.authenticatorAttachment === 'platform'
          ? 'platform'
          : 'cross-platform',
      transports: response.response.transports,
      name: keyName,
      createdAt: new Date().toISOString(),
    };

    // Store credential
    this.credentials.set(credential.id, credential);
    this.saveCredentials();

    return credential;
  }

  /**
   * Generate authentication options
   */
  generateAuthenticationOptions(credentialIds?: string[]): AuthenticationOptions {
    // Generate random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const allowCredentials = credentialIds?.map((id) => {
      const credential = this.credentials.get(id);
      return {
        type: 'public-key' as const,
        id: credential?.credentialId as unknown as BufferSource,
        transports: credential?.transports ?? [],
      } as PublicKeyCredentialDescriptor;
    });

    return {
      challenge: bufferToBase64url(challenge.buffer),
      timeout: this.config.timeout,
      rpId: this.config.rpId,
      allowCredentials:
        allowCredentials && allowCredentials.length > 0
          ? allowCredentials
          : this.getAllowCredentials(),
      userVerification: this.config.userVerification,
    };
  }

  /**
   * Authenticate with hardware key
   */
  async authenticate(credentialIds?: string[]): Promise<{
    credentialId: string;
    response: AuthenticationResponse;
    credential: RegisteredCredential;
  }> {
    if (!this.isAvailable()) {
      throw { code: 'NOT_SUPPORTED', message: 'WebAuthn is not supported' } as WebAuthnError;
    }

    if (this.credentials.size === 0) {
      throw {
        code: 'INVALID_STATE',
        message: 'No credentials registered',
      } as WebAuthnError;
    }

    const options = this.generateAuthenticationOptions(credentialIds);

    const response = await startAuthentication(options);

    const credential = this.credentials.get(response.id);
    if (!credential) {
      throw {
        code: 'INVALID_STATE',
        message: 'Credential not found',
      } as WebAuthnError;
    }

    // Update last used
    credential.lastUsedAt = new Date().toISOString();
    this.credentials.set(credential.id, credential);
    this.saveCredentials();

    return {
      credentialId: response.id,
      response,
      credential,
    };
  }

  /**
   * Get registered credentials
   */
  getCredentials(): RegisteredCredential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Get hardware key info
   */
  getHardwareKeys(): HardwareKeyInfo[] {
    return this.getCredentials().map((cred) => ({
      id: cred.id,
      name: cred.name,
      type: this.getKeyType(cred),
      createdAt: cred.createdAt,
      lastUsedAt: cred.lastUsedAt,
      isBackupEligible: false,
      isBackedUp: false,
    }));
  }

  /**
   * Remove a credential
   */
  removeCredential(id: string): boolean {
    const deleted = this.credentials.delete(id);
    if (deleted) {
      this.saveCredentials();
    }
    return deleted;
  }

  /**
   * Rename a credential
   */
  renameCredential(id: string, newName: string): boolean {
    const credential = this.credentials.get(id);
    if (!credential) return false;

    credential.name = newName;
    this.credentials.set(id, credential);
    this.saveCredentials();
    return true;
  }

  /**
   * Clear all credentials
   */
  clearCredentials(): void {
    this.credentials.clear();
    this.saveCredentials();
  }

  /**
   * Get key type based on transports
   */
  private getKeyType(
    credential: RegisteredCredential
  ): 'usb' | 'nfc' | 'ble' | 'internal' {
    if (credential.deviceType === 'platform') {
      return 'internal';
    }

    if (credential.transports?.includes('usb')) return 'usb';
    if (credential.transports?.includes('nfc')) return 'nfc';
    if (credential.transports?.includes('ble')) return 'ble';

    return 'usb'; // Default to USB for cross-platform
  }

  /**
   * Get exclude credentials for registration
   */
  private getExcludeCredentials(): PublicKeyCredentialDescriptor[] {
    return this.getCredentials().map((cred) => ({
      type: 'public-key' as const,
      id: cred.credentialId as unknown as BufferSource,
      transports: cred.transports ?? [],
    } as PublicKeyCredentialDescriptor));
  }

  /**
   * Get allow credentials for authentication
   */
  private getAllowCredentials(): PublicKeyCredentialDescriptor[] {
    return this.getCredentials().map((cred) => ({
      type: 'public-key' as const,
      id: cred.credentialId as unknown as BufferSource,
      transports: cred.transports ?? [],
    } as PublicKeyCredentialDescriptor));
  }

  /**
   * Load credentials from storage
   */
  private loadCredentials(): void {
    try {
      const stored = localStorage.getItem('paperflow-webauthn-credentials');
      if (stored) {
        const data = JSON.parse(stored) as RegisteredCredential[];
        data.forEach((cred) => this.credentials.set(cred.id, cred));
      }
    } catch (error) {
      console.error('Failed to load WebAuthn credentials:', error);
    }
  }

  /**
   * Save credentials to storage
   */
  private saveCredentials(): void {
    try {
      const data = Array.from(this.credentials.values());
      localStorage.setItem('paperflow-webauthn-credentials', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save WebAuthn credentials:', error);
    }
  }
}

// Singleton instance
let instance: WebAuthnClient | null = null;

export function getWebAuthnClient(
  config?: Partial<WebAuthnClientConfig>
): WebAuthnClient {
  if (!instance) {
    instance = new WebAuthnClient(config);
  }
  return instance;
}

export default WebAuthnClient;
