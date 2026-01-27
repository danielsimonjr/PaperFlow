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

describe('TextBox Integration', () => {
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

  describe('TextBoxTransform', () => {
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

    it('should apply font styles correctly', () => {
      const styledTextBox: TextBox = {
        ...mockTextBox,
        fontFamily: 'Georgia',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#FF0000',
      };

      render(
        <TextBoxTransform
          textBox={styledTextBox}
          pageHeight={792}
          scale={100}
          isSelected={false}
          isEditing={false}
        />
      );

      // The text content is rendered directly inside the styled div,
      // so getByText returns the element with styles applied
      const contentDiv = screen.getByText('Test content');
      expect(contentDiv).toHaveStyle({
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: 'rgb(255, 0, 0)',
      });
    });

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

    it('should show resize handles when selected', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={100}
          isSelected={true}
          isEditing={false}
        />
      );

      // Should have 8 resize handles (corners + edges)
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

    it('should position correctly based on scale', () => {
      const { container } = render(
        <TextBoxTransform
          textBox={mockTextBox}
          pageHeight={792}
          scale={150}
          isSelected={false}
          isEditing={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // At 150% scale, position should be multiplied by 1.5
      expect(wrapper.style.left).toBe('150px'); // 100 * 1.5
    });
  });

  describe('Text Store Integration', () => {
    it('should add text box to store', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 50, y: 100, width: 200, height: 60 },
        content: 'New text box',
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      const textBoxes = useTextStore.getState().textBoxes;
      expect(textBoxes).toHaveLength(2);
      expect(textBoxes.find((t) => t.id === id)?.content).toBe('New text box');
    });

    it('should update text box in store', () => {
      useTextStore.getState().updateTextBox(mockTextBox.id, {
        content: 'Updated content',
        fontWeight: 'bold',
      });

      const textBox = useTextStore.getState().getTextBox(mockTextBox.id);
      expect(textBox?.content).toBe('Updated content');
      expect(textBox?.fontWeight).toBe('bold');
    });

    it('should delete text box from store', () => {
      useTextStore.getState().deleteTextBox(mockTextBox.id);

      const textBoxes = useTextStore.getState().textBoxes;
      expect(textBoxes).toHaveLength(0);
    });

    it('should filter text boxes by page', () => {
      useTextStore.getState().addTextBox({
        pageIndex: 1,
        bounds: { x: 50, y: 100, width: 200, height: 60 },
        content: 'Page 2 text',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      const page0TextBoxes = useTextStore.getState().getPageTextBoxes(0);
      const page1TextBoxes = useTextStore.getState().getPageTextBoxes(1);

      expect(page0TextBoxes).toHaveLength(1);
      expect(page1TextBoxes).toHaveLength(1);
    });
  });
});
