# Phase 3: Desktop Application (Electron) Development Plan

## Overview

Phase 3 spans 12 months (Year 2) across 24 two-week sprints, delivering a native desktop application using Electron that provides enhanced performance, deeper OS integration, and enterprise-ready deployment options for Windows, macOS, and Linux.

### Milestones

| Quarter | Deliverables | Milestone |
|---------|--------------|-----------|
| Q1 | Electron shell, native file system, auto-updater, system tray | v3.0 Desktop Alpha |
| Q2 | Offline-first, batch processing, scanner integration, FIDO2 | v3.5 Desktop Beta |
| Q3 | Cross-platform installers, platform UI adaptations, Touch Bar | v4.0 Desktop Release |
| Q4 | MDM/GPO support, offline licensing, LAN sync, kiosk mode | v4.5 Enterprise Desktop |

### Success Criteria

| Metric | Target |
|--------|--------|
| App Startup Time | < 3 seconds cold start |
| Memory Usage (Idle) | < 150 MB |
| Memory Usage (100-page PDF) | < 500 MB |
| Native File Save | < 500ms |
| Auto-Update Success Rate | > 99% |
| Installer Size | < 100 MB |
| Cross-Platform Parity | 95% feature parity |
| Offline Functionality | 100% core features |

### Sprint Overview

| Sprint | Focus Area | Quarter |
|--------|------------|---------|
| 1 | Electron Project Setup & Build System | Q1 |
| 2 | Native File System Integration | Q1 |
| 3 | System Tray & Notifications | Q1 |
| 4 | Auto-Updater Implementation | Q1 |
| 5 | Native Menus & Shortcuts | Q1 |
| 6 | Q1 Polish & Alpha Release | Q1 |
| 7 | Offline-First Architecture | Q2 |
| 8 | Local File Watching & Hot Reload | Q2 |
| 9 | Batch Processing with Native Performance | Q2 |
| 10 | Native Print Integration | Q2 |
| 11 | Scanner Integration (TWAIN/WIA) | Q2 |
| 12 | Hardware Security Key Support (FIDO2) & Q2 Release | Q2 |
| 13 | Windows Installer (MSI, MSIX) | Q3 |
| 14 | macOS App Bundle & Notarization | Q3 |
| 15 | Linux Packages (AppImage, deb, rpm, snap) | Q3 |
| 16 | Platform-Specific UI Adaptations | Q3 |
| 17 | macOS Touch Bar & Windows Taskbar | Q3 |
| 18 | Q3 Polish & Desktop Release | Q3 |
| 19 | MDM/GPO Deployment Support | Q4 |
| 20 | Centralized Configuration | Q4 |
| 21 | Offline License Validation | Q4 |
| 22 | Local Network Collaboration (LAN Sync) | Q4 |
| 23 | On-Premise Update Server | Q4 |
| 24 | Kiosk Mode & Q4 Enterprise Release | Q4 |

### New Dependencies

```bash
# Electron Core
npm install electron@^28.0.0
npm install electron-builder@^24.0.0
npm install electron-updater@^6.0.0
npm install electron-store@^8.0.0
npm install electron-log@^5.0.0

# Native File System
npm install chokidar@^3.5.0
npm install trash@^8.0.0
npm install fs-extra@^11.0.0

# System Integration
npm install node-notifier@^10.0.0
npm install auto-launch@^5.0.0

# Scanner Integration (Windows)
npm install @aspect/node-wia@^1.0.0

# Hardware Security
npm install @aspect/node-fido2@^1.0.0

# Build & Distribution
npm install -D electron-builder@^24.0.0
npm install -D @electron/notarize@^2.0.0
npm install -D electron-winstaller@^5.0.0
npm install -D electron-installer-debian@^3.0.0
npm install -D electron-installer-redhat@^3.0.0

# Development
npm install -D electron-devtools-installer@^3.0.0
npm install -D electron-reload@^2.0.0
npm install -D concurrently@^8.0.0
npm install -D wait-on@^7.0.0
```

> **Note:** Version ranges use caret (^) to allow minor version updates. Pin to exact versions in production if stricter version control is required. Scanner and FIDO2 packages may require platform-specific native modules.

---

## Electron Architecture Considerations

Phase 3 introduces desktop-specific architecture patterns that differ from the PWA approach. This section outlines key architectural decisions.

### Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process                             │
│  ├── Window Management                                       │
│  ├── Native Menu & Tray                                     │
│  ├── File System Access                                      │
│  ├── Auto-Updater                                           │
│  ├── IPC Handler                                            │
│  └── Native Module Bridge                                    │
└─────────────────────────────────────────────────────────────┘
                              │ IPC
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Renderer Process(es)                       │
│  ├── React Application (existing PWA code)                  │
│  ├── PDF.js Rendering                                       │
│  ├── Preload Scripts (contextBridge)                        │
│  └── Desktop-specific UI Components                         │
└─────────────────────────────────────────────────────────────┘
```

### Security Model

| Layer | Implementation |
|-------|----------------|
| Context Isolation | `contextIsolation: true` (default) |
| Node Integration | `nodeIntegration: false` in renderer |
| Preload Scripts | Expose limited API via `contextBridge` |
| Remote Module | Disabled (deprecated) |
| Sandbox | `sandbox: true` for renderer processes |
| CSP | Strict Content Security Policy |

### Code Sharing Strategy

```
src/
├── common/           # Shared between web and desktop
│   ├── components/
│   ├── stores/
│   ├── lib/
│   └── utils/
├── web/              # PWA-specific code
│   └── serviceWorker/
├── desktop/          # Electron-specific code
│   ├── main/         # Main process
│   ├── preload/      # Preload scripts
│   └── native/       # Native module wrappers
└── platform/         # Platform abstraction layer
    ├── fileSystem.ts
    ├── printing.ts
    ├── notifications.ts
    └── updates.ts
```

### Build Targets

| Platform | Architecture | Installer Format |
|----------|--------------|------------------|
| Windows | x64, arm64 | MSI, MSIX, NSIS |
| macOS | x64 (Intel), arm64 (Apple Silicon) | DMG, PKG |
| Linux | x64, arm64 | AppImage, deb, rpm, snap |

---

## Sprint 1: Electron Project Setup & Build System

**Goal:** Set up Electron project structure and configure build system

**Milestone:** Electron Technical Foundation

### Project Structure

- [ ] Create Electron project structure
  ```
  electron/
  ├── main/
  │   ├── index.ts           # Main process entry
  │   ├── windowManager.ts   # Window lifecycle
  │   ├── ipcHandlers.ts     # IPC message handlers
  │   ├── menu.ts            # Native menu
  │   └── tray.ts            # System tray
  ├── preload/
  │   ├── index.ts           # Preload script
  │   └── api.ts             # Exposed APIs
  ├── native/
  │   ├── fileSystem.ts      # Native FS operations
  │   └── platform.ts        # Platform detection
  └── resources/
      ├── icons/             # App icons (all sizes)
      └── installers/        # Installer assets
  ```
- [ ] Configure TypeScript for Electron
  - Separate tsconfig for main process
  - Proper module resolution
  - Path aliases matching web app
- [ ] Set up main process entry point
  - App lifecycle handling
  - Single instance lock
  - Crash reporting setup

### Vite + Electron Integration

- [ ] Install and configure vite-plugin-electron
  ```typescript
  // vite.config.ts
  import electron from 'vite-plugin-electron'

  export default defineConfig({
    plugins: [
      react(),
      electron({
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      }),
    ],
  })
  ```
- [ ] Configure hot reload for development
  - Main process restart on changes
  - Renderer process HMR
- [ ] Set up environment variables
  - Development vs production modes
  - Platform-specific variables

### Window Management

- [ ] Create BrowserWindow configuration
  ```typescript
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
  })
  ```
- [ ] Implement window state persistence
  - Save position and size
  - Restore on next launch
  - Handle multiple displays
- [ ] Add window controls (Windows/Linux)
  - Custom title bar option
  - Minimize, maximize, close buttons

### Preload Script

- [ ] Create secure preload script
  ```typescript
  // preload/index.ts
  import { contextBridge, ipcRenderer } from 'electron'

  contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (data: ArrayBuffer) => ipcRenderer.invoke('file:save', data),

    // Platform info
    platform: process.platform,

    // App info
    getVersion: () => ipcRenderer.invoke('app:version'),
  })
  ```
- [ ] Define TypeScript types for exposed API
  ```typescript
  // types/electron.d.ts
  interface ElectronAPI {
    openFile: () => Promise<{ path: string; data: ArrayBuffer } | null>
    saveFile: (data: ArrayBuffer) => Promise<boolean>
    platform: NodeJS.Platform
    getVersion: () => Promise<string>
  }

  declare global {
    interface Window {
      electronAPI: ElectronAPI
    }
  }
  ```

### Build Configuration

- [ ] Configure electron-builder
  ```javascript
  // electron-builder.config.js
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
      target: ['dmg', 'zip'],
      icon: 'electron/resources/icons/icon.icns',
      category: 'public.app-category.productivity',
    },
    linux: {
      target: ['AppImage', 'deb', 'rpm'],
      icon: 'electron/resources/icons',
      category: 'Office',
    },
  }
  ```
- [ ] Add build scripts to package.json
  ```json
  {
    "scripts": {
      "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
      "electron:build": "npm run build && electron-builder",
      "electron:build:win": "npm run build && electron-builder --win",
      "electron:build:mac": "npm run build && electron-builder --mac",
      "electron:build:linux": "npm run build && electron-builder --linux"
    }
  }
  ```

### App Icons

- [ ] Generate app icons for all platforms
  - Windows: ICO (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
  - macOS: ICNS (512x512@2x, 512x512, 256x256@2x, 256x256, 128x128@2x, 128x128)
  - Linux: PNG (512x512, 256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- [ ] Create installer graphics
  - Windows: Sidebar image (164x314), header image (150x57)
  - macOS: DMG background (540x380)

### Definition of Done

- [ ] Electron app launches successfully
- [ ] React app renders in BrowserWindow
- [ ] Hot reload works in development
- [ ] Preload script exposes API safely
- [ ] Build produces working installers
- [ ] Window state persists between launches

---

## Sprint 2: Native File System Integration

**Goal:** Implement full native file system access

### Native File Dialogs

- [ ] Implement native open dialog
  ```typescript
  // main/ipcHandlers.ts
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF Documents', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const data = await fs.promises.readFile(filePath)
    return { path: filePath, data: data.buffer }
  })
  ```
- [ ] Implement native save dialog
  - Save to specific location
  - Overwrite confirmation
  - File type selection
- [ ] Add recent files tracking
  - Store in electron-store
  - Show in File menu
  - Quick access from app

### Direct File Access

- [ ] Implement file reading
  - Read PDF from path
  - Handle large files (streaming)
  - Report progress for large files
- [ ] Implement file writing
  - Write to original path (Save)
  - Write to new path (Save As)
  - Atomic writes (temp file + rename)
- [ ] Add file locking
  - Prevent concurrent access
  - Warn if file is locked
  - Release on close

### File Path Management

- [ ] Track current file path
  ```typescript
  interface FileState {
    currentPath: string | null
    isModified: boolean
    originalHash: string
    lastSaved: Date | null
  }
  ```
- [ ] Update window title with file name
  - Show file name
  - Show modified indicator (*)
  - Show full path on hover
- [ ] Handle unsaved changes
  - Prompt on close
  - Prompt on new file
  - Prompt on open file

### File Associations

- [ ] Register file associations (build config)
  ```javascript
  // electron-builder.config.js
  {
    fileAssociations: [
      {
        ext: 'pdf',
        name: 'PDF Document',
        description: 'Portable Document Format',
        mimeType: 'application/pdf',
        role: 'Viewer',
      },
    ],
  }
  ```
- [ ] Handle file open from OS
  - macOS: open-file event
  - Windows/Linux: command line args
  - Handle multiple files

### Drag and Drop Enhancement

- [ ] Enable native file drop
  - Show drop indicator
  - Read file path from drop
  - Open dropped file
- [ ] Enable drag out
  - Drag file to other apps
  - Create temp file for drag

### Definition of Done

- [ ] Native file dialogs work on all platforms
- [ ] Files save to correct location
- [ ] File associations open PaperFlow
- [ ] Recent files list works
- [ ] Unsaved changes prompt works
- [ ] Large files handle efficiently

---

## Sprint 3: System Tray & Notifications

**Goal:** Implement system tray and notification system

### System Tray

- [ ] Create tray icon
  ```typescript
  // main/tray.ts
  import { Tray, Menu, nativeImage } from 'electron'

  let tray: Tray | null = null

  export function createTray() {
    const icon = nativeImage.createFromPath(
      path.join(__dirname, '../resources/icons/tray.png')
    )
    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open PaperFlow', click: () => showMainWindow() },
      { type: 'separator' },
      { label: 'Recent Files', submenu: getRecentFilesMenu() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])

    tray.setToolTip('PaperFlow')
    tray.setContextMenu(contextMenu)
  }
  ```
- [ ] Add tray icon variants
  - Light mode icon
  - Dark mode icon
  - macOS template icon
- [ ] Implement tray actions
  - Left-click: show window
  - Right-click: context menu
  - Double-click: open new window

### Tray Notifications

- [ ] Show background operation status
  - Batch processing progress
  - OCR processing
  - File sync status
- [ ] Add notification badges
  - Unread notifications count
  - Processing indicator

### Native Application Menu

- [ ] Create macOS menu bar
  ```typescript
  // main/menu.ts
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: openPreferences },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    // File, Edit, View, Tools, Window, Help menus...
  ]
  ```
- [ ] Create Windows/Linux menu bar
  - File menu with all operations
  - Edit menu with clipboard operations
  - View menu with zoom and panels
  - Tools menu with utilities
  - Help menu with documentation

### File Menu

- [ ] Implement File menu items
  - New Window (Ctrl/Cmd+N)
  - Open (Ctrl/Cmd+O)
  - Open Recent submenu
  - Close (Ctrl/Cmd+W)
  - Save (Ctrl/Cmd+S)
  - Save As (Ctrl/Cmd+Shift+S)
  - Export submenu
  - Print (Ctrl/Cmd+P)
  - Quit (Ctrl/Cmd+Q)

### Edit Menu

- [ ] Implement Edit menu items
  - Undo (Ctrl/Cmd+Z)
  - Redo (Ctrl/Cmd+Shift+Z)
  - Cut (Ctrl/Cmd+X)
  - Copy (Ctrl/Cmd+C)
  - Paste (Ctrl/Cmd+V)
  - Select All (Ctrl/Cmd+A)
  - Find (Ctrl/Cmd+F)

### View Menu

- [ ] Implement View menu items
  - Zoom In (Ctrl/Cmd+=)
  - Zoom Out (Ctrl/Cmd+-)
  - Actual Size (Ctrl/Cmd+0)
  - Toggle Sidebar
  - Toggle Thumbnails
  - Single Page / Continuous / Spread
  - Enter Full Screen (F11 / Ctrl/Cmd+F)
  - Toggle Developer Tools

### Context Menus

- [ ] Create right-click context menus
  - Page context menu
  - Annotation context menu
  - Text selection context menu
  - Thumbnail context menu
- [ ] Integrate with renderer
  - IPC for context menu requests
  - Return selected action

### Definition of Done

- [ ] System tray shows and functions correctly
- [ ] Tray icon adapts to system theme
- [ ] Application menu works on all platforms
- [ ] All keyboard shortcuts work
- [ ] Context menus appear correctly
- [ ] Menu state updates dynamically

---

## Sprint 4: Auto-Updater Implementation

**Goal:** Implement automatic application updates

### Update Infrastructure

- [ ] Configure electron-updater
  ```typescript
  // main/updater.ts
  import { autoUpdater } from 'electron-updater'
  import log from 'electron-log'

  autoUpdater.logger = log
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  export function initAutoUpdater() {
    autoUpdater.checkForUpdates()

    // Check for updates every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates()
    }, 4 * 60 * 60 * 1000)
  }
  ```
- [ ] Set up update server
  - GitHub Releases (free tier)
  - S3/CloudFront (enterprise)
  - Custom update server option
- [ ] Configure code signing
  - Windows: EV Code Signing Certificate
  - macOS: Developer ID Certificate
  - Linux: GPG signing

### Update Events

- [ ] Handle update lifecycle events
  ```typescript
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.')
    promptForDownload(info)
  })

  autoUpdater.on('update-not-available', () => {
    sendStatusToWindow('Up to date.')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendStatusToWindow(`Downloading: ${progress.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    promptForInstall(info)
  })

  autoUpdater.on('error', (err) => {
    sendStatusToWindow(`Update error: ${err.message}`)
  })
  ```

### Update UI

- [ ] Create update notification dialog
  - Show version number
  - Show release notes
  - Download now / Later buttons
- [ ] Add download progress indicator
  - Progress bar
  - Download speed
  - Cancel option
- [ ] Create restart prompt
  - Restart now / Later
  - Schedule restart

### Update Settings

- [ ] Add update preferences
  - Check automatically (default: true)
  - Download automatically (default: false)
  - Install on quit (default: true)
  - Update channel (stable/beta)
- [ ] Implement beta channel
  - Opt-in for beta updates
  - Separate update feed
  - Easy rollback

### Differential Updates

- [ ] Configure delta updates
  - Generate blockmap files
  - Reduce download size
  - Fall back to full download
- [ ] Track update metrics
  - Update success rate
  - Average download time
  - Rollback frequency

### Definition of Done

- [ ] Updates check automatically
- [ ] Update notification appears
- [ ] Download progress shows correctly
- [ ] Updates install on restart
- [ ] Beta channel works
- [ ] Delta updates reduce download size

---

## Sprint 5: Native Menus & Shortcuts

**Goal:** Implement native application menus and keyboard shortcuts

### Protocol Handlers

- [ ] Register custom protocol
  ```typescript
  // main/protocol.ts
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('paperflow', process.execPath, [
        path.resolve(process.argv[1]),
      ])
    }
  } else {
    app.setAsDefaultProtocolClient('paperflow')
  }
  ```
- [ ] Handle protocol URLs
  - `paperflow://open?path=/path/to/file.pdf`
  - `paperflow://open?url=https://example.com/file.pdf`
  - `paperflow://action/merge?files=...`

### Jump List / Dock Menu

- [ ] Windows Jump List
  ```typescript
  app.setJumpList([
    {
      type: 'custom',
      name: 'Recent Files',
      items: getRecentFilesForJumpList(),
    },
    {
      type: 'custom',
      name: 'Actions',
      items: [
        {
          type: 'task',
          title: 'New Window',
          program: process.execPath,
          args: '--new-window',
          iconPath: process.execPath,
          iconIndex: 0,
        },
      ],
    },
  ])
  ```
- [ ] macOS Dock Menu
  ```typescript
  const dockMenu = Menu.buildFromTemplate([
    { label: 'New Window', click: createNewWindow },
    { label: 'Open File...', click: openFile },
  ])
  app.dock.setMenu(dockMenu)
  ```

### Native Notifications

- [ ] Implement native notifications
  ```typescript
  import { Notification } from 'electron'

  function showNotification(title: string, body: string, onClick?: () => void) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, '../resources/icons/notification.png'),
    })

    if (onClick) {
      notification.on('click', onClick)
    }

    notification.show()
  }
  ```
- [ ] Notification types
  - File saved successfully
  - Export complete
  - OCR complete
  - Update available
  - Sync complete

### Auto-Launch

- [ ] Configure auto-launch on login
  ```typescript
  import AutoLaunch from 'auto-launch'

  const autoLauncher = new AutoLaunch({
    name: 'PaperFlow',
    path: app.getPath('exe'),
    isHidden: true,
  })

  // Enable/disable based on settings
  if (settings.get('autoLaunch')) {
    autoLauncher.enable()
  }
  ```
- [ ] Add setting to toggle auto-launch
- [ ] Launch minimized to tray option

### Crash Reporting

- [ ] Set up crash reporter
  ```typescript
  import { crashReporter } from 'electron'

  crashReporter.start({
    productName: 'PaperFlow',
    companyName: 'PaperFlow Inc',
    submitURL: 'https://crash.paperflow.app/submit',
    uploadToServer: true,
  })
  ```
- [ ] Collect crash dumps
- [ ] Report to Sentry/custom server

### Native Drag and Drop

- [ ] Enable native file drag
  ```typescript
  // In renderer (via preload)
  element.addEventListener('dragstart', (event) => {
    event.preventDefault()
    window.electronAPI.startDrag(filePath)
  })

  // In main process
  ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromPath(iconPath),
    })
  })
  ```

### Definition of Done

- [ ] Protocol handler opens files
- [ ] Jump List / Dock Menu shows recent files
- [ ] Native notifications work
- [ ] Auto-launch setting works
- [ ] Crash reports collected
- [ ] Native drag out works

---

## Sprint 6: Q1 Polish & Alpha Release

**Goal:** Polish desktop features and release Alpha version

**Milestone:** v3.0 Desktop Alpha

### Integration Testing

- [ ] Test all platform combinations
  - Windows 10/11 x64
  - macOS 12+ Intel
  - macOS 12+ Apple Silicon
  - Ubuntu 22.04+ x64
- [ ] Verify file system operations
  - Open from various locations
  - Save with special characters in filename
  - Handle network drives (Windows)
- [ ] Test auto-updater flow
  - Fresh install
  - Update from previous version
  - Delta update

### Performance Optimization

- [ ] Optimize startup time
  - Lazy load non-critical modules
  - Defer window creation
  - Profile and optimize
- [ ] Memory optimization
  - Proper cleanup on window close
  - Monitor for leaks
  - Optimize PDF rendering
- [ ] Reduce bundle size
  - Tree-shake electron modules
  - External heavy dependencies
  - Optimize assets

### Platform-Specific Fixes

- [ ] Windows fixes
  - High DPI scaling
  - Font rendering
  - File path length limits
- [ ] macOS fixes
  - Retina display support
  - Sandbox entitlements
  - Notarization issues
- [ ] Linux fixes
  - Various desktop environments
  - Icon themes
  - File manager integration

### Alpha Release Preparation

- [ ] Version bump to 3.0.0-alpha.1
- [ ] Generate release notes
- [ ] Build installers for all platforms
- [ ] Internal testing distribution
- [ ] Bug tracking setup

### Definition of Done

- [ ] All core features work on all platforms
- [ ] Startup time < 3 seconds
- [ ] Memory usage within targets
- [ ] Installers work correctly
- [ ] Alpha release distributed

---

## Sprint 7: Offline-First Architecture

**Goal:** Implement complete offline functionality

### Offline Detection

- [ ] Create network status monitor
  ```typescript
  // main/networkMonitor.ts
  import { net } from 'electron'

  export function isOnline(): boolean {
    return net.isOnline()
  }

  // Monitor changes
  net.on('online', () => notifyRenderer('network-status', true))
  net.on('offline', () => notifyRenderer('network-status', false))
  ```
- [ ] UI indicator for offline status
  - Status bar indicator
  - Toast notification on change
  - Feature availability feedback

### Local Data Storage

- [ ] Configure electron-store for settings
  ```typescript
  import Store from 'electron-store'

  const store = new Store({
    name: 'paperflow-settings',
    encryptionKey: 'your-encryption-key',
    schema: settingsSchema,
  })
  ```
- [ ] Implement local database
  - SQLite for structured data
  - IndexedDB for documents (renderer)
  - File system for large assets
- [ ] Data migration support
  - Version tracking
  - Migration scripts
  - Rollback capability

### Offline Document Storage

- [ ] Create document cache
  ```typescript
  interface CachedDocument {
    id: string
    filePath: string
    originalUrl?: string
    data: ArrayBuffer
    metadata: DocumentMetadata
    cachedAt: Date
    lastAccessed: Date
  }
  ```
- [ ] Implement sync queue
  - Queue changes when offline
  - Sync when online
  - Conflict resolution
- [ ] Manage cache size
  - LRU eviction policy
  - User-configurable limit
  - Clear cache option

### Offline Feature Parity

- [ ] Identify offline-capable features
  - File open/save (local)
  - All PDF operations
  - Annotations
  - Form filling
  - Signatures
  - Export (local)
- [ ] Mark online-only features
  - Cloud sync
  - AI features (optional)
  - Translation
  - Collaboration

### Background Sync

- [ ] Implement sync service
  ```typescript
  class SyncService {
    private queue: SyncOperation[] = []

    async queueOperation(op: SyncOperation): Promise<void>
    async processQueue(): Promise<void>
    async handleConflict(op: SyncOperation): Promise<Resolution>
  }
  ```
- [ ] Sync on reconnection
  - Check for pending operations
  - Process in order
  - Handle failures gracefully

### Definition of Done

- [ ] App works fully offline
- [ ] Network status displays correctly
- [ ] Sync queue persists across restarts
- [ ] Conflicts handled gracefully
- [ ] Cache management works

---

## Sprint 8: Local File Watching & Hot Reload

**Goal:** Implement file system watching and hot reload

### File Watcher

- [ ] Implement file watcher using chokidar
  ```typescript
  import chokidar from 'chokidar'

  class FileWatcher {
    private watcher: chokidar.FSWatcher | null = null

    watch(filePath: string, callback: WatchCallback): void {
      this.watcher = chokidar.watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100,
        },
      })

      this.watcher.on('change', (path) => callback('change', path))
      this.watcher.on('unlink', (path) => callback('delete', path))
    }

    unwatch(): void {
      this.watcher?.close()
    }
  }
  ```
- [ ] Handle file change events
  - Detect external modifications
  - Prompt user to reload
  - Auto-reload option
- [ ] Handle file deletion
  - Warn user
  - Offer to save copy
  - Update window title

### Hot Reload Workflow

- [ ] Detect when file changes
  - Compare file hash
  - Check modification time
  - Debounce rapid changes
- [ ] Prompt for action
  - Reload from disk
  - Keep current version
  - Merge changes (if possible)
- [ ] Preserve user state
  - Current page position
  - Zoom level
  - Selection state
  - Unsaved annotations

### Folder Watching

- [ ] Watch folder for new PDFs
  ```typescript
  function watchFolder(folderPath: string): void {
    const watcher = chokidar.watch(folderPath, {
      persistent: true,
      ignored: (path) => !path.endsWith('.pdf'),
      depth: 1,
    })

    watcher.on('add', (path) => notifyNewFile(path))
    watcher.on('change', (path) => notifyFileChanged(path))
  }
  ```
- [ ] Optional: Auto-open new files
- [ ] Show folder contents in sidebar

### External Editor Integration

- [ ] "Open in External Editor" option
  - Open with system default
  - Open with specific app
  - Track external changes
- [ ] "Reveal in Explorer/Finder"
  ```typescript
  shell.showItemInFolder(filePath)
  ```

### Definition of Done

- [ ] File changes detected reliably
- [ ] Reload prompt appears correctly
- [ ] User state preserved on reload
- [ ] Folder watching works
- [ ] External editor integration works

---

## Sprint 9: Batch Processing with Native Performance

**Goal:** Leverage native performance for batch operations

### Native Batch Engine

- [ ] Create batch processing infrastructure
  ```typescript
  interface BatchJob {
    id: string
    type: BatchOperationType
    files: string[]
    options: BatchOptions
    progress: BatchProgress
    status: JobStatus
    createdAt: Date
    completedAt?: Date
  }

  class BatchProcessor {
    async runJob(job: BatchJob): Promise<BatchResult>
    cancelJob(jobId: string): void
    getProgress(jobId: string): BatchProgress
  }
  ```
- [ ] Implement worker threads for CPU-intensive tasks
  ```typescript
  import { Worker, isMainThread, parentPort } from 'worker_threads'

  if (isMainThread) {
    const worker = new Worker(__filename, { workerData: job })
    worker.on('message', (progress) => updateProgress(progress))
    worker.on('error', handleError)
    worker.on('exit', handleComplete)
  } else {
    // Process batch in worker
    parentPort?.postMessage({ type: 'progress', percent: 50 })
  }
  ```

### Parallel Processing

- [ ] Implement parallel file processing
  - Process multiple files simultaneously
  - Limit concurrency based on CPU cores
  - Proper error isolation
- [ ] Memory-efficient large batches
  - Stream processing
  - Dispose completed items
  - Monitor memory usage

### Batch Operations

- [ ] Batch conversion
  - PDF to images (PNG, JPEG)
  - Images to PDF
  - Multiple format support
- [ ] Batch watermarking
  - Apply to multiple files
  - Progress reporting
  - Error handling
- [ ] Batch OCR
  - Process multiple documents
  - Save searchable PDFs
  - Language selection per batch
- [ ] Batch merge/split
  - Merge multiple PDFs
  - Split by page count
  - Split by file size

### Batch UI

- [ ] Create batch queue panel
  - Job list
  - Progress per job
  - Cancel/pause/resume
  - Clear completed
- [ ] Background processing
  - Process while minimized
  - Tray notification on complete
  - Summary notification

### Definition of Done

- [ ] Batch processing faster than web version
- [ ] Progress reporting accurate
- [ ] Memory usage controlled
- [ ] Error handling robust
- [ ] Background processing works

---

## Sprint 10: Native Print Integration

**Goal:** Implement native printing with full OS integration

### Native Print Dialog

- [ ] Implement native print dialog
  ```typescript
  // main/print.ts
  ipcMain.handle('print:showDialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: false,
          printBackground: true,
          deviceName: '',
        },
        (success, failureReason) => {
          resolve({ success, failureReason })
        }
      )
    })
  })
  ```
- [ ] Get available printers
  ```typescript
  ipcMain.handle('print:getPrinters', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.webContents.getPrintersAsync() ?? []
  })
  ```

### Print Options

- [ ] Implement print options
  - Page range selection
  - Copies count
  - Collation
  - Double-sided printing
  - Paper size selection
  - Orientation
  - Scale to fit
  - Print quality

### Silent Printing

- [ ] Enable silent/direct printing
  ```typescript
  win.webContents.print({
    silent: true,
    deviceName: printerName,
    pageRanges: [{ from: 1, to: 5 }],
    copies: 2,
    collate: true,
    duplexMode: 'longEdge',
  })
  ```
- [ ] Print to specific printer
- [ ] Default printer detection

### Print Preview

- [ ] Create native print preview
  - Accurate page rendering
  - Page navigation
  - Zoom controls
  - Option adjustments
- [ ] Handle annotations
  - Print with annotations
  - Print without annotations
  - Flatten before print

### PDF Printing

- [ ] Print to PDF (Save as PDF)
  ```typescript
  ipcMain.handle('print:toPDF', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const data = await win?.webContents.printToPDF({
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true,
      printSelectionOnly: false,
      landscape: false,
    })
    return data
  })
  ```

### Definition of Done

- [ ] Native print dialog works on all platforms
- [ ] All print options functional
- [ ] Silent printing works
- [ ] Print preview accurate
- [ ] Print to PDF works

---

## Sprint 11: Scanner Integration (TWAIN/WIA)

**Goal:** Implement scanner integration for document scanning

### Scanner Detection

- [ ] Implement scanner detection
  ```typescript
  // native/scanner.ts (Windows)
  import { WIAScanner } from '@aspect/node-wia'

  export async function getAvailableScanners(): Promise<Scanner[]> {
    const wia = new WIAScanner()
    return wia.getScanners()
  }
  ```
- [ ] Cross-platform scanner support
  - Windows: WIA (Windows Image Acquisition)
  - macOS: ImageCaptureCore
  - Linux: SANE
- [ ] Scanner status monitoring
  - Online/offline status
  - Paper present
  - Error states

### Scan Configuration

- [ ] Create scan settings interface
  ```typescript
  interface ScanSettings {
    scannerId: string
    colorMode: 'color' | 'grayscale' | 'blackwhite'
    resolution: number // DPI
    pageSize: 'letter' | 'a4' | 'legal' | 'auto'
    source: 'flatbed' | 'adf' | 'duplex'
    brightness: number
    contrast: number
    autoCrop: boolean
    deskew: boolean
  }
  ```
- [ ] Scan presets
  - Document (300 DPI, grayscale)
  - Photo (600 DPI, color)
  - OCR-ready (300 DPI, grayscale)
  - Archive (200 DPI, B&W)

### Scanning Workflow

- [ ] Implement scan acquisition
  - Single page scan
  - Multi-page scan (ADF)
  - Duplex scanning
  - Cancel mid-scan
- [ ] Post-scan processing
  - Auto-crop to content
  - Deskew (straighten)
  - Remove blank pages
  - Optimize for file size
- [ ] Create PDF from scans
  - Combine into single PDF
  - Each page as separate PDF
  - Add to existing PDF

### Scan UI

- [ ] Create scanner panel
  - Scanner selection
  - Settings adjustment
  - Preview area
  - Scan button
- [ ] Scan preview
  - Live preview before scan
  - Crop/rotate preview
  - Adjust settings preview
- [ ] Batch scan queue
  - Queue multiple scans
  - Progress indicator
  - Results list

### TWAIN Integration (Windows)

- [ ] Implement TWAIN driver support
  - Legacy scanner support
  - TWAIN data source selection
  - TWAIN capability negotiation

### Definition of Done

- [ ] Scanners detected on all platforms
- [ ] Basic scanning works
- [ ] Multi-page scanning works
- [ ] Post-scan processing works
- [ ] PDFs created from scans
- [ ] Works with common scanner brands

---

## Sprint 12: Hardware Security Key Support (FIDO2) & Q2 Release

**Goal:** Implement FIDO2/WebAuthn support and release Beta

**Milestone:** v3.5 Desktop Beta

### FIDO2 Infrastructure

- [ ] Implement FIDO2 support
  ```typescript
  // native/fido2.ts
  import { Fido2Client } from '@aspect/node-fido2'

  export class SecurityKeyManager {
    private client: Fido2Client

    async register(challenge: Buffer, userId: string): Promise<Credential>
    async authenticate(challenge: Buffer): Promise<Assertion>
    async listCredentials(): Promise<Credential[]>
    async deleteCredential(credentialId: string): Promise<void>
  }
  ```
- [ ] Support hardware security keys
  - YubiKey
  - Google Titan
  - Feitian
  - Generic FIDO2 keys

### Security Key Registration

- [ ] Create registration flow
  - Generate challenge
  - Prompt for key touch
  - Store credential
  - Backup recovery codes
- [ ] Multi-key support
  - Register multiple keys
  - Name/label keys
  - Remove keys

### Security Key Authentication

- [ ] Implement authentication
  - Challenge generation
  - Key presence verification
  - Signature verification
- [ ] Fallback options
  - Backup codes
  - Other registered keys
  - Account recovery

### Document Signing with Security Key

- [ ] Hardware-backed document signing
  - Sign PDF with security key
  - Verify signatures
  - Certificate management
- [ ] Signature verification
  - Display key info
  - Timestamp integration

### Q2 Release Preparation

- [ ] Integration testing
  - All Q2 features
  - Cross-platform testing
  - Performance benchmarks
- [ ] Beta release
  - Version 3.5.0-beta.1
  - Release notes
  - Known issues list
  - Beta feedback channel

### Definition of Done

- [ ] FIDO2 keys register correctly
- [ ] Authentication with key works
- [ ] Document signing with key works
- [ ] Beta release distributed
- [ ] Feedback collection active

---

## Sprint 13: Windows Installer (MSI, MSIX)

**Goal:** Create professional Windows installers

### NSIS Installer Enhancement

- [ ] Customize NSIS installer
  ```javascript
  // electron-builder.config.js
  {
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      installerIcon: 'resources/icons/installer.ico',
      uninstallerIcon: 'resources/icons/uninstaller.ico',
      installerSidebar: 'resources/installers/sidebar.bmp',
      license: 'LICENSE.txt',
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: 'PaperFlow',
    },
  }
  ```
- [ ] Add custom installer pages
  - License agreement
  - Installation options
  - File associations
  - Auto-start option

### MSI Installer

- [ ] Configure WiX-based MSI
  ```javascript
  {
    msi: {
      oneClick: false,
      perMachine: true,
      upgradeCode: 'YOUR-GUID-HERE',
    },
  }
  ```
- [ ] Enterprise deployment features
  - Per-machine installation
  - Silent installation
  - Custom properties
  - Upgrade handling

### MSIX Package

- [ ] Configure MSIX for Microsoft Store
  ```javascript
  {
    appx: {
      identityName: 'PaperFlowInc.PaperFlow',
      publisher: 'CN=PaperFlow Inc',
      publisherDisplayName: 'PaperFlow Inc',
      applicationId: 'PaperFlow',
    },
  }
  ```
- [ ] Windows Store preparation
  - Privacy policy
  - Screenshots
  - Store listing

### Installation Features

- [ ] Implement installer customization
  - Custom installation path
  - Desktop shortcut option
  - Start menu entry
  - File associations
  - Context menu integration
- [ ] Uninstaller features
  - Clean uninstallation
  - Optional data removal
  - User data backup prompt

### Silent Installation

- [ ] Document silent install options
  ```bash
  # NSIS silent install
  PaperFlow-Setup.exe /S /D=C:\Program Files\PaperFlow

  # MSI silent install
  msiexec /i PaperFlow.msi /qn INSTALLDIR="C:\Program Files\PaperFlow"
  ```
- [ ] Configuration file support
  - Pre-configured settings
  - License key injection
  - Custom defaults

### Definition of Done

- [ ] NSIS installer works correctly
- [ ] MSI installer for enterprise works
- [ ] MSIX package valid
- [ ] Silent installation works
- [ ] Clean uninstall works
- [ ] Upgrade from previous version works

---

## Sprint 14: macOS App Bundle & Notarization

**Goal:** Create signed and notarized macOS application

### App Bundle Configuration

- [ ] Configure macOS build
  ```javascript
  {
    mac: {
      category: 'public.app-category.productivity',
      icon: 'resources/icons/icon.icns',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'resources/entitlements.mac.plist',
      entitlementsInherit: 'resources/entitlements.mac.plist',
      target: [
        { target: 'dmg', arch: ['x64', 'arm64'] },
        { target: 'zip', arch: ['x64', 'arm64'] },
      ],
    },
  }
  ```
- [ ] Create entitlements file
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
  <plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
  </dict>
  </plist>
  ```

### Code Signing

- [ ] Set up Apple Developer account
- [ ] Configure code signing
  ```javascript
  {
    mac: {
      identity: 'Developer ID Application: PaperFlow Inc (TEAM_ID)',
      sign: true,
    },
  }
  ```
- [ ] Sign with hardened runtime
  - Required for notarization
  - Camera/microphone entitlements if needed

### Notarization

- [ ] Configure notarization
  ```javascript
  // notarize.js
  const { notarize } = require('@electron/notarize')

  exports.default = async function notarizing(context) {
    const { appOutDir } = context
    const appName = context.packager.appInfo.productFilename

    await notarize({
      tool: 'notarytool',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    })
  }
  ```
- [ ] Set up CI/CD for notarization
  - Store credentials securely
  - Automatic notarization on release

### DMG Customization

- [ ] Create custom DMG appearance
  ```javascript
  {
    dmg: {
      background: 'resources/installers/dmg-background.png',
      iconSize: 80,
      iconTextSize: 12,
      window: { width: 540, height: 380 },
      contents: [
        { x: 130, y: 220, type: 'file' },
        { x: 410, y: 220, type: 'link', path: '/Applications' },
      ],
    },
  }
  ```

### Universal Binary

- [ ] Build universal binary (Intel + Apple Silicon)
  ```javascript
  {
    mac: {
      target: [
        { target: 'dmg', arch: 'universal' },
      ],
    },
  }
  ```
- [ ] Test on both architectures
- [ ] Performance verification

### Definition of Done

- [ ] App signed with Developer ID
- [ ] Notarization successful
- [ ] DMG installer works
- [ ] Universal binary works
- [ ] Gatekeeper passes app
- [ ] Runs on macOS 12+

---

## Sprint 15: Linux Packages (AppImage, deb, rpm, snap)

**Goal:** Create Linux distribution packages

### AppImage

- [ ] Configure AppImage build
  ```javascript
  {
    linux: {
      target: ['AppImage'],
      category: 'Office',
      icon: 'resources/icons',
      desktop: {
        Name: 'PaperFlow',
        Comment: 'PDF Editor',
        Categories: 'Office;Viewer;',
        MimeType: 'application/pdf;',
      },
    },
    appImage: {
      license: 'LICENSE.txt',
    },
  }
  ```
- [ ] AppImage integration
  - Desktop integration prompt
  - Auto-update support
  - Portable mode option

### Debian Package

- [ ] Configure deb package
  ```javascript
  {
    deb: {
      depends: [
        'libgtk-3-0',
        'libnotify4',
        'libnss3',
        'libxss1',
        'libxtst6',
        'xdg-utils',
        'libatspi2.0-0',
        'libuuid1',
      ],
      recommends: ['libappindicator3-1'],
      category: 'editors',
      priority: 'optional',
    },
  }
  ```
- [ ] Debian repository setup (optional)
  - APT repository
  - GPG signing
  - Auto-update via apt

### RPM Package

- [ ] Configure rpm package
  ```javascript
  {
    rpm: {
      depends: [
        'gtk3',
        'libnotify',
        'nss',
        'libXScrnSaver',
        'libXtst',
        'xdg-utils',
        'at-spi2-core',
        'libuuid',
      ],
      fpm: ['--rpm-rpmbuild-define', '_build_id_links none'],
    },
  }
  ```
- [ ] Support Fedora, RHEL, openSUSE

### Snap Package

- [ ] Configure snap build
  ```yaml
  # snap/snapcraft.yaml
  name: paperflow
  version: '3.0.0'
  summary: PDF Editor
  description: |
    PaperFlow is a modern PDF editor...
  grade: stable
  confinement: strict

  apps:
    paperflow:
      command: paperflow
      desktop: paperflow.desktop
      plugs:
        - desktop
        - desktop-legacy
        - home
        - network
        - cups-control
        - removable-media
  ```
- [ ] Snap store submission
  - Store listing
  - Track setup (stable, edge)
  - Auto-update via snapd

### Flatpak (Optional)

- [ ] Configure Flatpak manifest
  ```yaml
  id: com.paperflow.PaperFlow
  runtime: org.freedesktop.Platform
  runtime-version: '23.08'
  sdk: org.freedesktop.Sdk
  command: paperflow
  finish-args:
    - --share=ipc
    - --socket=x11
    - --socket=wayland
    - --filesystem=home
    - --device=dri
  ```

### Definition of Done

- [ ] AppImage runs on major distros
- [ ] deb installs on Debian/Ubuntu
- [ ] rpm installs on Fedora/RHEL
- [ ] Snap installs from store
- [ ] File associations work
- [ ] Desktop integration works

---

## Sprint 16: Platform-Specific UI Adaptations

**Goal:** Adapt UI for each platform's conventions

### Windows UI Adaptations

- [ ] Windows 11 design language
  - Mica/Acrylic backgrounds (optional)
  - Rounded corners
  - Fluent icons
- [ ] Windows-specific controls
  - Native scroll bars
  - Context menu styling
  - Tooltip styling
- [ ] Windows accessibility
  - High contrast mode
  - Narrator support
  - Keyboard navigation

### macOS UI Adaptations

- [ ] macOS design patterns
  - Native title bar with traffic lights
  - Toolbar styling
  - Sidebar appearance
- [ ] macOS-specific features
  - Vibrancy effects
  - Native scroll bars
  - Elastic scrolling
- [ ] macOS menu bar
  - Full menu bar integration
  - Status menu item (optional)

### Linux UI Adaptations

- [ ] GTK theme integration
  - Follow system theme
  - Dark mode detection
  - Accent colors
- [ ] Desktop environment support
  - GNOME integration
  - KDE integration
  - Cinnamon/XFCE compatibility
- [ ] Wayland support
  - Native Wayland rendering
  - XWayland fallback

### Responsive Desktop UI

- [ ] Window size adaptations
  - Small window layout
  - Medium window layout
  - Large window layout
- [ ] Panel docking
  - Detachable panels
  - Snap to edges
  - Remember layout
- [ ] Multi-monitor support
  - Open on last monitor
  - Window positioning
  - DPI per monitor

### Accessibility

- [ ] Screen reader support
  - ARIA labels
  - Keyboard navigation
  - Focus management
- [ ] High contrast mode
  - Detect system setting
  - Apply appropriate theme
- [ ] Reduced motion
  - Disable animations
  - Simple transitions

### Definition of Done

- [ ] UI follows platform conventions
- [ ] Theme integration works
- [ ] Accessibility requirements met
- [ ] Multi-monitor works correctly
- [ ] Responsive layouts work

---

## Sprint 17: macOS Touch Bar & Windows Taskbar

**Goal:** Implement platform-specific enhanced controls

### macOS Touch Bar

- [ ] Implement Touch Bar support
  ```typescript
  // main/touchbar.ts
  import { TouchBar, BrowserWindow } from 'electron'

  const { TouchBarButton, TouchBarSlider, TouchBarSegmentedControl } = TouchBar

  export function createTouchBar(win: BrowserWindow): TouchBar {
    const zoomSlider = new TouchBarSlider({
      label: 'Zoom',
      value: 100,
      minValue: 10,
      maxValue: 400,
      change: (value) => win.webContents.send('zoom-change', value),
    })

    const pageControls = new TouchBarSegmentedControl({
      segments: [
        { label: '◀' },
        { label: '▶' },
      ],
      change: (index) => {
        win.webContents.send(index === 0 ? 'prev-page' : 'next-page')
      },
    })

    const toolButtons = new TouchBarSegmentedControl({
      segments: [
        { icon: 'path/to/select.png' },
        { icon: 'path/to/highlight.png' },
        { icon: 'path/to/draw.png' },
        { icon: 'path/to/text.png' },
      ],
      change: (index) => win.webContents.send('tool-select', index),
    })

    return new TouchBar({
      items: [pageControls, zoomSlider, toolButtons],
    })
  }
  ```
- [ ] Context-sensitive Touch Bar
  - Default: navigation and zoom
  - Annotation mode: tool selection
  - Form mode: field navigation
  - Signature mode: signature tools

### Windows Taskbar Integration

- [ ] Implement taskbar progress
  ```typescript
  // Show progress during operations
  win.setProgressBar(0.5) // 50%
  win.setProgressBar(-1)  // Indeterminate
  win.setProgressBar(0)   // Remove
  ```
- [ ] Taskbar overlay icons
  ```typescript
  // Show status overlay
  win.setOverlayIcon(
    nativeImage.createFromPath('path/to/icon.png'),
    'Processing'
  )
  ```
- [ ] Thumbnail toolbar buttons
  ```typescript
  win.setThumbarButtons([
    {
      tooltip: 'Previous Page',
      icon: nativeImage.createFromPath('path/to/prev.png'),
      click: () => win.webContents.send('prev-page'),
    },
    {
      tooltip: 'Next Page',
      icon: nativeImage.createFromPath('path/to/next.png'),
      click: () => win.webContents.send('next-page'),
    },
  ])
  ```

### Windows Jump List Enhancement

- [ ] Dynamic Jump List
  - Recent documents
  - Pinned documents
  - Quick actions
- [ ] Custom categories
  - Recent
  - Frequent
  - Tasks

### macOS Dock Integration

- [ ] Dock badge for notifications
  ```typescript
  app.dock.setBadge('3') // Show count
  app.dock.setBadge('')  // Clear
  ```
- [ ] Dock progress
  - Show processing progress
  - Bounce on complete

### Definition of Done

- [ ] Touch Bar controls work
- [ ] Context-sensitive Touch Bar
- [ ] Taskbar progress works
- [ ] Thumbnail buttons work
- [ ] Jump List updates dynamically
- [ ] Dock integration works

---

## Sprint 18: Q3 Polish & Desktop Release

**Goal:** Polish and release desktop version

**Milestone:** v4.0 Desktop Release

### Cross-Platform Testing

- [ ] Test all platforms thoroughly
  - Windows 10, Windows 11
  - macOS 12, 13, 14
  - Ubuntu 22.04, 24.04
  - Fedora 38, 39
- [ ] Verify all installers
  - Installation
  - Upgrade
  - Uninstallation
- [ ] Performance benchmarks
  - Startup time
  - Memory usage
  - PDF operations

### Bug Fixes

- [ ] Address platform-specific bugs
- [ ] Fix installer issues
- [ ] Resolve UI inconsistencies
- [ ] Handle edge cases

### Documentation

- [ ] User documentation
  - Desktop-specific features
  - Platform differences
  - Troubleshooting guide
- [ ] Admin documentation
  - Silent installation
  - Configuration options
  - Deployment guides

### Release Preparation

- [ ] Version bump to 4.0.0
- [ ] Generate release notes
- [ ] Create announcement materials
- [ ] Prepare download page
- [ ] Set up update channels

### Release

- [ ] Build final installers
- [ ] Code signing and notarization
- [ ] Upload to distribution points
- [ ] Enable auto-update
- [ ] Monitor telemetry

### Definition of Done

- [ ] All platforms tested
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] v4.0 released
- [ ] Auto-update working

---

## Sprint 19: MDM/GPO Deployment Support

**Goal:** Enable enterprise deployment through MDM and GPO

### Windows Group Policy

- [ ] Create ADMX/ADML templates
  ```xml
  <!-- PaperFlow.admx -->
  <policyDefinitions>
    <policies>
      <policy name="DisableAutoUpdate"
              class="Machine"
              displayName="Disable Auto Update"
              key="Software\Policies\PaperFlow">
        <enabledValue>
          <decimal value="1"/>
        </enabledValue>
        <disabledValue>
          <decimal value="0"/>
        </disabledValue>
      </policy>
      <!-- More policies -->
    </policies>
  </policyDefinitions>
  ```
- [ ] Configurable policies
  - Update settings
  - Feature toggles
  - Default preferences
  - Network settings
  - Security policies
- [ ] Registry-based configuration
  - HKLM for machine policies
  - HKCU for user preferences

### macOS MDM Profiles

- [ ] Create configuration profiles
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
  <plist version="1.0">
  <dict>
    <key>PayloadContent</key>
    <array>
      <dict>
        <key>PayloadType</key>
        <string>com.paperflow.app</string>
        <key>DisableAutoUpdate</key>
        <true/>
        <!-- More settings -->
      </dict>
    </array>
  </dict>
  </plist>
  ```
- [ ] Support MDM solutions
  - Jamf Pro
  - Microsoft Intune
  - VMware Workspace ONE
  - Kandji

### Linux Configuration Management

- [ ] Create configuration file support
  ```json
  // /etc/paperflow/config.json
  {
    "updatePolicy": "disabled",
    "defaultSettings": {
      "theme": "system",
      "autoSave": true
    }
  }
  ```
- [ ] Support configuration tools
  - Ansible playbooks
  - Puppet modules
  - Chef recipes

### Managed App Features

- [ ] Implement policy reader
  ```typescript
  class PolicyManager {
    readWindowsPolicy(key: string): any
    readMacOSProfile(key: string): any
    readLinuxConfig(key: string): any

    getPolicy(key: string): any {
      switch (process.platform) {
        case 'win32': return this.readWindowsPolicy(key)
        case 'darwin': return this.readMacOSProfile(key)
        default: return this.readLinuxConfig(key)
      }
    }
  }
  ```
- [ ] Apply policies at startup
- [ ] Lock down managed settings
- [ ] Show managed indicator in UI

### Definition of Done

- [ ] GPO templates work
- [ ] MDM profiles work
- [ ] Linux config files work
- [ ] Policies apply correctly
- [ ] Managed settings locked
- [ ] Admin documentation complete

---

## Sprint 20: Centralized Configuration

**Goal:** Implement centralized configuration management

### Configuration Server

- [ ] Design configuration API
  ```typescript
  interface ConfigurationResponse {
    version: string
    policies: Policy[]
    features: FeatureFlags
    updates: UpdatePolicy
    branding: BrandingConfig
  }

  // GET /api/config?org={orgId}&device={deviceId}
  ```
- [ ] Implement configuration client
  ```typescript
  class ConfigClient {
    private baseUrl: string

    async fetchConfig(): Promise<ConfigurationResponse>
    async reportStatus(status: DeviceStatus): Promise<void>
  }
  ```

### Configuration Sync

- [ ] Periodic configuration sync
  - On app start
  - Every 4 hours
  - On network reconnect
- [ ] Offline configuration cache
  - Store last known config
  - Apply cached config when offline
  - Validate config age

### Feature Flags

- [ ] Implement feature flag system
  ```typescript
  interface FeatureFlags {
    aiFeatures: boolean
    collaboration: boolean
    scanning: boolean
    batchProcessing: boolean
    customization: boolean
  }

  function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
    const config = configStore.get('features')
    return config?.[flag] ?? defaultFlags[flag]
  }
  ```
- [ ] UI adaptation based on flags
  - Hide disabled features
  - Show upgrade prompts
  - Graceful degradation

### Remote Disable

- [ ] Implement remote disable capability
  - Disable specific features
  - Show custom message
  - Force update option
- [ ] Security kill switch
  - Disable compromised versions
  - Force update for security

### Configuration UI

- [ ] Admin configuration dashboard
  - Organization settings
  - Device groups
  - Policy assignment
  - Feature toggles
- [ ] Device inventory
  - Registered devices
  - Version distribution
  - Compliance status

### Definition of Done

- [ ] Configuration sync works
- [ ] Feature flags apply correctly
- [ ] Remote disable works
- [ ] Offline caching works
- [ ] Admin dashboard functional

---

## Sprint 21: Offline License Validation

**Goal:** Implement offline-capable license system

### License System Architecture

- [ ] Design license format
  ```typescript
  interface License {
    id: string
    type: 'trial' | 'personal' | 'professional' | 'enterprise'
    seats: number
    expiresAt: Date
    features: string[]
    signature: string

    // Offline validation
    offlineValidDays: number
    machineId?: string
  }
  ```
- [ ] Implement license signing
  - RSA signature
  - Public key in app
  - Private key on server

### License Validation

- [ ] Online validation
  ```typescript
  async function validateOnline(licenseKey: string): Promise<ValidationResult> {
    const response = await fetch('/api/license/validate', {
      method: 'POST',
      body: JSON.stringify({ key: licenseKey, machineId: getMachineId() }),
    })
    return response.json()
  }
  ```
- [ ] Offline validation
  ```typescript
  function validateOffline(license: License): ValidationResult {
    // Verify signature
    const isValid = verifySignature(license, publicKey)

    // Check expiration
    const isExpired = new Date() > new Date(license.expiresAt)

    // Check offline validity period
    const lastOnlineCheck = store.get('lastOnlineCheck')
    const offlineExpired = daysSince(lastOnlineCheck) > license.offlineValidDays

    return { isValid, isExpired, offlineExpired }
  }
  ```

### Machine Binding

- [ ] Generate machine ID
  ```typescript
  import { machineIdSync } from 'node-machine-id'

  function getMachineId(): string {
    return machineIdSync({ original: true })
  }
  ```
- [ ] License activation
  - Bind to machine on first use
  - Deactivation for transfer
  - Seat management

### Grace Periods

- [ ] Implement grace periods
  - Network issues: 7 days
  - Expired license: 7 days (reduced features)
  - Invalid license: immediate
- [ ] User notifications
  - Approaching expiration
  - Offline mode warnings
  - Grace period countdown

### License UI

- [ ] License management panel
  - Current license status
  - Activation/deactivation
  - Renewal options
  - Usage statistics
- [ ] License entry dialog
  - Enter license key
  - Validation feedback
  - Troubleshooting help

### Definition of Done

- [ ] Online validation works
- [ ] Offline validation works
- [ ] Machine binding works
- [ ] Grace periods function
- [ ] License UI complete
- [ ] Deactivation works

---

## Sprint 22: Local Network Collaboration (LAN Sync)

**Goal:** Enable collaboration over local network without internet

### LAN Discovery

- [ ] Implement mDNS/Bonjour discovery
  ```typescript
  import { Bonjour } from 'bonjour-service'

  const bonjour = new Bonjour()

  // Publish service
  bonjour.publish({
    name: 'PaperFlow-' + machineId,
    type: 'paperflow',
    port: 8765,
    txt: { version: appVersion },
  })

  // Discover peers
  bonjour.find({ type: 'paperflow' }, (service) => {
    console.log('Found peer:', service.name, service.addresses)
  })
  ```
- [ ] Peer discovery UI
  - Available peers list
  - Connection status
  - Peer information

### LAN Sync Protocol

- [ ] Design sync protocol
  ```typescript
  interface SyncMessage {
    type: 'offer' | 'accept' | 'sync' | 'change' | 'conflict'
    documentId: string
    version: number
    data?: ArrayBuffer
    changes?: Change[]
  }
  ```
- [ ] Implement sync server
  ```typescript
  import { createServer } from 'net'

  const server = createServer((socket) => {
    socket.on('data', handleSyncMessage)
  })

  server.listen(8765)
  ```

### Document Sharing

- [ ] Share document over LAN
  - Select document
  - Choose peers
  - Send invitation
- [ ] Accept shared document
  - Receive invitation
  - Preview document info
  - Accept/decline

### Real-time Sync

- [ ] Implement CRDT for LAN sync
  - Same as cloud collaboration
  - Direct peer connection
  - Conflict resolution
- [ ] Cursor and presence
  - Show peer cursors
  - Show who's editing what
  - Activity indicators

### Security

- [ ] LAN security measures
  - Optional password protection
  - Peer verification
  - Encrypted communication
- [ ] Access control
  - Read-only sharing
  - Full access sharing
  - Revoke access

### Definition of Done

- [ ] Peer discovery works
- [ ] Document sharing works
- [ ] Real-time sync works
- [ ] Conflict resolution works
- [ ] Security measures in place
- [ ] Works without internet

---

## Sprint 23: On-Premise Update Server

**Goal:** Enable self-hosted update infrastructure

### Update Server

- [ ] Create update server package
  ```typescript
  // update-server/index.ts
  import express from 'express'
  import { createUpdateRouter } from './router'

  const app = express()
  app.use('/updates', createUpdateRouter({
    releasesDir: './releases',
    autoScan: true,
  }))

  app.listen(8080)
  ```
- [ ] Update server features
  - Serve update files
  - Version management
  - Platform-specific routes
  - Delta updates

### Release Management

- [ ] Release upload interface
  - Upload new versions
  - Set release channel
  - Write release notes
  - Schedule release
- [ ] Version control
  - Enable/disable versions
  - Set minimum version
  - Rollback capability

### Client Configuration

- [ ] Configure custom update URL
  ```typescript
  // Via environment variable
  process.env.UPDATE_SERVER_URL = 'https://updates.company.com'

  // Via configuration
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://updates.company.com/updates',
  })
  ```
- [ ] Fallback handling
  - Try primary server
  - Fall back to secondary
  - Report failures

### Update Policies

- [ ] Configurable update policies
  - Auto-check enabled/disabled
  - Auto-download enabled/disabled
  - Mandatory updates
  - Update schedule (maintenance windows)
- [ ] Staged rollouts
  - Percentage-based rollout
  - Device group targeting
  - Rollback triggers

### Monitoring

- [ ] Update metrics
  - Download counts
  - Success/failure rates
  - Version distribution
  - Rollback frequency
- [ ] Alerts
  - Failed updates
  - Server issues
  - Version adoption

### Definition of Done

- [ ] Update server deployable
- [ ] Client connects to custom server
- [ ] Release management works
- [ ] Staged rollouts work
- [ ] Monitoring in place
- [ ] Documentation complete

---

## Sprint 24: Kiosk Mode & Q4 Enterprise Release

**Goal:** Implement kiosk mode and release enterprise version

**Milestone:** v4.5 Enterprise Desktop

### Kiosk Mode

- [ ] Implement kiosk mode
  ```typescript
  function enableKioskMode(options: KioskOptions): void {
    const win = new BrowserWindow({
      kiosk: true,
      fullscreen: true,
      alwaysOnTop: true,
      closable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      frame: false,
      webPreferences: {
        devTools: false,
      },
    })

    // Disable keyboard shortcuts
    globalShortcut.register('CommandOrControl+Q', () => {})
    globalShortcut.register('Alt+F4', () => {})
    globalShortcut.register('CommandOrControl+W', () => {})
  }
  ```
- [ ] Kiosk features
  - Full-screen locked mode
  - Disabled keyboard shortcuts
  - Auto-restart on crash
  - Inactivity timeout

### Kiosk Configuration

- [ ] Configure allowed features
  - View documents
  - Fill forms
  - Print (optional)
  - Save (optional)
- [ ] Session management
  - Clear data between sessions
  - Timeout reset
  - Session logging

### Kiosk Administration

- [ ] Remote kiosk management
  - Deploy configuration
  - Monitor status
  - Remote restart
  - Push content
- [ ] Exit kiosk mode
  - Admin password
  - Remote unlock
  - Physical button (optional)

### Multi-User Workstation

- [ ] User switching
  - Quick user switch
  - Profile isolation
  - Data separation
- [ ] Shared workstation policies
  - Clear cache on logout
  - Profile restrictions
  - Usage quotas

### Enterprise Release

- [ ] Final testing
  - All enterprise features
  - MDM integration
  - LAN sync
  - Kiosk mode
- [ ] Security audit
  - Penetration testing
  - Code review
  - Compliance verification
- [ ] Documentation
  - Enterprise admin guide
  - Deployment guide
  - Security whitepaper

### Release

- [ ] Version 4.5.0
- [ ] Release notes
- [ ] Enterprise distribution
- [ ] Support handoff

### Definition of Done

- [ ] Kiosk mode works
- [ ] Remote management works
- [ ] All enterprise features tested
- [ ] Security audit passed
- [ ] v4.5 released
- [ ] Documentation complete

---

## Appendix: Technical Reference

### Keyboard Shortcuts (Desktop-Specific)

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Preferences | Ctrl+, | Cmd+, |
| Quit | Alt+F4 | Cmd+Q |
| Minimize | Ctrl+M | Cmd+M |
| Full Screen | F11 | Ctrl+Cmd+F |
| Close Window | Ctrl+W | Cmd+W |
| New Window | Ctrl+N | Cmd+N |
| Toggle Dev Tools | Ctrl+Shift+I | Cmd+Option+I |

### File Structure Additions

```
electron/
├── main/
│   ├── index.ts
│   ├── windowManager.ts
│   ├── ipcHandlers.ts
│   ├── menu.ts
│   ├── tray.ts
│   ├── updater.ts
│   ├── protocol.ts
│   └── print.ts
├── preload/
│   ├── index.ts
│   └── api.ts
├── native/
│   ├── fileSystem.ts
│   ├── scanner.ts
│   ├── fido2.ts
│   └── platform.ts
├── resources/
│   ├── icons/
│   ├── installers/
│   └── entitlements/
└── config/
    ├── electron-builder.config.js
    └── notarize.js

src/
├── desktop/
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── NativeMenu.tsx
│   │   └── TouchBarController.tsx
│   ├── hooks/
│   │   ├── useNativeFile.ts
│   │   ├── useAutoUpdater.ts
│   │   └── useOfflineStatus.ts
│   └── stores/
│       ├── desktopStore.ts
│       └── updateStore.ts
└── platform/
    ├── fileSystem.ts
    ├── printing.ts
    ├── notifications.ts
    └── updates.ts
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Cold Start | < 3 seconds |
| Warm Start | < 1 second |
| Memory (Idle) | < 150 MB |
| Memory (100-page PDF) | < 500 MB |
| File Save | < 500ms |
| Auto-Update Download | > 5 MB/s |
| Batch Process (100 pages) | < 30 seconds |

### Platform Support Matrix

| Platform | Minimum Version | Architecture |
|----------|-----------------|--------------|
| Windows | Windows 10 1903 | x64, arm64 |
| macOS | macOS 12 (Monterey) | x64, arm64 (Universal) |
| Ubuntu | 20.04 LTS | x64 |
| Fedora | 37 | x64 |
| Debian | 11 | x64 |

### Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^28.0.0 | Desktop runtime |
| electron-builder | ^24.0.0 | App packaging |
| electron-updater | ^6.0.0 | Auto-updates |
| electron-store | ^8.0.0 | Settings storage |
| electron-log | ^5.0.0 | Logging |
| chokidar | ^3.5.0 | File watching |
| auto-launch | ^5.0.0 | Startup integration |
| node-notifier | ^10.0.0 | Notifications |

### Build Targets Summary

```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.paperflow.app',
  productName: 'PaperFlow',

  win: {
    target: ['nsis', 'msi', 'appx'],
  },

  mac: {
    target: [
      { target: 'dmg', arch: 'universal' },
      { target: 'pkg', arch: 'universal' },
    ],
    hardenedRuntime: true,
    notarize: true,
  },

  linux: {
    target: ['AppImage', 'deb', 'rpm', 'snap'],
  },
}
```

### Success Metrics

| Metric | Phase 3 Target |
|--------|----------------|
| Desktop Downloads | 100,000 |
| Daily Active Users | 25,000 |
| Enterprise Deployments | 50 |
| Kiosk Installations | 200 |
| Auto-Update Success | > 99% |
| Crash-Free Rate | > 99.5% |
