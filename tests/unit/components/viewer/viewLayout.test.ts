import { describe, expect, it } from 'vitest';
import { spreadPlaceholderSize, spreadSlots } from '@/components/viewer/viewLayout';

describe('spreadSlots', () => {
  it('puts the cover alone on the right', () => {
    expect(spreadSlots(1, 5, true)).toEqual({ left: null, right: 1 });
  });

  it('pairs an even page with the next odd page in cover mode', () => {
    expect(spreadSlots(2, 5, true)).toEqual({ left: 2, right: 3 });
    expect(spreadSlots(3, 5, true)).toEqual({ left: 2, right: 3 });
    expect(spreadSlots(5, 5, true)).toEqual({ left: 4, right: 5 });
  });

  it('leaves the last slot empty when the document ends', () => {
    expect(spreadSlots(4, 4, true)).toEqual({ left: 4, right: null });
  });

  it('starts on the left when cover mode is off', () => {
    expect(spreadSlots(1, 4, false)).toEqual({ left: 1, right: 2 });
    expect(spreadSlots(2, 4, false)).toEqual({ left: 1, right: 2 });
  });
});

describe('spreadPlaceholderSize', () => {
  const letter = { width: 612, height: 792 };

  it('copies the facing page on the cover spread', () => {
    const slots = spreadSlots(1, 4, true);
    expect(spreadPlaceholderSize(slots, [letter, letter, letter, letter])).toEqual(letter);
  });

  it('copies the last page when the right slot is empty', () => {
    const slots = spreadSlots(4, 4, true);
    const tall = { width: 612, height: 1008 };
    const pages = [letter, letter, letter, tall];
    expect(spreadPlaceholderSize(slots, pages)).toEqual(tall);
  });

  it('falls back to page 1 when the facing page has no size', () => {
    const slots = spreadSlots(4, 4, true);
    const first = { width: 500, height: 700 };
    const pages = [first, letter, letter, null];
    expect(spreadPlaceholderSize(slots, pages)).toEqual(first);
  });

  it('returns null when both sides have a page', () => {
    const slots = spreadSlots(2, 4, true);
    expect(spreadPlaceholderSize(slots, [letter, letter, letter, letter])).toBeNull();
  });
});
