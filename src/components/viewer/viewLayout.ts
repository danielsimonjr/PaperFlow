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

/** Width and height of a PDF page in points. */
export interface PagePoints {
  width: number;
  height: number;
}

/**
 * Size of the empty side of a spread, in PDF points.
 * The slot copies the facing page. It uses the first page when that page has no positive size.
 * Returns null when neither size is known, or when both sides have a page.
 */
export function spreadPlaceholderSize(
  slots: SpreadSlots,
  pages: ReadonlyArray<PagePoints | null>
): PagePoints | null {
  const facing =
    slots.left === null && slots.right !== null
      ? slots.right
      : slots.right === null && slots.left !== null
        ? slots.left
        : null;
  if (facing === null) return null;

  const facingSize = pages[facing - 1];
  if (facingSize && facingSize.width > 0 && facingSize.height > 0) {
    return facingSize;
  }

  const first = pages[0];
  if (first && first.width > 0 && first.height > 0) {
    return first;
  }

  return null;
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
