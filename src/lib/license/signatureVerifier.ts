/**
 * Signature Verifier Module (Sprint 21)
 *
 * Verifies RSA signatures on license data.
 */

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Embedded public key for license verification
 * In production, this would be the actual RSA public key
 */
const EMBEDDED_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3xfn/ygWu
sZFIbGJfXM2IZhlrYUCQxV7gvzOxBzM5YftJxHb7rPYBrUoKQP6E0h5/RDvwG7Da
wL4+6M5rUZOQdhjMJx7KYZcXMJGQZHc7kVJSLsBT7X0zTjJZP1sFB8RCVD0c8KoV
V9HhHLSwVXJ0fHLTMJUxSAZUJ9E4mFnXVQf0eHvPmDGHzQE0lKser8aQBr0WgfRz
M2GpmIoJXJQzYExTZ0JIrUhEV2u8qREFxGOvE8rPQKZJqI5QxPxrpDNUI0HX+/lW
9UFLRENlVkhVEK7FqVf7Nhl/fQ7vZ9o0HwM9aTI0cDJf0rBfQZMprZQWVHPvUx/F
WQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Convert PEM to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Convert base64 signature to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Import public key for verification
 */
async function importPublicKey(pem: string = EMBEDDED_PUBLIC_KEY): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);

  return crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );
}

/**
 * Verify RSA signature
 */
export async function verifySignature(
  data: string,
  signature: string,
  publicKey?: string
): Promise<VerificationResult> {
  try {
    // Check if Web Crypto is available
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return {
        valid: false,
        error: 'Web Crypto API not available',
      };
    }

    // Import the public key
    const key = await importPublicKey(publicKey);

    // Convert data to bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Convert signature from base64
    const signatureBytes = base64ToArrayBuffer(signature);

    // Verify signature
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureBytes,
      dataBytes
    );

    return { valid };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Verify license signature
 */
export async function verifyLicenseSignature(
  licenseData: {
    key: string;
    issuedAt: string;
    expiresAt: string | null;
    edition: string;
    seats: number;
    customerId?: string;
  },
  signature: string,
  publicKey?: string
): Promise<VerificationResult> {
  // Create canonical data string
  const dataString = [
    licenseData.key,
    licenseData.issuedAt,
    licenseData.expiresAt || 'perpetual',
    licenseData.edition,
    licenseData.seats.toString(),
    licenseData.customerId || '',
  ].join('|');

  return verifySignature(dataString, signature, publicKey);
}

/**
 * Simple HMAC-based verification (fallback when RSA not available)
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  // Simple HMAC-like verification for environments without Web Crypto
  let hash = 0;
  const combined = data + secret;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  const expectedSignature = Math.abs(hash).toString(36);
  return signature === expectedSignature;
}

/**
 * Verify license with fallback methods
 */
export async function verifyLicenseWithFallback(
  licenseData: {
    key: string;
    issuedAt: string;
    expiresAt: string | null;
    edition: string;
    seats: number;
  },
  signature: string,
  options?: {
    publicKey?: string;
    hmacSecret?: string;
  }
): Promise<VerificationResult> {
  // Try RSA first
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const rsaResult = await verifyLicenseSignature(licenseData, signature, options?.publicKey);
    if (rsaResult.valid) {
      return rsaResult;
    }
  }

  // Fallback to HMAC if secret provided
  if (options?.hmacSecret) {
    const dataString = [
      licenseData.key,
      licenseData.issuedAt,
      licenseData.expiresAt || 'perpetual',
      licenseData.edition,
      licenseData.seats.toString(),
    ].join('|');

    const valid = verifyHMAC(dataString, signature, options.hmacSecret);
    return { valid };
  }

  return {
    valid: false,
    error: 'No verification method available',
  };
}

/**
 * Check if signature appears valid (format check only)
 */
export function isValidSignatureFormat(signature: string): boolean {
  // Base64 signature should be 344 characters for RSA-2048
  // Allow some flexibility
  if (signature.length < 20 || signature.length > 500) {
    return false;
  }

  // Check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(signature);
}

/**
 * Get embedded public key
 */
export function getEmbeddedPublicKey(): string {
  return EMBEDDED_PUBLIC_KEY;
}

export default {
  verifySignature,
  verifyLicenseSignature,
  verifyLicenseWithFallback,
  verifyHMAC,
  isValidSignatureFormat,
  getEmbeddedPublicKey,
};
