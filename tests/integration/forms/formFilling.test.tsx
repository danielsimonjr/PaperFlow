import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormLayer } from '@components/forms/FormLayer';
import { useFormStore } from '@stores/formStore';
import type { TextFormField, CheckboxFormField, DropdownFormField } from '@/types/forms';

// Create actual store instance for integration tests
describe('Form Filling Integration', () => {
  const mockTextField: TextFormField = {
    id: 'text-1',
    type: 'text',
    pageIndex: 0,
    name: 'firstName',
    bounds: { x: 100, y: 700, width: 200, height: 20 },
    required: true,
    readonly: false,
    value: '',
  };

  const mockCheckboxField: CheckboxFormField = {
    id: 'checkbox-1',
    type: 'checkbox',
    pageIndex: 0,
    name: 'agree',
    bounds: { x: 100, y: 650, width: 20, height: 20 },
    required: true,
    readonly: false,
    value: false,
  };

  const mockDropdownField: DropdownFormField = {
    id: 'dropdown-1',
    type: 'dropdown',
    pageIndex: 0,
    name: 'country',
    bounds: { x: 100, y: 600, width: 200, height: 25 },
    required: false,
    readonly: false,
    value: '',
    options: ['USA', 'Canada', 'Mexico'],
  };

  beforeEach(() => {
    // Reset store state
    useFormStore.setState({
      fields: [mockTextField, mockCheckboxField, mockDropdownField],
      fieldsByPage: new Map([[0, [mockTextField, mockCheckboxField, mockDropdownField]]]),
      focusedFieldId: null,
      validationErrors: new Map(),
      isDirty: false,
      isLoading: false,
      originalValues: new Map([
        ['text-1', ''],
        ['checkbox-1', false],
        ['dropdown-1', ''],
      ]),
    });
  });

  it('should render all form fields on a page', () => {
    render(
      <FormLayer
        pageIndex={0}
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    // Text field
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Checkbox
    expect(screen.getByRole('checkbox')).toBeInTheDocument();

    // Dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should allow filling text field', async () => {
    render(
      <FormLayer
        pageIndex={0}
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    const textInput = screen.getByRole('textbox');
    fireEvent.change(textInput, { target: { value: 'John' } });
    fireEvent.blur(textInput);

    await waitFor(() => {
      expect(useFormStore.getState().isDirty).toBe(true);
    });
  });

  it('should allow toggling checkbox', async () => {
    render(
      <FormLayer
        pageIndex={0}
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      const field = useFormStore.getState().getFieldById('checkbox-1');
      expect((field as CheckboxFormField).value).toBe(true);
    });
  });

  it('should allow selecting dropdown option', async () => {
    render(
      <FormLayer
        pageIndex={0}
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'Canada' } });

    await waitFor(() => {
      const field = useFormStore.getState().getFieldById('dropdown-1');
      expect((field as DropdownFormField).value).toBe('Canada');
    });
  });

  it('should mark form as dirty after changes', async () => {
    render(
      <FormLayer
        pageIndex={0}
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    expect(useFormStore.getState().isDirty).toBe(false);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(useFormStore.getState().isDirty).toBe(true);
    });
  });

  it('should reset fields to original values', async () => {
    // Set initial values
    useFormStore.getState().updateFieldValue('text-1', 'Modified');
    useFormStore.getState().updateFieldValue('checkbox-1', true);

    // Reset
    useFormStore.getState().resetToDefaults();

    const textField = useFormStore.getState().getFieldById('text-1');
    const checkboxField = useFormStore.getState().getFieldById('checkbox-1');

    expect((textField as TextFormField).value).toBe('');
    expect((checkboxField as CheckboxFormField).value).toBe(false);
    expect(useFormStore.getState().isDirty).toBe(false);
  });

  it('should clear all field values', async () => {
    // Set values
    useFormStore.getState().updateFieldValue('text-1', 'John');
    useFormStore.getState().updateFieldValue('checkbox-1', true);
    useFormStore.getState().updateFieldValue('dropdown-1', 'USA');

    // Clear all
    useFormStore.getState().clearAllFields();

    const textField = useFormStore.getState().getFieldById('text-1');
    const checkboxField = useFormStore.getState().getFieldById('checkbox-1');
    const dropdownField = useFormStore.getState().getFieldById('dropdown-1');

    expect((textField as TextFormField).value).toBe('');
    expect((checkboxField as CheckboxFormField).value).toBe(false);
    expect((dropdownField as DropdownFormField).value).toBe('');
  });

  it('should import form data correctly', () => {
    const importData = {
      firstName: 'Jane',
      agree: true,
      country: 'Mexico',
    };

    useFormStore.getState().importFormData(importData);

    const textField = useFormStore.getState().getFieldById('text-1');
    const checkboxField = useFormStore.getState().getFieldById('checkbox-1');
    const dropdownField = useFormStore.getState().getFieldById('dropdown-1');

    expect((textField as TextFormField).value).toBe('Jane');
    expect((checkboxField as CheckboxFormField).value).toBe(true);
    expect((dropdownField as DropdownFormField).value).toBe('Mexico');
  });

  it('should export form data correctly', () => {
    useFormStore.getState().updateFieldValue('text-1', 'John');
    useFormStore.getState().updateFieldValue('checkbox-1', true);
    useFormStore.getState().updateFieldValue('dropdown-1', 'Canada');

    const formData = useFormStore.getState().getFormData();

    expect(formData).toEqual({
      firstName: 'John',
      agree: true,
      country: 'Canada',
    });
  });

  it('should not render fields for different page', () => {
    const { container } = render(
      <FormLayer
        pageIndex={1} // Different page
        width={600}
        height={800}
        scale={1}
        pageHeight={800}
      />
    );

    // Should not render any fields since all are on page 0
    expect(container.firstChild).toBeNull();
  });
});
