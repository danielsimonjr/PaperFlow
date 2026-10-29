import { WatchStatusIndicator } from '@/components/fileWatch/WatchStatusIndicator';
import { useFileWatchStore } from '@/stores/fileWatchStore';

/**
 * The file-watch module panel. It mounts the file-watch store.
 */
export function OptionalModulePanel() {
  useFileWatchStore((state) => state.isEnabled);
  return (
    <section data-testid="optional-module-fileWatch">
      <WatchStatusIndicator />
    </section>
  );
}
