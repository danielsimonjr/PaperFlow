import type { AnnotationRect } from './index';

/**
 * Kind of form field: text, checkbox, radio, dropdown, signature, date, or number.
 */
export type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'date'
  | 'number';

/**
 * Fields that every form field type shares.
 */
export interface BaseFormField {
  id: string;
  pageIndex: number;
  name: string;
  bounds: AnnotationRect;
  required: boolean;
  readonly: boolean;
  tooltip?: string;
}

/**
 * A text form field, with its value, optional length limit, multiline flag, and format.
 */
export interface TextFormField extends BaseFormField {
  type: 'text';
  value: string;
  maxLength?: number;
  multiline?: boolean;
  format?: 'none' | 'email' | 'phone' | 'zip';
}

/**
 * A number form field, with its value and optional range and decimal places.
 */
export interface NumberFormField extends BaseFormField {
  type: 'number';
  value: number | null;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

/**
 * A checkbox form field, with its checked value and an optional export value.
 *
 * The export value names the checked state when the form is exported.
 */
export interface CheckboxFormField extends BaseFormField {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;
}

/**
 * A radio form field: one value chosen from a named group of options.
 */
export interface RadioFormField extends BaseFormField {
  type: 'radio';
  value: string;
  groupName: string;
  options: { label: string; value: string }[];
}

/**
 * A dropdown form field, with its value, its options, and whether a custom value is allowed.
 */
export interface DropdownFormField extends BaseFormField {
  type: 'dropdown';
  value: string;
  options: string[];
  allowCustom?: boolean;
}

/**
 * A signature form field, with its base64 signature data and optional signer and signing time.
 */
export interface SignatureFormField extends BaseFormField {
  type: 'signature';
  value: string | null; // base64 signature data
  signedBy?: string;
  signedAt?: Date;
}

/**
 * A date form field, with its value as an ISO date string and its date format.
 */
export interface DateFormField extends BaseFormField {
  type: 'date';
  value: string | null; // ISO date string
  format: string;
}

/**
 * Any one of the form field types that this file defines.
 */
export type FormField =
  | TextFormField
  | NumberFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | SignatureFormField
  | DateFormField;

/**
 * A set of form fields, with the time the set was last modified.
 */
export interface FormData {
  fields: FormField[];
  lastModified: Date;
}
