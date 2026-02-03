/**
 * Print Presets Manager
 *
 * Handles saving, loading, and managing print presets.
 */

import type { PrintSettings, PrintPreset } from '@stores/printStore';

/**
 * Default presets
 */
const DEFAULT_PRESETS: Omit<PrintPreset, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'draft',
    name: 'Draft',
    description: 'Quick draft printing - grayscale, lower quality',
    settings: {
      color: false,
      quality: 'draft',
      duplex: 'simplex',
      copies: 1,
    },
    isDefault: true,
  },
  {
    id: 'final',
    name: 'Final Document',
    description: 'High quality color printing for final documents',
    settings: {
      color: true,
      quality: 'high',
      duplex: 'simplex',
      copies: 1,
      printBackground: true,
    },
    isDefault: true,
  },
  {
    id: 'eco',
    name: 'Eco Print',
    description: 'Eco-friendly two-sided grayscale printing',
    settings: {
      color: false,
      quality: 'normal',
      duplex: 'longEdge',
      copies: 1,
    },
    isDefault: true,
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Best quality for photo printing',
    settings: {
      color: true,
      quality: 'high',
      duplex: 'simplex',
      scale: 100,
      printBackground: true,
    },
    isDefault: true,
  },
  {
    id: 'booklet',
    name: 'Booklet',
    description: 'Settings optimized for booklet printing',
    settings: {
      landscape: true,
      duplex: 'shortEdge',
      copies: 1,
    },
    isDefault: true,
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Slides with background colors and images',
    settings: {
      color: true,
      quality: 'high',
      landscape: true,
      printBackground: true,
    },
    isDefault: true,
  },
];

/**
 * Storage key for presets
 */
const STORAGE_KEY = 'paperflow-print-presets';

/**
 * Print presets manager
 */
export class PrintPresetsManager {
  /**
   * Get all presets (default + custom)
   */
  static getPresets(): PrintPreset[] {
    const now = Date.now();
    const defaultPresets: PrintPreset[] = DEFAULT_PRESETS.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }));

    const customPresets = this.loadCustomPresets();

    return [...defaultPresets, ...customPresets];
  }

  /**
   * Get default presets only
   */
  static getDefaultPresets(): PrintPreset[] {
    const now = Date.now();
    return DEFAULT_PRESETS.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }));
  }

  /**
   * Get custom presets only
   */
  static getCustomPresets(): PrintPreset[] {
    return this.loadCustomPresets();
  }

  /**
   * Get a preset by ID
   */
  static getPreset(id: string): PrintPreset | undefined {
    return this.getPresets().find((p) => p.id === id);
  }

  /**
   * Save a new custom preset
   */
  static savePreset(
    name: string,
    settings: Partial<PrintSettings>,
    description?: string
  ): PrintPreset {
    const customPresets = this.loadCustomPresets();

    const newPreset: PrintPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      settings,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    customPresets.push(newPreset);
    this.saveCustomPresets(customPresets);

    return newPreset;
  }

  /**
   * Update an existing custom preset
   */
  static updatePreset(
    id: string,
    updates: Partial<Omit<PrintPreset, 'id' | 'createdAt' | 'isDefault'>>
  ): boolean {
    const customPresets = this.loadCustomPresets();
    const index = customPresets.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    const existingPreset = customPresets[index];
    if (existingPreset) {
      customPresets[index] = {
        ...existingPreset,
        ...updates,
        updatedAt: Date.now(),
      };
    }

    this.saveCustomPresets(customPresets);
    return true;
  }

  /**
   * Delete a custom preset
   */
  static deletePreset(id: string): boolean {
    const customPresets = this.loadCustomPresets();
    const initialLength = customPresets.length;
    const filtered = customPresets.filter((p) => p.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    this.saveCustomPresets(filtered);
    return true;
  }

  /**
   * Import presets from JSON
   */
  static importPresets(json: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(json);
      const presets = Array.isArray(data) ? data : [data];
      const customPresets = this.loadCustomPresets();

      for (const preset of presets) {
        if (!preset.name || !preset.settings) {
          errors.push('Invalid preset: missing name or settings');
          continue;
        }

        const newPreset: PrintPreset = {
          id: `imported-${Date.now()}-${imported}`,
          name: preset.name,
          description: preset.description,
          settings: preset.settings,
          isDefault: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        customPresets.push(newPreset);
        imported++;
      }

      this.saveCustomPresets(customPresets);
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error}`);
    }

    return { imported, errors };
  }

  /**
   * Export presets to JSON
   */
  static exportPresets(includeDefaults: boolean = false): string {
    const presets = includeDefaults
      ? this.getPresets()
      : this.getCustomPresets();

    // Strip internal fields for export
    const exportable = presets.map((p) => ({
      name: p.name,
      description: p.description,
      settings: p.settings,
    }));

    return JSON.stringify(exportable, null, 2);
  }

  /**
   * Reset to default presets (removes all custom presets)
   */
  static resetToDefaults(): void {
    this.saveCustomPresets([]);
  }

  /**
   * Load custom presets from storage
   */
  private static loadCustomPresets(): PrintPreset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
    return [];
  }

  /**
   * Save custom presets to storage
   */
  private static saveCustomPresets(presets: PrintPreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }

  /**
   * Suggest a preset based on document type
   */
  static suggestPreset(
    documentType: 'text' | 'graphics' | 'photos' | 'presentation'
  ): string {
    switch (documentType) {
      case 'text':
        return 'draft';
      case 'graphics':
        return 'final';
      case 'photos':
        return 'photos';
      case 'presentation':
        return 'presentation';
      default:
        return 'final';
    }
  }
}

export default PrintPresetsManager;
