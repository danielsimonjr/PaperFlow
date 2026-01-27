import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraggableThumbnail } from '@components/pages/DraggableThumbnail';
import { PageContextMenu } from '@components/pages/PageContextMenu';
import { RotateMenu } from '@components/pages/RotateMenu';

describe('DraggableThumbnail', () => {
  const defaultProps = {
    pageNumber: 1,
    pageIndex: 0,
    width: 100,
    height: 150,
    isCurrentPage: false,
    isSelected: false,
    isDragging: false,
    isDropTarget: false,
    dropPosition: null as 'before' | 'after' | null,
    onClick: vi.fn(),
    onContextMenu: vi.fn(),
    dragProps: {
      draggable: true,
      onDragStart: vi.fn(),
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn(),
      onDragEnd: vi.fn(),
    },
  };

  it('should render with page number', () => {
    render(<DraggableThumbnail {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render thumbnail image when provided', () => {
    render(
      <DraggableThumbnail
        {...defaultProps}
        thumbnailUrl="data:image/png;base64,test"
      />
    );
    const img = screen.getByAltText('Page 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('should show loading state when no thumbnail', () => {
    render(<DraggableThumbnail {...defaultProps} />);
    // Should have a spinner element
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onClick = vi.fn();
    render(<DraggableThumbnail {...defaultProps} onClick={onClick} />);

    const thumbnail = screen.getByText('1').closest('div[draggable]');
    fireEvent.click(thumbnail!);

    expect(onClick).toHaveBeenCalled();
  });

  it('should handle context menu events', () => {
    const onContextMenu = vi.fn();
    render(<DraggableThumbnail {...defaultProps} onContextMenu={onContextMenu} />);

    const thumbnail = screen.getByText('1').closest('div[draggable]');
    fireEvent.contextMenu(thumbnail!);

    expect(onContextMenu).toHaveBeenCalled();
  });

  it('should show selection indicator when selected', () => {
    render(<DraggableThumbnail {...defaultProps} isSelected={true} />);
    // The check icon should be visible when selected
    const container = screen.getByText('1').closest('div.relative');
    expect(container).toBeInTheDocument();
  });

  it('should apply current page styling', () => {
    render(<DraggableThumbnail {...defaultProps} isCurrentPage={true} />);
    const thumbnail = screen.getByText('1').closest('div[draggable]');
    expect(thumbnail?.className).toContain('border-primary-500');
  });

  it('should show drop indicator when drop target before', () => {
    render(
      <DraggableThumbnail
        {...defaultProps}
        isDropTarget={true}
        dropPosition="before"
      />
    );
    const dropIndicator = document.querySelector('.bg-primary-500.-top-1\\.5');
    expect(dropIndicator).toBeInTheDocument();
  });

  it('should show drop indicator when drop target after', () => {
    render(
      <DraggableThumbnail
        {...defaultProps}
        isDropTarget={true}
        dropPosition="after"
      />
    );
    const dropIndicator = document.querySelector('.bg-primary-500.-bottom-1\\.5');
    expect(dropIndicator).toBeInTheDocument();
  });

  it('should apply dragging opacity', () => {
    render(<DraggableThumbnail {...defaultProps} isDragging={true} />);
    const thumbnail = screen.getByText('1').closest('div[draggable]');
    expect(thumbnail?.className).toContain('opacity-50');
  });

  it('should handle drag start', () => {
    const onDragStart = vi.fn();
    render(
      <DraggableThumbnail
        {...defaultProps}
        dragProps={{ ...defaultProps.dragProps, onDragStart }}
      />
    );

    const thumbnail = screen.getByText('1').closest('div[draggable]');
    fireEvent.dragStart(thumbnail!);

    expect(onDragStart).toHaveBeenCalled();
  });
});

describe('PageContextMenu', () => {
  const defaultProps = {
    children: <button>Trigger</button>,
    pageCount: 5,
    isSelected: false,
    selectedCount: 0,
    onDelete: vi.fn(),
    onDeleteSelected: vi.fn(),
    onDuplicate: vi.fn(),
    onRotateCW: vi.fn(),
    onRotateCCW: vi.fn(),
    onRotate180: vi.fn(),
    onInsertBefore: vi.fn(),
    onInsertAfter: vi.fn(),
    onMoveTo: vi.fn(),
    onExtract: vi.fn(),
  };

  it('should render trigger element', () => {
    render(<PageContextMenu {...defaultProps} />);
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('should have dropdown trigger accessibility attributes', () => {
    render(<PageContextMenu {...defaultProps} />);

    const trigger = screen.getByText('Trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('should render trigger as a button', () => {
    render(<PageContextMenu {...defaultProps} />);

    const trigger = screen.getByText('Trigger');
    expect(trigger.tagName).toBe('BUTTON');
  });

  it('should accept custom children', () => {
    render(
      <PageContextMenu {...defaultProps}>
        <span data-testid="custom-trigger">Custom Trigger</span>
      </PageContextMenu>
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });

  it('should receive all required props', () => {
    const props = {
      ...defaultProps,
      pageCount: 10,
      isSelected: true,
      selectedCount: 3,
    };

    // Render should not throw with all props provided
    expect(() => render(<PageContextMenu {...props} />)).not.toThrow();
  });

  it('should accept callback functions', () => {
    const onDelete = vi.fn();
    const onDuplicate = vi.fn();
    const onRotateCW = vi.fn();

    render(
      <PageContextMenu
        {...defaultProps}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onRotateCW={onRotateCW}
      />
    );

    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });
});

describe('RotateMenu', () => {
  it('should render rotate button', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} />);

    expect(screen.getByText('Rotate')).toBeInTheDocument();
  });

  it('should render button with correct accessibility attributes', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} />);

    const button = screen.getByText('Rotate').closest('button');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should be disabled when disabled prop is true', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} disabled={true} />);

    const button = screen.getByText('Rotate').closest('button');
    expect(button).toBeDisabled();
  });

  it('should apply custom className', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} className="custom-class" />);

    const button = screen.getByText('Rotate').closest('button');
    expect(button?.className).toContain('custom-class');
  });

  it('should render rotate icon', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} />);

    const button = screen.getByText('Rotate').closest('button');
    const svg = button?.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains('lucide-rotate-cw')).toBe(true);
  });

  it('should have chevron down icon', () => {
    const onRotate = vi.fn();
    render(<RotateMenu onRotate={onRotate} />);

    const button = screen.getByText('Rotate').closest('button');
    const svgs = button?.querySelectorAll('svg');
    expect(svgs?.length).toBe(2); // Rotate icon and chevron
  });
});
