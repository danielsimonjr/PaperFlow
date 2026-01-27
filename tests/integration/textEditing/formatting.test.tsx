import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTextStore } from '@stores/textStore';
import { FontPicker } from '@components/editor/FontPicker';
import { FontSizePicker } from '@components/editor/FontSizePicker';
import { TextColorPicker } from '@components/editor/TextColorPicker';
import { AlignmentPicker } from '@components/editor/AlignmentPicker';
import { LineSpacing } from '@components/editor/LineSpacing';

describe('Text Formatting Integration', () => {
  beforeEach(() => {
    // Reset text store
    useTextStore.setState({
      textBoxes: [],
      selectedId: null,
      activeTool: null,
      editingId: null,
      defaultProperties: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
      },
    });
  });

  describe('FontPicker', () => {
    it('should display current font', () => {
      render(<FontPicker value="Georgia" onChange={() => {}} />);

      expect(screen.getByText('Georgia')).toBeInTheDocument();
    });

    it('should open dropdown on click', () => {
      render(<FontPicker value="Arial" onChange={() => {}} />);

      fireEvent.click(screen.getByRole('button'));

      // Should show font options
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should call onChange when font is selected', () => {
      const onChange = vi.fn();
      render(<FontPicker value="Arial" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Georgia'));

      expect(onChange).toHaveBeenCalledWith('Georgia');
    });

    it('should show checkmark for selected font', () => {
      render(<FontPicker value="Times New Roman" onChange={() => {}} />);

      fireEvent.click(screen.getByRole('button'));

      const selectedOption = screen.getByRole('option', {
        name: /Times New Roman/,
      });
      expect(selectedOption.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('FontSizePicker', () => {
    it('should display current size', () => {
      render(<FontSizePicker value={14} onChange={() => {}} />);

      expect(screen.getByDisplayValue('14')).toBeInTheDocument();
    });

    it('should allow typing custom size', () => {
      const onChange = vi.fn();
      render(<FontSizePicker value={12} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '24' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith(24);
    });

    it('should clamp values to valid range', () => {
      const onChange = vi.fn();
      render(
        <FontSizePicker value={12} onChange={onChange} min={8} max={72} />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith(72); // Should be clamped to max
    });

    it('should open dropdown with common sizes', () => {
      render(<FontSizePicker value={12} onChange={() => {}} />);

      fireEvent.click(screen.getByRole('button', { name: /select font size/i }));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '12' })).toBeInTheDocument();
    });
  });

  describe('TextColorPicker', () => {
    it('should display current color', () => {
      const { container } = render(
        <TextColorPicker value="#FF0000" onChange={() => {}} />
      );

      const colorSwatch = container.querySelector(
        '[style*="background-color: rgb(255, 0, 0)"]'
      );
      expect(colorSwatch).toBeInTheDocument();
    });

    it('should open dropdown on click', () => {
      render(<TextColorPicker value="#000000" onChange={() => {}} />);

      fireEvent.click(screen.getByRole('button'));

      // Should show color palette
      expect(screen.getByText('Custom:')).toBeInTheDocument();
    });

    it('should call onChange when color is selected', () => {
      const onChange = vi.fn();
      render(<TextColorPicker value="#000000" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button'));
      // Click a color from the palette (e.g., Red)
      const redButton = screen.getByTitle('Red');
      fireEvent.click(redButton);

      expect(onChange).toHaveBeenCalledWith('#EF4444');
    });

    it('should support custom color input', () => {
      const onChange = vi.fn();
      render(<TextColorPicker value="#000000" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button'));

      const hexInput = screen.getByPlaceholderText('#000000');
      fireEvent.change(hexInput, { target: { value: '#123456' } });

      expect(onChange).toHaveBeenCalledWith('#123456');
    });
  });

  describe('AlignmentPicker', () => {
    it('should highlight current alignment', () => {
      render(<AlignmentPicker value="center" onChange={() => {}} />);

      const centerButton = screen.getByRole('button', { name: /center/i });
      expect(centerButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onChange when alignment is selected', () => {
      const onChange = vi.fn();
      render(<AlignmentPicker value="left" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: /right/i }));

      expect(onChange).toHaveBeenCalledWith('right');
    });

    it('should render all alignment options', () => {
      render(<AlignmentPicker value="left" onChange={() => {}} />);

      expect(screen.getByRole('button', { name: /left/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /center/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /right/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /justify/i })
      ).toBeInTheDocument();
    });
  });

  describe('LineSpacing', () => {
    it('should display current spacing', () => {
      render(<LineSpacing value={1.5} onChange={() => {}} />);

      expect(screen.getByText('1.5')).toBeInTheDocument();
    });

    it('should open dropdown on click', () => {
      render(<LineSpacing value={1} onChange={() => {}} />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should call onChange when spacing is selected', () => {
      const onChange = vi.fn();
      render(<LineSpacing value={1} onChange={onChange} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('option', { name: /double/i }));

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('should show custom value if not a preset', () => {
      render(<LineSpacing value={1.75} onChange={() => {}} />);

      expect(screen.getByText('1.75')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should update default properties', () => {
      useTextStore.getState().setDefaultProperties({
        fontFamily: 'Georgia',
        fontSize: 16,
        color: '#FF0000',
      });

      const defaults = useTextStore.getState().defaultProperties;
      expect(defaults.fontFamily).toBe('Georgia');
      expect(defaults.fontSize).toBe(16);
      expect(defaults.color).toBe('#FF0000');
    });

    it('should apply default properties to new text boxes', () => {
      useTextStore.getState().setDefaultProperties({
        fontFamily: 'Times New Roman',
        fontSize: 18,
        fontWeight: 'bold',
      });

      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 0, y: 0, width: 100, height: 50 },
        content: 'Test',
        ...useTextStore.getState().defaultProperties,
        rotation: 0,
      });

      const textBox = useTextStore.getState().getTextBox(id);
      expect(textBox?.fontFamily).toBe('Times New Roman');
      expect(textBox?.fontSize).toBe(18);
      expect(textBox?.fontWeight).toBe('bold');
    });
  });
});
