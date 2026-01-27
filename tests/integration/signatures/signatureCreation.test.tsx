import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignatureModal } from '@components/signatures/SignatureModal';
import { useSignatureStore } from '@stores/signatureStore';

describe('SignatureCreation', () => {
  beforeEach(() => {
    // Reset store state
    useSignatureStore.setState({
      signatures: [],
      defaultSignatureId: null,
      defaultInitialsId: null,
      placedSignatures: [],
      selectedPlacedId: null,
      isModalOpen: false,
      isInitialsMode: false,
      isPlacingSignature: false,
      signatureToPlace: null,
    });
  });

  describe('SignatureModal', () => {
    it('should render modal when open', () => {
      render(<SignatureModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Create Signature')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<SignatureModal isOpen={false} onClose={() => {}} />);

      expect(screen.queryByText('Create Signature')).not.toBeInTheDocument();
    });

    it('should show tabs for different creation methods', () => {
      render(<SignatureModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Draw')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    it('should show "Create Initials" when in initials mode', () => {
      render(<SignatureModal isOpen={true} onClose={() => {}} isInitials={true} />);

      expect(screen.getByText('Create Initials')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<SignatureModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should switch tabs when clicked', () => {
      render(<SignatureModal isOpen={true} onClose={() => {}} />);

      const typeTab = screen.getByText('Type');
      fireEvent.click(typeTab);

      // Should show type input
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Signature Store Integration', () => {
    it('should add signature to store when saved', () => {
      const { addSignature } = useSignatureStore.getState();

      addSignature({
        name: 'Test Signature',
        type: 'draw',
        data: 'data:image/png;base64,test',
        isDefault: false,
        isInitials: false,
      });

      expect(useSignatureStore.getState().signatures).toHaveLength(1);
    });

    it('should set default signature for first signature', () => {
      const { addSignature } = useSignatureStore.getState();

      const id = addSignature({
        name: 'Test Signature',
        type: 'draw',
        data: 'data:image/png;base64,test',
        isDefault: false,
        isInitials: false,
      });

      expect(useSignatureStore.getState().defaultSignatureId).toBe(id);
    });

    it('should open modal via store action', () => {
      useSignatureStore.getState().openModal();

      expect(useSignatureStore.getState().isModalOpen).toBe(true);
    });

    it('should open initials modal via store action', () => {
      useSignatureStore.getState().openModal(true);

      expect(useSignatureStore.getState().isModalOpen).toBe(true);
      expect(useSignatureStore.getState().isInitialsMode).toBe(true);
    });
  });
});
