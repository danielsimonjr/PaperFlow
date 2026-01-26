# PaperFlow

**The Modern PDF Editor for Everyone**

PaperFlow is a Progressive Web Application (PWA) that brings professional-grade PDF editing to the browser. No installation required, works offline, and keeps your documents private with local-first processing.

## Features

### Core Capabilities
- **PDF Viewing** - High-fidelity rendering with smooth zoom, multiple view modes, and dark mode support
- **Text Editing** - Direct text editing with automatic font matching
- **Annotations** - Highlight, underline, strikethrough, sticky notes, freehand drawing, and shapes
- **Form Filling** - Automatic field detection with support for text, checkboxes, radio buttons, and dropdowns
- **Digital Signatures** - Draw, type, or upload signatures with secure storage
- **Page Management** - Reorder, delete, rotate, merge, and split PDFs

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
