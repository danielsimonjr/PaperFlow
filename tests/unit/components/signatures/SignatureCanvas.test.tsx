import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawSignature } from '@components/signatures/DrawSignature';
import { TypeSignature } from '@components/signatures/TypeSignature';
import { ImageSignature } from '@components/signatures/ImageSignature';

// Mock canvas context
const mockContext = {
  lineCap: '',
  lineJoin: '',
  strokeStyle: '',
  lineWidth: 0,
  fillStyle: '',
  scale: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10,
  })),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
  font: '',
  textBaseline: '',
  textAlign: '',
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test');

describe('SignatureCanvas Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DrawSignature', () => {
    const mockOnSignatureChange = vi.fn();

    beforeEach(() => {
      mockOnSignatureChange.mockClear();
    });

    it('should render canvas element', () => {
      const { container } = render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should show placeholder text for signatures', () => {
      render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Draw your signature here')).toBeInTheDocument();
    });

    it('should show placeholder text for initials', () => {
      render(<DrawSignature onSignatureChange={mockOnSignatureChange} isInitials />);

      expect(screen.getByText('Draw your initials here')).toBeInTheDocument();
    });

    it('should render thickness controls', () => {
      render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Thickness:')).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should have clear button disabled initially', () => {
      render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });

    it('should use smaller canvas for initials', () => {
      const { container } = render(<DrawSignature onSignatureChange={mockOnSignatureChange} isInitials />);

      const canvas = container.querySelector('canvas');
      expect(canvas?.style.width).toBe('200px');
      expect(canvas?.style.height).toBe('100px');
    });

    it('should use larger canvas for signatures', () => {
      const { container } = render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      const canvas = container.querySelector('canvas');
      expect(canvas?.style.width).toBe('400px');
      expect(canvas?.style.height).toBe('150px');
    });

    it('should have touch-none class for stylus support', () => {
      const { container } = render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      const canvas = container.querySelector('canvas');
      expect(canvas?.className).toContain('touch-none');
    });

    it('should have cursor-crosshair class', () => {
      const { container } = render(<DrawSignature onSignatureChange={mockOnSignatureChange} />);

      const canvas = container.querySelector('canvas');
      expect(canvas?.className).toContain('cursor-crosshair');
    });
  });

  describe('TypeSignature', () => {
    const mockOnSignatureChange = vi.fn();

    beforeEach(() => {
      mockOnSignatureChange.mockClear();
    });

    it('should render text input', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    it('should show initials placeholder when isInitials is true', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} isInitials />);

      expect(screen.getByPlaceholderText('JD')).toBeInTheDocument();
    });

    it('should render font selection buttons', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Select font style')).toBeInTheDocument();
      expect(screen.getByText('Brush Script')).toBeInTheDocument();
    });

    it('should update text on input change', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      const input = screen.getByPlaceholderText('John Doe');
      fireEvent.change(input, { target: { value: 'Test Name' } });

      expect(input).toHaveValue('Test Name');
    });

    it('should limit initials to 4 characters', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} isInitials />);

      const input = screen.getByPlaceholderText('JD');
      expect(input).toHaveAttribute('maxLength', '4');
    });

    it('should allow up to 50 characters for full signatures', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      const input = screen.getByPlaceholderText('John Doe');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('should call onSignatureChange with null when text is empty', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      // Initial render should call with null since text is empty
      expect(mockOnSignatureChange).toHaveBeenCalledWith(null);
    });

    it('should show preview when text is entered', () => {
      render(<TypeSignature onSignatureChange={mockOnSignatureChange} />);

      const input = screen.getByPlaceholderText('John Doe');
      fireEvent.change(input, { target: { value: 'Test' } });

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  describe('ImageSignature', () => {
    const mockOnSignatureChange = vi.fn();

    beforeEach(() => {
      mockOnSignatureChange.mockClear();
    });

    it('should render upload area', () => {
      render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Click or drag to upload signature image')).toBeInTheDocument();
    });

    it('should show supported file types', () => {
      render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('PNG, JPG, or SVG')).toBeInTheDocument();
    });

    it('should render file input', () => {
      const { container } = render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      const input = container.querySelector('input[type="file"]');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('accept')).toContain('image/png');
    });

    it('should render background removal checkbox', () => {
      render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Remove white background')).toBeInTheDocument();
    });

    it('should render auto-crop checkbox', () => {
      render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      expect(screen.getByText('Auto-crop to signature bounds')).toBeInTheDocument();
    });

    it('should have checkboxes checked by default', () => {
      render(<ImageSignature onSignatureChange={mockOnSignatureChange} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });
  });
});
