import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CORE_FEATURE_IDS,
  CORE_FEATURES,
  OPTIONAL_MODULE_IDS,
  OPTIONAL_MODULES,
  getCoreFeature,
  getOptionalModule,
  isCoreFeatureId,
  isOptionalModuleId,
} from '@/core/features';

const docPath = resolve(__dirname, '../../../docs/core-features.md');
const doc = readFileSync(docPath, 'utf8');

function tableIds(section: string): string[] {
  const start = doc.indexOf(section);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = doc.indexOf('\n## ', start + section.length);
  const body = next === -1 ? doc.slice(start) : doc.slice(start, next);
  return [...body.matchAll(/^\| ([A-Za-z][A-Za-z0-9-]*) \|/gm)]
    .map((match) => match[1]!)
    .filter((id) => id !== 'Id');
}

describe('core feature catalog', () => {
  it('lists each core id once, in catalog order', () => {
    expect(CORE_FEATURES.map((feature) => feature.id)).toEqual([...CORE_FEATURE_IDS]);
    expect(new Set(CORE_FEATURE_IDS).size).toBe(CORE_FEATURE_IDS.length);
  });

  it('matches the ids and names in docs/core-features.md', () => {
    expect(tableIds('## Core')).toEqual([...CORE_FEATURE_IDS]);
    for (const feature of CORE_FEATURES) {
      expect(doc).toContain(`| ${feature.id} | ${feature.name} |`);
      expect(doc).toContain(feature.summary);
    }
  });

  it('resolves a known id and rejects an unknown one', () => {
    expect(getCoreFeature('print').name).toBe('Print');
    expect(isCoreFeatureId('highlight')).toBe(true);
    expect(isCoreFeatureId('kiosk')).toBe(false);
    expect(() => getCoreFeature('kiosk' as 'print')).toThrow(/Unknown core feature/);
  });
});

describe('optional module catalog', () => {
  it('lists each module once and leaves every module off', () => {
    expect(OPTIONAL_MODULES.map((module) => module.id)).toEqual([...OPTIONAL_MODULE_IDS]);
    expect(new Set(OPTIONAL_MODULE_IDS).size).toBe(OPTIONAL_MODULE_IDS.length);
    for (const module of OPTIONAL_MODULES) {
      expect(module.defaultEnabled).toBe(false);
      expect(module.stores.length).toBeGreaterThan(0);
    }
  });

  it('matches the ids in docs/core-features.md', () => {
    expect(tableIds('## Optional modules')).toEqual([...OPTIONAL_MODULE_IDS]);
    for (const module of OPTIONAL_MODULES) {
      expect(doc).toContain(`| ${module.id} | ${module.name} |`);
    }
  });

  it('does not overlap the core', () => {
    const core = new Set<string>(CORE_FEATURE_IDS);
    for (const id of OPTIONAL_MODULE_IDS) {
      expect(core.has(id)).toBe(false);
    }
  });

  it('resolves a known module and rejects an unknown one', () => {
    expect(getOptionalModule('fileWatch').stores).toEqual(['fileWatchStore']);
    expect(isOptionalModuleId('scanner')).toBe(true);
    expect(isOptionalModuleId('print')).toBe(false);
  });
});
