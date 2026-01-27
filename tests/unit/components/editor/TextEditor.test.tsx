import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useTextStore } from '@stores/textStore';
import { InlineTextEditor } from '@components/editor/InlineTextEditor';
import type { TextBox } from '@/types/text';

// Mock the history store
vi.mock('@stores/historyStore', () => ({
  useHistoryStore: {
    getState: vi.fn(() => ({
      push: vi.fn(),
    })),
  },
}));

// Mock the font fallback module
vi.mock('@lib/fonts/fontFallback', () => ({
  getFontFallback: vi.fn(() => ({
    fontFamily: 'Arial',
    genericFamily: 'sans-serif',
    confidence: 1,
  })),
}));

describe('InlineTextEditor', () => {
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
      selectedId: mockTextBox.id,
      activeTool: 'textbox',
      editingId: mockTextBox.id,
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with initial content', () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]');
      expect(editor).toBeInTheDocument();
      expect(editor?.textContent).toBe('Test content');
    });

    it('should focus the editor on mount', async () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]');
      await waitFor(() => {
        expect(document.activeElement).toBe(editor);
      });
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
        <InlineTextEditor
          textBox={styledTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(editor).toHaveStyle({
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: 'rgb(255, 0, 0)',
      });
    });

    it('should apply text alignment correctly', () => {
      const centeredTextBox: TextBox = {
        ...mockTextBox,
        alignment: 'center',
      };

      render(
        <InlineTextEditor
          textBox={centeredTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(editor).toHaveStyle({ textAlign: 'center' });
    });

    it('should apply line spacing correctly', () => {
      const spacedTextBox: TextBox = {
        ...mockTextBox,
        lineSpacing: 1.5,
      };

      render(
        <InlineTextEditor
          textBox={spacedTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(editor).toHaveStyle({ lineHeight: '1.5' });
    });
  });

  describe('positioning', () => {
    it('should position editor based on textBox bounds and scale', () => {
      const { container } = render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // At 100% scale with pageHeight 792 and textBox at y=200 with height=50:
      // screenY = (792 - 200 - 50) * 1 = 542
      expect(wrapper.style.left).toBe('100px');
      expect(wrapper.style.top).toBe('542px');
      expect(wrapper.style.width).toBe('150px');
    });

    it('should scale position with zoom level', () => {
      const { container } = render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={200}
          pageHeight={792}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      // At 200% scale, x should be 100 * 2 = 200
      expect(wrapper.style.left).toBe('200px');
      expect(wrapper.style.width).toBe('300px');
    });
  });

  describe('keyboard shortcuts', () => {
    it('should cancel editing on Escape key', () => {
      const onCancel = vi.fn();

      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
          onCancel={onCancel}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalled();
    });

    it('should commit changes on Ctrl+Enter', () => {
      const onComplete = vi.fn();

      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
          onComplete={onComplete}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should commit changes on Meta+Enter (Mac)', () => {
      const onComplete = vi.fn();

      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
          onComplete={onComplete}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'Enter', metaKey: true });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should toggle bold on Ctrl+B', () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });

      const textBox = useTextStore.getState().getTextBox(mockTextBox.id);
      expect(textBox?.fontWeight).toBe('bold');
    });

    it('should toggle italic on Ctrl+I', () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });

      const textBox = useTextStore.getState().getTextBox(mockTextBox.id);
      expect(textBox?.fontStyle).toBe('italic');
    });

    it('should toggle underline on Ctrl+U', () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'u', ctrlKey: true });

      const textBox = useTextStore.getState().getTextBox(mockTextBox.id);
      expect(textBox?.textDecoration).toBe('underline');
    });

    it('should toggle bold back to normal if already bold', () => {
      const boldTextBox: TextBox = {
        ...mockTextBox,
        fontWeight: 'bold',
      };

      useTextStore.setState({
        textBoxes: [boldTextBox],
        selectedId: boldTextBox.id,
        editingId: boldTextBox.id,
        activeTool: 'textbox',
        defaultProperties: useTextStore.getState().defaultProperties,
      });

      render(
        <InlineTextEditor
          textBox={boldTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });

      const textBox = useTextStore.getState().getTextBox(boldTextBox.id);
      expect(textBox?.fontWeight).toBe('normal');
    });
  });

  describe('character limit', () => {
    it('should show warning when approaching character limit', () => {
      const longContent = 'A'.repeat(91); // More than 90% of 100
      const textBoxWithLongContent: TextBox = {
        ...mockTextBox,
        content: longContent,
      };

      useTextStore.setState({
        textBoxes: [textBoxWithLongContent],
        selectedId: textBoxWithLongContent.id,
        editingId: textBoxWithLongContent.id,
        activeTool: 'textbox',
        defaultProperties: useTextStore.getState().defaultProperties,
      });

      render(
        <InlineTextEditor
          textBox={textBoxWithLongContent}
          scale={100}
          pageHeight={792}
          maxCharsPerLine={100}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;

      // Mock innerText property to return the long content
      Object.defineProperty(editor, 'innerText', {
        get: () => longContent,
        configurable: true,
      });

      // Simulate input to trigger the limit check
      fireEvent.input(editor);

      // The warning should appear
      expect(screen.getByText('Approaching character limit')).toBeInTheDocument();
    });

    it('should not show warning when no character limit', () => {
      const longContent = 'A'.repeat(100);
      const textBoxWithLongContent: TextBox = {
        ...mockTextBox,
        content: longContent,
      };

      useTextStore.setState({
        textBoxes: [textBoxWithLongContent],
        selectedId: textBoxWithLongContent.id,
        editingId: textBoxWithLongContent.id,
        activeTool: 'textbox',
        defaultProperties: useTextStore.getState().defaultProperties,
      });

      render(
        <InlineTextEditor
          textBox={textBoxWithLongContent}
          scale={100}
          pageHeight={792}
          maxCharsPerLine={0}
        />
      );

      expect(screen.queryByText('Approaching character limit')).not.toBeInTheDocument();
    });
  });

  describe('click outside behavior', () => {
    it('should commit changes when clicking outside', async () => {
      const onComplete = vi.fn();

      render(
        <div>
          <div data-testid="outside">Outside</div>
          <InlineTextEditor
            textBox={mockTextBox}
            scale={100}
            pageHeight={792}
            onComplete={onComplete}
          />
        </div>
      );

      // Wait for the delay before click listener is added
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      fireEvent.mouseDown(screen.getByTestId('outside'));

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('className prop', () => {
    it('should apply additional className', () => {
      const { container } = render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });
  });

  describe('content updates', () => {
    it('should update content on input', () => {
      render(
        <InlineTextEditor
          textBox={mockTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;

      // Simulate typing by changing innerText and triggering input
      Object.defineProperty(editor, 'innerText', {
        get: () => 'New content',
        configurable: true,
      });

      fireEvent.input(editor);

      // The internal state should be updated (content is tracked internally)
      // We verify by checking the commit result
      fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });

      // The updateTextBox should be called with the new content
      const textBox = useTextStore.getState().getTextBox(mockTextBox.id);
      expect(textBox?.content).toBe('New content');
    });
  });

  describe('text decoration', () => {
    it('should apply underline decoration correctly', () => {
      const underlinedTextBox: TextBox = {
        ...mockTextBox,
        textDecoration: 'underline',
      };

      render(
        <InlineTextEditor
          textBox={underlinedTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      expect(editor).toHaveStyle({ textDecoration: 'underline' });
    });

    it('should toggle underline back to none if already underlined', () => {
      const underlinedTextBox: TextBox = {
        ...mockTextBox,
        textDecoration: 'underline',
      };

      useTextStore.setState({
        textBoxes: [underlinedTextBox],
        selectedId: underlinedTextBox.id,
        editingId: underlinedTextBox.id,
        activeTool: 'textbox',
        defaultProperties: useTextStore.getState().defaultProperties,
      });

      render(
        <InlineTextEditor
          textBox={underlinedTextBox}
          scale={100}
          pageHeight={792}
        />
      );

      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
      fireEvent.keyDown(editor, { key: 'u', ctrlKey: true });

      const textBox = useTextStore.getState().getTextBox(underlinedTextBox.id);
      expect(textBox?.textDecoration).toBe('none');
    });
  });
});
