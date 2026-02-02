# File System Integration

This document describes the native file system integration for the PaperFlow desktop application.

## Overview

The file system module provides native file operations for the Electron desktop app, including:

- Native file open/save dialogs
- Direct file reading and writing
- File change detection (watching)
- Recent files management
- Auto-save and crash recovery
- Backup and versioning
- File associations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Renderer Process                             │
├─────────────────────────────────────────────────────────────────┤
│  src/lib/electron/fileSystem.ts                                 │
│  ├── openPdfFile()                                              │
│  ├── savePdfFile()                                              │
│  ├── watchFile()                                                │
│  └── ... (high-level API)                                       │
├─────────────────────────────────────────────────────────────────┤
│  window.electron (exposed via preload)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Main Process                                │
├─────────────────────────────────────────────────────────────────┤
│  electron/ipc/fileHandlers.ts                                   │
│  ├── File dialog handlers                                       │
│  ├── File read/write handlers                                   │
│  └── Folder operation handlers                                  │
├─────────────────────────────────────────────────────────────────┤
│  electron/fileWatcher.ts                                        │
│  └── chokidar-based file watching                               │
├─────────────────────────────────────────────────────────────────┤
│  electron/autoSave.ts                                           │
│  └── Auto-save and crash recovery                               │
├─────────────────────────────────────────────────────────────────┤
│  electron/backup.ts                                             │
│  └── Backup versioning system                                   │
├─────────────────────────────────────────────────────────────────┤
│  electron/recentFiles.ts                                        │
│  └── Recent files management                                    │
├─────────────────────────────────────────────────────────────────┤
│  electron/fileAssociation.ts                                    │
│  └── PDF file association handling                              │
└─────────────────────────────────────────────────────────────────┘
```

## IPC Channels

### File Dialogs

| Channel | Description |
|---------|-------------|
| `dialog-open-file` | Open native file picker |
| `dialog-save-file` | Open native save dialog |
| `folder-pick` | Open native folder picker |

### File Operations

| Channel | Description |
|---------|-------------|
| `file-read` | Read file contents |
| `file-write` | Write file contents |
| `file-save` | Save with dialog |
| `file-exists` | Check file existence |
| `file-get-stats` | Get file metadata |
| `file-delete` | Delete a file |
| `file-copy` | Copy a file |
| `file-move` | Move/rename a file |

### Recent Files

| Channel | Description |
|---------|-------------|
| `file-get-recent` | Get recent files list |
| `file-add-recent` | Add to recent files |
| `file-remove-recent` | Remove from recent files |
| `file-clear-recent` | Clear all recent files |

### File Watcher

| Channel | Description |
|---------|-------------|
| `watcher-start` | Start watching a file |
| `watcher-stop` | Stop watching a file |
| `watcher-stop-all` | Stop all watchers |

### Auto-Save

| Channel | Description |
|---------|-------------|
| `autosave-enable` | Enable auto-save for a file |
| `autosave-disable` | Disable auto-save |
| `autosave-get-recovery` | Get recovery files |
| `autosave-clear-recovery` | Clear a recovery file |

### Backup

| Channel | Description |
|---------|-------------|
| `backup-create` | Create a backup |
| `backup-list` | List backups for a file |
| `backup-restore` | Restore a backup |
| `backup-delete` | Delete a backup |

## Usage Examples

### Opening a PDF File

```typescript
import { openPdfFile } from '@lib/electron/fileSystem';

async function handleOpen() {
  const result = await openPdfFile({
    title: 'Select PDF',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  });

  if (result) {
    console.log('File path:', result.path);
    console.log('File data:', result.data);
  }
}
```

### Saving a PDF File

```typescript
import { savePdfFile, savePdfFileAs } from '@lib/electron/fileSystem';

// Save to existing path
async function handleSave(data: Uint8Array, filePath: string) {
  await savePdfFile(data, filePath);
}

// Save with dialog
async function handleSaveAs(data: Uint8Array) {
  const savedPath = await savePdfFileAs(data, {
    defaultPath: 'document.pdf',
  });
  console.log('Saved to:', savedPath);
}
```

### Watching for File Changes

```typescript
import {
  watchFile,
  unwatchFile,
  onFileChanged,
} from '@lib/electron/fileSystem';

// Start watching
await watchFile('/path/to/document.pdf');

// Subscribe to changes
const unsubscribe = onFileChanged((event) => {
  if (event.type === 'change') {
    console.log('File modified:', event.path);
    // Prompt user to reload
  } else if (event.type === 'unlink') {
    console.log('File deleted:', event.path);
  }
});

// Stop watching when done
await unwatchFile('/path/to/document.pdf');
unsubscribe();
```

### Auto-Save

```typescript
import {
  enableAutoSave,
  disableAutoSave,
  onAutoSaveTriggered,
} from '@lib/electron/fileSystem';

// Enable auto-save (30 second interval by default)
await enableAutoSave({
  filePath: '/path/to/document.pdf',
  interval: 60000, // 1 minute
});

// Handle auto-save triggers
onAutoSaveTriggered(async (filePath) => {
  // Save current document state
  const data = getCurrentDocumentData();
  await saveRecoveryData(filePath, data);
});

// Disable when document is closed
await disableAutoSave('/path/to/document.pdf');
```

### Recovery Files

```typescript
import {
  getRecoveryFiles,
  clearRecoveryFile,
  onRecoveryAvailable,
} from '@lib/electron/fileSystem';

// Check for recovery files on startup
onRecoveryAvailable((files) => {
  if (files.length > 0) {
    // Show recovery dialog
    showRecoveryDialog(files);
  }
});

// Recover a file
const recoveryFiles = await getRecoveryFiles();
for (const file of recoveryFiles) {
  const data = await readRecoveryData(file.recoveryPath);
  // Restore document
}

// Clear recovery file after successful recovery
await clearRecoveryFile(recoveryPath);
```

### Backups

```typescript
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
} from '@lib/electron/fileSystem';

// Create backup before save
const backup = await createBackup('/path/to/document.pdf', {
  maxBackups: 5,
});

// List available backups
const backups = await listBackups('/path/to/document.pdf');

// Restore a backup
await restoreBackup(backup.id);

// Delete old backup
await deleteBackup(backup.id);
```

### Recent Files

```typescript
import {
  getRecentFiles,
  addRecentFile,
  removeRecentFile,
  clearRecentFiles,
} from '@lib/electron/fileSystem';

// Get recent files
const recentFiles = await getRecentFiles();

// Add file to recent list
await addRecentFile('/path/to/document.pdf');

// Remove specific file
await removeRecentFile('/path/to/old-document.pdf');

// Clear all
await clearRecentFiles();
```

## React Hooks

### useUnsavedChanges

Hook to handle unsaved changes detection and confirmation:

```typescript
import { useUnsavedChanges } from '@hooks/useUnsavedChanges';

function MyComponent() {
  const { isModified, confirmClose, markAsModified, markAsSaved } =
    useUnsavedChanges({
      onSave: async () => {
        // Save document
        return true; // Return true if save was successful
      },
    });

  return (
    <div>
      {isModified && <span>Unsaved changes</span>}
    </div>
  );
}
```

### useRecentFilesStore

Zustand store for managing recent files:

```typescript
import { useRecentFilesStore } from '@stores/recentFilesStore';

function RecentFilesPanel() {
  const { recentFiles, loadRecentFiles, openRecentFile } =
    useRecentFilesStore();

  useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  return (
    <ul>
      {recentFiles.map((file) => (
        <li key={file.path} onClick={() => openRecentFile(file)}>
          {file.name}
        </li>
      ))}
    </ul>
  );
}
```

## File Associations

PDF file associations are configured in `electron-builder.yml`:

```yaml
fileAssociations:
  - ext: pdf
    name: PDF Document
    description: Portable Document Format
    mimeType: application/pdf
    role: Editor
```

### Handling File Opens

The app handles files opened from:

1. **Double-click in file manager**: Handled via app lifecycle events
2. **Command-line arguments**: Processed on startup
3. **Drag-and-drop onto dock icon** (macOS): Via `open-file` event
4. **Second instance launch**: File path passed to existing window

```typescript
// Subscribe to file opened events
window.electron.onFileOpened((filePath) => {
  // Load the file
  loadDocument(filePath);
});
```

## Storage Locations

| Data | Location |
|------|----------|
| Recent files | `{userData}/recent-files.json` |
| Recovery files | `{userData}/recovery/` |
| Backups | `{userData}/backups/` |

Where `{userData}` is:
- Windows: `%APPDATA%/PaperFlow`
- macOS: `~/Library/Application Support/PaperFlow`
- Linux: `~/.config/PaperFlow`

## Error Handling

All file operations return appropriate error information:

```typescript
interface FileReadResult {
  success: boolean;
  data?: Uint8Array;
  error?: string;
}

interface FileWriteResult {
  success: boolean;
  error?: string;
}
```

## Best Practices

1. **Always check for Electron**: Use `isElectron()` before calling native APIs
2. **Handle errors gracefully**: File operations can fail for various reasons
3. **Clean up watchers**: Always call `unwatchFile()` when done
4. **Disable auto-save**: Clean up when documents are closed
5. **Verify file existence**: Check files exist before operations
6. **Use backups**: Create backups before overwriting files

## Troubleshooting

### File watcher not detecting changes

- Ensure the file path is correct and normalized
- Check that the file exists
- Some network drives may not support file watching

### Auto-save not triggering

- Verify auto-save is enabled for the file
- Check the interval is appropriate
- Ensure the app has write permissions

### Recovery files not found

- Check the recovery directory exists
- Verify the recovery index file is valid JSON
- Ensure files weren't manually deleted

### File associations not working

- On Windows, reinstall the app to register associations
- On macOS, reset Launch Services: `lsregister -kill`
- Check the `electron-builder.yml` configuration
