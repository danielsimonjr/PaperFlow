import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickyNote, NOTE_COLORS } from '@components/annotations/StickyNote';
import type { Annotation } from '@/types';

// Mock the NoteReplies component
vi.mock('@components/annotations/NoteReplies', () => ({
  NoteReplies: () => <div data-testid="note-replies">Replies</div>,
}));

describe('StickyNote', () => {
  const mockAnnotation: Annotation = {
    id: 'test-note-1',
    type: 'note',
    pageIndex: 0,
    rects: [{ x: 100, y: 200, width: 24, height: 24 }],
    color: NOTE_COLORS.yellow,
    opacity: 1,
    content: 'Test note content',
    author: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    replies: [],
  };

  const defaultProps = {
    annotation: mockAnnotation,
    isSelected: false,
    scale: 1,
    pageHeight: 792, // Standard letter page height
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NOTE_COLORS', () => {
    it('should have 5 note colors', () => {
      const colorKeys = Object.keys(NOTE_COLORS);
      expect(colorKeys).toHaveLength(5);
    });

    it('should include yellow, green, blue, pink, and purple', () => {
      expect(NOTE_COLORS).toHaveProperty('yellow');
      expect(NOTE_COLORS).toHaveProperty('green');
      expect(NOTE_COLORS).toHaveProperty('blue');
      expect(NOTE_COLORS).toHaveProperty('pink');
      expect(NOTE_COLORS).toHaveProperty('purple');
    });

    it('should have yellow as default color (#FEF3C7)', () => {
      expect(NOTE_COLORS.yellow).toBe('#FEF3C7');
    });
  });

  describe('collapsed state', () => {
    it('should render note icon when collapsed', () => {
      render(<StickyNote {...defaultProps} />);

      // Should have a button to expand
      const expandButton = screen.getByTitle('Click to expand note');
      expect(expandButton).toBeInTheDocument();
    });

    it('should call onSelect when clicking the note container', () => {
      render(<StickyNote {...defaultProps} />);

      // The icon button has stopPropagation, so clicking it doesn't call onSelect
      // Instead, we need to click the container div directly
      // First expand the note to access the larger click area
      const expandButton = screen.getByTitle('Click to expand note');
      fireEvent.click(expandButton);

      // Now click on the expanded note panel (not on buttons)
      const notePanel = document.querySelector('.rounded-lg.shadow-lg');
      if (notePanel) {
        fireEvent.click(notePanel);
      }

      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it('should show selection ring when isSelected is true', () => {
      render(<StickyNote {...defaultProps} isSelected={true} />);

      const button = screen.getByTitle('Click to expand note');
      expect(button.className).toContain('ring-2');
    });
  });

  describe('expanded state', () => {
    it('should expand when clicking the note icon', () => {
      render(<StickyNote {...defaultProps} />);

      const expandButton = screen.getByTitle('Click to expand note');
      fireEvent.click(expandButton);

      // Should now see the content area
      expect(screen.getByPlaceholderText('Type your note here...')).toBeInTheDocument();
    });

    it('should display note content in textarea', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      const textarea = screen.getByPlaceholderText('Type your note here...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test note content');
    });

    it('should display author name', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should call onUpdate when content changes', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      const textarea = screen.getByPlaceholderText('Type your note here...');
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ content: 'Updated content' });
    });

    it('should have a delete button', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      expect(screen.getByText('Delete Note')).toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      fireEvent.click(screen.getByText('Delete Note'));

      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it('should collapse when clicking close button', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      // Click the X button to close
      const closeButtons = document.querySelectorAll('button');
      const closeButton = Array.from(closeButtons).find(
        (btn) => btn.querySelector('svg.lucide-x')
      );

      if (closeButton) {
        fireEvent.click(closeButton);
      }

      // Should be collapsed now (icon visible again)
      expect(screen.queryByPlaceholderText('Type your note here...')).not.toBeInTheDocument();
    });

    it('should render NoteReplies component', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      expect(screen.getByTestId('note-replies')).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should delete note on Delete key when not expanded', () => {
      render(<StickyNote {...defaultProps} />);

      const container = screen.getByTitle('Click to expand note').parentElement!;
      fireEvent.keyDown(container, { key: 'Delete' });

      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it('should not delete note on Delete key when expanded (editing)', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      const container = screen.getByPlaceholderText('Type your note here...').closest('[tabindex]');
      if (container) {
        fireEvent.keyDown(container, { key: 'Delete' });
      }

      // Should not call onDelete when editing
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });

    it('should collapse on Escape key', () => {
      render(<StickyNote {...defaultProps} />);

      // Expand the note
      fireEvent.click(screen.getByTitle('Click to expand note'));

      const textarea = screen.getByPlaceholderText('Type your note here...');
      fireEvent.keyDown(textarea, { key: 'Escape' });

      // Should be collapsed now
      expect(screen.queryByPlaceholderText('Type your note here...')).not.toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('should calculate screen position from PDF coordinates', () => {
      const { container } = render(<StickyNote {...defaultProps} />);

      const foreignObject = container.querySelector('foreignObject');
      expect(foreignObject).toBeInTheDocument();

      // Check position attributes (x = pdfX * scale, y = (pageHeight - pdfY - height) * scale)
      // x = 100 * 1 = 100
      // y = (792 - 200 - 24) * 1 = 568
      expect(foreignObject?.getAttribute('x')).toBe('100');
      expect(foreignObject?.getAttribute('y')).toBe('568');
    });

    it('should scale position with zoom', () => {
      const { container } = render(<StickyNote {...defaultProps} scale={2} />);

      const foreignObject = container.querySelector('foreignObject');
      // x = 100 * 2 = 200
      // y = (792 - 200 - 24) * 2 = 1136
      expect(foreignObject?.getAttribute('x')).toBe('200');
      expect(foreignObject?.getAttribute('y')).toBe('1136');
    });
  });

  describe('colors', () => {
    it('should use annotation color for background', () => {
      render(<StickyNote {...defaultProps} />);

      const button = screen.getByTitle('Click to expand note');
      expect(button).toHaveStyle({ backgroundColor: NOTE_COLORS.yellow });
    });

    it('should use default yellow when no color specified', () => {
      const annotationNoColor = { ...mockAnnotation, color: '' };
      render(<StickyNote {...defaultProps} annotation={annotationNoColor} />);

      // Expand to see the panel
      fireEvent.click(screen.getByTitle('Click to expand note'));

      // The expanded panel should use default yellow
      const panel = document.querySelector('.rounded-lg.shadow-lg');
      expect(panel).toHaveStyle({ backgroundColor: NOTE_COLORS.yellow });
    });
  });
});
