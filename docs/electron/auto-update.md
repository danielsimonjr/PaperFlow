# Auto-Update System

PaperFlow includes an automatic update system built on [electron-updater](https://www.electron.build/auto-update) that keeps the desktop application up-to-date with the latest features and security fixes.

## Overview

The auto-update system provides:

- **Automatic update checks** on startup and at configurable intervals
- **Manual update checks** via menu or settings
- **Download progress tracking** with speed and size display
- **Update channels** (stable, beta, alpha) for different release tracks
- **Differential updates** to minimize download sizes
- **Code signing verification** for security
- **Graceful error handling** with retry and fallback options

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Renderer Process                        │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │   updateStore   │  │ Update Components │                 │
│  │   (Zustand)     │◄─┤  - Notification   │                 │
│  │                 │  │  - Progress       │                 │
│  │                 │  │  - Settings       │                 │
│  └────────┬────────┘  └──────────────────┘                 │
│           │ IPC                                              │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────────┐
│           ▼              Main Process                        │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │  updater.ts     │──│ electron-updater │                 │
│  │  IPC Handlers   │  │  autoUpdater     │                 │
│  └─────────────────┘  └────────┬─────────┘                 │
│                                │                             │
│                       ┌────────▼─────────┐                  │
│                       │  GitHub Releases │                  │
│                       │  (Update Server) │                  │
│                       └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Update Server (GitHub Releases)

The default configuration uses GitHub Releases as the update server. This is configured in `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: paperflow
  repo: paperflow
  releaseType: release
```

### Update Channels

Users can choose from three update channels:

| Channel | Description | Use Case |
|---------|-------------|----------|
| Stable | Production-ready releases | Most users |
| Beta | Pre-release versions | Early adopters |
| Alpha | Experimental builds | Developers/testers |

### Check Frequency

Update checks can be configured to run:

- **Hourly**: Every hour
- **Daily**: Once per day (default)
- **Weekly**: Once per week
- **Never**: Manual checks only

## IPC Channels

### Request Channels (Renderer → Main)

| Channel | Description |
|---------|-------------|
| `update-get-state` | Get current update state |
| `update-get-settings` | Get update settings |
| `update-set-settings` | Update settings |
| `update-check-for-updates` | Trigger manual update check |
| `update-download` | Start downloading update |
| `update-cancel-download` | Cancel ongoing download |
| `update-install-and-restart` | Install update and restart |
| `update-install-later` | Install on next quit |
| `update-get-release-notes` | Get release notes |

### Event Channels (Main → Renderer)

| Channel | Description |
|---------|-------------|
| `update-state-changed` | Update state changed |
| `update-available` | New update available |
| `update-downloaded` | Update finished downloading |
| `update-error` | Error occurred |

## Update State

The update system maintains the following state:

```typescript
interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadProgress?: {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
  };
  error?: string;
  lastCheckTime?: number;
}
```

## UI Components

### UpdateNotification

Toast notification that appears when an update is available or ready to install.

```tsx
import { UpdateNotification } from '@/components/update';

// Add to your app layout
<UpdateNotification />
```

### UpdateProgress

Modal dialog showing download progress with cancel option.

```tsx
import { UpdateProgress } from '@/components/update';

<UpdateProgress />
```

### UpdateSettings

Settings panel for configuring auto-update behavior.

```tsx
import { UpdateSettings } from '@/components/update';

// Add to settings page
<UpdateSettings />
```

### ReleaseNotes

Dialog displaying release notes with markdown rendering.

```tsx
import { ReleaseNotes } from '@/components/update';

<ReleaseNotes />
```

## Code Signing

Code signing is required for auto-updates on macOS and recommended for Windows.

### Windows Code Signing

Set these environment variables:

```bash
CSC_LINK=/path/to/certificate.pfx
CSC_KEY_PASSWORD=your-password
```

Or use base64-encoded certificate:

```bash
CSC_LINK="base64-encoded-certificate"
CSC_KEY_PASSWORD=your-password
```

### macOS Notarization

Set these environment variables:

```bash
APPLE_ID=your-apple-id@example.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=YOUR_TEAM_ID
```

Generate an app-specific password at [appleid.apple.com](https://appleid.apple.com).

### Verification

The `scripts/sign.js` script handles code signing during the build process. It:

1. Verifies certificate existence and validity
2. Signs Windows executables using signtool
3. Notarizes macOS apps using notarytool
4. Staples the notarization ticket

## Differential Updates

Differential (delta) updates are enabled to reduce download sizes. When a user updates from version 1.0.0 to 1.1.0, only the changed portions are downloaded.

This is configured in `electron-builder.yml`:

```yaml
nsis:
  differentialPackage: true

generateUpdatesFilesForAllChannels: true
```

## Error Handling

The update system handles errors gracefully:

1. **Network errors**: Automatic retry with exponential backoff
2. **Download failures**: Show error message with retry option
3. **Installation failures**: Rollback to previous version
4. **Signature verification**: Reject unsigned or tampered updates

Users are always provided with:
- Clear error messages
- Retry option
- Manual download link as fallback

## Testing Updates

### Development Testing

In development mode, updates can be tested using:

```javascript
// In main process
autoUpdater.forceDevUpdateConfig = true;
```

Create a `dev-app-update.yml` file:

```yaml
provider: generic
url: http://localhost:8080/updates
```

### Staging Environment

For staging, use a separate GitHub repository or a custom update server.

### Integration Tests

Update-related tests are in `tests/electron/updater.test.ts`:

```bash
npm run test -- tests/electron/updater.test.ts
```

## Troubleshooting

### Updates Not Working

1. Check if code signing is configured correctly
2. Verify GitHub releases are published correctly
3. Check update server URL in `electron-builder.yml`
4. Review electron-log output for errors

### Download Stuck

1. Check network connectivity
2. Verify firewall allows HTTPS connections
3. Try manual download from GitHub releases

### Installation Fails

1. Ensure app has write permissions
2. Close all app windows before installing
3. Check disk space availability

### Logs Location

Update logs are written to:

- **Windows**: `%USERPROFILE%\AppData\Roaming\PaperFlow\logs\`
- **macOS**: `~/Library/Logs/PaperFlow/`
- **Linux**: `~/.config/PaperFlow/logs/`

## Security Considerations

1. **Always sign releases** - Unsigned updates will be rejected by macOS
2. **Use HTTPS** - All update traffic should be encrypted
3. **Verify signatures** - electron-updater verifies code signatures
4. **Limit permissions** - Updates run with user privileges, not admin
5. **Audit dependencies** - Regularly update electron-updater

## Release Checklist

When publishing a new release:

1. [ ] Update version in `package.json`
2. [ ] Update `CHANGELOG.md`
3. [ ] Build release packages for all platforms
4. [ ] Code sign all executables
5. [ ] Notarize macOS builds
6. [ ] Create GitHub release with correct tag
7. [ ] Upload all artifacts to release
8. [ ] Set release as pre-release if beta/alpha
9. [ ] Publish release
10. [ ] Verify auto-update works on all platforms
