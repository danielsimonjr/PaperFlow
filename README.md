# PaperFlow

**The Modern PDF Editor for Everyone**

PaperFlow is a Progressive Web Application (PWA) that brings professional-grade PDF editing to the browser. No installation required, works offline, and keeps your documents private with local-first processing.

## Features

PaperFlow includes a comprehensive set of PDF editing features spanning two major development phases.

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

### Why PaperFlow?
- **Zero Installation** - Works instantly in any modern browser
- **Offline Support** - Full functionality without internet connection
- **Privacy First** - Documents processed locally by default
- **Cross-Platform** - Seamless experience on desktop, tablet, and mobile

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/paperflow.git
cd paperflow

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:coverage` | Run tests with coverage report |

### Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** Zustand
- **PDF Rendering:** PDF.js
- **PDF Manipulation:** pdf-lib
- **OCR:** Tesseract.js (50+ languages)
- **PWA:** Workbox via vite-plugin-pwa

### Project Structure

```
paperflow/
├── public/              # Static assets and PWA icons
├── src/
│   ├── components/      # React components by feature
│   │   ├── ui/          # Reusable UI primitives
│   │   ├── layout/      # App shell components
│   │   ├── viewer/      # PDF rendering
│   │   ├── editor/      # Text editing
│   │   ├── annotations/ # Markup tools
│   │   ├── forms/       # Form fields
│   │   └── signatures/  # Signature handling
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand state stores
│   ├── lib/             # Core libraries
│   ├── pages/           # Route pages
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── constants/       # App constants
├── tests/               # Unit, integration, and e2e tests
└── docs/                # Documentation
    ├── roadmap/         # Product roadmap
    └── planning/        # Development plans
```

## Documentation

- [Product Roadmap](docs/roadmap/ROADMAP.md)
- [Phase 1 Development Plan](docs/planning/PHASE_1_DEVELOPMENT_PLAN.md)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF rendering library
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Lucide](https://lucide.dev/) - Beautiful icons
