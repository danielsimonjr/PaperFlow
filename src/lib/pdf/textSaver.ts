import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TextBox } from '@/types/text';
import { getFontFallback } from '@lib/fonts/fontFallback';

/**
 * Maps font family names to pdf-lib StandardFonts.
 */
const fontMapping: Record<string, StandardFonts> = {
  Arial: StandardFonts.Helvetica,
  'Arial Black': StandardFonts.HelveticaBold,
  'Times New Roman': StandardFonts.TimesRoman,
  'Courier New': StandardFonts.Courier,
  Helvetica: StandardFonts.Helvetica,
  Times: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
  Georgia: StandardFonts.TimesRoman,
  Verdana: StandardFonts.Helvetica,
  Tahoma: StandardFonts.Helvetica,
  'Trebuchet MS': StandardFonts.Helvetica,
  'Comic Sans MS': StandardFonts.Helvetica,
  Impact: StandardFonts.HelveticaBold,
  'Lucida Console': StandardFonts.Courier,
  'Lucida Sans': StandardFonts.Helvetica,
  'Palatino Linotype': StandardFonts.TimesRoman,
  'Book Antiqua': StandardFonts.TimesRoman,
  Calibri: StandardFonts.Helvetica,
  Cambria: StandardFonts.TimesRoman,
};

/**
 * Get the pdf-lib standard font for a given font family.
 */
function getStandardFont(
  fontFamily: string,
  isBold: boolean,
  isItalic: boolean
): StandardFonts {
  // First try direct mapping
  let baseFont = fontMapping[fontFamily];

  // If not found, use fallback
  if (!baseFont) {
    const fallback = getFontFallback(fontFamily);
    baseFont = fontMapping[fallback.fontFamily] || StandardFonts.Helvetica;
  }

  // Apply bold/italic variants
  if (baseFont === StandardFonts.Helvetica) {
    if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
    if (isBold) return StandardFonts.HelveticaBold;
    if (isItalic) return StandardFonts.HelveticaOblique;
    return StandardFonts.Helvetica;
  }

  if (baseFont === StandardFonts.TimesRoman) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (baseFont === StandardFonts.Courier) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  return baseFont;
}

/**
 * Parse a hex color string to RGB values (0-1 range).
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 }; // Default to black
}

/**
 * Save text boxes to a PDF document.
 *
 * @param pdfBytes - Original PDF bytes
 * @param textBoxes - Array of text boxes to add
 * @returns Modified PDF bytes
 */
export async function saveTextBoxesToPdf(
  pdfBytes: ArrayBuffer,
  textBoxes: TextBox[]
): Promise<Uint8Array> {
  if (textBoxes.length === 0) {
    return new Uint8Array(pdfBytes);
  }

  // Load the PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Group text boxes by page
  const textBoxesByPage = new Map<number, TextBox[]>();
  for (const textBox of textBoxes) {
    const existing = textBoxesByPage.get(textBox.pageIndex) || [];
    existing.push(textBox);
    textBoxesByPage.set(textBox.pageIndex, existing);
  }

  // Process each page
  for (const [pageIndex, pageTextBoxes] of textBoxesByPage) {
    const page = pages[pageIndex];
    if (!page) continue;

    for (const textBox of pageTextBoxes) {
      if (!textBox.content) continue;

      // Get the font
      const standardFont = getStandardFont(
        textBox.fontFamily,
        textBox.fontWeight === 'bold',
        textBox.fontStyle === 'italic'
      );
      const font = await pdfDoc.embedFont(standardFont);

      // Parse color
      const color = parseHexColor(textBox.color);

      // Draw text
      // Handle multi-line text
      const lines = textBox.content.split('\n');
      const lineHeight = textBox.fontSize * textBox.lineSpacing;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Calculate y position (PDF origin is bottom-left)
        const yPosition = textBox.bounds.y + textBox.bounds.height - (i + 1) * lineHeight;

        // Calculate x position based on alignment
        let xPosition = textBox.bounds.x;
        const textWidth = font.widthOfTextAtSize(line, textBox.fontSize);

        if (textBox.alignment === 'center') {
          xPosition = textBox.bounds.x + (textBox.bounds.width - textWidth) / 2;
        } else if (textBox.alignment === 'right') {
          xPosition = textBox.bounds.x + textBox.bounds.width - textWidth;
        }

        page.drawText(line, {
          x: xPosition,
          y: yPosition,
          size: textBox.fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
        });
      }
    }
  }

  return pdfDoc.save();
}

/**
 * Export text boxes as JSON for backup/restore.
 */
export function exportTextBoxes(textBoxes: TextBox[]): string {
  return JSON.stringify(
    textBoxes.map((tb) => ({
      ...tb,
      createdAt: tb.createdAt.toISOString(),
      updatedAt: tb.updatedAt.toISOString(),
    })),
    null,
    2
  );
}

/**
 * Import text boxes from JSON.
 */
export function importTextBoxes(json: string): TextBox[] {
  try {
    const parsed = JSON.parse(json);
    return parsed.map((tb: Record<string, unknown>) => ({
      ...tb,
      createdAt: new Date(tb.createdAt as string),
      updatedAt: new Date(tb.updatedAt as string),
    }));
  } catch (error) {
    console.error('Failed to import text boxes:', error);
    return [];
  }
}
