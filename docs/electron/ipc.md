# IPC Communication Guide

This document describes the Inter-Process Communication (IPC) patterns used in PaperFlow's Electron implementation.

## Overview

Electron uses IPC to communicate between the main process (Node.js) and renderer processes (Chromium). PaperFlow implements a secure, type-safe IPC layer.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Renderer Process  │         │    Main Process     │
│                     │         │                     │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │ React App     │  │         │  │ IPC Handlers  │  │
│  │               │  │         │  │               │  │
│  │ window.       │◄─┼─────────┼─►│ ipcMain.      │  │
│  │ electron.xxx()│  │         │  │ handle()      │  │
│  └───────────────┘  │         │  └───────────────┘  │
│         ▲           │         │                     │
│         │           │         │                     │
│  ┌──────┴────────┐  │         │                     │
│  │ Preload Script│  │         │                     │
│  │ contextBridge │  │         │                     │
│  └───────────────┘  │         │                     │
└─────────────────────┘         └─────────────────────┘
```

## Channel Definitions

All IPC channels are defined in `electron/ipc/channels.ts`:

```typescript
// Invoke channels (renderer -> main, with response)
export const IPC_CHANNELS = {
  GET_PLATFORM_INFO: 'get-platform-info',
  FILE_OPEN: 'file-open',
  FILE_SAVE: 'file-save',
  // ... more channels
};

// Event channels (main -> renderer, one-way)
export const IPC_EVENTS = {
  FILE_OPENED: 'file-opened',
  MENU_FILE_SAVE: 'menu-file-save',
  // ... more events
};
```

## Type Definitions

Types are defined in `electron/ipc/types.ts`:

```typescript
// Request/response types
export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface FileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

// API interface exposed to renderer
export interface ElectronAPI {
  openFile: () => Promise<FileDialogResult>;
  // ... more methods
}
```

## Main Process Handlers

Handlers are registered in `electron/ipc/handlers.ts`:

```typescript
import { ipcMain, dialog } from 'electron';
import { IPC_CHANNELS } from './channels';

export function setupIpcHandlers(ipcMain: IpcMain) {
  // Handle file open dialog
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE,
    async (event, options?: FileDialogOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return { canceled: true, filePaths: [] };

      const result = await dialog.showOpenDialog(window, {
        title: options?.title || 'Open PDF',
        filters: options?.filters || [
          { name: 'PDF Files', extensions: ['pdf'] }
        ],
        properties: ['openFile'],
      });

      return {
        canceled: result.canceled,
        filePaths: result.filePaths,
      };
    }
  );
}
```

## Preload Script

The preload script exposes a safe API via `contextBridge`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, IPC_EVENTS } from './channels';

// Type-safe invoke wrapper
function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args);
}

// Event listener with cleanup
function createListener(channel: string, callback: Function): () => void {
  const listener = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// Expose API
contextBridge.exposeInMainWorld('electron', {
  openFile: () => invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),
  onFileSave: (cb) => createListener(IPC_EVENTS.MENU_FILE_SAVE, cb),
});
```

## Renderer Usage

### Direct API Access

```typescript
// Check if Electron is available
if (window.electron) {
  const result = await window.electron.openFile();
  if (!result.canceled) {
    console.log('Selected:', result.filePaths[0]);
  }
}
```

### Using Wrapper Functions

The recommended approach is using the wrapper functions in `src/lib/electron/ipc.ts`:

```typescript
import { fileOperations } from '@lib/electron/ipc';

// Automatically handles browser fallback
const filePaths = await fileOperations.openFile();
if (filePaths) {
  // User selected files
}
```

### Using React Hooks

```typescript
import { usePlatform, useElectronMenuEvents } from '@hooks/usePlatform';

function EditorComponent() {
  const { isElectron, hasFeature } = usePlatform();

  // Subscribe to menu events
  useElectronMenuEvents({
    onFileSave: () => saveDocument(),
    onEditUndo: () => historyStore.undo(),
  });

  return (
    <div>
      {hasFeature('native-file-dialogs') && <OpenButton />}
    </div>
  );
}
```

## Available IPC Channels

### File Operations

| Channel | Description | Arguments | Returns |
|---------|-------------|-----------|---------|
| `dialog-open-file` | Show open file dialog | `FileDialogOptions?` | `FileDialogResult` |
| `dialog-save-file` | Show save file dialog | `SaveDialogOptions?` | `SaveDialogResult` |
| `file-read` | Read file contents | `filePath, options?` | `FileReadResult` |
| `file-save` | Write file contents | `filePath, data` | `FileWriteResult` |
| `file-exists` | Check if file exists | `filePath` | `boolean` |
| `file-get-recent` | Get recent files list | - | `RecentFile[]` |
| `file-add-recent` | Add to recent files | `filePath` | `void` |
| `file-clear-recent` | Clear recent files | - | `void` |

### Window Operations

| Channel | Description | Arguments | Returns |
|---------|-------------|-----------|---------|
| `window-minimize` | Minimize window | - | `void` |
| `window-maximize` | Toggle maximize | - | `void` |
| `window-close` | Close window | - | `void` |
| `window-is-maximized` | Check maximized state | - | `boolean` |
| `window-set-title` | Set window title | `title` | `void` |
| `window-get-bounds` | Get window bounds | - | `WindowBounds` |
| `window-set-bounds` | Set window bounds | `bounds` | `void` |

### Shell Operations

| Channel | Description | Arguments | Returns |
|---------|-------------|-----------|---------|
| `shell-open-external` | Open URL in browser | `url` | `void` |
| `shell-open-path` | Open file with default app | `path` | `string` |
| `shell-show-item-in-folder` | Reveal in file manager | `path` | `void` |
| `shell-trash-item` | Move file to trash | `path` | `void` |

### Clipboard Operations

| Channel | Description | Arguments | Returns |
|---------|-------------|-----------|---------|
| `clipboard-read-text` | Read clipboard text | - | `string` |
| `clipboard-write-text` | Write text to clipboard | `text` | `void` |
| `clipboard-read-image` | Read clipboard image | - | `string \| null` |
| `clipboard-write-image` | Write image to clipboard | `dataUrl` | `void` |

### System Operations

| Channel | Description | Arguments | Returns |
|---------|-------------|-----------|---------|
| `get-platform-info` | Get platform details | - | `PlatformInfo` |
| `get-app-path` | Get app paths | - | `AppPathInfo` |
| `get-app-version` | Get app version | - | `string` |
| `system-get-memory-info` | Get memory usage | - | `MemoryInfo` |

## Event Channels (Main -> Renderer)

These are used for main process to notify renderer:

| Event | Description | Payload |
|-------|-------------|---------|
| `file-opened` | File opened via CLI/drag | `filePath: string` |
| `menu-file-new` | File > New menu clicked | - |
| `menu-file-open` | File > Open menu clicked | - |
| `menu-file-save` | File > Save menu clicked | - |
| `menu-file-save-as` | File > Save As clicked | - |
| `menu-edit-undo` | Edit > Undo clicked | - |
| `menu-edit-redo` | Edit > Redo clicked | - |
| `menu-view-zoom-in` | View > Zoom In clicked | - |
| `menu-view-zoom-out` | View > Zoom Out clicked | - |
| `app-before-quit` | App is about to quit | - |

## Best Practices

### 1. Always Use Type-Safe Wrappers

```typescript
// Good
import { fileOperations } from '@lib/electron/ipc';
const files = await fileOperations.openFile();

// Avoid
const result = await window.electron?.openFile();
```

### 2. Handle Browser Fallbacks

```typescript
// The wrapper handles this automatically
export async function showMessageDialog(options) {
  if (!isElectron()) {
    // Browser fallback
    return window.confirm(options.message) ? 0 : 1;
  }
  return window.electron!.showMessageDialog(options);
}
```

### 3. Clean Up Event Listeners

```typescript
useEffect(() => {
  const unsubscribe = window.electron?.onFileSave(() => {
    saveDocument();
  });

  return () => unsubscribe?.();
}, []);
```

### 4. Validate Input in Handlers

```typescript
ipcMain.handle('shell-open-external', async (_event, url: string) => {
  const parsed = new URL(url);
  // Only allow safe protocols
  if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
    throw new Error('Invalid URL protocol');
  }
  await shell.openExternal(url);
});
```

### 5. Log IPC Calls in Development

```typescript
if (isDev) {
  ipcMain.handle = ((original) => (channel, handler) => {
    return original(channel, async (event, ...args) => {
      console.log(`[IPC] ${channel}`, args);
      return handler(event, ...args);
    });
  })(ipcMain.handle);
}
```
