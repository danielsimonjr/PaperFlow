# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 3: Desktop Application (Electron)

This release begins Phase 3 development, adding Electron support for native desktop functionality.

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
