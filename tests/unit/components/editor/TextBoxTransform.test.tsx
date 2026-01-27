import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTextStore } from '@stores/textStore';
import { TextBoxTransform } from '@components/editor/TextBoxTransform';
import type { TextBox } from '@/types/text';

// Mock the history store
vi.mock('@stores/historyStore', () => ({
  useHistoryStore: {
    getState: vi.fn(() => ({
      push: vi.fn(),
    })),
  },
}));

describe('TextBoxTransform', () => {
  const mockTextBox: TextBox = {
    id: 'test-textbox-1',
    pageIndex: 0,
    bounds: { x: 100, y: 200, width: 150, height: 50 },
    content: 'Test content',
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    alignment: 'left',
    lineSpacing: 1,
    rotation: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset text store state
    useTextStore.setState({
      textBoxes: [mockTextBox],
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

  describe('rendering', () => {
    it('should render text box content', () => {
      render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should show placeholder when content is empty', () => {
      const emptyTextBox = { ...mockTextBox, content: '' };

      render(
        <TextBoxTransform
          textBox={emptyTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      expect(screen.getByText('Click to add text')).toBeInTheDocument();
    });

    it('should apply text alignment correctly', () => {
      const centeredTextBox: TextBox = {
        ...mockTextBox,
        alignment: 'center',
      };

      render(
        <TextBoxTransform
          textBox={centeredTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ textAlign: 'center' });
    });

    it('should apply text decoration correctly', () => {
      const underlinedTextBox: TextBox = {
        ...mockTextBox,
        textDecoration: 'underline',
      };

      render(
        <TextBoxTransform
          textBox={underlinedTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ textDecoration: 'underline' });
    });
  });

  describe('selection', () => {
    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn();

      render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
          onSelect={onSelect}
        />
      );

      fireEvent.click(screen.getByText('Test content'));

      expect(onSelect).toHaveBeenCalled();
    });

    it('should show selection ring when selected', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('ring-2');
    });

    it('should show hover ring when not selected', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('hover:ring-1');
    });
  });

  describe('resize handles', () => {
    it('should show 8 resize handles when selected', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={false}
        />
      );

      const handles = container.querySelectorAll('.rounded-full');
      expect(handles.length).toBe(8);
    });

    it('should not show resize handles when not selected', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const handles = container.querySelectorAll('.rounded-full');
      expect(handles.length).toBe(0);
    });

    it('should have correct cursor styles for handles', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={false}
        />
      );

      const handles = container.querySelectorAll('.rounded-full');
      // Verify at least one handle has a resize cursor class
      const handleClasses = Array.from(handles).map((h) => h.className);
      expect(handleClasses.some((c) => c.includes('cursor-'))).toBe(true);
    });
  });

  describe('editing', () => {
    it('should call onStartEdit on double click', () => {
      const onStartEdit = vi.fn();

      render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={false}
          onStartEdit={onStartEdit}
        />
      );

      fireEvent.doubleClick(screen.getByText('Test content'));

      expect(onStartEdit).toHaveBeenCalled();
    });

    it('should render InlineTextEditor when isEditing is true', () => {
      render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={true}
        />
      );

      // The InlineTextEditor should render content in a contenteditable div
      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('positioning and scaling', () => {
    it('should position correctly based on PDF coordinates', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // At 100% scale with pageHeight 792 and textBox at y=200 with height=50:
      // screenY = (792 - 200 - 50) * 1 = 542
      expect(wrapper.style.left).toBe('100px');
      expect(wrapper.style.top).toBe('542px');
    });

    it('should scale dimensions correctly', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={200}
          isSelected={false}
          isEditing={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // At 200% scale, width should be 150 * 2 = 300
      expect(wrapper.style.width).toBe('300px');
    });

    it('should apply line spacing correctly', () => {
      const spacedTextBox: TextBox = {
        ...mockTextBox,
        lineSpacing: 1.5,
      };

      render(
        <TextBoxTransform
          textBox={spacedTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ lineHeight: '1.5' });
    });
  });

  describe('font styling', () => {
    it('should apply font family correctly', () => {
      const textBoxWithFont: TextBox = {
        ...mockTextBox,
        fontFamily: 'Georgia',
      };

      render(
        <TextBoxTransform
          textBox={textBoxWithFont}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ fontFamily: 'Georgia' });
    });

    it('should apply bold font weight correctly', () => {
      const boldTextBox: TextBox = {
        ...mockTextBox,
        fontWeight: 'bold',
      };

      render(
        <TextBoxTransform
          textBox={boldTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ fontWeight: 'bold' });
    });

    it('should apply italic font style correctly', () => {
      const italicTextBox: TextBox = {
        ...mockTextBox,
        fontStyle: 'italic',
      };

      render(
        <TextBoxTransform
          textBox={italicTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ fontStyle: 'italic' });
    });

    it('should apply text color correctly', () => {
      const coloredTextBox: TextBox = {
        ...mockTextBox,
        color: '#FF0000',
      };

      render(
        <TextBoxTransform
          textBox={coloredTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('should scale font size with zoom level', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={150}
          isSelected={false}
          isEditing={false}
        />
      );

      // Font size should be scaled: 12 * 1.5 = 18
      const contentDiv = container.querySelector('.overflow-hidden');
      expect(contentDiv).toHaveStyle({ fontSize: '18px' });
    });
  });

  describe('className prop', () => {
    it('should apply additional className', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });
  });
});
