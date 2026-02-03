# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Architecture Documentation
- Comprehensive architecture docs: ARCHITECTURE.md, OVERVIEW.md, API.md, DATAFLOW.md, COMPONENTS.md
- Dependency graph analysis with DEPENDENCY_GRAPH.md (264 files, 0 circular dependencies)
- Unused code analysis report in unused-analysis.md

#### Module Organization
- Barrel exports for stores (`src/stores/index.ts`) - 26 Zustand stores
- Barrel exports for hooks (`src/hooks/index.ts`) - 26 React hooks
- Barrel exports for utils (`src/utils/index.ts`) - coordinate, platform, cn utilities

#### Development Tools Documentation
- Document compress-for-context tool for LLM context compression
- Document chunking-for-files tool for large file editing
- Document create-dependency-graph tool for codebase analysis

### Fixed

#### Code Review Fixes (Phase 3 Q4 - Sprints 19-24)
- Fixed license key format version character ('1' to '2') to use valid CHARSET characters
- Updated licenseValidator to use licenseFormat module for consistent key encoding/decoding
- Moved license validator tests to correct location (tests/unit/lib/license/)
- Fixed license validator tests to use correct edition names (free/pro/business/enterprise)
- Fixed test API alignment between test expectations and actual implementation

#### Code Review Fixes (Phase 3 Q3)
- Fixed unused `message` parameter in attention manager's `notifyOperationComplete` and `notifyError` export functions
- Removed unused `LICENSE_KEY_REGEX` constant in license validator module
- Fixed unused imports in license validator test file (`isValidKeyFormat`, `decodeLicenseKey`, `LicenseKeyData`)

#### Test and Lint Fixes (Phase 3 Q2)
- Fixed PrintQueue test assertions to account for auto-start behavior
- Fixed ScannerProvider tests to properly enumerate devices before selection
- Added ImageData polyfill for Node.js test environment in document detection tests
- Fixed React hooks exhaustive-deps warnings in ScannerSelectDialog and HardwareKeyAuth
- Fixed react-refresh warnings for context hook exports in PlatformContext
- Fixed react-refresh warning for HOC export in LockedSettingBadge
- Fixed TypeScript errors with underscore-prefixed unused parameters
- Fixed TypeScript ArrayBuffer/SharedArrayBuffer compatibility in updateClient.ts
- Fixed FeatureId type compatibility in license validator

### Added

#### Hardware Security & WebAuthn (Sprint 12)
- WebAuthn/FIDO2 type definitions for credentials, attestation, and authentication
- WebAuthn client with credential registration and authentication
- Hardware key enrollment component with step-by-step guidance
- Hardware key authentication component with timeout and retry support
- Key management UI for viewing, renaming, and removing enrolled keys
- Enrollment guide with visual step-by-step walkthrough
- FIDO2 server verification for attestation and assertion
- Attestation verification with COSE key parsing
- Assertion verification with signature validation
- Hardware encryption service for document protection
- Multi-key encryption allowing multiple hardware keys to decrypt
- Key wrapping utilities with PBKDF2 key derivation
- Security store with authentication state and enrolled keys
- Electron WebAuthn bridge for main process integration
- WebAuthn preload script for renderer access
- Auto-update system with electron-updater integration
- Differential update support for reduced download sizes
- Update notification component with progress display

#### Scanner Integration (Sprint 11)
- Scanner types and interfaces for device capabilities
- Scanner provider abstraction for TWAIN/WIA/SANE/ImageCapture
- Document detection with Canny edge detection algorithm
- Perspective correction with homography matrix transformation
- Image compression utilities for PDF optimization
- Scan to PDF conversion with multi-page support
- Scanner store with device management and history
- Scanner select dialog for device enumeration
- Scan settings panel with resolution, color mode, and paper size
- Scan preview component with zoom and crop
- Resolution picker component
- Color mode selector component
- Interactive crop tool for manual adjustment
- Enhancement tools with brightness, contrast, and sharpening
- Batch scan workflow for multi-page documents
- Page organizer with drag-and-drop reordering
- Scan profiles manager with preset configurations
- Profile manager UI for create, edit, delete operations
- OCR integration with Tesseract.js
- Native addon placeholders for TWAIN, WIA, SANE drivers

#### Native Print Integration (Sprint 10)
- Print settings types and interfaces
- Print store with job management and queue
- Print queue manager with job prioritization
- Print presets for common configurations
- Virtual printer for PDF output
- Page layout component with paper sizes and orientations
- Print range selector with page/range/current selection
- Copies and collation control
- Print preview with zoom and page navigation
- Native print bridge for Electron IPC
- Print IPC channels for main process communication
- Printer enumeration and status monitoring

#### MDM/GPO Deployment Support (Sprint 19)
- Windows ADMX/ADML templates for Group Policy management
- Policy categories: Application, Security, Features, Updates, Network, Performance
- GPO registry reader with HKLM/HKCU precedence
- macOS MDM configuration profiles (mobileconfig)
- macOS managed preferences reader (NSUserDefaults/CFPreferences)
- Unified enterprise policy store with policy merging
- Policy status indicator and locked setting badges
- MSI installer with GPO deployment support
- PKG installer with MDM deployment support
- GPO and MDM reader test suites

#### Centralized Configuration (Sprint 20)
- JSON Schema for enterprise configuration validation
- JSON/JSONC configuration parser with comment support
- YAML configuration parser with anchor/alias support
- Configuration file discovery system (standard OS locations)
- Configuration hierarchy and precedence merging
- Remote configuration endpoint support with caching
- Configuration refresh and hot reload with file watchers
- Configuration encryption for sensitive values (AES-256-GCM)
- Environment variable expansion (${VAR:-default} syntax)
- Secrets manager with OS keychain integration
- Configuration viewer UI component
- Config source badges and export/import dialogs
- CLI tools for configuration validation
- Configuration system test suite

#### Offline License Validation (Sprint 21)
- License key format with edition, type, expiry, and seat encoding
- Offline license validation with checksum verification
- RSA signature verifier for license data
- Hardware fingerprinting with fuzzy matching
- License binding and activation manager
- Secure license storage with encryption
- License cache for offline validation
- Feature gating based on license edition
- License expiry handler with grace periods
- Warning notifications for expiring licenses
- License validator test suite

#### LAN Collaboration & Sync (Sprint 22)
- mDNS/Bonjour service discovery for peer finding
- LAN peer manager with status tracking
- LAN collaboration Zustand store

#### On-Premise Update Server (Sprint 23)
- Update server types and architecture
- Update client with proxy support
- Download progress tracking and checksum verification
- Release notes fetching

#### Kiosk Mode & Year Release (Sprint 24)
- Kiosk mode configuration types
- Kiosk store with session management
- Kiosk mode activation with PIN protection
- Feature lockdown system
- Navigation restrictions
- Session auto-reset on inactivity
- Kiosk UI shell component
- Touch-friendly kiosk toolbar
- Kiosk header with branding support

#### Windows Installer (Sprint 13)
- Comprehensive electron-builder configuration for Windows targets (NSIS, MSI, MSIX)
- NSIS installer with custom script for file associations, protocol handlers, and registry entries
- MSI package configuration for enterprise Group Policy deployment with silent install support
- MSIX package for Microsoft Store submission with proper manifest and capabilities
- Windows code signing configuration with EV certificate support
- Custom installer pages with PDF association, desktop shortcut, and startup options
- Differential updates for NSIS to minimize download sizes
- Windows-specific crash reporter with minidump symbols and Sentry integration
- GitHub Actions workflow for Windows builds with code signing and artifact upload
- Windows 10/11 compatibility testing configuration

#### macOS Bundle & Notarization (Sprint 14)
- Universal binary support for Intel (x64) and Apple Silicon (arm64)
- DMG installer with custom background, icon positioning, and license agreement
- PKG installer for enterprise MDM deployment with pre/post install scripts
- Hardened runtime configuration for notarization requirements
- Apple notarization workflow with notarytool and automatic stapling
- Mac App Store entitlements and sandbox configuration
- Inherited entitlements for child processes
- Notarization script with verification and stapling helpers
- GitHub Actions workflow for macOS builds with code signing and notarization

#### Linux Packages (Sprint 15)
- AppImage portable package with automatic updates
- Debian package (.deb) with proper dependencies and maintainer scripts
- RPM package (.rpm) for Fedora/RHEL with correct dependencies
- Snap package with strict confinement and proper plugs for capabilities
- Flatpak manifest for Flathub submission
- Desktop entry following freedesktop.org specification
- MIME type associations for PDF files
- Custom protocol handler registration (paperflow://)
- GitHub Actions workflow for Linux builds with multi-distro testing
- Snapcraft.yaml with GNOME extension and proper environment

#### Platform UI Adaptations (Sprint 16)
- Comprehensive platform detection utilities (OS, version, capabilities)
- PlatformContext React provider for platform-aware components
- Platform-specific CSS with font stacks (SF Pro, Segoe UI, system fonts)
- Adaptive spacing and sizing matching platform conventions
- Platform-specific scrollbar styling (overlay on macOS, visible on Windows)
- TitleBar component with platform-appropriate window controls
- macOS traffic light buttons on left, Windows buttons on right
- Dark mode detection and response on all platforms
- High DPI support for Retina and Windows scaling
- Reduced motion preference support
- Touch device detection
- Platform-specific keyboard shortcut formatting

#### macOS Touch Bar & Windows Taskbar (Sprint 17)
- TouchBarManager with context-aware layouts (viewer, editor, forms, signature)
- Touch Bar controls for zoom, navigation, annotation tools, and color picker
- Automatic Touch Bar context switching based on active mode
- Windows Jump Lists with recent/pinned documents and common tasks
- Windows taskbar progress for long-running operations
- Windows taskbar overlay icons for status (unsaved, processing, error)
- Windows thumbnail toolbar with navigation and zoom buttons
- Linux Unity/GNOME launcher integration with quicklists and progress
- Cross-platform attention manager (dock bounce, taskbar flash, urgent hint)
- Notification badge support on macOS Dock

#### Cross-Platform Testing & Q3 Release (Sprint 18)
- Cross-platform CI/CD matrix for Windows 10/11, macOS 12/13/14, Ubuntu 22/24
- Comprehensive E2E test suite for core features across platforms
- Installer testing workflows for NSIS, MSI, DMG, PKG, AppImage, deb, rpm
- Visual regression testing configuration
- Accessibility audit testing with screen reader support verification
- Performance benchmarking across platforms
- Release candidate workflow with version management
- Release metrics monitoring (downloads, installs, crashes, feature usage)
- Platform-specific feature tests (Touch Bar, Jump Lists, taskbar)
- Auto-update testing across all platforms

#### Offline-First Architecture (Sprint 7)
- Enhanced service worker configuration with Workbox caching strategies
  - Stale-while-revalidate for static assets (JS, CSS)
  - Cache-first for PDFs, images, and fonts
  - Network-first for API calls with cache fallback
  - Configurable cache expiration and max entries
- Offline document storage in IndexedDB with comprehensive schema
  - Document binary data storage
  - Annotations persistence per document
  - Edit history tracking for sync
  - Offline availability settings management
- Offline queue manager for network operations
  - Priority-based queue (high, normal, low)
  - Automatic retry with exponential backoff
  - Queue persistence across sessions
  - Conflict detection and resolution
- Background Sync API integration with browser fallback
  - One-time sync registration
  - Periodic sync for regular updates
  - Fallback polling for unsupported browsers
- Offline-aware Zustand store (offlineStore)
  - Connection status tracking (online/offline/connecting)
  - Sync state management (idle/syncing/error/paused)
  - Pending operations count
  - Conflict tracking and resolution
  - Auto-sync and sync-on-reconnect settings
- Electron offline detection with reliable connectivity checks
  - DNS resolution verification
  - HTTP connectivity probes
  - IPC-based status updates to renderer
- Document sync engine with conflict resolution
  - Bidirectional sync between local and cloud
  - Conflict detection by checksum and version
  - Resolution strategies: local-wins, remote-wins, newest-wins, merge, manual
  - Sync progress reporting
- Delta sync for large documents
  - Binary diff calculation
  - Patch generation and application
  - Bandwidth usage optimization
  - Chunk-based transfer for reliability
- Offline indicator component with interactive status panel
  - Connection status display
  - Sync progress visualization
  - Pending operations list
  - Quick sync action
- Offline mode banner with feature guidance
  - Dismissible notification on going offline
  - Available features list
  - Limited features explanation
  - Auto-hide when back online
- Sync conflict resolution dialog
  - Side-by-side version comparison
  - Change visualization by type
  - Strategy selection with recommendations
  - Merge preview for annotations
- Selective offline availability management
  - Mark documents for offline access
  - Priority-based storage management
  - Storage space monitoring and cleanup
  - Max offline documents configuration
- Offline-first React hooks
  - useOfflineData: Cached data fetching with sync
  - useOfflineSync: Sync operations and status
  - useConnectionStatus: Connection monitoring
- Comprehensive test suite for offline functionality
  - Unit tests for storage, sync, and conflict resolution
  - Integration tests for complete offline workflows
- Technical documentation for offline architecture

#### Native Batch Processing (Sprint 9)
- Worker thread pool manager with configurable min/max workers and idle timeout
- PDF worker thread for parallel processing of compress, merge, split, watermark operations
- Priority-based batch job queue system with pause/resume/cancel capabilities
- IndexedDB persistence for job recovery across application restarts
- Native batch processing Zustand store with comprehensive state management
- Batch processing wizard UI with 5-step configuration flow
- Batch progress dashboard with real-time job status and resource monitoring
- Batch compression operation with quality presets and size estimation
- Batch merge operation with append and interleave strategies
- Batch split operation supporting page-count, file-size, and custom ranges
- Batch watermark operation with text/image support and positioning presets
- Batch OCR operation with multi-language support and accuracy settings
- Comprehensive error handling with retry logic and exponential backoff
- Batch results summary with export to TXT, CSV, and JSON formats
- Batch template system for saving and reusing operation configurations
- Default templates for common operations (Quick Compress, Archive, etc.)
- Template import/export functionality
- Resource usage monitoring (CPU, memory, active workers)
- Queue statistics tracking (pending, processing, completed, failed jobs)
- Unit tests for job queue, batch operations, and native batch store

#### File Watching & Hot Reload (Sprint 8)
- Advanced file watcher service using chokidar with optimized debouncing
- Document change detection engine for pages, annotations, text, and metadata
- Smart reload system that preserves scroll position, zoom, and unsaved annotations
- External change notifications with reload, ignore, and compare options
- Side-by-side document comparison view with synchronized scrolling
- Conflict resolution for local vs external changes with merge strategies
- File lock detection with retry mechanism and user notification
- Watched folders management for recent files
- Hot reload development support with state preservation
- Watch queue manager for batching and prioritizing file events
- Performance optimizations for watching many files (CPU < 2%, minimal memory)
- Auto-reload settings panel with configurable behavior
- Watch status indicators for UI feedback
- Comprehensive test suite for change detection and smart reload

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
