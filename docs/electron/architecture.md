# PaperFlow Electron Architecture

This document describes the architecture of the PaperFlow desktop application built with Electron.

## Overview

PaperFlow uses a standard Electron architecture with strict security settings:

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │    Main Process     │    │      Renderer Process       │ │
│  │                     │    │                             │ │
│  │  - Window Manager   │◄──►│  - React Application        │ │
│  │  - IPC Handlers     │    │  - PDF.js Rendering         │ │
│  │  - File System      │    │  - pdf-lib Editing          │ │
│  │  - Native Dialogs   │    │  - Zustand State            │ │
│  │  - App Lifecycle    │    │                             │ │
│  │                     │    │                             │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│            ▲                            ▲                    │
│            │        Preload Script      │                    │
│            └────────────────────────────┘                    │
│                   (contextBridge)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Process Architecture

### Main Process

The main process runs in Node.js and has full access to system APIs. Located in `electron/main/`.

**Key responsibilities:**
- Window creation and management
- Application lifecycle (startup, shutdown, single instance)
- Native OS integration (file dialogs, notifications, menus)
- IPC handler registration

**Key files:**
- `index.ts` - Entry point, app initialization
- `windowManager.ts` - BrowserWindow management
- `windowState.ts` - Window state persistence
- `lifecycle.ts` - App lifecycle handling
- `security.ts` - CSP and security configuration

### Preload Script

The preload script bridges the main and renderer processes securely. Located in `electron/preload/`.

**Key responsibilities:**
- Expose safe APIs via `contextBridge`
- Create typed IPC wrappers
- Filter which Node.js APIs are accessible

**Security model:**
- Context isolation is enabled
- Node integration is disabled
- Sandbox is enabled
- Only explicitly exposed APIs are available

### Renderer Process

The renderer process runs the React web application. It has the same code as the web version but with additional Electron-specific features available through the preload script.

**Key responsibilities:**
- React UI rendering
- PDF viewing and editing
- State management with Zustand
- Platform-aware feature detection

## Directory Structure

```
electron/
├── main/               # Main process code
│   ├── index.ts        # Entry point
│   ├── windowManager.ts
│   ├── windowState.ts
│   ├── lifecycle.ts
│   └── security.ts
├── preload/            # Preload scripts
│   └── index.ts
├── ipc/                # IPC definitions
│   ├── channels.ts     # Channel constants
│   ├── types.ts        # TypeScript types
│   └── handlers.ts     # Main process handlers
└── tsconfig.json       # TypeScript config for Electron

src/lib/electron/       # Renderer-side Electron utilities
├── platform.ts         # Platform detection
├── ipc.ts              # IPC wrapper functions
└── index.ts            # Module exports

src/hooks/
└── usePlatform.ts      # React hook for platform features
```

## Security Configuration

### Context Isolation

Context isolation ensures the renderer process cannot directly access Node.js APIs:

```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // Required
    nodeIntegration: false,   // Required
    sandbox: true,            // Recommended
    preload: preloadPath,
  },
});
```

### Content Security Policy

The CSP is configured differently for development and production:

**Production CSP:**
- Scripts only from 'self' and blob: (for PDF.js worker)
- No inline scripts allowed
- No eval allowed
- Strict source restrictions

**Development CSP:**
- Allows localhost for hot module replacement
- Allows unsafe-inline and unsafe-eval for Vite
- Allows WebSocket connections for HMR

### Permission Handling

The app explicitly handles permission requests:
- Allowed: clipboard, fullscreen, pointer lock
- Denied: camera, microphone, geolocation, notifications (uses native)

## Window Management

### State Persistence

Window state (position, size, maximized) is persisted to disk:

```typescript
// State stored in: userData/window-state.json
interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
}
```

### Bounds Validation

Before restoring window position, bounds are validated:
1. Check if position is on an available display
2. Ensure window fits within display work area
3. Center on primary display if invalid

### Multi-Window Support

The WindowManager supports multiple windows for different documents:
- Each window has a unique ID
- Main window reference tracks the focused window
- State is saved per window ID

## Build Configuration

### Development

```bash
npm run electron:dev
```

This starts:
1. Vite dev server (hot reload for renderer)
2. Watches electron/ for main process changes
3. Auto-restarts Electron on main process changes

### Production Build

```bash
npm run electron:build
```

Creates distributable packages:
- Windows: NSIS installer, portable
- macOS: DMG, ZIP
- Linux: AppImage, deb, rpm

Configuration in `electron-builder.yml`.
