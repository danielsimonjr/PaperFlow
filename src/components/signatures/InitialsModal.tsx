import { SignatureModal } from './SignatureModal';
import type { StoredSignature } from '@stores/signatureStore';

interface InitialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (initials: StoredSignature) => void;
}

/**
 * Modal for creating and managing initials.
 * This is a wrapper around SignatureModal with isInitials=true.
 */
export function InitialsModal({ isOpen, onClose, onSelect }: InitialsModalProps) {
  return <SignatureModal isOpen={isOpen} onClose={onClose} isInitials={true} onSelect={onSelect} />;
}
