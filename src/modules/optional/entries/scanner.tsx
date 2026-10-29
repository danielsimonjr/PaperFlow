import { ScannerSelectDialog } from '@/components/scanner/ScannerSelectDialog';
import { useScannerStore } from '@/stores/scannerStore';
import type { OptionalModuleScreenProps } from '../loadOptionalModule';

/** Scanner selection dialog loaded with this optional-module chunk. */
export { ScannerSelectDialog } from '@/components/scanner/ScannerSelectDialog';

/**
 * Scanner selection opened from the editor toolbar.
 */
export function OptionalModuleScreen({ onClose }: OptionalModuleScreenProps) {
  return (
    <div data-testid="optional-screen-scanner">
      <ScannerSelectDialog isOpen onClose={onClose} />
    </div>
  );
}

/**
 * The scanner module panel. It mounts the scanner store.
 */
export function OptionalModulePanel() {
  const scanning = useScannerStore((state) => state.isScanning);
  return <section data-testid="optional-module-scanner">Scanner {scanning ? 'busy' : 'ready'}</section>;
}
