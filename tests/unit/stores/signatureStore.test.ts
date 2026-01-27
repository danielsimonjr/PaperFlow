import { describe, it, expect, beforeEach } from 'vitest';
import { useSignatureStore, type StoredSignature } from '@stores/signatureStore';

describe('signatureStore', () => {
  beforeEach(() => {
    // Reset store state before each test
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

  describe('initial state', () => {
    it('should have empty signatures', () => {
      const state = useSignatureStore.getState();
      expect(state.signatures).toEqual([]);
      expect(state.defaultSignatureId).toBeNull();
    });

    it('should have modal closed', () => {
      const state = useSignatureStore.getState();
      expect(state.isModalOpen).toBe(false);
      expect(state.isInitialsMode).toBe(false);
    });
  });

  describe('addSignature', () => {
    it('should add signature with generated id and timestamps', () => {
      const signatureData = {
        name: 'Test Signature',
        type: 'draw' as const,
        data: 'data:image/png;base64,test',
        isDefault: false,
        isInitials: false,
      };

      const id = useSignatureStore.getState().addSignature(signatureData);

      const state = useSignatureStore.getState();
      expect(state.signatures).toHaveLength(1);
      expect(state.signatures[0]?.id).toBe(id);
      expect(state.signatures[0]?.name).toBe('Test Signature');
      expect(state.signatures[0]?.createdAt).toBeInstanceOf(Date);
    });

    it('should set first signature as default', () => {
      useSignatureStore.getState().addSignature({
        name: 'Test Signature',
        type: 'draw',
        data: 'data:image/png;base64,test',
        isDefault: false,
        isInitials: false,
      });

      const state = useSignatureStore.getState();
      expect(state.defaultSignatureId).toBe(state.signatures[0]?.id);
    });

    it('should separate signatures and initials', () => {
      useSignatureStore.getState().addSignature({
        name: 'Signature',
        type: 'draw',
        data: 'data:image/png;base64,sig',
        isDefault: false,
        isInitials: false,
      });

      useSignatureStore.getState().addSignature({
        name: 'Initials',
        type: 'draw',
        data: 'data:image/png;base64,init',
        isDefault: false,
        isInitials: true,
      });

      const signatures = useSignatureStore.getState().getSignaturesOnly();
      const initials = useSignatureStore.getState().getInitialsOnly();

      expect(signatures).toHaveLength(1);
      expect(initials).toHaveLength(1);
    });
  });

  describe('deleteSignature', () => {
    it('should remove signature by id', () => {
      const id = useSignatureStore.getState().addSignature({
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: false,
        isInitials: false,
      });

      useSignatureStore.getState().deleteSignature(id);

      expect(useSignatureStore.getState().signatures).toHaveLength(0);
    });

    it('should update default when deleted signature was default', () => {
      const id1 = useSignatureStore.getState().addSignature({
        name: 'First',
        type: 'draw',
        data: 'test1',
        isDefault: false,
        isInitials: false,
      });

      const id2 = useSignatureStore.getState().addSignature({
        name: 'Second',
        type: 'draw',
        data: 'test2',
        isDefault: false,
        isInitials: false,
      });

      // First is default
      expect(useSignatureStore.getState().defaultSignatureId).toBe(id1);

      // Delete first
      useSignatureStore.getState().deleteSignature(id1);

      // Second should now be default
      expect(useSignatureStore.getState().defaultSignatureId).toBe(id2);
    });
  });

  describe('renameSignature', () => {
    it('should update signature name', () => {
      const id = useSignatureStore.getState().addSignature({
        name: 'Original',
        type: 'draw',
        data: 'test',
        isDefault: false,
        isInitials: false,
      });

      useSignatureStore.getState().renameSignature(id, 'Renamed');

      expect(useSignatureStore.getState().signatures[0]?.name).toBe('Renamed');
    });
  });

  describe('placeSignature', () => {
    it('should add placed signature to list', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'data:image/png;base64,test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      const placedId = useSignatureStore.getState().placeSignature(signature, 0, { x: 100, y: 200 });

      const state = useSignatureStore.getState();
      expect(state.placedSignatures).toHaveLength(1);
      expect(state.placedSignatures[0]?.id).toBe(placedId);
      expect(state.selectedPlacedId).toBe(placedId);
    });

    it('should clear placing state after placing', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      useSignatureStore.setState({ isPlacingSignature: true, signatureToPlace: signature });
      useSignatureStore.getState().placeSignature(signature, 0, { x: 100, y: 200 });

      const state = useSignatureStore.getState();
      expect(state.isPlacingSignature).toBe(false);
      expect(state.signatureToPlace).toBeNull();
    });
  });

  describe('updatePlacedSignature', () => {
    it('should update placed signature properties', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      const placedId = useSignatureStore.getState().placeSignature(signature, 0, { x: 100, y: 200 });

      useSignatureStore.getState().updatePlacedSignature(placedId, { rotation: 45 });

      expect(useSignatureStore.getState().placedSignatures[0]?.rotation).toBe(45);
    });
  });

  describe('deletePlacedSignature', () => {
    it('should remove placed signature', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      const placedId = useSignatureStore.getState().placeSignature(signature, 0, { x: 100, y: 200 });
      useSignatureStore.getState().deletePlacedSignature(placedId);

      expect(useSignatureStore.getState().placedSignatures).toHaveLength(0);
      expect(useSignatureStore.getState().selectedPlacedId).toBeNull();
    });
  });

  describe('getPagePlacedSignatures', () => {
    it('should return signatures for specific page', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      useSignatureStore.getState().placeSignature(signature, 0, { x: 100, y: 200 });
      useSignatureStore.getState().placeSignature(signature, 1, { x: 100, y: 200 });
      useSignatureStore.getState().placeSignature(signature, 0, { x: 200, y: 300 });

      expect(useSignatureStore.getState().getPagePlacedSignatures(0)).toHaveLength(2);
      expect(useSignatureStore.getState().getPagePlacedSignatures(1)).toHaveLength(1);
    });
  });

  describe('modal state', () => {
    it('should open modal', () => {
      useSignatureStore.getState().openModal();

      expect(useSignatureStore.getState().isModalOpen).toBe(true);
      expect(useSignatureStore.getState().isInitialsMode).toBe(false);
    });

    it('should open modal in initials mode', () => {
      useSignatureStore.getState().openModal(true);

      expect(useSignatureStore.getState().isModalOpen).toBe(true);
      expect(useSignatureStore.getState().isInitialsMode).toBe(true);
    });

    it('should close modal', () => {
      useSignatureStore.getState().openModal();
      useSignatureStore.getState().closeModal();

      expect(useSignatureStore.getState().isModalOpen).toBe(false);
    });
  });

  describe('placing state', () => {
    it('should start placing signature', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      useSignatureStore.setState({ isModalOpen: true });
      useSignatureStore.getState().startPlacing(signature);

      const state = useSignatureStore.getState();
      expect(state.isPlacingSignature).toBe(true);
      expect(state.signatureToPlace).toBe(signature);
      expect(state.isModalOpen).toBe(false);
    });

    it('should cancel placing', () => {
      const signature: StoredSignature = {
        id: 'sig-1',
        name: 'Test',
        type: 'draw',
        data: 'test',
        isDefault: true,
        isInitials: false,
        createdAt: new Date(),
      };

      useSignatureStore.getState().startPlacing(signature);
      useSignatureStore.getState().cancelPlacing();

      const state = useSignatureStore.getState();
      expect(state.isPlacingSignature).toBe(false);
      expect(state.signatureToPlace).toBeNull();
    });
  });
});
