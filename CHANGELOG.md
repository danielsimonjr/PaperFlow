# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
