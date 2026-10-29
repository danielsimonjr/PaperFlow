import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import {
  OPTIONAL_MODULE_IDS,
  defaultOptionalModuleFlags,
} from '@/core/features';
import { OptionalModuleHost } from '@/modules/optional/OptionalModuleHost';
import { loadOptionalModule } from '@/modules/optional/loadOptionalModule';
import { useSettingsStore } from '@stores/settingsStore';
import Settings from '@/pages/Settings';

const shellRoots = [
  'src/App.tsx',
  'src/main.tsx',
  'src/pages',
  'src/components/layout',
  'src/components/viewer',
];

function sourceFiles(path: string): string[] {
  const full = resolve(path);
  const info = statSync(full);
  if (info.isFile()) return [full];
  return readdirSync(full).flatMap((name) => sourceFiles(join(full, name)));
}

describe('optional modules', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('starts with every module off', () => {
    const flags = defaultOptionalModuleFlags();
    for (const id of OPTIONAL_MODULE_IDS) {
      expect(flags[id]).toBe(false);
    }
    expect(useSettingsStore.getState().optionalModules).toEqual(flags);
  });

  it('does not import a module while its flag is off', () => {
    render(<OptionalModuleHost />);
    expect(screen.queryByTestId('optional-module-host')).not.toBeInTheDocument();
    for (const id of OPTIONAL_MODULE_IDS) {
      expect(screen.queryByTestId(`optional-module-${id}`)).not.toBeInTheDocument();
    }
  });

  it('loads a module only after its setting is turned on', async () => {
    useSettingsStore.getState().setOptionalModule('license', true);
    render(<OptionalModuleHost />);
    expect(await screen.findByTestId('optional-module-license')).toHaveTextContent('License ready');
    expect(screen.queryByTestId('optional-module-kiosk')).not.toBeInTheDocument();
  });

  it('resolves every module loader', async () => {
    for (const id of OPTIONAL_MODULE_IDS) {
      const bundle = await loadOptionalModule(id);
      expect(typeof bundle.OptionalModulePanel).toBe('function');
    }
  });

  it('keeps optional stores out of the app shell', () => {
    const forbidden = [
      'kioskStore',
      'licenseStore',
      'lanStore',
      'scannerStore',
      'batchStore',
      'nativeBatchStore',
      'comparisonStore',
      'fileWatchStore',
      'enterprisePolicyStore',
    ];
    const files = shellRoots.flatMap((root) => sourceFiles(root));
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
      const text = readFileSync(file, 'utf8');
      for (const name of forbidden) {
        expect(text, file).not.toContain(name);
      }
    }
  });

  it('toggles a module from the settings page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );
    const toggle = screen.getByTestId('optional-toggle-kiosk');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(useSettingsStore.getState().optionalModules.kiosk).toBe(true);
    await waitFor(() => {
      expect(screen.getByTestId('optional-module-kiosk')).toBeInTheDocument();
    });
  });

  it('persists a module flag and fills in flags missing from older settings', async () => {
    useSettingsStore.getState().setOptionalModule('kiosk', true);
    const saved = localStorage.getItem('paperflow-settings');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!) as { state: { optionalModules: { kiosk: boolean } } };
    expect(parsed.state.optionalModules.kiosk).toBe(true);

    parsed.state.optionalModules = { kiosk: true } as { kiosk: boolean };
    useSettingsStore.setState({ optionalModules: defaultOptionalModuleFlags() });
    localStorage.setItem('paperflow-settings', JSON.stringify(parsed));
    await useSettingsStore.persist.rehydrate();

    const flags = useSettingsStore.getState().optionalModules;
    expect(flags.kiosk).toBe(true);
    expect(flags.license).toBe(false);
    expect(flags.fileWatch).toBe(false);

    useSettingsStore.getState().resetToDefaults();
    expect(useSettingsStore.getState().optionalModules.kiosk).toBe(false);
  });

  it('does not import the file watcher when the Electron main process starts', () => {
    const staticImport = /import\s+[\s\S]*?\sfrom\s+['"][^'"]*fileWatcher['"]/;
    const main = readFileSync(resolve('electron/main/index.ts'), 'utf8');
    const handlers = readFileSync(resolve('electron/ipc/fileHandlers.ts'), 'utf8');
    expect(main).not.toMatch(staticImport);
    expect(handlers).not.toMatch(staticImport);
    expect(handlers).toContain("import('../fileWatcher')");
    expect(main).toContain("import('../fileWatcher')");
  });
});
