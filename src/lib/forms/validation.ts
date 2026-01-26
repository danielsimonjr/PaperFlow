import type { FormField } from '@/types/forms';

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation result for all fields
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Map<string, string[]>;
  invalidFields: FormField[];
  firstInvalidField: FormField | null;
}

/**
 * Validate a single form field
 */
export function validateField(field: FormField): FieldValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (field.required) {
    switch (field.type) {
      case 'text':
        if (!field.value || field.value.trim() === '') {
          errors.push('This field is required');
        }
        break;
      case 'checkbox':
        if (!field.value) {
          errors.push('This field must be checked');
        }
        break;
      case 'radio':
        if (!field.value) {
          errors.push('Please select an option');
        }
        break;
      case 'dropdown':
        if (!field.value) {
          errors.push('Please select an option');
        }
        break;
      case 'signature':
        if (!field.value) {
          errors.push('Signature is required');
        }
        break;
      case 'date':
        if (!field.value) {
          errors.push('Date is required');
        }
        break;
      case 'number':
        if (field.value === null || field.value === undefined) {
          errors.push('This field is required');
        }
        break;
    }
  }

  // Type-specific validation
  switch (field.type) {
    case 'text':
      if (field.maxLength && field.value.length > field.maxLength) {
        errors.push(`Maximum ${field.maxLength} characters allowed`);
      }

      // Format validation
      if (field.value && field.format) {
        switch (field.format) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
              errors.push('Please enter a valid email address');
            }
            break;
          case 'phone':
            if (!/^[\d\s\-+()]+$/.test(field.value)) {
              errors.push('Please enter a valid phone number');
            }
            break;
          case 'zip':
            if (!/^\d{5}(-\d{4})?$/.test(field.value)) {
              errors.push('Please enter a valid ZIP code');
            }
            break;
        }
      }
      break;

    case 'number':
      if (field.value !== null) {
        if (field.min !== undefined && field.value < field.min) {
          errors.push(`Minimum value is ${field.min}`);
        }
        if (field.max !== undefined && field.value > field.max) {
          errors.push(`Maximum value is ${field.max}`);
        }
      }
      break;

    case 'dropdown':
      if (field.value && !field.allowCustom && !field.options.includes(field.value)) {
        errors.push('Please select a valid option');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all form fields
 */
export function validateForm(fields: FormField[]): FormValidationResult {
  const errors = new Map<string, string[]>();
  const invalidFields: FormField[] = [];
  let firstInvalidField: FormField | null = null;

  for (const field of fields) {
    const result = validateField(field);
    if (!result.isValid) {
      errors.set(field.id, result.errors);
      invalidFields.push(field);
      if (!firstInvalidField) {
        firstInvalidField = field;
      }
    }
  }

  return {
    isValid: errors.size === 0,
    errors,
    invalidFields,
    firstInvalidField,
  };
}

/**
 * Get summary of validation errors
 */
export function getValidationSummary(result: FormValidationResult): string {
  if (result.isValid) {
    return 'All fields are valid';
  }

  const count = result.invalidFields.length;
  const requiredCount = result.invalidFields.filter((f) => f.required).length;

  if (requiredCount === count) {
    return `${count} required field${count > 1 ? 's' : ''} ${count > 1 ? 'are' : 'is'} incomplete`;
  }

  return `${count} field${count > 1 ? 's have' : ' has'} validation error${count > 1 ? 's' : ''}`;
}

/**
 * Check if a specific field has validation errors
 */
export function hasFieldError(
  fieldId: string,
  errors: Map<string, string[]>
): boolean {
  return errors.has(fieldId);
}

/**
 * Get validation errors for a specific field
 */
export function getFieldErrors(
  fieldId: string,
  errors: Map<string, string[]>
): string[] {
  return errors.get(fieldId) || [];
}
