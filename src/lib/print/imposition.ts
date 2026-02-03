/**
 * Page Imposition System
 *
 * Implements page imposition for booklet printing, n-up printing,
 * and poster printing across multiple sheets.
 */

/**
 * Imposition type
 */
export type ImpositionType = 'none' | 'booklet' | 'nup' | 'poster';

/**
 * N-up layout
 */
export type NUpLayout = 1 | 2 | 4 | 6 | 9 | 16;

/**
 * Binding edge
 */
export type BindingEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Page order
 */
export type PageOrder =
  | 'horizontal'
  | 'vertical'
  | 'horizontalReverse'
  | 'verticalReverse';

/**
 * Page position on sheet
 */
export interface PagePosition {
  /** Original page number (1-indexed) */
  pageNumber: number;
  /** X position on sheet (in points) */
  x: number;
  /** Y position on sheet (in points) */
  y: number;
  /** Width on sheet (in points) */
  width: number;
  /** Height on sheet (in points) */
  height: number;
  /** Rotation in degrees */
  rotation: number;
  /** Whether page is blank */
  isBlank?: boolean;
}

/**
 * Sheet side
 */
export interface SheetSide {
  /** Sheet number (0-indexed) */
  sheetIndex: number;
  /** Front or back */
  side: 'front' | 'back';
  /** Pages on this side */
  pages: PagePosition[];
}

/**
 * Imposition result
 */
export interface ImpositionResult {
  /** All sheet sides in print order */
  sheets: SheetSide[];
  /** Total number of physical sheets */
  totalSheets: number;
  /** Total pages including blanks */
  totalPages: number;
  /** Type of imposition used */
  type: ImpositionType;
}

/**
 * Booklet options
 */
export interface BookletOptions {
  /** Binding edge */
  binding: BindingEdge;
  /** Pages per signature (must be multiple of 4) */
  sheetsPerSection?: number;
  /** Creep compensation (in points) */
  creep?: number;
  /** Add blank pages if needed */
  autoAddBlanks?: boolean;
}

/**
 * N-up options
 */
export interface NUpOptions {
  /** Pages per sheet */
  layout: NUpLayout;
  /** Page order on sheet */
  order?: PageOrder;
  /** Add borders around pages */
  borders?: boolean;
  /** Border width in points */
  borderWidth?: number;
  /** Gap between pages in points */
  gap?: number;
}

/**
 * Poster options
 */
export interface PosterOptions {
  /** Number of tiles wide */
  tilesWide: number;
  /** Number of tiles high */
  tilesHigh: number;
  /** Overlap between tiles in points */
  overlap?: number;
  /** Add cut marks */
  cutMarks?: boolean;
  /** Add tile labels */
  labels?: boolean;
}

/**
 * Sheet dimensions
 */
export interface SheetDimensions {
  width: number;
  height: number;
}

/**
 * Page imposition calculator
 */
export class Imposition {
  /**
   * Calculate booklet imposition
   */
  static booklet(
    pageCount: number,
    sheetSize: SheetDimensions,
    options: BookletOptions = { binding: 'left' }
  ): ImpositionResult {
    const { binding, creep = 0, autoAddBlanks = true } = options;

    // Booklet requires pages in multiples of 4
    let totalPages = pageCount;
    if (autoAddBlanks && totalPages % 4 !== 0) {
      totalPages = Math.ceil(totalPages / 4) * 4;
    }

    const sheetsNeeded = totalPages / 4;
    const sheets: SheetSide[] = [];

    // Half-page dimensions
    const isLeftRight = binding === 'left' || binding === 'right';
    const pageWidth = isLeftRight ? sheetSize.width / 2 : sheetSize.width;
    const pageHeight = isLeftRight ? sheetSize.height : sheetSize.height / 2;

    // Calculate page order for saddle-stitch binding
    for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
      const frontPages: PagePosition[] = [];
      const backPages: PagePosition[] = [];

      // Calculate page numbers for this sheet
      // Front: pages 2n, totalPages - 2n + 1
      // Back: pages 2n + 1, totalPages - 2n
      const sheetOffset = sheet * 2;

      const frontLeft = totalPages - sheetOffset;
      const frontRight = sheetOffset + 1;
      const backLeft = sheetOffset + 2;
      const backRight = totalPages - sheetOffset - 1;

      // Apply creep compensation
      const creepOffset = creep * (sheetsNeeded - sheet - 1);

      if (isLeftRight) {
        // Left/right binding
        frontPages.push(
          this.createPagePosition(frontLeft, 0, 0, pageWidth, pageHeight, 0, pageCount, creepOffset),
          this.createPagePosition(frontRight, pageWidth, 0, pageWidth, pageHeight, 0, pageCount, -creepOffset)
        );
        backPages.push(
          this.createPagePosition(backLeft, 0, 0, pageWidth, pageHeight, 0, pageCount, -creepOffset),
          this.createPagePosition(backRight, pageWidth, 0, pageWidth, pageHeight, 0, pageCount, creepOffset)
        );
      } else {
        // Top/bottom binding
        frontPages.push(
          this.createPagePosition(frontRight, 0, 0, pageWidth, pageHeight, 0, pageCount),
          this.createPagePosition(frontLeft, 0, pageHeight, pageWidth, pageHeight, 180, pageCount)
        );
        backPages.push(
          this.createPagePosition(backLeft, 0, 0, pageWidth, pageHeight, 0, pageCount),
          this.createPagePosition(backRight, 0, pageHeight, pageWidth, pageHeight, 180, pageCount)
        );
      }

      sheets.push(
        { sheetIndex: sheet, side: 'front', pages: frontPages },
        { sheetIndex: sheet, side: 'back', pages: backPages }
      );
    }

    return {
      sheets,
      totalSheets: sheetsNeeded,
      totalPages,
      type: 'booklet',
    };
  }

  /**
   * Calculate n-up imposition
   */
  static nup(
    pageCount: number,
    sheetSize: SheetDimensions,
    options: NUpOptions = { layout: 2 }
  ): ImpositionResult {
    const { layout, order = 'horizontal', gap = 0 } = options;

    // Calculate grid dimensions
    const grid = this.getNUpGrid(layout);
    const cols = grid.cols;
    const rows = grid.rows;

    // Calculate page dimensions
    const totalGapX = gap * (cols - 1);
    const totalGapY = gap * (rows - 1);
    const pageWidth = (sheetSize.width - totalGapX) / cols;
    const pageHeight = (sheetSize.height - totalGapY) / rows;

    // Calculate number of sheets needed
    const pagesPerSheet = layout;
    const sheetsNeeded = Math.ceil(pageCount / pagesPerSheet);

    const sheets: SheetSide[] = [];

    for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
      const pages: PagePosition[] = [];

      for (let i = 0; i < pagesPerSheet; i++) {
        const pageNum = sheet * pagesPerSheet + i + 1;
        const pos = this.getNUpPosition(i, cols, rows, order);

        const x = pos.col * (pageWidth + gap);
        const y = pos.row * (pageHeight + gap);

        pages.push(
          this.createPagePosition(
            pageNum,
            x,
            y,
            pageWidth,
            pageHeight,
            0,
            pageCount
          )
        );
      }

      sheets.push({ sheetIndex: sheet, side: 'front', pages });
    }

    return {
      sheets,
      totalSheets: sheetsNeeded,
      totalPages: pageCount,
      type: 'nup',
    };
  }

  /**
   * Calculate poster imposition (tile a single page across multiple sheets)
   */
  static poster(
    pageSize: SheetDimensions,
    sheetSize: SheetDimensions,
    options: PosterOptions
  ): ImpositionResult {
    const { tilesWide, tilesHigh, overlap = 36 } = options;

    const sheets: SheetSide[] = [];
    const totalSheets = tilesWide * tilesHigh;

    // Calculate tile dimensions including overlap
    const tileWidth = (pageSize.width + overlap * (tilesWide - 1)) / tilesWide;
    const tileHeight = (pageSize.height + overlap * (tilesHigh - 1)) / tilesHigh;

    for (let row = 0; row < tilesHigh; row++) {
      for (let col = 0; col < tilesWide; col++) {
        const sheetIndex = row * tilesWide + col;

        // Calculate source area on original page
        const sourceX = col * (tileWidth - overlap);
        const sourceY = row * (tileHeight - overlap);

        const pages: PagePosition[] = [
          {
            pageNumber: 1,
            x: -sourceX * (sheetSize.width / tileWidth),
            y: -sourceY * (sheetSize.height / tileHeight),
            width: pageSize.width * (sheetSize.width / tileWidth),
            height: pageSize.height * (sheetSize.height / tileHeight),
            rotation: 0,
          },
        ];

        sheets.push({ sheetIndex, side: 'front', pages });
      }
    }

    return {
      sheets,
      totalSheets,
      totalPages: 1,
      type: 'poster',
    };
  }

  /**
   * Create page position with blank detection
   */
  private static createPagePosition(
    pageNumber: number,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
    totalRealPages: number,
    xOffset: number = 0
  ): PagePosition {
    return {
      pageNumber,
      x: x + xOffset,
      y,
      width,
      height,
      rotation,
      isBlank: pageNumber > totalRealPages,
    };
  }

  /**
   * Get grid dimensions for n-up layout
   */
  private static getNUpGrid(layout: NUpLayout): { cols: number; rows: number } {
    switch (layout) {
      case 1:
        return { cols: 1, rows: 1 };
      case 2:
        return { cols: 2, rows: 1 };
      case 4:
        return { cols: 2, rows: 2 };
      case 6:
        return { cols: 3, rows: 2 };
      case 9:
        return { cols: 3, rows: 3 };
      case 16:
        return { cols: 4, rows: 4 };
      default:
        return { cols: 1, rows: 1 };
    }
  }

  /**
   * Get position in grid for page index
   */
  private static getNUpPosition(
    index: number,
    cols: number,
    rows: number,
    order: PageOrder
  ): { col: number; row: number } {
    switch (order) {
      case 'horizontal':
        return {
          col: index % cols,
          row: Math.floor(index / cols),
        };
      case 'vertical':
        return {
          col: Math.floor(index / rows),
          row: index % rows,
        };
      case 'horizontalReverse':
        return {
          col: cols - 1 - (index % cols),
          row: Math.floor(index / cols),
        };
      case 'verticalReverse':
        return {
          col: Math.floor(index / rows),
          row: rows - 1 - (index % rows),
        };
      default:
        return { col: 0, row: 0 };
    }
  }

  /**
   * Calculate pages needed for booklet (including blanks)
   */
  static calculateBookletPages(pageCount: number): number {
    return Math.ceil(pageCount / 4) * 4;
  }

  /**
   * Calculate sheets needed for booklet
   */
  static calculateBookletSheets(pageCount: number): number {
    return this.calculateBookletPages(pageCount) / 4;
  }

  /**
   * Calculate sheets needed for n-up
   */
  static calculateNUpSheets(pageCount: number, layout: NUpLayout): number {
    return Math.ceil(pageCount / layout);
  }
}

export default Imposition;
