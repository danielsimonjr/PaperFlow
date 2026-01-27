import { useState, useCallback, useEffect } from 'react';
import { X, Pencil, Type, Image as ImageIcon, Star, Check } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { DrawSignature } from './DrawSignature';
import { TypeSignature } from './TypeSignature';
import { ImageSignature } from './ImageSignature';
import { SignatureList } from './SignatureList';
import { useSignatureStore, type StoredSignature } from '@stores/signatureStore';

type TabType = 'draw' | 'type' | 'image' | 'saved';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInitials?: boolean;
  onSelect?: (signature: StoredSignature) => void;
}

/**
 * Modal for creating and managing signatures.
 * Supports draw, type, and image upload methods.
 */
export function SignatureModal({ isOpen, onClose, isInitials = false, onSelect }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');

  const signatures = useSignatureStore((state) => state.signatures);
  const addSignature = useSignatureStore((state) => state.addSignature);
  const startPlacing = useSignatureStore((state) => state.startPlacing);

  // Filter signatures based on mode
  const filteredSignatures = signatures.filter((s) => s.isInitials === isInitials);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSignatureData(null);
      setSignatureName('');
      // Show saved tab if there are saved signatures
      setActiveTab(filteredSignatures.length > 0 ? 'saved' : 'draw');
    }
  }, [isOpen, filteredSignatures.length]);

  const handleSave = useCallback(() => {
    if (!signatureData) return;

    const type = activeTab as 'draw' | 'type' | 'image';
    const name = signatureName.trim() || `${isInitials ? 'Initials' : 'Signature'} ${filteredSignatures.length + 1}`;

    const id = addSignature({
      name,
      type,
      data: signatureData,
      isDefault: filteredSignatures.length === 0,
      isInitials,
    });

    if (id) {
      // Find the newly created signature and start placing
      const newSignature = useSignatureStore.getState().signatures.find((s) => s.id === id);
      if (newSignature) {
        if (onSelect) {
          onSelect(newSignature);
        } else {
          startPlacing(newSignature);
        }
      }
      onClose();
    }
  }, [signatureData, activeTab, signatureName, isInitials, filteredSignatures.length, addSignature, startPlacing, onSelect, onClose]);

  const handleSelectSaved = useCallback(
    (signature: StoredSignature) => {
      if (onSelect) {
        onSelect(signature);
      } else {
        startPlacing(signature);
      }
      onClose();
    },
    [startPlacing, onSelect, onClose]
  );

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignatureData(dataUrl);
  }, []);

  if (!isOpen) return null;

  const tabs = [
    { id: 'saved' as TabType, label: 'Saved', icon: Star, show: filteredSignatures.length > 0 },
    { id: 'draw' as TabType, label: 'Draw', icon: Pencil, show: true },
    { id: 'type' as TabType, label: 'Type', icon: Type, show: true },
    { id: 'image' as TabType, label: 'Image', icon: ImageIcon, show: true },
  ].filter((t) => t.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isInitials ? 'Create Initials' : 'Create Signature'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setSignatureData(null);
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {activeTab === 'saved' && (
            <SignatureList signatures={filteredSignatures} onSelect={handleSelectSaved} isInitials={isInitials} />
          )}

          {activeTab === 'draw' && <DrawSignature onSignatureChange={handleSignatureChange} isInitials={isInitials} />}

          {activeTab === 'type' && <TypeSignature onSignatureChange={handleSignatureChange} isInitials={isInitials} />}

          {activeTab === 'image' && <ImageSignature onSignatureChange={handleSignatureChange} isInitials={isInitials} />}

          {/* Name input (for new signatures) */}
          {activeTab !== 'saved' && signatureData && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                Name (optional)
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={isInitials ? 'My Initials' : 'My Signature'}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab !== 'saved' && (
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!signatureData}>
              <Check size={16} className="mr-1" />
              Save & Place
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
