import {
  type ZFlowGridStackNode,
  applyProjectedLayout,
  getZFlowRowHeight,
  hasZFlowOrder,
  notifyEngine,
  projectZFlowLayout,
  reorderByInsertionSlot,
  resolveDropRowFromRect,
  resolveInsertionSlotFromProjectedRect,
  resolveInsertionSlotFromRow,
  seedNodeOrder,
  sortNodesByZFlowOrder,
  syncNodeOrderFromLayout,
} from './z-flow.helpers';
import type { GridStackEngine } from 'gridstack/dist/gridstack-engine';

describe('z-flow helpers', () => {
  it('projects wrapped rows by card height, not by a single grid row', () => {
    const projected = projectZFlowLayout(
      [
        { id: 'a', x: 0, y: 0, w: 2, h: 17 },
        { id: 'b', x: 2, y: 0, w: 2, h: 17 },
        { id: 'c', x: 0, y: 17, w: 2, h: 17 },
      ],
      4,
    );

    expect(projected).toEqual([
      { id: 'a', row: 0, x: 0, y: 0, w: 2, h: 17 },
      { id: 'b', row: 0, x: 2, y: 0, w: 2, h: 17 },
      { id: 'c', row: 1, x: 0, y: 17, w: 2, h: 17 },
    ]);
  });

  it('chooses the row with the largest vertical overlap', () => {
    const rowHeightPx = 170;

    expect(resolveDropRowFromRect(70, 170, rowHeightPx, 2, 0)).toBe(0);
    expect(resolveDropRowFromRect(90, 170, rowHeightPx, 2, 0)).toBe(1);
  });

  it('keeps the previous row when the drag preview does not overlap any row', () => {
    expect(resolveDropRowFromRect(900, 100, 170, 2, 1)).toBe(1);
  });

  it('resolves insertion slots from projected row positions', () => {
    const rowNodes = [
      { id: 'a', x: 0, w: 2 },
      { id: 'b', x: 2, w: 2 },
      { id: 'c', x: 4, w: 2 },
    ];

    expect(resolveInsertionSlotFromRow(50, rowNodes, 'dragging', 100)).toBe(0);
    expect(resolveInsertionSlotFromRow(250, rowNodes, 'dragging', 100)).toBe(1);
    expect(resolveInsertionSlotFromRow(550, rowNodes, 'dragging', 100)).toBe(3);
  });

  it('resolves insertion slot from the projected card overlap', () => {
    const nodes = [
      { id: 'a', x: 0, y: 0, w: 2, h: 10, zFlowOrder: 0 },
      { id: 'b', x: 2, y: 0, w: 2, h: 10, zFlowOrder: 1 },
      { id: 'c', x: 0, y: 10, w: 2, h: 10, zFlowOrder: 2 },
    ];

    const slot = resolveInsertionSlotFromProjectedRect(
      nodes,
      'c',
      4,
      {
        leftPx: 200,
        topPx: 0,
        widthPx: 200,
        heightPx: 100,
      },
      100,
      10,
      2,
    );

    expect(slot).toBe(1);
  });

  it('keeps the previous projected slot until overlap crosses the threshold', () => {
    const nodes = [
      { id: 'a', x: 0, y: 0, w: 2, h: 10, zFlowOrder: 0 },
      { id: 'b', x: 2, y: 0, w: 2, h: 10, zFlowOrder: 1 },
      { id: 'c', x: 0, y: 10, w: 2, h: 10, zFlowOrder: 2 },
    ];

    const slot = resolveInsertionSlotFromProjectedRect(
      nodes,
      'c',
      4,
      {
        leftPx: 200,
        topPx: 0,
        widthPx: 80,
        heightPx: 100,
      },
      100,
      10,
      2,
    );

    expect(slot).toBe(2);
  });

  it('prefers the later slot when a wide card has the same projected target position', () => {
    const nodes = [
      { id: 'recent', x: 0, y: 0, w: 1, h: 10, zFlowOrder: 0 },
      { id: 'quick', x: 1, y: 0, w: 1, h: 10, zFlowOrder: 1 },
      { id: 'team', x: 2, y: 0, w: 1, h: 10, zFlowOrder: 2 },
      { id: 'cost', x: 3, y: 0, w: 1, h: 10, zFlowOrder: 3 },
      { id: 'favorites', x: 0, y: 10, w: 1, h: 10, zFlowOrder: 4 },
      { id: 'resource', x: 1, y: 10, w: 2, h: 10, zFlowOrder: 5 },
    ];

    const slot = resolveInsertionSlotFromProjectedRect(
      nodes,
      'resource',
      4,
      {
        leftPx: 0,
        topPx: 100,
        widthPx: 200,
        heightPx: 100,
      },
      100,
      10,
      5,
    );

    expect(slot).toBe(4);
  });
});

describe('hasZFlowOrder', () => {
  it('returns true when at least one node has a zFlowOrder', () => {
    expect(
      hasZFlowOrder([{ id: 'a' }, { id: 'b', zFlowOrder: 0 }]),
    ).toBe(true);
  });

  it('returns false when no node has a zFlowOrder', () => {
    expect(hasZFlowOrder([{ id: 'a' }, { id: 'b' }])).toBe(false);
  });

  it('treats zFlowOrder of 0 as present (not falsy)', () => {
    expect(hasZFlowOrder([{ id: 'a', zFlowOrder: 0 }])).toBe(true);
  });

  it('returns false for an empty list', () => {
    expect(hasZFlowOrder([])).toBe(false);
  });
});

describe('syncNodeOrderFromLayout', () => {
  it('assigns zFlowOrder by row (y) then column (x)', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'bottom', x: 0, y: 10 },
      { id: 'top-right', x: 2, y: 0 },
      { id: 'top-left', x: 0, y: 0 },
    ];

    syncNodeOrderFromLayout(nodes);

    expect(nodes.map((n) => [n.id, n.zFlowOrder])).toEqual([
      ['bottom', 2],
      ['top-right', 1],
      ['top-left', 0],
    ]);
  });

  it('treats missing x/y as 0 when ordering', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'placed', x: 1, y: 0 },
      { id: 'unplaced' },
    ];

    syncNodeOrderFromLayout(nodes);

    expect(nodes.map((n) => [n.id, n.zFlowOrder])).toEqual([
      ['placed', 1],
      ['unplaced', 0],
    ]);
  });

  it('overwrites any pre-existing zFlowOrder', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, zFlowOrder: 5 },
      { id: 'b', x: 2, y: 0, zFlowOrder: 4 },
    ];

    syncNodeOrderFromLayout(nodes);

    expect(nodes.map((n) => n.zFlowOrder)).toEqual([0, 1]);
  });
});

describe('seedNodeOrder', () => {
  it('seeds order from layout when no node has a zFlowOrder', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'bottom', x: 0, y: 10 },
      { id: 'top', x: 0, y: 0 },
    ];

    seedNodeOrder(nodes);

    expect(nodes.map((n) => [n.id, n.zFlowOrder])).toEqual([
      ['bottom', 1],
      ['top', 0],
    ]);
  });

  it('leaves existing order untouched when any node already has a zFlowOrder', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 10, zFlowOrder: 0 },
      { id: 'b', x: 0, y: 0 },
    ];

    seedNodeOrder(nodes);

    expect(nodes.map((n) => [n.id, n.zFlowOrder])).toEqual([
      ['a', 0],
      ['b', undefined],
    ]);
  });
});

describe('sortNodesByZFlowOrder', () => {
  it('sorts by zFlowOrder when all nodes have one', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'c', zFlowOrder: 2 },
      { id: 'a', zFlowOrder: 0 },
      { id: 'b', zFlowOrder: 1 },
    ];

    expect(sortNodesByZFlowOrder(nodes).map((n) => n.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('orders nodes with a zFlowOrder before nodes without one', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'no-order', x: 0, y: 0 },
      { id: 'ordered', x: 5, y: 5, zFlowOrder: 3 },
    ];

    expect(sortNodesByZFlowOrder(nodes).map((n) => n.id)).toEqual([
      'ordered',
      'no-order',
    ]);
  });

  it('falls back to layout position (y then x) when neither node has an order', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'bottom', x: 0, y: 10 },
      { id: 'top-right', x: 2, y: 0 },
      { id: 'top-left', x: 0, y: 0 },
    ];

    expect(sortNodesByZFlowOrder(nodes).map((n) => n.id)).toEqual([
      'top-left',
      'top-right',
      'bottom',
    ]);
  });

  it('does not mutate the input array', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'b', zFlowOrder: 1 },
      { id: 'a', zFlowOrder: 0 },
    ];

    sortNodesByZFlowOrder(nodes);

    expect(nodes.map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('getZFlowRowHeight', () => {
  it('returns the tallest card height', () => {
    expect(
      getZFlowRowHeight([{ id: 'a', h: 10 }, { id: 'b', h: 17 }]),
    ).toBe(17);
  });

  it('defaults missing heights to 1', () => {
    expect(getZFlowRowHeight([{ id: 'a' }, { id: 'b' }])).toBe(1);
  });

  it('returns 1 for an empty list', () => {
    expect(getZFlowRowHeight([])).toBe(1);
  });
});

describe('reorderByInsertionSlot', () => {
  it('moves the source id to the requested slot', () => {
    expect(reorderByInsertionSlot(['a', 'b', 'c'], 'a', 2)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('inserts at the head when slot is 0', () => {
    expect(reorderByInsertionSlot(['a', 'b', 'c'], 'c', 0)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('clamps a slot beyond the list length to the end', () => {
    expect(reorderByInsertionSlot(['a', 'b', 'c'], 'a', 99)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('clamps a negative slot to the head', () => {
    expect(reorderByInsertionSlot(['a', 'b', 'c'], 'c', -5)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('returns an equivalent order when the source stays in place', () => {
    expect(reorderByInsertionSlot(['a', 'b', 'c'], 'b', 1)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('applyProjectedLayout', () => {
  it('writes projected x/y/w/h onto matching nodes and marks them dirty', () => {
    const nodes: ZFlowGridStackNode[] = [{ id: 'a', x: 0, y: 0, w: 1, h: 1 }];

    applyProjectedLayout(nodes, [
      { id: 'a', row: 1, x: 2, y: 10, w: 3, h: 17 },
    ]);

    expect(nodes[0]).toMatchObject({ x: 2, y: 10, w: 3, h: 17 });
    expect((nodes[0] as unknown as { _dirty: boolean })._dirty).toBe(true);
  });

  it('leaves a node untouched (and not dirty) when the projection matches', () => {
    const nodes: ZFlowGridStackNode[] = [{ id: 'a', x: 2, y: 10, w: 3, h: 17 }];

    applyProjectedLayout(nodes, [
      { id: 'a', row: 1, x: 2, y: 10, w: 3, h: 17 },
    ]);

    expect(
      (nodes[0] as unknown as { _dirty?: boolean })._dirty,
    ).toBeUndefined();
  });

  it('ignores projections that have no matching node', () => {
    const nodes: ZFlowGridStackNode[] = [{ id: 'a', x: 0, y: 0, w: 1, h: 1 }];

    expect(() => {
      applyProjectedLayout(nodes, [
        { id: 'missing', row: 0, x: 5, y: 5, w: 1, h: 1 },
      ]);
    }).not.toThrow();
    expect(nodes[0]).toMatchObject({ x: 0, y: 0, w: 1, h: 1 });
  });
});

describe('notifyEngine', () => {
  it('invokes the engine._notify hook when present', () => {
    const notify = vi.fn();
    const engine = { _notify: notify } as unknown as GridStackEngine;

    notifyEngine(engine);

    expect(notify).toHaveBeenCalledOnce();
  });

  it('is a no-op when the engine has no _notify hook', () => {
    const engine = {} as unknown as GridStackEngine;

    expect(() => {
      notifyEngine(engine);
    }).not.toThrow();
  });
});
