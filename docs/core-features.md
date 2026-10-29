# Core features

PaperFlow is a PDF reader. The core stays small. Everything else is an optional module, and every optional module is off until a setting turns it on.

The source of truth is `src/core/features.ts`. This page lists the same ids, in the same order. A unit test fails when the two lists drift.

## Core

| Id | Name | Behavior |
| --- | --- | --- |
| page-navigation | Page navigation | Move between pages with controls and keyboard shortcuts. |
| pages-toc-sidebar | Pages and contents sidebar | Show or hide a sidebar of page thumbnails and the table of contents. |
| zoom-fit | Zoom and fit | Zoom the page, and fit the page to the view. |
| rotate | Rotate | Rotate the current page. |
| draw | Draw | Draw with a chosen color, then move or recolor an existing drawing. |
| highlight | Highlight | Highlight selected text. |
| text-notes | Text notes | Add a text note on the page. |
| signatures | Signatures | Sign by drawing, by uploading an image, or by camera. The camera capture mirrors the frame so the ink reads correctly. Saved signatures stay available for reuse. |
| pdf-dark-mode | PDF dark mode | Dark mode inverts the PDF page itself, not only the surrounding chrome. |
| export-save | Export and save | Save the document and export it. |
| print | Print | Print the open document. |
| drag-drop-open | Drag and drop open | Open a PDF by dropping the file on the app. |

## Optional modules

These modules stay in the repository. The default app does not load them. Each one has `defaultEnabled: false`. The settings page stores the flag in `optionalModules`. Turning a flag on dynamic-imports that module.

| Id | Name | Stores |
| --- | --- | --- |
| enterprise | Enterprise | enterprisePolicyStore |
| license | License | licenseStore |
| kiosk | Kiosk | kioskStore |
| lan | LAN | lanStore |
| scanner | Scanner | scannerStore |
| batch | Batch | batchStore, nativeBatchStore |
| comparison | Comparison | comparisonStore |
| fileWatch | File watch | fileWatchStore |

## What stays out of the core

Form filling, text editing, OCR, redaction, stamps, shapes, and page merge or split remain in the codebase. They are not part of the core catalog above, and they are not in the optional-module list. Later work can move more of them behind the same flag mechanism. Do not delete them to make the core look smaller.
