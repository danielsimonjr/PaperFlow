/**
 * Page layout for the viewer: one page, a scrolling stack, or a two-page spread.
 */
export type ViewerLayout = 'single' | 'continuous' | 'spread';

/**
 * The two page numbers in one spread. A null side is an empty slot.
 */
export interface SpreadSlots {
  left: number | null;
  right: number | null;
}

/**
 * Choose the left and right pages for the current spread.
 * With cover mode, page 1 sits alone on the right.
 */
export function spreadSlots(
  currentPage: number,
  pageCount: number,
  coverMode = true
): SpreadSlots {
  const within = (page: number): number | null =>
    page >= 1 && page <= pageCount ? page : null;

  if (coverMode) {
    if (currentPage <= 1) {
      return { left: null, right: within(1) };
    }
    if (currentPage % 2 === 0) {
      return { left: within(currentPage), right: within(currentPage + 1) };
    }
    return { left: within(currentPage - 1), right: within(currentPage) };
  }

  if (currentPage % 2 === 1) {
    return { left: within(currentPage), right: within(currentPage + 1) };
  }
  return { left: within(currentPage - 1), right: within(currentPage) };
}
