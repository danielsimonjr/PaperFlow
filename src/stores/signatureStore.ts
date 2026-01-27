import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Signature } from '@/types';

// Placed signature on a PDF page
export interface PlacedSignature {
  id: string;
  signatureId: string;
  pageIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  signatureData: string;
  signatureType: 'draw' | 'type' | 'image';
  createdAt: Date;
  // Optional date stamp
  dateStamp?: {
    enabled: boolean;
    format: string;
    position: 'below' | 'right' | 'left';
  };
}

// Signature with additional metadata
export interface StoredSignature extends Signature {
  isDefault: boolean;
  isInitials: boolean;
}

interface SignatureState {
  // Saved signatures
  signatures: StoredSignature[];
  defaultSignatureId: string | null;
  defaultInitialsId: string | null;

  // Placed signatures on document
  placedSignatures: PlacedSignature[];
  selectedPlacedId: string | null;

  // UI state
  isModalOpen: boolean;
  isInitialsMode: boolean;
  isPlacingSignature: boolean;
  signatureToPlace: StoredSignature | null;

  // Actions - Signature management
  addSignature: (signature: Omit<StoredSignature, 'id' | 'createdAt'>) => string;
  updateSignature: (id: string, updates: Partial<StoredSignature>) => void;
  deleteSignature: (id: string) => void;
  setDefaultSignature: (id: string | null) => void;
  setDefaultInitials: (id: string | null) => void;
  renameSignature: (id: string, name: string) => void;

  // Actions - Placed signatures
  placeSignature: (
    signature: StoredSignature,
    pageIndex: number,
    position: { x: number; y: number },
    size?: { width: number; height: number }
  ) => string;
  updatePlacedSignature: (id: string, updates: Partial<PlacedSignature>) => void;
  deletePlacedSignature: (id: string) => void;
  selectPlacedSignature: (id: string | null) => void;
  getPagePlacedSignatures: (pageIndex: number) => PlacedSignature[];

  // Actions - UI state
  openModal: (isInitials?: boolean) => void;
  closeModal: () => void;
  startPlacing: (signature: StoredSignature) => void;
  cancelPlacing: () => void;

  // Actions - Bulk operations
  loadSignatures: (signatures: StoredSignature[]) => void;
  clearPlacedSignatures: () => void;
  getSignaturesOnly: () => StoredSignature[];
  getInitialsOnly: () => StoredSignature[];
}

const MAX_SIGNATURES = 10;

export const useSignatureStore = create<SignatureState>((set, get) => ({
  // Initial state
  signatures: [],
  defaultSignatureId: null,
  defaultInitialsId: null,
  placedSignatures: [],
  selectedPlacedId: null,
  isModalOpen: false,
  isInitialsMode: false,
  isPlacingSignature: false,
  signatureToPlace: null,

  // Add a new signature
  addSignature: (signatureData) => {
    const state = get();
    const isInitials = signatureData.isInitials;
    const currentCount = isInitials
      ? state.signatures.filter((s) => s.isInitials).length
      : state.signatures.filter((s) => !s.isInitials).length;

    if (currentCount >= MAX_SIGNATURES) {
      console.warn(`Maximum ${MAX_SIGNATURES} ${isInitials ? 'initials' : 'signatures'} reached`);
      return '';
    }

    const id = uuidv4();
    const signature: StoredSignature = {
      ...signatureData,
      id,
      createdAt: new Date(),
    };

    set((state) => ({
      signatures: [...state.signatures, signature],
    }));

    // Set as default if it's the first one
    if (isInitials && !get().defaultInitialsId) {
      set({ defaultInitialsId: id });
    } else if (!isInitials && !get().defaultSignatureId) {
      set({ defaultSignatureId: id });
    }

    return id;
  },

  // Update signature
  updateSignature: (id, updates) => {
    set((state) => ({
      signatures: state.signatures.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  },

  // Delete signature
  deleteSignature: (id) => {
    const signature = get().signatures.find((s) => s.id === id);

    set((state) => {
      const newSignatures = state.signatures.filter((s) => s.id !== id);
      const updates: Partial<SignatureState> = { signatures: newSignatures };

      // Update default if deleted
      if (signature?.isInitials && state.defaultInitialsId === id) {
        const nextInitials = newSignatures.find((s) => s.isInitials);
        updates.defaultInitialsId = nextInitials?.id ?? null;
      } else if (!signature?.isInitials && state.defaultSignatureId === id) {
        const nextSignature = newSignatures.find((s) => !s.isInitials);
        updates.defaultSignatureId = nextSignature?.id ?? null;
      }

      return updates;
    });
  },

  // Set default signature
  setDefaultSignature: (id) => {
    set({ defaultSignatureId: id });
  },

  // Set default initials
  setDefaultInitials: (id) => {
    set({ defaultInitialsId: id });
  },

  // Rename signature
  renameSignature: (id, name) => {
    set((state) => ({
      signatures: state.signatures.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
  },

  // Place signature on document
  placeSignature: (signature, pageIndex, position, size) => {
    const id = uuidv4();
    const defaultSize = { width: 150, height: 50 };

    const placedSignature: PlacedSignature = {
      id,
      signatureId: signature.id,
      pageIndex,
      position,
      size: size ?? defaultSize,
      rotation: 0,
      signatureData: signature.data,
      signatureType: signature.type,
      createdAt: new Date(),
    };

    set((state) => ({
      placedSignatures: [...state.placedSignatures, placedSignature],
      isPlacingSignature: false,
      signatureToPlace: null,
      selectedPlacedId: id,
    }));

    return id;
  },

  // Update placed signature
  updatePlacedSignature: (id, updates) => {
    set((state) => ({
      placedSignatures: state.placedSignatures.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  // Delete placed signature
  deletePlacedSignature: (id) => {
    set((state) => ({
      placedSignatures: state.placedSignatures.filter((p) => p.id !== id),
      selectedPlacedId: state.selectedPlacedId === id ? null : state.selectedPlacedId,
    }));
  },

  // Select placed signature
  selectPlacedSignature: (id) => {
    set({ selectedPlacedId: id });
  },

  // Get placed signatures for a page
  getPagePlacedSignatures: (pageIndex) => {
    return get().placedSignatures.filter((p) => p.pageIndex === pageIndex);
  },

  // Open modal
  openModal: (isInitials = false) => {
    set({ isModalOpen: true, isInitialsMode: isInitials });
  },

  // Close modal
  closeModal: () => {
    set({ isModalOpen: false });
  },

  // Start placing signature
  startPlacing: (signature) => {
    set({
      isPlacingSignature: true,
      signatureToPlace: signature,
      isModalOpen: false,
    });
  },

  // Cancel placing
  cancelPlacing: () => {
    set({
      isPlacingSignature: false,
      signatureToPlace: null,
    });
  },

  // Load signatures from storage
  loadSignatures: (signatures) => {
    const defaultSig = signatures.find((s) => s.isDefault && !s.isInitials);
    const defaultInit = signatures.find((s) => s.isDefault && s.isInitials);

    set({
      signatures,
      defaultSignatureId: defaultSig?.id ?? null,
      defaultInitialsId: defaultInit?.id ?? null,
    });
  },

  // Clear all placed signatures
  clearPlacedSignatures: () => {
    set({ placedSignatures: [], selectedPlacedId: null });
  },

  // Get signatures only (no initials)
  getSignaturesOnly: () => {
    return get().signatures.filter((s) => !s.isInitials);
  },

  // Get initials only
  getInitialsOnly: () => {
    return get().signatures.filter((s) => s.isInitials);
  },
}));
