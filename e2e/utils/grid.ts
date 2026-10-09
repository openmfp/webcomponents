import { type Page } from '@playwright/test';

/**
 * Pixel pitch between consecutive z-flow row ordinals (gs-y difference of 1).
 * Loose zFlow cards render at cardHeight(40) × base cell 10px = 400px tall, so
 * one row-ordinal step = 400px of vertical travel.
 */
export const ROW_PITCH_PX = 400;

/**
 * Read the current CSS-var width (--gs-w) of a card. Returns 1 when the var
 * is absent (gridstack omits it for single-column cards).
 */
export async function getWidth(page: Page, id: string): Promise<number> {
  return page.evaluate((cardId) => {
    const el = document.querySelector<HTMLElement>(
      `.grid-stack-item[gs-id="${cardId}"]`,
    );
    if (!el) throw new Error(`Card ${cardId} not found`);
    const raw = getComputedStyle(el).getPropertyValue('--gs-w').trim();
    return raw ? parseInt(raw, 10) : 1;
  }, id);
}

/**
 * Return card ids sorted by their live DOM position: primary sort by gs-y
 * (row), secondary by gs-x (column). This is the z-flow visual order.
 *
 * When `ids` is omitted the function derives the set from the live DOM (any
 * [gs-id] element), so it is not coupled to the fixture roster — new cards
 * added during a test are included automatically.
 */
export async function orderByDom(
  page: Page,
  ids?: string[],
): Promise<string[]> {
  return page.evaluate((knownIds) => {
    let elements: Element[];
    if (knownIds) {
      elements = knownIds
        .map((id) => document.querySelector(`.grid-stack-item[gs-id="${id}"]`))
        .filter((el): el is Element => el !== null);
    } else {
      elements = Array.from(
        document.querySelectorAll('.grid-stack-item[gs-id]'),
      );
    }

    return elements
      .map((el) => ({
        id: el.getAttribute('gs-id')!,
        y: parseInt(el.getAttribute('gs-y') ?? '0', 10),
        x: parseInt(el.getAttribute('gs-x') ?? '0', 10),
      }))
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((c) => c.id);
  }, ids ?? null);
}

export interface GridBox {
  x: number;
  y: number;
  width: number;
  height: number;
  colWidth: number;
  columns: number;
}

/**
 * Bounding box of the grid container plus the derived per-column width. The
 * z-flow grid is a 12-column layout at the 1280px harness viewport (breakpoint 'l').
 */
export async function gridBox(page: Page): Promise<GridBox> {
  const grid = page.locator('[data-testid="dashboard-grid"]');
  const box = await grid.boundingBox();
  if (!box) throw new Error('Grid container not found');

  // Column count is read from the live --gs-columns CSS var, which gridstack
  // updates on every column change (set via el.style.setProperty).
  const columns = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="dashboard-grid"]');
    if (!el) return 12; // fallback: z-flow default at 1280px
    const raw = getComputedStyle(el).getPropertyValue('--gs-columns').trim();
    return raw ? parseInt(raw, 10) : 12;
  });

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    colWidth: box.width / columns,
    columns,
  };
}

export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Read a card's grid slot from its DOM attributes / CSS vars. gs-x / gs-y are
 * attributes; gs-w / gs-h are ABSENT when the value is 1, so width/height fall
 * back to the --gs-w / --gs-h CSS custom properties (default 1).
 */
export async function slotOf(page: Page, id: string): Promise<Slot> {
  return page.evaluate((cardId) => {
    const el = document.querySelector<HTMLElement>(
      `.grid-stack-item[gs-id="${cardId}"]`,
    );
    if (!el) throw new Error(`Card ${cardId} not found`);

    const attrInt = (name: string, fallback: number) => {
      const raw = el.getAttribute(name);
      return raw !== null ? parseInt(raw, 10) : fallback;
    };
    const varInt = (name: string, fallback: number) => {
      const raw = getComputedStyle(el).getPropertyValue(name).trim();
      return raw ? parseInt(raw, 10) : fallback;
    };

    return {
      x: attrInt('gs-x', 0),
      y: attrInt('gs-y', 0),
      w: varInt('--gs-w', 1),
      h: varInt('--gs-h', 1),
    };
  }, id);
}

/**
 * Return the sorted array of unique gs-y row ordinals currently in the DOM
 * (ascending). Lets tests say "the second distinct row = rowYs[1]" instead of
 * hard-coding internal GridStack units (e.g. 40).
 *
 * When `ids` is provided, only the cards with those ids are considered.
 * Otherwise all `.grid-stack-item[gs-id]` elements are included — mirrors
 * `orderByDom`'s optional-ids signature exactly.
 */
export async function rowOrdinals(
  page: Page,
  ids?: string[],
): Promise<number[]> {
  return page.evaluate((knownIds) => {
    let elements: Element[];
    if (knownIds) {
      elements = knownIds
        .map((id) => document.querySelector(`.grid-stack-item[gs-id="${id}"]`))
        .filter((el): el is Element => el !== null);
    } else {
      elements = Array.from(
        document.querySelectorAll('.grid-stack-item[gs-id]'),
      );
    }

    const ys = new Set<number>(
      elements.map((el) => parseInt(el.getAttribute('gs-y') ?? '0', 10)),
    );
    return Array.from(ys).sort((a, b) => a - b);
  }, ids ?? null);
}
