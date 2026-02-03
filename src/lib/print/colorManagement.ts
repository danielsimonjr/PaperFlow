/**
 * Color Management for Printing
 *
 * Handles color profiles, color space conversion, and
 * print-specific color adjustments.
 */

/**
 * Color space types
 */
export type ColorSpace = 'sRGB' | 'AdobeRGB' | 'CMYK' | 'Grayscale';

/**
 * Rendering intent options
 */
export type RenderingIntent =
  | 'perceptual'
  | 'relative'
  | 'saturation'
  | 'absolute';

/**
 * Color profile information
 */
export interface ColorProfile {
  name: string;
  colorSpace: ColorSpace;
  description?: string;
  data?: ArrayBuffer;
}

/**
 * Color conversion options
 */
export interface ColorConversionOptions {
  sourceSpace: ColorSpace;
  targetSpace: ColorSpace;
  renderingIntent?: RenderingIntent;
  blackPointCompensation?: boolean;
}

/**
 * RGB color
 */
export interface RGBColor {
  r: number; // 0-255
  g: number;
  b: number;
}

/**
 * CMYK color
 */
export interface CMYKColor {
  c: number; // 0-100
  m: number;
  y: number;
  k: number;
}

/**
 * Color management system
 */
export class ColorManagement {
  private profiles: Map<string, ColorProfile> = new Map();

  /**
   * Register a color profile
   */
  registerProfile(profile: ColorProfile): void {
    this.profiles.set(profile.name, profile);
  }

  /**
   * Get a registered profile
   */
  getProfile(name: string): ColorProfile | undefined {
    return this.profiles.get(name);
  }

  /**
   * List all registered profiles
   */
  listProfiles(): ColorProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Convert RGB to CMYK
   * Uses a simple conversion formula (not ICC-based)
   */
  rgbToCMYK(color: RGBColor): CMYKColor {
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const k = 1 - Math.max(r, g, b);

    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = ((1 - r - k) / (1 - k)) * 100;
    const m = ((1 - g - k) / (1 - k)) * 100;
    const y = ((1 - b - k) / (1 - k)) * 100;

    return {
      c: Math.round(c),
      m: Math.round(m),
      y: Math.round(y),
      k: Math.round(k * 100),
    };
  }

  /**
   * Convert CMYK to RGB
   */
  cmykToRGB(color: CMYKColor): RGBColor {
    const c = color.c / 100;
    const m = color.m / 100;
    const y = color.y / 100;
    const k = color.k / 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
    };
  }

  /**
   * Convert RGB to grayscale
   * Uses ITU-R BT.709 formula
   */
  rgbToGrayscale(color: RGBColor): number {
    return Math.round(
      color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
    );
  }

  /**
   * Apply brightness adjustment
   */
  adjustBrightness(color: RGBColor, amount: number): RGBColor {
    return {
      r: Math.max(0, Math.min(255, color.r + amount)),
      g: Math.max(0, Math.min(255, color.g + amount)),
      b: Math.max(0, Math.min(255, color.b + amount)),
    };
  }

  /**
   * Apply contrast adjustment
   */
  adjustContrast(color: RGBColor, factor: number): RGBColor {
    const adjust = (value: number) => {
      return Math.max(0, Math.min(255, ((value / 255 - 0.5) * factor + 0.5) * 255));
    };

    return {
      r: Math.round(adjust(color.r)),
      g: Math.round(adjust(color.g)),
      b: Math.round(adjust(color.b)),
    };
  }

  /**
   * Apply saturation adjustment
   */
  adjustSaturation(color: RGBColor, factor: number): RGBColor {
    const gray = this.rgbToGrayscale(color);

    return {
      r: Math.max(0, Math.min(255, Math.round(gray + (color.r - gray) * factor))),
      g: Math.max(0, Math.min(255, Math.round(gray + (color.g - gray) * factor))),
      b: Math.max(0, Math.min(255, Math.round(gray + (color.b - gray) * factor))),
    };
  }

  /**
   * Convert ImageData to grayscale
   */
  convertToGrayscale(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      const gray = this.rgbToGrayscale({
        r: data[i] ?? 0,
        g: data[i + 1] ?? 0,
        b: data[i + 2] ?? 0,
      });
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
      // Alpha channel stays the same
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Apply gamma correction
   */
  applyGamma(imageData: ImageData, gamma: number): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const gammaCorrection = 1 / gamma;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(255 * Math.pow((data[i] ?? 0) / 255, gammaCorrection));
      data[i + 1] = Math.round(255 * Math.pow((data[i + 1] ?? 0) / 255, gammaCorrection));
      data[i + 2] = Math.round(255 * Math.pow((data[i + 2] ?? 0) / 255, gammaCorrection));
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Simulate CMYK output on RGB display
   * This helps preview how colors will look when printed
   */
  simulateCMYK(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      // Convert to CMYK and back to RGB
      const cmyk = this.rgbToCMYK({
        r: data[i] ?? 0,
        g: data[i + 1] ?? 0,
        b: data[i + 2] ?? 0,
      });
      const rgb = this.cmykToRGB(cmyk);

      data[i] = rgb.r;
      data[i + 1] = rgb.g;
      data[i + 2] = rgb.b;
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Check if a color is out of CMYK gamut
   * Returns true if the color will be clipped when printed
   */
  isOutOfGamut(color: RGBColor): boolean {
    // Convert to CMYK and back
    const cmyk = this.rgbToCMYK(color);
    const rgb = this.cmykToRGB(cmyk);

    // Check if there's significant difference
    const threshold = 5;
    return (
      Math.abs(color.r - rgb.r) > threshold ||
      Math.abs(color.g - rgb.g) > threshold ||
      Math.abs(color.b - rgb.b) > threshold
    );
  }

  /**
   * Get recommended rendering intent based on content type
   */
  static getRecommendedIntent(
    contentType: 'photo' | 'graphics' | 'text'
  ): RenderingIntent {
    switch (contentType) {
      case 'photo':
        return 'perceptual';
      case 'graphics':
        return 'saturation';
      case 'text':
      default:
        return 'relative';
    }
  }
}

// Export singleton instance
export const colorManagement = new ColorManagement();

export default ColorManagement;
