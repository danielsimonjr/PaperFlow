/**
 * N-up Layout System
 *
 * Handles N-up printing layouts where multiple pages
 * are printed on a single sheet.
 */

import { Imposition, type NUpLayout as NUpCount, type NUpOptions, type SheetDimensions } from './imposition';

/**
 * N-up configuration
 */
export interface NUpConfig {
  /** Total page count */
  pageCount: number;
  /** Sheet size */
  sheetSize: SheetDimensions;
  /** Pages per sheet */
  pagesPerSheet: NUpCount;
  /** Page order on sheet */
  pageOrder?: 'horizontal' | 'vertical' | 'horizontalReverse' | 'verticalReverse';
  /** Print borders around pages */
  borders?: boolean;
  /** Border width in points */
  borderWidth?: number;
  /** Gap between pages in points */
  gap?: number;
  /** Maintain original page aspect ratio */
  maintainAspectRatio?: boolean;
  /** Original page size (for aspect ratio) */
  originalPageSize?: SheetDimensions;
}

/**
 * N-up info
 */
export interface NUpInfo {
  /** Sheets needed */
  sheetsNeeded: number;
  /** Grid columns */
  columns: number;
  /** Grid rows */
  rows: number;
  /** Individual page size on sheet */
  pageSize: SheetDimensions;
  /** Effective printable area */
  printableArea: SheetDimensions;
  /** Scale factor applied */
  scaleFactor: number;
}

/**
 * Page cell
 */
export interface PageCell {
  /** Column index (0-based) */
  column: number;
  /** Row index (0-based) */
  row: number;
  /** Page number (1-based) */
  pageNumber: number;
  /** X position in points */
  x: number;
  /** Y position in points */
  y: number;
  /** Cell width in points */
  width: number;
  /** Cell height in points */
  height: number;
  /** Is blank page */
  isBlank: boolean;
}

/**
 * Sheet layout
 */
export interface SheetLayout {
  /** Sheet number (0-based) */
  sheetIndex: number;
  /** Cells on this sheet */
  cells: PageCell[];
}

/**
 * N-up layout result
 */
export interface NUpLayoutResult {
  /** Imposition data */
  imposition: ReturnType<typeof Imposition.nup>;
  /** Layout info */
  info: NUpInfo;
  /** Detailed sheet layouts */
  sheetLayouts: SheetLayout[];
}

/**
 * N-up layout calculator
 */
export class NUpLayout {
  /**
   * Calculate n-up layout
   */
  static calculate(config: NUpConfig): NUpLayoutResult {
    const {
      pageCount,
      sheetSize,
      pagesPerSheet,
      pageOrder = 'horizontal',
      borders = false,
      borderWidth = 0.5,
      gap = 0,
      maintainAspectRatio = true,
      originalPageSize,
    } = config;

    // Calculate grid dimensions
    const grid = this.getGridDimensions(pagesPerSheet);

    // Calculate cell dimensions
    const totalGapX = gap * (grid.columns - 1);
    const totalGapY = gap * (grid.rows - 1);
    const totalBorderX = borders ? borderWidth * 2 * grid.columns : 0;
    const totalBorderY = borders ? borderWidth * 2 * grid.rows : 0;

    const cellWidth = (sheetSize.width - totalGapX - totalBorderX) / grid.columns;
    const cellHeight = (sheetSize.height - totalGapY - totalBorderY) / grid.rows;

    // Calculate scale factor if maintaining aspect ratio
    let scaleFactor = 1;
    let pageWidth = cellWidth;
    let pageHeight = cellHeight;

    if (maintainAspectRatio && originalPageSize) {
      const scaleX = cellWidth / originalPageSize.width;
      const scaleY = cellHeight / originalPageSize.height;
      scaleFactor = Math.min(scaleX, scaleY);
      pageWidth = originalPageSize.width * scaleFactor;
      pageHeight = originalPageSize.height * scaleFactor;
    }

    // Calculate imposition
    const impositionOptions: NUpOptions = {
      layout: pagesPerSheet,
      order: pageOrder,
      borders,
      borderWidth,
      gap,
    };

    const imposition = Imposition.nup(pageCount, sheetSize, impositionOptions);

    // Build detailed sheet layouts
    const sheetLayouts = this.buildSheetLayouts(
      pageCount,
      pagesPerSheet,
      grid,
      cellWidth,
      cellHeight,
      gap,
      borders,
      borderWidth,
      pageOrder
    );

    // Build info
    const info: NUpInfo = {
      sheetsNeeded: imposition.totalSheets,
      columns: grid.columns,
      rows: grid.rows,
      pageSize: { width: pageWidth, height: pageHeight },
      printableArea: {
        width: sheetSize.width - totalBorderX,
        height: sheetSize.height - totalBorderY,
      },
      scaleFactor,
    };

    return {
      imposition,
      info,
      sheetLayouts,
    };
  }

  /**
   * Get grid dimensions for page count
   */
  private static getGridDimensions(pagesPerSheet: NUpCount): {
    columns: number;
    rows: number;
  } {
    switch (pagesPerSheet) {
      case 1:
        return { columns: 1, rows: 1 };
      case 2:
        return { columns: 2, rows: 1 };
      case 4:
        return { columns: 2, rows: 2 };
      case 6:
        return { columns: 3, rows: 2 };
      case 9:
        return { columns: 3, rows: 3 };
      case 16:
        return { columns: 4, rows: 4 };
      default:
        return { columns: 1, rows: 1 };
    }
  }

  /**
   * Build detailed sheet layouts
   */
  private static buildSheetLayouts(
    pageCount: number,
    pagesPerSheet: NUpCount,
    grid: { columns: number; rows: number },
    cellWidth: number,
    cellHeight: number,
    gap: number,
    borders: boolean,
    borderWidth: number,
    pageOrder: string
  ): SheetLayout[] {
    const layouts: SheetLayout[] = [];
    const sheetsNeeded = Math.ceil(pageCount / pagesPerSheet);

    for (let sheetIndex = 0; sheetIndex < sheetsNeeded; sheetIndex++) {
      const cells: PageCell[] = [];

      for (let cellIndex = 0; cellIndex < pagesPerSheet; cellIndex++) {
        const pageNumber = sheetIndex * pagesPerSheet + cellIndex + 1;
        const pos = this.getCellPosition(cellIndex, grid, pageOrder);

        const borderOffset = borders ? borderWidth : 0;
        const x = pos.column * (cellWidth + gap + borderOffset * 2) + borderOffset;
        const y = pos.row * (cellHeight + gap + borderOffset * 2) + borderOffset;

        cells.push({
          column: pos.column,
          row: pos.row,
          pageNumber,
          x,
          y,
          width: cellWidth,
          height: cellHeight,
          isBlank: pageNumber > pageCount,
        });
      }

      layouts.push({ sheetIndex, cells });
    }

    return layouts;
  }

  /**
   * Get cell position in grid
   */
  private static getCellPosition(
    index: number,
    grid: { columns: number; rows: number },
    pageOrder: string
  ): { column: number; row: number } {
    switch (pageOrder) {
      case 'horizontal':
        return {
          column: index % grid.columns,
          row: Math.floor(index / grid.columns),
        };
      case 'vertical':
        return {
          column: Math.floor(index / grid.rows),
          row: index % grid.rows,
        };
      case 'horizontalReverse':
        return {
          column: grid.columns - 1 - (index % grid.columns),
          row: Math.floor(index / grid.columns),
        };
      case 'verticalReverse':
        return {
          column: Math.floor(index / grid.rows),
          row: grid.rows - 1 - (index % grid.rows),
        };
      default:
        return { column: 0, row: 0 };
    }
  }

  /**
   * Recommend optimal n-up layout
   */
  static recommendLayout(
    pageCount: number,
    purpose: 'review' | 'handout' | 'archive'
  ): {
    pagesPerSheet: NUpCount;
    reason: string;
  } {
    switch (purpose) {
      case 'review':
        // For review, 2-up is good for readability
        return {
          pagesPerSheet: 2,
          reason: '2-up provides good readability while saving paper.',
        };
      case 'handout':
        // For handouts, 4-up or 6-up works well
        return {
          pagesPerSheet: pageCount > 12 ? 6 : 4,
          reason: pageCount > 12
            ? '6-up is efficient for larger documents as handouts.'
            : '4-up provides a good balance of readability and paper savings.',
        };
      case 'archive':
        // For archiving, maximize pages per sheet
        return {
          pagesPerSheet: 9,
          reason: '9-up maximizes paper efficiency for archival purposes.',
        };
      default:
        return {
          pagesPerSheet: 2,
          reason: 'Standard 2-up layout for general use.',
        };
    }
  }

  /**
   * Calculate paper savings
   */
  static calculateSavings(
    pageCount: number,
    pagesPerSheet: NUpCount
  ): {
    originalSheets: number;
    nupSheets: number;
    sheetsSaved: number;
    percentSaved: number;
  } {
    const originalSheets = pageCount;
    const nupSheets = Math.ceil(pageCount / pagesPerSheet);
    const sheetsSaved = originalSheets - nupSheets;
    const percentSaved = Math.round((sheetsSaved / originalSheets) * 100);

    return {
      originalSheets,
      nupSheets,
      sheetsSaved,
      percentSaved,
    };
  }
}

export default NUpLayout;
