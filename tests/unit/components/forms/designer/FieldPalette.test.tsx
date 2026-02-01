/**
 * Tests for Field Palette Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldPalette } from '@/components/forms/designer/FieldPalette';
import { useFormDesignerStore } from '@/stores/formDesignerStore';

describe('FieldPalette', () => {
  beforeEach(() => {
    useFormDesignerStore.setState({
      isDesignMode: true,
      isPreviewMode: false,
      isDragging: false,
      draggedFieldType: null,
    });
  });

  it('should render all field types', () => {
    render(<FieldPalette />);

    expect(screen.getByText('Text Field')).toBeInTheDocument();
    expect(screen.getByText('Text Area')).toBeInTheDocument();
    expect(screen.getByText('Checkbox')).toBeInTheDocument();
    expect(screen.getByText('Radio Buttons')).toBeInTheDocument();
    expect(screen.getByText('Dropdown')).toBeInTheDocument();
    expect(screen.getByText('Date Picker')).toBeInTheDocument();
    expect(screen.getByText('Signature')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('should render field descriptions', () => {
    render(<FieldPalette />);

    expect(screen.getByText('Single-line text input')).toBeInTheDocument();
    expect(screen.getByText('Multi-line text input')).toBeInTheDocument();
    expect(screen.getByText('Checkbox for yes/no selection')).toBeInTheDocument();
  });

  it('should render tips section', () => {
    render(<FieldPalette />);

    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('• Drag fields to position them')).toBeInTheDocument();
  });

  it('should not render in preview mode', () => {
    useFormDesignerStore.setState({ isPreviewMode: true });

    const { container } = render(<FieldPalette />);

    expect(container.firstChild).toBeNull();
  });

  it('should have draggable field items', () => {
    render(<FieldPalette />);

    const textFieldItem = screen.getByText('Text Field').closest('[draggable]');
    expect(textFieldItem).toHaveAttribute('draggable', 'true');
  });

  it('should set dragging state on drag start', () => {
    render(<FieldPalette />);

    const textFieldItem = screen.getByText('Text Field').closest('[draggable]')!;

    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    };

    fireEvent.dragStart(textFieldItem, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('fieldType', 'textField');
    expect(useFormDesignerStore.getState().isDragging).toBe(true);
    expect(useFormDesignerStore.getState().draggedFieldType).toBe('textField');
  });

  it('should clear dragging state on drag end', () => {
    useFormDesignerStore.setState({
      isDragging: true,
      draggedFieldType: 'textField',
    });

    render(<FieldPalette />);

    const textFieldItem = screen.getByText('Text Field').closest('[draggable]')!;
    fireEvent.dragEnd(textFieldItem);

    expect(useFormDesignerStore.getState().isDragging).toBe(false);
    expect(useFormDesignerStore.getState().draggedFieldType).toBeNull();
  });

  it('should show form fields heading', () => {
    render(<FieldPalette />);

    expect(screen.getByText('Form Fields')).toBeInTheDocument();
  });

  it('should show drag instructions', () => {
    render(<FieldPalette />);

    expect(screen.getByText('Drag and drop fields onto the PDF page')).toBeInTheDocument();
  });
});
