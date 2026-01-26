import type { Annotation, AnnotationReply, AnnotationRect } from '@/types';

/**
 * Annotation serialization format version.
 * Increment when making breaking changes to the format.
 */
export const ANNOTATION_FORMAT_VERSION = 1;

/**
 * Serialized annotation format for JSON export.
 */
export interface SerializedAnnotation {
  id: string;
  type: Annotation['type'];
  pageIndex: number;
  rects: AnnotationRect[];
  color: string;
  opacity: number;
  content?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  replies?: SerializedReply[];
}

export interface SerializedReply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface AnnotationExport {
  version: number;
  exportedAt: string;
  documentName?: string;
  annotations: SerializedAnnotation[];
}

/**
 * Serialize a single annotation to JSON-friendly format.
 */
export function serializeAnnotation(annotation: Annotation): SerializedAnnotation {
  return {
    id: annotation.id,
    type: annotation.type,
    pageIndex: annotation.pageIndex,
    rects: annotation.rects.map((rect) => ({ ...rect })),
    color: annotation.color,
    opacity: annotation.opacity,
    content: annotation.content,
    author: annotation.author,
    createdAt: annotation.createdAt.toISOString(),
    updatedAt: annotation.updatedAt.toISOString(),
    replies: annotation.replies?.map(serializeReply),
  };
}

/**
 * Serialize a reply to JSON-friendly format.
 */
export function serializeReply(reply: AnnotationReply): SerializedReply {
  return {
    id: reply.id,
    content: reply.content,
    author: reply.author,
    createdAt: reply.createdAt.toISOString(),
  };
}

/**
 * Deserialize a single annotation from JSON format.
 */
export function deserializeAnnotation(data: SerializedAnnotation): Annotation {
  return {
    id: data.id,
    type: data.type,
    pageIndex: data.pageIndex,
    rects: data.rects.map((rect) => ({ ...rect })),
    color: data.color,
    opacity: data.opacity,
    content: data.content,
    author: data.author,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    replies: data.replies?.map(deserializeReply),
  };
}

/**
 * Deserialize a reply from JSON format.
 */
export function deserializeReply(data: SerializedReply): AnnotationReply {
  return {
    id: data.id,
    content: data.content,
    author: data.author,
    createdAt: new Date(data.createdAt),
  };
}

/**
 * Export annotations to a JSON string.
 *
 * @param annotations - Array of annotations to export
 * @param documentName - Optional document name for reference
 * @returns JSON string ready for download
 */
export function exportAnnotations(
  annotations: Annotation[],
  documentName?: string
): string {
  const exportData: AnnotationExport = {
    version: ANNOTATION_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    documentName,
    annotations: annotations.map(serializeAnnotation),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import annotations from a JSON string.
 *
 * @param json - JSON string to import
 * @returns Array of annotations
 * @throws Error if JSON is invalid or version is incompatible
 */
export function importAnnotations(json: string): Annotation[] {
  const data = JSON.parse(json);

  // Validate format
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid annotation data format');
  }

  // Check version
  if (data.version && data.version > ANNOTATION_FORMAT_VERSION) {
    throw new Error(
      `Annotation format version ${data.version} is not supported. ` +
        `Please update PaperFlow to import these annotations.`
    );
  }

  // Handle both old format (array) and new format (object with annotations)
  const annotationsData = Array.isArray(data) ? data : data.annotations;

  if (!Array.isArray(annotationsData)) {
    throw new Error('Invalid annotation data: expected array of annotations');
  }

  return annotationsData.map(deserializeAnnotation);
}

/**
 * Validate annotation data structure.
 *
 * @param data - Data to validate
 * @returns True if valid, false otherwise
 */
export function validateAnnotationData(data: unknown): data is SerializedAnnotation {
  if (!data || typeof data !== 'object') return false;

  const annotation = data as Record<string, unknown>;

  return (
    typeof annotation.id === 'string' &&
    typeof annotation.type === 'string' &&
    typeof annotation.pageIndex === 'number' &&
    Array.isArray(annotation.rects) &&
    typeof annotation.color === 'string' &&
    typeof annotation.opacity === 'number' &&
    typeof annotation.createdAt === 'string' &&
    typeof annotation.updatedAt === 'string'
  );
}

/**
 * Generate a unique ID for annotations when importing without IDs.
 */
export function generateAnnotationId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Merge imported annotations with existing annotations.
 * Handles ID conflicts by generating new IDs for imports.
 *
 * @param existing - Existing annotations
 * @param imported - Imported annotations
 * @returns Merged array with no ID conflicts
 */
export function mergeAnnotations(
  existing: Annotation[],
  imported: Annotation[]
): Annotation[] {
  const existingIds = new Set(existing.map((a) => a.id));

  const resolvedImports = imported.map((annotation) => {
    if (existingIds.has(annotation.id)) {
      // Generate new ID for conflict
      return {
        ...annotation,
        id: generateAnnotationId(),
      };
    }
    return annotation;
  });

  return [...existing, ...resolvedImports];
}
