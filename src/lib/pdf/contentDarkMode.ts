/**
 * Class for the PDF bitmap canvas while dark mode is on.
 * It is applied to that canvas only. Highlights, drawings, signatures,
 * and the text layer stay outside the filter.
 */
export const PDF_CONTENT_DARK_CLASS = 'pdf-page-invert';

/**
 * Return the invert class when dark mode is on, and an empty string otherwise.
 */
export function pdfContentDarkClass(darkMode: boolean): string {
  return darkMode ? PDF_CONTENT_DARK_CLASS : '';
}
