/**
 * Class that inverts the PDF canvas and the text layer while dark mode is on.
 */
export const PDF_CONTENT_DARK_CLASS = 'pdf-page-invert';

/**
 * Return the invert class when dark mode is on, and an empty string otherwise.
 */
export function pdfContentDarkClass(darkMode: boolean): string {
  return darkMode ? PDF_CONTENT_DARK_CLASS : '';
}
