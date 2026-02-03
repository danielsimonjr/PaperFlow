/**
 * Print Accessibility Features
 *
 * Implements accessibility options for printing including
 * large print mode, high contrast, and text-only output.
 */

import type { PrintSettings } from '@stores/printStore';

/**
 * Accessibility options
 */
export interface PrintAccessibilityOptions {
  /** Enable large print mode */
  largePrint: boolean;
  /** Font size for large print (in points) */
  fontSize?: number;
  /** Enable high contrast mode */
  highContrast: boolean;
  /** Text-only output (no images) */
  textOnly: boolean;
  /** Line spacing multiplier */
  lineSpacing?: number;
  /** Letter spacing (in points) */
  letterSpacing?: number;
  /** Use dyslexia-friendly font */
  dyslexiaFont?: boolean;
  /** Simplified layout */
  simplifiedLayout?: boolean;
}

/**
 * Default accessibility options
 */
export const DEFAULT_ACCESSIBILITY_OPTIONS: PrintAccessibilityOptions = {
  largePrint: false,
  fontSize: 18,
  highContrast: false,
  textOnly: false,
  lineSpacing: 1.5,
  letterSpacing: 0,
  dyslexiaFont: false,
  simplifiedLayout: false,
};

/**
 * Large print sizes
 */
export const LARGE_PRINT_SIZES = {
  standard: 18,
  large: 24,
  extraLarge: 30,
  giant: 36,
};

/**
 * Accessibility presets
 */
export const ACCESSIBILITY_PRESETS = {
  visualImpairment: {
    name: 'Low Vision',
    description: 'Large text with high contrast',
    options: {
      largePrint: true,
      fontSize: 24,
      highContrast: true,
      textOnly: false,
      lineSpacing: 2,
      letterSpacing: 1,
    },
  },
  dyslexia: {
    name: 'Dyslexia Friendly',
    description: 'Dyslexia-optimized formatting',
    options: {
      largePrint: true,
      fontSize: 18,
      highContrast: false,
      textOnly: false,
      lineSpacing: 1.8,
      letterSpacing: 2,
      dyslexiaFont: true,
    },
  },
  textOnly: {
    name: 'Text Only',
    description: 'Removes all images and graphics',
    options: {
      largePrint: false,
      highContrast: false,
      textOnly: true,
      simplifiedLayout: true,
    },
  },
  highContrast: {
    name: 'High Contrast',
    description: 'Maximum contrast for easier reading',
    options: {
      largePrint: false,
      highContrast: true,
      textOnly: false,
    },
  },
};

/**
 * Print accessibility helper
 */
export class PrintAccessibility {
  /**
   * Apply accessibility options to print settings
   */
  static applyOptions(
    settings: PrintSettings,
    options: PrintAccessibilityOptions
  ): PrintSettings {
    const modified = { ...settings };

    // Large print adjustments
    if (options.largePrint) {
      // Increase scale to account for larger text
      const scaleFactor = (options.fontSize || 18) / 12; // Base font is 12pt
      modified.scale = Math.min(200, Math.round(settings.scale * scaleFactor));
    }

    // High contrast - force grayscale
    if (options.highContrast) {
      modified.color = false;
    }

    // Text only - disable background printing
    if (options.textOnly) {
      modified.printBackground = false;
    }

    return modified;
  }

  /**
   * Generate CSS for accessibility options
   */
  static generateCSS(options: PrintAccessibilityOptions): string {
    const rules: string[] = [];

    // Large print
    if (options.largePrint) {
      rules.push(`
        @media print {
          body {
            font-size: ${options.fontSize || 18}pt !important;
          }
          * {
            font-size: inherit !important;
          }
        }
      `);
    }

    // Line spacing
    if (options.lineSpacing && options.lineSpacing !== 1) {
      rules.push(`
        @media print {
          body, p, li, td, th {
            line-height: ${options.lineSpacing} !important;
          }
        }
      `);
    }

    // Letter spacing
    if (options.letterSpacing) {
      rules.push(`
        @media print {
          body {
            letter-spacing: ${options.letterSpacing}pt !important;
          }
        }
      `);
    }

    // High contrast
    if (options.highContrast) {
      rules.push(`
        @media print {
          * {
            color: black !important;
            background: white !important;
            border-color: black !important;
          }
          img {
            filter: grayscale(100%) contrast(200%) !important;
          }
        }
      `);
    }

    // Text only
    if (options.textOnly) {
      rules.push(`
        @media print {
          img, svg, canvas, video, iframe, embed, object,
          .image, .graphic, .chart, .figure {
            display: none !important;
          }
          * {
            background-image: none !important;
          }
        }
      `);
    }

    // Dyslexia font
    if (options.dyslexiaFont) {
      rules.push(`
        @media print {
          * {
            font-family: OpenDyslexic, Arial, sans-serif !important;
          }
        }
      `);
    }

    // Simplified layout
    if (options.simplifiedLayout) {
      rules.push(`
        @media print {
          * {
            float: none !important;
            position: static !important;
          }
          table {
            border-collapse: collapse !important;
          }
          td, th {
            border: 1px solid black !important;
            padding: 8px !important;
          }
          nav, aside, footer, header {
            display: none !important;
          }
        }
      `);
    }

    return rules.join('\n');
  }

  /**
   * Get preset by name
   */
  static getPreset(
    name: keyof typeof ACCESSIBILITY_PRESETS
  ): PrintAccessibilityOptions {
    const preset = ACCESSIBILITY_PRESETS[name];
    return {
      ...DEFAULT_ACCESSIBILITY_OPTIONS,
      ...preset.options,
    };
  }

  /**
   * Calculate optimal font size for paper size
   */
  static calculateOptimalFontSize(
    paperWidth: number,
    _paperHeight: number,
    margins: { left: number; right: number }
  ): number {
    // Available width in points
    const availableWidth = paperWidth - margins.left - margins.right;

    // For comfortable reading, aim for 60-80 characters per line
    // Average character width is approximately 0.6 * font size
    const targetChars = 70;
    const avgCharWidth = 0.6;

    const optimalSize = availableWidth / (targetChars * avgCharWidth);

    // Clamp to reasonable range
    return Math.max(10, Math.min(24, Math.round(optimalSize)));
  }

  /**
   * Validate accessibility options
   */
  static validateOptions(
    options: Partial<PrintAccessibilityOptions>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.fontSize !== undefined) {
      if (options.fontSize < 8) {
        errors.push('Font size must be at least 8pt');
      }
      if (options.fontSize > 72) {
        errors.push('Font size must be at most 72pt');
      }
    }

    if (options.lineSpacing !== undefined) {
      if (options.lineSpacing < 1) {
        errors.push('Line spacing must be at least 1');
      }
      if (options.lineSpacing > 3) {
        errors.push('Line spacing must be at most 3');
      }
    }

    if (options.letterSpacing !== undefined) {
      if (options.letterSpacing < 0) {
        errors.push('Letter spacing cannot be negative');
      }
      if (options.letterSpacing > 10) {
        errors.push('Letter spacing must be at most 10pt');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default PrintAccessibility;
