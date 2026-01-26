import type { AnnotationRect } from './index';

export type FormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'signature'
  | 'date'
  | 'number';

export interface BaseFormField {
  id: string;
  pageIndex: number;
  name: string;
  bounds: AnnotationRect;
  required: boolean;
  readonly: boolean;
  tooltip?: string;
}

export interface TextFormField extends BaseFormField {
  type: 'text';
  value: string;
  maxLength?: number;
  multiline?: boolean;
  format?: 'none' | 'email' | 'phone' | 'zip';
}

export interface NumberFormField extends BaseFormField {
  type: 'number';
  value: number | null;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

export interface CheckboxFormField extends BaseFormField {
  type: 'checkbox';
  value: boolean;
  exportValue?: string;
}

export interface RadioFormField extends BaseFormField {
  type: 'radio';
  value: string;
  groupName: string;
  options: { label: string; value: string }[];
}

export interface DropdownFormField extends BaseFormField {
  type: 'dropdown';
  value: string;
  options: string[];
  allowCustom?: boolean;
}

export interface SignatureFormField extends BaseFormField {
  type: 'signature';
  value: string | null; // base64 signature data
  signedBy?: string;
  signedAt?: Date;
}

export interface DateFormField extends BaseFormField {
  type: 'date';
  value: string | null; // ISO date string
  format: string;
}

export type FormField =
  | TextFormField
  | NumberFormField
  | CheckboxFormField
  | RadioFormField
  | DropdownFormField
  | SignatureFormField
  | DateFormField;

export interface FormData {
  fields: FormField[];
  lastModified: Date;
}
