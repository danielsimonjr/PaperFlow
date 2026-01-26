import type * as pdfjsLib from 'pdfjs-dist';
import type {
  FormField,
  TextFormField,
  CheckboxFormField,
  RadioFormField,
  DropdownFormField,
  SignatureFormField,
} from '@/types/forms';
import type { AnnotationRect } from '@/types';

/**
 * Widget annotation subtypes from PDF specification
 */
type FieldType = 'Tx' | 'Btn' | 'Ch' | 'Sig';

/**
 * Widget annotation from PDF.js
 */
interface WidgetAnnotation {
  id: string;
  subtype: string;
  fieldType?: FieldType;
  fieldName?: string;
  fieldValue?: string | boolean | string[];
  rect?: [number, number, number, number];
  fieldFlags?: number;
  maxLen?: number;
  options?: Array<{ exportValue: string; displayValue: string }>;
  buttonValue?: string;
  radioButton?: boolean;
  checkBox?: boolean;
  pushButton?: boolean;
  combo?: boolean;
  multiSelect?: boolean;
  multiLine?: boolean;
  readOnly?: boolean;
}

/**
 * Field flags from PDF specification (Table 221)
 */
const FieldFlags = {
  // Common flags
  READ_ONLY: 1 << 0,
  REQUIRED: 1 << 1,
  NO_EXPORT: 1 << 2,

  // Text field flags
  MULTILINE: 1 << 12,
  PASSWORD: 1 << 13,
  FILE_SELECT: 1 << 20,
  DO_NOT_SPELL_CHECK: 1 << 22,
  DO_NOT_SCROLL: 1 << 23,
  COMB: 1 << 24,
  RICH_TEXT: 1 << 25,

  // Button field flags
  NO_TOGGLE_TO_OFF: 1 << 14,
  RADIO: 1 << 15,
  PUSHBUTTON: 1 << 16,
  RADIOS_IN_UNISON: 1 << 25,

  // Choice field flags
  COMBO: 1 << 17,
  EDIT: 1 << 18,
  SORT: 1 << 19,
  MULTI_SELECT: 1 << 21,
  COMMIT_ON_SEL_CHANGE: 1 << 26,
};

/**
 * Check if a flag is set in fieldFlags
 */
function hasFlag(fieldFlags: number | undefined, flag: number): boolean {
  return fieldFlags !== undefined && (fieldFlags & flag) !== 0;
}

/**
 * Convert PDF rect [x1, y1, x2, y2] to AnnotationRect
 */
function rectToAnnotationRect(
  rect: [number, number, number, number] | undefined
): AnnotationRect {
  if (!rect || rect.length !== 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const [x1, y1, x2, y2] = rect;
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/**
 * Generate unique field ID
 */
function generateFieldId(): string {
  return `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse a text field annotation
 */
function parseTextField(
  annotation: WidgetAnnotation,
  pageIndex: number
): TextFormField {
  const isMultiline = hasFlag(annotation.fieldFlags, FieldFlags.MULTILINE);
  const isRequired = hasFlag(annotation.fieldFlags, FieldFlags.REQUIRED);
  const isReadOnly = hasFlag(annotation.fieldFlags, FieldFlags.READ_ONLY);

  return {
    id: annotation.id || generateFieldId(),
    type: 'text',
    pageIndex,
    name: annotation.fieldName || '',
    bounds: rectToAnnotationRect(annotation.rect),
    required: isRequired,
    readonly: isReadOnly,
    value: String(annotation.fieldValue || ''),
    maxLength: annotation.maxLen,
    multiline: isMultiline,
  };
}

/**
 * Parse a checkbox field annotation
 */
function parseCheckboxField(
  annotation: WidgetAnnotation,
  pageIndex: number
): CheckboxFormField {
  const isRequired = hasFlag(annotation.fieldFlags, FieldFlags.REQUIRED);
  const isReadOnly = hasFlag(annotation.fieldFlags, FieldFlags.READ_ONLY);

  // Check if the checkbox is checked
  // PDF.js returns 'Off' for unchecked and the export value for checked
  const value =
    annotation.fieldValue !== undefined &&
    annotation.fieldValue !== 'Off' &&
    annotation.fieldValue !== false;

  return {
    id: annotation.id || generateFieldId(),
    type: 'checkbox',
    pageIndex,
    name: annotation.fieldName || '',
    bounds: rectToAnnotationRect(annotation.rect),
    required: isRequired,
    readonly: isReadOnly,
    value,
    exportValue: annotation.buttonValue || 'Yes',
  };
}

/**
 * Parse a radio button field annotation
 */
function parseRadioField(
  annotation: WidgetAnnotation,
  pageIndex: number
): RadioFormField {
  const isRequired = hasFlag(annotation.fieldFlags, FieldFlags.REQUIRED);
  const isReadOnly = hasFlag(annotation.fieldFlags, FieldFlags.READ_ONLY);

  return {
    id: annotation.id || generateFieldId(),
    type: 'radio',
    pageIndex,
    name: annotation.fieldName || '',
    bounds: rectToAnnotationRect(annotation.rect),
    required: isRequired,
    readonly: isReadOnly,
    value: String(annotation.fieldValue || ''),
    groupName: annotation.fieldName || '',
    options: annotation.buttonValue
      ? [{ label: annotation.buttonValue, value: annotation.buttonValue }]
      : [],
  };
}

/**
 * Parse a dropdown/listbox field annotation
 */
function parseDropdownField(
  annotation: WidgetAnnotation,
  pageIndex: number
): DropdownFormField {
  const isRequired = hasFlag(annotation.fieldFlags, FieldFlags.REQUIRED);
  const isReadOnly = hasFlag(annotation.fieldFlags, FieldFlags.READ_ONLY);
  const allowCustom = hasFlag(annotation.fieldFlags, FieldFlags.EDIT);

  // Extract options from annotation
  const options: string[] =
    annotation.options?.map((opt) => opt.displayValue || opt.exportValue) || [];

  return {
    id: annotation.id || generateFieldId(),
    type: 'dropdown',
    pageIndex,
    name: annotation.fieldName || '',
    bounds: rectToAnnotationRect(annotation.rect),
    required: isRequired,
    readonly: isReadOnly,
    value: Array.isArray(annotation.fieldValue)
      ? annotation.fieldValue[0] || ''
      : String(annotation.fieldValue || ''),
    options,
    allowCustom,
  };
}

/**
 * Parse a signature field annotation
 */
function parseSignatureField(
  annotation: WidgetAnnotation,
  pageIndex: number
): SignatureFormField {
  const isRequired = hasFlag(annotation.fieldFlags, FieldFlags.REQUIRED);
  const isReadOnly = hasFlag(annotation.fieldFlags, FieldFlags.READ_ONLY);

  return {
    id: annotation.id || generateFieldId(),
    type: 'signature',
    pageIndex,
    name: annotation.fieldName || '',
    bounds: rectToAnnotationRect(annotation.rect),
    required: isRequired,
    readonly: isReadOnly,
    value: null,
  };
}

/**
 * Parse a single form field annotation from PDF.js
 */
export function parseFormField(
  annotation: WidgetAnnotation,
  pageIndex: number
): FormField | null {
  // Only process Widget annotations (form fields)
  if (annotation.subtype !== 'Widget') {
    return null;
  }

  const fieldType = annotation.fieldType;

  switch (fieldType) {
    case 'Tx': // Text field
      return parseTextField(annotation, pageIndex);

    case 'Btn': // Button (checkbox, radio, or push button)
      // Skip push buttons
      if (annotation.pushButton) {
        return null;
      }
      if (annotation.radioButton) {
        return parseRadioField(annotation, pageIndex);
      }
      // Default to checkbox
      return parseCheckboxField(annotation, pageIndex);

    case 'Ch': // Choice (dropdown or listbox)
      return parseDropdownField(annotation, pageIndex);

    case 'Sig': // Signature
      return parseSignatureField(annotation, pageIndex);

    default:
      // Unknown field type
      return null;
  }
}

/**
 * Extract all form fields from a single PDF page
 */
export async function extractPageFormFields(
  page: pdfjsLib.PDFPageProxy,
  pageIndex: number
): Promise<FormField[]> {
  try {
    // Get annotations from the page
    const annotations = await page.getAnnotations();

    const fields: FormField[] = [];

    for (const annotation of annotations) {
      const field = parseFormField(annotation as WidgetAnnotation, pageIndex);
      if (field) {
        fields.push(field);
      }
    }

    return fields;
  } catch (error) {
    console.error(`Error extracting form fields from page ${pageIndex}:`, error);
    return [];
  }
}

/**
 * Group radio buttons by their group name
 */
export function groupRadioButtons(fields: FormField[]): FormField[] {
  const radioGroups = new Map<string, RadioFormField[]>();
  const nonRadioFields: FormField[] = [];

  // Separate radio buttons from other fields
  for (const field of fields) {
    if (field.type === 'radio') {
      const groupName = field.groupName;
      if (!radioGroups.has(groupName)) {
        radioGroups.set(groupName, []);
      }
      radioGroups.get(groupName)!.push(field);
    } else {
      nonRadioFields.push(field);
    }
  }

  // Merge radio buttons in each group
  const mergedRadioFields: RadioFormField[] = [];
  for (const [groupName, buttons] of radioGroups) {
    // Use the first button as the base, collect all options
    const firstButton = buttons[0];
    if (!firstButton) continue;

    const allOptions = buttons.flatMap((btn) => btn.options);

    // Find which option is selected
    const selectedValue = buttons.find((btn) => btn.value)?.value || '';

    mergedRadioFields.push({
      ...firstButton,
      groupName,
      options: allOptions,
      value: selectedValue,
    });

    // Keep individual buttons for positioning but mark them specially
    for (const button of buttons.slice(1)) {
      nonRadioFields.push({
        ...button,
        // Keep individual radio buttons for rendering at their positions
      });
    }
  }

  return [...nonRadioFields, ...mergedRadioFields];
}

/**
 * Sort fields by tab order (top-to-bottom, left-to-right)
 */
export function sortFieldsByTabOrder(fields: FormField[]): FormField[] {
  return [...fields].sort((a, b) => {
    // First sort by page
    if (a.pageIndex !== b.pageIndex) {
      return a.pageIndex - b.pageIndex;
    }

    // Then by vertical position (top to bottom)
    const yDiff = b.bounds.y - a.bounds.y; // Higher y = higher on page
    if (Math.abs(yDiff) > 10) {
      return yDiff;
    }

    // Then by horizontal position (left to right)
    return a.bounds.x - b.bounds.x;
  });
}

/**
 * Extract form fields from all pages of a PDF document
 */
export async function extractAllFormFields(
  document: pdfjsLib.PDFDocumentProxy
): Promise<FormField[]> {
  const allFields: FormField[] = [];
  const numPages = document.numPages;

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await document.getPage(i);
      const pageFields = await extractPageFormFields(page, i - 1);
      allFields.push(...pageFields);
    } catch (error) {
      console.error(`Error processing page ${i}:`, error);
    }
  }

  // Group radio buttons and sort by tab order
  const groupedFields = groupRadioButtons(allFields);
  return sortFieldsByTabOrder(groupedFields);
}

/**
 * Get validation errors for form fields
 */
export function validateFormFields(
  fields: FormField[]
): Map<string, string[]> {
  const errors = new Map<string, string[]>();

  for (const field of fields) {
    const fieldErrors: string[] = [];

    // Check required fields
    if (field.required) {
      switch (field.type) {
        case 'text':
        case 'dropdown':
          if (!field.value || String(field.value).trim() === '') {
            fieldErrors.push('This field is required');
          }
          break;
        case 'checkbox':
          if (!field.value) {
            fieldErrors.push('This field must be checked');
          }
          break;
        case 'radio':
          if (!field.value) {
            fieldErrors.push('Please select an option');
          }
          break;
        case 'signature':
          if (!field.value) {
            fieldErrors.push('Signature is required');
          }
          break;
      }
    }

    // Check text field constraints
    if (field.type === 'text') {
      if (field.maxLength && field.value.length > field.maxLength) {
        fieldErrors.push(`Maximum ${field.maxLength} characters allowed`);
      }
    }

    if (fieldErrors.length > 0) {
      errors.set(field.id, fieldErrors);
    }
  }

  return errors;
}

/**
 * Check if all required fields are filled
 */
export function areRequiredFieldsFilled(fields: FormField[]): boolean {
  const errors = validateFormFields(fields);
  return errors.size === 0;
}
