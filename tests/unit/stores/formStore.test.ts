import { describe, it, expect, beforeEach } from 'vitest';
import { useFormStore } from '@stores/formStore';
import type { FormField, TextFormField, CheckboxFormField } from '@/types/forms';

describe('formStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFormStore.setState({
      fields: [],
      fieldsByPage: new Map(),
      focusedFieldId: null,
      validationErrors: new Map(),
      isDirty: false,
      isLoading: false,
      originalValues: new Map(),
    });
  });

  const createMockTextField = (overrides: Partial<TextFormField> = {}): TextFormField => ({
    id: 'field-1',
    type: 'text',
    pageIndex: 0,
    name: 'firstName',
    bounds: { x: 100, y: 100, width: 200, height: 20 },
    required: false,
    readonly: false,
    value: '',
    ...overrides,
  });

  const createMockCheckboxField = (overrides: Partial<CheckboxFormField> = {}): CheckboxFormField => ({
    id: 'field-2',
    type: 'checkbox',
    pageIndex: 0,
    name: 'agree',
    bounds: { x: 100, y: 150, width: 20, height: 20 },
    required: false,
    readonly: false,
    value: false,
    ...overrides,
  });

  describe('setFields', () => {
    it('should set form fields', () => {
      const fields: FormField[] = [createMockTextField()];
      useFormStore.getState().setFields(fields);

      expect(useFormStore.getState().fields).toHaveLength(1);
      expect(useFormStore.getState().fields[0].id).toBe('field-1');
    });

    it('should group fields by page', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', pageIndex: 0 }),
        createMockTextField({ id: 'field-2', pageIndex: 0 }),
        createMockTextField({ id: 'field-3', pageIndex: 1 }),
      ];
      useFormStore.getState().setFields(fields);

      const page0Fields = useFormStore.getState().getFieldsForPage(0);
      const page1Fields = useFormStore.getState().getFieldsForPage(1);

      expect(page0Fields).toHaveLength(2);
      expect(page1Fields).toHaveLength(1);
    });

    it('should store original values for reset functionality', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', value: 'original' }),
      ];
      useFormStore.getState().setFields(fields);

      const state = useFormStore.getState();
      expect(state.originalValues.get('field-1')).toBe('original');
    });

    it('should reset isDirty flag', () => {
      useFormStore.setState({ isDirty: true });
      useFormStore.getState().setFields([createMockTextField()]);

      expect(useFormStore.getState().isDirty).toBe(false);
    });
  });

  describe('updateFieldValue', () => {
    beforeEach(() => {
      const fields: FormField[] = [createMockTextField({ id: 'field-1', value: '' })];
      useFormStore.getState().setFields(fields);
    });

    it('should update field value', () => {
      useFormStore.getState().updateFieldValue('field-1', 'new value');

      const field = useFormStore.getState().getFieldById('field-1');
      expect((field as TextFormField).value).toBe('new value');
    });

    it('should set isDirty flag', () => {
      useFormStore.getState().updateFieldValue('field-1', 'new value');

      expect(useFormStore.getState().isDirty).toBe(true);
    });

    it('should update fieldsByPage', () => {
      useFormStore.getState().updateFieldValue('field-1', 'updated');

      const pageFields = useFormStore.getState().getFieldsForPage(0);
      expect((pageFields[0] as TextFormField).value).toBe('updated');
    });

    it('should clear validation error for updated field', () => {
      const errors = new Map<string, string[]>([['field-1', ['Error']]]);
      useFormStore.setState({ validationErrors: errors });

      useFormStore.getState().updateFieldValue('field-1', 'new value');

      expect(useFormStore.getState().validationErrors.has('field-1')).toBe(false);
    });
  });

  describe('setFocusedField', () => {
    it('should set focused field ID', () => {
      useFormStore.getState().setFocusedField('field-1');

      expect(useFormStore.getState().focusedFieldId).toBe('field-1');
    });

    it('should clear focused field when null', () => {
      useFormStore.getState().setFocusedField('field-1');
      useFormStore.getState().setFocusedField(null);

      expect(useFormStore.getState().focusedFieldId).toBeNull();
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all fields to original values', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', value: 'original' }),
      ];
      useFormStore.getState().setFields(fields);
      useFormStore.getState().updateFieldValue('field-1', 'modified');

      useFormStore.getState().resetToDefaults();

      const field = useFormStore.getState().getFieldById('field-1');
      expect((field as TextFormField).value).toBe('original');
    });

    it('should clear isDirty flag', () => {
      useFormStore.getState().setFields([createMockTextField()]);
      useFormStore.getState().updateFieldValue('field-1', 'modified');
      useFormStore.getState().resetToDefaults();

      expect(useFormStore.getState().isDirty).toBe(false);
    });

    it('should clear validation errors', () => {
      const errors = new Map<string, string[]>([['field-1', ['Error']]]);
      useFormStore.setState({ validationErrors: errors });

      useFormStore.getState().resetToDefaults();

      expect(useFormStore.getState().validationErrors.size).toBe(0);
    });
  });

  describe('clearAllFields', () => {
    it('should clear text fields to empty string', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', value: 'some value' }),
      ];
      useFormStore.getState().setFields(fields);

      useFormStore.getState().clearAllFields();

      const field = useFormStore.getState().getFieldById('field-1');
      expect((field as TextFormField).value).toBe('');
    });

    it('should clear checkbox fields to false', () => {
      const fields: FormField[] = [
        createMockCheckboxField({ id: 'field-2', value: true }),
      ];
      useFormStore.getState().setFields(fields);

      useFormStore.getState().clearAllFields();

      const field = useFormStore.getState().getFieldById('field-2');
      expect((field as CheckboxFormField).value).toBe(false);
    });

    it('should set isDirty flag', () => {
      useFormStore.getState().setFields([createMockTextField()]);
      useFormStore.getState().clearAllFields();

      expect(useFormStore.getState().isDirty).toBe(true);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', pageIndex: 0 }),
        createMockTextField({ id: 'field-2', pageIndex: 0 }),
        createMockTextField({ id: 'field-3', pageIndex: 1 }),
      ];
      useFormStore.getState().setFields(fields);
    });

    it('should get next field', () => {
      const nextField = useFormStore.getState().getNextField('field-1');
      expect(nextField?.id).toBe('field-2');
    });

    it('should return null for last field', () => {
      const nextField = useFormStore.getState().getNextField('field-3');
      expect(nextField).toBeNull();
    });

    it('should get previous field', () => {
      const prevField = useFormStore.getState().getPreviousField('field-2');
      expect(prevField?.id).toBe('field-1');
    });

    it('should return null for first field', () => {
      const prevField = useFormStore.getState().getPreviousField('field-1');
      expect(prevField).toBeNull();
    });
  });

  describe('getFormData', () => {
    it('should return field values as key-value pairs', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', name: 'firstName', value: 'John' }),
        createMockTextField({ id: 'field-2', name: 'lastName', value: 'Doe' }),
      ];
      useFormStore.getState().setFields(fields);

      const formData = useFormStore.getState().getFormData();

      expect(formData).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should use field ID as key when name is empty', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', name: '', value: 'John' }),
      ];
      useFormStore.getState().setFields(fields);

      const formData = useFormStore.getState().getFormData();

      expect(formData['field-1']).toBe('John');
    });
  });

  describe('importFormData', () => {
    it('should import form data from key-value pairs', () => {
      const fields: FormField[] = [
        createMockTextField({ id: 'field-1', name: 'firstName', value: '' }),
      ];
      useFormStore.getState().setFields(fields);

      useFormStore.getState().importFormData({ firstName: 'John' });

      const field = useFormStore.getState().getFieldById('field-1');
      expect((field as TextFormField).value).toBe('John');
    });

    it('should set isDirty flag', () => {
      useFormStore.getState().setFields([createMockTextField({ name: 'firstName' })]);
      useFormStore.getState().importFormData({ firstName: 'John' });

      expect(useFormStore.getState().isDirty).toBe(true);
    });

    it('should convert values to appropriate types', () => {
      const fields: FormField[] = [
        createMockCheckboxField({ id: 'field-1', name: 'agree', value: false }),
      ];
      useFormStore.getState().setFields(fields);

      useFormStore.getState().importFormData({ agree: true });

      const field = useFormStore.getState().getFieldById('field-1');
      expect((field as CheckboxFormField).value).toBe(true);
    });
  });
});
