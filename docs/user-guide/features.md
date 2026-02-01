# PaperFlow Features

This document provides detailed information about all PaperFlow features.

## Document Viewing

### PDF Rendering
PaperFlow uses PDF.js to render PDFs with high fidelity directly in your browser.

- **High-quality rendering** at any zoom level
- **Text layer** for selection and searching
- **Embedded fonts** rendered correctly
- **Vector graphics** preserved

### View Modes
- **Single Page**: View one page at a time
- **Continuous**: Scroll through all pages
- **Two-Page Spread**: View two pages side by side

### Navigation
- **Page thumbnails** for quick navigation
- **Document outline** (bookmarks) if available
- **Page number input** for direct navigation
- **Keyboard shortcuts** for efficient navigation

## Annotations

### Text Markup
- **Highlight**: Mark important text with color
- **Underline**: Add underlines to text
- **Strikethrough**: Cross out text

Colors available: Yellow, Green, Blue, Pink, Orange

### Notes & Comments
- **Sticky Notes**: Add comments anywhere on the page
- **Note Replies**: Thread conversations on notes
- **Note Colors**: Customize note appearance

### Drawing Tools
- **Freehand Drawing**: Draw with pen/pencil tool
- **Line Thickness**: Adjustable from 1-20px
- **Colors**: Full color palette available
- **Eraser**: Remove parts of drawings

### Shapes
- **Rectangle**: Draw rectangular boxes
- **Circle/Ellipse**: Draw circular shapes
- **Arrow**: Point to specific areas
- **Line**: Draw straight lines

### Stamps
- **Preset Stamps**: Approved, Rejected, Draft, etc.
- **Custom Stamps**: Upload your own images
- **Date Stamps**: Auto-insert current date

## Form Filling

### Supported Field Types
- **Text Fields**: Single and multi-line
- **Checkboxes**: Toggle on/off
- **Radio Buttons**: Select one option
- **Dropdowns**: Choose from a list
- **Date Fields**: Date picker support

### Form Features
- **Auto-detection** of form fields
- **Tab navigation** between fields
- **Required field** indication
- **Validation** for field formats

### Form Export
- **FDF Export**: Standard form data format
- **XFDF Export**: XML-based form data
- **PDF with Data**: Save filled form as PDF

## Digital Signatures

### Signature Creation
- **Draw**: Sign with mouse or touch
- **Type**: Generate from typed name
- **Upload**: Use an image file

### Signature Management
- **Save signatures** for reuse
- **Multiple signatures** supported
- **Initials** support

### Signature Placement
- **Resize** signatures to fit
- **Position** anywhere on page
- **Date stamps** with signatures

## Text Editing

### Text Boxes
- **Add text** anywhere on the document
- **Font selection** with fallback support
- **Size adjustment** from 8-72pt
- **Color options** for text

### Text Formatting
- **Bold, Italic, Underline**
- **Text alignment** (left, center, right)
- **Line spacing** adjustment

## Page Management

### Page Operations
- **Rotate**: 90° clockwise/counter-clockwise
- **Delete**: Remove unwanted pages
- **Duplicate**: Copy pages
- **Extract**: Save selected pages as new PDF

### Page Reordering
- **Drag and drop** in thumbnail view
- **Multi-select** for bulk operations

### Merge & Split
- **Merge PDFs**: Combine multiple files
- **Split PDF**: Divide into separate files
- **Page ranges**: Select specific pages

## Export & Print

### Export Formats
- **PDF**: With editable annotations
- **Flattened PDF**: Annotations baked in
- **PNG**: High-quality image
- **JPEG**: Compressed image

### Export Options
- **Page selection**: All, current, or range
- **DPI settings** for images
- **Quality** adjustment for JPEG

### Print Features
- **Print preview** before printing
- **Page range** selection
- **Include/exclude annotations**
- **Orientation** control

## Sharing

### Share Options
- **Copy Link**: Generate shareable link
- **Email**: Open email with attachment
- **QR Code**: For mobile access

## Offline Support

### PWA Features
- **Install as app** on desktop/mobile
- **Offline access** to recent documents
- **Background sync** when online

### Local Storage
- **Recent files** list
- **Saved signatures** persist
- **User preferences** remembered

## Accessibility

### Screen Reader Support
- **ARIA labels** on all controls
- **Focus management** for keyboard users
- **Announcements** for dynamic content

### Keyboard Navigation
- **Full keyboard control** of all features
- **Skip links** for efficient navigation
- **Visible focus indicators**

### Visual Accessibility
- **High contrast** support
- **Reduced motion** respect
- **Scalable UI** for zoom

## Text Recognition (OCR)

### Convert Scanned Documents
Transform your scanned documents and images into fully searchable PDFs.

- **Searchable PDFs**: Convert any scanned document into text you can search, copy, and edit
- **50+ Languages**: Support for over 50 languages including English, Spanish, French, German, Chinese, Japanese, and more
- **Image Text Recognition**: Extract text from photos, screenshots, and image-based PDFs
- **Layout Preservation**: Maintain the original document layout during recognition

### How to Use OCR
1. Open a scanned document or image-based PDF
2. Select **Tools > Text Recognition**
3. Choose your document language(s)
4. Click **Recognize Text** and wait for processing
5. Your document is now searchable

## Form Designer

### Create Fillable Forms
Build professional fillable forms from scratch without leaving your browser.

- **Text Fields**: Single-line and multi-line text input
- **Checkboxes**: For yes/no or multiple-choice selections
- **Radio Buttons**: For single-selection option groups
- **Dropdowns**: Create selection lists with predefined options
- **Date Fields**: Date pickers for easy date entry
- **Signature Fields**: Designated areas for signatures

### Advanced Form Features
- **Calculations**: Set up automatic calculations between fields (totals, percentages, etc.)
- **Conditional Rules**: Show or hide fields based on other field values
- **Required Fields**: Mark fields as mandatory
- **Field Validation**: Ensure correct data formats (email, phone, etc.)
- **Tab Order**: Control navigation between fields

### How to Create a Form
1. Open any PDF or start with a blank document
2. Select **Tools > Form Designer**
3. Drag and drop field types onto your document
4. Configure field properties (name, default value, validation)
5. Save your fillable form

## Redaction

### Permanently Remove Sensitive Information
Protect confidential data by permanently removing it from your documents.

- **Permanent Removal**: Redacted content is completely and irreversibly removed from the file
- **Pattern Search**: Find and redact common patterns like Social Security numbers, phone numbers, and email addresses
- **Text Search**: Search for specific words or phrases to redact
- **Visual Marking**: Mark areas to redact before applying
- **Verification**: Confirm all redactions are complete before saving

### Compliance Features
- **Audit Logs**: Generate detailed logs of all redactions for compliance requirements
- **Redaction Codes**: Label redactions with exemption codes (FOIA, HIPAA, etc.)
- **Batch Redaction**: Apply the same redaction across multiple pages

### How to Redact Content
1. Open the document containing sensitive information
2. Select **Tools > Redaction**
3. Use **Search & Redact** for patterns or **Mark for Redaction** for manual selection
4. Review all marked redactions
5. Click **Apply Redactions** to permanently remove content
6. Save the redacted document

> **Important**: Redaction is permanent. Always keep a backup of the original document before redacting.

## Document Comparison

### Compare Document Versions
Easily identify differences between two versions of a document.

- **Side-by-Side View**: Display both documents next to each other with differences highlighted
- **Overlay View**: See differences overlaid on a single view
- **Difference Navigation**: Jump between changes with next/previous buttons
- **Change Categories**: Distinguish between text additions, deletions, and modifications
- **Summary Panel**: View a complete list of all changes

### Comparison Reports
- **Export Report**: Generate a detailed report of all differences
- **Change Statistics**: See counts of additions, deletions, and modifications
- **Page-by-Page Breakdown**: Identify which pages have changes

### How to Compare Documents
1. Select **Tools > Compare Documents**
2. Choose the original document
3. Choose the revised document
4. Click **Compare**
5. Navigate through differences and export a report if needed

## Batch Processing

### Apply Changes to Multiple Pages
Efficiently process entire documents or multiple files at once.

### Watermarks
- **Text Watermarks**: Add text overlays (e.g., "CONFIDENTIAL", "DRAFT")
- **Image Watermarks**: Use logos or stamps as watermarks
- **Positioning**: Place watermarks anywhere on the page
- **Opacity Control**: Adjust transparency for subtle or prominent marks
- **Page Selection**: Apply to all pages or specific ranges

### Headers & Footers
- **Page Numbers**: Auto-numbering with customizable formats
- **Document Title**: Insert filename or custom text
- **Date/Time**: Add current or custom dates
- **Custom Text**: Add any text to headers or footers
- **Positioning**: Left, center, or right alignment

### Bates Numbering
Essential for legal document management and discovery.

- **Sequential Numbering**: Apply unique identifiers to every page
- **Prefix/Suffix**: Add custom text before or after numbers
- **Starting Number**: Begin numbering from any value
- **Digit Padding**: Control number of digits (e.g., 000001)
- **Position Options**: Place numbers in margins or corners

### Document Flattening
- **Flatten Annotations**: Permanently embed annotations into the document
- **Flatten Forms**: Convert fillable forms to static content
- **Archive Ready**: Prepare documents for long-term storage

### How to Use Batch Processing
1. Open your document or select multiple files
2. Select **Tools > Batch Processing**
3. Choose the operation (Watermark, Header/Footer, Bates, Flatten)
4. Configure your settings
5. Preview the results
6. Apply to selected pages or entire document

## Accessibility Checker

### Ensure Document Accessibility
Make your documents accessible to everyone, including users with disabilities.

### Compliance Checking
- **WCAG Standards**: Check against Web Content Accessibility Guidelines
- **PDF/UA Standards**: Verify PDF Universal Accessibility compliance
- **Section 508**: Ensure US federal accessibility requirements are met

### Issue Detection
- **Document Structure**: Verify proper heading hierarchy and reading order
- **Alternative Text**: Check that images have descriptive alt text
- **Color Contrast**: Ensure text meets contrast ratio requirements
- **Table Structure**: Validate proper table headers and relationships
- **Language Settings**: Confirm document language is specified
- **Bookmarks**: Check for navigational bookmarks in long documents

### Accessibility Reports
- **Issue Summary**: Overview of all accessibility problems found
- **Severity Levels**: Prioritize issues by critical, moderate, and minor
- **Remediation Guidance**: Get specific instructions to fix each issue
- **Export Report**: Generate PDF or HTML accessibility reports

### How to Check Accessibility
1. Open the document you want to check
2. Select **Tools > Accessibility Checker**
3. Choose the standards to check against
4. Click **Run Check**
5. Review the results and follow guidance to fix issues
6. Re-run the check to verify fixes

## Performance

### Optimization
- **Virtualized rendering** for large documents
- **Lazy loading** of pages
- **Thumbnail caching** for speed
- **Memory management** for stability

### Supported Documents
- **Size**: Up to 100MB
- **Pages**: Up to 1000+ pages
- **Complex PDFs** with images and graphics
