/**
 * Enterprise Policy Store
 *
 * Zustand store that manages enterprise policies from GPO/MDM,
 * merges them with local settings, and tracks locked state.
 */

import { create } from 'zustand';
import {
  policyMerger,
  type MergedPolicyConfig,
  type MergedPolicyValue,
} from '@lib/enterprise/policyMerger';

/**
 * Enterprise policy state interface
 */
interface EnterprisePolicyState {
  // Policy configuration
  config: MergedPolicyConfig | null;

  // Merged config alias for compatibility
  mergedConfig: MergedPolicyConfig | null;

  // Config sources tracking
  configSources: Map<string, string>;

  // Status flags
  isLoading: boolean;
  isInitialized: boolean;
  hasEnterprisePolicies: boolean;
  error: string | null;

  // Admin contact
  adminContact: {
    email: string | null;
    name: string | null;
    organization: string | null;
  };

  // Statistics
  managedSettingsCount: number;
  lockedSettings: string[];
  platform: 'windows' | 'macos' | 'linux' | 'web';
  lastRefreshed: number | null;
  lastUpdated: number | null;

  // Actions
  initialize: () => Promise<void>;
  refresh: (force?: boolean) => Promise<void>;
  isSettingLocked: (key: string) => boolean;
  getSettingValue: <T>(category: string, key: string) => T | null;
  getSettingSource: (category: string, key: string) => string | null;
  setUserSettings: (settings: Record<string, unknown>) => void;
  clearCache: () => void;
  loadConfigFromFile: (path: string, config: Record<string, unknown>) => Promise<void>;
}

/**
 * Default state values
 */
const initialState = {
  config: null,
  mergedConfig: null,
  configSources: new Map<string, string>(),
  isLoading: false,
  isInitialized: false,
  hasEnterprisePolicies: false,
  error: null,
  adminContact: {
    email: null,
    name: null,
    organization: null,
  },
  managedSettingsCount: 0,
  lockedSettings: [] as string[],
  platform: 'web' as const,
  lastRefreshed: null,
  lastUpdated: null,
};

/**
 * Enterprise policy store
 */
export const useEnterprisePolicyStore = create<EnterprisePolicyState>((set, get) => ({
  ...initialState,

  /**
   * Initialize the policy store
   */
  initialize: async () => {
    const { isInitialized, isLoading } = get();

    if (isInitialized || isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const config = await policyMerger.mergeAllPolicies(false);
      const lockedSettings = await policyMerger.getLockedSettings();

      set({
        config,
        mergedConfig: config,
        isInitialized: true,
        isLoading: false,
        hasEnterprisePolicies: config.hasEnterprisePolicies,
        adminContact: config.adminContact,
        managedSettingsCount: config.managedSettingsCount,
        lockedSettings,
        platform: config.platform,
        lastRefreshed: config.lastMerged,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load policies',
      });
    }
  },

  /**
   * Refresh policies from sources
   */
  refresh: async (force = false) => {
    set({ isLoading: true, error: null });

    try {
      policyMerger.clearCache();
      const config = await policyMerger.mergeAllPolicies(force);
      const lockedSettings = await policyMerger.getLockedSettings();

      set({
        config,
        mergedConfig: config,
        isLoading: false,
        hasEnterprisePolicies: config.hasEnterprisePolicies,
        adminContact: config.adminContact,
        managedSettingsCount: config.managedSettingsCount,
        lockedSettings,
        platform: config.platform,
        lastRefreshed: config.lastMerged,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh policies',
      });
    }
  },

  /**
   * Check if a setting is locked by enterprise policy
   */
  isSettingLocked: (key: string) => {
    const { lockedSettings } = get();
    return lockedSettings.includes(key);
  },

  /**
   * Get the value of a setting
   */
  getSettingValue: <T>(category: string, key: string): T | null => {
    const { config } = get();
    if (!config) return null;

    const categoryConfig = config[category as keyof MergedPolicyConfig];
    if (!categoryConfig || typeof categoryConfig !== 'object') return null;

    const setting = (categoryConfig as unknown as Record<string, MergedPolicyValue<unknown>>)[key];
    return setting?.value as T ?? null;
  },

  /**
   * Get the source of a setting
   */
  getSettingSource: (category: string, key: string): string | null => {
    const { config } = get();
    if (!config) return null;

    const categoryConfig = config[category as keyof MergedPolicyConfig];
    if (!categoryConfig || typeof categoryConfig !== 'object') return null;

    const setting = (categoryConfig as unknown as Record<string, MergedPolicyValue<unknown>>)[key];
    return setting?.sourceName ?? null;
  },

  /**
   * Set user settings for merging
   */
  setUserSettings: (settings: Record<string, unknown>) => {
    policyMerger.setUserSettings(settings);
    // Trigger refresh
    get().refresh(true);
  },

  /**
   * Clear policy cache
   */
  clearCache: () => {
    policyMerger.clearCache();
    set({
      config: null,
      mergedConfig: null,
      isInitialized: false,
      lastRefreshed: null,
      lastUpdated: null,
    });
  },

  /**
   * Load configuration from file
   */
  loadConfigFromFile: async (_path: string, config: Record<string, unknown>) => {
    // Import the config into the policy merger as a file source
    policyMerger.setUserSettings(config);
    await get().refresh(true);
  },
}));

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureEnabled(featureName: string): boolean {
  const config = useEnterprisePolicyStore((state) => state.config);

  if (!config) return true; // Default to enabled if not loaded

  const features = config.features as unknown as Record<string, MergedPolicyValue<boolean>>;
  const feature = features[featureName];

  return feature?.value ?? true;
}

/**
 * Hook to check if settings are managed
 */
export function useIsManaged(): boolean {
  return useEnterprisePolicyStore((state) => state.hasEnterprisePolicies);
}

/**
 * Hook to get admin contact info
 */
export function useAdminContact() {
  return useEnterprisePolicyStore((state) => state.adminContact);
}

/**
 * Hook to get a specific policy value with metadata
 */
export function usePolicyValue<T>(
  category: string,
  key: string
): { value: T | null; isLocked: boolean; source: string | null } {
  const config = useEnterprisePolicyStore((state) => state.config);
  const isSettingLocked = useEnterprisePolicyStore((state) => state.isSettingLocked);

  if (!config) {
    return { value: null, isLocked: false, source: null };
  }

  const categoryConfig = config[category as keyof MergedPolicyConfig];
  if (!categoryConfig || typeof categoryConfig !== 'object') {
    return { value: null, isLocked: false, source: null };
  }

  const setting = (categoryConfig as unknown as Record<string, MergedPolicyValue<T>>)[key];

  return {
    value: setting?.value ?? null,
    isLocked: isSettingLocked(`${category}.${key}`),
    source: setting?.sourceName ?? null,
  };
}

/**
 * Initialize enterprise policies on app startup
 */
export async function initializeEnterprisePolicies(): Promise<void> {
  const { initialize, isInitialized } = useEnterprisePolicyStore.getState();

  if (!isInitialized) {
    await initialize();
  }
}

/**
 * Set up automatic refresh on window focus
 */
export function setupPolicyAutoRefresh(): () => void {
  const handleFocus = () => {
    const { refresh, isInitialized } = useEnterprisePolicyStore.getState();
    if (isInitialized) {
      refresh(false);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }

  return () => {};
}

export default useEnterprisePolicyStore;
