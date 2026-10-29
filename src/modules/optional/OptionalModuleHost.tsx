import { useEffect, useState, type ComponentType } from 'react';
import { OPTIONAL_MODULE_IDS, type OptionalModuleId } from '@/core/features';
import { useSettingsStore } from '@stores/settingsStore';
import { loadOptionalModule } from './loadOptionalModule';

/**
 * Render the optional modules whose settings are on.
 * A module that is off is not imported.
 */
export function OptionalModuleHost() {
  const flags = useSettingsStore((state) => state.optionalModules);
  const enabled = OPTIONAL_MODULE_IDS.filter((id) => flags?.[id]);

  if (enabled.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="optional-module-host">
      {enabled.map((id) => (
        <OptionalModuleSlot key={id} id={id} />
      ))}
    </div>
  );
}

/**
 * Import one enabled module and render its panel.
 */
function OptionalModuleSlot({ id }: { id: OptionalModuleId }) {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadOptionalModule(id).then((bundle) => {
      if (!cancelled) setPanel(() => bundle.OptionalModulePanel);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!Panel) {
    return <p data-testid={`optional-module-loading-${id}`}>Loading {id}</p>;
  }

  return <Panel />;
}
