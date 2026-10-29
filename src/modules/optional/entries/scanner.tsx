export { ScannerSelectDialog } from '@/components/scanner/ScannerSelectDialog';
import { useScannerStore } from '@/stores/scannerStore';

/**
 * The scanner module panel. It mounts the scanner store.
 */
export function OptionalModulePanel() {
  const scanning = useScannerStore((state) => state.isScanning);
  return <section data-testid="optional-module-scanner">Scanner {scanning ? 'busy' : 'ready'}</section>;
}
