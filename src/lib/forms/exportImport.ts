import type { FormField } from '@/types/forms';

/**
 * Export form data to JSON format
 */
export function exportToJSON(fields: FormField[]): string {
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    const key = field.name || field.id;
    data[key] = {
      value: field.value,
      type: field.type,
      pageIndex: field.pageIndex,
    };
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Export form field values only (simpler format)
 */
export function exportValuesToJSON(fields: FormField[]): string {
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    const key = field.name || field.id;
    data[key] = field.value;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Parse JSON form data
 */
export function parseJSON(jsonString: string): Record<string, unknown> {
  try {
    const data = JSON.parse(jsonString);

    // Handle both formats (with metadata or values only)
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        // Format with metadata
        result[key] = (value as { value: unknown }).value;
      } else {
        // Simple values format
        result[key] = value;
      }
    }

    return result;
  } catch {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Download data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
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
 * Export and download form data as JSON
 */
export function downloadFormDataAsJSON(
  fields: FormField[],
  filename: string = 'form-data.json'
): void {
  const json = exportValuesToJSON(fields);
  downloadFile(json, filename, 'application/json');
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Import form data from JSON file
 */
export async function importFromJSONFile(
  file: File
): Promise<Record<string, unknown>> {
  const content = await readFileAsText(file);
  return parseJSON(content);
}
