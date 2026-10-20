import {
  ZFLOW_COLUMN_MAX,
  ZFLOW_DASHBOARD_BREAKPOINTS,
  ZFLOW_PAGE_SIZES,
} from './breakpoints';

describe('z-flow breakpoints', () => {
  it('defines the seven ResponsiveColumnLayout page sizes with their width ranges and columns', () => {
    expect(
      ZFLOW_PAGE_SIZES.map(({ pageSize, maxWidth, columns }) => ({
        pageSize,
        maxWidth,
        columns,
      })),
    ).toEqual([
      { pageSize: 's', maxWidth: 599, columns: 4 },
      { pageSize: 'm', maxWidth: 1023, columns: 8 },
      { pageSize: 'ml', maxWidth: 1279, columns: 12 },
      { pageSize: 'l', maxWidth: 1439, columns: 12 },
      { pageSize: 'xl', maxWidth: 1679, columns: 16 },
      { pageSize: 'xxl', maxWidth: 1919, columns: 20 },
      { pageSize: 'xxxl', maxWidth: undefined, columns: 20 },
    ]);
  });

  it('caps the z-flow grid at 20 columns', () => {
    expect(ZFLOW_COLUMN_MAX).toBe(20);
  });

  it('derives the GridStack breakpoints from the page sizes, widest first', () => {
    expect(ZFLOW_DASHBOARD_BREAKPOINTS).toEqual([
      { w: 1919, c: 20, layout: 'none' },
      { w: 1679, c: 16, layout: 'none' },
      { w: 1439, c: 12, layout: 'none' },
      { w: 1279, c: 12, layout: 'none' },
      { w: 1023, c: 8, layout: 'none' },
      { w: 599, c: 4, layout: 'none' },
    ]);
  });
});
