import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDF_CONTENT_DARK_CLASS, pdfContentDarkClass } from '@/lib/pdf/contentDarkMode';

describe('pdf content dark mode', () => {
  it('names the invert class only while dark mode is on', () => {
    expect(pdfContentDarkClass(true)).toBe(PDF_CONTENT_DARK_CLASS);
    expect(pdfContentDarkClass(false)).toBe('');
  });

  it('inverts the canvas and the text layer in the loaded stylesheet', () => {
    const css = readFileSync(resolve(__dirname, '../../../../src/index.css'), 'utf8');
    expect(css).toContain(`.dark .${PDF_CONTENT_DARK_CLASS} canvas`);
    expect(css).toContain(`.dark .${PDF_CONTENT_DARK_CLASS} .textLayer`);
    expect(css).toContain('filter: invert(1) hue-rotate(180deg)');
  });
});
