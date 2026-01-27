/**
 * Font fallback mapping for PDF fonts to web-safe alternatives.
 * Maps common PDF font names to their web-safe equivalents.
 */

export interface FontFallbackResult {
  /** The web-safe font family to use */
  fontFamily: string;
  /** Generic font category for CSS fallback */
  genericFamily: 'serif' | 'sans-serif' | 'monospace' | 'cursive' | 'fantasy';
  /** Confidence level of the match (1 = exact, 0.5 = similar, 0 = generic) */
  confidence: number;
}

/**
 * Map of PDF font base names to web-safe alternatives.
 * Keys are lowercase for case-insensitive matching.
 */
const fontFallbackMap: Record<
  string,
  { family: string; generic: FontFallbackResult['genericFamily'] }
> = {
  // Helvetica family -> Arial
  helvetica: { family: 'Arial', generic: 'sans-serif' },
  'helvetica-bold': { family: 'Arial', generic: 'sans-serif' },
  'helvetica-oblique': { family: 'Arial', generic: 'sans-serif' },
  'helvetica-boldoblique': { family: 'Arial', generic: 'sans-serif' },
  'helvetica neue': { family: 'Arial', generic: 'sans-serif' },

  // Times family -> Times New Roman
  times: { family: 'Times New Roman', generic: 'serif' },
  'times-roman': { family: 'Times New Roman', generic: 'serif' },
  'times-bold': { family: 'Times New Roman', generic: 'serif' },
  'times-italic': { family: 'Times New Roman', generic: 'serif' },
  'times-bolditalic': { family: 'Times New Roman', generic: 'serif' },
  'times new roman': { family: 'Times New Roman', generic: 'serif' },

  // Courier family -> Courier New
  courier: { family: 'Courier New', generic: 'monospace' },
  'courier-bold': { family: 'Courier New', generic: 'monospace' },
  'courier-oblique': { family: 'Courier New', generic: 'monospace' },
  'courier-boldoblique': { family: 'Courier New', generic: 'monospace' },
  'courier new': { family: 'Courier New', generic: 'monospace' },

  // Arial family
  arial: { family: 'Arial', generic: 'sans-serif' },
  'arial-bold': { family: 'Arial', generic: 'sans-serif' },
  'arial-italic': { family: 'Arial', generic: 'sans-serif' },
  'arial black': { family: 'Arial Black', generic: 'sans-serif' },

  // Verdana
  verdana: { family: 'Verdana', generic: 'sans-serif' },

  // Georgia
  georgia: { family: 'Georgia', generic: 'serif' },

  // Tahoma
  tahoma: { family: 'Tahoma', generic: 'sans-serif' },

  // Trebuchet
  'trebuchet ms': { family: 'Trebuchet MS', generic: 'sans-serif' },
  trebuchet: { family: 'Trebuchet MS', generic: 'sans-serif' },

  // Symbol fonts
  symbol: { family: 'Symbol', generic: 'fantasy' },
  zapfdingbats: { family: 'Wingdings', generic: 'fantasy' },
  wingdings: { family: 'Wingdings', generic: 'fantasy' },

  // Palatino -> Book Antiqua
  palatino: { family: 'Book Antiqua', generic: 'serif' },
  'palatino linotype': { family: 'Palatino Linotype', generic: 'serif' },

  // Garamond
  garamond: { family: 'Garamond', generic: 'serif' },

  // Bookman -> Bookman Old Style
  bookman: { family: 'Bookman Old Style', generic: 'serif' },

  // Century -> Century Schoolbook
  century: { family: 'Century Schoolbook', generic: 'serif' },

  // Comic Sans
  'comic sans': { family: 'Comic Sans MS', generic: 'cursive' },
  'comic sans ms': { family: 'Comic Sans MS', generic: 'cursive' },

  // Impact
  impact: { family: 'Impact', generic: 'sans-serif' },

  // Lucida family
  'lucida console': { family: 'Lucida Console', generic: 'monospace' },
  'lucida sans': { family: 'Lucida Sans', generic: 'sans-serif' },

  // Consolas -> Courier New
  consolas: { family: 'Consolas', generic: 'monospace' },

  // Monaco -> Courier New
  monaco: { family: 'Courier New', generic: 'monospace' },

  // Calibri -> Arial
  calibri: { family: 'Calibri', generic: 'sans-serif' },

  // Cambria -> Georgia
  cambria: { family: 'Cambria', generic: 'serif' },
};

/**
 * Generic family defaults when no match is found.
 */
const genericDefaults: Record<string, FontFallbackResult['genericFamily']> = {
  serif: 'serif',
  'sans-serif': 'sans-serif',
  monospace: 'monospace',
  cursive: 'cursive',
  fantasy: 'fantasy',
};

/**
 * Keywords that suggest a specific font category.
 */
const categoryKeywords: Array<{
  keywords: string[];
  generic: FontFallbackResult['genericFamily'];
  family: string;
}> = [
  {
    keywords: ['sans', 'gothic', 'grotesk', 'arial', 'helvetica'],
    generic: 'sans-serif',
    family: 'Arial',
  },
  {
    keywords: ['serif', 'roman', 'times', 'garamond', 'palatino'],
    generic: 'serif',
    family: 'Times New Roman',
  },
  {
    keywords: ['mono', 'courier', 'console', 'code', 'fixed'],
    generic: 'monospace',
    family: 'Courier New',
  },
  {
    keywords: ['script', 'cursive', 'handwriting', 'brush'],
    generic: 'cursive',
    family: 'Georgia',
  },
];

/**
 * Get a web-safe font fallback for a PDF font name.
 *
 * @param pdfFontName - The font name from the PDF
 * @returns Font fallback result with family, generic category, and confidence
 */
export function getFontFallback(pdfFontName: string): FontFallbackResult {
  if (!pdfFontName) {
    return {
      fontFamily: 'Arial',
      genericFamily: 'sans-serif',
      confidence: 0,
    };
  }

  // Normalize font name: lowercase, remove common prefixes/suffixes
  const normalized = normalizeFontName(pdfFontName);

  // Try exact match first
  const exactMatch = fontFallbackMap[normalized];
  if (exactMatch) {
    return {
      fontFamily: exactMatch.family,
      genericFamily: exactMatch.generic,
      confidence: 1,
    };
  }

  // Try partial match
  for (const [key, value] of Object.entries(fontFallbackMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        fontFamily: value.family,
        genericFamily: value.generic,
        confidence: 0.8,
      };
    }
  }

  // Try keyword-based categorization
  for (const category of categoryKeywords) {
    if (category.keywords.some((kw) => normalized.includes(kw))) {
      return {
        fontFamily: category.family,
        genericFamily: category.generic,
        confidence: 0.5,
      };
    }
  }

  // Check for generic family keywords
  for (const [keyword, generic] of Object.entries(genericDefaults)) {
    if (normalized.includes(keyword)) {
      const defaultFamily =
        generic === 'serif'
          ? 'Times New Roman'
          : generic === 'monospace'
            ? 'Courier New'
            : 'Arial';
      return {
        fontFamily: defaultFamily,
        genericFamily: generic,
        confidence: 0.3,
      };
    }
  }

  // Default fallback
  return {
    fontFamily: 'Arial',
    genericFamily: 'sans-serif',
    confidence: 0,
  };
}

/**
 * Normalize a PDF font name for matching.
 */
function normalizeFontName(fontName: string): string {
  return fontName
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/,.*$/, '') // Remove subset prefix (e.g., "ABCDEF+")
    .replace(/^[a-z]{6}\+/i, '') // Remove font subset identifier
    .replace(/mt$/i, '') // Remove MT suffix
    .replace(/ps$/i, '') // Remove PS suffix
    .replace(/std$/i, '') // Remove Std suffix
    .replace(/pro$/i, '') // Remove Pro suffix
    .replace(/lt$/i, '') // Remove Lt suffix
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get all available web-safe font families for UI pickers.
 */
export function getWebSafeFonts(): Array<{
  name: string;
  family: string;
  generic: FontFallbackResult['genericFamily'];
}> {
  return [
    { name: 'Arial', family: 'Arial', generic: 'sans-serif' },
    { name: 'Arial Black', family: 'Arial Black', generic: 'sans-serif' },
    { name: 'Book Antiqua', family: 'Book Antiqua', generic: 'serif' },
    { name: 'Calibri', family: 'Calibri', generic: 'sans-serif' },
    { name: 'Cambria', family: 'Cambria', generic: 'serif' },
    { name: 'Comic Sans MS', family: 'Comic Sans MS', generic: 'cursive' },
    { name: 'Courier New', family: 'Courier New', generic: 'monospace' },
    { name: 'Georgia', family: 'Georgia', generic: 'serif' },
    { name: 'Helvetica', family: 'Helvetica', generic: 'sans-serif' },
    { name: 'Impact', family: 'Impact', generic: 'sans-serif' },
    { name: 'Lucida Console', family: 'Lucida Console', generic: 'monospace' },
    { name: 'Lucida Sans', family: 'Lucida Sans', generic: 'sans-serif' },
    {
      name: 'Palatino Linotype',
      family: 'Palatino Linotype',
      generic: 'serif',
    },
    { name: 'Tahoma', family: 'Tahoma', generic: 'sans-serif' },
    { name: 'Times New Roman', family: 'Times New Roman', generic: 'serif' },
    { name: 'Trebuchet MS', family: 'Trebuchet MS', generic: 'sans-serif' },
    { name: 'Verdana', family: 'Verdana', generic: 'sans-serif' },
  ];
}
