import { HIGHLIGHT_COLORS } from './SelectionPopup';

/**
 * Stroke colors for a new drawing and for recoloring a saved drawing.
 */
export const DRAWING_COLORS = [
  { name: 'Black', value: '#111111' },
  ...HIGHLIGHT_COLORS,
] as const;
