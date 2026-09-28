import {
  getAllowedResizeWidths,
  resolveDirectionalResizeWidthStep,
  resolveResizeWidthStep,
} from './resize.helpers';

describe('getAllowedResizeWidths', () => {
  it('keeps every span that fits within effectiveMax', () => {
    expect(getAllowedResizeWidths([4, 8, 12], 16)).toEqual([4, 8, 12]);
  });

  it('drops spans wider than effectiveMax', () => {
    expect(getAllowedResizeWidths([4, 8, 12], 8)).toEqual([4, 8]);
  });

  it('returns an empty list when no span fits', () => {
    expect(getAllowedResizeWidths([4, 8, 12], 3)).toEqual([]);
  });
});

describe('resolveResizeWidthStep', () => {
  it('snaps the raw width to the nearest span', () => {
    expect(resolveResizeWidthStep(5, [4, 8, 12], 16)).toBe(4);
    expect(resolveResizeWidthStep(7, [4, 8, 12], 16)).toBe(8);
    expect(resolveResizeWidthStep(11, [4, 8, 12], 16)).toBe(12);
  });

  it('picks the wider span when the raw width is equidistant', () => {
    expect(resolveResizeWidthStep(6, [4, 8, 12], 16)).toBe(8);
  });

  it('never snaps above effectiveMax', () => {
    expect(resolveResizeWidthStep(12, [4, 8, 12], 8)).toBe(8);
  });

  it('clamps raw widths outside the span range to the closest end', () => {
    expect(resolveResizeWidthStep(1, [2, 4, 8], 8)).toBe(2);
    expect(resolveResizeWidthStep(20, [2, 4, 8], 8)).toBe(8);
  });

  it('falls back to the smallest span when none fits effectiveMax', () => {
    expect(resolveResizeWidthStep(5, [4, 8, 12], 3)).toBe(4);
  });

  it('keeps the only span when a page offers a single span', () => {
    expect(resolveResizeWidthStep(1, [4], 4)).toBe(4);
  });
});

describe('resolveDirectionalResizeWidthStep', () => {
  it('returns the next wider span', () => {
    expect(resolveDirectionalResizeWidthStep(4, 'grow', [4, 8, 12], 16)).toBe(
      8,
    );
  });

  it('returns the next narrower span', () => {
    expect(
      resolveDirectionalResizeWidthStep(12, 'shrink', [4, 8, 12], 16),
    ).toBe(8);
  });

  it('returns null at either end of the span range', () => {
    expect(
      resolveDirectionalResizeWidthStep(12, 'grow', [4, 8, 12], 16),
    ).toBeNull();
    expect(
      resolveDirectionalResizeWidthStep(4, 'shrink', [4, 8, 12], 16),
    ).toBeNull();
  });

  it('does not grow past the space left in the row', () => {
    expect(
      resolveDirectionalResizeWidthStep(4, 'grow', [4, 8, 12], 4),
    ).toBeNull();
  });

  it('returns null when a page offers a single span', () => {
    expect(resolveDirectionalResizeWidthStep(4, 'grow', [4], 4)).toBeNull();
    expect(resolveDirectionalResizeWidthStep(4, 'shrink', [4], 4)).toBeNull();
  });
});
