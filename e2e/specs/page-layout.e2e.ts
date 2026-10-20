import { gridBox } from '../utils/grid';
import { openHarness } from '../utils/harness';
import { type Page, expect, test } from '@playwright/test';

const PAGE_SIZES = [
  {
    pageSize: 's',
    widths: [360, 599],
    columns: 4,
    spans: { s: 4, m: 4, l: 4, xl: 4, xxl: 4 },
  },
  {
    pageSize: 'm',
    widths: [600, 1023],
    columns: 8,
    spans: { s: 4, m: 6, l: 8, xl: 8, xxl: 8 },
  },
  {
    pageSize: 'ml',
    widths: [1024, 1279],
    columns: 12,
    spans: { s: 4, m: 8, l: 10, xl: 12, xxl: 12 },
  },
  {
    pageSize: 'l',
    widths: [1280, 1439],
    columns: 12,
    spans: { s: 4, m: 8, l: 10, xl: 12, xxl: 12 },
  },
  {
    pageSize: 'xl',
    widths: [1440, 1679],
    columns: 16,
    spans: { s: 4, m: 6, l: 10, xl: 12, xxl: 16 },
  },
  {
    pageSize: 'xxl',
    widths: [1680, 1919],
    columns: 20,
    spans: { s: 4, m: 6, l: 10, xl: 12, xxl: 20 },
  },
  {
    pageSize: 'xxxl',
    widths: [1920, 2560],
    columns: 20,
    spans: { s: 4, m: 6, l: 10, xl: 12, xxl: 20 },
  },
] as const;

async function pageAttributes(
  page: Page,
): Promise<{ pageSize: string | null; pageColumns: string | null }> {
  return page.locator('[data-testid="dashboard"]').evaluate((el) => ({
    pageSize: el.getAttribute('data-page-size'),
    pageColumns: el.getAttribute('data-page-columns'),
  }));
}

async function cardSpans(
  page: Page,
): Promise<Record<string, { cardColumns: number; gridWidth: number }>> {
  return page.evaluate(() =>
    Object.fromEntries(
      Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      ).map((el) => [
        el.getAttribute('data-card-size') ?? '',
        {
          cardColumns: Number(el.getAttribute('data-card-columns')),
          gridWidth: Number(getComputedStyle(el).getPropertyValue('--gs-w')),
        },
      ]),
    ),
  );
}

function expectedSpans(
  spans: Readonly<Record<string, number>>,
): Record<string, { cardColumns: number; gridWidth: number }> {
  return Object.fromEntries(
    Object.entries(spans).map(([size, span]) => [
      size,
      { cardColumns: span, gridWidth: span },
    ]),
  );
}

test.describe('Page sizes', () => {
  for (const { pageSize, widths, columns, spans } of PAGE_SIZES) {
    for (const width of widths) {
      test(`at ${width}px: ${columns} columns, page size ${pageSize} and its card spans`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await openHarness(page, '/?dataset=sizes');

        await expect
          .poll(async () => (await gridBox(page)).columns)
          .toBe(columns);
        await expect
          .poll(() => pageAttributes(page))
          .toEqual({ pageSize, pageColumns: String(columns) });
        await expect.poll(() => cardSpans(page)).toEqual(expectedSpans(spans));
      });
    }
  }

  test('switches between page sizes that share a column count when the viewport is resized', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await openHarness(page, '/?dataset=sizes');
    await expect
      .poll(() => pageAttributes(page))
      .toEqual({ pageSize: 'ml', pageColumns: '12' });

    await page.setViewportSize({ width: 1300, height: 900 });
    await expect
      .poll(() => pageAttributes(page))
      .toEqual({ pageSize: 'l', pageColumns: '12' });

    await page.setViewportSize({ width: 1800, height: 900 });
    await expect
      .poll(() => pageAttributes(page))
      .toEqual({ pageSize: 'xxl', pageColumns: '20' });

    await page.setViewportSize({ width: 2000, height: 900 });
    await expect
      .poll(() => pageAttributes(page))
      .toEqual({ pageSize: 'xxxl', pageColumns: '20' });

    await page.setViewportSize({ width: 1100, height: 900 });
    await expect
      .poll(() => pageAttributes(page))
      .toEqual({ pageSize: 'ml', pageColumns: '12' });
  });
});

test.describe('Card gap', () => {
  test('loose cards sit 1rem apart and line up with the dashboard header', async ({
    page,
  }) => {
    await openHarness(page);

    const layout = await page.evaluate(() => {
      const surface = (id: string): DOMRect => {
        const el = document.querySelector(
          `.grid-stack-item[gs-id="${id}"] .component-host`,
        );
        if (!el) throw new Error(`Card ${id} not found`);
        return el.getBoundingClientRect();
      };
      const topbarRow = document.querySelector<HTMLElement>(
        '.mfp-dashboard__topbar-row',
      );
      if (!topbarRow) throw new Error('Dashboard header not found');
      const topbarStyle = getComputedStyle(topbarRow);
      const topbarRect = topbarRow.getBoundingClientRect();
      const a = surface('e2e-a');
      const b = surface('e2e-b');
      const c = surface('e2e-c');

      return {
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
        horizontalGap: b.left - a.right,
        verticalGap: c.top - a.bottom,
        leftEdgeOffset:
          a.left - (topbarRect.left + parseFloat(topbarStyle.paddingLeft)),
        rightEdgeOffset:
          topbarRect.right - parseFloat(topbarStyle.paddingRight) - b.right,
      };
    });

    expect(layout.horizontalGap).toBeCloseTo(layout.rem, 0);
    expect(layout.verticalGap).toBeCloseTo(layout.rem, 0);
    expect(layout.leftEdgeOffset).toBeCloseTo(0, 0);
    expect(layout.rightEdgeOffset).toBeCloseTo(0, 0);
  });
});
