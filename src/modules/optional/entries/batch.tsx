import { BatchDashboard } from '@/components/batch/BatchDashboard';
import { useBatchStore } from '@/stores/batchStore';
import { useNativeBatchStore } from '@/stores/nativeBatchStore';
import type { OptionalModuleScreenProps } from '../loadOptionalModule';

/**
 * Full-screen batch processing dashboard opened from the editor toolbar.
 */
export function OptionalModuleScreen({ onClose }: OptionalModuleScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-950"
      data-testid="optional-screen-batch"
    >
      <button
        type="button"
        data-testid="optional-screen-close"
        onClick={onClose}
        className="m-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        Close
      </button>
      <BatchDashboard />
    </div>
  );
}

/**
 * The batch module panel. It mounts both batch stores.
 */
export function OptionalModulePanel() {
  useBatchStore((state) => state.operations);
  useNativeBatchStore((state) => state.jobs);
  return <section data-testid="optional-module-batch">Batch ready</section>;
}
