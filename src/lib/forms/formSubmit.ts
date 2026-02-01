/**
 * Form Submit
 * Handles form submission configuration and execution.
 */

/**
 * Submit format types
 */
export type SubmitFormat = 'fdf' | 'xfdf' | 'html' | 'pdf' | 'json';

/**
 * Submit method types
 */
export type SubmitMethod = 'GET' | 'POST';

/**
 * Submit configuration
 */
export interface SubmitConfig {
  url: string;
  method: SubmitMethod;
  format: SubmitFormat;
  includeEmptyFields: boolean;
  includeAnnotations: boolean;
  target: '_self' | '_blank' | '_parent' | '_top';
  successMessage?: string;
  errorMessage?: string;
  redirectUrl?: string;
  headers?: Record<string, string>;
  fieldMapping?: Record<string, string>; // Map field names to submit names
}

/**
 * Default submit configuration
 */
export const DEFAULT_SUBMIT_CONFIG: SubmitConfig = {
  url: '',
  method: 'POST',
  format: 'json',
  includeEmptyFields: false,
  includeAnnotations: false,
  target: '_self',
};

/**
 * Submit result
 */
export interface SubmitResult {
  success: boolean;
  status?: number;
  statusText?: string;
  response?: unknown;
  error?: string;
  submittedAt: number;
}

/**
 * Form field value for submission
 */
export interface SubmitFieldValue {
  name: string;
  value: string | number | boolean | string[] | null;
  type: string;
}

/**
 * Pre-submit validation result
 */
export interface PreSubmitValidation {
  valid: boolean;
  errors: Array<{ fieldId: string; fieldName: string; message: string }>;
  warnings: Array<{ fieldId: string; fieldName: string; message: string }>;
}

/**
 * Validate submit configuration
 */
export function validateSubmitConfig(
  config: Partial<SubmitConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.url || config.url.trim() === '') {
    errors.push('Submit URL is required');
  } else {
    try {
      new URL(config.url);
    } catch {
      // Allow relative URLs
      if (!config.url.startsWith('/')) {
        errors.push('Invalid URL format');
      }
    }
  }

  if (config.method && !['GET', 'POST'].includes(config.method)) {
    errors.push('Method must be GET or POST');
  }

  if (config.format && !['fdf', 'xfdf', 'html', 'pdf', 'json'].includes(config.format)) {
    errors.push('Invalid submit format');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Merge submit config with defaults
 */
export function mergeSubmitConfig(config: Partial<SubmitConfig>): SubmitConfig {
  return {
    ...DEFAULT_SUBMIT_CONFIG,
    ...config,
    headers: {
      ...(config.headers || {}),
    },
  };
}

/**
 * Prepare field values for submission
 */
export function prepareFieldValues(
  fieldValues: Record<string, unknown>,
  fieldTypes: Record<string, string>,
  config: SubmitConfig
): SubmitFieldValue[] {
  const result: SubmitFieldValue[] = [];

  for (const [name, value] of Object.entries(fieldValues)) {
    // Skip empty fields if not included
    if (!config.includeEmptyFields && (value === '' || value === null || value === undefined)) {
      continue;
    }

    const submitName = config.fieldMapping?.[name] || name;
    const type = fieldTypes[name] || 'text';

    result.push({
      name: submitName,
      value: value as string | number | boolean | string[] | null,
      type,
    });
  }

  return result;
}

/**
 * Format field values for submission based on format
 */
export function formatForSubmission(
  fields: SubmitFieldValue[],
  format: SubmitFormat
): string | FormData | Record<string, unknown> {
  switch (format) {
    case 'json':
      return formatAsJSON(fields);
    case 'html':
      return formatAsFormData(fields);
    case 'fdf':
      return formatAsFDF(fields);
    case 'xfdf':
      return formatAsXFDF(fields);
    case 'pdf':
      // PDF format handled separately
      return formatAsJSON(fields);
    default:
      return formatAsJSON(fields);
  }
}

/**
 * Format as JSON
 */
function formatAsJSON(fields: SubmitFieldValue[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    result[field.name] = field.value;
  }

  return result;
}

/**
 * Format as FormData
 */
function formatAsFormData(fields: SubmitFieldValue[]): FormData {
  const formData = new FormData();

  for (const field of fields) {
    if (Array.isArray(field.value)) {
      for (const v of field.value) {
        formData.append(field.name, String(v));
      }
    } else if (field.value !== null) {
      formData.append(field.name, String(field.value));
    }
  }

  return formData;
}

/**
 * Format as FDF (Forms Data Format)
 */
function formatAsFDF(fields: SubmitFieldValue[]): string {
  const lines: string[] = [
    '%FDF-1.2',
    '1 0 obj',
    '<<',
    '/FDF <<',
    '/Fields [',
  ];

  for (const field of fields) {
    const value = field.value === null ? '' : String(field.value);
    const escapedValue = value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    lines.push(`<< /T (${field.name}) /V (${escapedValue}) >>`);
  }

  lines.push(
    ']',
    '>>',
    '>>',
    'endobj',
    'trailer',
    '<<',
    '/Root 1 0 R',
    '>>',
    '%%EOF'
  );

  return lines.join('\n');
}

/**
 * Format as XFDF (XML Forms Data Format)
 */
function formatAsXFDF(fields: SubmitFieldValue[]): string {
  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">',
    '<fields>',
  ];

  for (const field of fields) {
    const value = field.value === null ? '' : String(field.value);
    lines.push(`  <field name="${escapeXml(field.name)}">`);
    lines.push(`    <value>${escapeXml(value)}</value>`);
    lines.push('  </field>');
  }

  lines.push('</fields>', '</xfdf>');

  return lines.join('\n');
}

/**
 * Build URL for GET submission
 */
export function buildSubmitURL(url: string, fields: SubmitFieldValue[]): string {
  const params = new URLSearchParams();

  for (const field of fields) {
    if (Array.isArray(field.value)) {
      for (const v of field.value) {
        params.append(field.name, String(v));
      }
    } else if (field.value !== null) {
      params.append(field.name, String(field.value));
    }
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Submit form data
 */
export async function submitForm(
  fields: SubmitFieldValue[],
  config: SubmitConfig
): Promise<SubmitResult> {
  const startTime = Date.now();

  try {
    let url = config.url;
    let body: string | FormData | undefined;
    const headers: Record<string, string> = { ...config.headers };

    if (config.method === 'GET') {
      url = buildSubmitURL(config.url, fields);
    } else {
      const formatted = formatForSubmission(fields, config.format);

      if (config.format === 'json') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(formatted);
      } else if (config.format === 'html' && formatted instanceof FormData) {
        body = formatted;
        // Let browser set Content-Type with boundary for FormData
      } else {
        headers['Content-Type'] =
          config.format === 'fdf' ? 'application/vnd.fdf' :
          config.format === 'xfdf' ? 'application/vnd.adobe.xfdf' :
          'text/plain';
        body = formatted as string;
      }
    }

    const response = await fetch(url, {
      method: config.method,
      headers,
      body,
    });

    let responseData: unknown;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      submittedAt: startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Submit failed',
      submittedAt: startTime,
    };
  }
}

/**
 * Create a pre-submit validation function
 */
export function createPreSubmitValidator(
  requiredFields: string[]
): (fields: SubmitFieldValue[]) => PreSubmitValidation {
  return (fields) => {
    const errors: PreSubmitValidation['errors'] = [];
    const warnings: PreSubmitValidation['warnings'] = [];

    const fieldMap = new Map(fields.map((f) => [f.name, f]));

    for (const required of requiredFields) {
      const field = fieldMap.get(required);

      if (!field) {
        errors.push({
          fieldId: required,
          fieldName: required,
          message: 'This field is required',
        });
      } else if (field.value === '' || field.value === null) {
        errors.push({
          fieldId: required,
          fieldName: required,
          message: 'This field is required',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  };
}

/**
 * Reset button configuration
 */
export interface ResetConfig {
  scope: 'all' | 'selected';
  fieldIds?: string[];
  confirm: boolean;
  confirmMessage?: string;
}

/**
 * Default reset configuration
 */
export const DEFAULT_RESET_CONFIG: ResetConfig = {
  scope: 'all',
  confirm: true,
  confirmMessage: 'Are you sure you want to reset the form? This will clear all field values.',
};

/**
 * Get fields to reset based on config
 */
export function getFieldsToReset(
  allFieldIds: string[],
  config: ResetConfig
): string[] {
  if (config.scope === 'all') {
    return allFieldIds;
  }

  return config.fieldIds || [];
}

/**
 * Print button configuration
 */
export interface PrintConfig {
  pages: 'all' | 'current' | 'range';
  pageRange?: string; // e.g., "1-5, 7, 9-12"
  includeAnnotations: boolean;
  includeFlattenedFields: boolean;
}

/**
 * Default print configuration
 */
export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  pages: 'all',
  includeAnnotations: true,
  includeFlattenedFields: true,
};
