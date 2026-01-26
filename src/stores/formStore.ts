import { create } from 'zustand';
import type { FormField } from '@/types/forms';

interface FormState {
  // Form fields data
  fields: FormField[];
  fieldsByPage: Map<number, FormField[]>;

  // Current state
  focusedFieldId: string | null;
  validationErrors: Map<string, string[]>;
  isDirty: boolean;
  isLoading: boolean;

  // Original values for reset
  originalValues: Map<string, unknown>;

  // Actions
  setFields: (fields: FormField[]) => void;
  updateFieldValue: (fieldId: string, value: unknown) => void;
  setFocusedField: (fieldId: string | null) => void;
  setValidationErrors: (errors: Map<string, string[]>) => void;
  clearValidationError: (fieldId: string) => void;
  resetToDefaults: () => void;
  clearAllFields: () => void;
  setLoading: (loading: boolean) => void;
  getFieldById: (fieldId: string) => FormField | undefined;
  getFieldsForPage: (pageIndex: number) => FormField[];
  getNextField: (currentFieldId: string) => FormField | null;
  getPreviousField: (currentFieldId: string) => FormField | null;
  getFormData: () => Record<string, unknown>;
  importFormData: (data: Record<string, unknown>) => void;
}

export const useFormStore = create<FormState>()((set, get) => ({
  // Initial state
  fields: [],
  fieldsByPage: new Map(),
  focusedFieldId: null,
  validationErrors: new Map(),
  isDirty: false,
  isLoading: false,
  originalValues: new Map(),

  // Set form fields (called when document is loaded)
  setFields: (fields) => {
    // Group fields by page
    const fieldsByPage = new Map<number, FormField[]>();
    for (const field of fields) {
      const pageFields = fieldsByPage.get(field.pageIndex) || [];
      pageFields.push(field);
      fieldsByPage.set(field.pageIndex, pageFields);
    }

    // Store original values for reset functionality
    const originalValues = new Map<string, unknown>();
    for (const field of fields) {
      originalValues.set(field.id, field.value);
    }

    set({
      fields,
      fieldsByPage,
      originalValues,
      isDirty: false,
      validationErrors: new Map(),
    });
  },

  // Update a field value
  updateFieldValue: (fieldId, value) => {
    set((state) => {
      const newFields = state.fields.map((field) => {
        if (field.id === fieldId) {
          return { ...field, value } as FormField;
        }
        return field;
      });

      // Update fieldsByPage as well
      const fieldsByPage = new Map<number, FormField[]>();
      for (const field of newFields) {
        const pageFields = fieldsByPage.get(field.pageIndex) || [];
        pageFields.push(field);
        fieldsByPage.set(field.pageIndex, pageFields);
      }

      // Clear validation error for this field on change
      const newErrors = new Map(state.validationErrors);
      newErrors.delete(fieldId);

      return {
        fields: newFields,
        fieldsByPage,
        isDirty: true,
        validationErrors: newErrors,
      };
    });
  },

  // Set focused field
  setFocusedField: (fieldId) => {
    set({ focusedFieldId: fieldId });
  },

  // Set validation errors
  setValidationErrors: (errors) => {
    set({ validationErrors: errors });
  },

  // Clear validation error for a specific field
  clearValidationError: (fieldId) => {
    set((state) => {
      const newErrors = new Map(state.validationErrors);
      newErrors.delete(fieldId);
      return { validationErrors: newErrors };
    });
  },

  // Reset all fields to their original values
  resetToDefaults: () => {
    set((state) => {
      const newFields = state.fields.map((field) => {
        const originalValue = state.originalValues.get(field.id);
        if (originalValue !== undefined) {
          return { ...field, value: originalValue } as FormField;
        }
        return field;
      });

      // Update fieldsByPage
      const fieldsByPage = new Map<number, FormField[]>();
      for (const field of newFields) {
        const pageFields = fieldsByPage.get(field.pageIndex) || [];
        pageFields.push(field);
        fieldsByPage.set(field.pageIndex, pageFields);
      }

      return {
        fields: newFields,
        fieldsByPage,
        isDirty: false,
        validationErrors: new Map(),
      };
    });
  },

  // Clear all field values
  clearAllFields: () => {
    set((state) => {
      const newFields = state.fields.map((field) => {
        switch (field.type) {
          case 'text':
            return { ...field, value: '' };
          case 'checkbox':
            return { ...field, value: false };
          case 'radio':
            return { ...field, value: '' };
          case 'dropdown':
            return { ...field, value: '' };
          case 'signature':
            return { ...field, value: null };
          case 'date':
            return { ...field, value: null };
          case 'number':
            return { ...field, value: null };
          default:
            return field;
        }
      });

      // Update fieldsByPage
      const fieldsByPage = new Map<number, FormField[]>();
      for (const field of newFields) {
        const pageFields = fieldsByPage.get(field.pageIndex) || [];
        pageFields.push(field);
        fieldsByPage.set(field.pageIndex, pageFields);
      }

      return {
        fields: newFields,
        fieldsByPage,
        isDirty: true,
        validationErrors: new Map(),
      };
    });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Get a field by ID
  getFieldById: (fieldId) => {
    return get().fields.find((field) => field.id === fieldId);
  },

  // Get fields for a specific page
  getFieldsForPage: (pageIndex) => {
    return get().fieldsByPage.get(pageIndex) || [];
  },

  // Get next field in tab order
  getNextField: (currentFieldId) => {
    const { fields } = get();
    const currentIndex = fields.findIndex((f) => f.id === currentFieldId);
    if (currentIndex === -1 || currentIndex === fields.length - 1) {
      return null;
    }
    return fields[currentIndex + 1] ?? null;
  },

  // Get previous field in tab order
  getPreviousField: (currentFieldId) => {
    const { fields } = get();
    const currentIndex = fields.findIndex((f) => f.id === currentFieldId);
    if (currentIndex <= 0) {
      return null;
    }
    return fields[currentIndex - 1] ?? null;
  },

  // Get form data as key-value pairs (for export)
  getFormData: () => {
    const { fields } = get();
    const data: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.name) {
        data[field.name] = field.value;
      } else {
        data[field.id] = field.value;
      }
    }

    return data;
  },

  // Import form data from key-value pairs
  importFormData: (data) => {
    set((state) => {
      const newFields: FormField[] = state.fields.map((field): FormField => {
        const key = field.name || field.id;
        if (key in data) {
          const value = data[key];
          // Type check and convert value based on field type
          switch (field.type) {
            case 'text':
              return { ...field, value: String(value ?? '') };
            case 'checkbox':
              return { ...field, value: Boolean(value) };
            case 'radio':
              return { ...field, value: String(value ?? '') };
            case 'dropdown':
              return { ...field, value: String(value ?? '') };
            case 'number':
              return {
                ...field,
                value: value === null ? null : Number(value),
              };
            case 'signature':
              return {
                ...field,
                value: typeof value === 'string' ? value : null,
              };
            case 'date':
              return {
                ...field,
                value: typeof value === 'string' ? value : null,
              };
            default:
              return field;
          }
        }
        return field;
      });

      // Update fieldsByPage
      const fieldsByPage = new Map<number, FormField[]>();
      for (const field of newFields) {
        const pageFields = fieldsByPage.get(field.pageIndex) || [];
        pageFields.push(field);
        fieldsByPage.set(field.pageIndex, pageFields);
      }

      return {
        fields: newFields,
        fieldsByPage,
        isDirty: true,
      };
    });
  },
}));
