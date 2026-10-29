/**
 * Stable ids of the core PaperFlow features, in display order.
 * This list is the product boundary for the default app.
 */
export const CORE_FEATURE_IDS = [
  'page-navigation',
  'pages-toc-sidebar',
  'zoom-fit',
  'rotate',
  'draw',
  'highlight',
  'text-notes',
  'signatures',
  'pdf-dark-mode',
  'export-save',
  'print',
  'drag-drop-open',
] as const;

/**
 * One id from {@link CORE_FEATURE_IDS}.
 */
export type CoreFeatureId = (typeof CORE_FEATURE_IDS)[number];

/**
 * One core feature. `id` stays stable. `summary` states the behavior.
 */
export interface CoreFeature {
  id: CoreFeatureId;
  name: string;
  summary: string;
}

/**
 * The core feature catalog. This array is the source of truth.
 * `docs/core-features.md` lists the same ids in the same order.
 */
export const CORE_FEATURES: readonly CoreFeature[] = [
  {
    id: 'page-navigation',
    name: 'Page navigation',
    summary: 'Move between pages with controls and keyboard shortcuts.',
  },
  {
    id: 'pages-toc-sidebar',
    name: 'Pages and contents sidebar',
    summary: 'Show or hide a sidebar of page thumbnails and the table of contents.',
  },
  {
    id: 'zoom-fit',
    name: 'Zoom and fit',
    summary: 'Zoom the page, and fit the page to the view.',
  },
  {
    id: 'rotate',
    name: 'Rotate',
    summary: 'Rotate the current page.',
  },
  {
    id: 'draw',
    name: 'Draw',
    summary: 'Draw with a chosen color, then move or recolor an existing drawing.',
  },
  {
    id: 'highlight',
    name: 'Highlight',
    summary: 'Highlight selected text.',
  },
  {
    id: 'text-notes',
    name: 'Text notes',
    summary: 'Add a text note on the page.',
  },
  {
    id: 'signatures',
    name: 'Signatures',
    summary:
      'Sign by drawing, by uploading an image, or by camera. The camera capture mirrors the frame so the ink reads correctly. Saved signatures stay available for reuse.',
  },
  {
    id: 'pdf-dark-mode',
    name: 'PDF dark mode',
    summary: 'Dark mode inverts the PDF page itself, not only the surrounding chrome.',
  },
  {
    id: 'export-save',
    name: 'Export and save',
    summary: 'Save the document and export it.',
  },
  {
    id: 'print',
    name: 'Print',
    summary: 'Print the open document.',
  },
  {
    id: 'drag-drop-open',
    name: 'Drag and drop open',
    summary: 'Open a PDF by dropping the file on the app.',
  },
];

/**
 * Stable ids of optional modules. Each module stays off unless a setting turns it on.
 */
export const OPTIONAL_MODULE_IDS = [
  'enterprise',
  'license',
  'kiosk',
  'lan',
  'scanner',
  'batch',
  'comparison',
  'fileWatch',
] as const;

/**
 * One id from {@link OPTIONAL_MODULE_IDS}.
 */
export type OptionalModuleId = (typeof OPTIONAL_MODULE_IDS)[number];

/**
 * One optional module. `defaultEnabled` is false for every module.
 * `stores` names the Zustand stores that belong to the module.
 */
export interface OptionalModule {
  id: OptionalModuleId;
  name: string;
  summary: string;
  stores: readonly string[];
  defaultEnabled: false;
}

/**
 * Optional modules. They stay in the repo and load only when enabled.
 */
export const OPTIONAL_MODULES: readonly OptionalModule[] = [
  {
    id: 'enterprise',
    name: 'Enterprise',
    summary: 'Managed policy, locked settings, and configuration export.',
    stores: ['enterprisePolicyStore'],
    defaultEnabled: false,
  },
  {
    id: 'license',
    name: 'License',
    summary: 'License storage, feature gating, and hardware fingerprint checks.',
    stores: ['licenseStore'],
    defaultEnabled: false,
  },
  {
    id: 'kiosk',
    name: 'Kiosk',
    summary: 'A locked-down kiosk shell for unattended reading.',
    stores: ['kioskStore'],
    defaultEnabled: false,
  },
  {
    id: 'lan',
    name: 'LAN',
    summary: 'Share a document with other devices on the local network.',
    stores: ['lanStore'],
    defaultEnabled: false,
  },
  {
    id: 'scanner',
    name: 'Scanner',
    summary: 'Scan pages from a connected scanner.',
    stores: ['scannerStore'],
    defaultEnabled: false,
  },
  {
    id: 'batch',
    name: 'Batch',
    summary: 'Queue batch jobs such as watermarks, Bates numbers, and headers.',
    stores: ['batchStore', 'nativeBatchStore'],
    defaultEnabled: false,
  },
  {
    id: 'comparison',
    name: 'Comparison',
    summary: 'Compare two documents side by side or as an overlay.',
    stores: ['comparisonStore'],
    defaultEnabled: false,
  },
  {
    id: 'fileWatch',
    name: 'File watch',
    summary: 'Watch the open file and reload it after an external change.',
    stores: ['fileWatchStore'],
    defaultEnabled: false,
  },
];

/**
 * Return the core feature for `id`.
 */
export function getCoreFeature(id: CoreFeatureId): CoreFeature {
  const feature = CORE_FEATURES.find((item) => item.id === id);
  if (!feature) {
    throw new Error(`Unknown core feature: ${id}`);
  }
  return feature;
}

/**
 * Report whether `value` is a core feature id.
 */
export function isCoreFeatureId(value: string): value is CoreFeatureId {
  return (CORE_FEATURE_IDS as readonly string[]).includes(value);
}

/**
 * Return the default flag map. Every optional module is off.
 */
export function defaultOptionalModuleFlags(): Record<OptionalModuleId, false> {
  return Object.fromEntries(
    OPTIONAL_MODULES.map((module) => [module.id, false])
  ) as Record<OptionalModuleId, false>;
}

/**
 * Return the optional module for `id`.
 */
export function getOptionalModule(id: OptionalModuleId): OptionalModule {
  const module = OPTIONAL_MODULES.find((item) => item.id === id);
  if (!module) {
    throw new Error(`Unknown optional module: ${id}`);
  }
  return module;
}

/**
 * Report whether `value` is an optional module id.
 */
export function isOptionalModuleId(value: string): value is OptionalModuleId {
  return (OPTIONAL_MODULE_IDS as readonly string[]).includes(value);
}
