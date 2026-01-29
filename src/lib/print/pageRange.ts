/**
 * Parse a page range string like "1-5, 8, 10-12" into an array of page numbers.
 */
export function parsePageRange(input: string, maxPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1]!, 10));
      const end = Math.min(maxPages, parseInt(rangeMatch[2]!, 10));
      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
