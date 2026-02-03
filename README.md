# PaperFlow

**The Modern PDF Editor for Everyone**

[![Windows](https://img.shields.io/badge/Windows-10%2F11-blue?logo=windows)](https://github.com/yourusername/paperflow/releases)
[![macOS](https://img.shields.io/badge/macOS-12%2B-black?logo=apple)](https://github.com/yourusername/paperflow/releases)
[![Linux](https://img.shields.io/badge/Linux-Ubuntu%2FDebian%2FFedora-orange?logo=linux)](https://github.com/yourusername/paperflow/releases)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?logo=pwa)](https://paperflow.app)

PaperFlow is a comprehensive PDF editing solution available as both a Progressive Web Application (PWA) and a native desktop application. It brings professional-grade PDF editing to the browser and desktop with offline capabilities and a privacy-first approach (local processing by default).

## Installation

### Desktop Application (Recommended)

Download the latest release for your platform:

| Platform | Download | Format |
|----------|----------|--------|
| **Windows** | [Download](https://github.com/yourusername/paperflow/releases) | NSIS Installer, MSI, Portable |
| **macOS** | [Download](https://github.com/yourusername/paperflow/releases) | DMG (Universal: Intel + Apple Silicon) |
| **Linux** | [Download](https://github.com/yourusername/paperflow/releases) | AppImage, deb, rpm, snap |

#### Windows Installation

```powershell
# Using winget (coming soon)
winget install PaperFlow

# Or download and run the installer
# Silent install: PaperFlow-Setup.exe /S
# MSI silent install: msiexec /i PaperFlow.msi /qn
```

#### macOS Installation

```bash
# Download DMG and drag to Applications
# Or use Homebrew (coming soon)
brew install --cask paperflow
```

#### Linux Installation

```bash
# Ubuntu/Debian
sudo dpkg -i paperflow_*.deb
sudo apt-get install -f

# Fedora/RHEL
sudo rpm -i paperflow-*.rpm

# Snap
sudo snap install paperflow

# AppImage (portable, no install needed)
chmod +x PaperFlow-*.AppImage
./PaperFlow-*.AppImage
```

### Web Application (PWA)

Visit [https://paperflow.app](https://paperflow.app) and click "Install" to add PaperFlow to your device.

## Features

PaperFlow includes a comprehensive set of PDF editing features spanning three major development phases.

### Core PDF Editing (Phase 1)

#### PDF Viewing and Navigation
- High-fidelity rendering with smooth zoom and pan
- Multiple view modes (single page, continuous scroll, two-page spread)
- Dark mode support for comfortable reading
- Thumbnail navigation and page jumping

#### Annotations
- **Highlight** - Mark important text with customizable colors
- **Underline** - Emphasize text passages
- **Strikethrough** - Mark text for deletion or review
- **Sticky Notes** - Add comments and notes anywhere on the page
- **Freehand Drawing** - Sketch and annotate with drawing tools
- **Shapes** - Add rectangles, circles, arrows, and lines

#### Form Filling
- Automatic field detection
- Support for text fields, checkboxes, radio buttons, and dropdowns
- Form data validation
- FDF/XFDF import and export

#### Digital Signatures
- Draw signatures with mouse or touch
- Type signatures with font selection
- Upload signature images
- Secure local storage for saved signatures
- Date field insertion

#### Page Management
- Reorder pages with drag-and-drop
- Delete unwanted pages
- Rotate pages (90, 180, 270 degrees)
- Merge multiple PDFs into one
- Split PDFs into separate documents
- Extract specific pages

#### Text Editing
- Direct text editing on PDF pages
- Automatic font matching and fallback
- Font size and style adjustments

#### Export Options
- Save edited PDFs with embedded changes
- Export pages as images (PNG, JPEG)
- PDF compression and optimization
- Flatten annotations into the document

#### Print Functionality
- Print entire documents or page ranges
- Print preview with layout options
- Custom page scaling

#### Share Functionality
- Copy to clipboard
- Email sharing integration

### Premium Features (Phase 2)

#### OCR for Scanned Documents
- Convert scanned PDFs to searchable text
- Support for 50+ languages via Tesseract.js
- Automatic language detection
- Maintains original document layout

#### Form Creation and Designer
- Create interactive PDF forms from scratch
- Add text fields, checkboxes, radio buttons, and dropdowns
- Configure field properties and validation rules
- Design custom form layouts

#### Redaction Tools
- **True Redaction** - Permanently remove sensitive content
- **Pattern Search** - Find and redact by pattern (SSN, phone numbers, emails)
- Preview redactions before applying
- Secure removal with no data recovery

#### Document Comparison
- **Side-by-Side View** - Compare two documents simultaneously
- **Overlay Mode** - View differences highlighted on a single view
- Text difference highlighting
- Change navigation and summary

#### Batch Processing
- **Watermarks** - Add text or image watermarks to multiple documents
- **Headers/Footers** - Insert consistent headers and footers
- **Bates Numbering** - Apply sequential numbering for legal documents
- Process multiple files in one operation

#### Accessibility Checker
- PDF/UA compliance validation
- Accessibility issue detection
- Remediation suggestions
- Structure and tag verification

### Desktop Application Features (Phase 3)

#### Native Desktop Experience
- **Native File System** - Direct file access without browser limitations
- **File Associations** - Double-click PDFs to open in PaperFlow
- **Recent Files** - Quick access to recently opened documents
- **Auto-Save** - Automatic saving with crash recovery
- **File Watching** - Detect external changes and reload

#### System Integration
- **System Tray** - Quick access from system tray/menu bar
- **Native Notifications** - OS-level notifications for operations
- **Keyboard Shortcuts** - Platform-specific shortcuts (Cmd/Ctrl)
- **Context Menus** - Right-click menus with native look
- **Deep Links** - Open files via `paperflow://` protocol

#### Offline-First Architecture
- Full functionality without internet connection
- Local document storage with IndexedDB
- Automatic sync when back online
- Conflict resolution for concurrent edits
- Delta sync for large documents

#### Native Print Integration
- System print dialog with all printer options
- Silent printing to specific printers
- Print queue management
- PDF to printer output

#### Scanner Integration (Desktop Only)
- TWAIN/WIA scanner support (Windows)
- SANE support (Linux)
- ImageCapture support (macOS)
- Multi-page and duplex scanning
- Auto-crop and deskew
- Scan profiles for quick access

#### Hardware Security (Desktop Only)
- FIDO2/WebAuthn hardware key support
- Document signing with security keys
- Hardware-backed encryption
- Multi-key document access

#### Auto-Updates
- Automatic update checking
- Delta updates for faster downloads
- Update channels (stable, beta, alpha)
- Silent installation on quit

#### Platform-Specific Features

**Windows:**
- Jump Lists with recent files
- Taskbar progress and overlays
- Thumbnail toolbar buttons
- MSI/MSIX for enterprise deployment
- Group Policy (GPO) support

**macOS:**
- Touch Bar support with context-aware controls
- Dock badge and bounce notifications
- Universal binary (Intel + Apple Silicon)
- Notarized and signed for Gatekeeper
- MDM profile support

**Linux:**
- AppImage, deb, rpm, snap packages
- GNOME/KDE integration
- Unity launcher quicklists
- XDG desktop integration

### Enterprise Features (Phase 3 Q4)

#### Deployment & Management
- **MDM/GPO Support** - Deploy via Microsoft Intune, Jamf, SCCM
- **ADMX Templates** - Windows Group Policy configuration
- **Configuration Profiles** - macOS MDM deployment
- **Centralized Config** - Remote configuration management

#### Licensing
- **Offline Validation** - Works without constant internet
- **Hardware Binding** - Secure license to device
- **Seat Management** - Multi-user license support
- **Feature Gating** - Edition-based feature access

#### LAN Collaboration
- **Peer Discovery** - Find colleagues on local network
- **Document Sharing** - Share PDFs over LAN
- **Real-time Sync** - Collaborative editing without cloud

#### Kiosk Mode
- **Locked Interface** - Restricted feature access
- **Session Management** - Auto-reset between users
- **Touch-Friendly** - Optimized for touchscreens
- **Remote Management** - Admin control and monitoring

### Why PaperFlow?

- **Zero Installation (PWA)** - Works instantly in any modern browser
- **Native Desktop App** - Full OS integration when needed
- **Offline Support** - Full functionality without internet connection
- **Privacy First** - Documents processed locally by default
- **Cross-Platform** - Seamless experience on Windows, macOS, Linux, and web

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/paperflow.git
cd paperflow

# Install dependencies
npm install

# Start development server (web)
npm run dev

# Start development server (Electron)
npm run electron:dev
```

The web app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build web app
npm run build
npm run preview

# Build desktop app (all platforms)
npm run electron:build

# Build for specific platform
npm run electron:build -- --win    # Windows
npm run electron:build -- --mac    # macOS
npm run electron:build -- --linux  # Linux
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web development server |
| `npm run build` | Build web app for production |
| `npm run preview` | Preview production web build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run end-to-end tests (web) |
| `npm run test:e2e-electron` | Run end-to-end tests (desktop) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run electron:dev` | Start Electron development mode |
| `npm run electron:build` | Build desktop app for distribution |
| `npm run electron:preview` | Preview desktop app build |

### Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Desktop:** Electron 40
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** Zustand
- **PDF Rendering:** PDF.js
- **PDF Manipulation:** pdf-lib
- **OCR:** Tesseract.js (50+ languages)
- **PWA:** Workbox via vite-plugin-pwa
- **Testing:** Vitest + Playwright

### Project Structure

```
paperflow/
├── public/              # Static assets and PWA icons
├── electron/            # Electron desktop app
│   ├── main/            # Main process
│   │   ├── index.ts     # App entry point
│   │   ├── windowManager.ts
│   │   ├── lifecycle.ts
│   │   ├── security.ts
│   │   ├── updater.ts
│   │   ├── print/       # Native print integration
│   │   ├── scanner/     # Scanner bridge
│   │   ├── security/    # WebAuthn bridge
│   │   └── updates/     # Auto-updater
│   ├── preload/         # Preload scripts
│   ├── ipc/             # IPC handlers and channels
│   ├── workers/         # Worker threads
│   └── resources/       # Icons and installers
├── src/
│   ├── components/      # React components by feature
│   │   ├── ui/          # Reusable UI primitives
│   │   ├── layout/      # App shell components
│   │   ├── viewer/      # PDF rendering
│   │   ├── editor/      # Text editing
│   │   ├── annotations/ # Markup tools
│   │   ├── forms/       # Form fields
│   │   ├── signatures/  # Signature handling
│   │   ├── scanner/     # Scanner UI
│   │   ├── security/    # Hardware key UI
│   │   ├── offline/     # Offline indicators
│   │   ├── update/      # Auto-update UI
│   │   ├── enterprise/  # Enterprise config UI
│   │   ├── kiosk/       # Kiosk mode UI
│   │   └── batch/       # Batch processing UI
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand state stores
│   ├── lib/             # Core libraries
│   │   ├── pdf/         # PDF operations
│   │   ├── electron/    # Electron API wrappers
│   │   ├── offline/     # Offline sync engine
│   │   ├── license/     # License validation
│   │   ├── scanner/     # Scanner providers
│   │   ├── security/    # WebAuthn client
│   │   ├── enterprise/  # Enterprise config
│   │   ├── lan/         # LAN collaboration
│   │   └── kiosk/       # Kiosk mode logic
│   ├── pages/           # Route pages
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── constants/       # App constants
├── tests/               # Unit, integration, and e2e tests
└── docs/                # Documentation
    ├── roadmap/         # Product roadmap
    ├── planning/        # Development plans
    └── architecture/    # Technical architecture
```

## Documentation

- [Product Roadmap](docs/roadmap/ROADMAP.md)
- [Phase 1 Development Plan](docs/planning/PHASE_1_DEVELOPMENT_PLAN.md)
- [Phase 2 Development Plan](docs/planning/PHASE_2_DEVELOPMENT_PLAN.md)
- [Phase 3 Development Plan](docs/planning/PHASE_3_DEVELOPMENT_PLAN.md)
- [Offline Architecture](docs/architecture/offline-first.md)
- [Electron Architecture](docs/architecture/electron-architecture.md)

## Platform Support

| Platform | Minimum Version | Architecture |
|----------|-----------------|--------------|
| Windows | Windows 10 1903 | x64, arm64 |
| macOS | macOS 12 (Monterey) | Universal (x64, arm64) |
| Ubuntu | 20.04 LTS | x64 |
| Fedora | 37 | x64 |
| Debian | 11 | x64 |

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF rendering library
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
