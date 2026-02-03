/**
 * Booklet Layout System
 *
 * Handles booklet-specific layout calculations including
 * saddle-stitch and perfect binding layouts.
 */

import { Imposition, type BookletOptions, type SheetDimensions } from './imposition';

/**
 * Binding type
 */
export type BindingType = 'saddleStitch' | 'perfectBind' | 'coilBind' | 'threePunchBind';

/**
 * Fold type
 */
export type FoldType = 'half' | 'tri' | 'z' | 'gate';

/**
 * Booklet configuration
 */
export interface BookletConfig {
  /** Total page count */
  pageCount: number;
  /** Sheet size */
  sheetSize: SheetDimensions;
  /** Binding type */
  bindingType: BindingType;
  /** Binding edge */
  bindingEdge: 'left' | 'right' | 'top';
  /** Include fold guides */
  includeFoldGuides?: boolean;
  /** Include crop marks */
  includeCropMarks?: boolean;
  /** Bleed amount in points */
  bleed?: number;
  /** Gutter width in points */
  gutter?: number;
}

/**
 * Booklet info
 */
export interface BookletInfo {
  /** Total sheets of paper needed */
  sheetsNeeded: number;
  /** Total pages including blanks */
  totalPages: number;
  /** Number of signatures (for perfect binding) */
  signatures: number;
  /** Pages per signature */
  pagesPerSignature: number;
  /** Final booklet dimensions */
  finalSize: SheetDimensions;
  /** Binding recommendations */
  recommendations: string[];
}

/**
 * Fold guide
 */
export interface FoldGuide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

/**
 * Crop mark
 */
export interface CropMark {
  x: number;
  y: number;
  direction: 'horizontal' | 'vertical';
  length: number;
}

/**
 * Booklet layout result
 */
export interface BookletLayoutResult {
  /** Imposition data */
  imposition: ReturnType<typeof Imposition.booklet>;
  /** Booklet info */
  info: BookletInfo;
  /** Fold guides (if requested) */
  foldGuides?: FoldGuide[];
  /** Crop marks (if requested) */
  cropMarks?: CropMark[];
}

/**
 * Booklet layout calculator
 */
export class BookletLayout {
  /**
   * Calculate booklet layout
   */
  static calculate(config: BookletConfig): BookletLayoutResult {
    const {
      pageCount,
      sheetSize,
      bindingType,
      bindingEdge,
      includeFoldGuides = false,
      includeCropMarks = false,
      bleed = 0,
    } = config;

    // Determine pages per signature based on binding type
    const pagesPerSignature = this.getPagesPerSignature(bindingType, pageCount);

    // Calculate imposition
    const impositionOptions: BookletOptions = {
      binding: bindingEdge === 'top' ? 'top' : bindingEdge,
      creep: this.calculateCreep(pagesPerSignature),
      autoAddBlanks: true,
    };

    const imposition = Imposition.booklet(pageCount, sheetSize, impositionOptions);

    // Calculate booklet info
    const info = this.calculateInfo(config, imposition);

    // Generate fold guides if requested
    const foldGuides = includeFoldGuides
      ? this.generateFoldGuides(sheetSize, bindingEdge)
      : undefined;

    // Generate crop marks if requested
    const cropMarks = includeCropMarks
      ? this.generateCropMarks(sheetSize, bleed)
      : undefined;

    return {
      imposition,
      info,
      foldGuides,
      cropMarks,
    };
  }

  /**
   * Get recommended pages per signature
   */
  private static getPagesPerSignature(
    bindingType: BindingType,
    pageCount: number
  ): number {
    switch (bindingType) {
      case 'saddleStitch':
        // Saddle stitch is typically one signature
        // But limit to ~60 pages (15 sheets) for practical reasons
        return Math.min(Math.ceil(pageCount / 4) * 4, 60);

      case 'perfectBind':
        // Perfect binding uses multiple signatures of 16-32 pages
        return 16;

      case 'coilBind':
      case 'threePunchBind':
        // These don't use signatures in the traditional sense
        return pageCount;

      default:
        return 16;
    }
  }

  /**
   * Calculate creep compensation
   * Creep is the progressive shift of inner pages caused by paper thickness
   */
  private static calculateCreep(pagesPerSignature: number): number {
    // Approximate creep: 0.5 points per sheet for standard paper
    const sheetsPerSignature = pagesPerSignature / 4;
    return sheetsPerSignature * 0.5;
  }

  /**
   * Calculate booklet information
   */
  private static calculateInfo(
    config: BookletConfig,
    imposition: ReturnType<typeof Imposition.booklet>
  ): BookletInfo {
    const { pageCount, sheetSize, bindingType, gutter = 0 } = config;

    const pagesPerSignature = this.getPagesPerSignature(bindingType, pageCount);
    const signatures = Math.ceil(imposition.totalPages / pagesPerSignature);

    // Calculate final booklet size
    const finalSize: SheetDimensions = {
      width: sheetSize.width / 2 - gutter / 2,
      height: sheetSize.height,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(config, imposition);

    return {
      sheetsNeeded: imposition.totalSheets,
      totalPages: imposition.totalPages,
      signatures,
      pagesPerSignature,
      finalSize,
      recommendations,
    };
  }

  /**
   * Generate binding and printing recommendations
   */
  private static generateRecommendations(
    config: BookletConfig,
    imposition: ReturnType<typeof Imposition.booklet>
  ): string[] {
    const recommendations: string[] = [];
    const { bindingType, pageCount } = config;
    const sheetsNeeded = imposition.totalSheets;

    // Saddle stitch recommendations
    if (bindingType === 'saddleStitch') {
      if (sheetsNeeded > 15) {
        recommendations.push(
          'Consider perfect binding for documents over 60 pages for better durability.'
        );
      }
      if (sheetsNeeded > 10) {
        recommendations.push(
          'Use staples rated for the paper thickness to ensure secure binding.'
        );
      }
    }

    // Paper weight recommendation
    if (sheetsNeeded > 8) {
      recommendations.push(
        'Consider using lighter paper weight (70-80 gsm) to reduce bulk.'
      );
    }

    // Blank page warning
    if (imposition.totalPages > pageCount) {
      const blankPages = imposition.totalPages - pageCount;
      recommendations.push(
        `${blankPages} blank page(s) will be added to complete the booklet.`
      );
    }

    // Duplex printing recommendation
    recommendations.push(
      'Enable duplex (two-sided) printing for automatic front/back alignment.'
    );

    return recommendations;
  }

  /**
   * Generate fold guides
   */
  private static generateFoldGuides(
    sheetSize: SheetDimensions,
    bindingEdge: 'left' | 'right' | 'top'
  ): FoldGuide[] {
    const guides: FoldGuide[] = [];
    const markLength = 18; // 0.25 inch

    if (bindingEdge === 'left' || bindingEdge === 'right') {
      // Vertical fold line
      const foldX = sheetSize.width / 2;
      guides.push(
        {
          x1: foldX,
          y1: 0,
          x2: foldX,
          y2: markLength,
          label: 'Fold',
        },
        {
          x1: foldX,
          y1: sheetSize.height - markLength,
          x2: foldX,
          y2: sheetSize.height,
        }
      );
    } else {
      // Horizontal fold line
      const foldY = sheetSize.height / 2;
      guides.push(
        {
          x1: 0,
          y1: foldY,
          x2: markLength,
          y2: foldY,
          label: 'Fold',
        },
        {
          x1: sheetSize.width - markLength,
          y1: foldY,
          x2: sheetSize.width,
          y2: foldY,
        }
      );
    }

    return guides;
  }

  /**
   * Generate crop marks
   */
  private static generateCropMarks(
    sheetSize: SheetDimensions,
    bleed: number
  ): CropMark[] {
    const marks: CropMark[] = [];
    const markLength = 18;
    const markOffset = bleed + 9;

    // Top-left
    marks.push(
      { x: markOffset, y: 0, direction: 'vertical', length: markLength },
      { x: 0, y: markOffset, direction: 'horizontal', length: markLength }
    );

    // Top-right
    marks.push(
      { x: sheetSize.width - markOffset, y: 0, direction: 'vertical', length: markLength },
      { x: sheetSize.width - markLength, y: markOffset, direction: 'horizontal', length: markLength }
    );

    // Bottom-left
    marks.push(
      { x: markOffset, y: sheetSize.height - markLength, direction: 'vertical', length: markLength },
      { x: 0, y: sheetSize.height - markOffset, direction: 'horizontal', length: markLength }
    );

    // Bottom-right
    marks.push(
      { x: sheetSize.width - markOffset, y: sheetSize.height - markLength, direction: 'vertical', length: markLength },
      { x: sheetSize.width - markLength, y: sheetSize.height - markOffset, direction: 'horizontal', length: markLength }
    );

    return marks;
  }

  /**
   * Calculate spine width for perfect binding
   */
  static calculateSpineWidth(pageCount: number, paperThicknessMM: number = 0.1): number {
    // Each sheet has 4 pages (front and back of 2 leaves)
    const sheets = pageCount / 2;
    const spineWidthMM = sheets * paperThicknessMM;
    // Convert to points (1 mm = 2.83465 points)
    return spineWidthMM * 2.83465;
  }

  /**
   * Get optimal binding type recommendation
   */
  static recommendBindingType(pageCount: number): {
    recommended: BindingType;
    alternatives: BindingType[];
    reason: string;
  } {
    if (pageCount <= 48) {
      return {
        recommended: 'saddleStitch',
        alternatives: ['coilBind'],
        reason: 'Saddle stitch is economical and works well for booklets up to ~48 pages.',
      };
    } else if (pageCount <= 200) {
      return {
        recommended: 'perfectBind',
        alternatives: ['coilBind', 'threePunchBind'],
        reason: 'Perfect binding provides a professional spine for larger documents.',
      };
    } else {
      return {
        recommended: 'perfectBind',
        alternatives: ['coilBind'],
        reason: 'Perfect binding is recommended for documents over 200 pages.',
      };
    }
  }
}

export default BookletLayout;
