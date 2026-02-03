# Electron Architecture

This document describes the architecture of the PaperFlow desktop application built with Electron.

## Overview

PaperFlow Desktop is an Electron-based application that wraps the existing React PWA while adding native desktop capabilities. The architecture follows Electron best practices with strict security measures, clean process separation, and comprehensive IPC communication.

## Process Model

```
+------------------------------------------------------------------+
|                       Main Process                                 |
|  +------------------------------------------------------------+  |
|  |  Window Management (windowManager.ts)                       |  |
|  |  - BrowserWindow creation and lifecycle                     |  |
|  |  - Window state persistence (position, size, maximized)     |  |
|  |  - Multi-window support                                     |  |
|  +------------------------------------------------------------+  |
|  |  App Lifecycle (lifecycle.ts)                               |  |
|  |  - App ready, activate, quit handlers                       |  |
|  |  - Single instance lock                                     |  |
|  |  - Startup and shutdown coordination                        |  |
|  +------------------------------------------------------------+  |
|  |  IPC Handlers (ipc/*.ts)                                    |  |
|  |  - File operations                                          |  |
|  |  - Dialog operations                                        |  |
|  |  - System tray and notifications                            |  |
|  |  - Print, clipboard, shell operations                       |  |
|  +------------------------------------------------------------+  |
|  |  Native Modules                                             |  |
|  |  - Auto-updater (electron-updater)                          |  |
|  |  - File watcher (chokidar)                                  |  |
|  |  - Scanner bridge (TWAIN/WIA/SANE)                          |  |
|  |  - WebAuthn bridge (FIDO2)                                  |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              | IPC (contextBridge)
                              v
+------------------------------------------------------------------+
|                     Renderer Process                               |
|  +------------------------------------------------------------+  |
|  |  Preload Script (preload/index.ts)                          |  |
|  |  - Exposes electronAPI via contextBridge                    |  |
|  |  - Type-safe IPC wrappers                                   |  |
|  |  - Event listener management                                |  |
|  +------------------------------------------------------------+  |
|  |  React Application                                          |  |
|  |  - Same codebase as PWA                                     |  |
|  |  - Desktop-aware components                                 |  |
|  |  - Platform context for conditional rendering               |  |
|  +------------------------------------------------------------+  |
|  |  Zustand Stores                                             |  |
|  |  - Desktop-specific: updateStore, printStore, scannerStore  |  |
|  |  - Enterprise: enterprisePolicyStore, licenseStore          |  |
|  |  - Offline: offlineStore, fileWatchStore                    |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              | Worker Messages
                              v
+------------------------------------------------------------------+
|                     Worker Threads                                 |
|  +------------------------------------------------------------+  |
|  |  PDF Worker (workers/pdfWorker.ts)                          |  |
|  |  - Parallel PDF processing                                  |  |
|  |  - Batch operations (compress, merge, split, watermark)     |  |
|  +------------------------------------------------------------+  |
|  |  Worker Pool Manager (workers/workerManager.ts)             |  |
|  |  - Worker lifecycle management                              |  |
|  |  - Task queue and distribution                              |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

## Directory Structure

```
electron/
├── main/
│   ├── index.ts               # Main process entry point
│   ├── windowManager.ts       # BrowserWindow management
│   ├── windowState.ts         # Window state persistence
│   ├── lifecycle.ts           # App lifecycle handlers
│   ├── security.ts            # CSP and security setup
│   ├── updater.ts             # Auto-update integration
│   ├── fileLock.ts            # File locking utilities
│   ├── folderWatcher.ts       # Folder watching service
│   ├── watcherService.ts      # File watcher coordination
│   ├── watcherOptimizations.ts # Watcher performance tuning
│   ├── networkStatus.ts       # Network connectivity detection
│   ├── print/
│   │   ├── printDialog.ts     # Native print dialog
│   │   ├── silentPrint.ts     # Silent printing
│   │   ├── printerDiscovery.ts # Printer enumeration
│   │   ├── printerCapabilities.ts
│   │   ├── printerManager.ts
│   │   ├── printerMonitor.ts
│   │   ├── spoolerIntegration.ts
│   │   └── types.ts
│   ├── scanner/
│   │   └── scannerBridge.ts   # Scanner driver bridge
│   ├── security/
│   │   └── webauthnBridge.ts  # WebAuthn/FIDO2 bridge
│   └── updates/
│       ├── autoUpdater.ts     # Update lifecycle
│       └── differential.ts    # Delta update support
├── preload/
│   ├── index.ts               # Main preload script
│   ├── networkPreload.ts      # Network status preload
│   └── webauthnPreload.ts     # WebAuthn preload
├── ipc/
│   ├── channels.ts            # IPC channel definitions
│   ├── types.ts               # IPC type definitions
│   ├── handlers.ts            # Core IPC handlers
│   ├── fileHandlers.ts        # File operation handlers
│   ├── fileWatchIPC.ts        # File watcher IPC
│   ├── menuHandlers.ts        # Menu IPC handlers
│   ├── printHandlers.ts       # Print IPC handlers
│   ├── dialogHandlers.ts      # Dialog IPC handlers
│   ├── clipboardHandlers.ts   # Clipboard IPC handlers
│   ├── storageHandlers.ts     # Secure storage IPC
│   ├── shellHandlers.ts       # Shell operation IPC
│   └── notificationHandlers.ts # Notification IPC
├── workers/
│   ├── workerPool.ts          # Worker thread pool
│   ├── workerManager.ts       # Worker lifecycle management
│   └── pdfWorker.ts           # PDF processing worker
├── *.ts                       # Feature modules
│   ├── autoSave.ts            # Auto-save functionality
│   ├── backup.ts              # Backup management
│   ├── fileAssociation.ts     # File association handling
│   ├── fileWatcher.ts         # File change detection
│   ├── recentFiles.ts         # Recent files tracking
│   ├── tray.ts                # System tray
│   ├── trayMenu.ts            # Tray context menu
│   ├── menu.ts                # Application menu
│   ├── menuTemplate.ts        # Menu templates
│   ├── contextMenu.ts         # Context menus
│   ├── shortcuts.ts           # Keyboard shortcuts
│   ├── notifications.ts       # Notification manager
│   ├── dock.ts                # macOS dock integration
│   ├── jumpList.ts            # Windows jump list
│   ├── taskbarProgress.ts     # Windows taskbar progress
│   ├── taskbarOverlay.ts      # Windows taskbar overlay
│   ├── thumbnailToolbar.ts    # Windows thumbnail toolbar
│   ├── linuxLauncher.ts       # Linux launcher integration
│   ├── touchbar/
│   │   └── touchBarManager.ts # macOS Touch Bar
│   ├── print.ts               # Print utilities
│   ├── protocol.ts            # Custom protocol handler
│   ├── startup.ts             # Startup configuration
│   ├── powerSave.ts           # Power save blocker
│   ├── clipboard.ts           # Clipboard operations
│   ├── dialogs.ts             # Native dialogs
│   ├── shell.ts               # Shell operations
│   ├── secureStorage.ts       # Encrypted storage
│   ├── crashReporter.ts       # Crash reporting
│   ├── windowsCrashReporter.ts # Windows-specific crash
│   └── attention.ts           # Window attention utilities
└── resources/
    └── icons/                 # Platform-specific icons
```

## Security Model

PaperFlow follows Electron security best practices:

### Context Isolation

```typescript
// main/index.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // Isolate preload from renderer
    nodeIntegration: false,    // No Node.js in renderer
    sandbox: true,             // Chromium sandbox enabled
    preload: PRELOAD_PATH,     // Only communication via preload
  },
});
```

### Content Security Policy

```typescript
// main/security.ts
export function setupContentSecurityPolicy(
  window: BrowserWindow,
  isDev: boolean
): void {
  const csp = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...";

  window.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
        },
      });
    }
  );
}
```

### Secure IPC Communication

All renderer-to-main communication goes through the preload script:

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('electron', {
  // Typed, validated API exposed to renderer
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: Uint8Array) => ipcRenderer.invoke('file:save', data),
  // ... other methods
});
```

### Security Headers

```typescript
// main/index.ts
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

## IPC Communication

### Channel Definitions

```typescript
// ipc/channels.ts
export const IPC_CHANNELS = {
  // File operations
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_SAVE: 'file:save',
  FILE_EXISTS: 'file:exists',
  FILE_DELETE: 'file:delete',

  // Dialog operations
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',
  DIALOG_MESSAGE: 'dialog:message',

  // Window operations
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // ... many more channels
} as const;

export const IPC_EVENTS = {
  FILE_OPENED: 'file:opened',
  FILE_CHANGED: 'file:changed',
  FILE_DELETED: 'file:deleted',
  MENU_FILE_NEW: 'menu:file:new',
  UPDATE_AVAILABLE: 'update:available',
  // ... events from main to renderer
} as const;
```

### Type-Safe IPC

```typescript
// ipc/types.ts
export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
  data?: ArrayBuffer;
}

export interface ElectronAPI {
  // Platform info
  getPlatformInfo: () => Promise<PlatformInfo>;
  getAppPath: () => Promise<AppPathInfo>;

  // File operations
  openFile: () => Promise<FileDialogResult>;
  saveFile: (data: Uint8Array, defaultPath?: string) => Promise<SaveDialogResult>;
  readFile: (filePath: string, options?: FileReadOptions) => Promise<FileReadResult>;

  // Event listeners (return unsubscribe function)
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onMenuFileNew: (callback: () => void) => () => void;

  // ... complete API definition
}
```

## Feature Modules

### Auto-Updater

```typescript
// main/updater.ts
export function initializeUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    notifyRenderer('update:available', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    notifyRenderer('update:progress', progress);
  });

  autoUpdater.checkForUpdates();
}
```

### File Watching

```typescript
// fileWatcher.ts
import chokidar from 'chokidar';

export function watchFile(filePath: string, callback: WatchCallback): () => void {
  const watcher = chokidar.watch(filePath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on('change', (path) => callback('change', path));
  watcher.on('unlink', (path) => callback('delete', path));

  return () => watcher.close();
}
```

### System Tray

```typescript
// tray.ts
export async function initializeTray(options: TrayOptions): Promise<TrayManager> {
  const icon = nativeImage.createFromPath(getTrayIconPath());
  const tray = new Tray(icon);

  tray.setToolTip('PaperFlow');

  tray.on('click', options.onTrayClick);
  tray.on('double-click', options.onTrayDoubleClick);
  tray.on('right-click', options.onTrayRightClick);

  return new TrayManager(tray);
}
```

### Native Menus

```typescript
// menuTemplate.ts
export function createApplicationMenu(): MenuItemConstructorOptions[] {
  const isMac = process.platform === 'darwin';

  return [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O' },
        { label: 'Open Recent', submenu: [] },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S' },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S' },
        // ...
      ],
    },
    // ... Edit, View, Document, Window, Help menus
  ];
}
```

## Platform-Specific Features

### Windows

- **Jump Lists**: Recent files in taskbar context menu
- **Taskbar Progress**: Show operation progress
- **Taskbar Overlays**: Status icons on app icon
- **Thumbnail Toolbar**: Quick actions on hover

```typescript
// jumpList.ts
export function updateJumpList(recentFiles: RecentFile[]): void {
  app.setJumpList([
    {
      type: 'custom',
      name: 'Recent Files',
      items: recentFiles.map(file => ({
        type: 'file',
        path: file.path,
      })),
    },
    {
      type: 'custom',
      name: 'Tasks',
      items: [
        { type: 'task', title: 'New Window', program: process.execPath, args: '--new-window' },
      ],
    },
  ]);
}
```

### macOS

- **Touch Bar**: Context-aware controls
- **Dock Badge**: Notification count
- **Dock Bounce**: Attention requests
- **Native Title Bar**: Traffic light buttons

```typescript
// touchbar/touchBarManager.ts
export function createViewerTouchBar(window: BrowserWindow): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarSlider({ label: 'Zoom', value: 100, minValue: 10, maxValue: 400 }),
      new TouchBarSegmentedControl({
        segments: [{ label: 'Prev' }, { label: 'Next' }],
      }),
    ],
  });
}
```

### Linux

- **Unity Launcher**: Quicklists and progress
- **Desktop Integration**: XDG compliance
- **GNOME/KDE**: Native theming

## Worker Threads

For CPU-intensive operations, PaperFlow uses worker threads:

```typescript
// workers/workerManager.ts
export class WorkerPoolManager {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Task[] = [];

  async processTask(task: Task): Promise<TaskResult> {
    const worker = await this.getAvailableWorker();
    return new Promise((resolve, reject) => {
      worker.postMessage(task);
      worker.once('message', resolve);
      worker.once('error', reject);
    });
  }
}
```

## Renderer Integration

### Platform Detection Hook

```typescript
// src/hooks/usePlatform.ts
export function usePlatform() {
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);

  useEffect(() => {
    if (window.electron) {
      window.electron.getPlatformInfo().then(setPlatform);
    } else {
      setPlatform({ platform: 'web', isElectron: false });
    }
  }, []);

  return {
    isElectron: platform?.isElectron ?? false,
    isWindows: platform?.platform === 'win32',
    isMac: platform?.platform === 'darwin',
    isLinux: platform?.platform === 'linux',
    platform,
  };
}
```

### Desktop-Aware Components

```typescript
// src/components/layout/Header.tsx
export function Header() {
  const { isElectron, isMac } = usePlatform();

  return (
    <header className={cn(
      'h-12 flex items-center',
      isElectron && isMac && 'pl-20' // Space for traffic lights
    )}>
      {isElectron && !isMac && <WindowControls />}
      {/* ... */}
    </header>
  );
}
```

## Build Configuration

### electron-builder.config.js

```javascript
module.exports = {
  appId: 'com.paperflow.app',
  productName: 'PaperFlow',

  directories: {
    output: 'release',
    buildResources: 'electron/resources',
  },

  files: [
    'dist/**/*',
    'dist-electron/**/*',
  ],

  win: {
    target: ['nsis', 'msi'],
    icon: 'electron/resources/icons/icon.ico',
  },

  mac: {
    target: [{ target: 'dmg', arch: 'universal' }],
    icon: 'electron/resources/icons/icon.icns',
    hardenedRuntime: true,
    notarize: true,
  },

  linux: {
    target: ['AppImage', 'deb', 'rpm'],
    icon: 'electron/resources/icons',
    category: 'Office',
  },
};
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Cold Start | < 3 seconds |
| Warm Start | < 1 second |
| Memory (Idle) | < 150 MB |
| Memory (100-page PDF) | < 500 MB |
| Native File Save | < 500 ms |
| IPC Round Trip | < 10 ms |

## Security Considerations

1. **No Remote Module**: Deprecated and disabled
2. **No shell.openExternal with untrusted URLs**: Validate all URLs
3. **No nodeIntegration in webviews**: Use preload scripts
4. **Validate all IPC inputs**: Type check and sanitize
5. **Use allowlist for file paths**: Prevent directory traversal
6. **Sign all releases**: Code signing for Windows and macOS
7. **Notarize macOS builds**: Required for Gatekeeper
