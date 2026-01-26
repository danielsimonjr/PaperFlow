import { describe, it, expect } from 'vitest';
import {
  serializeDrawingPaths,
  deserializeDrawingPaths,
  simplifyPath,
  calculateDrawingBounds,
  validateDrawingPaths,
  mergeDrawingPaths,
  cloneDrawingPaths,
  type SerializedDrawingPath,
  type SerializedPoint,
} from '@/lib/annotations/drawingSerializer';

describe('Drawing Serializer', () => {
  describe('serializeDrawingPaths', () => {
    it('serializes paths with points correctly', () => {
      const paths = [
        {
          points: [
            { x: 10.123456, y: 20.654321, pressure: 0.5 },
            { x: 30.111, y: 40.222, pressure: 0.7 },
          ],
        },
      ];

      const result = serializeDrawingPaths(paths);

      expect(result).toHaveLength(1);
      expect(result[0].points[0].x).toBe(10.123);
      expect(result[0].points[0].y).toBe(20.654);
      expect(result[0].points[0].pressure).toBe(0.5);
    });

    it('rounds coordinates to 3 decimal places', () => {
      const paths = [
        {
          points: [{ x: 1.23456789, y: 9.87654321 }],
        },
      ];

      const result = serializeDrawingPaths(paths);

      expect(result[0].points[0].x).toBe(1.235);
      expect(result[0].points[0].y).toBe(9.877);
    });

    it('handles undefined pressure', () => {
      const paths = [
        {
          points: [{ x: 10, y: 20 }],
        },
      ];

      const result = serializeDrawingPaths(paths);

      expect(result[0].points[0].pressure).toBeUndefined();
    });
  });

  describe('deserializeDrawingPaths', () => {
    it('deserializes paths correctly', () => {
      const serialized: SerializedDrawingPath[] = [
        {
          points: [
            { x: 10, y: 20, pressure: 0.5 },
            { x: 30, y: 40, pressure: 0.7 },
          ],
        },
      ];

      const result = deserializeDrawingPaths(serialized);

      expect(result).toHaveLength(1);
      expect(result[0].points[0]).toEqual({ x: 10, y: 20, pressure: 0.5 });
      expect(result[0].points[1]).toEqual({ x: 30, y: 40, pressure: 0.7 });
    });
  });

  describe('simplifyPath', () => {
    it('returns same points for paths with less than 3 points', () => {
      const points: SerializedPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ];

      const result = simplifyPath(points);

      expect(result).toEqual(points);
    });

    it('simplifies a straight line', () => {
      const points: SerializedPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
        { x: 15, y: 15 },
        { x: 20, y: 20 },
      ];

      const result = simplifyPath(points, 1);

      // Should simplify to just start and end points since all are on same line
      expect(result.length).toBeLessThan(points.length);
    });

    it('preserves points that deviate from line', () => {
      const points: SerializedPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 100 }, // Big deviation
        { x: 20, y: 0 },
      ];

      const result = simplifyPath(points, 1);

      expect(result).toHaveLength(3);
    });
  });

  describe('calculateDrawingBounds', () => {
    it('calculates bounds correctly', () => {
      const paths: SerializedDrawingPath[] = [
        {
          points: [
            { x: 10, y: 20 },
            { x: 50, y: 80 },
          ],
        },
        {
          points: [
            { x: 5, y: 30 },
            { x: 60, y: 70 },
          ],
        },
      ];

      const bounds = calculateDrawingBounds(paths);

      expect(bounds).toEqual({
        x: 5,
        y: 20,
        width: 55,
        height: 60,
      });
    });

    it('returns null for empty paths', () => {
      const bounds = calculateDrawingBounds([]);

      expect(bounds).toBeNull();
    });

    it('handles single point path', () => {
      const paths: SerializedDrawingPath[] = [
        {
          points: [{ x: 100, y: 200 }],
        },
      ];

      const bounds = calculateDrawingBounds(paths);

      expect(bounds).toEqual({
        x: 100,
        y: 200,
        width: 0,
        height: 0,
      });
    });
  });

  describe('validateDrawingPaths', () => {
    it('returns true for valid paths', () => {
      const paths: SerializedDrawingPath[] = [
        {
          points: [
            { x: 10, y: 20 },
            { x: 30, y: 40 },
          ],
        },
      ];

      expect(validateDrawingPaths(paths)).toBe(true);
    });

    it('returns false for non-array', () => {
      expect(validateDrawingPaths('not an array')).toBe(false);
      expect(validateDrawingPaths(null)).toBe(false);
      expect(validateDrawingPaths(undefined)).toBe(false);
    });

    it('returns false for invalid point data', () => {
      const paths = [
        {
          points: [{ x: 'not a number', y: 20 }],
        },
      ];

      expect(validateDrawingPaths(paths)).toBe(false);
    });

    it('returns false for missing points array', () => {
      const paths = [{ notPoints: [] }];

      expect(validateDrawingPaths(paths)).toBe(false);
    });
  });

  describe('mergeDrawingPaths', () => {
    it('merges multiple path arrays', () => {
      const paths1: SerializedDrawingPath[] = [
        { points: [{ x: 0, y: 0 }] },
      ];
      const paths2: SerializedDrawingPath[] = [
        { points: [{ x: 10, y: 10 }] },
      ];

      const result = mergeDrawingPaths([paths1, paths2]);

      expect(result).toHaveLength(2);
    });
  });

  describe('cloneDrawingPaths', () => {
    it('creates a deep copy', () => {
      const original: SerializedDrawingPath[] = [
        {
          points: [{ x: 10, y: 20, pressure: 0.5 }],
        },
      ];

      const clone = cloneDrawingPaths(original);

      // Modify clone
      clone[0].points[0].x = 999;

      // Original should be unchanged
      expect(original[0].points[0].x).toBe(10);
    });
  });
});
