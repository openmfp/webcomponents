import { resizeCardTo } from '../utils/drag';
import { getWidth, gridBox } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { pressCommand } from '../utils/keyboard';
import { expect, test } from '@playwright/test';

// At 1280px viewport: 12 columns (page size 'l'), spans = [4, 8, 10, 12].
// At 1500px viewport: 16 columns (page size 'xl'), spans = [4, 6, 10, 12, 16].
// The column count DOES change when crossing 1440px — the z-flow grid
// recomputes spans from the card's `size` property and the new column count.
const XL_WIDTH = 1500; // representative width in 1440–1679

/**
 * Set the viewport width and poll until the grid's --gs-columns reflects the
 * column count of the new page size.
 *
 * At 1024–1439px: 12 columns.
 * At 1440–1679px: 16 columns.
 *
 * The column change is driven by ResizeObserver and is async; polling for the
 * column count is the reliable sentinel.
 */
async function setWidthAndSettle(
  page: import('@playwright/test').Page,
  width: number,
): Promise<void> {
  const height = 900;
  const expectedColumns = width >= 1440 ? 16 : 12;

  await page.setViewportSize({ width, height });
  await expect
    .poll(async () => (await gridBox(page)).columns, { timeout: 5000 })
    .toBe(expectedColumns);
}

test.describe('Resize constraints at XL width (1440px)', () => {
  test.beforeEach(async ({ page }) => {
    // Load harness at 1280px (default), then widen to XL.
    // setWidthAndSettle polls until the grid settles on 16 columns.
    await openHarness(page);
    await setWidthAndSettle(page, XL_WIDTH);
  });

  test('at 1440px: gs-column is 16 (column count changes, not just card widths)', async ({
    page,
  }) => {
    const columns = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="dashboard-grid"]');
      if (!el) return 0;
      const raw = getComputedStyle(el).getPropertyValue('--gs-columns').trim();
      return raw ? parseInt(raw, 10) : 0;
    });
    expect(columns).toBe(16);
  });

  test('e2e-a (size=s): at 1440px span=4; resize ladder is [4,6,10,12,16]', async ({
    page,
  }) => {
    await enterEditMode(page);

    // At 16 cols, size='s' → span=4.
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(4);

    // Grow: 4 → 6.
    await resizeCardTo(page, 'e2e-a', 6);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // Grow: 6 → 10.
    await resizeCardTo(page, 'e2e-a', 10);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(10);

    await resizeCardTo(page, 'e2e-a', 12);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);

    await resizeCardTo(page, 'e2e-a', 16);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(16);

    // Attempt to grow beyond 16 — must be a no-op (top of ladder at 16 cols).
    const widthBefore = await getWidth(page, 'e2e-a');
    await resizeCardTo(page, 'e2e-a', 20);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(widthBefore);
    expect(widthBefore).toBe(16);
  });

  test('e2e-a resize ladder at 1440px via keyboard: [4,6,10,12,16]', async ({
    page,
  }) => {
    await enterEditMode(page);

    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(4);

    // 4 → 6.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 6 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // 6 → 10.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 10 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(10);

    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 12 });
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 16 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(16);

    // 16 → no-op (top of ladder).
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight');
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(16);
  });

  test('e2e-b (size=m): at 1440px span=6', async ({ page }) => {
    // At 16 cols, size='m' → span=6.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(6);
  });
});

// Cross-width transition tests: 1280 → 1440 → 1280 round-trip.
test.describe('Column count transition 1280 → 1440 → 1280', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('1280→1440: column count becomes 16 and spans adapt; 1440→1280: reverts to 12 and spans revert', async ({
    page,
  }) => {
    // At 1280px (default): 12 cols, e2e-b size='m' → span=8.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(8);

    const col1280 = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="dashboard-grid"]');
      if (!el) return 0;
      const raw = getComputedStyle(el).getPropertyValue('--gs-columns').trim();
      return raw ? parseInt(raw, 10) : 0;
    });
    expect(col1280).toBe(12);

    // Widen to XL: 16 cols, e2e-b → span=6.
    await setWidthAndSettle(page, XL_WIDTH);
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(6);

    const colXL = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="dashboard-grid"]');
      if (!el) return 0;
      const raw = getComputedStyle(el).getPropertyValue('--gs-columns').trim();
      return raw ? parseInt(raw, 10) : 0;
    });
    expect(colXL).toBe(16);

    // Return to 1280px: 12 cols, e2e-b → span=8.
    await setWidthAndSettle(page, 1280);
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(8);

    const colAfterRevert = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="dashboard-grid"]');
      if (!el) return 0;
      const raw = getComputedStyle(el).getPropertyValue('--gs-columns').trim();
      return raw ? parseInt(raw, 10) : 0;
    });
    expect(colAfterRevert).toBe(12);
  });
});
