# System Tray and Notifications

This document describes the system tray integration and native notification features in PaperFlow's Electron desktop application.

## Overview

PaperFlow provides deep OS integration through:
- System tray icon with context menu
- Minimize-to-tray functionality
- Native desktop notifications
- Dock badge support (macOS)

## System Tray

### Features

- **Tray Icon**: Always-visible icon in the system notification area
- **Context Menu**: Quick access to common actions
- **Status Indicators**: Visual feedback for app state
- **Progress Tooltip**: Real-time operation progress
- **Platform Support**: Windows, macOS, and Linux

### Configuration

Tray settings can be configured in Settings > Notifications:

| Setting | Description | Default |
|---------|-------------|---------|
| Show tray icon | Display icon in system tray | On |
| Minimize to tray | Minimize to tray instead of taskbar | Off |
| Close to tray | Close button minimizes to tray | Off |

### Tray Icon States

| State | Description | Icon |
|-------|-------------|------|
| Idle | App is ready | Default icon |
| Busy | Processing a document | Animated/orange icon |
| Notification | Pending notifications | Badge overlay |
| Error | Error occurred | Red indicator |

### Context Menu

Right-clicking the tray icon shows:

- **Show PaperFlow** - Open/focus the main window
- **New Window** - Open a new document window
- **Open File...** - Open file picker
- **Recent Files** - Quick access to recent documents
- **Preferences...** - Open settings
- **Quit PaperFlow** - Exit the application

### API Reference

#### Renderer Process

```typescript
import {
  getTrayStatus,
  setTrayStatus,
  setTrayProgress,
  setTrayTooltip,
  flashTray
} from '@/lib/electron/notifications';

// Get current tray status
const status = await getTrayStatus();
// { status: 'idle', notificationCount: 0, isReady: true }

// Set tray status
await setTrayStatus('busy');

// Show progress in tooltip
await setTrayProgress('Saving document', 75, 'report.pdf');

// Clear progress
await setTrayProgress(null);

// Flash tray icon for attention
await flashTray(1000); // Flash for 1 second
```

## Notifications

### Features

- **Native Notifications**: Uses OS notification system
- **Action Buttons**: Interactive notification actions
- **Quiet Hours**: Suppress notifications during specified times
- **Grouping**: Batch similar notifications together
- **History**: Track notification history
- **Sound Control**: Enable/disable notification sounds

### Configuration

Notification settings can be configured in Settings > Notifications:

| Setting | Description | Default |
|---------|-------------|---------|
| Enable notifications | Show desktop notifications | On |
| Notification sounds | Play sound with notifications | On |
| File saved | Notify when file is saved | Off |
| Export complete | Notify when export finishes | On |
| Background operation | Notify when background tasks complete | On |

### Quiet Hours

Configure quiet hours to suppress notifications:

- **Enable quiet hours**: Turn on time-based suppression
- **Start time**: When to start suppressing (default: 22:00)
- **End time**: When to stop suppressing (default: 08:00)

### Notification Types

| Type | Description | Default Enabled |
|------|-------------|-----------------|
| info | General information | Yes |
| success | Successful operations | Yes |
| warning | Warnings | Yes |
| error | Errors | Yes |
| file-operation | File save/export/import | Yes |
| batch-operation | Batch processing | Yes |
| update | App updates | Yes |

### API Reference

#### Renderer Process

```typescript
import {
  showNotification,
  showExtendedNotification,
  showFileOperationNotification,
  showBatchOperationNotification,
  getNotificationPreferences,
  setNotificationPreferences,
  getNotificationHistory,
  markAllNotificationsRead,
  closeNotification,
} from '@/lib/electron/notifications';

// Simple notification
await showNotification('Title', 'Body text', 'info');

// Extended notification with actions
await showExtendedNotification({
  type: 'success',
  title: 'Export Complete',
  body: 'Your PDF has been exported successfully',
  actions: [
    { id: 'open', text: 'Open File' },
    { id: 'folder', text: 'Show in Folder' },
  ],
});

// File operation notification
await showFileOperationNotification('save', 'document.pdf', true);
await showFileOperationNotification('export', 'report.pdf', false, 'Permission denied');

// Batch operation notification
await showBatchOperationNotification('Export', 5, 5); // 5 of 5 succeeded

// Get/set preferences
const prefs = await getNotificationPreferences();
await setNotificationPreferences({
  soundEnabled: false,
  quietHours: {
    enabled: true,
    startHour: 22,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  },
});

// Notification history
const history = await getNotificationHistory();
await markAllNotificationsRead();
```

#### Event Listeners

```typescript
import {
  onNotificationClicked,
  onNotificationClosed,
  onNotificationAction,
  onTrayClicked,
  onWindowHidden,
  onWindowShown,
} from '@/lib/electron/notifications';

// Listen for notification events
const unsubscribe = onNotificationClicked((id) => {
  console.log('Notification clicked:', id);
});

// Clean up when done
unsubscribe();
```

## Dock Badge (macOS)

On macOS, the dock icon can display a badge count for pending notifications.

### API Reference

```typescript
import {
  setDockBadge,
  clearDockBadge,
  bounceDock,
  getDockBadge,
} from '@/lib/electron/notifications';

// Set badge count
await setDockBadge(5);

// Clear badge
await clearDockBadge();

// Bounce dock icon
await bounceDock('critical'); // Bounces until app is focused
await bounceDock('informational'); // Bounces once

// Get current badge count
const count = await getDockBadge();
```

## Platform Differences

### Windows

- Tray icon appears in the notification area (system tray)
- Notifications use Windows 10+ toast notifications
- Balloon notifications used on older Windows versions
- Action Center integration for notification history

### macOS

- Tray icon appears in the menu bar
- Template images used for proper dark/light mode support
- Notification Center integration
- Dock badge for notification count
- Dock bouncing for attention

### Linux

- Tray icon support varies by desktop environment
- Notifications use libnotify
- Action buttons may not be supported on all DEs
- Urgency levels supported

## Best Practices

1. **Respect User Preferences**: Always check if notifications are enabled before showing
2. **Use Appropriate Types**: Use correct notification types for proper categorization
3. **Avoid Notification Spam**: Group similar notifications, use batch notifications
4. **Provide Meaningful Content**: Include actionable information in notifications
5. **Handle Actions**: Always handle notification action callbacks
6. **Clean Up**: Remove event listeners when components unmount

## Troubleshooting

### Notifications Not Appearing

1. Check if notifications are enabled in Settings
2. Check OS notification permissions
3. Check if quiet hours are active
4. Verify the app is not focused (if showWhenFocused is false)

### Tray Icon Not Visible

1. Check if "Show tray icon" is enabled
2. On Windows, check system tray overflow area
3. On Linux, verify tray support in your DE

### Dock Badge Not Showing (macOS)

1. Dock badges only work on macOS
2. Check if the app has notification permissions
3. Verify the badge count is non-zero
