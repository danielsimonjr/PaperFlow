import '@/styles/kiosk.css';
import { useKioskStore } from '@/stores/kioskStore';

export { KioskShell } from '@/components/kiosk/KioskShell';

/**
 * The kiosk module panel. It mounts the kiosk store.
 * The full shell stays available from this chunk.
 */
export function OptionalModulePanel() {
  const active = useKioskStore((state) => state.isActive);
  return <section data-testid="optional-module-kiosk">Kiosk {active ? 'on' : 'ready'}</section>;
}
