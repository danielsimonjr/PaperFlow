import type { FormField } from '@/types/forms';

/**
 * XFDF (XML Forms Data Format) exporter
 *
 * XFDF is the XML-based alternative to FDF for exchanging form data.
 * Reference: XML Forms Data Format Specification
 */

/**
 * Escape special characters for XML
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert a field value to XFDF format
 */
function formatFieldValue(field: FormField): string {
  switch (field.type) {
    case 'text':
      return escapeXML(field.value);

    case 'checkbox':
      return field.value ? (field.exportValue || 'Yes') : 'Off';

    case 'radio':
      return field.value ? escapeXML(field.value) : 'Off';

    case 'dropdown':
      return escapeXML(field.value);

    case 'date':
      return escapeXML(field.value || '');

    case 'number':
      return field.value !== null ? String(field.value) : '';

    case 'signature':
      // Signature fields are typically not exported in XFDF
      return '';

    default:
      return '';
  }
}

/**
 * Generate XFDF content for form fields
 */
export function generateXFDF(fields: FormField[], pdfFilename?: string): string {
  const lines: string[] = [];

  // XML declaration
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');

  // XFDF root element
  lines.push('<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">');

  // Reference to source PDF
  if (pdfFilename) {
    lines.push(`  <f href="${escapeXML(pdfFilename)}" />`);
  }

  // Fields section
  lines.push('  <fields>');

  for (const field of fields) {
    const fieldName = escapeXML(field.name || field.id);
    const value = formatFieldValue(field);

    lines.push(`    <field name="${fieldName}">`);
    lines.push(`      <value>${value}</value>`);
    lines.push('    </field>');
  }

  lines.push('  </fields>');
  lines.push('</xfdf>');

  return lines.join('\n');
}

/**
 * Export and download form data as XFDF
 */
export function downloadFormDataAsXFDF(
  fields: FormField[],
  filename: string = 'form-data.xfdf',
  pdfFilename?: string
): void {
  const xfdfContent = generateXFDF(fields, pdfFilename);
  const blob = new Blob([xfdfContent], { type: 'application/vnd.adobe.xfdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse XFDF content to extract field values
 */
export function parseXFDF(xfdfContent: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Parse XML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(xfdfContent, 'text/xml');

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XFDF format');
  }

  // Find all field elements
  const fieldElements = doc.querySelectorAll('field');

  for (const fieldElement of fieldElements) {
    const fieldName = fieldElement.getAttribute('name');
    if (!fieldName) continue;

    // Get value element(s)
    const valueElements = fieldElement.querySelectorAll('value');

    if (valueElements.length === 0) {
      result[fieldName] = '';
    } else if (valueElements.length === 1) {
      const firstElement = valueElements[0];
      const value = firstElement?.textContent || '';
      // Handle checkbox/radio 'Off' value
      if (value === 'Off') {
        result[fieldName] = false;
      } else {
        result[fieldName] = value;
      }
    } else {
      // Multiple values (for multi-select lists)
      result[fieldName] = Array.from(valueElements).map(
        (el) => el.textContent || ''
      );
    }
  }

  return result;
}

/**
 * Generate XFDF with annotations (for future use)
 * Note: This can be extended to include annotation data
 */
export function generateXFDFWithAnnotations(
  fields: FormField[],
  _annotations: unknown[],
  pdfFilename?: string
): string {
  // For now, just generate the fields XFDF
  // Annotation support can be added later
  return generateXFDF(fields, pdfFilename);
}
