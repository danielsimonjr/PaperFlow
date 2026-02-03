/**
 * WebAuthn Core
 *
 * Core WebAuthn functionality for browser-based authentication.
 */

import type {
  RegistrationOptions,
  AuthenticationOptions,
  RegistrationResponse,
  AuthenticationResponse,
  WebAuthnError,
} from '@/types/webauthn';

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof window.navigator.credentials !== 'undefined'
  );
}

/**
 * Check if platform authenticator is available (TouchID, Windows Hello, etc.)
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if conditional mediation is supported (autofill UI)
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    const PubKeyCred = PublicKeyCredential as typeof PublicKeyCredential & {
      isConditionalMediationAvailable?: () => Promise<boolean>;
    };
    return (
      'isConditionalMediationAvailable' in PubKeyCred &&
      (await PubKeyCred.isConditionalMediationAvailable?.() ?? false)
    );
  } catch {
    return false;
  }
}

/**
 * Convert base64url to ArrayBuffer
 */
export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binaryString = atob(base64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64url
 */
export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i] ?? 0);
  }
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Start registration ceremony
 */
export async function startRegistration(
  options: RegistrationOptions
): Promise<RegistrationResponse> {
  if (!isWebAuthnSupported()) {
    throw createWebAuthnError('NOT_SUPPORTED', 'WebAuthn is not supported');
  }

  // Convert base64url strings to ArrayBuffer
  const challenge =
    typeof options.challenge === 'string'
      ? base64urlToBuffer(options.challenge)
      : options.challenge;

  const userId =
    typeof options.user.id === 'string'
      ? base64urlToBuffer(options.user.id)
      : options.user.id;

  const excludeCredentials = options.excludeCredentials?.map((cred) => ({
    ...cred,
    id:
      typeof cred.id === 'string'
        ? base64urlToBuffer(cred.id)
        : cred.id,
  }));

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: options.rp,
    user: {
      ...options.user,
      id: userId,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout || 60000,
    attestation: options.attestation || 'none',
    authenticatorSelection: options.authenticatorSelection,
    excludeCredentials,
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw createWebAuthnError('ABORT', 'Registration was aborted');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    return {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: 'public-key',
      response: {
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        attestationObject: bufferToBase64url(response.attestationObject),
        transports: response.getTransports?.() as AuthenticatorTransport[],
      },
      authenticatorAttachment: credential.authenticatorAttachment as AuthenticatorAttachment,
    };
  } catch (error) {
    throw handleWebAuthnError(error);
  }
}

/**
 * Start authentication ceremony
 */
export async function startAuthentication(
  options: AuthenticationOptions
): Promise<AuthenticationResponse> {
  if (!isWebAuthnSupported()) {
    throw createWebAuthnError('NOT_SUPPORTED', 'WebAuthn is not supported');
  }

  // Convert base64url strings to ArrayBuffer
  const challenge =
    typeof options.challenge === 'string'
      ? base64urlToBuffer(options.challenge)
      : options.challenge;

  const allowCredentials = options.allowCredentials?.map((cred) => ({
    ...cred,
    id:
      typeof cred.id === 'string'
        ? base64urlToBuffer(cred.id)
        : cred.id,
  }));

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: options.timeout || 60000,
    rpId: options.rpId,
    allowCredentials,
    userVerification: options.userVerification || 'preferred',
  };

  try {
    const credential = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw createWebAuthnError('ABORT', 'Authentication was aborted');
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: 'public-key',
      response: {
        clientDataJSON: bufferToBase64url(response.clientDataJSON),
        authenticatorData: bufferToBase64url(response.authenticatorData),
        signature: bufferToBase64url(response.signature),
        userHandle: response.userHandle
          ? bufferToBase64url(response.userHandle)
          : undefined,
      },
    };
  } catch (error) {
    throw handleWebAuthnError(error);
  }
}

/**
 * Create WebAuthn error
 */
function createWebAuthnError(
  code: WebAuthnError['code'],
  message: string
): WebAuthnError {
  return { code, message };
}

/**
 * Handle WebAuthn errors
 */
function handleWebAuthnError(error: unknown): WebAuthnError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotSupportedError':
        return createWebAuthnError('NOT_SUPPORTED', error.message);
      case 'InvalidStateError':
        return createWebAuthnError('INVALID_STATE', error.message);
      case 'NotAllowedError':
        return createWebAuthnError('NOT_ALLOWED', error.message);
      case 'ConstraintError':
        return createWebAuthnError('CONSTRAINT', error.message);
      case 'AbortError':
        return createWebAuthnError('ABORT', error.message);
      case 'TimeoutError':
        return createWebAuthnError('TIMEOUT', 'Operation timed out');
      default:
        return createWebAuthnError('UNKNOWN', error.message);
    }
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return error as WebAuthnError;
  }

  return createWebAuthnError(
    'UNKNOWN',
    error instanceof Error ? error.message : 'Unknown error'
  );
}

export default {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  isConditionalMediationAvailable,
  startRegistration,
  startAuthentication,
  base64urlToBuffer,
  bufferToBase64url,
};
