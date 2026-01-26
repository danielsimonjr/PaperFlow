import { parseJSON, readFileAsText } from './exportImport';
import { parseFDF } from './fdfExport';
import { parseXFDF } from './xfdfExport';

/**
 * Supported import formats
 */
export type ImportFormat = 'json' | 'fdf' | 'xfdf' | 'auto';

/**
 * Detect file format from extension or content
 */
function detectFormat(filename: string, content: string): ImportFormat {
  const extension = filename.toLowerCase().split('.').pop();

  switch (extension) {
    case 'json':
      return 'json';
    case 'fdf':
      return 'fdf';
    case 'xfdf':
      return 'xfdf';
    default:
      // Try to detect from content
      if (content.trim().startsWith('{')) {
        return 'json';
      }
      if (content.includes('<?xml') || content.includes('<xfdf')) {
        return 'xfdf';
      }
      if (content.includes('%FDF')) {
        return 'fdf';
      }
      return 'json'; // Default to JSON
  }
}

/**
 * Parse form data from string content
 */
export function parseFormData(
  content: string,
  format: ImportFormat = 'auto',
  filename?: string
): Record<string, unknown> {
  const detectedFormat =
    format === 'auto'
      ? detectFormat(filename || '', content)
      : format;

  switch (detectedFormat) {
    case 'json':
      return parseJSON(content);
    case 'fdf':
      return parseFDF(content);
    case 'xfdf':
      return parseXFDF(content);
    default:
      throw new Error(`Unsupported format: ${detectedFormat}`);
  }
}

/**
 * Import form data from a file
 */
export async function importFormDataFromFile(
  file: File,
  format: ImportFormat = 'auto'
): Promise<Record<string, unknown>> {
  const content = await readFileAsText(file);
  return parseFormData(content, format, file.name);
}

/**
 * Validate imported data against form fields
 */
export function validateImportedData(
  data: Record<string, unknown>,
  fieldNames: string[]
): { valid: string[]; unknown: string[] } {
  const validKeys: string[] = [];
  const unknownKeys: string[] = [];

  for (const key of Object.keys(data)) {
    if (fieldNames.includes(key)) {
      validKeys.push(key);
    } else {
      unknownKeys.push(key);
    }
  }

  return { valid: validKeys, unknown: unknownKeys };
}

/**
 * Get import file accept string for file input
 */
export function getImportAcceptString(): string {
  return '.json,.fdf,.xfdf,application/json,application/vnd.fdf,application/vnd.adobe.xfdf';
}

/**
 * Create a file input for importing form data
 */
export function createImportFileInput(
  onImport: (data: Record<string, unknown>) => void,
  onError?: (error: Error) => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = getImportAcceptString();

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const data = await importFormDataFromFile(file);
      onImport(data);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Import failed'));
    }
  };

  return input;
}

/**
 * Trigger import file selection dialog
 */
export function triggerImportDialog(
  onImport: (data: Record<string, unknown>) => void,
  onError?: (error: Error) => void
): void {
  const input = createImportFileInput(onImport, onError);
  input.click();
}
