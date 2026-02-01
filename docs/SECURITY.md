# Security Policy

## Overview

PaperFlow takes security seriously. As a client-side application that processes potentially sensitive PDF documents, we've designed the application with security as a core principle.

## Security Model

### Client-Side Processing

PaperFlow processes all documents locally in your browser. This means:

- **No server uploads**: Your PDFs never leave your device
- **No cloud storage**: Documents are not stored on any external servers
- **No network transmission**: PDF content is not sent over the network
- **Session isolation**: Each browser session is isolated

### Data Storage

Local data is stored using browser APIs:

- **IndexedDB**: Signatures, stamps, recent file metadata
- **LocalStorage**: User preferences and settings
- **Service Worker Cache**: Application assets for offline use

All locally stored data:
- Is sandboxed to the PaperFlow domain
- Cannot be accessed by other websites
- Can be cleared by the user at any time

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: security@paperflow.app
3. Or use GitHub's private vulnerability reporting feature

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2-4 weeks
  - Low: Next release cycle

### What to Expect

- We will keep you informed of progress
- We will credit you in the security advisory (unless you prefer anonymity)
- We will not take legal action against good-faith security researchers

## Security Best Practices

### For Users

1. **Keep your browser updated**: Security patches are regularly released
2. **Use HTTPS**: Always access PaperFlow over HTTPS
3. **Clear sensitive data**: Use Settings > Clear Data when done with sensitive documents
4. **Verify the URL**: Ensure you're on the official PaperFlow domain
5. **Don't install from untrusted sources**: Only install the PWA from the official site

### For Self-Hosting

If you host your own PaperFlow instance:

1. **Use HTTPS**: Configure TLS/SSL certificates
2. **Set security headers**: Use the provided `_headers` file or configure your server
3. **Keep dependencies updated**: Regularly run `npm audit` and update packages
4. **Review Content Security Policy**: Adjust CSP headers for your domain
5. **Enable HSTS**: Force HTTPS connections

## Security Features

### Content Security Policy (CSP)

PaperFlow uses strict CSP headers to prevent:
- Cross-site scripting (XSS) attacks
- Code injection
- Clickjacking
- Data exfiltration

### Input Validation

All user inputs are validated and sanitized:
- File uploads are validated for correct MIME type
- Form inputs are sanitized before processing
- Annotation data is validated before storage

### Signature Security

Saved signatures are:
- Stored only in local IndexedDB
- Never transmitted to any server
- Clearable by the user at any time

## Phase 2 Security Considerations

### Redaction Security

PaperFlow implements true content redaction, not just visual overlays:

- **True content removal**: Redacted content is permanently removed from the PDF structure, not merely covered with a black box
- **Verification system**: After applying redactions, the system verifies that content has been completely removed from the document
- **Metadata scrubbing**: Redaction includes removal of hidden metadata that could contain sensitive information (document properties, embedded objects, XMP data)
- **Audit trail**: All redaction operations are logged for compliance tracking (timestamp, page, region coordinates, operator)
- **Warning system**: Users are warned if redactions cannot be verified as complete; unverified redactions should not be considered secure

**Important**: Always verify redactions before sharing documents. Use the built-in verification tool to confirm content removal.

### Form Script Security

PaperFlow supports basic form calculations and validations with important security limitations:

- **Current implementation**: Form scripts use `new Function()` for evaluation, which has security implications
- **Trusted context only**: Scripts should only be executed in trusted contexts (known, vetted PDFs)
- **Sandbox recommendation**: Before enabling user-provided scripts, implement proper sandboxing (e.g., quickjs-emscripten)
- **API restrictions**: Form scripts have no access to sensitive browser APIs:
  - No `fetch()` or network access
  - No `localStorage` or `IndexedDB` access
  - No DOM manipulation
  - No file system access
- **Execution limits**: Scripts have timeout limits to prevent infinite loops

**Recommendation**: Do not enable form scripts for untrusted PDFs until a proper sandbox implementation is in place.

### OCR Data Handling

PaperFlow's OCR functionality is designed with privacy as a priority:

- **Client-side processing**: All text recognition happens locally using Tesseract.js
- **No external transmission**: Recognized text is never sent to external servers
- **Language file caching**: OCR language models are downloaded once and cached locally in IndexedDB
- **Memory management**: OCR data is processed in memory and cleared after use
- **No training data collection**: Your documents are not used to train any models

### Document Comparison Privacy

The document comparison feature processes documents securely:

- **In-browser processing**: All comparison operations happen entirely in your browser
- **No server uploads**: Neither document is uploaded to any server for comparison
- **Memory-only results**: Comparison results are stored only in memory
- **Session isolation**: Results are cleared when you close the comparison or navigate away
- **No persistent storage**: Comparison data is not saved to IndexedDB or localStorage

### Pattern Matching Security

PaperFlow includes pattern matching for identifying sensitive information:

- **Built-in PII patterns**: Pre-validated patterns for common sensitive data:
  - Social Security Numbers (SSN)
  - Credit card numbers
  - Phone numbers
  - Email addresses
  - Date of birth formats
- **ReDoS protection**: All regex patterns are validated to prevent Regular Expression Denial of Service attacks
- **Pattern validation**: Custom patterns are analyzed for potential performance issues before execution
- **Execution timeouts**: Pattern matching operations have time limits to prevent browser freezing
- **Local processing only**: Pattern matching runs entirely client-side; matched content is never transmitted

**Best practice**: When creating custom patterns, test them with representative sample text before applying to large documents.

## Known Limitations

### PDF Security Features

PaperFlow supports opening password-protected PDFs but:
- Does not enforce document restrictions (print, copy, edit)
- Cannot create password-protected PDFs
- Cannot add digital certificates

### Browser Security

Security is partially dependent on browser implementation:
- Older browsers may have security vulnerabilities
- Browser extensions could potentially access page content
- Malicious browser extensions could intercept data

## Audit History

| Date | Type | Auditor | Status |
|------|------|---------|--------|
| 2026-01 | Internal Review | Development Team | Completed |

## Security Contacts

- **Security Issues**: security@paperflow.app
- **General Issues**: [GitHub Issues](https://github.com/danielsimonjr/PaperFlow/issues)

## Acknowledgments

We thank the following security researchers for responsible disclosure:

- *No reports yet*

---

This security policy is subject to change. Please check back regularly for updates.
