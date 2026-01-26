import { describe, it, expect } from 'vitest';
import {
  parseFormData,
  validateImportedData,
  getImportAcceptString,
} from '@lib/forms/importData';

describe('importData', () => {
  describe('parseFormData', () => {
    it('should parse JSON data', () => {
      const jsonContent = JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = parseFormData(jsonContent, 'json');

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should auto-detect JSON format', () => {
      const jsonContent = JSON.stringify({ name: 'Test' });

      const result = parseFormData(jsonContent, 'auto', 'data.json');

      expect(result).toEqual({ name: 'Test' });
    });

    it('should auto-detect XFDF format from XML content', () => {
      const xfdfContent = `<?xml version="1.0" encoding="UTF-8"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields>
            <field name="firstName">
              <value>John</value>
            </field>
          </fields>
        </xfdf>`;

      const result = parseFormData(xfdfContent, 'auto');

      expect(result.firstName).toBe('John');
    });

    it('should handle JSON with metadata format', () => {
      const jsonContent = JSON.stringify({
        firstName: { value: 'John', type: 'text' },
      });

      const result = parseFormData(jsonContent, 'json');

      expect(result.firstName).toBe('John');
    });
  });

  describe('validateImportedData', () => {
    it('should identify valid keys', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        unknown: 'value',
      };
      const fieldNames = ['firstName', 'lastName', 'email'];

      const result = validateImportedData(data, fieldNames);

      expect(result.valid).toContain('firstName');
      expect(result.valid).toContain('lastName');
      expect(result.valid).not.toContain('unknown');
    });

    it('should identify unknown keys', () => {
      const data = {
        firstName: 'John',
        unknownField: 'value',
      };
      const fieldNames = ['firstName', 'lastName'];

      const result = validateImportedData(data, fieldNames);

      expect(result.unknown).toContain('unknownField');
    });

    it('should return empty arrays for empty data', () => {
      const result = validateImportedData({}, ['firstName']);

      expect(result.valid).toHaveLength(0);
      expect(result.unknown).toHaveLength(0);
    });
  });

  describe('getImportAcceptString', () => {
    it('should return accept string with all supported formats', () => {
      const acceptString = getImportAcceptString();

      expect(acceptString).toContain('.json');
      expect(acceptString).toContain('.fdf');
      expect(acceptString).toContain('.xfdf');
      expect(acceptString).toContain('application/json');
    });
  });
});
