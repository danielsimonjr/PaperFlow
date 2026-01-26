/**
 * Coordinate transformation utilities for converting between PDF and screen coordinates.
 *
 * PDF Coordinate System:
 * - Origin is at the bottom-left of the page
 * - Y increases upward
 * - Units are in PDF points (1/72 inch)
 *
 * Screen Coordinate System:
 * - Origin is at the top-left of the viewport
 * - Y increases downward
 * - Units are in CSS pixels
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformContext {
  /** Current zoom level as a decimal (1.0 = 100%) */
  scale: number;
  /** Page height in PDF points */
  pageHeight: number;
  /** Horizontal offset from viewport origin to page origin */
  offsetX?: number;
  /** Vertical offset from viewport origin to page origin */
  offsetY?: number;
}

/**
 * Convert a point from PDF coordinates to screen coordinates.
 *
 * @param point - Point in PDF coordinates
 * @param context - Transformation context
 * @returns Point in screen coordinates
 */
export function pdfToScreen(point: Point, context: TransformContext): Point {
  const { scale, pageHeight, offsetX = 0, offsetY = 0 } = context;

  return {
    x: point.x * scale + offsetX,
    y: (pageHeight - point.y) * scale + offsetY,
  };
}

/**
 * Convert a point from screen coordinates to PDF coordinates.
 *
 * @param point - Point in screen coordinates
 * @param context - Transformation context
 * @returns Point in PDF coordinates
 */
export function screenToPdf(point: Point, context: TransformContext): Point {
  const { scale, pageHeight, offsetX = 0, offsetY = 0 } = context;

  return {
    x: (point.x - offsetX) / scale,
    y: pageHeight - (point.y - offsetY) / scale,
  };
}

/**
 * Convert a rectangle from PDF coordinates to screen coordinates.
 *
 * @param rect - Rectangle in PDF coordinates
 * @param context - Transformation context
 * @returns Rectangle in screen coordinates
 */
export function pdfRectToScreen(rect: Rect, context: TransformContext): Rect {
  const { scale, pageHeight, offsetX = 0, offsetY = 0 } = context;

  // In PDF coords, rect.y is the bottom of the rect
  // In screen coords, we need the top
  const screenY = (pageHeight - rect.y - rect.height) * scale + offsetY;

  return {
    x: rect.x * scale + offsetX,
    y: screenY,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/**
 * Convert a rectangle from screen coordinates to PDF coordinates.
 *
 * @param rect - Rectangle in screen coordinates
 * @param context - Transformation context
 * @returns Rectangle in PDF coordinates
 */
export function screenRectToPdf(rect: Rect, context: TransformContext): Rect {
  const { scale, pageHeight, offsetX = 0, offsetY = 0 } = context;

  const pdfX = (rect.x - offsetX) / scale;
  const pdfWidth = rect.width / scale;
  const pdfHeight = rect.height / scale;
  // Convert screen Y to PDF Y (bottom of rect in PDF coords)
  const pdfY = pageHeight - (rect.y - offsetY) / scale - pdfHeight;

  return {
    x: pdfX,
    y: pdfY,
    width: pdfWidth,
    height: pdfHeight,
  };
}

/**
 * Get the bounding rectangle that contains all given rectangles.
 *
 * @param rects - Array of rectangles
 * @returns Bounding rectangle or null if array is empty
 */
export function getBoundingRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a point is inside a rectangle.
 *
 * @param point - Point to check
 * @param rect - Rectangle to check against
 * @returns True if point is inside rectangle
 */
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if two rectangles intersect.
 *
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles intersect
 */
export function rectsIntersect(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Convert DOMRect from getClientRects() to our Rect format.
 *
 * @param domRect - DOMRect from the browser
 * @param containerRect - Container element's bounding rect for offset calculation
 * @returns Rect in container-relative coordinates
 */
export function domRectToRect(
  domRect: DOMRect,
  containerRect: DOMRect
): Rect {
  return {
    x: domRect.left - containerRect.left,
    y: domRect.top - containerRect.top,
    width: domRect.width,
    height: domRect.height,
  };
}

/**
 * Normalize rectangles by merging overlapping ones and sorting by position.
 *
 * @param rects - Array of rectangles to normalize
 * @param tolerance - Tolerance for considering rects as same line (default: 2)
 * @returns Normalized array of rectangles
 */
export function normalizeRects(rects: Rect[], tolerance: number = 2): Rect[] {
  if (rects.length === 0) return [];

  // Sort by y position first, then x position
  const sorted = [...rects].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > tolerance) return yDiff;
    return a.x - b.x;
  });

  const firstRect = sorted[0];
  if (!firstRect) return [];

  const result: Rect[] = [];
  let current: Rect = { ...firstRect };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (!next) continue;

    // Check if on the same line and adjacent/overlapping
    const sameLine = Math.abs(next.y - current.y) <= tolerance;
    const adjacent = next.x <= current.x + current.width + tolerance;

    if (sameLine && adjacent) {
      // Merge rectangles
      const newRight = Math.max(
        current.x + current.width,
        next.x + next.width
      );
      current.width = newRight - current.x;
      current.height = Math.max(current.height, next.height);
    } else {
      result.push(current);
      current = { ...next };
    }
  }

  result.push(current);
  return result;
}
