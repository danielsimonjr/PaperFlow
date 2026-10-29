import { useBatchStore } from '@/stores/batchStore';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';

/**
 * The batch module panel. It mounts both batch stores.
 */
export function OptionalModulePanel() {
  useBatchStore((state) => state.operations);
  useNativeBatchStore((state) => state.jobs);
  return <section data-testid="optional-module-batch">Batch ready</section>;
}
