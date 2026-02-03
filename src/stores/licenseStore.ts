/**
 * License Store (Sprint 21)
 *
 * Zustand store for managing license state, validation, and feature gating.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LicenseInfo,
  LicenseState,
  FeatureId,
  ExpiryWarning,
} from '@/types/license';
import {
  validateLicenseKey,
  isFeatureAvailable,
  getExpiryWarning,
} from '@lib/license/licenseValidator';
import {
  generateFingerprint,
  serializeFingerprint,
} from '@lib/license/hardwareFingerprint';

/**
 * License store actions
 */
interface LicenseActions {
  /** Activate a license key */
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>;
  /** Deactivate current license */
  deactivateLicense: () => Promise<{ success: boolean; error?: string }>;
  /** Validate the current license */
  validateLicense: () => Promise<void>;
  /** Check if a feature is available */
  checkFeature: (featureId: FeatureId) => boolean;
  /** Get expiry warning info */
  getExpiryWarning: () => ExpiryWarning;
  /** Set offline mode */
  setOfflineMode: (offline: boolean) => void;
  /** Clear license data */
  clearLicense: () => void;
  /** Refresh license from server */
  refreshLicense: () => Promise<void>;
}

/**
 * Complete license store state
 */
type LicenseStoreState = LicenseState & LicenseActions;

/**
 * Initial state
 */
const initialState: LicenseState = {
  license: null,
  isLoading: false,
  error: null,
  lastChecked: null,
  isOffline: false,
  gracePeriodDays: 7,
};

/**
 * License store
 */
export const useLicenseStore = create<LicenseStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Activate a license key
       */
      activateLicense: async (key: string) => {
        set({ isLoading: true, error: null });

        try {
          // Generate hardware fingerprint
          const fingerprint = await generateFingerprint();
          const fingerprintStr = serializeFingerprint(fingerprint);

          // Validate the key locally first
          const result = validateLicenseKey(key, fingerprintStr);

          if (!result.valid || !result.license) {
            set({
              isLoading: false,
              error: result.error || 'Invalid license key',
            });
            return { success: false, error: result.error };
          }

          // In a real implementation, we would also:
          // 1. Send activation request to server
          // 2. Receive and store activation token
          // 3. Bind to hardware fingerprint on server

          // Store the license
          const license: LicenseInfo = {
            ...result.license,
            hardwareFingerprint: fingerprintStr,
            activatedAt: new Date().toISOString(),
          };

          set({
            license,
            isLoading: false,
            error: null,
            lastChecked: Date.now(),
          });

          return { success: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Activation failed';
          set({
            isLoading: false,
            error: errorMsg,
          });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Deactivate current license
       */
      deactivateLicense: async () => {
        const { license } = get();

        if (!license) {
          return { success: false, error: 'No active license' };
        }

        set({ isLoading: true, error: null });

        try {
          // In a real implementation, we would:
          // 1. Send deactivation request to server
          // 2. Release the hardware binding
          // 3. Clear local license data

          set({
            license: null,
            isLoading: false,
            error: null,
            lastChecked: null,
          });

          return { success: true };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Deactivation failed';
          set({
            isLoading: false,
            error: errorMsg,
          });
          return { success: false, error: errorMsg };
        }
      },

      /**
       * Validate the current license
       */
      validateLicense: async () => {
        const { license, isOffline } = get();

        if (!license) {
          return;
        }

        set({ isLoading: true });

        try {
          // Re-validate the license key
          const result = validateLicenseKey(license.key, license.hardwareFingerprint || undefined);

          if (!result.valid) {
            set({
              license: null,
              isLoading: false,
              error: result.error || 'License validation failed',
            });
            return;
          }

          // If online, we would also validate with the server here
          if (!isOffline) {
            // Server validation would go here
          }

          // Update last checked time
          set({
            license: {
              ...license,
              status: result.license?.status || license.status,
              daysUntilExpiry: result.license?.daysUntilExpiry ?? license.daysUntilExpiry,
              inGracePeriod: result.license?.inGracePeriod ?? license.inGracePeriod,
              lastValidated: Date.now(),
            },
            isLoading: false,
            lastChecked: Date.now(),
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Validation failed',
          });
        }
      },

      /**
       * Check if a feature is available
       */
      checkFeature: (featureId: FeatureId) => {
        const { license } = get();
        return isFeatureAvailable(license, featureId);
      },

      /**
       * Get expiry warning info
       */
      getExpiryWarning: () => {
        const { license } = get();
        const warning = getExpiryWarning(license);
        return {
          ...warning,
          showUpgradePrompt: warning.level !== 'none' && license?.data.type !== 'perpetual',
        };
      },

      /**
       * Set offline mode
       */
      setOfflineMode: (offline: boolean) => {
        set({ isOffline: offline });
      },

      /**
       * Clear license data
       */
      clearLicense: () => {
        set(initialState);
      },

      /**
       * Refresh license from server
       */
      refreshLicense: async () => {
        const { license, isOffline, validateLicense } = get();

        if (!license || isOffline) {
          return;
        }

        await validateLicense();
      },
    }),
    {
      name: 'paperflow-license',
      partialize: (state) => ({
        license: state.license,
        lastChecked: state.lastChecked,
        gracePeriodDays: state.gracePeriodDays,
      }),
    }
  )
);

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureEnabled(featureId: FeatureId): boolean {
  return useLicenseStore((state) => state.checkFeature(featureId));
}

/**
 * Hook to get license status
 */
export function useLicenseStatus() {
  const license = useLicenseStore((state) => state.license);
  const isLoading = useLicenseStore((state) => state.isLoading);
  const error = useLicenseStore((state) => state.error);

  return {
    hasLicense: !!license,
    status: license?.status || 'not_activated',
    edition: license?.data.edition || 'free',
    isLoading,
    error,
  };
}

/**
 * Hook to get expiry warning
 */
export function useExpiryWarning(): ExpiryWarning {
  return useLicenseStore((state) => state.getExpiryWarning());
}

/**
 * Initialize license validation on app start
 */
export async function initializeLicense(): Promise<void> {
  const { license, validateLicense } = useLicenseStore.getState();

  if (license) {
    await validateLicense();
  }
}

export default useLicenseStore;
