/**
 * Registry Access Tests
 *
 * Tests for Windows registry reading functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registryAccess,
  setMockRegistryValue,
  setMockRegistryValues,
  clearMockRegistryValues,
  getMockRegistryValue,
  convertRegistryValue,
  POLICY_PATHS,
  isWindows,
} from '@lib/enterprise/registryAccess';

describe('registryAccess', () => {
  beforeEach(() => {
    clearMockRegistryValues();
  });

  afterEach(() => {
    clearMockRegistryValues();
  });

  describe('POLICY_PATHS', () => {
    it('should define correct registry paths', () => {
      expect(POLICY_PATHS.application).toBe('SOFTWARE\\Policies\\PaperFlow\\Application');
      expect(POLICY_PATHS.security).toBe('SOFTWARE\\Policies\\PaperFlow\\Security');
      expect(POLICY_PATHS.features).toBe('SOFTWARE\\Policies\\PaperFlow\\Features');
      expect(POLICY_PATHS.updates).toBe('SOFTWARE\\Policies\\PaperFlow\\Updates');
      expect(POLICY_PATHS.network).toBe('SOFTWARE\\Policies\\PaperFlow\\Network');
      expect(POLICY_PATHS.performance).toBe('SOFTWARE\\Policies\\PaperFlow\\Performance');
    });
  });

  describe('mock registry values', () => {
    it('should set and get mock values', () => {
      setMockRegistryValue('HKLM\\TEST\\Key', 'value');

      const value = getMockRegistryValue('HKLM\\TEST\\Key');
      expect(value).toBe('value');
    });

    it('should return undefined for non-existent keys', () => {
      const value = getMockRegistryValue('HKLM\\NONEXISTENT\\Key');
      expect(value).toBeUndefined();
    });

    it('should set multiple mock values', () => {
      setMockRegistryValues({
        'HKLM\\TEST\\Key1': 'value1',
        'HKLM\\TEST\\Key2': 42,
        'HKCU\\TEST\\Key3': true,
      });

      expect(getMockRegistryValue('HKLM\\TEST\\Key1')).toBe('value1');
      expect(getMockRegistryValue('HKLM\\TEST\\Key2')).toBe(42);
      expect(getMockRegistryValue('HKCU\\TEST\\Key3')).toBe(true);
    });

    it('should clear all mock values', () => {
      setMockRegistryValues({
        'HKLM\\TEST\\Key1': 'value1',
        'HKLM\\TEST\\Key2': 'value2',
      });

      clearMockRegistryValues();

      expect(getMockRegistryValue('HKLM\\TEST\\Key1')).toBeUndefined();
      expect(getMockRegistryValue('HKLM\\TEST\\Key2')).toBeUndefined();
    });
  });

  describe('readString', () => {
    it('should read string value from mock', async () => {
      setMockRegistryValue('HKLM\\TEST\\Path\\StringValue', 'test-string');

      const result = await registryAccess.readString('TEST\\Path', 'StringValue');

      expect(result.exists).toBe(true);
      expect(result.value).toBe('test-string');
      expect(result.type).toBe('REG_SZ');
      expect(result.hive).toBe('HKLM');
    });

    it('should return exists=false for non-existent value', async () => {
      const result = await registryAccess.readString('TEST\\Path', 'NonExistent');

      expect(result.exists).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should use default value when not found', async () => {
      const result = await registryAccess.readString(
        'TEST\\Path',
        'NonExistent',
        { defaultValue: 'default' }
      );

      expect(result.exists).toBe(false);
      expect(result.value).toBe('default');
    });
  });

  describe('readDword', () => {
    it('should read DWORD value from mock', async () => {
      setMockRegistryValue('HKLM\\TEST\\Path\\DwordValue', 42);

      const result = await registryAccess.readDword('TEST\\Path', 'DwordValue');

      expect(result.exists).toBe(true);
      expect(result.value).toBe(42);
      expect(result.type).toBe('REG_DWORD');
    });

    it('should return exists=false for non-existent value', async () => {
      const result = await registryAccess.readDword('TEST\\Path', 'NonExistent');

      expect(result.exists).toBe(false);
      expect(result.value).toBeNull();
    });
  });

  describe('readMultiString', () => {
    it('should read multi-string value from mock', async () => {
      setMockRegistryValue('HKLM\\TEST\\Path\\MultiValue', ['one', 'two', 'three']);

      const result = await registryAccess.readMultiString('TEST\\Path', 'MultiValue');

      expect(result.exists).toBe(true);
      expect(result.value).toEqual(['one', 'two', 'three']);
      expect(result.type).toBe('REG_MULTI_SZ');
    });
  });

  describe('preferMachine option', () => {
    it('should prefer HKLM over HKCU by default', async () => {
      setMockRegistryValues({
        'HKLM\\TEST\\Path\\Value': 'machine-value',
        'HKCU\\TEST\\Path\\Value': 'user-value',
      });

      const result = await registryAccess.readString('TEST\\Path', 'Value');

      expect(result.value).toBe('machine-value');
      expect(result.hive).toBe('HKLM');
    });

    it('should prefer HKCU when preferMachine is false', async () => {
      setMockRegistryValues({
        'HKLM\\TEST\\Path\\Value': 'machine-value',
        'HKCU\\TEST\\Path\\Value': 'user-value',
      });

      const result = await registryAccess.readString(
        'TEST\\Path',
        'Value',
        { preferMachine: false }
      );

      expect(result.value).toBe('user-value');
      expect(result.hive).toBe('HKCU');
    });

    it('should fall back to HKCU when HKLM not found', async () => {
      setMockRegistryValue('HKCU\\TEST\\Path\\Value', 'user-value');

      const result = await registryAccess.readString('TEST\\Path', 'Value');

      expect(result.value).toBe('user-value');
      expect(result.hive).toBe('HKCU');
    });
  });

  describe('convertRegistryValue', () => {
    describe('string conversion', () => {
      it('should convert number to string', () => {
        expect(convertRegistryValue(42, 'string')).toBe('42');
      });

      it('should convert boolean to string', () => {
        expect(convertRegistryValue(true, 'string')).toBe('true');
      });

      it('should return null for null input', () => {
        expect(convertRegistryValue(null, 'string')).toBeNull();
      });
    });

    describe('number conversion', () => {
      it('should convert string to number', () => {
        expect(convertRegistryValue('42', 'number')).toBe(42);
      });

      it('should return null for non-numeric string', () => {
        expect(convertRegistryValue('abc', 'number')).toBeNull();
      });

      it('should handle floating point strings', () => {
        expect(convertRegistryValue('3.14', 'number')).toBe(3.14);
      });
    });

    describe('boolean conversion', () => {
      it('should convert number to boolean', () => {
        expect(convertRegistryValue(1, 'boolean')).toBe(true);
        expect(convertRegistryValue(0, 'boolean')).toBe(false);
      });

      it('should convert string to boolean', () => {
        expect(convertRegistryValue('true', 'boolean')).toBe(true);
        expect(convertRegistryValue('false', 'boolean')).toBe(false);
        expect(convertRegistryValue('1', 'boolean')).toBe(true);
        expect(convertRegistryValue('0', 'boolean')).toBe(false);
      });

      it('should pass through boolean values', () => {
        expect(convertRegistryValue(true, 'boolean')).toBe(true);
        expect(convertRegistryValue(false, 'boolean')).toBe(false);
      });

      it('should return null for invalid boolean string', () => {
        expect(convertRegistryValue('invalid', 'boolean')).toBeNull();
      });
    });

    describe('string array conversion', () => {
      it('should pass through arrays', () => {
        expect(convertRegistryValue(['a', 'b', 'c'], 'string[]')).toEqual(['a', 'b', 'c']);
      });

      it('should split comma-separated strings', () => {
        expect(convertRegistryValue('a, b, c', 'string[]')).toEqual(['a', 'b', 'c']);
      });

      it('should convert single value to array', () => {
        const result = convertRegistryValue('single', 'string[]');
        expect(result).toEqual(['single']);
      });
    });
  });

  describe('readAllValues', () => {
    it('should read all values under a path', async () => {
      setMockRegistryValues({
        'HKLM\\TEST\\Path\\Value1': 'string',
        'HKLM\\TEST\\Path\\Value2': 42,
        'HKLM\\TEST\\Path\\Value3': true,
        'HKLM\\OTHER\\Path\\Value': 'other',
      });

      const values = await registryAccess.readAllValues('TEST\\Path', 'HKLM');

      expect(Object.keys(values)).toHaveLength(3);
      expect(values.Value1.value).toBe('string');
      expect(values.Value2.value).toBe(42);
      expect(values.Value3.value).toBe(true);
    });
  });

  describe('keyExists', () => {
    it('should return true when key has values', async () => {
      setMockRegistryValue('HKLM\\TEST\\Path\\Value', 'data');

      const exists = await registryAccess.keyExists('TEST\\Path', 'HKLM');

      expect(exists).toBe(true);
    });

    it('should return false when key has no values', async () => {
      const exists = await registryAccess.keyExists('NONEXISTENT\\Path', 'HKLM');

      expect(exists).toBe(false);
    });
  });

  describe('isWindows', () => {
    it('should return a boolean', () => {
      const result = isWindows();
      expect(typeof result).toBe('boolean');
    });
  });
});
