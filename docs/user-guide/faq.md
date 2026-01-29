# Frequently Asked Questions

## General

### What is PaperFlow?
PaperFlow is a free, web-based PDF editor that runs entirely in your browser. You can view, annotate, fill forms, sign, and edit PDF documents without installing any software.

### Is PaperFlow free?
Yes, PaperFlow is completely free to use with no hidden fees, subscriptions, or premium tiers.

### Do I need to create an account?
No, PaperFlow works without any account or login. Your documents and data stay on your device.

### Is PaperFlow safe for sensitive documents?
Yes. PaperFlow processes all documents locally in your browser. Your files are never uploaded to any server. All processing happens entirely on your device.

## Documents

### What file types can I open?
PaperFlow supports PDF files (.pdf). We recommend using PDF/A format for best compatibility.

### Is there a file size limit?
PaperFlow can handle PDFs up to 100MB. For best performance, we recommend keeping files under 50MB.

### Why won't my PDF open?
Some PDFs may fail to open due to:
- **Password protection**: Enter the password when prompted
- **Corrupted file**: Try re-downloading or recreating the PDF
- **Unsupported features**: Some advanced PDF features may not be supported

### Can I open password-protected PDFs?
Yes, PaperFlow supports password-protected PDFs. You'll be prompted to enter the password when opening the file.

## Editing & Annotations

### Are my annotations saved automatically?
No, you need to save your document manually using the Save button or `Ctrl+S`. We recommend saving frequently.

### Can I undo my changes?
Yes, use `Ctrl+Z` to undo and `Ctrl+Y` to redo. The undo history is available during your editing session.

### How do I delete an annotation?
Click on the annotation to select it, then press the `Delete` key or click the delete button that appears.

### Can I edit the original text in a PDF?
PaperFlow allows you to add new text boxes over the document, but cannot directly edit the original PDF text. This is a limitation of the PDF format.

## Forms

### Why aren't form fields detected?
Form fields are only detected in PDFs that have interactive form fields embedded. Scanned documents or PDFs with form-like appearances but no actual fields won't be detected.

### Can I save filled form data separately?
Yes, you can export form data as FDF or XFDF format, which can be imported into the same form later.

## Signatures

### Where are my signatures stored?
Signatures are stored locally in your browser's storage (IndexedDB). They persist between sessions but are tied to your browser.

### Are my signatures secure?
Yes, signatures are stored only on your device and are never transmitted to any server.

### How do I delete a saved signature?
Go to the signature panel, hover over the signature you want to delete, and click the delete (trash) icon.

## Printing & Export

### Why does my print look different from the screen?
Print rendering may differ slightly due to:
- Browser print settings
- Printer capabilities
- Paper size differences

For best results, use the "Export as PDF" option and print that file.

### What's the difference between Save and Export?
- **Save**: Creates a PDF with editable annotations
- **Export (Flatten)**: Bakes annotations permanently into the PDF

### Can I export just specific pages?
Yes, when exporting you can choose to export all pages, the current page, or a custom page range.

## Offline & PWA

### Can I use PaperFlow offline?
Yes, if you install PaperFlow as a PWA (Progressive Web App). Click the install button in your browser to add it to your device.

### How do I install PaperFlow as an app?
1. Open PaperFlow in Chrome, Edge, or Safari
2. Look for the install icon in the address bar
3. Click "Install" when prompted

### Where is my data stored when offline?
Data is stored in your browser's local storage and IndexedDB. This data persists between sessions.

## Troubleshooting

### PaperFlow is running slowly
Try these steps:
1. Close other browser tabs
2. Use a smaller PDF file
3. Clear browser cache
4. Try a different browser

### My changes weren't saved
Make sure to click the Save button or press `Ctrl+S` before closing. PaperFlow doesn't auto-save to prevent accidental changes.

### The PDF looks blurry
Try:
1. Zooming in using the zoom controls
2. Checking your display scaling settings
3. Using a higher DPI export setting

### Keyboard shortcuts aren't working
Make sure:
1. The PaperFlow window is focused
2. No text field is active
3. Your keyboard layout is correct

## Browser Support

### Which browsers are supported?
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+ (Chromium-based)

### Why isn't Internet Explorer supported?
Internet Explorer lacks modern web APIs required by PaperFlow. Please use a modern browser like Chrome, Firefox, Safari, or Edge.

### Does PaperFlow work on mobile?
Yes, PaperFlow is fully responsive and works on tablets and phones. Touch gestures like pinch-to-zoom and swipe navigation are supported.

## Privacy & Security

### Is my data collected?
No personal data is collected. We only collect anonymous usage statistics (page views, feature usage) to improve the application.

### Are my documents uploaded anywhere?
No. All document processing happens locally in your browser. Your files never leave your device.

### What data is stored locally?
- Recent file list (names only, not content)
- User preferences (theme, zoom level, etc.)
- Saved signatures (encrypted)
- Stamps you've added

### How do I clear my data?
1. Clear your browser's storage for the PaperFlow site
2. Or use the "Clear Data" option in Settings

## Getting Help

### How do I report a bug?
Please report bugs on our [GitHub Issues](https://github.com/danielsimonjr/PaperFlow/issues) page with:
- Steps to reproduce
- Browser and OS version
- Screenshots if applicable

### Can I request a feature?
Yes! Submit feature requests on [GitHub Issues](https://github.com/danielsimonjr/PaperFlow/issues) with the "enhancement" label.

### Is there a community forum?
Check our [GitHub Discussions](https://github.com/danielsimonjr/PaperFlow/discussions) for community support.
