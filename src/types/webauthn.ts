/**
 * WebAuthn Types
 *
 * Type definitions for WebAuthn/FIDO2 authentication.
 */

/**
 * Registered credential
 */
export interface RegisteredCredential {
  id: string;
  credentialId: ArrayBuffer | string;
  publicKey: ArrayBuffer | string;
  counter: number;
  deviceType: 'platform' | 'cross-platform';
  transports?: AuthenticatorTransport[];
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Registration options from server
 */
export interface RegistrationOptions {
  challenge: ArrayBuffer | string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: ArrayBuffer | string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: PublicKeyCredentialDescriptor[];
}

/**
 * Authentication options from server
 */
export interface AuthenticationOptions {
  challenge: ArrayBuffer | string;
  timeout?: number;
  rpId: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
}

/**
 * Registration response to send to server
 */
export interface RegistrationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: AuthenticatorTransport[];
  };
  authenticatorAttachment?: AuthenticatorAttachment;
}

/**
 * Authentication response to send to server
 */
export interface AuthenticationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
}

/**
 * Verified registration result
 */
export interface VerifiedRegistration {
  verified: boolean;
  registrationInfo?: {
    credentialId: Uint8Array;
    credentialPublicKey: Uint8Array;
    counter: number;
    credentialDeviceType: 'singleDevice' | 'multiDevice';
    credentialBackedUp: boolean;
    aaguid?: string;
    attestationObject?: Uint8Array;
  };
}

/**
 * Verified authentication result
 */
export interface VerifiedAuthentication {
  verified: boolean;
  authenticationInfo?: {
    credentialId: Uint8Array;
    newCounter: number;
    userVerified: boolean;
    credentialDeviceType: 'singleDevice' | 'multiDevice';
  };
}

/**
 * WebAuthn error
 */
export interface WebAuthnError {
  code:
    | 'NOT_SUPPORTED'
    | 'INVALID_STATE'
    | 'NOT_ALLOWED'
    | 'CONSTRAINT'
    | 'ABORT'
    | 'TIMEOUT'
    | 'UNKNOWN';
  message: string;
}

/**
 * Hardware key info
 */
export interface HardwareKeyInfo {
  id: string;
  name: string;
  type: 'usb' | 'nfc' | 'ble' | 'internal';
  aaguid?: string;
  createdAt: string;
  lastUsedAt?: string;
  isBackupEligible: boolean;
  isBackedUp: boolean;
}

/**
 * Security settings
 */
export interface SecuritySettings {
  requireHardwareKey: boolean;
  sessionTimeout: number;
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  allowPlatformAuthenticator: boolean;
  allowCrossPlatformAuthenticator: boolean;
}

/**
 * Security state
 */
export interface SecurityState {
  isAuthenticated: boolean;
  lastAuthTime?: number;
  sessionExpires?: number;
  activeKeyId?: string;
}
