/**
 * Scan Profiles Manager
 *
 * Save and load scan profiles with different settings
 * for various document types.
 */

import type { ScanProfile, ScanSettings } from './types';

/**
 * Default scan profiles
 */
const DEFAULT_PROFILES: ScanProfile[] = [
  {
    id: 'document-standard',
    name: 'Standard Document',
    description: 'Best for text documents',
    settings: {
      resolution: 300,
      colorMode: 'grayscale',
      paperSize: 'auto',
      brightness: 0,
      contrast: 10,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'document-color',
    name: 'Color Document',
    description: 'Documents with color content',
    settings: {
      resolution: 300,
      colorMode: 'color',
      paperSize: 'auto',
      brightness: 0,
      contrast: 0,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'photo-highres',
    name: 'High-Res Photo',
    description: 'Photos and images',
    settings: {
      resolution: 600,
      colorMode: 'color',
      paperSize: 'auto',
      brightness: 0,
      contrast: 0,
      autoDetect: false,
      autoCorrect: false,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'receipt',
    name: 'Receipt',
    description: 'Receipts and small documents',
    settings: {
      resolution: 200,
      colorMode: 'grayscale',
      paperSize: 'auto',
      brightness: 10,
      contrast: 20,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'archive',
    name: 'Archive Quality',
    description: 'High quality for archival',
    settings: {
      resolution: 600,
      colorMode: 'color',
      paperSize: 'auto',
      brightness: 0,
      contrast: 0,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'draft',
    name: 'Quick Draft',
    description: 'Fast scanning, lower quality',
    settings: {
      resolution: 150,
      colorMode: 'grayscale',
      paperSize: 'auto',
      brightness: 0,
      contrast: 0,
      autoDetect: false,
      autoCorrect: false,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'ocr-optimized',
    name: 'OCR Optimized',
    description: 'Optimized for text recognition',
    settings: {
      resolution: 300,
      colorMode: 'blackwhite',
      paperSize: 'auto',
      brightness: 5,
      contrast: 15,
      autoDetect: true,
      autoCorrect: true,
    },
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const STORAGE_KEY = 'paperflow-scan-profiles';

/**
 * Scan Profiles Manager
 */
export class ScanProfilesManager {
  private profiles: ScanProfile[];

  constructor() {
    this.profiles = this.loadFromStorage();
  }

  /**
   * Load profiles from localStorage
   */
  private loadFromStorage(): ScanProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customProfiles = JSON.parse(stored) as ScanProfile[];
        return [...DEFAULT_PROFILES, ...customProfiles];
      }
    } catch (error) {
      console.error('Failed to load scan profiles:', error);
    }
    return [...DEFAULT_PROFILES];
  }

  /**
   * Save custom profiles to localStorage
   */
  private saveToStorage(): void {
    try {
      const customProfiles = this.profiles.filter((p) => !p.isDefault);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customProfiles));
    } catch (error) {
      console.error('Failed to save scan profiles:', error);
    }
  }

  /**
   * Get all profiles
   */
  getAll(): ScanProfile[] {
    return [...this.profiles];
  }

  /**
   * Get default profiles only
   */
  getDefaultProfiles(): ScanProfile[] {
    return this.profiles.filter((p) => p.isDefault);
  }

  /**
   * Get custom profiles only
   */
  getCustomProfiles(): ScanProfile[] {
    return this.profiles.filter((p) => !p.isDefault);
  }

  /**
   * Get profile by ID
   */
  getById(id: string): ScanProfile | undefined {
    return this.profiles.find((p) => p.id === id);
  }

  /**
   * Create a new profile
   */
  create(
    name: string,
    settings: Partial<ScanSettings>,
    description?: string
  ): ScanProfile {
    const now = Date.now();
    const profile: ScanProfile = {
      id: `custom-${now}`,
      name,
      description,
      settings: {
        resolution: settings.resolution || 300,
        colorMode: settings.colorMode || 'grayscale',
        paperSize: settings.paperSize || 'auto',
        brightness: settings.brightness || 0,
        contrast: settings.contrast || 0,
        autoDetect: settings.autoDetect ?? true,
        autoCorrect: settings.autoCorrect ?? true,
        useADF: settings.useADF ?? false,
        duplex: settings.duplex ?? false,
      },
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.push(profile);
    this.saveToStorage();
    return profile;
  }

  /**
   * Update an existing profile
   */
  update(id: string, updates: Partial<Omit<ScanProfile, 'id' | 'isDefault'>>): ScanProfile | null {
    const index = this.profiles.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const profile = this.profiles[index];
    if (!profile || profile.isDefault) {
      console.warn('Cannot modify default profiles');
      return null;
    }

    const updated: ScanProfile = {
      ...profile,
      ...updates,
      settings: {
        ...profile.settings,
        ...updates.settings,
      },
      updatedAt: Date.now(),
    };
    this.profiles[index] = updated;

    this.saveToStorage();
    return updated;
  }

  /**
   * Delete a profile
   */
  delete(id: string): boolean {
    const index = this.profiles.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const profile = this.profiles[index];
    if (!profile || profile.isDefault) {
      console.warn('Cannot delete default profiles');
      return false;
    }

    this.profiles.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * Duplicate a profile
   */
  duplicate(id: string, newName?: string): ScanProfile | null {
    const original = this.getById(id);
    if (!original) return null;

    return this.create(
      newName || `${original.name} (Copy)`,
      original.settings,
      original.description
    );
  }

  /**
   * Get recommended profile based on document type
   */
  getRecommended(
    documentType: 'document' | 'photo' | 'receipt' | 'archive' | 'ocr'
  ): ScanProfile | undefined {
    const profileMap: Record<string, string> = {
      document: 'document-standard',
      photo: 'photo-highres',
      receipt: 'receipt',
      archive: 'archive',
      ocr: 'ocr-optimized',
    };

    const profileId = profileMap[documentType];
    return profileId ? this.getById(profileId) : undefined;
  }

  /**
   * Export profiles to JSON
   */
  export(): string {
    const customProfiles = this.getCustomProfiles();
    return JSON.stringify(customProfiles, null, 2);
  }

  /**
   * Import profiles from JSON
   */
  import(json: string): number {
    try {
      const imported = JSON.parse(json) as ScanProfile[];
      let count = 0;

      for (const profile of imported) {
        if (profile.name && profile.settings) {
          this.create(
            profile.name,
            profile.settings,
            profile.description
          );
          count++;
        }
      }

      return count;
    } catch (error) {
      console.error('Failed to import profiles:', error);
      return 0;
    }
  }

  /**
   * Reset to default profiles only
   */
  resetToDefaults(): void {
    this.profiles = [...DEFAULT_PROFILES];
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton instance
let instance: ScanProfilesManager | null = null;

export function getScanProfilesManager(): ScanProfilesManager {
  if (!instance) {
    instance = new ScanProfilesManager();
  }
  return instance;
}

export default ScanProfilesManager;
