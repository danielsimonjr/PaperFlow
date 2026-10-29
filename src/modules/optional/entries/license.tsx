import { useLicenseStore } from '@/stores/licenseStore';

/**
 * The license module panel. It mounts the license store.
 */
export function OptionalModulePanel() {
  const offline = useLicenseStore((state) => state.isOffline);
  return (
    <section data-testid="optional-module-license">
      License {offline ? 'offline' : 'ready'}
    </section>
  );
}
