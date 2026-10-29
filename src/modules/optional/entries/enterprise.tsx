import { PolicyStatusIndicator } from '@/components/enterprise/PolicyStatusIndicator';
import { useEnterprisePolicyStore } from '@/stores/enterprisePolicyStore';

/**
 * The enterprise module panel. It mounts the policy store.
 */
export function OptionalModulePanel() {
  useEnterprisePolicyStore((state) => state.isInitialized);
  return (
    <section data-testid="optional-module-enterprise">
      <PolicyStatusIndicator variant="panel" showWhenNotManaged />
    </section>
  );
}
