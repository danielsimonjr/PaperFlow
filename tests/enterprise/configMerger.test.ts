/**
 * Configuration Merger Tests (Sprint 20)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigMerger, mergeConfigs } from '@lib/enterprise/configMerger';

describe('ConfigMerger', () => {
  let merger: ConfigMerger;

  beforeEach(() => {
    merger = new ConfigMerger();
  });

  describe('basic merging', () => {
    it('should include defaults in merged config', () => {
      const result = merger.merge();

      expect(result.config).toBeDefined();
      expect(result.config.application).toBeDefined();
      expect(result.config.application?.defaultZoom).toBeDefined();
    });

    it('should merge user config over defaults', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');

      const result = merger.merge();

      expect(result.config.application?.defaultZoom).toBe(150);
    });

    it('should merge file config over user config', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');
      merger.addConfig({ application: { defaultZoom: 200 } }, 'file');

      const result = merger.merge();

      expect(result.config.application?.defaultZoom).toBe(200);
    });

    it('should merge GPO config with highest priority', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');
      merger.addConfig({ application: { defaultZoom: 200 } }, 'file');
      merger.addConfig({ application: { defaultZoom: 100 } }, 'gpo');

      const result = merger.merge();

      expect(result.config.application?.defaultZoom).toBe(100);
    });
  });

  describe('deep merging', () => {
    it('should deep merge nested objects', () => {
      merger.addConfig(
        {
          application: {
            defaultZoom: 150,
          },
        },
        'user'
      );
      merger.addConfig(
        {
          application: {
            defaultViewMode: 'continuous',
          },
        },
        'file'
      );

      const result = merger.merge();

      expect(result.config.application?.defaultZoom).toBe(150);
      expect(result.config.application?.defaultViewMode).toBe('continuous');
    });

    it('should preserve nested values not overridden', () => {
      merger.addConfig(
        {
          security: {
            requireEncryption: true,
            minEncryptionLevel: 'AES-256',
          },
        },
        'user'
      );
      merger.addConfig(
        {
          security: {
            requireEncryption: false,
          },
        },
        'file'
      );

      const result = merger.merge();

      expect(result.config.security?.requireEncryption).toBe(false);
      expect(result.config.security?.minEncryptionLevel).toBe('AES-256');
    });
  });

  describe('source tracking', () => {
    it('should track source of each value', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user', '/home/user/.config');

      const result = merger.merge();

      expect(result.sources.get('application.defaultZoom')).toBe('user');
    });

    it('should update source when value is overridden', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');
      merger.addConfig({ application: { defaultZoom: 200 } }, 'file');

      const result = merger.merge();

      expect(result.sources.get('application.defaultZoom')).toBe('file');
    });
  });

  describe('conflict tracking', () => {
    it('should record merge conflicts', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');
      merger.addConfig({ application: { defaultZoom: 200 } }, 'file');

      const result = merger.merge();

      expect(result.conflicts.length).toBeGreaterThan(0);
      const conflict = result.conflicts.find((c) => c.path === 'application.defaultZoom');
      expect(conflict).toBeDefined();
      expect(conflict?.previousValue).toBe(150);
      expect(conflict?.newValue).toBe(200);
    });
  });

  describe('array merging', () => {
    it('should replace arrays by default', () => {
      merger.addConfig({ features: { toolbarItems: ['view', 'zoom'] } }, 'user');
      merger.addConfig({ features: { toolbarItems: ['print', 'save'] } }, 'file');

      const result = merger.merge();

      expect(result.config.features?.toolbarItems).toEqual(['print', 'save']);
    });

    it('should concat arrays when configured', () => {
      const concatMerger = new ConfigMerger({ arrayMergeStrategy: 'concat' });
      concatMerger.addConfig({ features: { toolbarItems: ['view', 'zoom'] } }, 'user');
      concatMerger.addConfig({ features: { toolbarItems: ['print', 'save'] } }, 'file');

      const result = concatMerger.merge();

      expect(result.config.features?.toolbarItems).toEqual(['view', 'zoom', 'print', 'save']);
    });

    it('should union arrays when configured', () => {
      const unionMerger = new ConfigMerger({ arrayMergeStrategy: 'union' });
      unionMerger.addConfig({ features: { toolbarItems: ['view', 'zoom'] } }, 'user');
      unionMerger.addConfig({ features: { toolbarItems: ['view', 'print'] } }, 'file');

      const result = unionMerger.merge();

      expect(result.config.features?.toolbarItems).toEqual(['view', 'zoom', 'print']);
    });
  });

  describe('clear', () => {
    it('should clear all configs except defaults', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user');
      merger.addConfig({ application: { defaultZoom: 200 } }, 'file');

      merger.clear();
      const result = merger.merge();

      expect(result.sources.get('application.defaultZoom')).not.toBe('user');
      expect(result.sources.get('application.defaultZoom')).not.toBe('file');
    });
  });

  describe('getValueInfo', () => {
    it('should return value info with source', () => {
      merger.addConfig({ application: { defaultZoom: 150 } }, 'user', '/path/to/config');

      const info = merger.getValueInfo('application.defaultZoom');

      expect(info.value).toBe(150);
      expect(info.source).toBe('user');
      expect(info.sourcePath).toBe('/path/to/config');
    });

    it('should return undefined for non-existent paths', () => {
      const info = merger.getValueInfo('nonexistent.path');

      expect(info.value).toBeUndefined();
      expect(info.source).toBeNull();
    });
  });
});

describe('mergeConfigs', () => {
  it('should merge multiple configs', () => {
    const result = mergeConfigs([
      { config: { application: { defaultZoom: 100 } }, source: 'default' },
      { config: { application: { defaultZoom: 150 } }, source: 'user' },
      { config: { application: { defaultViewMode: 'continuous' } }, source: 'file' },
    ]);

    expect(result.config.application?.defaultZoom).toBe(150);
    expect(result.config.application?.defaultViewMode).toBe('continuous');
  });

  it('should respect precedence order', () => {
    const result = mergeConfigs([
      { config: { application: { defaultZoom: 150 } }, source: 'user' },
      { config: { application: { defaultZoom: 100 } }, source: 'gpo' },
    ]);

    expect(result.config.application?.defaultZoom).toBe(100);
    expect(result.sources.get('application.defaultZoom')).toBe('gpo');
  });
});
