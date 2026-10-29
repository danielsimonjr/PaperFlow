import { useLANStore } from '@/stores/lanStore';

/**
 * The LAN module panel. It mounts the LAN store.
 */
export function OptionalModulePanel() {
  const running = useLANStore((state) => state.isDiscoveryRunning);
  return <section data-testid="optional-module-lan">LAN {running ? 'searching' : 'ready'}</section>;
}
