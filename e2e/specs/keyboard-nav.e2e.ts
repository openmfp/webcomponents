import { getWidth, orderByDom, rowOrdinals, slotOf } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { focusCard, pressCommand } from '../utils/keyboard';
import { readSaved, resetSaved, saveEdit, savedCard } from '../utils/saved';
import { expect, test } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('edit mode adds tabindex, role=listitem and aria-keyshortcuts to grid-item hosts', async ({
    page,
  }) => {
    await enterEditMode(page);

    // The grid container should have role=list in zFlow edit mode.
    await expect(
      page.locator('[data-testid="dashboard-grid"][role="list"]'),
    ).toBeVisible();

    // At least one card host should have the expected ARIA attributes.
    const host = page.locator('.grid-stack-item[gs-id="e2e-a"]');
    await expect(host).toHaveAttribute('tabindex', '0');
    await expect(host).toHaveAttribute('role', 'listitem');
    await expect(host).toHaveAttribute('aria-keyshortcuts');
  });

  test('Shift+ArrowRight grows e2e-a: 3 → 6 → 12', async ({ page }) => {
    await enterEditMode(page);

    // At 12 cols, size='s' → span=3. Ladder = [3,6,12].
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(3);

    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 6 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // Next allowed step from 6 is 12.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 12 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);
  });

  test('Shift+ArrowLeft shrinks e2e-a: 12 → 6 → 3', async ({ page }) => {
    await enterEditMode(page);

    // First grow to 12.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 6 });
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight', { w: 12 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(12);

    // Shrink 12 → 6.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowLeft', { w: 6 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(6);

    // Shrink 6 → 3.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowLeft', { w: 3 });
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(3);
  });

  test('e2e-b: Shift+ArrowRight no-op — pinned by effectiveMax (columns - x), not its own maxW', async ({
    page,
  }) => {
    await enterEditMode(page);

    // e2e-b is size='m' (span=6), packed at x=3 in Row 0 (behind e2e-a at x=0,w=3).
    // effectiveMax = 12 - 3 = 9; getAllowedResizeWidths([3,6,12], 9) = [3,6].
    // e2e-b starts at 6 — the TOP of [3,6] — so a grow finds no larger allowed
    // width and is a no-op.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(6);

    const widthBefore = await getWidth(page, 'e2e-b');
    expect(widthBefore).toBe(6);

    await focusCard(page, 'e2e-b');
    await page.keyboard.press('Shift+ArrowRight');

    // Allow the microtask to settle; the width must remain unchanged.
    await expect.poll(() => getWidth(page, 'e2e-b')).toBe(widthBefore);
  });

  test('Control+ArrowRight swaps front card with its right neighbour', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Resolve live DOM order; work relative to positions.
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const second = orderBefore[1];

    // Move front card right: z-flow swaps it with its right neighbour.
    await pressCommand(page, front, 'Control+ArrowRight');

    // Poll for the order to update in the DOM.
    await expect
      .poll(() => orderByDom(page))
      .toEqual([second, front, ...orderBefore.slice(2)]);
  });

  test('Control+ArrowLeft restores order after a right move', async ({
    page,
  }) => {
    await enterEditMode(page);

    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const second = orderBefore[1];

    // Move right then back left — net effect: order is restored.
    await pressCommand(page, front, 'Control+ArrowRight');
    await expect
      .poll(() => orderByDom(page))
      .toEqual([second, front, ...orderBefore.slice(2)]);

    await pressCommand(page, front, 'Control+ArrowLeft');
    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
  });

  test('Control+End moves front card to the last slot in its row', async ({
    page,
  }) => {
    await enterEditMode(page);

    // With 7 cards (widths 1+2+2+1+1+1+1) packed into 4 cols, row 0 holds
    // some subset. Read the live row-0 cards, then move the front to the end.
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];

    // Identify row-0 cards before the move.
    const row0Before = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      )
        .filter((el) => parseInt(el.getAttribute('gs-y') ?? '99', 10) === 0)
        .map((el) => el.getAttribute('gs-id')!);
    });

    await pressCommand(page, front, 'Control+End');

    // After Ctrl+End the front card should be in the same row but at the
    // rightmost position (i.e. the last in the row by gs-x). Assert that
    // front's row-0 neighbours have reflowed and front sits last in row 0.
    await expect
      .poll(async () => {
        const row0After = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
          )
            .filter((el) => parseInt(el.getAttribute('gs-y') ?? '99', 10) === 0)
            .sort(
              (a, b) =>
                parseInt(a.getAttribute('gs-x') ?? '0', 10) -
                parseInt(b.getAttribute('gs-x') ?? '0', 10),
            )
            .map((el) => el.getAttribute('gs-id')!),
        );
        // front must be the last card in row 0 (highest gs-x).
        return row0After[row0After.length - 1] === front;
      })
      .toBe(true);

    // Sanity: front started at row 0 so Ctrl+End is non-trivial only when row 0
    // has more than one card. If it was already alone, the test is vacuous but
    // harmless — front stays at x:0.
    if (row0Before.length > 1) {
      const slotAfter = await slotOf(page, front);
      expect(slotAfter.x).toBeGreaterThan(0);
    }
  });

  test('Control+End: assert EXACT row-0 sequence after moving front to row-end', async ({
    page,
  }) => {
    await enterEditMode(page);

    // With 7 cards the deterministic z-flow layout is:
    //   Row 0 (gs-y=0):  a(x=0,w=3), b(x=3,w=6)
    //   Row 1 (gs-y=40): c(x=0,w=6), d(x=6,w=3), e(x=9,w=3)
    //   Row 2 (gs-y=80): g(x=0,w=3), h(x=3,w=3)
    // Resolve positions from live DOM.
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0]; // card at zFlowOrder[0]

    // Read the row-0 cards sorted by gs-x before the move.
    const row0Before = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      )
        .filter((el) => parseInt(el.getAttribute('gs-y') ?? '99', 10) === 0)
        .sort(
          (a, b) =>
            parseInt(a.getAttribute('gs-x') ?? '0', 10) -
            parseInt(b.getAttribute('gs-x') ?? '0', 10),
        )
        .map((el) => el.getAttribute('gs-id')!),
    );

    // Ctrl+End moves the front card to the last position within row 0. The
    // resulting row-0 sequence should have all the former row-0 members minus
    // the front, appended with the front at the end.
    const expectedRow0After = [
      ...row0Before.filter((id) => id !== front),
      front,
    ];

    await pressCommand(page, front, 'Control+End');

    // Poll for row-0 to stabilise in the expected order.
    await expect
      .poll(async () => {
        const row0After = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
          )
            .filter((el) => parseInt(el.getAttribute('gs-y') ?? '99', 10) === 0)
            .sort(
              (a, b) =>
                parseInt(a.getAttribute('gs-x') ?? '0', 10) -
                parseInt(b.getAttribute('gs-x') ?? '0', 10),
            )
            .map((el) => el.getAttribute('gs-id')!),
        );
        return JSON.stringify(row0After) === JSON.stringify(expectedRow0After);
      })
      .toBe(true);
  });

  test('Control+Home on a row-start card is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Ensure the front card is at row-start (x:0) — it always is at y:0, x:0.
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const slotBefore = await slotOf(page, front);
    expect(slotBefore.x).toBe(0); // invariant: front card starts at x:0

    // Ctrl+Home on a row-start card must be a no-op.
    await pressCommand(page, front, 'Control+Home');

    // Neither order nor position should change.
    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, front);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Control+ArrowDown moves front card to row 1 x:0; neighbours reflow up', async ({
    page,
  }) => {
    await enterEditMode(page);

    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const slotFrontBefore = await slotOf(page, front);
    expect(slotFrontBefore.y).toBe(0); // front must start at row 0

    // The card immediately after front in order fills its vacated slot.
    const second = orderBefore[1];

    await pressCommand(page, front, 'Control+ArrowDown');

    // After Ctrl+Down, the formerly-front card must be at a higher y (row 1).
    await expect
      .poll(async () => {
        const s = await slotOf(page, front);
        return s.y > 0;
      })
      .toBe(true);

    // The second card (or some card) should now be at y:0 (reflowed up).
    await expect
      .poll(async () => {
        const s = await slotOf(page, second);
        return s.y === 0;
      })
      .toBe(true);

    // The overall order must have changed: front is no longer first.
    const orderAfter = await orderByDom(page);
    expect(orderAfter[0]).not.toBe(front);
  });

  test('Control+ArrowDown on front card: assert EXACT resulting orderByDom', async ({
    page,
  }) => {
    await enterEditMode(page);

    // 12-col layout: Row0=[a(x=0,w=3),b(x=3,w=6)], Row1=[c(x=0,w=6),d(x=6,w=3),e(x=9,w=3)], Row2=[g,h]
    // Ctrl+Down on a (x=0,y=0): engine finds the slot that places a in row 1
    // closest to x=0. Trying [b,a,...]: b(6)+a(3)=9 cols, a is at x=6 in row 0
    // (not row 1). Trying [b,c,a,...]: b(6)+c(6)=12 fills row 0; a lands at
    // x=0,row=1 — distance=0, so this slot wins.
    // New order: [b, c, a, d, e, g, h].
    //   Row 0: b(x=0,w=6), c(x=6,w=6)
    //   Row 1: a(x=0,w=3), d(x=3,w=3), e(x=6,w=3)
    //   Row 2: g(x=0,w=3), h(x=3,w=3)
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0]; // a

    await pressCommand(page, front, 'Control+ArrowDown');

    const expectedOrder = [
      orderBefore[1], // b: x=0, y=0
      orderBefore[2], // c: x=6, y=0
      front, // a: x=0, y=40
      orderBefore[3], // d: x=3, y=40
      orderBefore[4], // e: x=6, y=40
      orderBefore[5], // g: x=0, y=80
      orderBefore[6], // h: x=3, y=80
    ];

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });

  test('Control+ArrowUp on a row-0 card is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const slotBefore = await slotOf(page, front);
    expect(slotBefore.y).toBe(0); // invariant: front card is in row 0

    // Ctrl+Up on a row-0 card must be a no-op.
    await pressCommand(page, front, 'Control+ArrowUp');

    // Order and slot must be unchanged.
    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, front);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Control+ArrowLeft on a row-start card (x:0) is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find a card at x:0 in its row. The front card always starts at x:0.
    const orderBefore = await orderByDom(page);
    const front = orderBefore[0];
    const slotBefore = await slotOf(page, front);
    expect(slotBefore.x).toBe(0);

    // Ctrl+Left on a row-start card — no card to its left, so no-op.
    await pressCommand(page, front, 'Control+ArrowLeft');

    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, front);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Control+ArrowRight on a row-end card is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find the rightmost card in any row (max gs-x in its row). In the
    // deterministic layout, b at x=3 is the last in row 0 (it spans cols 3-8),
    // e at x=9 is the last in row 1. We find any row-end card dynamically.
    const orderBefore = await orderByDom(page);

    // Build a map from gs-y to max gs-x card id.
    const rowEndCard = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      );
      const byRow = new Map<number, { id: string; x: number }>();
      for (const el of items) {
        const y = parseInt(el.getAttribute('gs-y') ?? '0', 10);
        const x = parseInt(el.getAttribute('gs-x') ?? '0', 10);
        const id = el.getAttribute('gs-id')!;
        const cur = byRow.get(y);
        if (!cur || x > cur.x) byRow.set(y, { id, x });
      }
      // Return the row-end card from the first row (row 0).
      return byRow.get(0)?.id ?? null;
    });
    if (!rowEndCard) throw new Error('Could not find a row-end card');

    const slotBefore = await slotOf(page, rowEndCard);

    // Ctrl+Right on a row-end card — no card to its right in the same row,
    // so the move is a genuine no-op.
    await pressCommand(page, rowEndCard, 'Control+ArrowRight');

    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, rowEndCard);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Control+ArrowDown on a last-row card is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find a card in the last row (max gs-y). In the deterministic layout,
    // g and h are in row 2 (gs-y=80).
    const orderBefore = await orderByDom(page);

    const lastRowCard = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      );
      let maxY = -1;
      let maxCard: string | null = null;
      for (const el of items) {
        const y = parseInt(el.getAttribute('gs-y') ?? '0', 10);
        if (y > maxY) {
          maxY = y;
          maxCard = el.getAttribute('gs-id');
        }
      }
      return maxCard;
    });
    if (!lastRowCard) throw new Error('Could not find a last-row card');

    const slotBefore = await slotOf(page, lastRowCard);

    // Ctrl+Down on a card in the last row — no row below, so it is a no-op.
    await pressCommand(page, lastRowCard, 'Control+ArrowDown');

    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, lastRowCard);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Control+End on a card already last in its row is a no-op (order unchanged)', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find the row-end card — the card with the highest gs-x in any row.
    // We use the second distinct row for variety vs the Ctrl+Right no-op test
    // (which used row 0). In the deterministic layout, e is last in row 1 at x=9.
    // The second row's gs-y ordinal is derived from the live DOM to avoid coupling
    // to hard-coded gs-y values (previously 40, now row ordinal 1).
    const orderBefore = await orderByDom(page);

    const rowEndCard = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
      );
      const byRow = new Map<number, { id: string; x: number }>();
      for (const el of items) {
        const y = parseInt(el.getAttribute('gs-y') ?? '0', 10);
        const x = parseInt(el.getAttribute('gs-x') ?? '0', 10);
        const id = el.getAttribute('gs-id')!;
        const cur = byRow.get(y);
        if (!cur || x > cur.x) byRow.set(y, { id, x });
      }
      // Use the second distinct row (index 1 in sorted row keys) for variety;
      // fall back to row 0 if only one row exists.
      const sortedRows = Array.from(byRow.keys()).sort((a, b) => a - b);
      const secondRowKey = sortedRows[1] ?? sortedRows[0];
      const row1End = byRow.get(secondRowKey);
      return row1End?.id ?? byRow.get(0)?.id ?? null;
    });
    if (!rowEndCard) throw new Error('Could not find a row-end card');

    const slotBefore = await slotOf(page, rowEndCard);

    // Ctrl+End on a card already at the row's end — it is already the rightmost,
    // so no reorder occurs.
    await pressCommand(page, rowEndCard, 'Control+End');

    await expect.poll(() => orderByDom(page)).toEqual(orderBefore);
    const slotAfter = await slotOf(page, rowEndCard);
    expect(slotAfter.x).toBe(slotBefore.x);
    expect(slotAfter.y).toBe(slotBefore.y);
  });

  test('Productive Control+ArrowUp: a row-1 card moves to row 0 and full order updates', async ({
    page,
  }) => {
    await enterEditMode(page);

    // With 7 cards the z-flow layout guarantees cards in row 1 (gs-y=40):
    // c(x=0,w=6), d(x=6,w=3), e(x=9,w=3). Find any card NOT in row 0 from the
    // live layout to remain non-determinism-safe.
    const orderBefore = await orderByDom(page);
    const cardInRow1 = await (async () => {
      for (const id of orderBefore) {
        const slot = await slotOf(page, id);
        if (slot.y > 0) return id;
      }
      throw new Error('No card in row > 0 found — dataset too small');
    })();

    const slotBefore = await slotOf(page, cardInRow1);
    expect(slotBefore.y).toBeGreaterThan(0);

    // Press Ctrl+Up: should move the card to the previous row.
    await pressCommand(page, cardInRow1, 'Control+ArrowUp');

    // The card must now be at a lower gs-y (moved up to an earlier row).
    await expect
      .poll(async () => {
        const s = await slotOf(page, cardInRow1);
        return s.y < slotBefore.y;
      })
      .toBe(true);

    // The overall order must have changed (the moved card is earlier in the sequence).
    const orderAfter = await orderByDom(page);
    const idxBefore = orderBefore.indexOf(cardInRow1);
    const idxAfter = orderAfter.indexOf(cardInRow1);
    expect(idxAfter).toBeLessThan(idxBefore);

    // All cards must still be present.
    expect(orderAfter).toHaveLength(orderBefore.length);
    for (const id of orderBefore) {
      expect(orderAfter).toContain(id);
    }
  });

  test('Productive Control+ArrowUp on row-1 card: assert EXACT resulting orderByDom', async ({
    page,
  }) => {
    await enterEditMode(page);

    const orderBefore = await orderByDom(page);
    const cardInRow1 = await (async () => {
      for (const id of orderBefore) {
        const slot = await slotOf(page, id);
        if (slot.y > 0) return id;
      }
      throw new Error('No card in row > 0 found — dataset too small');
    })();

    const idxBefore = orderBefore.indexOf(cardInRow1);
    const slotOfCardInRow1 = await slotOf(page, cardInRow1);

    // Find the index of the first card in the previous row (the row with the
    // largest y still less than cardInRow1's y). Ctrl+Up inserts cardInRow1
    // just before that first card of the previous row.
    const prevRowY = await page.evaluate(
      ({ currentY }: { currentY: number }) => {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
        );
        const ys = items
          .map((el) => parseInt(el.getAttribute('gs-y') ?? '0', 10))
          .filter((y) => y < currentY);
        return ys.length ? Math.max(...ys) : -1;
      },
      { currentY: slotOfCardInRow1.y },
    );
    if (prevRowY < 0) throw new Error('No previous row found');

    // The first card of the previous row in zFlowOrder is the card in orderBefore
    // with the smallest index among those in the previous row.
    const prevRowFirstIdx = (
      await Promise.all(
        orderBefore.map(async (id, i) => {
          const s = await slotOf(page, id);
          return s.y === prevRowY ? i : Infinity;
        }),
      )
    ).reduce((min, i) => Math.min(min, i), Infinity);

    // Ctrl+Up moves cardInRow1 to the start of the previous row (before prevRowFirstIdx).
    const expectedOrder = [
      ...orderBefore.slice(0, prevRowFirstIdx),
      cardInRow1,
      ...orderBefore.slice(prevRowFirstIdx, idxBefore),
      ...orderBefore.slice(idxBefore + 1),
    ];

    await pressCommand(page, cardInRow1, 'Control+ArrowUp');

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });

  test('Productive Control+ArrowLeft on mid-row card: assert EXACT resulting orderByDom', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find the first card in orderBefore that is NOT at x:0 in its row.
    // In the deterministic layout, b (orderBefore[1]) is at x=1 in row 0.
    const orderBefore = await orderByDom(page);
    const midRowCard = await (async () => {
      for (const id of orderBefore) {
        const slot = await slotOf(page, id);
        if (slot.x > 0) return id;
      }
      throw new Error('No mid-row card found — all cards at x:0');
    })();

    const idxBefore = orderBefore.indexOf(midRowCard);
    // Ctrl+Left swaps midRowCard with the card immediately before it in zFlowOrder.
    // Expected order: the card at (idxBefore - 1) and midRowCard are swapped.
    const expectedOrder = [
      ...orderBefore.slice(0, idxBefore - 1),
      midRowCard,
      orderBefore[idxBefore - 1],
      ...orderBefore.slice(idxBefore + 1),
    ];

    await pressCommand(page, midRowCard, 'Control+ArrowLeft');

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });

  test('Control+ArrowUp nearest-by-x: d at Row1 x=6 lands in Row0 at x=9, not row-start', async ({
    page,
  }) => {
    await enterEditMode(page);

    // 12-col layout:
    //   Row 0 (gs-y=0):  a(x=0,w=3), b(x=3,w=6)
    //   Row 1 (gs-y=40): c(x=0,w=6), d(x=6,w=3), e(x=9,w=3)
    //   Row 2 (gs-y=80): g(x=0,w=3), h(x=3,w=3)
    //
    // d is orderBefore[3] — source.x=6, source.row=1.
    // Row 0 insertion slots with projected x of d:
    //   slot0 (before a): a,b stay, d inserted first → pack: d(x=0), a(x=3), b(x=6). projected.x=0
    //   slot1 (after a, before b): → pack: a(x=0), d(x=3), b(x=6). projected.x=3
    //   slot2 (after b): → pack: a(x=0), b(x=3), d(x=9). projected.x=9
    // Distances from source.x=6: |0-6|=6, |3-6|=3, |9-6|=3 → tie slot1/slot2.
    // Tiebreak |new_d_idx - old_d_idx=3|: slot1→idx=2 |2-3|=1, slot2→idx=2... wait:
    //   slot1: [a,d,b,...] → d at idx=1 in full order, |1-3|=2
    //   slot2: [a,b,d,...] → d at idx=2 in full order, |2-3|=1 → slot2 wins.
    // Result order: [a, b, d, c, e, g, h].
    // Repack: a(x=0,w=3), b(x=3,w=6), d(x=9,w=3) fills row 0 (3+6+3=12).
    //         c(x=0,w=6), e(x=6,w=3), g(x=9,w=3) fills row 1.
    //         h(x=0,w=3) in row 2.
    const orderBefore = await orderByDom(page);
    const dId = orderBefore[3]; // d is 4th in zFlowOrder (0-based index 3)
    const startSlot = await slotOf(page, dId);

    // Precondition: d must be at x=6 (above row-start) to exercise the nearest-by-x rule.
    const rowYs = await rowOrdinals(page);
    expect(startSlot.y).toBe(rowYs[1]); // Row ordinal 1
    expect(startSlot.x).toBe(6); // x>0 — this is the crux

    await pressCommand(page, dId, 'Control+ArrowUp');

    const landedSlot = await (async () => {
      await expect
        .poll(async () => {
          const s = await slotOf(page, dId);
          return s.y < startSlot.y;
        })
        .toBe(true);
      return slotOf(page, dId);
    })();

    // d must have moved UP (into Row 0).
    expect(landedSlot.y).toBeLessThan(startSlot.y);
    // d must NOT collapse to row-start — nearest-by-x lands it at x=9, not x=0.
    expect(landedSlot.x).not.toBe(0);

    // Exact order: slot2 selected → [a, b, d, c, e, g, h]
    // Pack: a(x=0,r0), b(x=3,r0), d(x=9,r0) | c(x=0,r1), e(x=6,r1), g(x=9,r1) | h(x=0,r2)
    // orderByDom: [a,b,d,c,e,g,h]
    const expectedOrder = [
      orderBefore[0], // a: x=0, y=0
      orderBefore[1], // b: x=3, y=0
      dId, // d: x=9, y=0 (nearest to source.x=6 via tie-break)
      orderBefore[2], // c: x=0, y=40
      orderBefore[4], // e: x=6, y=40
      orderBefore[5], // g: x=9, y=40
      orderBefore[6], // h: x=0, y=80
    ];

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });

  test('Control+ArrowDown nearest-by-x: e at Row1 x=9 lands in Row2 at x=3, not row-start', async ({
    page,
  }) => {
    await enterEditMode(page);

    // 12-col layout:
    //   Row 0 (gs-y=0):  a(x=0,w=3), b(x=3,w=6)
    //   Row 1 (gs-y=40): c(x=0,w=6), d(x=6,w=3), e(x=9,w=3)
    //   Row 2 (gs-y=80): g(x=0,w=3), h(x=3,w=3)
    //
    // e is orderBefore[4] — source.x=9, source.row=1.
    // Row 2 insertion slots with projected x of e:
    //   slot0 (before g): → pack row2: e(x=0), g(x=3), h(x=6). projected.x=0
    //   slot1 (between g,h): → pack row2: g(x=0), e(x=3), h(x=6). projected.x=3
    //   slot2 (after h): → pack row2: g(x=0), h(x=3), e(x=6). projected.x=6
    // Distances from source.x=9: |0-9|=9, |3-9|=6, |6-9|=3 → slot2 wins.
    // Result order: [a, b, c, d, g, h, e].
    // Repack: Row0=a,b | Row1=c,d,g | Row2=h(x=0),e(x=3).
    const orderBefore = await orderByDom(page);
    const eId = orderBefore[4]; // e is 5th in zFlowOrder
    const startSlot = await slotOf(page, eId);

    // Precondition: e must be at x=9 (above row-start) to exercise nearest-by-x.
    const rowYs = await rowOrdinals(page);
    expect(startSlot.y).toBe(rowYs[1]); // Row ordinal 1
    expect(startSlot.x).toBe(9); // x>0 — this is the crux

    await pressCommand(page, eId, 'Control+ArrowDown');

    const landedSlot = await (async () => {
      await expect
        .poll(async () => {
          const s = await slotOf(page, eId);
          return s.y > startSlot.y;
        })
        .toBe(true);
      return slotOf(page, eId);
    })();

    // e must have moved DOWN (into Row 2).
    expect(landedSlot.y).toBeGreaterThan(startSlot.y);
    // e must NOT collapse to row-start — nearest-by-x lands it at x=3, not x=0.
    // An "always insert at row-start" regression makes x===0 and fails here.
    expect(landedSlot.x).not.toBe(0);

    // Exact order: slot2 selected → [a, b, c, d, g, h, e]
    // Pack: Row0=a(x=0),b(x=3) | Row1=c(x=0),d(x=6),g(x=9) | Row2=h(x=0),e(x=3)
    const expectedOrder = [
      orderBefore[0], // a: x=0, y=0
      orderBefore[1], // b: x=3, y=0
      orderBefore[2], // c: x=0, y=40
      orderBefore[3], // d: x=6, y=40
      orderBefore[5], // g: x=9, y=40
      orderBefore[6], // h: x=0, y=80
      eId, // e: x=3, y=80 (nearest to source.x=9, slot after h)
    ];

    await expect.poll(() => orderByDom(page)).toEqual(expectedOrder);
  });

  test('Productive Control+Home: a mid-row card moves to row-start and full row order updates', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Find a card that is NOT at x:0 in its row. With 7 cards, row 0 has cards
    // a(x=0) and b(x=3), so b is a deterministic mid-row candidate. We resolve
    // it dynamically to stay non-determinism-safe.
    const orderBefore = await orderByDom(page);
    const midRowCard = await (async () => {
      for (const id of orderBefore) {
        const slot = await slotOf(page, id);
        if (slot.x > 0) return id;
      }
      throw new Error('No mid-row card found — all cards at x:0');
    })();

    const slotBefore = await slotOf(page, midRowCard);
    expect(slotBefore.x).toBeGreaterThan(0);
    const cardRow = slotBefore.y;

    // Press Ctrl+Home: should move the card to x:0 in its row.
    await pressCommand(page, midRowCard, 'Control+Home');

    // The card must now be at x:0 in the same row.
    await expect
      .poll(async () => {
        const s = await slotOf(page, midRowCard);
        return s.x === 0 && s.y === cardRow;
      })
      .toBe(true);

    // The cards that were previously before midRowCard in that row must have
    // shifted right. Confirm via full row order: midRowCard must be first in its row.
    const rowCardsAfter = await page.evaluate(
      ({ row }: { row: number }) =>
        Array.from(
          document.querySelectorAll<HTMLElement>('.grid-stack-item[gs-id]'),
        )
          .filter((el) => parseInt(el.getAttribute('gs-y') ?? '99', 10) === row)
          .sort(
            (a, b) =>
              parseInt(a.getAttribute('gs-x') ?? '0', 10) -
              parseInt(b.getAttribute('gs-x') ?? '0', 10),
          )
          .map((el) => el.getAttribute('gs-id')!),
      { row: cardRow },
    );
    expect(rowCardsAfter[0]).toBe(midRowCard);

    // All cards must still be present.
    const orderAfter = await orderByDom(page);
    expect(orderAfter).toHaveLength(orderBefore.length);
  });

  test('two-modifier no-op: Control+Shift+ArrowRight does not change width', async ({
    page,
  }) => {
    await enterEditMode(page);

    const widthBefore = await getWidth(page, 'e2e-a');

    // isOnlyModifier check means two modifiers together = no command parsed.
    await focusCard(page, 'e2e-a');
    await page.keyboard.press('Control+Shift+ArrowRight');

    // Width must remain unchanged.
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(widthBefore);
  });

  test('focus-guard: command on blurred host is ignored', async ({ page }) => {
    await enterEditMode(page);

    const widthBefore = await getWidth(page, 'e2e-a');
    const slotBefore = await slotOf(page, 'e2e-a');

    // Move focus away from the card host.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => document.body.focus());

    // Fire a grow command — since the host is not focused, onCardKeydown's
    // guard (event.target !== event.currentTarget) prevents the event from
    // being processed. Simulate by calling keyboard.press (which goes to the
    // last focused element / body — not the card host).
    await page.keyboard.press('Shift+ArrowRight');

    // Width and slot should be unchanged.
    await expect.poll(() => getWidth(page, 'e2e-a')).toBe(widthBefore);
    await expect.poll(() => slotOf(page, 'e2e-a')).toMatchObject(slotBefore);
  });

  test('payload x/y matches DOM after keyboard moves', async ({ page }) => {
    await enterEditMode(page);

    // Move e2e-a via keyboard.
    await pressCommand(page, 'e2e-a', 'Shift+ArrowRight');
    const domSlot = await slotOf(page, 'e2e-a');

    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const card = savedCard(payload, 'e2e-a');
    expect(card.x).toBe(domSlot.x);
    expect(card.y).toBe(domSlot.y);
    expect(card.w).toBe(domSlot.w);
  });
});
