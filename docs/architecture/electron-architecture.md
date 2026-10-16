# Electron Architecture

<!-- repo-map:no-verification -->

This document describes the Electron desktop application of PaperFlow. The desktop application loads the React application from `src/` in a window. Native features run in the main process. The preload script connects the main process and the renderer process.

## Process Model

### Main Process

The main process starts at `electron/main/index.ts`. The entry point does these steps:

- It sets security headers for all sessions.
- It calls `setupIpc`. This function calls `setupIpcHandlers` in `electron/ipc/handlers.ts`.
- It calls `initializeUpdater` in `electron/main/updater.ts` before it creates the main window.
- It creates the main window with `createMainWindow`. This function sets the Content Security Policy for the window.
- It starts the tray, the application menu, the shortcuts, the notifications, the protocol handler, the startup settings, and auto-save.

At shutdown, the entry point stops the power save blockers and the file watchers.

### Renderer Process

The renderer process loads the React application from `src/`. The web application and the desktop application use this folder.

The preload script `electron/preload/index.ts` builds to `electron/preload/index.cjs`. The main window loads the built file as its preload script. The preload script exposes the API object `window.electron`. See [IPC Patterns](ipc-patterns.md).

The desktop stores in `src/stores/` include `updateStore.ts`, `printStore.ts`, and `scannerStore.ts`. The enterprise stores are `enterprisePolicyStore.ts` and `licenseStore.ts`. The offline stores are `offlineStore.ts` and `fileWatchStore.ts`.

Platform detection uses these files:

- The hook `usePlatform` in `src/hooks/usePlatform.ts` returns `isElectron`, `isBrowser`, `isWindows`, `isMacOS`, `isLinux`, `platformInfo`, `appVersion`, `isLoading`, `hasFeature`, `commandKey`, `altKey`, and `formatShortcut`.
- `src/contexts/PlatformContext.tsx` defines a React context.
- `src/components/layout/TitleBar.tsx` renders minimize, maximize, and close buttons.

### Worker Threads

The worker script `electron/workers/pdfWorker.ts` runs the operations `compress`, `merge`, `split`, and `watermark`.

The class `WorkerPool` in `electron/workers/workerPool.ts` creates workers. It keeps a task queue. The queue sorts tasks by priority.

The class `WorkerManager` in `electron/workers/workerManager.ts` creates the pool. No file calls `initializeWorkerManager`. The main process does not create a worker pool.

## Directory Structure

The tree lists the files under `electron/`. A note marks each file that no file imports. Each name after a file is an exported name that the file defines.

```
electron/
├── main/
│   ├── index.ts                   Entry point (no exports)
│   ├── lifecycle.ts               requestSingleInstanceLock, setupLifecycle
│   ├── security.ts                PRODUCTION_CSP, DEVELOPMENT_CSP, setupContentSecurityPolicy
│   ├── windowManager.ts           WindowManager
│   ├── windowState.ts             loadWindowState, saveWindowState, clearWindowState
│   ├── updater.ts                 initializeUpdater, cleanupUpdater
│   ├── fileLock.ts                isFileLocked, canWriteFile, startLockMonitoring
│   ├── folderWatcher.ts           watchFolder, unwatchFolder
│   ├── watcherService.ts          WatcherService (used only by ipc/fileWatchIPC.ts and watcherOptimizations.ts)
│   ├── watcherOptimizations.ts    Watcher tuning (imported only by ipc/fileWatchIPC.ts)
│   ├── networkStatus.ts           (no import)
│   ├── print/
│   │   ├── printDialog.ts         PrintDialog (no import)
│   │   ├── printerCapabilities.ts PrinterCapabilitiesHelper (no import)
│   │   ├── printerDiscovery.ts    PrinterDiscovery (no import)
│   │   ├── printerManager.ts      PrinterManager
│   │   ├── printerMonitor.ts      PrinterMonitor (no import)
│   │   ├── silentPrint.ts         SilentPrint (imported only by print/printDialog.ts)
│   │   ├── spoolerIntegration.ts  SpoolerIntegration (no import)
│   │   └── types.ts               PrintMargins, PageRange, DuplexMode, PrintDPI
│   ├── scanner/
│   │   └── scannerBridge.ts       ScannerBridge, setupScannerBridge (no import)
│   ├── security/
│   │   └── webauthnBridge.ts      WebAuthnBridge (no import)
│   └── updates/
│       └── differential.ts        DifferentialUpdater (no import)
├── preload/
│   ├── index.ts                   Main preload, built to index.cjs
│   ├── networkPreload.ts          NetworkAPI (no import)
│   └── webauthnPreload.ts         webauthnAPI, exposeWebAuthnAPI (no import)
├── ipc/
│   ├── channels.ts                IPC_CHANNELS, IPC_EVENTS
│   ├── types.ts                   Payload types and ElectronAPI
│   ├── handlers.ts                setupIpcHandlers
│   ├── fileHandlers.ts            setupFileHandlers
│   ├── fileWatchIPC.ts            setupFileWatchHandlers (no caller)
│   ├── menuHandlers.ts            setupMenuHandlers
│   ├── printHandlers.ts           setupPrintHandlers
│   ├── dialogHandlers.ts          setupDialogHandlers
│   ├── clipboardHandlers.ts       setupClipboardHandlers
│   ├── storageHandlers.ts         setupStorageHandlers
│   ├── shellHandlers.ts           setupShellHandlers
│   ├── notificationHandlers.ts    setupNotificationHandlers, setupTrayHandlers,
│   │                              setupDockHandlers, setupAllNotificationHandlers
│   ├── safeStorageHandlers.ts     registerSafeStorageHandlers
│   └── pathSandbox.ts             approvePath, isPathAllowed, assertPathAllowed
├── workers/
│   ├── pdfWorker.ts               Worker script for compress, merge, split, watermark
│   ├── workerPool.ts              WorkerPool
│   └── workerManager.ts           WorkerManager (no caller)
├── touchbar/
│   └── touchBarManager.ts         TouchBarManager, initializeTouchBar (no import)
├── native/                        Source and build files for scanner and image capture wrappers
│   ├── twain/                     TWAIN wrapper
│   ├── wia/                       WIA wrapper
│   ├── sane/                      SANE wrapper
│   └── imagecapture/              macOS image capture wrapper
├── tsconfig.json
├── attention.ts                   AttentionManager, requestAttention (no import)
├── autoSave.ts                    enableAutoSave, disableAutoSave, saveRecoveryData
├── backup.ts                      createBackup, listBackups, restoreBackup, deleteBackup
├── clipboard.ts                   getClipboardInfo and related clipboard functions
├── contextMenu.ts                 createDocumentContextMenu, createAnnotationContextMenu
├── crashReporter.ts               Crash reporter settings (no import)
├── dialogs.ts                     Message and error dialog functions
├── dock.ts                        DockManager, setDockBadge, clearDockBadge, bounceDock
├── fileAssociation.ts             openFile, getPendingFile, clearPendingFile
├── fileWatcher.ts                 watchFile, unwatchFile, unwatchAll
├── jumpList.ts                    JumpListManager, initializeJumpList (no import)
├── linuxLauncher.ts               LinuxLauncherManager, initializeLinuxLauncher (no import)
├── menu.ts                        buildApplicationMenu, updateMenuState, getMenuState
├── menuTemplate.ts                createMacAppMenu, createFileMenu, createEditMenu,
│                                  createViewMenu, createDocumentMenu
├── notifications.ts               Notification manager functions
├── powerSave.ts                   startPowerSaveBlocker, stopPowerSaveBlocker
├── print.ts                       Print functions and PrintOptions
├── protocol.ts                    initializeProtocol, setupProtocolHandlers
├── recentFiles.ts                 loadRecentFiles, saveRecentFiles, addRecentFile
├── secureStorage.ts               setSecret, getSecret
├── shell.ts                       openExternalUrl, showItemInFolder, openWithDefaultApp
├── shortcuts.ts                   Shortcut definitions and loaders
├── startup.ts                     initializeStartup, setStartupSettings
├── taskbarOverlay.ts              TaskbarOverlayManager, initializeTaskbarOverlay (no import)
├── taskbarProgress.ts             TaskbarProgressManager, initializeTaskbarProgress (no import)
├── thumbnailToolbar.ts            ThumbnailToolbarManager, initializeThumbnailToolbar (no import)
├── tray.ts                        TrayManager, initializeTray, destroyTray
├── trayMenu.ts                    createTrayMenu, TrayMenuManager
└── windowsCrashReporter.ts        initializeWindowsCrashReporter (no import)
```

## Security Model

### Window Settings

The main window uses these web preferences. Lines 66 to 73 of `electron/main/index.ts` show the settings:

```typescript
  const mainWindow = windowManager.createWindow({
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
```

The default window options in `electron/main/windowManager.ts` use the same values for `contextIsolation`, `nodeIntegration`, and `sandbox`.

### Content Security Policy

`electron/main/security.ts` defines two policies. `setupContentSecurityPolicy(window, isDev)` uses `DEVELOPMENT_CSP` when `isDev` is true. In all other cases, it uses `PRODUCTION_CSP`. The function adds the policy to the response headers of each request for the window.

The production policy is this array, from lines 22 to 38:

```typescript
export const PRODUCTION_CSP = [
  "default-src 'self'",
  // Script: no 'unsafe-inline' / 'unsafe-eval'. blob: needed for PDF.js worker.
  "script-src 'self' blob:",
  "worker-src 'self' blob:",
  // Style: 'unsafe-inline' is retained because the renderer uses React inline
  // style={{...}} props (annotation positions, dynamic colors). Removing it
  // breaks the viewer; switching to a nonce/hash strategy is tracked separately.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
```

### Security Headers

The entry point sets these headers for all sessions. Lines 169 to 179 of `electron/main/index.ts` show the code:

```typescript
  // Set up security headers for all sessions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
      },
    });
  });
```

### Other Controls

- The source does not import `@electron/remote`.
- `openExternalUrl` in `electron/shell.ts` opens only URLs with the protocols `http:`, `https:`, `mailto:`, and `tel:`.
- `electron/ipc/pathSandbox.ts` limits file access to approved paths. See [IPC Patterns](ipc-patterns.md).
- `electron-builder.yml` enables the hardened runtime and notarization for macOS builds.

### Security Functions Without Callers

`electron/main/security.ts` exports `applySecurityDefaults`, `validateWebContentsConfig`, `preventNewWindows`, and `preventUntrustedNavigation`. No file in `electron/` or `src/` calls these functions.

## IPC Communication

The IPC channels and the handler patterns are described in [IPC Patterns](ipc-patterns.md).

These functions register the handlers:

- `setupIpcHandlers` in `electron/ipc/handlers.ts` registers the file, menu, context menu, shortcut, and safe storage handlers. It also registers the message dialog handler.
- The entry point also calls `setupPrintHandlers`, `setupShellHandlers`, `setupDialogHandlers`, `setupClipboardHandlers`, `setupStorageHandlers`, and `setupAllNotificationHandlers`.
- `setupFileWatchHandlers` in `electron/ipc/fileWatchIPC.ts` has no caller.

## Feature Modules

### Auto-Updater

`initializeUpdater` in `electron/main/updater.ts` does these steps:

- It sets the update settings from its `savedSettings` argument, when the argument is given.
- It configures `autoUpdater` from `electron-updater`. The properties `autoDownload` and `autoInstallOnAppQuit` take the value of the `autoUpdate` setting.
- It registers the handlers for the events `update-available`, `update-not-available`, `download-progress`, and `update-downloaded`.
- `initializeUpdater` registers the update IPC handlers in all cases.
- `initializeUpdater` checks for updates at startup and on a timer, only when `app.isPackaged` is true.

The function `broadcastUpdateState` sends `IPC_EVENTS.UPDATE_STATE_CHANGED` with the current update state to each window that is not destroyed.

### File Watching

`watchFile` in `electron/fileWatcher.ts` returns `false` when the file does not exist. Otherwise, `watchFile` creates a chokidar watcher. The watcher sets `ignoreInitial` to `true`. The watcher sets `awaitWriteFinish` with `stabilityThreshold` 300 and `pollInterval` 100.

The module sends `IPC_EVENTS.FILE_CHANGED` to each window. The module `electron/main/folderWatcher.ts` watches folders with `watchFolder`.

### System Tray

`TrayManager` in `electron/tray.ts` manages the tray icon. `initializeTray` creates the manager with an optional configuration. `destroyTray` removes the tray icon. The entry point calls `initializeTray` in `initializeTraySystem`.

The tray listens for the `click`, `double-click`, and `right-click` events.

### Application Menu

`buildApplicationMenu` in `electron/menu.ts` builds the application menu. The template functions in `electron/menuTemplate.ts` return the menu items for each menu. `updateMenuState` and `getMenuState` in `electron/menu.ts` change and read the menu state.

### Platform Features

- macOS dock: `electron/dock.ts` exports `setDockBadge`, `clearDockBadge`, and `bounceDock`. The dock IPC handlers are in `electron/ipc/notificationHandlers.ts`.
- Windows jump list, taskbar progress, taskbar overlay, and thumbnail toolbar: the files `electron/jumpList.ts`, `electron/taskbarProgress.ts`, `electron/taskbarOverlay.ts`, and `electron/thumbnailToolbar.ts` define these features. No file imports them.
- macOS Touch Bar: `electron/touchbar/touchBarManager.ts` defines `initializeTouchBar`. No file imports it.
- Linux launcher: `electron/linuxLauncher.ts` defines `LinuxLauncherManager`. No file imports it.

## Scanner and WebAuthn Bridges

`electron/main/scanner/scannerBridge.ts` and `electron/main/security/webauthnBridge.ts` define the scanner and WebAuthn bridges. No file imports them. The WebAuthn preload script `electron/preload/webauthnPreload.ts` also has no import.

## Build Configuration

`electron-builder.yml` at the repository root configures electron-builder. The scripts in `package.json` run the build:

- `electron:compile` builds the main process code and the preload code with Vite.
- `electron:build` runs the TypeScript build, the web build, the compile step, and `electron-builder`.
- `electron:dev` runs `scripts/dev-electron.js`.

The configuration sets these values:

- The application identifier is `com.paperflow.app`. The product name is `PaperFlow`.
- The output folder is `release`. The build resources folder is `build`. The icons are in `build/icons/`.
- The application files are `dist/`, `dist-electron/`, `package.json`, and `node_modules/`. The `node_modules/` entries exclude some test, documentation, and source map files. The application uses `asar`.
- The extra resource `public/pdf.worker.min.js` is copied to the application.
- The publish targets are a GitHub provider and a generic provider.
- The Windows target list contains only the portable target for x64. The NSIS target is commented out.
- The macOS targets are DMG (x64, arm64, and universal), PKG (universal), and ZIP (x64 and arm64). The hardened runtime and notarization are enabled. The `afterSign` hook is commented out.
- The Linux targets are AppImage, deb, and rpm (x64 and arm64), and snap and pacman (x64).
- The configuration reads code signing and notarization credentials from environment variables. The variables are `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`. The comments in the file name these variables.

## Performance Targets

The performance targets for the desktop application are in [OVERVIEW.md](OVERVIEW.md).
