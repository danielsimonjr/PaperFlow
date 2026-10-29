export { ComparisonDialog } from '@/components/comparison/ComparisonDialog';
import { useComparisonStore } from '@/stores/comparisonStore';

/**
 * The comparison module panel. It mounts the comparison store.
 */
export function OptionalModulePanel() {
  useComparisonStore((state) => state.isComparing);
  return <section data-testid="optional-module-comparison">Comparison ready</section>;
}
