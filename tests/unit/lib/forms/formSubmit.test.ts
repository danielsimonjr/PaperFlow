/**
 * Tests for Form Submit Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateSubmitConfig,
  mergeSubmitConfig,
  prepareFieldValues,
  formatForSubmission,
  buildSubmitURL,
  submitForm,
  createPreSubmitValidator,
  getFieldsToReset,
  DEFAULT_SUBMIT_CONFIG,
  DEFAULT_RESET_CONFIG,
  DEFAULT_PRINT_CONFIG,
} from '@/lib/forms/formSubmit';
import type { SubmitConfig, SubmitFieldValue, ResetConfig, SubmitMethod, SubmitFormat } from '@/lib/forms/formSubmit';

describe('Form Submit Module', () => {
  describe('validateSubmitConfig', () => {
    it('should validate valid config with absolute URL', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
        method: 'POST',
        format: 'json',
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid config with relative URL', () => {
      const config: Partial<SubmitConfig> = {
        url: '/api/submit',
        method: 'POST',
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject missing URL', () => {
      const config: Partial<SubmitConfig> = {
        method: 'POST',
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Submit URL is required');
    });

    it('should reject empty URL', () => {
      const config: Partial<SubmitConfig> = {
        url: '',
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Submit URL is required');
    });

    it('should reject invalid URL format', () => {
      const config: Partial<SubmitConfig> = {
        url: 'not a url',
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should reject invalid method', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
        method: 'PUT' as SubmitMethod,
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Method must be GET or POST');
    });

    it('should reject invalid format', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
        format: 'xml' as SubmitFormat,
      };

      const result = validateSubmitConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid submit format');
    });
  });

  describe('mergeSubmitConfig', () => {
    it('should merge with defaults', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
      };

      const merged = mergeSubmitConfig(config);

      expect(merged.url).toBe('https://example.com/submit');
      expect(merged.method).toBe('POST');
      expect(merged.format).toBe('json');
      expect(merged.includeEmptyFields).toBe(false);
    });

    it('should override defaults', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
        method: 'GET',
        format: 'fdf',
        includeEmptyFields: true,
      };

      const merged = mergeSubmitConfig(config);

      expect(merged.method).toBe('GET');
      expect(merged.format).toBe('fdf');
      expect(merged.includeEmptyFields).toBe(true);
    });

    it('should merge headers', () => {
      const config: Partial<SubmitConfig> = {
        url: 'https://example.com/submit',
        headers: { 'X-Custom': 'value' },
      };

      const merged = mergeSubmitConfig(config);

      expect(merged.headers).toEqual({ 'X-Custom': 'value' });
    });
  });

  describe('prepareFieldValues', () => {
    it('should prepare field values', () => {
      const fieldValues = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
      };
      const fieldTypes = {
        name: 'text',
        email: 'text',
        age: 'number',
      };
      const config = mergeSubmitConfig({ url: 'https://example.com' });

      const result = prepareFieldValues(fieldValues, fieldTypes, config);

      expect(result).toHaveLength(3);
      expect(result.find((f) => f.name === 'name')?.value).toBe('John');
      expect(result.find((f) => f.name === 'age')?.type).toBe('number');
    });

    it('should skip empty fields by default', () => {
      const fieldValues = {
        name: 'John',
        email: '',
        phone: null,
      };
      const config = mergeSubmitConfig({ url: 'https://example.com' });

      const result = prepareFieldValues(fieldValues, {}, config);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('name');
    });

    it('should include empty fields when configured', () => {
      const fieldValues = {
        name: 'John',
        email: '',
      };
      const config = mergeSubmitConfig({
        url: 'https://example.com',
        includeEmptyFields: true,
      });

      const result = prepareFieldValues(fieldValues, {}, config);

      expect(result).toHaveLength(2);
    });

    it('should apply field mapping', () => {
      const fieldValues = {
        userName: 'John',
      };
      const config = mergeSubmitConfig({
        url: 'https://example.com',
        fieldMapping: { userName: 'user_name' },
      });

      const result = prepareFieldValues(fieldValues, {}, config);

      expect(result[0].name).toBe('user_name');
    });
  });

  describe('formatForSubmission', () => {
    const sampleFields: SubmitFieldValue[] = [
      { name: 'name', value: 'John', type: 'text' },
      { name: 'age', value: 25, type: 'number' },
      { name: 'active', value: true, type: 'checkbox' },
    ];

    it('should format as JSON', () => {
      const result = formatForSubmission(sampleFields, 'json');

      expect(result).toEqual({
        name: 'John',
        age: 25,
        active: true,
      });
    });

    it('should format as FormData (html)', () => {
      const result = formatForSubmission(sampleFields, 'html');

      expect(result).toBeInstanceOf(FormData);
      expect((result as FormData).get('name')).toBe('John');
      expect((result as FormData).get('age')).toBe('25');
    });

    it('should format array values in FormData', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'tags', value: ['a', 'b', 'c'], type: 'multiselect' },
      ];

      const result = formatForSubmission(fields, 'html') as FormData;

      expect(result.getAll('tags')).toEqual(['a', 'b', 'c']);
    });

    it('should format as FDF', () => {
      const result = formatForSubmission(sampleFields, 'fdf') as string;

      expect(result).toContain('%FDF-1.2');
      expect(result).toContain('/T (name)');
      expect(result).toContain('/V (John)');
      expect(result).toContain('%%EOF');
    });

    it('should escape special characters in FDF', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'comment', value: 'Hello (world)', type: 'text' },
      ];

      const result = formatForSubmission(fields, 'fdf') as string;

      expect(result).toContain('Hello \\(world\\)');
    });

    it('should format as XFDF', () => {
      const result = formatForSubmission(sampleFields, 'xfdf') as string;

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<xfdf');
      expect(result).toContain('<field name="name">');
      expect(result).toContain('<value>John</value>');
    });

    it('should escape XML special characters in XFDF', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'comment', value: '<script>alert("test")</script>', type: 'text' },
      ];

      const result = formatForSubmission(fields, 'xfdf') as string;

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;test&quot;');
    });

    it('should handle null values in formats', () => {
      const fields: SubmitFieldValue[] = [{ name: 'empty', value: null, type: 'text' }];

      const fdf = formatForSubmission(fields, 'fdf') as string;
      const xfdf = formatForSubmission(fields, 'xfdf') as string;

      expect(fdf).toContain('/V ()');
      expect(xfdf).toContain('<value></value>');
    });
  });

  describe('buildSubmitURL', () => {
    it('should build URL with query params', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'name', value: 'John', type: 'text' },
        { name: 'age', value: 25, type: 'number' },
      ];

      const url = buildSubmitURL('https://example.com/submit', fields);

      expect(url).toBe('https://example.com/submit?name=John&age=25');
    });

    it('should append to existing query params', () => {
      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];

      const url = buildSubmitURL('https://example.com/submit?id=1', fields);

      expect(url).toBe('https://example.com/submit?id=1&name=John');
    });

    it('should handle array values', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'tags', value: ['a', 'b'], type: 'multiselect' },
      ];

      const url = buildSubmitURL('https://example.com/submit', fields);

      expect(url).toContain('tags=a');
      expect(url).toContain('tags=b');
    });

    it('should skip null values', () => {
      const fields: SubmitFieldValue[] = [
        { name: 'name', value: 'John', type: 'text' },
        { name: 'empty', value: null, type: 'text' },
      ];

      const url = buildSubmitURL('https://example.com/submit', fields);

      expect(url).toBe('https://example.com/submit?name=John');
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should submit form with POST and JSON', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true }),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({ url: 'https://example.com/submit' });

      const result = await submitForm(fields, config);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/submit',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should submit form with GET', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({
        url: 'https://example.com/submit',
        method: 'GET',
      });

      const result = await submitForm(fields, config);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/submit?name=John',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle FDF format submission', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({
        url: 'https://example.com/submit',
        format: 'fdf',
      });

      await submitForm(fields, config);

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/submit',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/vnd.fdf',
          }),
        })
      );
    });

    it('should handle XFDF format submission', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('OK'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({
        url: 'https://example.com/submit',
        format: 'xfdf',
      });

      await submitForm(fields, config);

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/submit',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/vnd.adobe.xfdf',
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({ url: 'https://example.com/submit' });

      const result = await submitForm(fields, config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue('Invalid data'),
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];
      const config = mergeSubmitConfig({ url: 'https://example.com/submit' });

      const result = await submitForm(fields, config);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('createPreSubmitValidator', () => {
    it('should validate required fields are present', () => {
      const validator = createPreSubmitValidator(['name', 'email']);
      const fields: SubmitFieldValue[] = [
        { name: 'name', value: 'John', type: 'text' },
        { name: 'email', value: 'john@example.com', type: 'text' },
      ];

      const result = validator(fields);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required field is missing', () => {
      const validator = createPreSubmitValidator(['name', 'email']);
      const fields: SubmitFieldValue[] = [{ name: 'name', value: 'John', type: 'text' }];

      const result = validator(fields);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fieldName).toBe('email');
    });

    it('should fail when required field is empty', () => {
      const validator = createPreSubmitValidator(['name', 'email']);
      const fields: SubmitFieldValue[] = [
        { name: 'name', value: 'John', type: 'text' },
        { name: 'email', value: '', type: 'text' },
      ];

      const result = validator(fields);

      expect(result.valid).toBe(false);
      expect(result.errors[0].fieldName).toBe('email');
    });

    it('should fail when required field is null', () => {
      const validator = createPreSubmitValidator(['name']);
      const fields: SubmitFieldValue[] = [{ name: 'name', value: null, type: 'text' }];

      const result = validator(fields);

      expect(result.valid).toBe(false);
    });
  });

  describe('getFieldsToReset', () => {
    it('should return all fields when scope is all', () => {
      const allFieldIds = ['field1', 'field2', 'field3'];
      const config: ResetConfig = { scope: 'all', confirm: true };

      const result = getFieldsToReset(allFieldIds, config);

      expect(result).toEqual(allFieldIds);
    });

    it('should return selected fields when scope is selected', () => {
      const allFieldIds = ['field1', 'field2', 'field3'];
      const config: ResetConfig = {
        scope: 'selected',
        fieldIds: ['field1', 'field3'],
        confirm: true,
      };

      const result = getFieldsToReset(allFieldIds, config);

      expect(result).toEqual(['field1', 'field3']);
    });

    it('should return empty array when scope is selected but no fieldIds', () => {
      const allFieldIds = ['field1', 'field2', 'field3'];
      const config: ResetConfig = { scope: 'selected', confirm: true };

      const result = getFieldsToReset(allFieldIds, config);

      expect(result).toEqual([]);
    });
  });

  describe('Default configurations', () => {
    it('should have sensible DEFAULT_SUBMIT_CONFIG', () => {
      expect(DEFAULT_SUBMIT_CONFIG.method).toBe('POST');
      expect(DEFAULT_SUBMIT_CONFIG.format).toBe('json');
      expect(DEFAULT_SUBMIT_CONFIG.includeEmptyFields).toBe(false);
      expect(DEFAULT_SUBMIT_CONFIG.target).toBe('_self');
    });

    it('should have sensible DEFAULT_RESET_CONFIG', () => {
      expect(DEFAULT_RESET_CONFIG.scope).toBe('all');
      expect(DEFAULT_RESET_CONFIG.confirm).toBe(true);
      expect(DEFAULT_RESET_CONFIG.confirmMessage).toBeDefined();
    });

    it('should have sensible DEFAULT_PRINT_CONFIG', () => {
      expect(DEFAULT_PRINT_CONFIG.pages).toBe('all');
      expect(DEFAULT_PRINT_CONFIG.includeAnnotations).toBe(true);
      expect(DEFAULT_PRINT_CONFIG.includeFlattenedFields).toBe(true);
    });
  });
});
