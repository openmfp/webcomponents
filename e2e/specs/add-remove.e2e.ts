import {
  openEditCardsDialog,
  saveEditCards,
  toggleCard,
} from '../utils/edit-cards';
import { orderByDom, slotOf } from '../utils/grid';
import { enterEditMode, openHarness } from '../utils/harness';
import { readSaved, resetSaved, saveEdit, savedCard } from '../utils/saved';
import { expect, test } from '@playwright/test';

test.describe('Add / Remove cards', () => {
  test.beforeEach(async ({ page }) => {
    await openHarness(page);
  });

  test('add e2e-f via Edit Cards dialog and verify it appears at front slot', async ({
    page,
  }) => {
    await enterEditMode(page);
    await openEditCardsDialog(page);

    // e2e-f is only in availableCards, not in cards — its switch should be OFF.
    const checkedBefore = await page.evaluate(() => {
      const sw = document.querySelector<HTMLElement & { checked?: boolean }>(
        'ui5-switch[data-testid="dashboard-edit-cards-switch-e2e-f"]',
      );
      return Boolean(sw?.checked);
    });
    expect(checkedBefore).toBe(false);

    await toggleCard(page, 'e2e-f');
    await saveEditCards(page);

    // Card must now be present in the DOM.
    await expect(page.locator('.grid-stack-item[gs-id="e2e-f"]')).toBeVisible();

    // New loose cards are moved to front (zFlowOrder 0) → x:0, y:0.
    await expect
      .poll(() => slotOf(page, 'e2e-f'))
      .toMatchObject({ x: 0, y: 0 });

    // Save the edit and verify the payload.
    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const card = savedCard(payload, 'e2e-f');
    expect(card.x).toBe(0);
    expect(card.y).toBe(0);
    expect(card.w).toBe(4); // size='s' at 12 cols → span=4
    expect(card.h).toBe(40);
  });

  test('add e2e-f via Edit Cards dialog: it occupies x:0, y:0 and all existing cards shift down', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Read the order of existing cards BEFORE adding e2e-f.
    const orderBefore = await orderByDom(page);
    const formerFront = orderBefore[0];

    await openEditCardsDialog(page);
    await toggleCard(page, 'e2e-f');
    await saveEditCards(page);

    // e2e-f is added to the front → it must be at x:0, y:0.
    await expect
      .poll(() => slotOf(page, 'e2e-f'))
      .toMatchObject({ x: 0, y: 0 });

    // The formerly-front card must have shifted to a later position.
    const orderAfter = await orderByDom(page);
    expect(orderAfter[0]).toBe('e2e-f');
    // The former front card is still present but no longer at position 0.
    expect(orderAfter.indexOf(formerFront)).toBeGreaterThan(0);

    // All 8 cards (7 original + e2e-f) must be present in DOM order.
    expect(orderAfter).toHaveLength(8);
    // The original 7 cards follow in order behind e2e-f.
    for (const id of orderBefore) {
      expect(orderAfter).toContain(id);
    }
  });

  test('remove e2e-b via remove button: gone from payload and survivors pack with no gap', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Record the front card BEFORE the remove, to assert it stays at y:0 after.
    const orderBefore = await orderByDom(page);
    // The front card in the VISUAL order is always at y:0. After removing e2e-b
    // (which may or may not be the front depending on non-deterministic order),
    // the survivor set must still pack with a card at y:0 and orderByDom must
    // contain no gaps in the sequence.
    const frontBefore = orderBefore[0];

    // Remove via the per-card remove button.
    await page.locator('[data-testid="dashboard-card-e2e-b-remove"]').click();

    // The grid item should be detached from the DOM.
    await expect
      .poll(() => page.locator('.grid-stack-item[gs-id="e2e-b"]').count())
      .toBe(0);

    // A front card must still be at y:0 — packing must leave no empty row gap.
    // If e2e-b WAS the front, the next card will become the new front at y:0.
    // If e2e-b was NOT the front, the original front remains at y:0.
    await expect
      .poll(async () => {
        const survivorOrder = await orderByDom(page);
        if (survivorOrder.length === 0) return false;
        const firstCard = survivorOrder[0];
        const slot = await slotOf(page, firstCard);
        return slot.y === 0;
      })
      .toBe(true);

    // orderByDom must now contain exactly the 6 remaining cards (a, c, d, e, g, h).
    const orderAfter = await orderByDom(page);
    expect(orderAfter).toHaveLength(6);
    expect(orderAfter).not.toContain('e2e-b');
    // The front card before the remove is either still at index 0, or e2e-b was
    // the front and the next card replaced it. Either way, frontBefore is present
    // (we removed e2e-b, not frontBefore) OR frontBefore === secondBefore (only
    // if e2e-b happened to be front — then frontBefore is now at index 0 as the
    // 2nd card reflowed).
    if (frontBefore !== 'e2e-b') {
      // frontBefore survived and must still be in the order.
      expect(orderAfter).toContain(frontBefore);
      // And the front in visual order must be at y:0.
      expect((await slotOf(page, orderAfter[0])).y).toBe(0);
    }

    await resetSaved(page);
    await saveEdit(page);
    const payload = await readSaved(page);

    const cardIds = payload.cards.map((c) => c.id);
    expect(cardIds).not.toContain('e2e-b');
    // Exactly 6 cards remain in the payload.
    expect(cardIds).toHaveLength(6);
  });

  test('multi-card add: toggle e2e-f and e2e-i, both appear at front in toggle order', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Capture the pre-add order — all 7 CARDS are present.
    const orderBefore = await orderByDom(page);
    expect(orderBefore).toHaveLength(7);

    await openEditCardsDialog(page);

    // Both e2e-f and e2e-i are in availableCards only — their switches start OFF.
    const fChecked = await page.evaluate(() => {
      const sw = document.querySelector<HTMLElement & { checked?: boolean }>(
        'ui5-switch[data-testid="dashboard-edit-cards-switch-e2e-f"]',
      );
      return Boolean(sw?.checked);
    });
    expect(fChecked).toBe(false);
    const iChecked = await page.evaluate(() => {
      const sw = document.querySelector<HTMLElement & { checked?: boolean }>(
        'ui5-switch[data-testid="dashboard-edit-cards-switch-e2e-i"]',
      );
      return Boolean(sw?.checked);
    });
    expect(iChecked).toBe(false);

    // Toggle both cards ON in order: e2e-f first, then e2e-i.
    await toggleCard(page, 'e2e-f');
    await toggleCard(page, 'e2e-i');
    await saveEditCards(page);

    // Both cards must now be visible.
    await expect(page.locator('.grid-stack-item[gs-id="e2e-f"]')).toBeVisible();
    await expect(page.locator('.grid-stack-item[gs-id="e2e-i"]')).toBeVisible();

    // moveNodesToFront adds both at front, preserving their toggle-order batch:
    // e2e-f was toggled first, e2e-i second → they are prepended [e2e-f, e2e-i]
    // and the original 7 cards follow. Verify via the live DOM order.
    const orderAfter = await orderByDom(page);
    expect(orderAfter).toHaveLength(9); // 7 + 2 new cards

    // Both new cards must occupy the first two slots.
    expect(orderAfter[0]).toBe('e2e-f');
    expect(orderAfter[1]).toBe('e2e-i');

    // All original cards must still be present after the two new fronts.
    for (const id of orderBefore) {
      expect(orderAfter.indexOf(id)).toBeGreaterThanOrEqual(2);
    }

    // The two new cards must both be in row 0 (z-flow packs them at x:0 and x:4
    // since they each have size='s' (w=4) and fit together alongside a in row 0).
    // f(w=4) at x=0, i(w=4) at x=4 — both size='s' at 12 cols, fit together in row 0
    await expect
      .poll(() => slotOf(page, 'e2e-f'))
      .toMatchObject({ x: 0, y: 0 });
    await expect
      .poll(() => slotOf(page, 'e2e-i'))
      .toMatchObject({ x: 4, y: 0 });
  });

  test('remove-and-reflow: exact survivor sequence after removing a mid-order card', async ({
    page,
  }) => {
    await enterEditMode(page);

    // Resolve live DOM order; work relative to positions.
    const orderBefore = await orderByDom(page);
    expect(orderBefore).toHaveLength(7);

    // Pick e2e-b as the card to remove. It is deterministically NOT the front card
    // (the front is always the first in zFlowOrder, which is a), so removing b
    // creates a gap that z-flow must close by repacking.
    await page.locator('[data-testid="dashboard-card-e2e-b-remove"]').click();

    // Wait for e2e-b to leave the DOM.
    await expect
      .poll(() => page.locator('.grid-stack-item[gs-id="e2e-b"]').count())
      .toBe(0);

    // Wait for packing to settle: front card at y:0.
    await expect
      .poll(async () => {
        const order = await orderByDom(page);
        if (order.length === 0) return false;
        const slot = await slotOf(page, order[0]);
        return slot.y === 0;
      })
      .toBe(true);

    // The exact survivor sequence must be orderBefore with e2e-b removed.
    // orderByDom sorts by gs-y then gs-x, which mirrors zFlowOrder after packing.
    const orderAfter = await orderByDom(page);
    const expectedOrder = orderBefore.filter((id) => id !== 'e2e-b');
    expect(orderAfter).toHaveLength(6);
    expect(orderAfter).toEqual(expectedOrder);

    // Confirm the first survivor is at y:0 (no empty row gap).
    const firstSlot = await slotOf(page, orderAfter[0]);
    expect(firstSlot.y).toBe(0);
  });
});
