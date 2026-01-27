export { getFontFallback, getWebSafeFonts } from './fontFallback';
export type { FontFallbackResult } from './fontFallback';

export {
  extractFontInfo,
  getFontCSSProperties,
  getTextPosition,
  groupTextItemsByLine,
  estimateTextBounds,
  findDominantFont,
} from './fontMatcher';
export type { PDFTextItem, FontInfo } from './fontMatcher';
