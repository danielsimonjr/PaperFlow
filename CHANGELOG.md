# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
