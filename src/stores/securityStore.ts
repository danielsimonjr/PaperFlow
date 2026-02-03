/**
 * Security Store
 *
 * Zustand store for security state including enrolled keys,
 * authentication status, and security settings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  RegisteredCredential,
  HardwareKeyInfo,
  SecuritySettings,
} from '@/types/webauthn';

/**
 * Security store state
 */
interface SecurityStoreState {
  // State
  isAuthenticated: boolean;
  lastAuthTime: number | null;
  sessionExpires: number | null;
  activeKeyId: string | null;
  enrolledKeys: RegisteredCredential[];
  settings: SecuritySettings;

  // Actions
  authenticate: (keyId: string) => void;
  deauthenticate: () => void;
  checkSession: () => boolean;
  extendSession: () => void;

  // Key management
  addKey: (key: RegisteredCredential) => void;
  removeKey: (keyId: string) => void;
  renameKey: (keyId: string, newName: string) => void;
  getKeys: () => HardwareKeyInfo[];

  // Settings
  updateSettings: (settings: Partial<SecuritySettings>) => void;
  resetSettings: () => void;
}

/**
 * Default security settings
 */
const defaultSettings: SecuritySettings = {
  requireHardwareKey: false,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  autoLockEnabled: true,
  autoLockTimeout: 5 * 60 * 1000, // 5 minutes
  allowPlatformAuthenticator: true,
  allowCrossPlatformAuthenticator: true,
};

/**
 * Security store
 */
export const useSecurityStore = create<SecurityStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      lastAuthTime: null,
      sessionExpires: null,
      activeKeyId: null,
      enrolledKeys: [],
      settings: defaultSettings,

      // Authenticate with a hardware key
      authenticate: (keyId: string) => {
        const { settings } = get();
        const now = Date.now();
        const expires = now + settings.sessionTimeout;

        set({
          isAuthenticated: true,
          lastAuthTime: now,
          sessionExpires: expires,
          activeKeyId: keyId,
        });

        // Update last used time for the key
        set((state) => ({
          enrolledKeys: state.enrolledKeys.map((key) =>
            key.id === keyId
              ? { ...key, lastUsedAt: new Date().toISOString() }
              : key
          ),
        }));
      },

      // Deauthenticate (logout)
      deauthenticate: () => {
        set({
          isAuthenticated: false,
          lastAuthTime: null,
          sessionExpires: null,
          activeKeyId: null,
        });
      },

      // Check if session is still valid
      checkSession: () => {
        const { isAuthenticated, sessionExpires } = get();

        if (!isAuthenticated) return false;
        if (!sessionExpires) return false;

        if (Date.now() > sessionExpires) {
          // Session expired
          get().deauthenticate();
          return false;
        }

        return true;
      },

      // Extend session (refresh timeout)
      extendSession: () => {
        const { isAuthenticated, settings } = get();

        if (!isAuthenticated) return;

        const now = Date.now();
        set({
          sessionExpires: now + settings.sessionTimeout,
        });
      },

      // Add a new enrolled key
      addKey: (key: RegisteredCredential) => {
        set((state) => ({
          enrolledKeys: [...state.enrolledKeys, key],
        }));
      },

      // Remove an enrolled key
      removeKey: (keyId: string) => {
        const { activeKeyId, enrolledKeys } = get();

        // Don't remove the last key if requireHardwareKey is enabled
        const { settings } = get();
        if (settings.requireHardwareKey && enrolledKeys.length <= 1) {
          console.warn('Cannot remove the last hardware key when hardware key is required');
          return;
        }

        set((state) => ({
          enrolledKeys: state.enrolledKeys.filter((key) => key.id !== keyId),
          // Deauthenticate if the removed key was active
          ...(activeKeyId === keyId
            ? {
                isAuthenticated: false,
                activeKeyId: null,
                sessionExpires: null,
              }
            : {}),
        }));
      },

      // Rename a key
      renameKey: (keyId: string, newName: string) => {
        set((state) => ({
          enrolledKeys: state.enrolledKeys.map((key) =>
            key.id === keyId ? { ...key, name: newName } : key
          ),
        }));
      },

      // Get hardware key info
      getKeys: (): HardwareKeyInfo[] => {
        const { enrolledKeys } = get();

        return enrolledKeys.map((key) => ({
          id: key.id,
          name: key.name,
          type: getKeyType(key),
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          isBackupEligible: false,
          isBackedUp: false,
        }));
      },

      // Update settings
      updateSettings: (newSettings: Partial<SecuritySettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Reset settings to defaults
      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'paperflow-security',
      partialize: (state) => ({
        enrolledKeys: state.enrolledKeys,
        settings: state.settings,
      }),
    }
  )
);

/**
 * Get key type based on device type and transports
 */
function getKeyType(key: RegisteredCredential): 'usb' | 'nfc' | 'ble' | 'internal' {
  if (key.deviceType === 'platform') {
    return 'internal';
  }

  if (key.transports?.includes('usb')) return 'usb';
  if (key.transports?.includes('nfc')) return 'nfc';
  if (key.transports?.includes('ble')) return 'ble';

  return 'usb';
}

/**
 * Hook to check authentication status
 */
export function useIsAuthenticated(): boolean {
  const checkSession = useSecurityStore((state) => state.checkSession);
  return checkSession();
}

/**
 * Hook to get enrolled keys
 */
export function useEnrolledKeys(): HardwareKeyInfo[] {
  return useSecurityStore((state) => state.getKeys());
}

/**
 * Hook for security settings
 */
export function useSecuritySettings(): SecuritySettings {
  return useSecurityStore((state) => state.settings);
}

export default useSecurityStore;
