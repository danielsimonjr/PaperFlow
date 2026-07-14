/**
 * IPC Contract E2E Tests
 *
 * Guards the contract between the preload script and the main process:
 * every channel the preload exposes to the renderer MUST have a handler
 * registered in the main process, and it must be registered BEFORE the first
 * window exists.
 *
 * WHY THIS EXISTS
 * ---------------
 * The preload's contextBridge API is a promise to the renderer. Nothing was
 * checking that the main process kept it. Three real bugs shipped behind that gap:
 *
 *   1. All nine `update-*` handlers were registered inside `initializeUpdater()`,
 *      which main/index.ts called only `if (app.isPackaged)`. Unpackaged (dev, E2E),
 *      `window.electron.getUpdateState()` existed but rejected with
 *      "No handler registered for 'update-get-state'".
 *
 *   2. Once that was fixed, `initializeUpdater()` still ran AFTER createMainWindow().
 *      createMainWindow() awaits loadFile(), so the renderer is already executing when
 *      it returns — leaving ~1.5s where the API existed with no handler behind it.
 *      A renderer that queried update state on mount would race it. Tests only passed
 *      because their setup burned enough wall-clock to cross the gap.
 *
 *   3. `shellHandlers.ts` kept its own private copy of the channel names, which had
 *      drifted: it registered 'shell-open-default' while the preload invoked
 *      'shell-open-path'. `window.electron.openPath()` had never worked.
 *
 * All three are the same defect: an advertised API with nothing behind it. A unit test
 * cannot see any of them — they only exist in a booted app. Hence an E2E contract test.
 */

import { test, expect, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_PATH = path.join(__dirname, '../../dist-electron/main/index.js');
const REPO_ROOT = path.join(__dirname, '../..');

/**
 * Every channel the preload invokes, mapped to the API method that invokes it.
 *
 * Read from source rather than from the built bundle: the built preload has the channel
 * strings inlined, so recovering "which method calls which channel" from it is guesswork.
 */
function channelsInvokedByPreload(): Map<string, string> {
  const channelSrc = fs.readFileSync(path.join(REPO_ROOT, 'electron/ipc/channels.ts'), 'utf8');
  const keyToValue = new Map<string, string>();
  for (const m of channelSrc.matchAll(/^\s*([A-Z0-9_]+)\s*:\s*'([^']+)'/gm)) {
    keyToValue.set(m[1], m[2]);
  }

  const preloadSrc = fs.readFileSync(path.join(REPO_ROOT, 'electron/preload/index.ts'), 'utf8');
  const invoked = new Map<string, string>();
  for (const m of preloadSrc.matchAll(
    /(\w+)\s*:\s*\([^)]*\)\s*=>\s*invoke<[^>]*>\(\s*IPC_CHANNELS\.(\w+)/g
  )) {
    const [, methodName, channelKey] = m;
    const channel = keyToValue.get(channelKey);
    if (channel) invoked.set(channel, methodName);
  }
  return invoked;
}

/** Channels with a live `ipcMain.handle` registration, straight from the main process. */
async function registeredChannels(app: ElectronApplication): Promise<Set<string>> {
  const channels = await app.evaluate(({ ipcMain }) => {
    // `_invokeHandlers` is Electron-internal. If a future Electron renames it we want a
    // loud failure here, not a test that silently passes by inspecting an empty map.
    const handlers = (ipcMain as unknown as { _invokeHandlers?: Map<string, unknown> })
      ._invokeHandlers;
    if (!handlers || typeof handlers.keys !== 'function') return null;
    return [...handlers.keys()];
  });

  expect(
    channels,
    'Could not read ipcMain._invokeHandlers — Electron internals changed. ' +
      'This test must be updated; do not delete it.'
  ).not.toBeNull();

  return new Set(channels as string[]);
}

test.describe('IPC contract: preload API vs main-process handlers', () => {
  let electronApp: ElectronApplication;

  test.beforeEach(async () => {
    electronApp = await electron.launch({ args: [APP_PATH] });
  });

  test.afterEach(async () => {
    await electronApp?.close();
  });

  test('the preload actually exposes an API (contextBridge is alive)', async () => {
    // If the preload fails to load, Electron reports it only on the terminal and the app
    // keeps running with NO bridge — every assertion below would vacuously pass.
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const methodCount = await page.evaluate(() => {
      const api = (window as unknown as { electron?: Record<string, unknown> }).electron;
      return api ? Object.values(api).filter((v) => typeof v === 'function').length : 0;
    });

    expect(methodCount, 'window.electron exposes no functions — the preload did not load').
      toBeGreaterThan(0);
  });

  test('every channel the preload invokes has a handler in the main process', async () => {
    await electronApp.firstWindow();
    const registered = await registeredChannels(electronApp);
    const invoked = channelsInvokedByPreload();

    expect(invoked.size, 'parsed zero channels from the preload — the parser is broken').
      toBeGreaterThan(0);

    const dead = [...invoked]
      .filter(([channel]) => !registered.has(channel))
      .map(([channel, method]) => `window.electron.${method}() -> '${channel}'`);

    expect(
      dead,
      `The preload exposes ${dead.length} method(s) with no handler registered. ` +
        'Calling them rejects with "No handler registered for ...".'
    ).toEqual([]);
  });

  test('handlers are registered before the first window can call them', async () => {
    // The renderer starts executing as soon as the window loads. Any handler registered
    // after that point is a race: the API exists, but invoking it may reject. Reading the
    // handler map at firstWindow() — with no settling delay — is what makes this a race
    // detector rather than a "did it eventually register" check.
    const page = await electronApp.firstWindow();
    const atWindowCreation = await registeredChannels(electronApp);

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // let all late/deferred startup work finish

    const afterStartupSettles = await registeredChannels(electronApp);

    const registeredLate = [...afterStartupSettles].filter((c) => !atWindowCreation.has(c));

    expect(
      registeredLate,
      'These channels were registered AFTER the window was created, so a renderer that ' +
        'invokes them on mount can lose the race and get "No handler registered". ' +
        'Register them before createMainWindow() in electron/main/index.ts.'
    ).toEqual([]);
  });
});
