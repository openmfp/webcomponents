import { resizeCardByStep } from '../utils/drag';
import { getWidth, slotOf } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { readSaved, resetSaved, saveEdit, savedCard } from '../utils/saved';
import { expect, test } from '@playwright/test';

// At 1280px viewport the z-flow grid uses 12 columns (breakpoint 'l').
// Spans per size: s=3, m=6, xl=12.
// Resize ladder = getZFlowCardSpans(12) = [3, 6, 12].

test.describe('Resize constraints', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('e2e-a: full ladder s→m→xl (3→6→12) via drag resize', async ({
    page,
  }) => {
    await enterEditMode(page);

    // e2e-a is size='s'; at 12 cols span=3.
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(3);

    // Grow step 1: 3 → 6 (next step in [3,6,12]).
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // Grow step 2: 6 → 12.
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);
  });

  test('e2e-a: shrink xl→m→s (12→6→3)', async ({ page }) => {
    await enterEditMode(page);

    // Grow to max first.
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);

    // Shrink 12 → 6.
    await resizeCardByStep(page, 'e2e-a', 'shrink', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // Shrink 6 → 3.
    await resizeCardByStep(page, 'e2e-a', 'shrink', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(3);
  });

  test('e2e-b: pinned by effectiveMax (columns - x) — growing is a no-op', async ({
    page,
  }) => {
    await enterEditMode(page);

    // e2e-b is size='m' (span=6), packed at x=3 behind e2e-a (x=0,w=3).
    // effectiveMax = 12 - 3 = 9; getAllowedResizeWidths([3,6,12], 9) = [3,6].
    // e2e-b starts at 6 — the TOP of [3,6] — so every grow step is a no-op.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(6);

    const widthBefore = await getWidth(page, 'e2e-b');

    // Attempt to grow — width must stay pinned at the cap.
    await resizeCardByStep(page, 'e2e-b', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(widthBefore);

    // A second grow attempt is likewise a no-op.
    await resizeCardByStep(page, 'e2e-b', 'grow', 1);
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
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);

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

    // Grow e2e-a to width 6 (s→m).
    await resizeCardByStep(page, 'e2e-a', 'grow', 1);
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    const domSlot = await slotOf(page, 'e2e-a');

    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const card = savedCard(payload, 'e2e-a');
    expect(card.w).toBe(domSlot.w);
    expect(card.w).toBe(6);
  });
});
