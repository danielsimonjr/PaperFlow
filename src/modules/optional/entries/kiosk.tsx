import { useEffect } from 'react';
import '@/styles/kiosk.css';
import { KioskShell } from '@/components/kiosk/KioskShell';
import { useKioskStore } from '@/stores/kioskStore';
import type { OptionalModuleScreenProps } from '../loadOptionalModule';

/** Kiosk shell loaded with this optional-module chunk. */
export { KioskShell } from '@/components/kiosk/KioskShell';

/**
 * Full-screen kiosk mode opened from the editor toolbar.
 */
export function OptionalModuleScreen({ onClose }: OptionalModuleScreenProps) {
  useEffect(() => {
    useKioskStore.getState().enterKioskMode();
    return () => {
      const state = useKioskStore.getState();
      const pin = state.config?.exitAuth.pin;
      if (state.isActive && pin) {
        state.exitKioskMode(pin);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" data-testid="optional-screen-kiosk">
      <KioskShell>
        <button type="button" data-testid="optional-screen-close" onClick={onClose}>
          Close
        </button>
      </KioskShell>
    </div>
  );
}

/**
 * The kiosk module panel. It mounts the kiosk store.
 * The full shell stays available from this chunk.
 */
export function OptionalModulePanel() {
  const active = useKioskStore((state) => state.isActive);
  return <section data-testid="optional-module-kiosk">Kiosk {active ? 'on' : 'ready'}</section>;
}
