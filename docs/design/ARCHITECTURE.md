# PaperFlow Technical Architecture

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Framework | React 19 + TypeScript | Component architecture, large ecosystem, PWA support |
| PDF Engine | PDF.js + pdf-lib | Mozilla's renderer for viewing, pdf-lib for manipulation |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Styling | Tailwind CSS + Radix UI | Utility-first CSS, accessible components |
| Build Tool | Vite | Fast development, optimal production builds |
| Service Worker | Workbox | Google's PWA toolkit for offline support |
| Local Storage | IndexedDB | Client-side document and settings persistence |
| OCR Engine | Tesseract.js (WASM) | Client-side OCR, no data leaves device |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser Environment                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     React Application                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  Pages   │  │Components│  │  Hooks   │  │   Stores     │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Core Libraries                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │  PDF.js  │  │  pdf-lib │  │Tesseract │  │  IndexedDB   │   │ │
│  │  │ (render) │  │  (edit)  │  │  (OCR)   │  │  (storage)   │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                     Web Workers                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ PDF.js Worker│  │ OCR Worker   │  │ Compression Worker   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Service Worker                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ Cache API    │  │ Background   │  │ Push Notifications   │ │ │
│  │  │              │  │ Sync         │  │                      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Optional - Cloud Features)
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloud Services                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Auth Service │  │ Cloud Storage│  │ Collaboration Server     │  │
│  │ (OAuth 2.0)  │  │ (Optional)   │  │ (WebSocket - Phase 3)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
paperflow/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # PWA icons
│   └── pdf.worker.min.js      # PDF.js worker
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with routing
│   ├── index.css              # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives
│   │   ├── layout/            # App shell (Header, Sidebar, Toolbar)
│   │   ├── viewer/            # PDF rendering components
│   │   ├── editor/            # Text editing components
│   │   ├── annotations/       # Markup tools
│   │   ├── forms/             # Form field components
│   │   ├── signatures/        # Signature handling
│   │   └── pages/             # Page management
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state stores
│   ├── lib/                   # Core libraries
│   │   ├── pdf/               # PDF rendering and editing
│   │   ├── annotations/       # Annotation management
│   │   ├── signatures/        # Signature handling
│   │   ├── storage/           # IndexedDB operations
│   │   └── export/            # Export functionality
│   ├── pages/                 # Route pages
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript definitions
│   └── constants/             # Application constants
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## PWA Requirements

### Web App Manifest
- Full configuration with icons, splash screens, shortcuts
- Theme color and background color matching brand
- Display mode: standalone

### Service Worker
- Precaching of application shell
- Runtime caching of assets
- Offline-first strategy for static resources

### Offline Storage
- IndexedDB for documents and user data
- LocalStorage for lightweight settings
- Cache API for application assets

### Advanced PWA Features
- Background Sync for queued operations
- Push Notifications for collaboration alerts
- File System Access API for native file handling

## Performance Requirements

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.0 second |
| Largest Contentful Paint (LCP) | < 2.5 seconds |
| Time to Interactive (TTI) | < 3.0 seconds |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100 milliseconds |
| Bundle Size (Initial) | < 200 KB (gzipped) |
| PDF Rendering (10-page doc) | < 2 seconds |

## Security Architecture

### Client-Side Processing
- PDFs processed locally by default
- No upload unless cloud features explicitly used
- Sandboxed PDF rendering

### Encryption
- AES-256 for stored documents
- TLS 1.3 for all network transmission

### Data Retention
- No retention of user documents on servers
- Cloud documents encrypted at rest
- User controls data deletion

### Authentication (Cloud Features)
- OAuth 2.0 + PKCE
- Optional 2FA for paid accounts
- Session management with secure tokens

### Content Security
- Strict CSP headers to prevent XSS
- Subresource Integrity for external resources
- Sandboxed iframes where applicable

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |
| iOS Safari | iOS 15+ |
| Android Chrome | Android 10+ |

## Scalability Considerations

### Client-Side
- Virtualized rendering for large documents
- Lazy loading of pages and thumbnails
- Web Workers for CPU-intensive operations
- Memory management for large files (up to 100MB)

### Future Cloud Infrastructure
- Stateless API design
- Horizontal scaling capability
- CDN for static assets
- Regional deployment for latency
