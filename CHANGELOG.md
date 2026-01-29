# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-29

### Added
- **Sprint 12: Launch Preparation**
  - Cloudflare Pages deployment configuration (wrangler.toml)
  - CDN caching and security headers (public/_headers)
  - Sentry error tracking with privacy-preserving configuration
  - Privacy-respecting analytics module
  - GitHub Actions CI/CD workflows (ci.yml, deploy.yml, staging.yml)
  - Lighthouse CI integration for performance auditing
  - Comprehensive user documentation (Getting Started, Features, FAQ)
  - Legal pages (Privacy Policy, Terms of Service)
  - Security policy documentation

- **Sprint 11: Performance Optimization & Accessibility**
  - Performance monitoring and metrics collection
  - Virtual scrolling for large document lists
  - Resource preloading for faster page loads
  - Comprehensive accessibility support (ARIA, keyboard navigation)
  - Touch gesture support for mobile devices
  - Responsive design improvements
  - High contrast mode support

- **Sprint 10: Export, Print & Sharing**
  - Print functionality with preview and settings
  - Export to PNG/JPEG with quality options
  - PDF flattening (baking annotations)
  - Share via native Web Share API
  - QR code generation for document links
  - Batch export for multiple pages

- **Sprint 9: Page Management**
  - PDF merge functionality (combine multiple files)
  - PDF split functionality (extract pages)
  - Page rotation (90° clockwise/counter-clockwise)
  - Page deletion with confirmation
  - Page reordering via drag-and-drop
  - Page extraction to new PDF

- **Sprint 8: Digital Signatures**
  - Signature drawing pad with touch support
  - Type-to-sign with font options
  - Signature image upload
  - Signature storage in IndexedDB
  - Signature placement and resizing
  - Date stamp with signatures
  - Initials support

- **Sprint 7: Form Filling**
  - Form field detection and parsing
  - Text field input with validation
  - Checkbox and radio button support
  - Dropdown/select field handling
  - Date picker fields
  - FDF/XFDF export and import
  - Form data persistence

- **Sprint 6: Stamps & Images**
  - Preset stamp library (Approved, Rejected, Draft, etc.)
  - Custom stamp upload
  - Dynamic date stamps
  - Image insertion and placement
  - Stamp resizing and positioning

- **Sprint 5: Drawing & Shapes**
  - Freehand drawing with pen tool
  - Adjustable line thickness (1-20px)
  - Full color palette for drawing
  - Eraser tool for corrections
  - Shape tools (rectangle, circle, arrow, line)
  - Shape fill and stroke options

- **Sprint 4: Text Editing**
  - Text box insertion anywhere on page
  - Font selection with fallback support
  - Font size adjustment (8-72pt)
  - Text color options
  - Bold, italic, underline formatting
  - Text alignment (left, center, right)
  - Line spacing adjustment

- **Sprint 3: Annotations**
  - Text highlighting with multiple colors
  - Underline and strikethrough markup
  - Sticky notes with comments
  - Note replies for threaded conversations
  - Annotation color customization
  - Annotation serialization (JSON export/import)
  - Keyboard shortcuts (H, U, S, N, V)

- **Sprint 2: PDF Viewer**
  - PDF.js integration for high-fidelity rendering
  - Zoom controls (in, out, fit width, fit page)
  - Page navigation with thumbnails
  - Text selection and copying
  - Document outline/bookmarks support
  - Continuous scroll view mode
  - Two-page spread mode

### Changed
- Upgraded all dependencies to latest versions
- Improved error handling throughout the application
- Enhanced TypeScript strict mode compliance
- Optimized bundle size with code splitting

### Fixed
- React act() warnings in test suite
- Form field detection edge cases
- Annotation positioning on rotated pages
- Memory leaks in PDF rendering
- Keyboard shortcut conflicts

### Security
- Content Security Policy headers
- Input sanitization for all user content
- Secure signature storage encryption
- No external data transmission (privacy-first)

## [0.1.0] - 2026-01-25

### Added
- Initial project setup with Vite, React 19, and TypeScript
- PWA configuration with offline support via Workbox
- Tailwind CSS styling with custom theme colors
- Project directory structure following feature-based organization
- Zustand stores for document, annotation, UI, history, and settings state
- TypeScript type definitions for PDF, annotations, and forms
- PDF.js renderer wrapper for document loading and page rendering
- IndexedDB storage layer for recent files and document caching
- Basic application shell with Header, Sidebar, and Toolbar components
- Home page with drag-and-drop file opening
- Editor page with PDF viewer placeholder
- Settings page structure
- Button component with variants (primary, secondary, ghost, danger)
- Keyboard shortcuts configuration
- Tool constants for annotation and editing tools
- ESLint and Prettier configuration
- Vitest setup for unit and integration tests
- Playwright configuration for end-to-end tests
- Path aliases for cleaner imports (@components, @hooks, @stores, etc.)

### Technical Notes
- React Router v7 for client-side routing
- Zustand with persist middleware for state persistence
- PDF.js worker configured for web worker rendering
- Radix UI primitives for accessible components
- Lucide React for icons
