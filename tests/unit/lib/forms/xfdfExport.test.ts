import { describe, it, expect } from 'vitest';
import { generateXFDF, parseXFDF } from '@lib/forms/xfdfExport';
import type { TextFormField, CheckboxFormField, DropdownFormField } from '@/types/forms';

describe('xfdfExport', () => {
  describe('generateXFDF', () => {
    it('should generate valid XFDF XML', () => {
      const fields: TextFormField[] = [
        {
          id: 'field-1',
          type: 'text',
          pageIndex: 0,
          name: 'firstName',
          bounds: { x: 100, y: 100, width: 200, height: 20 },
          required: false,
          readonly: false,
          value: 'John',
        },
      ];

      const xfdf = generateXFDF(fields);

      expect(xfdf).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xfdf).toContain('<xfdf');
      expect(xfdf).toContain('<fields>');
      expect(xfdf).toContain('<field name="firstName">');
      expect(xfdf).toContain('<value>John</value>');
      expect(xfdf).toContain('</xfdf>');
    });

    it('should include PDF filename reference', () => {
      const fields: TextFormField[] = [];
      const xfdf = generateXFDF(fields, 'test.pdf');

      expect(xfdf).toContain('<f href="test.pdf"');
    });

    it('should escape XML special characters', () => {
      const fields: TextFormField[] = [
        {
          id: 'field-1',
          type: 'text',
          pageIndex: 0,
          name: 'field',
          bounds: { x: 0, y: 0, width: 100, height: 20 },
          required: false,
          readonly: false,
          value: 'Test <value> & "quotes"',
        },
      ];

      const xfdf = generateXFDF(fields);

      expect(xfdf).toContain('&lt;value&gt;');
      expect(xfdf).toContain('&amp;');
      expect(xfdf).toContain('&quot;');
    });

    it('should handle checkbox fields', () => {
      const fields: CheckboxFormField[] = [
        {
          id: 'field-1',
          type: 'checkbox',
          pageIndex: 0,
          name: 'agree',
          bounds: { x: 0, y: 0, width: 20, height: 20 },
          required: false,
          readonly: false,
          value: true,
          exportValue: 'Yes',
        },
      ];

      const xfdf = generateXFDF(fields);

      expect(xfdf).toContain('<value>Yes</value>');
    });

    it('should handle unchecked checkbox fields', () => {
      const fields: CheckboxFormField[] = [
        {
          id: 'field-1',
          type: 'checkbox',
          pageIndex: 0,
          name: 'agree',
          bounds: { x: 0, y: 0, width: 20, height: 20 },
          required: false,
          readonly: false,
          value: false,
        },
      ];

      const xfdf = generateXFDF(fields);

      expect(xfdf).toContain('<value>Off</value>');
    });

    it('should handle dropdown fields', () => {
      const fields: DropdownFormField[] = [
        {
          id: 'field-1',
          type: 'dropdown',
          pageIndex: 0,
          name: 'country',
          bounds: { x: 0, y: 0, width: 100, height: 25 },
          required: false,
          readonly: false,
          value: 'USA',
          options: ['USA', 'Canada'],
        },
      ];

      const xfdf = generateXFDF(fields);

      expect(xfdf).toContain('<field name="country">');
      expect(xfdf).toContain('<value>USA</value>');
    });
  });

  describe('parseXFDF', () => {
    it('should parse XFDF to key-value pairs', () => {
      const xfdfContent = `<?xml version="1.0" encoding="UTF-8"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">
          <fields>
            <field name="firstName">
              <value>John</value>
            </field>
            <field name="lastName">
              <value>Doe</value>
            </field>
          </fields>
        </xfdf>`;

      const result = parseXFDF(xfdfContent);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should handle Off value for checkboxes', () => {
      const xfdfContent = `<?xml version="1.0"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields>
            <field name="agree">
              <value>Off</value>
            </field>
          </fields>
        </xfdf>`;

      const result = parseXFDF(xfdfContent);

      expect(result.agree).toBe(false);
    });

    it('should handle empty values', () => {
      const xfdfContent = `<?xml version="1.0"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields>
            <field name="empty">
              <value></value>
            </field>
          </fields>
        </xfdf>`;

      const result = parseXFDF(xfdfContent);

      expect(result.empty).toBe('');
    });

    it('should handle fields without value element', () => {
      const xfdfContent = `<?xml version="1.0"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields>
            <field name="noValue">
            </field>
          </fields>
        </xfdf>`;

      const result = parseXFDF(xfdfContent);

      expect(result.noValue).toBe('');
    });

    it('should throw error for invalid XML', () => {
      const invalidXfdf = 'not valid xml <';

      expect(() => parseXFDF(invalidXfdf)).toThrow('Invalid XFDF format');
    });

    it('should handle multiple values', () => {
      const xfdfContent = `<?xml version="1.0"?>
        <xfdf xmlns="http://ns.adobe.com/xfdf/">
          <fields>
            <field name="multiSelect">
              <value>Option1</value>
              <value>Option2</value>
            </field>
          </fields>
        </xfdf>`;

      const result = parseXFDF(xfdfContent);

      expect(result.multiSelect).toEqual(['Option1', 'Option2']);
    });
  });
});
