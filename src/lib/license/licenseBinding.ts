/**
 * License Binding Module (Sprint 21)
 *
 * Binds licenses to hardware fingerprints for activation.
 */

import { generateFingerprint, matchFingerprints } from './hardwareFingerprint';
import type { HardwareFingerprint } from '@/types/license';

/**
 * Binding result
 */
export interface BindingResult {
  success: boolean;
  bindingId?: string;
  fingerprint?: HardwareFingerprint;
  error?: string;
}

/**
 * Activation result
 */
export interface ActivationResult {
  success: boolean;
  activationId?: string;
  activatedAt?: number;
  error?: string;
}

/**
 * Binding data stored locally
 */
export interface LocalBinding {
  licenseKey: string;
  bindingId: string;
  fingerprint: HardwareFingerprint;
  boundAt: number;
  lastVerified: number;
  activationServer?: string;
  offlineToken?: string;
}

/**
 * Generate binding ID from license key and fingerprint
 */
export function generateBindingId(licenseKey: string, fingerprint: HardwareFingerprint): string {
  const data = [licenseKey, fingerprint.cpuId, fingerprint.diskId, fingerprint.osId].join(
    '|'
  );

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return `BND-${Math.abs(hash).toString(36).toUpperCase().padStart(10, '0')}`;
}

/**
 * Create local binding
 */
export async function createLocalBinding(licenseKey: string): Promise<BindingResult> {
  try {
    const fingerprint = await generateFingerprint();
    const bindingId = generateBindingId(licenseKey, fingerprint);

    return {
      success: true,
      bindingId,
      fingerprint,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create binding',
    };
  }
}

/**
 * Verify local binding
 */
export async function verifyLocalBinding(binding: LocalBinding): Promise<{
  valid: boolean;
  matchScore: number;
  error?: string;
}> {
  try {
    const currentFingerprint = await generateFingerprint();
    const matchResult = matchFingerprints(currentFingerprint, binding.fingerprint);

    return {
      valid: matchResult.matches,
      matchScore: matchResult.confidence,
    };
  } catch (error) {
    return {
      valid: false,
      matchScore: 0,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Activation manager for handling activation flow
 */
export class ActivationManager {
  private serverUrl: string;
  private binding: LocalBinding | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Activate license online
   */
  async activateOnline(licenseKey: string): Promise<ActivationResult> {
    try {
      const fingerprint = await generateFingerprint();
      const bindingId = generateBindingId(licenseKey, fingerprint);

      // Call activation server
      const response = await fetch(`${this.serverUrl}/api/v1/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          bindingId,
          fingerprint: {
            osId: fingerprint.osId,
            // Send only hash of sensitive data
            cpuIdHash: this.hashString(fingerprint.cpuId),
            diskIdHash: this.hashString(fingerprint.diskId),
          },
          fingerprintHash: fingerprint.fingerprint,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || `Activation failed: ${response.status}`,
        };
      }

      const result = await response.json();

      // Store binding locally
      this.binding = {
        licenseKey,
        bindingId,
        fingerprint,
        boundAt: Date.now(),
        lastVerified: Date.now(),
        activationServer: this.serverUrl,
        offlineToken: result.offlineToken,
      };

      return {
        success: true,
        activationId: result.activationId,
        activatedAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Activation failed',
      };
    }
  }

  /**
   * Activate license offline
   */
  async activateOffline(
    licenseKey: string,
    offlineActivationCode: string
  ): Promise<ActivationResult> {
    try {
      const fingerprint = await generateFingerprint();
      const bindingId = generateBindingId(licenseKey, fingerprint);

      // Verify offline activation code
      // The code should contain encrypted binding data
      const isValid = this.verifyOfflineCode(offlineActivationCode, licenseKey, bindingId);

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid offline activation code',
        };
      }

      // Store binding locally
      this.binding = {
        licenseKey,
        bindingId,
        fingerprint,
        boundAt: Date.now(),
        lastVerified: Date.now(),
        offlineToken: offlineActivationCode,
      };

      return {
        success: true,
        activationId: bindingId,
        activatedAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Offline activation failed',
      };
    }
  }

  /**
   * Deactivate license
   */
  async deactivate(licenseKey: string): Promise<{ success: boolean; error?: string }> {
    if (!this.binding || this.binding.licenseKey !== licenseKey) {
      return {
        success: false,
        error: 'No active binding found',
      };
    }

    try {
      // Try to notify server
      if (this.binding.activationServer) {
        try {
          await fetch(`${this.binding.activationServer}/api/v1/deactivate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              licenseKey,
              bindingId: this.binding.bindingId,
            }),
          });
        } catch {
          // Continue even if server notification fails
        }
      }

      // Clear local binding
      this.binding = null;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deactivation failed',
      };
    }
  }

  /**
   * Check if license is activated
   */
  async isActivated(licenseKey: string): Promise<{
    activated: boolean;
    binding?: LocalBinding;
    verificationResult?: { valid: boolean; matchScore: number };
  }> {
    if (!this.binding || this.binding.licenseKey !== licenseKey) {
      return { activated: false };
    }

    // Verify binding still matches hardware
    const verificationResult = await verifyLocalBinding(this.binding);

    return {
      activated: verificationResult.valid,
      binding: this.binding,
      verificationResult,
    };
  }

  /**
   * Get current binding
   */
  getBinding(): LocalBinding | null {
    return this.binding;
  }

  /**
   * Set binding from storage
   */
  setBinding(binding: LocalBinding): void {
    this.binding = binding;
  }

  /**
   * Verify offline activation code
   */
  private verifyOfflineCode(code: string, licenseKey: string, bindingId: string): boolean {
    try {
      // Decode the activation code
      const decoded = atob(code);
      const parts = decoded.split('|');

      if (parts.length < 3) {
        return false;
      }

      const encodedKey = parts[0];
      const encodedBinding = parts[1];
      const checksum = parts[2];

      // Verify license key matches
      if (encodedKey !== licenseKey) {
        return false;
      }

      // Verify binding ID starts with expected prefix
      if (encodedBinding && !encodedBinding.startsWith(bindingId.substring(0, 6))) {
        return false;
      }

      // Verify checksum
      const expectedChecksum = this.hashString((encodedKey || '') + (encodedBinding || '')).substring(0, 8);
      return checksum === expectedChecksum;
    } catch {
      return false;
    }
  }

  /**
   * Generate offline activation request
   */
  async generateOfflineRequest(licenseKey: string): Promise<string> {
    const fingerprint = await generateFingerprint();
    const bindingId = generateBindingId(licenseKey, fingerprint);

    const request = {
      licenseKey,
      bindingId,
      osId: fingerprint.osId,
      fingerprintHash: fingerprint.fingerprint,
      timestamp: Date.now(),
    };

    return btoa(JSON.stringify(request));
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Create activation manager
 */
export function createActivationManager(serverUrl: string): ActivationManager {
  return new ActivationManager(serverUrl);
}

export default ActivationManager;
