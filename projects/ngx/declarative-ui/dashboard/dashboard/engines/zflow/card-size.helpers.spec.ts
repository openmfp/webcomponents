import {
  getZFlowCardSpan,
  getZFlowCardSpans,
  getZFlowPageSizeConfig,
  isCardSize,
  resolveZFlowCardSize,
} from './card-size.helpers';

describe('card size helpers', () => {
  describe('getZFlowPageSizeConfig', () => {
    it.each([
      [4, 's'],
      [8, 'm'],
      [12, 'l'],
      [16, 'xl'],
    ])('maps %i columns to page size %s', (columns, pageSize) => {
      expect(getZFlowPageSizeConfig(columns)?.pageSize).toBe(pageSize);
    });

    it('returns undefined for a column count outside the table', () => {
      expect(getZFlowPageSizeConfig(14)).toBeUndefined();
    });
  });

  describe('getZFlowCardSpan', () => {
    it.each([
      ['s', 4, 4],
      ['m', 4, 4],
      ['xl', 4, 4],
      ['s', 8, 2],
      ['m', 8, 4],
      ['xl', 8, 8],
      ['s', 12, 3],
      ['m', 12, 6],
      ['xl', 12, 12],
      ['s', 16, 4],
      ['m', 16, 8],
      ['xl', 16, 12],
    ] as const)(
      'gives card size %s on a %i-column page a span of %i',
      (size, columns, span) => {
        expect(getZFlowCardSpan(size, columns)).toBe(span);
      },
    );

    it('returns undefined for a column count outside the table', () => {
      expect(getZFlowCardSpan('m', 14)).toBeUndefined();
    });
  });

  describe('getZFlowCardSpans', () => {
    it('returns the distinct spans of a page in ascending order', () => {
      expect(getZFlowCardSpans(16)).toEqual([4, 8, 12]);
      expect(getZFlowCardSpans(8)).toEqual([2, 4, 8]);
    });

    it('collapses identical spans on the small page', () => {
      expect(getZFlowCardSpans(4)).toEqual([4]);
    });

    it('returns no spans for a column count outside the table', () => {
      expect(getZFlowCardSpans(14)).toEqual([]);
    });
  });

  describe('resolveZFlowCardSize', () => {
    it('maps a span back to the card size that owns it', () => {
      expect(resolveZFlowCardSize(4, 16)).toBe('s');
      expect(resolveZFlowCardSize(8, 16)).toBe('m');
      expect(resolveZFlowCardSize(12, 16)).toBe('xl');
    });

    it('keeps the current size when several sizes share the span', () => {
      expect(resolveZFlowCardSize(4, 4, 'xl')).toBe('xl');
      expect(resolveZFlowCardSize(4, 4, 'm')).toBe('m');
    });

    it('keeps the current size when the span or page is unknown', () => {
      expect(resolveZFlowCardSize(5, 16, 'm')).toBe('m');
      expect(resolveZFlowCardSize(4, 14, 'xl')).toBe('xl');
    });
  });

  describe('isCardSize', () => {
    it('accepts only the declared card sizes', () => {
      expect(isCardSize('s')).toBe(true);
      expect(isCardSize('m')).toBe(true);
      expect(isCardSize('xl')).toBe(true);
      expect(isCardSize('l')).toBe(false);
      expect(isCardSize(undefined)).toBe(false);
    });
  });
});
