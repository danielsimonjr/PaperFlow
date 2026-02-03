/**
 * Feature Gating Module (Sprint 21)
 *
 * Controls feature access based on license edition and add-ons.
 */

import type { LicenseEdition, LicenseInfo } from '@/types/license';

/**
 * Feature identifier
 */
export type FeatureId =
  | 'view'
  | 'annotate'
  | 'edit'
  | 'forms'
  | 'sign'
  | 'ocr'
  | 'redact'
  | 'compare'
  | 'batch'
  | 'collaboration'
  | 'audit'
  | 'api'
  | 'cloud_sync'
  | 'advanced_security'
  | 'custom_stamps'
  | 'watermarks'
  | 'headers_footers'
  | 'bates_numbering'
  | 'merge_split'
  | 'compress'
  | 'flatten'
  | 'accessibility'
  | 'export_formats';

/**
 * Feature definition
 */
export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  description: string;
  editions: LicenseEdition[];
  addOnId?: string;
}

/**
 * Feature registry
 * Edition mapping: free, pro, business, enterprise (matching LicenseEdition type)
 */
const FEATURE_REGISTRY: FeatureDefinition[] = [
  {
    id: 'view',
    name: 'View PDFs',
    description: 'Open and view PDF documents',
    editions: ['free', 'pro', 'business', 'enterprise'],
  },
  {
    id: 'annotate',
    name: 'Annotations',
    description: 'Add highlights, notes, and markup',
    editions: ['free', 'pro', 'business', 'enterprise'],
  },
  {
    id: 'edit',
    name: 'Edit Content',
    description: 'Edit text and images in PDFs',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'forms',
    name: 'Form Filling',
    description: 'Fill and save PDF forms',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'sign',
    name: 'Digital Signatures',
    description: 'Sign documents digitally',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'ocr',
    name: 'OCR',
    description: 'Optical character recognition',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'redact',
    name: 'Redaction',
    description: 'Permanently remove sensitive content',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'compare',
    name: 'Document Comparison',
    description: 'Compare two PDF versions',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'batch',
    name: 'Batch Processing',
    description: 'Process multiple files at once',
    editions: ['enterprise'],
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    description: 'Real-time collaboration features',
    editions: ['enterprise'],
  },
  {
    id: 'audit',
    name: 'Audit Trail',
    description: 'Track document changes and access',
    editions: ['enterprise'],
  },
  {
    id: 'api',
    name: 'API Access',
    description: 'Programmatic API access',
    editions: ['enterprise'],
  },
  {
    id: 'cloud_sync',
    name: 'Cloud Sync',
    description: 'Sync with cloud storage providers',
    editions: ['pro', 'business', 'enterprise'],
    addOnId: 'cloud_sync_addon',
  },
  {
    id: 'advanced_security',
    name: 'Advanced Security',
    description: 'Enhanced encryption and DRM',
    editions: ['enterprise'],
  },
  {
    id: 'custom_stamps',
    name: 'Custom Stamps',
    description: 'Create and manage custom stamps',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'watermarks',
    name: 'Watermarks',
    description: 'Add watermarks to documents',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'headers_footers',
    name: 'Headers & Footers',
    description: 'Add headers and footers to pages',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'bates_numbering',
    name: 'Bates Numbering',
    description: 'Add Bates numbers for legal documents',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'merge_split',
    name: 'Merge & Split',
    description: 'Combine and split PDF documents',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'compress',
    name: 'Compression',
    description: 'Reduce PDF file size',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'flatten',
    name: 'Flatten PDF',
    description: 'Flatten annotations and forms',
    editions: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'accessibility',
    name: 'Accessibility Checker',
    description: 'Check PDF/UA compliance',
    editions: ['business', 'enterprise'],
  },
  {
    id: 'export_formats',
    name: 'Export Formats',
    description: 'Export to Word, Excel, PowerPoint',
    editions: ['pro', 'business', 'enterprise'],
  },
];

/**
 * Feature gating class
 */
export class FeatureGating {
  private license: LicenseInfo | null = null;
  private addOns: Set<string> = new Set();

  /**
   * Set current license
   */
  setLicense(license: LicenseInfo | null): void {
    this.license = license;
    this.addOns = new Set(license?.data?.addons || []);
  }

  /**
   * Check if a feature is available
   */
  isFeatureAvailable(featureId: FeatureId): boolean {
    const feature = FEATURE_REGISTRY.find((f) => f.id === featureId);

    if (!feature) {
      return false;
    }

    // No license = free edition only
    if (!this.license) {
      return feature.editions.includes('free');
    }

    // Check if license edition includes feature
    if (!feature.editions.includes(this.license.data.edition)) {
      return false;
    }

    // Check add-on requirement
    if (feature.addOnId && !this.addOns.has(feature.addOnId)) {
      return false;
    }

    // Check license validity
    if (this.license.status !== 'valid' && this.license.status !== 'grace_period') {
      // Only free features available
      return feature.editions.includes('free');
    }

    return true;
  }

  /**
   * Get all available features
   */
  getAvailableFeatures(): FeatureId[] {
    return FEATURE_REGISTRY.filter((f) => this.isFeatureAvailable(f.id)).map((f) => f.id);
  }

  /**
   * Get features for an edition
   */
  static getFeaturesForEdition(edition: LicenseEdition): FeatureId[] {
    return FEATURE_REGISTRY.filter((f) => f.editions.includes(edition)).map((f) => f.id);
  }

  /**
   * Get feature definition
   */
  static getFeatureDefinition(featureId: FeatureId): FeatureDefinition | undefined {
    return FEATURE_REGISTRY.find((f) => f.id === featureId);
  }

  /**
   * Get all feature definitions
   */
  static getAllFeatures(): FeatureDefinition[] {
    return [...FEATURE_REGISTRY];
  }

  /**
   * Get upgrade prompt for a feature
   */
  getUpgradePrompt(featureId: FeatureId): {
    required: LicenseEdition;
    current: LicenseEdition;
    addOnRequired?: string;
  } | null {
    const feature = FEATURE_REGISTRY.find((f) => f.id === featureId);

    if (!feature) {
      return null;
    }

    const currentEdition = this.license?.data?.edition || 'free';

    // Feature available in current edition
    if (feature.editions.includes(currentEdition)) {
      // Check add-on
      if (feature.addOnId && !this.addOns.has(feature.addOnId)) {
        return {
          required: currentEdition,
          current: currentEdition,
          addOnRequired: feature.addOnId,
        };
      }
      return null;
    }

    // Find minimum required edition
    const editionOrder: LicenseEdition[] = ['free', 'pro', 'business', 'enterprise'];
    const requiredEdition = editionOrder.find((e) => feature.editions.includes(e));

    if (!requiredEdition) {
      return null;
    }

    return {
      required: requiredEdition,
      current: currentEdition,
      addOnRequired: feature.addOnId,
    };
  }

  /**
   * Check multiple features
   */
  checkFeatures(featureIds: FeatureId[]): Map<FeatureId, boolean> {
    const result = new Map<FeatureId, boolean>();

    for (const featureId of featureIds) {
      result.set(featureId, this.isFeatureAvailable(featureId));
    }

    return result;
  }

  /**
   * Get features requiring upgrade
   */
  getFeaturesRequiringUpgrade(): FeatureDefinition[] {
    return FEATURE_REGISTRY.filter((f) => !this.isFeatureAvailable(f.id));
  }

  /**
   * Get current edition
   */
  getCurrentEdition(): LicenseEdition {
    return this.license?.data?.edition || 'free';
  }
}

/**
 * Create feature gating instance
 */
export function createFeatureGating(license?: LicenseInfo | null): FeatureGating {
  const gating = new FeatureGating();
  if (license) {
    gating.setLicense(license);
  }
  return gating;
}

/**
 * Global feature gating instance
 */
let globalGating: FeatureGating | null = null;

/**
 * Get global feature gating
 */
export function getGlobalFeatureGating(): FeatureGating {
  if (!globalGating) {
    globalGating = new FeatureGating();
  }
  return globalGating;
}

/**
 * Quick check if feature is available
 */
export function isFeatureAvailable(
  featureId: FeatureId,
  license?: LicenseInfo | null
): boolean {
  if (license !== undefined) {
    const gating = new FeatureGating();
    gating.setLicense(license);
    return gating.isFeatureAvailable(featureId);
  }
  return getGlobalFeatureGating().isFeatureAvailable(featureId);
}

export default FeatureGating;
