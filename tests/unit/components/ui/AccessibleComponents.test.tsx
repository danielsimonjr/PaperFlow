import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipNav, LiveRegion, VisuallyHidden, IconButton } from '@components/ui/AccessibleComponents';

describe('SkipNav', () => {
  it('renders skip navigation link', () => {
    render(<SkipNav />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('links to main-content by default', () => {
    render(<SkipNav />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('links to custom target', () => {
    render(<SkipNav targetId="custom-target" />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#custom-target');
  });
});

describe('LiveRegion', () => {
  it('renders with aria-live', () => {
    render(<LiveRegion message="Page loaded" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('renders assertive messages', () => {
    render(<LiveRegion message="Error occurred" politeness="assertive" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders the message text', () => {
    render(<LiveRegion message="Document saved" />);
    expect(screen.getByText('Document saved')).toBeInTheDocument();
  });
});

describe('VisuallyHidden', () => {
  it('renders with sr-only class', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    expect(screen.getByText('Hidden text')).toHaveClass('sr-only');
  });

  it('renders with custom element', () => {
    const { container } = render(<VisuallyHidden as="h1">Title</VisuallyHidden>);
    expect(container.querySelector('h1')).toBeInTheDocument();
  });
});

describe('IconButton', () => {
  it('renders with aria-label', () => {
    render(
      <IconButton aria-label="Close">
        <span>X</span>
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('handles click', async () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Save" onClick={onClick}>
        <span>S</span>
      </IconButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(
      <IconButton aria-label="Edit" disabled>
        <span>E</span>
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });
});
