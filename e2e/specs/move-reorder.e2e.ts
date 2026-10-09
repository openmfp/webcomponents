import { dragCardByRows, dragCardToSlot } from '../utils/drag';
import { getWidth, orderByDom, rowOrdinals, slotOf } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { pressCommand } from '../utils/keyboard';
import { readSaved, resetSaved, saveEdit, savedCard } from '../utils/saved';
import { expect, test } from '@playwright/test';

// z-flow renders each loose card h:40 rows tall at a 10px cell height, so a card
// occupies ~400px and adjacent slots are one card-height apart vertically — NOT
// 40px. Reordering requires dragging roughly a full card height so the pointer
// crosses the neighbouring card's midpoint. The exact pitch is read from the
// dragged card's own bounding box at runtime (see dragCardByRows in utils/drag.ts).

test.describe('Move / Reorder cards', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('placeholder behaviour during drag — grey origin latches on drag, card reorders on move', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Reset the drag-observability latches (set up in the harness fixture via a
    // MutationObserver). The grey origin placeholder is only visible for the
    // brief window between gridstack's dragStart and the first drag event, so we
    // assert on a durable "was ever shown" latch rather than the ephemeral DOM.
    await page.evaluate(() =>
      (window as unknown as { __mfpResetDrag: () => void }).__mfpResetDrag(),
    );

    // Pick the LAST card in DOM order as the drag source (bottom of the layout),
    // resolved at runtime rather than hardcoding an id/slot — initial order is
    // non-deterministic between loads.
    const order = await orderByDom(page);
    const sourceId = order[order.length - 1];
    const startSlot = await slotOf(page, sourceId);

    const dragHandle = page.locator(
      `.grid-stack-item[gs-id="${sourceId}"] .grid-stack-item-content`,
    );
    // Ensure the source card is within the visible viewport before reading its
    // bounding box and firing mouse events. With more rows in the dataset, the
    // last card may be below the fold; scrolling it into view first makes the
    // drag gesture reliable regardless of layout size.
    await dragHandle.scrollIntoViewIfNeeded();
    const srcBox = await dragHandle.boundingBox();
    if (!srcBox) throw new Error('Drag handle not found');

    const srcX = srcBox.x + srcBox.width / 2;
    const srcY = srcBox.y + srcBox.height / 2;

    await page.mouse.move(srcX, srcY);
    await page.mouse.down();

    // Arm the drag deterministically while staying INSIDE the origin cell
    // (309×400px) so the card does not yet leave its slot. gridstack arms its
    // draggable only once the pointer clears a ~3px start threshold; fire a
    // distinct arming nudge first, then a second small in-cell hop, each as a
    // separate mouse.move so gridstack sees discrete pointermove events.
    await page.mouse.move(srcX + 5, srcY + 3, { steps: 3 }); // arming nudge
    await page.mouse.move(srcX + 12, srcY + 6, { steps: 6 }); // settle in-cell

    // Grid gains the dragging class once the drag arms.
    await expect(
      page.locator('[data-testid="dashboard-grid"].zflow-dragging'),
    ).toBeVisible();

    // The grey origin placeholder must have been shown (latched) during the
    // drag — this is the durable signal, immune to the one-frame race that made
    // this test historically flaky. (Note: gridstack creates its blue
    // .grid-stack-placeholder as soon as the drag arms — grey and blue are NOT
    // strictly sequential, so we do not assert "blue not yet shown" here; that
    // was a false contract the old test only passed by catching one frame.)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __mfpDrag: { greyShown: boolean } })
              .__mfpDrag.greyShown,
        ),
      )
      .toBe(true);

    // Now move to a DIFFERENT slot to trigger a reorder. Aim one card-height
    // above the source — that puts the pointer in the row directly above, which
    // is comfortably within the viewport regardless of how many rows the layout
    // has. Using a relative offset avoids the negative-coordinate issue that
    // arises when the destination (e.g., row 0) scrolls off the top of the
    // viewport after the source card is scrolled into view.
    const dstX = srcX; // stay in same column, no horizontal move needed
    const dstY = srcY - srcBox.height; // one card-height up = previous row

    // Move in many small steps so gridstack's drag tracker fires intermediate
    // move-checks along the path (required for the z-flow engine to reorder).
    await page.mouse.move(dstX, dstY, { steps: 25 });

    // Once the card leaves its original slot it has been re-ordered.
    await expect
      .poll(async () => {
        const s = await slotOf(page, sourceId);
        return s.x !== startSlot.x || s.y !== startSlot.y;
      })
      .toBe(true);

    // The blue placeholder must now have been shown (latched) — the reorder is
    // in progress at a new slot.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __mfpDrag: { blueShown: boolean } })
              .__mfpDrag.blueShown,
        ),
      )
      .toBe(true);

    await page.mouse.up();
  });

  test('drag front card down a slot — exact order changes and payload matches DOM', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Resolve live DOM order; work relative to positions.
    const orderBefore = await orderByDom(page);
    const frontId = orderBefore[0];
    const secondId = orderBefore[1];

    // Confirm front card starts at y:0.
    expect((await slotOf(page, frontId)).y).toBe(0);

    // The norm helper collapses IEEE signed-zero (-0 → 0). The saved payload
    // can carry -0 for x while the DOM attribute parses to +0; `toBe` uses
    // Object.is which treats them as distinct, so we normalise before comparing.
    const norm = (n: number) => (Object.is(n, -0) ? 0 : n);

    // Use dragCardByRows: derives the vertical pitch from the card's own
    // bounding box, so no hard-coded pixel literals.
    await dragCardByRows(page, frontId, 1);

    // After the drag, the former front card must be in a lower row.
    await expect
      .poll(async () => (await slotOf(page, frontId)).y !== 0)
      .toBe(true);

    // The previously-second card should have reflowed up to y:0.
    await expect
      .poll(async () => (await slotOf(page, secondId)).y === 0)
      .toBe(true);

    // The new DOM order must place secondId before frontId.
    const orderAfter = await orderByDom(page);
    expect(orderAfter[0]).toBe(secondId);
    expect(orderAfter.indexOf(frontId)).toBeGreaterThan(
      orderAfter.indexOf(secondId),
    );

    // Save and verify payload matches the live DOM state.
    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const domFront = await slotOf(page, frontId);
    const domSecond = await slotOf(page, secondId);

    const pFront = savedCard(payload, frontId);
    const pSecond = savedCard(payload, secondId);

    expect(norm(pFront.x)).toBe(norm(domFront.x));
    expect(norm(pFront.y)).toBe(norm(domFront.y));
    expect(norm(pSecond.x)).toBe(norm(domSecond.x));
    expect(norm(pSecond.y)).toBe(norm(domSecond.y));

    // A bug that re-sorts cards[] by zFlowOrder would revert the reorder on
    // save — this guard catches it. The harness does not auto-reload, so we
    // verify order in the payload cards array directly.
    const savedIds = payload.cards.map((c) => c.id);
    const savedFrontCard = payload.cards.find((c) => c.id === frontId);
    const savedSecondCard = payload.cards.find((c) => c.id === secondId);
    expect(savedFrontCard).toBeDefined();
    expect(savedSecondCard).toBeDefined();
    expect(norm(savedSecondCard!.y)).toBe(0);
    expect(norm(savedFrontCard!.y)).toBeGreaterThan(0);
    expect(savedIds).toContain(frontId);
    expect(savedIds).toContain(secondId);
  });

  test('wrap-across-columns: a card that overflows row width lands at x:0 on the next row', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Grow front card to xl (w:12 = full 12-column row at 1280px).
    // Keyboard resize steps: 3→6 (s→m), 6→12 (m→xl).

    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const second = orderBefore[1];

    // Grow front card to fill the entire row (w:12 = 12 columns).
    await pressCommand(page, front, 'Shift+ArrowRight', { w: 6 });
    await pressCommand(page, front, 'Shift+ArrowRight', { w: 12 });

    // The front card now spans all 12 columns (x:0, w:12).
    await expect.poll(() => getWidth(page, front)).toBe(12);
    const frontSlot = await slotOf(page, front);
    expect(frontSlot.x).toBe(0);
    expect(frontSlot.w).toBe(12);

    // The second card cannot fit in the same row and must wrap to x:0 on next row.
    await expect
      .poll(async () => {
        const s = await slotOf(page, second);
        return s.x === 0 && s.y > 0;
      })
      .toBe(true);

    const secondSlot = await slotOf(page, second);
    expect(secondSlot.x).toBe(0);
    expect(secondSlot.y).toBeGreaterThan(0);
  });

  test('drag-to-arbitrary-slot: drag d from Row 1 to Row 0 col 3 and assert exact resulting order', async ({
    page,
  }) => {
    await enterEditMode(page);

    // 12-col layout:
    //   Row 0 (gs-y=0):  a(x=0,w=3), b(x=3,w=6)
    //   Row 1 (gs-y=1): c(x=0,w=6), d(x=6,w=3), e(x=9,w=3)
    //   Row 2 (gs-y=2): g(x=0,w=3), h(x=3,w=3)
    //
    // Drag d (Row 1, x=6) up to col 3 of Row 0 — between a(x=0,w=3) and b(x=3,w=6).
    // d(w=3) inserts at x=3, pushing b to x=6: a(x=0)+d(x=3)+b(x=6)=12 fills Row 0.
    const orderBefore = await orderByDom(page);

    // d is 4th in zFlowOrder (index 3).
    const dId = orderBefore[3];
    const dSlotBefore = await slotOf(page, dId);
    const rowYs = await rowOrdinals(page);
    expect(dSlotBefore.y).toBe(rowYs[1]); // d starts in row ordinal 1 (second distinct row)
    expect(dSlotBefore.x).toBe(6);

    // Drag d to Row 0 (gs-y=0) at col 3 — between a (x=0,w=3) and b (x=3,w=6).
    await dragCardToSlot(page, dId, 3, 0);

    // New order: [a, d, b, c, e, g, h].
    // Repack: a(x=0,w=3), d(x=3,w=3), b(x=6,w=6) fills Row 0 (3+3+6=12).
    //         c(x=0,w=6), e(x=6,w=3), g(x=9,w=3) fills Row 1.
    //         h(x=0,w=3) in Row 2.
    const expectedOrder = [
      orderBefore[0], // a: x=0, y=0
      dId, // d: x=3, y=0
      orderBefore[1], // b: x=6, y=0
      orderBefore[2], // c: x=0, y=1
      orderBefore[4], // e: x=6, y=1
      orderBefore[5], // g: x=9, y=1
      orderBefore[6], // h: x=0, y=2
    ];

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });
});
