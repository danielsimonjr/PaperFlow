import type { FormField } from '@/types/forms';

/**
 * FDF (Forms Data Format) exporter
 *
 * FDF is Adobe's format for exchanging form data.
 * Reference: PDF Reference Manual, Chapter 12
 */

/**
 * Escape special characters for FDF strings
 */
function escapeFDFString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

/**
 * Convert a field value to FDF format
 */
function formatFieldValue(field: FormField): string {
  switch (field.type) {
    case 'text':
      return `(${escapeFDFString(field.value)})`;

    case 'checkbox':
      return field.value ? `/${field.exportValue || 'Yes'}` : '/Off';

    case 'radio':
      return field.value ? `/${escapeFDFString(field.value)}` : '/Off';

    case 'dropdown':
      return `(${escapeFDFString(field.value)})`;

    case 'date':
      return `(${escapeFDFString(field.value || '')})`;

    case 'number':
      return field.value !== null ? `(${field.value})` : '()';

    case 'signature':
      // Signature fields are typically not exported in FDF
      return '()';

    default:
      return '()';
  }
}

/**
 * Generate FDF content for form fields
 */
export function generateFDF(fields: FormField[], pdfFilename?: string): string {
  const lines: string[] = [];

  // FDF header
  lines.push('%FDF-1.2');
  lines.push('%\xe2\xe3\xcf\xd3'); // Binary marker for PDF/FDF
  lines.push('1 0 obj');
  lines.push('<<');
  lines.push('/FDF');
  lines.push('<<');

  // Add reference to source PDF if provided
  if (pdfFilename) {
    lines.push(`/F (${escapeFDFString(pdfFilename)})`);
  }

  // Fields array
  lines.push('/Fields [');

  for (const field of fields) {
    const fieldName = field.name || field.id;
    const value = formatFieldValue(field);

    lines.push('<<');
    lines.push(`/T (${escapeFDFString(fieldName)})`);
    lines.push(`/V ${value}`);
    lines.push('>>');
  }

  lines.push(']');
  lines.push('>>');
  lines.push('>>');
  lines.push('endobj');

  // Trailer
  lines.push('trailer');
  lines.push('<<');
  lines.push('/Root 1 0 R');
  lines.push('>>');
  lines.push('%%EOF');

  return lines.join('\n');
}

/**
 * Export and download form data as FDF
 */
export function downloadFormDataAsFDF(
  fields: FormField[],
  filename: string = 'form-data.fdf',
  pdfFilename?: string
): void {
  const fdfContent = generateFDF(fields, pdfFilename);
  const blob = new Blob([fdfContent], { type: 'application/vnd.fdf' });
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
 * Extract string content from FDF parentheses, handling escaped characters
 */
function extractFDFString(content: string, startIndex: number): { value: string; endIndex: number } | null {
  if (content[startIndex] !== '(') return null;

  let depth = 1;
  let result = '';
  let i = startIndex + 1;

  while (i < content.length && depth > 0) {
    const char = content[i];

    if (char === '\\' && i + 1 < content.length) {
      // Handle escape sequences
      const nextChar = content[i + 1];
      if (nextChar === '(' || nextChar === ')' || nextChar === '\\') {
        result += nextChar;
        i += 2;
        continue;
      } else if (nextChar === 'n') {
        result += '\n';
        i += 2;
        continue;
      } else if (nextChar === 'r') {
        result += '\r';
        i += 2;
        continue;
      }
    }

    if (char === '(') {
      depth++;
      result += char;
    } else if (char === ')') {
      depth--;
      if (depth > 0) {
        result += char;
      }
    } else {
      result += char;
    }
    i++;
  }

  return depth === 0 ? { value: result, endIndex: i } : null;
}

/**
 * Parse FDF content to extract field values
 * Note: This is a simplified parser that handles common FDF structures
 */
export function parseFDF(fdfContent: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Find field definitions by looking for /T patterns
  let pos = 0;
  while (pos < fdfContent.length) {
    // Find next /T marker
    const tIndex = fdfContent.indexOf('/T', pos);
    if (tIndex === -1) break;

    // Skip whitespace and find opening parenthesis for field name
    let i = tIndex + 2;
    while (i < fdfContent.length && /\s/.test(fdfContent[i]!)) i++;

    if (fdfContent[i] !== '(') {
      pos = i;
      continue;
    }

    // Extract field name
    const fieldNameResult = extractFDFString(fdfContent, i);
    if (!fieldNameResult) {
      pos = i + 1;
      continue;
    }

    const fieldName = fieldNameResult.value;
    i = fieldNameResult.endIndex;

    // Find /V marker
    while (i < fdfContent.length && /\s/.test(fdfContent[i]!)) i++;

    if (fdfContent.substring(i, i + 2) !== '/V') {
      pos = i;
      continue;
    }

    i += 2;
    while (i < fdfContent.length && /\s/.test(fdfContent[i]!)) i++;

    // Value is either in parentheses (string) or after slash (name)
    if (fdfContent[i] === '(') {
      const valueResult = extractFDFString(fdfContent, i);
      if (valueResult) {
        result[fieldName] = valueResult.value;
        i = valueResult.endIndex;
      }
    } else if (fdfContent[i] === '/') {
      // Name value (for checkboxes, radio buttons)
      const nameMatch = fdfContent.substring(i + 1).match(/^(\w+)/);
      if (nameMatch && nameMatch[1]) {
        const nameValue = nameMatch[1];
        if (nameValue === 'Off') {
          result[fieldName] = false;
        } else {
          result[fieldName] = nameValue;
        }
        i += 1 + nameValue.length;
      }
    }

    pos = i;
  }

  return result;
}
