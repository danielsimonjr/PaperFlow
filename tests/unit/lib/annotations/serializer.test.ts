import { describe, it, expect } from 'vitest';
import {
  serializeAnnotation,
  deserializeAnnotation,
  exportAnnotations,
  importAnnotations,
  mergeAnnotations,
  validateAnnotationData,
  ANNOTATION_FORMAT_VERSION,
} from '@lib/annotations/serializer';
import type { Annotation } from '@/types';

describe('annotation serializer', () => {
  const sampleAnnotation: Annotation = {
    id: 'test-id-1',
    type: 'highlight',
    pageIndex: 0,
    rects: [{ x: 100, y: 200, width: 50, height: 20 }],
    color: '#FFEB3B',
    opacity: 0.5,
    content: 'Sample text',
    author: 'Test User',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    replies: [
      {
        id: 'reply-1',
        content: 'A reply',
        author: 'Another User',
        createdAt: new Date('2024-01-15T11:00:00Z'),
      },
    ],
  };

  describe('serializeAnnotation', () => {
    it('should serialize annotation to JSON-friendly format', () => {
      const serialized = serializeAnnotation(sampleAnnotation);

      expect(serialized.id).toBe('test-id-1');
      expect(serialized.type).toBe('highlight');
      expect(serialized.pageIndex).toBe(0);
      expect(serialized.color).toBe('#FFEB3B');
      expect(typeof serialized.createdAt).toBe('string');
      expect(typeof serialized.updatedAt).toBe('string');
    });

    it('should serialize dates as ISO strings', () => {
      const serialized = serializeAnnotation(sampleAnnotation);

      expect(serialized.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(serialized.updatedAt).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should serialize replies', () => {
      const serialized = serializeAnnotation(sampleAnnotation);

      expect(serialized.replies).toHaveLength(1);
      expect(serialized.replies?.[0]?.content).toBe('A reply');
      expect(typeof serialized.replies?.[0]?.createdAt).toBe('string');
    });
  });

  describe('deserializeAnnotation', () => {
    it('should deserialize annotation from JSON format', () => {
      const serialized = serializeAnnotation(sampleAnnotation);
      const deserialized = deserializeAnnotation(serialized);

      expect(deserialized.id).toBe('test-id-1');
      expect(deserialized.type).toBe('highlight');
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve all properties', () => {
      const serialized = serializeAnnotation(sampleAnnotation);
      const deserialized = deserializeAnnotation(serialized);

      expect(deserialized.content).toBe('Sample text');
      expect(deserialized.author).toBe('Test User');
      expect(deserialized.rects).toEqual(sampleAnnotation.rects);
    });

    it('should deserialize replies', () => {
      const serialized = serializeAnnotation(sampleAnnotation);
      const deserialized = deserializeAnnotation(serialized);

      expect(deserialized.replies).toHaveLength(1);
      expect(deserialized.replies?.[0]?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('exportAnnotations', () => {
    it('should export annotations as JSON string', () => {
      const annotations = [sampleAnnotation];
      const exported = exportAnnotations(annotations);

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe(ANNOTATION_FORMAT_VERSION);
      expect(parsed.annotations).toHaveLength(1);
    });

    it('should include document name if provided', () => {
      const exported = exportAnnotations([sampleAnnotation], 'test.pdf');
      const parsed = JSON.parse(exported);

      expect(parsed.documentName).toBe('test.pdf');
    });

    it('should include export timestamp', () => {
      const exported = exportAnnotations([sampleAnnotation]);
      const parsed = JSON.parse(exported);

      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt)).toBeInstanceOf(Date);
    });
  });

  describe('importAnnotations', () => {
    it('should import annotations from new format', () => {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        annotations: [serializeAnnotation(sampleAnnotation)],
      };

      const imported = importAnnotations(JSON.stringify(exportData));

      expect(imported).toHaveLength(1);
      expect(imported[0]?.id).toBe('test-id-1');
    });

    it('should import annotations from old format (array)', () => {
      const oldFormat = [serializeAnnotation(sampleAnnotation)];
      const imported = importAnnotations(JSON.stringify(oldFormat));

      expect(imported).toHaveLength(1);
    });

    it('should throw on invalid JSON', () => {
      expect(() => importAnnotations('not valid json')).toThrow();
    });

    it('should throw on unsupported version', () => {
      const futureVersion = {
        version: 999,
        annotations: [],
      };

      expect(() => importAnnotations(JSON.stringify(futureVersion))).toThrow(
        /not supported/
      );
    });
  });

  describe('validateAnnotationData', () => {
    it('should return true for valid annotation data', () => {
      const data = serializeAnnotation(sampleAnnotation);
      expect(validateAnnotationData(data)).toBe(true);
    });

    it('should return false for invalid data', () => {
      expect(validateAnnotationData(null)).toBe(false);
      expect(validateAnnotationData(undefined)).toBe(false);
      expect(validateAnnotationData({})).toBe(false);
      expect(validateAnnotationData({ id: 'test' })).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const incomplete = {
        id: 'test',
        type: 'highlight',
        // missing other required fields
      };
      expect(validateAnnotationData(incomplete)).toBe(false);
    });
  });

  describe('mergeAnnotations', () => {
    it('should merge annotations without conflicts', () => {
      const existing: Annotation[] = [
        { ...sampleAnnotation, id: 'existing-1' },
      ];
      const imported: Annotation[] = [
        { ...sampleAnnotation, id: 'imported-1' },
      ];

      const merged = mergeAnnotations(existing, imported);

      expect(merged).toHaveLength(2);
      expect(merged.find((a) => a.id === 'existing-1')).toBeDefined();
      expect(merged.find((a) => a.id === 'imported-1')).toBeDefined();
    });

    it('should generate new IDs for conflicts', () => {
      const existing: Annotation[] = [
        { ...sampleAnnotation, id: 'same-id' },
      ];
      const imported: Annotation[] = [
        { ...sampleAnnotation, id: 'same-id', content: 'Different content' },
      ];

      const merged = mergeAnnotations(existing, imported);

      expect(merged).toHaveLength(2);
      const ids = merged.map((a) => a.id);
      expect(new Set(ids).size).toBe(2); // All IDs should be unique
    });

    it('should preserve existing annotations', () => {
      const existing: Annotation[] = [
        { ...sampleAnnotation, id: 'existing-1', content: 'Original' },
      ];
      const imported: Annotation[] = [];

      const merged = mergeAnnotations(existing, imported);

      expect(merged).toHaveLength(1);
      expect(merged[0]?.content).toBe('Original');
    });
  });
});
