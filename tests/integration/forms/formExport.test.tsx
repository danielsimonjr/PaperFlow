import { describe, it, expect } from 'vitest';
import { generateFDF, parseFDF } from '@lib/forms/fdfExport';
import { generateXFDF, parseXFDF } from '@lib/forms/xfdfExport';
import { exportValuesToJSON, parseJSON } from '@lib/forms/exportImport';
import { parseFormData, validateImportedData } from '@lib/forms/importData';
import type { FormField, TextFormField, CheckboxFormField, DropdownFormField } from '@/types/forms';

describe('Form Export/Import Integration', () => {
  const mockFields: FormField[] = [
    {
      id: 'text-1',
      type: 'text',
      pageIndex: 0,
      name: 'firstName',
      bounds: { x: 100, y: 700, width: 200, height: 20 },
      required: true,
      readonly: false,
      value: 'John',
    } as TextFormField,
    {
      id: 'text-2',
      type: 'text',
      pageIndex: 0,
      name: 'lastName',
      bounds: { x: 100, y: 650, width: 200, height: 20 },
      required: true,
      readonly: false,
      value: 'Doe',
    } as TextFormField,
    {
      id: 'checkbox-1',
      type: 'checkbox',
      pageIndex: 0,
      name: 'agree',
      bounds: { x: 100, y: 600, width: 20, height: 20 },
      required: true,
      readonly: false,
      value: true,
      exportValue: 'Yes',
    } as CheckboxFormField,
    {
      id: 'dropdown-1',
      type: 'dropdown',
      pageIndex: 0,
      name: 'country',
      bounds: { x: 100, y: 550, width: 200, height: 25 },
      required: false,
      readonly: false,
      value: 'USA',
      options: ['USA', 'Canada', 'Mexico'],
    } as DropdownFormField,
  ];

  describe('JSON Export/Import Roundtrip', () => {
    it('should export and import JSON correctly', () => {
      // Export
      const json = exportValuesToJSON(mockFields);
      expect(json).toBeTruthy();

      // Import
      const parsed = parseJSON(json);

      expect(parsed.firstName).toBe('John');
      expect(parsed.lastName).toBe('Doe');
      expect(parsed.agree).toBe(true);
      expect(parsed.country).toBe('USA');
    });

    it('should handle special characters in JSON', () => {
      const fieldsWithSpecialChars: TextFormField[] = [
        {
          id: 'text-1',
          type: 'text',
          pageIndex: 0,
          name: 'comments',
          bounds: { x: 0, y: 0, width: 100, height: 20 },
          required: false,
          readonly: false,
          value: 'Line 1\nLine 2\t"quoted"',
        },
      ];

      const json = exportValuesToJSON(fieldsWithSpecialChars);
      const parsed = parseJSON(json);

      expect(parsed.comments).toBe('Line 1\nLine 2\t"quoted"');
    });
  });

  describe('FDF Export/Import Roundtrip', () => {
    it('should export and import FDF correctly', () => {
      // Export
      const fdf = generateFDF(mockFields, 'test.pdf');
      expect(fdf).toContain('%FDF-1.2');
      expect(fdf).toContain('/Fields');

      // Import
      const parsed = parseFDF(fdf);

      expect(parsed.firstName).toBe('John');
      expect(parsed.lastName).toBe('Doe');
      expect(parsed.agree).toBe('Yes'); // Checkbox export value
      expect(parsed.country).toBe('USA');
    });

    it('should include PDF filename in FDF', () => {
      const fdf = generateFDF(mockFields, 'document.pdf');
      expect(fdf).toContain('/F (document.pdf)');
    });

    it('should handle unchecked checkboxes', () => {
      const fieldsWithUnchecked: CheckboxFormField[] = [
        {
          id: 'cb-1',
          type: 'checkbox',
          pageIndex: 0,
          name: 'subscribe',
          bounds: { x: 0, y: 0, width: 20, height: 20 },
          required: false,
          readonly: false,
          value: false,
        },
      ];

      const fdf = generateFDF(fieldsWithUnchecked);
      const parsed = parseFDF(fdf);

      expect(parsed.subscribe).toBe(false);
    });

    it('should handle special characters in FDF', () => {
      const fieldsWithSpecialChars: TextFormField[] = [
        {
          id: 'text-1',
          type: 'text',
          pageIndex: 0,
          name: 'notes',
          bounds: { x: 0, y: 0, width: 100, height: 20 },
          required: false,
          readonly: false,
          value: 'Test (with) parentheses',
        },
      ];

      const fdf = generateFDF(fieldsWithSpecialChars);
      const parsed = parseFDF(fdf);

      expect(parsed.notes).toBe('Test (with) parentheses');
    });
  });

  describe('XFDF Export/Import Roundtrip', () => {
    it('should export and import XFDF correctly', () => {
      // Export
      const xfdf = generateXFDF(mockFields, 'test.pdf');
      expect(xfdf).toContain('<?xml');
      expect(xfdf).toContain('<xfdf');

      // Import
      const parsed = parseXFDF(xfdf);

      expect(parsed.firstName).toBe('John');
      expect(parsed.lastName).toBe('Doe');
      expect(parsed.agree).toBe('Yes'); // Checkbox export value
      expect(parsed.country).toBe('USA');
    });

    it('should include PDF filename in XFDF', () => {
      const xfdf = generateXFDF(mockFields, 'document.pdf');
      expect(xfdf).toContain('<f href="document.pdf"');
    });

    it('should handle XML special characters', () => {
      const fieldsWithSpecialChars: TextFormField[] = [
        {
          id: 'text-1',
          type: 'text',
          pageIndex: 0,
          name: 'html',
          bounds: { x: 0, y: 0, width: 100, height: 20 },
          required: false,
          readonly: false,
          value: '<script>alert("xss")</script>',
        },
      ];

      const xfdf = generateXFDF(fieldsWithSpecialChars);

      // Should be escaped
      expect(xfdf).toContain('&lt;script&gt;');
      expect(xfdf).not.toContain('<script>');

      // Should parse back correctly
      const parsed = parseXFDF(xfdf);
      expect(parsed.html).toBe('<script>alert("xss")</script>');
    });
  });

  describe('Auto Format Detection', () => {
    it('should detect JSON format', () => {
      const json = '{"firstName": "John"}';
      const parsed = parseFormData(json, 'auto');

      expect(parsed.firstName).toBe('John');
    });

    it('should detect JSON format from filename', () => {
      const json = '{"test": "value"}';
      const parsed = parseFormData(json, 'auto', 'data.json');

      expect(parsed.test).toBe('value');
    });

    it('should detect XFDF format from content', () => {
      const xfdf = `<?xml version="1.0"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields><field name="test"><value>value</value></field></fields>
        </xfdf>`;

      const parsed = parseFormData(xfdf, 'auto');
      expect(parsed.test).toBe('value');
    });

    it('should detect FDF format from content', () => {
      const fdf = `%FDF-1.2
1 0 obj
<</FDF<</Fields [<</T (test)/V (value)>>]>>>>
endobj
trailer
<</Root 1 0 R>>
%%EOF`;

      const parsed = parseFormData(fdf, 'auto');
      expect(parsed.test).toBe('value');
    });
  });

  describe('Import Validation', () => {
    it('should validate imported data against field names', () => {
      const importData = {
        firstName: 'John',
        lastName: 'Doe',
        unknownField: 'value',
        anotherUnknown: 'data',
      };

      const fieldNames = ['firstName', 'lastName', 'email'];
      const result = validateImportedData(importData, fieldNames);

      expect(result.valid).toEqual(['firstName', 'lastName']);
      expect(result.unknown).toEqual(['unknownField', 'anotherUnknown']);
    });
  });

  describe('Cross-Format Compatibility', () => {
    it('should maintain data integrity across formats', () => {
      // Original data
      const originalData = {
        firstName: 'John',
        lastName: 'Doe',
        agree: true,
        country: 'USA',
      };

      // Export to JSON, import, export to XFDF, import
      const json = exportValuesToJSON(mockFields);
      const fromJson = parseJSON(json);

      // Create fields from imported data for XFDF export
      const fieldsFromJson: FormField[] = mockFields.map(field => ({
        ...field,
        value: fromJson[field.name] ?? field.value,
      }));

      const xfdf = generateXFDF(fieldsFromJson);
      const fromXfdf = parseXFDF(xfdf);

      // Values should match (checkbox becomes string in XFDF)
      expect(fromXfdf.firstName).toBe(originalData.firstName);
      expect(fromXfdf.lastName).toBe(originalData.lastName);
      expect(fromXfdf.country).toBe(originalData.country);
    });
  });
});
