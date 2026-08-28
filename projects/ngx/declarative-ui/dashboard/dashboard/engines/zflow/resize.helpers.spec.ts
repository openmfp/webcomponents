import {
  getAllowedResizeWidths,
  resolveDirectionalResizeWidthStep,
  resolveResizeWidthStep,
} from './resize.helpers';

describe('getAllowedResizeWidths', () => {
  describe('normal case', () => {
    it('returns [1, 2, maxWidth] sorted when all are distinct and within effectiveMax', () => {
      expect(getAllowedResizeWidths(4, 4)).toEqual([1, 2, 4]);
    });

    it('returns values in ascending order', () => {
      const result = getAllowedResizeWidths(6, 6);
      expect(result).toEqual([...result].sort((a, b) => a - b));
    });

    it('all returned values are <= effectiveMax', () => {
      const effectiveMax = 3;
      const result = getAllowedResizeWidths(6, 6, 1, effectiveMax);
      expect(result.every((w) => w <= effectiveMax)).toBe(true);
    });
  });

  describe('deduplication', () => {
    it('removes duplicate when maxWidth equals 1 — candidates [1,2,1] deduplicate to [1,2]', () => {
      expect(getAllowedResizeWidths(1, 4)).toEqual([1, 2]);
    });

    it('removes duplicate when maxWidth equals 2', () => {
      expect(getAllowedResizeWidths(2, 4)).toEqual([1, 2]);
    });

    it('returns no duplicate entries in output', () => {
      const result = getAllowedResizeWidths(3, 4);
      expect(new Set(result).size).toBe(result.length);
    });
  });

  describe('minWidth clamping', () => {
    it('raises candidates below minWidth to minWidth', () => {
      // minWidth=2: candidates 1,2,4 → after clamp: 2,2,4 → deduplicated: [2,4]
      expect(getAllowedResizeWidths(4, 4, 2)).toEqual([2, 4]);
    });

    it('raises all three candidates to minWidth when minWidth is large', () => {
      // minWidth=4, maxWidth=4, columnCount=4: all clamp to 4 → deduplicated: [4]
      expect(getAllowedResizeWidths(4, 4, 4)).toEqual([4]);
    });

    it('returns single value when minWidth equals maxWidth', () => {
      expect(getAllowedResizeWidths(3, 4, 3)).toEqual([3]);
    });
  });

  describe('columnCount clamping', () => {
    it('caps candidates above columnCount to columnCount', () => {
      // columnCount=3: maxWidth=10 is capped to 3; candidates 1,2,3 → [1,2,3]
      expect(getAllowedResizeWidths(10, 3)).toEqual([1, 2, 3]);
    });

    it('caps when columnCount=1, all collapse to 1', () => {
      expect(getAllowedResizeWidths(4, 1)).toEqual([1]);
    });

    it('caps when columnCount=2', () => {
      expect(getAllowedResizeWidths(4, 2)).toEqual([1, 2]);
    });
  });

  describe('effectiveMax filtering', () => {
    it('excludes candidates above effectiveMax', () => {
      // effectiveMax=2: maxWidth=4 is excluded
      expect(getAllowedResizeWidths(4, 4, 1, 2)).toEqual([1, 2]);
    });

    it('returns only the single candidate that equals effectiveMax', () => {
      expect(getAllowedResizeWidths(4, 4, 1, 1)).toEqual([1]);
    });

    it('returns empty array when effectiveMax is 0 and minWidth is 1', () => {
      expect(getAllowedResizeWidths(4, 4, 1, 0)).toEqual([]);
    });
  });

  describe('empty result', () => {
    it('returns [] when minWidth > effectiveMax', () => {
      expect(getAllowedResizeWidths(4, 4, 3, 2)).toEqual([]);
    });

    it('returns [] when minWidth > effectiveMax regardless of maxWidth', () => {
      expect(getAllowedResizeWidths(1, 4, 5, 2)).toEqual([]);
    });
  });
});

describe('resolveResizeWidthStep', () => {
  describe('nearest candidate selection', () => {
    it('returns the higher candidate when rawWidth is equidistant between two', () => {
      // allowed: [1,2,4], rawWidth=3 → |3-2|=1, |3-4|=1 → tie, higher (4) wins
      expect(resolveResizeWidthStep(3, 4, 4)).toBe(4);
    });

    it('returns exact match when rawWidth equals a candidate', () => {
      expect(resolveResizeWidthStep(2, 4, 4)).toBe(2);
    });

    it('returns candidate 1 when rawWidth is clearly closest to 1', () => {
      // allowed: [1,2,4], rawWidth=1.1 → closest is 1
      expect(resolveResizeWidthStep(1, 4, 4)).toBe(1);
    });

    it('returns candidate 4 when rawWidth is clearly closest to 4', () => {
      // allowed: [1,2,4], rawWidth=4
      expect(resolveResizeWidthStep(4, 4, 4)).toBe(4);
    });
  });

  describe('tie-breaking: higher (later) candidate wins', () => {
    it('picks the higher of two equidistant candidates', () => {
      // allowed: [1,2,4] — rawWidth=3 is equidistant from 2 and 4
      // reduce uses <=, so later candidate (4) replaces the current best (2) on a tie
      expect(resolveResizeWidthStep(3, 4, 4)).toBe(4);
    });

    it('picks the higher when rawWidth is between 1 and 2', () => {
      // allowed: [1,2,4] — rawWidth=1.5 equidistant from 1 and 2
      // reduce uses <=, so candidate 2 replaces best 1 on equal distance → returns 2
      expect(resolveResizeWidthStep(1.5, 4, 4)).toBe(2);
    });
  });

  describe('empty allowed set fallback', () => {
    it('returns effectiveMax when minWidth > effectiveMax produces empty allowed list', () => {
      // minWidth=3, effectiveMax=2 → allowed=[] → fallback to effectiveMax=2
      expect(resolveResizeWidthStep(1, 4, 4, 3, 2)).toBe(2);
    });

    it('returns the given effectiveMax value as fallback regardless of rawWidth', () => {
      expect(resolveResizeWidthStep(99, 4, 4, 5, 2)).toBe(2);
    });
  });

  describe('rawWidth outside the candidate range', () => {
    it('returns the smallest candidate when rawWidth is below all candidates', () => {
      // allowed: [2,4] (minWidth=2), rawWidth=0 → closest is 2
      expect(resolveResizeWidthStep(0, 4, 4, 2)).toBe(2);
    });

    it('returns the largest candidate when rawWidth is above all candidates', () => {
      // allowed: [1,2,4], rawWidth=100 → closest is 4
      expect(resolveResizeWidthStep(100, 4, 4)).toBe(4);
    });

    it('returns the largest candidate when rawWidth exceeds columnCount', () => {
      // allowed: [1,2,3] (columnCount=3), rawWidth=10 → closest is 3
      expect(resolveResizeWidthStep(10, 10, 3)).toBe(3);
    });
  });

  describe('single effective candidate', () => {
    it('always returns the only effective candidate regardless of rawWidth', () => {
      // maxWidth=1, columnCount=4 → candidates [1,2,1] → dedup → [1,2]
      // rawWidth=99: largest is 2; rawWidth=0: smallest is 1
      expect(resolveResizeWidthStep(99, 1, 4)).toBe(2);
      expect(resolveResizeWidthStep(0, 1, 4)).toBe(1);
    });

    it('returns the single candidate when effectiveMax collapses allowed to one entry', () => {
      // effectiveMax=1: only [1] passes the filter
      expect(resolveResizeWidthStep(99, 4, 4, 1, 1)).toBe(1);
      expect(resolveResizeWidthStep(0, 4, 4, 1, 1)).toBe(1);
    });
  });
});

describe('resolveDirectionalResizeWidthStep', () => {
  it('returns the next wider allowed step', () => {
    expect(resolveDirectionalResizeWidthStep(1, 'grow', 4, 4)).toBe(2);
    expect(resolveDirectionalResizeWidthStep(2, 'grow', 4, 4)).toBe(4);
  });

  it('returns the next narrower allowed step', () => {
    expect(resolveDirectionalResizeWidthStep(4, 'shrink', 4, 4)).toBe(2);
    expect(resolveDirectionalResizeWidthStep(2, 'shrink', 4, 4)).toBe(1);
  });

  it('returns null at either resize boundary', () => {
    expect(resolveDirectionalResizeWidthStep(4, 'grow', 4, 4)).toBeNull();
    expect(resolveDirectionalResizeWidthStep(1, 'shrink', 4, 4)).toBeNull();
  });

  it('respects the effective maximum available at the node position', () => {
    expect(resolveDirectionalResizeWidthStep(2, 'grow', 4, 4, 1, 2)).toBeNull();
  });
});
