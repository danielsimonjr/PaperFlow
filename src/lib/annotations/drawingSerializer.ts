/**
 * Drawing path serialization utilities.
 * Handles saving and loading drawing annotations with pressure data.
 */

export interface SerializedPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SerializedDrawingPath {
  points: SerializedPoint[];
}

export interface SerializedDrawing {
  id: string;
  type: 'drawing';
  pageIndex: number;
  paths: SerializedDrawingPath[];
  color: string;
  strokeWidth: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serialize a drawing annotation's paths for storage.
 */
export function serializeDrawingPaths(
  paths: { points: { x: number; y: number; pressure?: number }[] }[]
): SerializedDrawingPath[] {
  return paths.map((path) => ({
    points: path.points.map((point) => ({
      x: Math.round(point.x * 1000) / 1000, // Round to 3 decimal places
      y: Math.round(point.y * 1000) / 1000,
      pressure: point.pressure !== undefined
        ? Math.round(point.pressure * 1000) / 1000
        : undefined,
    })),
  }));
}

/**
 * Deserialize drawing paths from storage.
 */
export function deserializeDrawingPaths(
  paths: SerializedDrawingPath[]
): { points: { x: number; y: number; pressure?: number }[] }[] {
  return paths.map((path) => ({
    points: path.points.map((point) => ({
      x: point.x,
      y: point.y,
      pressure: point.pressure,
    })),
  }));
}

/**
 * Compress drawing paths by removing redundant points.
 * Uses the Ramer-Douglas-Peucker algorithm.
 *
 * @param points - Array of points to simplify
 * @param epsilon - Maximum distance threshold for point removal
 * @returns Simplified array of points
 */
export function simplifyPath(
  points: SerializedPoint[],
  epsilon: number = 0.5
): SerializedPoint[] {
  if (points.length < 3) return points;

  // Find the point with the maximum distance from the line
  let maxDistance = 0;
  let maxIndex = 0;

  // We know these exist since length >= 3
  const start = points[0]!;
  const end = points[points.length - 1]!;

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i]!;
    const distance = perpendicularDistance(point, start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);

    // Combine results, removing duplicate point at junction
    return [...left.slice(0, -1), ...right];
  }

  // All points are close to the line, keep only endpoints
  // But preserve pressure data from middle points
  const avgPressure = points.reduce((sum, p) => sum + (p.pressure || 0.5), 0) / points.length;

  return [
    { x: start.x, y: start.y, pressure: start.pressure || avgPressure },
    { x: end.x, y: end.y, pressure: end.pressure || avgPressure },
  ];
}

/**
 * Calculate perpendicular distance from a point to a line.
 */
function perpendicularDistance(
  point: SerializedPoint,
  lineStart: SerializedPoint,
  lineEnd: SerializedPoint
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    // Line is actually a point
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        (dx * dx + dy * dy)
    )
  );

  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

/**
 * Calculate bounding box for a drawing's paths.
 */
export function calculateDrawingBounds(
  paths: SerializedDrawingPath[]
): { x: number; y: number; width: number; height: number } | null {
  if (paths.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const path of paths) {
    for (const point of path.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (!isFinite(minX)) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Validate drawing path data structure.
 */
export function validateDrawingPaths(
  data: unknown
): data is SerializedDrawingPath[] {
  if (!Array.isArray(data)) return false;

  return data.every((path) => {
    if (typeof path !== 'object' || path === null) return false;
    if (!Array.isArray((path as { points?: unknown }).points)) return false;

    return (path as { points: unknown[] }).points.every((point) => {
      if (typeof point !== 'object' || point === null) return false;
      const p = point as Record<string, unknown>;
      return (
        typeof p.x === 'number' &&
        typeof p.y === 'number' &&
        (p.pressure === undefined || typeof p.pressure === 'number')
      );
    });
  });
}

/**
 * Merge multiple drawing paths into one (for combining strokes).
 */
export function mergeDrawingPaths(
  pathsArray: SerializedDrawingPath[][]
): SerializedDrawingPath[] {
  return pathsArray.flat();
}

/**
 * Clone drawing paths deeply.
 */
export function cloneDrawingPaths(
  paths: SerializedDrawingPath[]
): SerializedDrawingPath[] {
  return paths.map((path) => ({
    points: path.points.map((point) => ({ ...point })),
  }));
}
