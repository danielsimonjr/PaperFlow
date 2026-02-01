/**
 * Layout Analyzer for OCR
 * Detects document structure including columns, tables, headers, and footers.
 */

import type { OCRResult, OCRBlock, OCRLine, BoundingBox } from './types';

export interface Column {
  id: string;
  bounds: BoundingBox;
  blocks: OCRBlock[];
  order: number;
}

export interface TableCell {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  bounds: BoundingBox;
  text: string;
  confidence: number;
}

export interface Table {
  id: string;
  bounds: BoundingBox;
  rows: number;
  cols: number;
  cells: TableCell[];
  hasHeader: boolean;
}

export interface TextRegion {
  id: string;
  bounds: BoundingBox;
  text: string;
  type: 'header' | 'footer' | 'paragraph' | 'heading' | 'caption';
  confidence: number;
}

export interface ImageRegion {
  id: string;
  bounds: BoundingBox;
  caption?: TextRegion;
}

export interface Region {
  id: string;
  type: 'column' | 'table' | 'image' | 'header' | 'footer' | 'paragraph';
  bounds: BoundingBox;
  order: number;
}

export interface LayoutAnalysis {
  columns: Column[];
  tables: Table[];
  images: ImageRegion[];
  headers: TextRegion[];
  footers: TextRegion[];
  readingOrder: Region[];
  isMultiColumn: boolean;
  estimatedColumns: number;
  language: 'ltr' | 'rtl' | 'ttb';
}

/**
 * Configuration for layout analysis
 */
export interface LayoutConfig {
  /** Minimum gap ratio to consider column separation */
  columnGapRatio: number;
  /** Percentage of page height for header/footer detection */
  headerFooterThreshold: number;
  /** Minimum cells to consider a table */
  minTableCells: number;
  /** Line overlap threshold for same-line detection */
  lineOverlapThreshold: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  columnGapRatio: 0.03,
  headerFooterThreshold: 0.1,
  minTableCells: 4,
  lineOverlapThreshold: 0.5,
};

/**
 * Analyzes the layout of OCR results
 */
export function analyzeLayout(
  result: OCRResult,
  config: Partial<LayoutConfig> = {}
): LayoutAnalysis {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const pageWidth = result.imageDimensions?.width ?? 0;
  const pageHeight = result.imageDimensions?.height ?? 0;

  // Detect language direction
  const language = detectLanguageDirection(result);

  // Detect headers and footers first
  const { headers, footers, contentBlocks } = detectHeadersFooters(
    result.blocks,
    pageHeight,
    cfg.headerFooterThreshold
  );

  // Detect columns from content area
  const columns = detectColumns(contentBlocks, pageWidth, cfg.columnGapRatio);

  // Detect tables
  const tables = detectTables(result.lines, cfg.minTableCells);

  // Detect images (blocks with low text density)
  const images = detectImageRegions(contentBlocks);

  // Build reading order
  const readingOrder = buildReadingOrder(
    columns,
    tables,
    images,
    headers,
    footers,
    language
  );

  return {
    columns,
    tables,
    images,
    headers: headers.map((r) => ({ ...r, type: 'header' as const })),
    footers: footers.map((r) => ({ ...r, type: 'footer' as const })),
    readingOrder,
    isMultiColumn: columns.length > 1,
    estimatedColumns: columns.length,
    language,
  };
}

/**
 * Detects the language direction based on script
 */
function detectLanguageDirection(result: OCRResult): 'ltr' | 'rtl' | 'ttb' {
  // Check for RTL scripts (Arabic, Hebrew)
  const rtlPattern = /[\u0600-\u06FF\u0590-\u05FF]/;
  // Check for vertical CJK
  const cjkPattern = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;

  const sampleText = result.text.slice(0, 1000);

  if (rtlPattern.test(sampleText)) {
    return 'rtl';
  }

  // For CJK, check if text appears to be vertical
  // This is a heuristic - vertical text usually has tall, narrow bounding boxes
  if (cjkPattern.test(sampleText)) {
    const verticalLike = result.words.filter((w) => {
      const height = w.bbox.y1 - w.bbox.y0;
      const width = w.bbox.x1 - w.bbox.x0;
      return height > width * 2;
    });

    if (verticalLike.length > result.words.length * 0.3) {
      return 'ttb';
    }
  }

  return 'ltr';
}

/**
 * Detects headers and footers based on position
 */
function detectHeadersFooters(
  blocks: OCRBlock[],
  pageHeight: number,
  threshold: number
): { headers: TextRegion[]; footers: TextRegion[]; contentBlocks: OCRBlock[] } {
  const headerThreshold = pageHeight * threshold;
  const footerThreshold = pageHeight * (1 - threshold);

  const headers: TextRegion[] = [];
  const footers: TextRegion[] = [];
  const contentBlocks: OCRBlock[] = [];

  for (const block of blocks) {
    const blockTop = block.bbox.y0;
    const blockBottom = block.bbox.y1;
    const blockCenter = (blockTop + blockBottom) / 2;

    if (blockCenter < headerThreshold) {
      headers.push({
        id: `header-${headers.length}`,
        bounds: block.bbox,
        text: block.text,
        type: 'header',
        confidence: block.confidence,
      });
    } else if (blockCenter > footerThreshold) {
      footers.push({
        id: `footer-${footers.length}`,
        bounds: block.bbox,
        text: block.text,
        type: 'footer',
        confidence: block.confidence,
      });
    } else {
      contentBlocks.push(block);
    }
  }

  return { headers, footers, contentBlocks };
}

/**
 * Detects columns by analyzing horizontal gaps
 */
function detectColumns(
  blocks: OCRBlock[],
  pageWidth: number,
  gapRatio: number
): Column[] {
  if (blocks.length === 0) {
    return [];
  }

  // Find horizontal positions of all blocks
  const positions = blocks.map((b) => ({
    left: b.bbox.x0,
    right: b.bbox.x1,
    block: b,
  }));

  // Sort by left position
  positions.sort((a, b) => a.left - b.left);

  // Find significant gaps
  const minGap = pageWidth * gapRatio;
  const gaps: number[] = [];

  for (let i = 0; i < positions.length - 1; i++) {
    const gap = positions[i + 1]!.left - positions[i]!.right;
    if (gap > minGap) {
      gaps.push((positions[i]!.right + positions[i + 1]!.left) / 2);
    }
  }

  // Create columns based on gaps
  if (gaps.length === 0) {
    // Single column
    const allBlocks = blocks;
    const bounds = calculateBlocksBounds(allBlocks);
    return [
      {
        id: 'col-0',
        bounds,
        blocks: allBlocks,
        order: 0,
      },
    ];
  }

  // Multiple columns
  const columns: Column[] = [];
  let columnStart = 0;

  for (let i = 0; i <= gaps.length; i++) {
    const columnEnd = gaps[i] ?? pageWidth;
    const columnBlocks = blocks.filter(
      (b) => b.bbox.x0 >= columnStart && b.bbox.x1 <= columnEnd
    );

    if (columnBlocks.length > 0) {
      columns.push({
        id: `col-${columns.length}`,
        bounds: calculateBlocksBounds(columnBlocks),
        blocks: columnBlocks,
        order: columns.length,
      });
    }

    columnStart = columnEnd;
  }

  return columns;
}

/**
 * Calculates the bounding box of multiple blocks
 */
function calculateBlocksBounds(blocks: OCRBlock[]): BoundingBox {
  if (blocks.length === 0) {
    return { x0: 0, y0: 0, x1: 0, y1: 0, width: 0, height: 0 };
  }

  const x0 = Math.min(...blocks.map((b) => b.bbox.x0));
  const y0 = Math.min(...blocks.map((b) => b.bbox.y0));
  const x1 = Math.max(...blocks.map((b) => b.bbox.x1));
  const y1 = Math.max(...blocks.map((b) => b.bbox.y1));

  return {
    x0,
    y0,
    x1,
    y1,
    width: x1 - x0,
    height: y1 - y0,
  };
}

/**
 * Detects tables by analyzing line alignment
 */
function detectTables(lines: OCRLine[], minCells: number): Table[] {
  const tables: Table[] = [];

  // Group lines by vertical position
  const lineGroups = groupLinesByRow(lines);

  // Find potential table rows (lines with consistent word spacing)
  const tableRegions = findTableRegions(lineGroups, minCells);

  for (const region of tableRegions) {
    const table = buildTable(region);
    if (table) {
      tables.push(table);
    }
  }

  return tables;
}

/**
 * Groups lines by vertical position
 */
function groupLinesByRow(lines: OCRLine[]): OCRLine[][] {
  if (lines.length === 0) return [];

  const sorted = [...lines].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const groups: OCRLine[][] = [[sorted[0]!]];

  for (let i = 1; i < sorted.length; i++) {
    const line = sorted[i]!;
    const lastGroup = groups[groups.length - 1]!;
    const lastLine = lastGroup[lastGroup.length - 1]!;

    // Check if on same row (overlapping vertically)
    const overlap = Math.min(line.bbox.y1, lastLine.bbox.y1) -
                    Math.max(line.bbox.y0, lastLine.bbox.y0);
    const minHeight = Math.min(
      line.bbox.y1 - line.bbox.y0,
      lastLine.bbox.y1 - lastLine.bbox.y0
    );

    if (overlap > minHeight * 0.5) {
      lastGroup.push(line);
    } else {
      groups.push([line]);
    }
  }

  return groups;
}

/**
 * Finds regions that look like tables
 */
function findTableRegions(
  lineGroups: OCRLine[][],
  minCells: number
): OCRLine[][] {
  const regions: OCRLine[][] = [];
  let currentRegion: OCRLine[] = [];

  for (const group of lineGroups) {
    // Table rows typically have multiple lines on same row
    if (group.length >= 2) {
      currentRegion.push(...group);
    } else if (currentRegion.length >= minCells) {
      regions.push(currentRegion);
      currentRegion = [];
    } else {
      currentRegion = [];
    }
  }

  if (currentRegion.length >= minCells) {
    regions.push(currentRegion);
  }

  return regions;
}

/**
 * Builds a table structure from lines
 */
function buildTable(lines: OCRLine[]): Table | null {
  if (lines.length < 2) return null;

  // Group by rows
  const rowGroups = groupLinesByRow(lines);

  // Estimate column positions
  const columnPositions = estimateColumnPositions(lines);

  // Build cells
  const cells: TableCell[] = [];
  let rowIndex = 0;

  for (const rowLines of rowGroups) {
    for (const line of rowLines) {
      const colIndex = findColumnIndex(line.bbox.x0, columnPositions);
      cells.push({
        row: rowIndex,
        col: colIndex,
        rowSpan: 1,
        colSpan: 1,
        bounds: line.bbox,
        text: line.text,
        confidence: line.confidence,
      });
    }
    rowIndex++;
  }

  const bounds = calculateLinesBounds(lines);

  return {
    id: `table-${Date.now()}`,
    bounds,
    rows: rowGroups.length,
    cols: columnPositions.length,
    cells,
    hasHeader: detectTableHeader(rowGroups),
  };
}

/**
 * Estimates column positions from lines
 */
function estimateColumnPositions(lines: OCRLine[]): number[] {
  const leftPositions = lines.map((l) => l.bbox.x0);
  const sorted = [...new Set(leftPositions)].sort((a, b) => a - b);

  // Cluster nearby positions
  const clusters: number[] = [];
  let lastPos = -Infinity;
  const threshold = 20; // pixels

  for (const pos of sorted) {
    if (pos - lastPos > threshold) {
      clusters.push(pos);
    }
    lastPos = pos;
  }

  return clusters;
}

/**
 * Finds which column a position belongs to
 */
function findColumnIndex(x: number, columnPositions: number[]): number {
  for (let i = columnPositions.length - 1; i >= 0; i--) {
    if (x >= (columnPositions[i] ?? 0) - 10) {
      return i;
    }
  }
  return 0;
}

/**
 * Detects if first row is likely a header
 */
function detectTableHeader(rowGroups: OCRLine[][]): boolean {
  if (rowGroups.length < 2) return false;

  const firstRow = rowGroups[0]!;
  const secondRow = rowGroups[1]!;

  // Check if first row has different characteristics (bold, different size)
  const avgFirstHeight = average(firstRow.map((l) => l.bbox.y1 - l.bbox.y0));
  const avgSecondHeight = average(secondRow.map((l) => l.bbox.y1 - l.bbox.y0));

  // If first row is taller, likely a header
  return avgFirstHeight > avgSecondHeight * 1.1;
}

/**
 * Calculates average of numbers
 */
function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Calculates bounding box of lines
 */
function calculateLinesBounds(lines: OCRLine[]): BoundingBox {
  if (lines.length === 0) {
    return { x0: 0, y0: 0, x1: 0, y1: 0, width: 0, height: 0 };
  }

  const x0 = Math.min(...lines.map((l) => l.bbox.x0));
  const y0 = Math.min(...lines.map((l) => l.bbox.y0));
  const x1 = Math.max(...lines.map((l) => l.bbox.x1));
  const y1 = Math.max(...lines.map((l) => l.bbox.y1));

  return {
    x0,
    y0,
    x1,
    y1,
    width: x1 - x0,
    height: y1 - y0,
  };
}

/**
 * Detects image regions (low text density areas)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function detectImageRegions(_blocks: OCRBlock[]): ImageRegion[] {
  // For now, we can't detect images directly from OCR
  // This would require analyzing the original page
  // Returning empty for now - will be enhanced with page image analysis
  return [];
}

/**
 * Builds the reading order of all regions
 */
function buildReadingOrder(
  columns: Column[],
  tables: Table[],
  images: ImageRegion[],
  headers: TextRegion[],
  footers: TextRegion[],
  direction: 'ltr' | 'rtl' | 'ttb'
): Region[] {
  const regions: Region[] = [];
  let order = 0;

  // Headers first
  for (const header of headers) {
    regions.push({
      id: header.id,
      type: 'header',
      bounds: header.bounds,
      order: order++,
    });
  }

  // Content (columns, tables, images)
  const contentRegions: Region[] = [];

  // Add columns
  for (const col of columns) {
    contentRegions.push({
      id: col.id,
      type: 'column',
      bounds: col.bounds,
      order: 0,
    });
  }

  // Add tables
  for (const table of tables) {
    contentRegions.push({
      id: table.id,
      type: 'table',
      bounds: table.bounds,
      order: 0,
    });
  }

  // Add images
  for (const image of images) {
    contentRegions.push({
      id: image.id,
      type: 'image',
      bounds: image.bounds,
      order: 0,
    });
  }

  // Sort content by reading direction
  if (direction === 'ltr') {
    // Left-to-right, top-to-bottom
    contentRegions.sort((a, b) => {
      const yDiff = a.bounds.y0 - b.bounds.y0;
      if (Math.abs(yDiff) > 20) return yDiff;
      return a.bounds.x0 - b.bounds.x0;
    });
  } else if (direction === 'rtl') {
    // Right-to-left, top-to-bottom
    contentRegions.sort((a, b) => {
      const yDiff = a.bounds.y0 - b.bounds.y0;
      if (Math.abs(yDiff) > 20) return yDiff;
      return b.bounds.x0 - a.bounds.x0;
    });
  } else {
    // Top-to-bottom, right-to-left (vertical CJK)
    contentRegions.sort((a, b) => {
      const xDiff = b.bounds.x0 - a.bounds.x0;
      if (Math.abs(xDiff) > 20) return xDiff;
      return a.bounds.y0 - b.bounds.y0;
    });
  }

  // Assign order numbers
  for (const region of contentRegions) {
    region.order = order++;
    regions.push(region);
  }

  // Footers last
  for (const footer of footers) {
    regions.push({
      id: footer.id,
      type: 'footer',
      bounds: footer.bounds,
      order: order++,
    });
  }

  return regions;
}

/**
 * Exports table to CSV format
 */
export function tableToCSV(table: Table): string {
  const rows: string[][] = [];

  // Initialize empty grid
  for (let r = 0; r < table.rows; r++) {
    rows.push(new Array(table.cols).fill(''));
  }

  // Fill cells
  for (const cell of table.cells) {
    if (rows[cell.row]) {
      rows[cell.row]![cell.col] = cell.text.replace(/"/g, '""');
    }
  }

  // Convert to CSV
  return rows
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
}
