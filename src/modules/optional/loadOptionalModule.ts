import type { ComponentType } from 'react';
import { OPTIONAL_MODULE_IDS, type OptionalModuleId } from '@/core/features';

/**
 * The panel a loaded optional module renders.
 */
export interface OptionalModuleBundle {
  OptionalModulePanel: ComponentType;
}

const loaders: Record<OptionalModuleId, () => Promise<OptionalModuleBundle>> = {
  enterprise: () => import('./entries/enterprise'),
  license: () => import('./entries/license'),
  kiosk: () => import('./entries/kiosk'),
  lan: () => import('./entries/lan'),
  scanner: () => import('./entries/scanner'),
  batch: () => import('./entries/batch'),
  comparison: () => import('./entries/comparison'),
  fileWatch: () => import('./entries/fileWatch'),
};

/**
 * Load one optional module. The caller checks the setting before this call.
 */
export function loadOptionalModule(id: OptionalModuleId): Promise<OptionalModuleBundle> {
  return loaders[id]();
}

/**
 * The ids this loader can fetch, in catalog order.
 */
export const LOADABLE_OPTIONAL_MODULE_IDS = OPTIONAL_MODULE_IDS;
