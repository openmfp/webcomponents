import { resizeCardTo } from '../utils/drag';
import { getWidth, slotOf } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { readSaved, resetSaved, saveEdit, savedCard } from '../utils/saved';
import { expect, test } from '@playwright/test';

// At 1280px viewport the z-flow grid uses 12 columns (page size 'l').
// Spans per size: s=4, m=8, l=10, xl=12, xxl=12.
// Resize ladder = getZFlowCardSpans(12) = [4, 8, 10, 12].

test.describe('Resize constraints', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('e2e-a: full ladder s→m→l→xl (4→8→10→12) via drag resize', async ({
    page,
  }) => {
    await enterEditMode(page);

    // e2e-a is size='s'; at 12 cols span=4.
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(4);

    // Grow step 1: 4 → 8 (next step in [4,8,10,12]).
    await resizeCardTo(page, 'e2e-a', 8);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(8);

    // Grow step 2: 8 → 10.
    await resizeCardTo(page, 'e2e-a', 10);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(10);

    await resizeCardTo(page, 'e2e-a', 12);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);
  });

  test('e2e-a: shrink xl→l→m→s (12→10→8→4)', async ({ page }) => {
    await enterEditMode(page);

    // Grow to max first.
    await resizeCardTo(page, 'e2e-a', 12);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);

    // Shrink 12 → 10.
    await resizeCardTo(page, 'e2e-a', 10);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(10);

    await resizeCardTo(page, 'e2e-a', 8);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(8);

    // Shrink 8 → 4.
    await resizeCardTo(page, 'e2e-a', 4);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(4);
  });

  test('e2e-b: pinned by effectiveMax (columns - x) — growing is a no-op', async ({
    page,
  }) => {
    await enterEditMode(page);

    // e2e-b is size='m' (span=8), packed at x=4 behind e2e-a (x=0,w=4).
    // effectiveMax = 12 - 4 = 8; getAllowedResizeWidths([4,8,10,12], 8) = [4,8].
    // e2e-b starts at 8 — the TOP of [4,8] — so every grow step is a no-op.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(8);

    const widthBefore = await getWidth(page, 'e2e-b');

    // Attempt to grow — width must stay pinned at the cap.
    await resizeCardTo(page, 'e2e-b', 10);
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(widthBefore);

    // A second grow attempt is likewise a no-op.
    await resizeCardTo(page, 'e2e-b', 12);
    const capped = await getWidth(page, 'e2e-b');
    expect(capped).toBe(widthBefore);
    expect(capped).toBeLessThanOrEqual(12);
  });

  test('loose card height stays pinned at 40 across resize (z-flow height constraint)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Measure rendered pixel height before resize.
    const hBefore = (await page
      .locator('.grid-stack-item[gs-id="e2e-a"]')
      .boundingBox())!.height;

    // Grow e2e-a by one step.
    await resizeCardTo(page, 'e2e-a', 8);

    // Height must remain unchanged — z-flow pins h = maxH = minH = cardHeight.
    const hAfterBox = await page
      .locator('.grid-stack-item[gs-id="e2e-a"]')
      .boundingBox();
    const hAfter = hAfterBox!.height;
    expect(hAfter).toBe(hBefore);
    // Confirm it renders at ~400px (cardHeight=40 logical units × 10px base = 400px).
    expect(hAfter).toBeGreaterThan(380);
    expect(hAfter).toBeLessThan(420);
  });

  test('saved payload w matches final --gs-w after resize', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Grow e2e-a to width 8 (s→m).
    await resizeCardTo(page, 'e2e-a', 8);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(8);

    const domSlot = await slotOf(page, 'e2e-a');

    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const card = savedCard(payload, 'e2e-a');
    expect(card.w).toBe(domSlot.w);
    expect(card.w).toBe(8);
    expect(card['size']).toBe('m');
  });
});
