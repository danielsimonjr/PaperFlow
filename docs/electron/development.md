# Electron Development Guide

This guide covers the development workflow for the PaperFlow desktop application.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- Platform-specific build tools (for native modules)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development mode:
   ```bash
   npm run electron:dev
   ```

This command:
- Builds the Electron main process
- Starts the Vite dev server
- Launches Electron with hot reload enabled
- Watches for main process changes

## Development Workflow

### Renderer Process Changes

Changes to React components and web code are automatically hot-reloaded by Vite. No restart required.

### Main Process Changes

Changes to files in `electron/` trigger:
1. Automatic rebuild of main process
2. Automatic restart of Electron

### Preload Script Changes

Preload script changes require Electron restart, which happens automatically.

## Project Scripts

| Script | Description |
|--------|-------------|
| `npm run electron:dev` | Start development mode with hot reload |
| `npm run electron:build` | Build production distributables |
| `npm run electron:preview` | Build and preview production build |
| `npm run electron:compile` | Compile Electron TypeScript only |
| `npm run electron:pack` | Build unpacked app (for testing) |
| `npm run electron:dist` | Build all distributables |

## Debugging

### Renderer Process

DevTools open automatically in development mode. You can also:
- Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
- Use React DevTools (install separately)

### Main Process

For main process debugging:

1. Add `--inspect` flag to electron in dev script
2. Open `chrome://inspect` in Chrome
3. Click "inspect" under the Electron target

Alternatively, use VS Code debugger:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "env": {
        "VITE_DEV_SERVER_URL": "http://localhost:5173",
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Testing

### Unit Tests

```bash
# Run all tests including Electron tests
npm run test

# Run only Electron tests
npx vitest run tests/electron/
```

### Manual Testing

1. Test features in both Electron and browser modes
2. Verify platform-specific behavior on different OSes
3. Test window state persistence (resize, maximize, restart)
4. Test file operations with native dialogs

## Adding New IPC Channels

1. Define the channel in `electron/ipc/channels.ts`:
   ```typescript
   export const IPC_CHANNELS = {
     // ... existing channels
     MY_NEW_CHANNEL: 'my-new-channel',
   };
   ```

2. Add types in `electron/ipc/types.ts`:
   ```typescript
   export interface MyNewChannelArgs {
     param1: string;
     param2: number;
   }

   export interface MyNewChannelResult {
     success: boolean;
     data: string;
   }
   ```

3. Add handler in `electron/ipc/handlers.ts`:
   ```typescript
   ipcMain.handle(IPC_CHANNELS.MY_NEW_CHANNEL,
     async (event, args: MyNewChannelArgs): Promise<MyNewChannelResult> => {
       // Implementation
       return { success: true, data: 'result' };
     }
   );
   ```

4. Add to preload script in `electron/preload/index.ts`:
   ```typescript
   const electronAPI: ElectronAPI = {
     // ... existing methods
     myNewMethod: (args: MyNewChannelArgs) =>
       invoke<MyNewChannelResult>(IPC_CHANNELS.MY_NEW_CHANNEL, args),
   };
   ```

5. Update ElectronAPI type in `electron/ipc/types.ts`:
   ```typescript
   export interface ElectronAPI {
     // ... existing methods
     myNewMethod: (args: MyNewChannelArgs) => Promise<MyNewChannelResult>;
   }
   ```

6. Add wrapper in `src/lib/electron/ipc.ts`:
   ```typescript
   export async function myNewMethod(args: MyNewChannelArgs): Promise<MyNewChannelResult | null> {
     if (!isElectron()) return null;
     return window.electron!.myNewMethod(args);
   }
   ```

## Platform-Specific Code

### Detecting Platform

```typescript
import { isElectron, isWindows, isMacOS, isLinux } from '@lib/electron/platform';

// Conditionally render based on platform
if (isElectron()) {
  // Electron-specific code
} else {
  // Browser fallback
}

// OS-specific styling
const buttonStyle = isMacOS() ? 'macos-style' : 'default-style';
```

### Using the usePlatform Hook

```tsx
import { usePlatform } from '@hooks/usePlatform';

function MyComponent() {
  const { isElectron, hasFeature, commandKey } = usePlatform();

  return (
    <div>
      {isElectron && hasFeature('window-controls') && (
        <WindowControls />
      )}
      <span>Save: {commandKey}+S</span>
    </div>
  );
}
```

## Building for Distribution

### Windows

```bash
npm run electron:build -- win
```

Creates:
- NSIS installer (`.exe`)
- Portable version (`.exe`)

### macOS

```bash
npm run electron:build -- mac
```

Creates:
- DMG installer
- ZIP archive

Note: Code signing requires Apple Developer certificate.

### Linux

```bash
npm run electron:build -- linux
```

Creates:
- AppImage
- .deb package
- .rpm package

### All Platforms

```bash
npm run electron:build
```

Builds for the current platform by default.

## Troubleshooting

### Window Not Showing

Check that `show: false` is set and `ready-to-show` event fires:
```typescript
window.once('ready-to-show', () => {
  window.show();
});
```

### IPC Not Working

1. Verify channel names match exactly
2. Check contextBridge is exposing the API
3. Ensure preload script is loading (check DevTools console)

### Hot Reload Not Working

1. Verify Vite dev server is running
2. Check VITE_DEV_SERVER_URL environment variable
3. Try restarting the dev script

### Build Failing

1. Check for missing build dependencies
2. Verify electron-builder.yml configuration
3. Check icon files exist in build/ directory
