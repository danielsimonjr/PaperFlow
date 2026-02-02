/**
 * Electron Development Script
 *
 * This script starts both the Vite dev server and Electron,
 * with hot reload support for both the renderer and main process.
 */

import { spawn } from 'child_process';
import { createServer, build } from 'vite';
import electronPath from 'electron';

/** @type {import('child_process').ChildProcess | null} */
let electronProcess = null;

/** @type {boolean} */
let isRestarting = false;

/**
 * Start the Vite dev server
 * @returns {Promise<import('vite').ViteDevServer>}
 */
async function startViteDevServer() {
  const server = await createServer({
    configFile: 'vite.config.ts',
    mode: 'development',
  });

  await server.listen();
  server.printUrls();

  return server;
}

/**
 * Build the Electron main process
 * @returns {Promise<void>}
 */
async function buildMainProcess() {
  await build({
    configFile: 'vite.electron.config.ts',
    mode: 'development',
  });
}

/**
 * Start Electron
 * @param {string} serverUrl - The Vite dev server URL
 */
function startElectron(serverUrl) {
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }

  const env = {
    ...process.env,
    VITE_DEV_SERVER_URL: serverUrl,
    NODE_ENV: 'development',
  };

  electronProcess = spawn(String(electronPath), ['.'], {
    stdio: 'inherit',
    env,
  });

  electronProcess.on('close', (code) => {
    if (!isRestarting) {
      console.log(`\nElectron process exited with code ${code}`);
      process.exit(code ?? 0);
    }
  });

  electronProcess.on('error', (error) => {
    console.error('Failed to start Electron:', error);
  });
}

/**
 * Restart Electron
 * @param {string} serverUrl - The Vite dev server URL
 */
function restartElectron(serverUrl) {
  isRestarting = true;

  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }

  // Wait a bit before restarting
  setTimeout(() => {
    isRestarting = false;
    startElectron(serverUrl);
  }, 100);
}

/**
 * Watch for main process changes and rebuild
 * @param {string} serverUrl - The Vite dev server URL
 */
async function watchMainProcess(serverUrl) {
  const { watch } = await import('chokidar');

  const watcher = watch(['electron/**/*.ts'], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (path) => {
    console.log(`\n[main] ${path} changed, rebuilding...`);
    try {
      await buildMainProcess();
      console.log('[main] Rebuild complete, restarting Electron...');
      restartElectron(serverUrl);
    } catch (error) {
      console.error('[main] Build failed:', error);
    }
  });

  console.log('[main] Watching for changes...');
}

/**
 * Main entry point
 */
async function main() {
  console.log('Starting Electron development environment...\n');

  try {
    // Build the main process first
    console.log('[main] Building Electron main process...');
    await buildMainProcess();
    console.log('[main] Build complete.\n');

    // Start Vite dev server
    console.log('[renderer] Starting Vite dev server...');
    const server = await startViteDevServer();

    const addressInfo = server.httpServer?.address();
    const serverUrl =
      typeof addressInfo === 'object' && addressInfo
        ? `http://localhost:${addressInfo.port}`
        : 'http://localhost:5173';

    console.log(`\n[renderer] Dev server running at ${serverUrl}\n`);

    // Watch main process for changes
    await watchMainProcess(serverUrl);

    // Start Electron
    console.log('[electron] Starting Electron...\n');
    startElectron(serverUrl);

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      if (electronProcess) {
        electronProcess.kill();
      }
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start development environment:', error);
    process.exit(1);
  }
}

main();
