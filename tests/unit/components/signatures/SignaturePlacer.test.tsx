import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignaturePlacer } from '@components/signatures/SignaturePlacer';
import { useSignatureStore, type StoredSignature } from '@stores/signatureStore';

describe('SignaturePlacer', () => {
  const mockSignature: StoredSignature = {
    id: 'sig-1',
    name: 'Test Signature',
    type: 'draw',
    data: 'data:image/png;base64,testdata',
    isDefault: true,
    isInitials: false,
    createdAt: new Date(),
  };

  const defaultProps = {
    pageIndex: 0,
    pageWidth: 612,
    pageHeight: 792,
    scale: 1,
  };

  beforeEach(() => {
    useSignatureStore.setState({
      signatures: [mockSignature],
      defaultSignatureId: 'sig-1',
      defaultInitialsId: null,
      placedSignatures: [],
      selectedPlacedId: null,
      isModalOpen: false,
      isInitialsMode: false,
      isPlacingSignature: false,
      signatureToPlace: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not placing signature', () => {
    render(<SignaturePlacer {...defaultProps} />);

    expect(screen.queryByText(/Click to place/)).not.toBeInTheDocument();
  });

  it('should render when placing signature', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    render(<SignaturePlacer {...defaultProps} />);

    expect(screen.getByText(/Click to place/)).toBeInTheDocument();
  });

  it('should show escape hint when placing', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    render(<SignaturePlacer {...defaultProps} />);

    expect(screen.getByText(/Escape to cancel/)).toBeInTheDocument();
  });

  it('should have crosshair cursor', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} />);

    const placer = container.firstChild as HTMLElement;
    expect(placer.className).toContain('cursor-crosshair');
  });

  it('should apply correct dimensions based on scale', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} scale={2} />);

    const placer = container.firstChild as HTMLElement;
    expect(placer.style.width).toBe('1224px'); // 612 * 2
    expect(placer.style.height).toBe('1584px'); // 792 * 2
  });

  it('should cancel placing when Escape is pressed', () => {
    const cancelPlacing = vi.spyOn(useSignatureStore.getState(), 'cancelPlacing');

    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    render(<SignaturePlacer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(cancelPlacing).toHaveBeenCalled();
  });

  it('should not cancel when other keys are pressed', () => {
    const cancelPlacing = vi.spyOn(useSignatureStore.getState(), 'cancelPlacing');

    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    render(<SignaturePlacer {...defaultProps} />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(cancelPlacing).not.toHaveBeenCalled();
  });

  it('should place signature on click', () => {
    const placeSignature = vi.spyOn(useSignatureStore.getState(), 'placeSignature');

    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} />);

    const placer = container.firstChild as HTMLElement;

    // First move mouse to set cursor position
    fireEvent.mouseMove(placer, { clientX: 300, clientY: 400 });

    // Then click to place
    fireEvent.click(placer, { clientX: 300, clientY: 400 });

    expect(placeSignature).toHaveBeenCalled();
  });

  it('should show signature preview on mouse move', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} />);

    const placer = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect to return proper dimensions
    placer.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 792,
      right: 612,
      width: 612,
      height: 792,
      toJSON: () => ({}),
    }));

    // Move mouse to trigger preview
    fireEvent.mouseMove(placer, { clientX: 300, clientY: 400 });

    // Check for preview image - it should appear after mouse move
    const preview = screen.queryByAltText('Signature preview');
    expect(preview).toBeInTheDocument();
  });

  it('should not render preview without cursor position', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    render(<SignaturePlacer {...defaultProps} />);

    // No mouse move, so no cursor position
    expect(screen.queryByAltText('Signature preview')).not.toBeInTheDocument();
  });

  it('should use correct page index when placing', () => {
    const placeSignature = vi.spyOn(useSignatureStore.getState(), 'placeSignature');

    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} pageIndex={2} />);

    const placer = container.firstChild as HTMLElement;

    fireEvent.mouseMove(placer, { clientX: 300, clientY: 400 });
    fireEvent.click(placer, { clientX: 300, clientY: 400 });

    expect(placeSignature).toHaveBeenCalledWith(
      mockSignature,
      2,
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should have z-index for overlay', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} />);

    const placer = container.firstChild as HTMLElement;
    expect(placer.className).toContain('z-20');
  });

  it('should position placer absolutely', () => {
    useSignatureStore.setState({
      isPlacingSignature: true,
      signatureToPlace: mockSignature,
    });

    const { container } = render(<SignaturePlacer {...defaultProps} />);

    const placer = container.firstChild as HTMLElement;
    expect(placer.className).toContain('absolute');
  });
});
