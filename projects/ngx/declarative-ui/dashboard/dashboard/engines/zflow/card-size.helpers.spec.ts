import { ZFLOW_PAGE_SIZES } from '../../../constants/breakpoints';
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
      [4, 0, 's'],
      [4, 599, 's'],
      [8, 600, 'm'],
      [8, 1023, 'm'],
      [12, 1024, 'ml'],
      [12, 1279, 'ml'],
      [12, 1280, 'l'],
      [12, 1439, 'l'],
      [16, 1440, 'xl'],
      [16, 1679, 'xl'],
      [20, 1680, 'xxl'],
      [20, 1919, 'xxl'],
      [20, 1920, 'xxxl'],
      [20, 3840, 'xxxl'],
    ])(
      'maps %i columns at a %i px wide page to page size %s',
      (columns, width, pageSize) => {
        expect(getZFlowPageSizeConfig(columns, width)?.pageSize).toBe(pageSize);
      },
    );

    it('stays on a page with the given column count while the width is still on another page', () => {
      expect(getZFlowPageSizeConfig(12, 1500)?.pageSize).toBe('l');
      expect(getZFlowPageSizeConfig(16, 1300)?.pageSize).toBe('xl');
      expect(getZFlowPageSizeConfig(20, 1500)?.pageSize).toBe('xxl');
    });

    it('returns undefined for a column count outside the table', () => {
      expect(getZFlowPageSizeConfig(14, 1300)).toBeUndefined();
    });
  });

  describe('getZFlowCardSpan', () => {
    it.each([
      [4, { s: 4, m: 4, l: 4, xl: 4, xxl: 4 }],
      [8, { s: 4, m: 6, l: 8, xl: 8, xxl: 8 }],
      [12, { s: 4, m: 8, l: 10, xl: 12, xxl: 12 }],
      [16, { s: 4, m: 6, l: 10, xl: 12, xxl: 16 }],
      [20, { s: 4, m: 6, l: 10, xl: 12, xxl: 20 }],
    ] as const)(
      'gives every card size on a %i-column page its span',
      (columns, spans) => {
        expect({
          s: getZFlowCardSpan('s', columns),
          m: getZFlowCardSpan('m', columns),
          l: getZFlowCardSpan('l', columns),
          xl: getZFlowCardSpan('xl', columns),
          xxl: getZFlowCardSpan('xxl', columns),
        }).toEqual(spans);
      },
    );

    it('gives every card size the same span on pages that share a column count', () => {
      for (const page of ZFLOW_PAGE_SIZES) {
        expect(page.cardSpans).toEqual(
          ZFLOW_PAGE_SIZES.find(({ columns }) => columns === page.columns)
            ?.cardSpans,
        );
      }
    });

    it('never gives a card size more columns than its page has', () => {
      for (const page of ZFLOW_PAGE_SIZES) {
        expect(Math.max(...Object.values(page.cardSpans))).toBeLessThanOrEqual(
          page.columns,
        );
      }
    });

    it('returns undefined for a column count outside the table', () => {
      expect(getZFlowCardSpan('m', 14)).toBeUndefined();
    });
  });

  describe('getZFlowCardSpans', () => {
    it.each([
      [4, [4]],
      [8, [4, 6, 8]],
      [12, [4, 8, 10, 12]],
      [16, [4, 6, 10, 12, 16]],
      [20, [4, 6, 10, 12, 20]],
    ])(
      'returns the distinct spans of a %i-column page in ascending order',
      (columns, spans) => {
        expect(getZFlowCardSpans(columns)).toEqual(spans);
      },
    );

    it('returns no spans for a column count outside the table', () => {
      expect(getZFlowCardSpans(14)).toEqual([]);
    });
  });

  describe('resolveZFlowCardSize', () => {
    it('maps a span back to the card size that owns it', () => {
      expect(resolveZFlowCardSize(4, 20)).toBe('s');
      expect(resolveZFlowCardSize(6, 20)).toBe('m');
      expect(resolveZFlowCardSize(10, 20)).toBe('l');
      expect(resolveZFlowCardSize(12, 20)).toBe('xl');
      expect(resolveZFlowCardSize(20, 20)).toBe('xxl');
    });

    it('picks the smallest card size that owns a shared span', () => {
      expect(resolveZFlowCardSize(12, 12)).toBe('xl');
      expect(resolveZFlowCardSize(8, 8, 'm')).toBe('l');
    });

    it('keeps the current size when several sizes share the span', () => {
      expect(resolveZFlowCardSize(12, 12, 'xxl')).toBe('xxl');
      expect(resolveZFlowCardSize(8, 8, 'xl')).toBe('xl');
      expect(resolveZFlowCardSize(4, 4, 'xxl')).toBe('xxl');
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
      expect(isCardSize('l')).toBe(true);
      expect(isCardSize('xl')).toBe(true);
      expect(isCardSize('xxl')).toBe(true);
      expect(isCardSize('xs')).toBe(false);
      expect(isCardSize('xxxl')).toBe(false);
      expect(isCardSize(undefined)).toBe(false);
    });
  });
});
