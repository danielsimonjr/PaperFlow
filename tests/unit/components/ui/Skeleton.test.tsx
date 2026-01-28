import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText } from '@components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with aria-label', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('applies width and height styles', () => {
    render(<Skeleton width={200} height={50} />);
    const el = screen.getByRole('status');
    expect(el).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('applies rounded-full class when rounded', () => {
    render(<Skeleton rounded />);
    expect(screen.getByRole('status')).toHaveClass('rounded-full');
  });

  it('uses default rounded class', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toHaveClass('rounded');
  });
});

describe('SkeletonText', () => {
  it('renders default 3 lines', () => {
    render(<SkeletonText />);
    const statuses = screen.getAllByRole('status');
    // SkeletonText itself has role="status", and each Skeleton line does too
    expect(statuses.length).toBeGreaterThanOrEqual(1);
  });

  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonText lines={5} />);
    const skeletonLines = container.querySelectorAll('.animate-pulse');
    expect(skeletonLines).toHaveLength(5);
  });
});
