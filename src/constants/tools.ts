export const TOOL_IDS = {
  SELECT: 'select',
  HAND: 'hand',
  TEXT: 'text',
  HIGHLIGHT: 'highlight',
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'strikethrough',
  NOTE: 'note',
  DRAW: 'draw',
  ERASER: 'eraser',
  SHAPE_RECTANGLE: 'shape-rectangle',
  SHAPE_CIRCLE: 'shape-circle',
  SHAPE_ARROW: 'shape-arrow',
  SHAPE_LINE: 'shape-line',
  STAMP: 'stamp',
  SIGNATURE: 'signature',
} as const;

export type ToolId = (typeof TOOL_IDS)[keyof typeof TOOL_IDS];

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Orange', value: '#FF9800' },
] as const;

export const DRAWING_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Purple', value: '#A855F7' },
] as const;

export const NOTE_COLORS = [
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Purple', value: '#EDE9FE' },
] as const;

export const STAMP_TYPES = [
  { id: 'approved', label: 'Approved', color: '#22C55E' },
  { id: 'rejected', label: 'Rejected', color: '#EF4444' },
  { id: 'confidential', label: 'Confidential', color: '#EF4444' },
  { id: 'draft', label: 'Draft', color: '#F97316' },
  { id: 'final', label: 'Final', color: '#3B82F6' },
] as const;
