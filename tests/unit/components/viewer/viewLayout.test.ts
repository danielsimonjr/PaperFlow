import { describe, expect, it } from 'vitest';
import { spreadSlots } from '@/components/viewer/viewLayout';

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
