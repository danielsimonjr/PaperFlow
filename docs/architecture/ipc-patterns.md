# IPC Communication Patterns

<!-- repo-map:no-verification -->

This document describes the inter-process communication (IPC) patterns of the PaperFlow desktop application.

## Overview

The desktop application uses the Electron IPC system. The main process runs Node.js code. The renderer process runs the React application.

The preload script connects the two processes. The preload script calls `contextBridge.exposeInMainWorld` to expose one API object, `window.electron`. The renderer calls the functions of this object for desktop features.

## Architecture

```
+-------------------+     +-------------------+     +-------------------+
|  Renderer Process |     |   Preload Script  |     |   Main Process    |
|  (React App)      |     |   (contextBridge) |     |   (Node.js)       |
+-------------------+     +-------------------+     +-------------------+
         |                        |                        |
         |  window.electron.xxx() |                        |
         |----------------------->|                        |
         |                        |  ipcRenderer.invoke()  |
         |                        |----------------------->|
         |                        |                        |
         |                        |    ipcMain.handle()    |
         |                        |        Process         |
         |                        |                        |
         |                        |<-----------------------|
         |<-----------------------|       Response         |
         |                        |                        |
```

## Channel Types

### Request-Response (invoke and handle)

Use this pattern when the renderer needs a result.

The main process registers a handler with `ipcMain.handle`. The handler for `FILE_READ` is in `electron/ipc/fileHandlers.ts`:

```typescript
  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
    try {
      assertPathAllowed(filePath);
      const data = await fs.readFile(filePath);
      return { success: true, data: new Uint8Array(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  });
```

The handler returns a result object. On success, the `data` field holds the file bytes as a `Uint8Array`. On failure, the handler returns `success: false` and an `error` message.

The preload script wraps the channel. This entry in `electron/preload/index.ts` exposes the wrapper:

```typescript
  readFile: (filePath: string, options?: FileReadOptions) =>
    invoke<FileReadResult>(IPC_CHANNELS.FILE_READ, filePath, options),
```

The renderer calls `window.electron.readFile(filePath, options)`.

### One-Way Events (send and on)

Use this pattern when the main process notifies the renderer. Do not use this pattern to return a result.

The main process sends an event to each window that is not destroyed. The function `sendWatcherEvent` in `electron/fileWatcher.ts` sends `IPC_EVENTS.FILE_CHANGED` this way.

The preload script registers listeners with the `createListener` helper in `electron/preload/index.ts`. The helper returns an unsubscribe function:

```typescript
/**
 * Create an event listener that returns an unsubscribe function
 */
function createListener(channel: string, callback: (...args: unknown[]) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
    callback(...args);
  };
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}
```

The preload entries `onFileChanged` and `onFileDeleted` use this helper.

### Bidirectional with Confirmation

Use this pattern when the renderer must answer a request from the main process before the main process continues.

The preload script exposes `onCloseRequested` in `electron/preload/index.ts`. The callback returns a promise of a boolean. The preload script sends the boolean back on the `close-response` channel:

```typescript
  onCloseRequested: (callback: () => Promise<boolean>) => {
    const listener = async () => {
      const canClose = await callback();
      ipcRenderer.send('close-response', canClose);
    };
    ipcRenderer.on(IPC_EVENTS.WINDOW_CLOSE_REQUESTED, listener);
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.WINDOW_CLOSE_REQUESTED, listener);
    };
  },
```

No code in `electron/` sends `window-close-requested` to the renderer. No code in `electron/` receives `close-response` in the main process.

## Channel Naming Convention

The channel constants are in `electron/ipc/channels.ts`. The file exports two objects:

- `IPC_CHANNELS` lists the request-response channels.
- `IPC_EVENTS` lists the events that the main process sends to the renderer.

Each key uses upper snake case. Each value is the key in lower case, with hyphens instead of underscores. For example, the key `FILE_READ` has the value `'file-read'`.

```typescript
export const IPC_CHANNELS = {
  // Platform and app info
  GET_PLATFORM_INFO: 'get-platform-info',
  GET_APP_PATH: 'get-app-path',
  GET_APP_VERSION: 'get-app-version',
```

The keys of `IPC_CHANNELS` group by feature. The first groups are file, folder, dialog, window, watcher, autosave, backup, shell, clipboard and notification. The other groups are tray, dock, menu, context menu, shortcuts, update, print, scanner, WebAuthn and safe storage. The keys of `IPC_EVENTS` group by feature in the same way.

Some channels are string literals instead of constants. Examples are `close-response` in `electron/preload/index.ts`, the network channels in `electron/main/networkStatus.ts`, and `menu-fullscreen-changed` in `electron/ipc/menuHandlers.ts`. These names are not in `channels.ts`. Use the constants for new channels.

`electron/ipc/channels.ts` exports the types `IpcChannel` and `IpcEvent`. Each type is the union of the values of its object.

## Type Definitions

`electron/ipc/types.ts` declares the payload types. `src/types/electronTypes.ts` declares the same type names for the renderer. The names are:

- `PlatformInfo`, `AppPathInfo`
- `FileDialogOptions`, `FileDialogResult`, `SaveDialogOptions`, `SaveDialogResult`
- `FileReadOptions`, `FileReadResult`, `FileWriteResult`, `FileStats`, `RecentFile`, `FileWatcherEvent`
- `NotificationOptions`, `ExtendedNotificationOptions`
- `UpdateState`, `UpdateSettings`
- `ElectronAPI`

## Best Practices

### 1. Return an Unsubscribe Function for Each Listener

Use the `createListener` helper for each event listener. The helper returns the unsubscribe function.

In a React component, return the unsubscribe function from the effect. React calls it when the component unmounts.

### 2. Check the Input Type in Each Handler

Check the type of each renderer input before the handler uses it. For example, the `FOLDER_LIST` handler returns an empty array when `folderPath` is not a string or the path is not approved. See `electron/ipc/fileHandlers.ts`, lines 254 to 257.

### 3. Check Paths with the Path Sandbox

`electron/ipc/pathSandbox.ts` stores the approved paths.

- `approvePath` and `approvePaths` add approved paths. The file handlers call them after a dialog returns a path, and for each recent file.
- `isPathAllowed` returns true only when the path lies under an approved root and the input has no `..` segment.
- `assertPathAllowed` throws an error when `isPathAllowed` returns false.

Do not write a new path check with a plain string prefix test. The sandbox checks path segments and resolved paths.

### 4. Return a Result Object on Failure

The `FILE_READ` handler catches errors and returns `{ success: false, error }`. See the example in Request-Response (invoke and handle).

### 5. Know the Response Shape of Each Handler

Handlers do not share one response type.

- File operations return objects with `success` and `error` fields. Examples are `FileReadResult` and `FileWriteResult`.
- Other handlers return plain values. The `GET_PLATFORM_INFO` handler returns the platform object directly.

## Debugging IPC

The function `setupIpc` in `electron/main/index.ts` adds a logger for development builds. A build is a development build when `isDev` is true. The constant `isDev` is `!app.isPackaged`.

The logger replaces `ipcMain.handle`. The logger writes the channel and its arguments to the console before the handler runs:

```typescript
  // Log IPC calls in development mode
  if (isDev) {
    const originalInvoke = ipcMain.handle.bind(ipcMain);
    ipcMain.handle = function (channel: string, listener: Parameters<typeof ipcMain.handle>[1]) {
      return originalInvoke(channel, async (event, ...args) => {
        console.log(`[IPC] ${channel}`, args);
        return listener(event, ...args);
      });
    };
  }
```

The logger is installed after `setupIpcHandlers(ipcMain)` runs in `setupIpc`. The logger does not record the calls of the handlers that `setupIpcHandlers` registers.
