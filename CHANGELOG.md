# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [3.0.0-alpha.1] - 2026-02-02

### Phase 3: Desktop Application (Electron) - Q1 Alpha Release

This release marks the first alpha of the PaperFlow Desktop application, bringing native desktop functionality through Electron while maintaining the full PWA experience.

### Added

#### Electron App Shell (Sprint 1)
- Electron project structure with main, preload, and IPC modules
- Main process with BrowserWindow management and app lifecycle handling
- Secure preload script with contextBridge API exposure
- Type-safe IPC communication layer with 30+ channels
- Window state persistence (position, size, maximized state)
- Multi-window support for opening multiple documents
- Platform detection utilities for conditional feature enabling
- Content Security Policy configuration for production and development
- Single instance lock to prevent duplicate app instances
- Native file dialogs (open, save, save as)
- Native shell integration (open external URLs, show in folder, trash)
- Native clipboard operations (text and images)
- Native notifications
- Recent files tracking
- Development workflow with hot reload for both renderer and main process
- Production build pipeline with electron-builder
- Support for Windows (NSIS installer, portable), macOS (DMG), and Linux (AppImage, deb, rpm)
- macOS entitlements for hardened runtime
- Comprehensive documentation (architecture, development guide, IPC patterns)
- Unit tests for window manager, IPC channels, and platform detection
- usePlatform React hook for reactive platform features

#### File System Integration (Sprint 2)
- Native file open dialog with PDF filter and multi-file selection
- Native file save dialog with overwrite confirmation and backup creation
- File read/write operations with proper error handling and data conversion
- File watcher using chokidar for external change detection with reload prompts
- Recent files management with OS-level integration and persistence
- Desktop drag-and-drop file support for Electron app
- PDF file association handler for opening PDFs from Explorer/Finder
- Command-line file opening support with startup argument processing
- Auto-save functionality with configurable intervals
- Crash recovery system with automatic recovery file detection on startup
- Backup and versioning system (configurable max backups, restore capability)
- Unsaved changes detection with React hook (useUnsavedChanges)
- File path utilities (getFileName, getDirectory, getExtension, truncatePath)
- Folder picker for batch operations
- High-level fileSystem.ts API wrapper for renderer process
- Zustand store for recent files state management
- Comprehensive file system integration tests
- Documentation for file system APIs and usage patterns

#### Auto-Updater System (Sprint 4)
- Automatic update checking on startup with configurable delay
- Periodic update checks at configurable intervals (hourly, daily, weekly)
- Manual update check via menu or settings
- Update notification UI with version info and release notes
- Download progress tracking with speed, size, and cancel option
- Install prompt with restart now or later options
- Release notes display with markdown rendering
- Update channel selection (stable, beta, alpha)
- Differential updates to minimize download sizes
- Code signing configuration for Windows and macOS
- Notarization support for macOS
- Error handling with retry and manual download fallback
- Update settings UI with all configuration options
- Zustand store for update state management
- IPC channels for renderer-main process communication
- Comprehensive unit tests for update system
- Documentation for auto-update configuration and release process

#### Native Menus & Shortcuts (Sprint 5)
- Native application menu bar with File, Edit, View, Document, Window, Help menus
- Platform-specific menu layouts (macOS app menu with About, Preferences, Services, Hide, Quit)
- Comprehensive keyboard shortcuts for all major actions
- Context menus for document viewer (copy, zoom, annotations, page navigation)
- Context menus for annotations (edit, delete, change color, properties)
- Recent files submenu with quick access shortcuts (Ctrl+1 through Ctrl+9)
- Window menu with minimize, zoom, and window management
- Help menu with keyboard shortcuts dialog, documentation links, and update check
- Dynamic menu state updates (enable/disable based on document state)
- View mode radio buttons in menu (single, continuous, spread)
- Global keyboard shortcuts (Quick Open, Bring to Front) that work when app is in background
- Keyboard shortcut customization with conflict detection
- Shortcut settings UI with search, edit, and reset functionality
- KeyboardShortcutsDialog component for viewing all shortcuts
- Zustand store for managing custom shortcuts
- Platform-specific accelerators (Cmd on macOS, Ctrl on Windows/Linux)
- Menu state synchronization between main and renderer processes
- IPC channels for menu actions and state updates
- Comprehensive tests for menu templates, shortcuts, and context menus
- Keyboard shortcuts documentation (docs/keyboard-shortcuts.md)

#### System Tray & Notifications (Sprint 3)
- System tray icon with platform-specific sizing and appearance
- Tray icon status indicators (idle, busy, notification, error)
- Tray context menu with Open, Recent Files, Preferences, Quit
- Minimize-to-tray functionality (configurable in settings)
- Close-to-tray option to keep app running in background
- Progress display in tray icon tooltip for long-running operations
- Tray icon flash animation for attention
- Native desktop notifications using Electron Notification API
- Notification types: info, success, warning, error, file-operation, batch-operation
- Notification action buttons with click handlers
- Notification grouping for batch operations
- Quiet hours / Do Not Disturb mode with configurable time range
- Notification history with unread count tracking
- OS notification center integration (Windows Action Center, macOS Notification Center)
- Dock badge count for pending notifications (macOS only)
- Dock icon bounce for attention (macOS only)
- NotificationSettings component for preferences UI
- Notification preferences persisted in settings store
- Renderer-side notification helpers in src/lib/electron/notifications.ts
- IPC channels for tray and notification operations
- Unit tests for TrayManager and NotificationManager
- Documentation for tray and notification features (docs/electron/tray-notifications.md)

#### OS Integration & Release (Sprint 6)
- Native print dialog with system printer integration
- PDF-to-printer output with correct dimensions and margins
- Shell integration (Show in Folder, Open with Default App)
- Protocol handler registration (`paperflow://` deep links)
- Launch-on-startup with optional minimized start
- Native dialogs (message boxes, error dialogs, confirmations)
- Enhanced clipboard operations (copy page as image, formatted text)
- Power save blocker for long-running operations (OCR, batch processing)
- Secure storage using OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Crash reporter integration for automatic error collection
- E2E tests for desktop-specific features using Playwright
- Cross-platform testing documentation (Windows, macOS, Linux)
- Version updated to 3.0.0-alpha.1
- Comprehensive release notes and installation documentation
- CI/CD workflows for desktop builds and releases

### Changed
- Package version updated from 1.0.0 to 3.0.0-alpha.1 for desktop alpha release
- Settings store extended with startup options (launchOnStartup, startMinimized)

### Breaking Changes
- Minimum supported Node.js version is 18.0.0
- Electron 40+ required for new APIs

### Migration Guide
If upgrading from the PWA version:
1. Install the desktop application for your platform
2. Your settings will be preserved in localStorage
3. Recent files will need to be re-opened once
4. PWA and desktop versions can run simultaneously

### Known Issues
- Linux file associations may require manual configuration on some distributions
- System tray may not appear on GNOME + Wayland without AppIndicator extension

---

## [2.5.0] - 2026-02-01

### Phase 2: Advanced Features Release

This release completes Phase 2 development, adding professional-grade tools for OCR, form design, redaction, document comparison, batch processing, and accessibility compliance.

### Added

#### OCR (Optical Character Recognition)
- Tesseract.js integration for client-side OCR
- Multi-language support with dynamic language pack loading
- Image preprocessing (deskew, denoise, contrast enhancement)
- Batch OCR processing for multi-page documents
- Layout analysis for preserving document structure
- Export to searchable PDF, plain text, and hOCR formats

#### Form Designer
- Drag-and-drop form field creation
- Field types: text, checkbox, radio button, dropdown, date picker, signature
- Calculated fields with formula support
- Conditional logic for field visibility and validation
- Form actions (submit, reset, JavaScript triggers)
- Form submission configuration (email, HTTP endpoint)

#### Redaction Tools
- Pattern-based redaction (SSN, credit cards, phone numbers, emails)
- Custom regex pattern support
- Search and redact across entire document
- Redaction verification workflow
- Metadata scrubbing (author, timestamps, comments)
- Permanent redaction with content removal

#### Document Comparison
- Text-based diff comparison
- Side-by-side view with synchronized scrolling
- Overlay mode with change highlighting
- Change summary statistics
- Comparison report export (PDF, HTML)
- Support for comparing different document versions

#### Batch Processing
- Watermark application (text and image)
- Headers and footers with page numbering
- Bates numbering with prefix/suffix support
- Batch PDF flattening
- Process multiple files with consistent settings
- Progress tracking and error handling

#### PDF/UA Accessibility Checker
- PDF/UA compliance validation
- WCAG 2.1 AA guideline checks
- Color contrast ratio calculation
- Alt text verification for images
- Reading order validation
- Tag structure analysis
- Accessibility report generation

---

## [1.0.0] - 2026-01-30

### Phase 1: MVP Release

This release marks the completion of Phase 1 development, delivering the core PDF editing experience.

### Added

#### PDF Viewing & Navigation
- High-fidelity PDF rendering with PDF.js
- Multiple view modes: single page, continuous scroll, two-page spread
- Smooth zoom controls (10% - 400%)
- Keyboard navigation and shortcuts
- Page thumbnails sidebar with lazy loading
- Document outline/bookmarks panel
- Text search with highlighting
- Dark mode support

#### Annotations
- Text highlighting with 5 color options
- Underline and strikethrough markup
- Sticky notes with rich text and replies
- Freehand drawing with pressure sensitivity
- Shape tools: rectangles, circles, arrows, lines
- Stamps: Approved, Rejected, Confidential, Draft, Final
- Annotation import/export (JSON format)
- Full undo/redo support

#### Form Filling
- Automatic form field detection (AcroForm)
- Support for text fields, checkboxes, radio buttons, dropdowns
- Tab navigation between fields
- Required field validation
- Form data export (JSON, FDF, XFDF)
- Auto-save form progress

#### Digital Signatures
- Draw, type, or upload signatures
- Signature management with IndexedDB storage
- Click-to-place with resize support
- Initials support
- Date stamp option
- Signature field alignment

#### Text Editing
- Inline text editing with font matching
- New text box creation
- Rich text formatting (bold, italic, underline)
- Font family and size selection
- Text alignment options

#### Page Management
- Drag-and-drop page reordering
- Delete, duplicate, rotate pages
- Insert blank pages
- Merge multiple PDFs
- Split PDF by page range
- Extract pages to new document

#### Export & Print
- Save with all changes embedded
- Export to PNG/JPEG with resolution options
- PDF compression
- Print preview with page range selection
- Scale and orientation options

#### PWA & Offline
- Installable as Progressive Web App
- Full offline functionality
- Service worker with Workbox
- Lighthouse PWA score of 100

#### Performance
- Virtualized page rendering
- Thumbnail caching with LRU cache
- Code splitting and lazy loading
- Memory monitoring and management
- Support for PDFs up to 100MB

#### Accessibility
- Keyboard navigation throughout
- Screen reader support with ARIA labels
- Focus indicators
- High contrast mode support

### Technical
- React 19 with TypeScript
- Vite build system
- Zustand state management
- Tailwind CSS styling
- Comprehensive test suite (unit, integration, e2e)
- Playwright browser tests
