/**
 * Electron Build Script
 *
 * This script builds the Electron application for distribution.
 * It handles building both the web app and Electron main process,
 * then packages everything using electron-builder.
 */

import { build as viteBuild } from 'vite';
import { build as electronBuild } from 'electron-builder';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Build the Vite web app
 */
async function buildWebApp() {
  console.log('Building web app...');
  await viteBuild({
    configFile: 'vite.config.ts',
    mode: 'production',
  });
  console.log('Web app build complete.\n');
}

/**
 * Build the Electron main process
 */
async function buildMainProcess() {
  console.log('Building Electron main process...');
  await viteBuild({
    configFile: 'vite.electron.config.ts',
    mode: 'production',
  });
  console.log('Main process build complete.\n');
}

/**
 * Copy necessary files for Electron build
 */
function copyBuildFiles() {
  console.log('Copying build files...');

  // Ensure build directory exists
  const buildDir = path.resolve('build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Create placeholder icons if they don't exist
  const iconFiles = [
    { name: 'icon.ico', size: '256x256' },
    { name: 'icon.icns', size: '512x512' },
    { name: 'icon.png', size: '512x512' },
  ];

  for (const { name } of iconFiles) {
    const iconPath = path.join(buildDir, name);
    if (!fs.existsSync(iconPath)) {
      console.log(`Note: ${name} not found. Build may use default icon.`);
    }
  }

  // Create Linux icon directory if needed
  const linuxIconsDir = path.join(buildDir, 'icons');
  if (!fs.existsSync(linuxIconsDir)) {
    fs.mkdirSync(linuxIconsDir, { recursive: true });
  }

  console.log('Build files ready.\n');
}

/**
 * Package the application using electron-builder
 * @param {string[]} targets - Optional build targets
 */
async function packageApp(targets) {
  console.log('Packaging application...');

  const config = {
    config: 'electron-builder.yml',
  };

  // If targets specified, add them to config
  if (targets && targets.length > 0) {
    const targetMap = {
      win: { win: ['nsis', 'portable'] },
      mac: { mac: ['dmg', 'zip'] },
      linux: { linux: ['AppImage', 'deb', 'rpm'] },
    };

    const buildTargets = {};
    for (const target of targets) {
      if (targetMap[target]) {
        Object.assign(buildTargets, targetMap[target]);
      }
    }

    if (Object.keys(buildTargets).length > 0) {
      Object.assign(config, buildTargets);
    }
  }

  await electronBuild(config);
  console.log('Packaging complete.\n');
}

/**
 * Main build function
 */
async function main() {
  const args = process.argv.slice(2);
  const targets = args.filter((arg) => ['win', 'mac', 'linux'].includes(arg));
  const skipWeb = args.includes('--skip-web');
  const skipPackage = args.includes('--skip-package');

  console.log('='.repeat(50));
  console.log('Electron Build Script');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Build web app
    if (!skipWeb) {
      await buildWebApp();
    } else {
      console.log('Skipping web app build.\n');
    }

    // Build main process
    await buildMainProcess();

    // Copy build files
    copyBuildFiles();

    // Package app
    if (!skipPackage) {
      await packageApp(targets);

      console.log('='.repeat(50));
      console.log('Build successful!');
      console.log('Output: ./release/');
      console.log('='.repeat(50));
    } else {
      console.log('Skipping packaging.\n');
      console.log('='.repeat(50));
      console.log('Build complete (no packaging).');
      console.log('='.repeat(50));
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
