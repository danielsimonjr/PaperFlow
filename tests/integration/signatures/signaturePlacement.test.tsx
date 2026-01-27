import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignaturePlacer } from '@components/signatures/SignaturePlacer';
import { SignatureResize } from '@components/signatures/SignatureResize';
import { useSignatureStore, type StoredSignature, type PlacedSignature } from '@stores/signatureStore';

describe('SignaturePlacement', () => {
  const mockSignature: StoredSignature = {
    id: 'sig-1',
    name: 'Test Signature',
    type: 'draw',
    data: 'data:image/png;base64,test',
    isDefault: true,
    isInitials: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Reset store state
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

  describe('SignaturePlacer', () => {
    it('should not render when not placing signature', () => {
      render(<SignaturePlacer pageIndex={0} pageWidth={612} pageHeight={792} scale={1} />);

      expect(screen.queryByText('Click to place')).not.toBeInTheDocument();
    });

    it('should render when placing signature', () => {
      useSignatureStore.setState({
        isPlacingSignature: true,
        signatureToPlace: mockSignature,
      });

      render(<SignaturePlacer pageIndex={0} pageWidth={612} pageHeight={792} scale={1} />);

      expect(screen.getByText(/Click to place/)).toBeInTheDocument();
    });

    it('should show escape hint when placing', () => {
      useSignatureStore.setState({
        isPlacingSignature: true,
        signatureToPlace: mockSignature,
      });

      render(<SignaturePlacer pageIndex={0} pageWidth={612} pageHeight={792} scale={1} />);

      expect(screen.getByText(/Escape to cancel/)).toBeInTheDocument();
    });
  });

  describe('SignatureResize', () => {
    const placedSignature: PlacedSignature = {
      id: 'placed-1',
      signatureId: 'sig-1',
      pageIndex: 0,
      position: { x: 100, y: 200 },
      size: { width: 150, height: 50 },
      rotation: 0,
      signatureData: 'data:image/png;base64,test',
      signatureType: 'draw',
      createdAt: new Date(),
    };

    it('should render signature image', () => {
      render(<SignatureResize signature={placedSignature} scale={1} />);

      const img = screen.getByAltText('Signature');
      expect(img).toBeInTheDocument();
    });

    it('should not show resize handles when not selected', () => {
      useSignatureStore.setState({
        selectedPlacedId: null,
      });

      const { container } = render(<SignatureResize signature={placedSignature} scale={1} />);

      // Check for resize handles (should not be present)
      const handles = container.querySelectorAll('.cursor-nw-resize, .cursor-ne-resize, .cursor-sw-resize, .cursor-se-resize');
      expect(handles).toHaveLength(0);
    });

    it('should show resize handles when selected', () => {
      useSignatureStore.setState({
        selectedPlacedId: 'placed-1',
      });

      const { container } = render(<SignatureResize signature={placedSignature} scale={1} />);

      // Check for resize handles
      const handles = container.querySelectorAll('[class*="cursor-"]');
      expect(handles.length).toBeGreaterThan(0);
    });

    it('should select signature on click', () => {
      useSignatureStore.setState({
        selectedPlacedId: null,
        placedSignatures: [placedSignature],
      });

      const { container } = render(<SignatureResize signature={placedSignature} scale={1} />);

      // Click on the signature
      const wrapper = container.firstChild as HTMLElement;
      fireEvent.mouseDown(wrapper);

      expect(useSignatureStore.getState().selectedPlacedId).toBe('placed-1');
    });
  });

  describe('Placement workflow', () => {
    it('should start placing mode when startPlacing is called', () => {
      const { startPlacing } = useSignatureStore.getState();

      startPlacing(mockSignature);

      const state = useSignatureStore.getState();
      expect(state.isPlacingSignature).toBe(true);
      expect(state.signatureToPlace).toBe(mockSignature);
    });

    it('should cancel placing mode when cancelPlacing is called', () => {
      useSignatureStore.getState().startPlacing(mockSignature);
      useSignatureStore.getState().cancelPlacing();

      const state = useSignatureStore.getState();
      expect(state.isPlacingSignature).toBe(false);
      expect(state.signatureToPlace).toBeNull();
    });

    it('should place signature and select it', () => {
      const { placeSignature } = useSignatureStore.getState();

      const placedId = placeSignature(mockSignature, 0, { x: 100, y: 200 }, { width: 150, height: 50 });

      const state = useSignatureStore.getState();
      expect(state.placedSignatures).toHaveLength(1);
      expect(state.selectedPlacedId).toBe(placedId);
    });

    it('should update placed signature position', () => {
      const { placeSignature, updatePlacedSignature } = useSignatureStore.getState();

      const placedId = placeSignature(mockSignature, 0, { x: 100, y: 200 });

      updatePlacedSignature(placedId, { position: { x: 150, y: 250 } });

      const state = useSignatureStore.getState();
      expect(state.placedSignatures[0]?.position).toEqual({ x: 150, y: 250 });
    });

    it('should update placed signature rotation', () => {
      const { placeSignature, updatePlacedSignature } = useSignatureStore.getState();

      const placedId = placeSignature(mockSignature, 0, { x: 100, y: 200 });

      updatePlacedSignature(placedId, { rotation: 45 });

      const state = useSignatureStore.getState();
      expect(state.placedSignatures[0]?.rotation).toBe(45);
    });

    it('should delete placed signature', () => {
      const { placeSignature, deletePlacedSignature } = useSignatureStore.getState();

      const placedId = placeSignature(mockSignature, 0, { x: 100, y: 200 });
      deletePlacedSignature(placedId);

      const state = useSignatureStore.getState();
      expect(state.placedSignatures).toHaveLength(0);
      expect(state.selectedPlacedId).toBeNull();
    });

    it('should get signatures for specific page', () => {
      const { placeSignature, getPagePlacedSignatures } = useSignatureStore.getState();

      placeSignature(mockSignature, 0, { x: 100, y: 200 });
      placeSignature(mockSignature, 1, { x: 100, y: 200 });
      placeSignature(mockSignature, 0, { x: 200, y: 300 });

      expect(getPagePlacedSignatures(0)).toHaveLength(2);
      expect(getPagePlacedSignatures(1)).toHaveLength(1);
      expect(getPagePlacedSignatures(2)).toHaveLength(0);
    });
  });
});
