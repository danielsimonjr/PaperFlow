import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormActions } from '@components/forms/FormActions';
import { useFormStore } from '@stores/formStore';
import type { TextFormField } from '@/types/forms';

// Mock dependencies
vi.mock('@stores/formStore', () => ({
  useFormStore: vi.fn(),
}));

vi.mock('@lib/forms/exportImport', () => ({
  downloadFormDataAsJSON: vi.fn(),
}));

vi.mock('@lib/forms/fdfExport', () => ({
  downloadFormDataAsFDF: vi.fn(),
}));

vi.mock('@lib/forms/xfdfExport', () => ({
  downloadFormDataAsXFDF: vi.fn(),
}));

vi.mock('@lib/forms/importData', () => ({
  triggerImportDialog: vi.fn(),
}));

vi.mock('@lib/forms/validation', () => ({
  validateForm: vi.fn(() => ({
    isValid: true,
    errors: new Map(),
    invalidFields: [],
    firstInvalidField: null,
  })),
  getValidationSummary: vi.fn(() => 'All fields are valid'),
}));

describe('FormActions', () => {
  const mockFields: TextFormField[] = [
    {
      id: 'field-1',
      type: 'text',
      pageIndex: 0,
      name: 'firstName',
      bounds: { x: 100, y: 100, width: 200, height: 20 },
      required: false,
      readonly: false,
      value: 'John',
    },
  ];

  const mockClearAllFields = vi.fn();
  const mockResetToDefaults = vi.fn();
  const mockImportFormData = vi.fn();
  const mockSetValidationErrors = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useFormStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      return selector({
        fields: mockFields,
        isDirty: true,
        clearAllFields: mockClearAllFields,
        resetToDefaults: mockResetToDefaults,
        importFormData: mockImportFormData,
        setValidationErrors: mockSetValidationErrors,
      });
    });
  });

  it('should render nothing when no fields', () => {
    (useFormStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      return selector({
        fields: [],
        isDirty: false,
        clearAllFields: mockClearAllFields,
        resetToDefaults: mockResetToDefaults,
        importFormData: mockImportFormData,
        setValidationErrors: mockSetValidationErrors,
      });
    });

    const { container } = render(<FormActions />);
    expect(container.firstChild).toBeNull();
  });

  it('should render action buttons when fields exist', () => {
    render(<FormActions />);

    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should show export dropdown when clicked', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Export'));

    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('FDF')).toBeInTheDocument();
    expect(screen.getByText('XFDF')).toBeInTheDocument();
  });

  it('should show confirmation when Clear All is clicked', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Clear All'));

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call clearAllFields when confirmed', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Clear All'));
    fireEvent.click(screen.getByText('Confirm'));

    expect(mockClearAllFields).toHaveBeenCalled();
  });

  it('should hide confirmation when Cancel is clicked', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Clear All'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should show Reset button when isDirty', () => {
    render(<FormActions />);

    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should call resetToDefaults when Reset is confirmed', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Reset'));
    fireEvent.click(screen.getByText('Confirm'));

    expect(mockResetToDefaults).toHaveBeenCalled();
  });

  it('should call setValidationErrors when Validate is clicked', () => {
    render(<FormActions />);

    fireEvent.click(screen.getByText('Validate'));

    expect(mockSetValidationErrors).toHaveBeenCalled();
  });
});
