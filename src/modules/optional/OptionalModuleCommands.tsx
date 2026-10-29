import { useEffect, useState, type ComponentType } from 'react';
import { AppWindow, Layers, ScanLine } from 'lucide-react';
import { useSettingsStore } from '@stores/settingsStore';
import {
  loadOptionalModule,
  type OptionalModuleScreenProps,
} from './loadOptionalModule';

const COMMAND_MODULE_IDS = ['kiosk', 'batch', 'scanner'] as const;
type CommandModuleId = (typeof COMMAND_MODULE_IDS)[number];

const COMMAND_META: Record<
  CommandModuleId,
  { label: string; Icon: typeof AppWindow }
> = {
  kiosk: { label: 'Kiosk', Icon: AppWindow },
  batch: { label: 'Batch processing', Icon: Layers },
  scanner: { label: 'Scanner', Icon: ScanLine },
};

/**
 * Toolbar commands for optional modules that expose a full editor screen.
 * Each command appears only while its module setting is on; the module chunk
 * loads when the user opens the screen, not when the toolbar renders.
 */
export function OptionalModuleCommands() {
  const flags = useSettingsStore((state) => state.optionalModules);
  const [openId, setOpenId] = useState<CommandModuleId | null>(null);

  useEffect(() => {
    if (openId && !flags?.[openId]) {
      setOpenId(null);
    }
  }, [openId, flags]);

  return (
    <>
      {COMMAND_MODULE_IDS.map((id) => {
        if (!flags?.[id]) return null;
        const { label, Icon } = COMMAND_META[id];
        return (
          <button
            key={id}
            type="button"
            data-testid={`optional-command-${id}`}
            title={label}
            aria-label={label}
            onClick={() => setOpenId(id)}
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
      {openId && flags?.[openId] ? (
        <OptionalModuleScreenHost id={openId} onClose={() => setOpenId(null)} />
      ) : null}
    </>
  );
}

function OptionalModuleScreenHost({
  id,
  onClose,
}: {
  id: CommandModuleId;
  onClose: () => void;
}) {
  const [Screen, setScreen] = useState<ComponentType<OptionalModuleScreenProps> | null>(
    null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setScreen(null);
    void loadOptionalModule(id)
      .then((bundle) => {
        if (cancelled) return;
        if (bundle.OptionalModuleScreen) {
          setScreen(() => bundle.OptionalModuleScreen!);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (failed) {
    return (
      <p role="alert" data-testid={`optional-module-error-${id}`}>
        Could not load {id}
      </p>
    );
  }

  if (!Screen) {
    return <p data-testid={`optional-screen-loading-${id}`}>Loading {id}</p>;
  }

  return <Screen onClose={onClose} />;
}
