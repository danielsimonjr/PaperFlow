import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from '@components/forms/TextField';
import { Checkbox } from '@components/forms/Checkbox';
import { Dropdown } from '@components/forms/Dropdown';
import { FormFieldRenderer } from '@components/forms/FormFieldRenderer';
import { useFormStore } from '@stores/formStore';
import type { TextFormField, CheckboxFormField, DropdownFormField } from '@/types/forms';

// Mock the form store
vi.mock('@stores/formStore', () => ({
  useFormStore: vi.fn(),
}));

describe('Form Field Components', () => {
  const mockUpdateFieldValue = vi.fn();
  const mockSetFocusedField = vi.fn();

  const baseStoreState = {
    updateFieldValue: mockUpdateFieldValue,
    focusedFieldId: null,
    validationErrors: new Map(),
    setFocusedField: mockSetFocusedField,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useFormStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      return selector(baseStoreState);
    });
  });

  describe('TextField', () => {
    const mockTextField: TextFormField = {
      id: 'text-field-1',
      type: 'text',
      pageIndex: 0,
      name: 'firstName',
      bounds: { x: 100, y: 100, width: 200, height: 20 },
      required: false,
      readonly: false,
      value: 'initial value',
    };

    it('should render input with correct value', () => {
      render(
        <TextField
          field={mockTextField}
          scale={1}
          pageHeight={800}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial value');
    });

    it('should render textarea for multiline fields', () => {
      render(
        <TextField
          field={{ ...mockTextField, multiline: true }}
          scale={1}
          pageHeight={800}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should update value on change', () => {
      render(
        <TextField
          field={mockTextField}
          scale={1}
          pageHeight={800}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      // Local value updates immediately
      expect(input).toHaveValue('new value');
    });

    it('should call onTab when Tab is pressed', () => {
      const onTab = vi.fn();
      render(
        <TextField
          field={mockTextField}
          scale={1}
          pageHeight={800}
          onTab={onTab}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Tab' });

      expect(onTab).toHaveBeenCalledWith(false);
    });

    it('should call onTab with true when Shift+Tab is pressed', () => {
      const onTab = vi.fn();
      render(
        <TextField
          field={mockTextField}
          scale={1}
          pageHeight={800}
          onTab={onTab}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });

      expect(onTab).toHaveBeenCalledWith(true);
    });

    it('should show character count when near limit', () => {
      render(
        <TextField
          field={{ ...mockTextField, maxLength: 10, value: 'abcdefgh' }}
          scale={1}
          pageHeight={800}
        />
      );

      // Character count should show when at 80% of max
      expect(screen.getByText('2')).toBeInTheDocument(); // 10 - 8 = 2 remaining
    });

    it('should disable input when readonly', () => {
      render(
        <TextField
          field={{ ...mockTextField, readonly: true }}
          scale={1}
          pageHeight={800}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Checkbox', () => {
    const mockCheckboxField: CheckboxFormField = {
      id: 'checkbox-1',
      type: 'checkbox',
      pageIndex: 0,
      name: 'agree',
      bounds: { x: 100, y: 100, width: 20, height: 20 },
      required: false,
      readonly: false,
      value: false,
    };

    it('should render checkbox with unchecked state', () => {
      render(
        <Checkbox
          field={mockCheckboxField}
          scale={1}
          pageHeight={800}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('should render checkbox with checked state', () => {
      render(
        <Checkbox
          field={{ ...mockCheckboxField, value: true }}
          scale={1}
          pageHeight={800}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle value on click', () => {
      render(
        <Checkbox
          field={mockCheckboxField}
          scale={1}
          pageHeight={800}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockUpdateFieldValue).toHaveBeenCalledWith('checkbox-1', true);
    });

    it('should call onValueChange after toggle', () => {
      const onValueChange = vi.fn();
      render(
        <Checkbox
          field={mockCheckboxField}
          scale={1}
          pageHeight={800}
          onValueChange={onValueChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onValueChange).toHaveBeenCalled();
    });

    it('should not toggle when readonly', () => {
      render(
        <Checkbox
          field={{ ...mockCheckboxField, readonly: true }}
          scale={1}
          pageHeight={800}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockUpdateFieldValue).not.toHaveBeenCalled();
    });
  });

  describe('Dropdown', () => {
    const mockDropdownField: DropdownFormField = {
      id: 'dropdown-1',
      type: 'dropdown',
      pageIndex: 0,
      name: 'country',
      bounds: { x: 100, y: 100, width: 200, height: 25 },
      required: false,
      readonly: false,
      value: '',
      options: ['USA', 'Canada', 'Mexico'],
    };

    it('should render select with options', () => {
      render(
        <Dropdown
          field={mockDropdownField}
          scale={1}
          pageHeight={800}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Check options are present
      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
      expect(screen.getByText('Mexico')).toBeInTheDocument();
    });

    it('should update value on selection', () => {
      render(
        <Dropdown
          field={mockDropdownField}
          scale={1}
          pageHeight={800}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Canada' } });

      expect(mockUpdateFieldValue).toHaveBeenCalledWith('dropdown-1', 'Canada');
    });

    it('should render editable dropdown when allowCustom is true', () => {
      render(
        <Dropdown
          field={{ ...mockDropdownField, allowCustom: true }}
          scale={1}
          pageHeight={800}
        />
      );

      // Should render input instead of select
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('FormFieldRenderer', () => {
    it('should render TextField for text type', () => {
      const textField: TextFormField = {
        id: 'text-1',
        type: 'text',
        pageIndex: 0,
        name: 'name',
        bounds: { x: 0, y: 0, width: 100, height: 20 },
        required: false,
        readonly: false,
        value: '',
      };

      render(
        <FormFieldRenderer
          field={textField}
          scale={1}
          pageHeight={800}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render Checkbox for checkbox type', () => {
      const checkboxField: CheckboxFormField = {
        id: 'check-1',
        type: 'checkbox',
        pageIndex: 0,
        name: 'agree',
        bounds: { x: 0, y: 0, width: 20, height: 20 },
        required: false,
        readonly: false,
        value: false,
      };

      render(
        <FormFieldRenderer
          field={checkboxField}
          scale={1}
          pageHeight={800}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should render Dropdown for dropdown type', () => {
      const dropdownField: DropdownFormField = {
        id: 'drop-1',
        type: 'dropdown',
        pageIndex: 0,
        name: 'option',
        bounds: { x: 0, y: 0, width: 100, height: 25 },
        required: false,
        readonly: false,
        value: '',
        options: ['A', 'B', 'C'],
      };

      render(
        <FormFieldRenderer
          field={dropdownField}
          scale={1}
          pageHeight={800}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render placeholder for signature type', () => {
      const signatureField = {
        id: 'sig-1',
        type: 'signature' as const,
        pageIndex: 0,
        name: 'signature',
        bounds: { x: 0, y: 0, width: 200, height: 50 },
        required: false,
        readonly: false,
        value: null,
      };

      render(
        <FormFieldRenderer
          field={signatureField}
          scale={1}
          pageHeight={800}
        />
      );

      expect(screen.getByText('Signature')).toBeInTheDocument();
    });
  });
});
