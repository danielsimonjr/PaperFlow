import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDF_CONTENT_DARK_CLASS, pdfContentDarkClass } from '@/lib/pdf/contentDarkMode';

describe('pdf content dark mode', () => {
  it('names the invert class only while dark mode is on', () => {
    expect(pdfContentDarkClass(true)).toBe(PDF_CONTENT_DARK_CLASS);
    expect(pdfContentDarkClass(false)).toBe('');
  });

  it('inverts only the PDF bitmap, and print drops that filter', () => {
    const indexCss = readFileSync(resolve(__dirname, '../../../../src/index.css'), 'utf8');
    const darkCss = readFileSync(resolve(__dirname, '../../../../src/styles/dark-mode.css'), 'utf8');
    const css = `${indexCss}\n${darkCss}`;

    expect(css).toContain(`canvas.pdf-content-canvas.${PDF_CONTENT_DARK_CLASS}`);
    expect(css).toContain('filter: invert(1) hue-rotate(180deg)');
    expect(css).not.toMatch(/\.pdf-page-invert\s+canvas\b/);
    expect(css).not.toMatch(/\.pdf-page-invert[^{]*\.textLayer/);
    expect(css).toMatch(/@media print\s*\{[^}]*canvas\.pdf-content-canvas[^}]*filter:\s*none !important/s);
  });
});
