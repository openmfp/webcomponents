import { ZflowGridStackEngine } from './z-flow-engine';
import type { ZFlowGridStackNode } from './z-flow.helpers';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';

function createEngine(
  nodes: ZFlowGridStackNode[],
  column = 4,
): {
  engine: ZflowGridStackEngine;
  onChange: ReturnType<typeof vi.fn>;
} {
  const onChange = vi.fn();
  const engine = new ZflowGridStackEngine({
    column,
    nodes,
    onChange,
  });

  return { engine, onChange };
}

function withInternalIds(nodes: ZFlowGridStackNode[]): ZFlowGridStackNode[] {
  nodes.forEach((node, index) => {
    (node as unknown as { _id: number })._id = index + 1;
  });
  return nodes;
}

describe('SteppedResizeGridStackEngine', () => {
  describe('keyboard commands', () => {
    it('dispatches movement through the z-flow layout and finalizes GridStack state', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 1, h: 10 },
        { id: 'b', x: 1, y: 0, w: 1, h: 10 },
        { id: 'c', x: 2, y: 0, w: 1, h: 10 },
      ]);
      const { engine, onChange } = createEngine(nodes);

      expect(engine.applyKeyboardCommand('b', 'left')).toBe(true);

      expect(nodes.map(({ id, x }) => ({ id, x }))).toEqual([
        { id: 'a', x: 1 },
        { id: 'b', x: 0 },
        { id: 'c', x: 2 },
      ]);
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([nodes[0], nodes[1]]),
      );
      expect(engine.getDirtyNodes()).toEqual([]);
      expect(
        nodes.every(
          (node) => !(node as unknown as { _dirty?: boolean })._dirty,
        ),
      ).toBe(true);
      expect(
        nodes.every((node) => !!(node as unknown as { _orig?: unknown })._orig),
      ).toBe(true);
    });

    it('dispatches grow and shrink through the card sizes of the page', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 2, h: 10, size: 's' },
        { id: 'b', x: 2, y: 0, w: 2, h: 10, size: 's' },
      ]);
      const { engine } = createEngine(nodes, 8);

      expect(engine.applyKeyboardCommand('a', 'grow')).toBe(true);
      expect(nodes[0]).toMatchObject({ w: 4, size: 'm' });
      expect(engine.applyKeyboardCommand('a', 'grow')).toBe(true);
      expect(nodes[0]).toMatchObject({ w: 8, size: 'xl' });
      expect(engine.applyKeyboardCommand('a', 'grow')).toBe(false);
      expect(engine.applyKeyboardCommand('a', 'shrink')).toBe(true);
      expect(nodes[0]).toMatchObject({ w: 4, size: 'm' });
    });

    it('cannot grow or shrink on the small page where every size spans all columns', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 4, h: 10, size: 'm' },
      ]);
      const { engine } = createEngine(nodes, 4);

      expect(engine.applyKeyboardCommand('a', 'grow')).toBe(false);
      expect(engine.applyKeyboardCommand('a', 'shrink')).toBe(false);
      expect(nodes[0]).toMatchObject({ w: 4, size: 'm' });
    });

    it('returns false without changing state for an unknown card', () => {
      const nodes = withInternalIds([{ id: 'a', x: 0, y: 0, w: 1, h: 10 }]);
      const { engine, onChange } = createEngine(nodes);

      expect(engine.applyKeyboardCommand('missing', 'right')).toBe(false);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('preserves z-flow when a card is removed during a GridStack batch update', () => {
    const nodes = withInternalIds([
      { id: 'favorites', x: 0, y: 0, w: 1, h: 10 },
      { id: 'recent', x: 1, y: 0, w: 1, h: 10 },
      { id: 'resource', x: 2, y: 0, w: 1, h: 10 },
      { id: 'cost', x: 3, y: 0, w: 1, h: 10 },
      { id: 'team', x: 0, y: 10, w: 1, h: 10 },
      { id: 'quick', x: 1, y: 10, w: 1, h: 10 },
    ]);
    const { engine } = createEngine(nodes);

    engine.syncZFlowOrderFromLayout();
    engine.batchUpdate();
    engine.removeNode(nodes[0]);
    engine.batchUpdate(false);
    engine.commitZFlowLayout();

    expect(
      engine.nodes
        .map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          zFlowOrder: (node as ZFlowGridStackNode).zFlowOrder,
        }))
        .sort(
          (a, b) =>
            (a.zFlowOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.zFlowOrder ?? Number.MAX_SAFE_INTEGER),
        ),
    ).toEqual([
      { id: 'recent', x: 0, y: 0, zFlowOrder: 0 },
      { id: 'resource', x: 1, y: 0, zFlowOrder: 1 },
      { id: 'cost', x: 2, y: 0, zFlowOrder: 2 },
      { id: 'team', x: 3, y: 0, zFlowOrder: 3 },
      { id: 'quick', x: 0, y: 10, zFlowOrder: 4 },
    ]);
  });

  it('appends a card added during a GridStack batch update to z-flow', () => {
    const nodes = withInternalIds([
      { id: 'recent', x: 0, y: 0, w: 1, h: 10 },
      { id: 'resource', x: 1, y: 0, w: 1, h: 10 },
      { id: 'cost', x: 2, y: 0, w: 1, h: 10 },
      { id: 'team', x: 3, y: 0, w: 1, h: 10 },
      { id: 'quick', x: 0, y: 10, w: 1, h: 10 },
    ]);
    const { engine } = createEngine(nodes);
    const added: ZFlowGridStackNode = {
      id: 'favorites',
      x: 0,
      y: 0,
      w: 1,
      h: 10,
    };
    (added as unknown as { _id: number })._id = 6;

    engine.syncZFlowOrderFromLayout();
    engine.batchUpdate();
    engine.addNode(added);
    engine.batchUpdate(false);
    engine.commitZFlowLayout();

    expect(
      engine.nodes
        .map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          zFlowOrder: (node as ZFlowGridStackNode).zFlowOrder,
        }))
        .sort(
          (a, b) =>
            (a.zFlowOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.zFlowOrder ?? Number.MAX_SAFE_INTEGER),
        ),
    ).toEqual([
      { id: 'recent', x: 0, y: 0, zFlowOrder: 0 },
      { id: 'resource', x: 1, y: 0, zFlowOrder: 1 },
      { id: 'cost', x: 2, y: 0, zFlowOrder: 2 },
      { id: 'team', x: 3, y: 0, zFlowOrder: 3 },
      { id: 'quick', x: 0, y: 10, zFlowOrder: 4 },
      { id: 'favorites', x: 1, y: 10, zFlowOrder: 5 },
    ]);
  });

  it('delegates non-resizing moveNodeCheck to super (native list-mode drag)', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 1 },
      { id: 'b', x: 2, y: 0, w: 2, h: 1 },
      { id: 'c', x: 0, y: 1, w: 2, h: 1 },
      { id: 'd', x: 2, y: 1, w: 2, h: 1 },
    ];
    const { engine } = createEngine(nodes);
    const source = nodes[2] as GridStackNode & { _moving: boolean };
    source._moving = true;

    const superSpy = vi.spyOn(
      Object.getPrototypeOf(Object.getPrototypeOf(engine)) as {
        moveNodeCheck: (...args: unknown[]) => unknown;
      },
      'moveNodeCheck',
    );

    engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 400,
      rect: { x: 0, y: 0, w: 200, h: 400 },
    } as GridStackMoveOpts);

    expect(superSpy).toHaveBeenCalledWith(source, expect.any(Object));
  });

  it('commits the full z-flow layout after frozen drag', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 10, zFlowOrder: 1 },
      { id: 'b', x: 2, y: 0, w: 2, h: 10, zFlowOrder: 2 },
      { id: 'c', x: 0, y: 0, w: 2, h: 10, zFlowOrder: 0 },
      { id: 'd', x: 2, y: 10, w: 2, h: 10, zFlowOrder: 3 },
    ];
    const { engine } = createEngine(nodes);

    const changed = engine.commitZFlowLayout();

    expect(changed).toBe(true);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'a', x: 2, y: 0 },
      { id: 'b', x: 0, y: 10 },
      { id: 'c', x: 0, y: 0 },
      { id: 'd', x: 2, y: 10 },
    ]);
  });

  it('snaps resize width to a card size and projects the affected nodes through z-flow', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 4, h: 10, size: 's' },
      { id: 'b', x: 4, y: 0, w: 8, h: 10, size: 'm' },
      { id: 'c', x: 12, y: 0, w: 4, h: 10, size: 's' },
    ];
    const { engine, onChange } = createEngine(nodes, 16);
    const opts: GridStackMoveOpts = { w: 11, resizing: true };

    const changed = engine.moveNodeCheck(nodes[0], opts);

    expect(changed).toBe(true);
    expect(opts.w).toBe(12);
    expect(
      nodes.map(({ id, x, y, w, size }) => ({ id, x, y, w, size })),
    ).toEqual([
      { id: 'a', x: 0, y: 0, w: 12, size: 'xl' },
      { id: 'b', x: 0, y: 10, w: 8, size: 'm' },
      { id: 'c', x: 8, y: 10, w: 4, size: 's' },
    ]);
    expect(onChange).toHaveBeenCalled();
  });

  it('never snaps a resize past the right edge of the grid', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 8, h: 10, size: 'm' },
      { id: 'b', x: 8, y: 0, w: 4, h: 10, size: 's' },
    ];
    const { engine } = createEngine(nodes, 16);
    const opts: GridStackMoveOpts = { w: 8, resizing: true };

    engine.moveNodeCheck(nodes[1], opts);

    expect(nodes[1]).toMatchObject({ w: 8, size: 'm' });
  });

  describe('card sizes across page sizes', () => {
    it('derives the width of an added node from its size', () => {
      const { engine } = createEngine([], 12);

      expect(
        engine.prepareNode({ id: 'a', w: 1, size: 'm' } as GridStackNode),
      ).toMatchObject({ w: 6 });
      expect(engine.prepareNode({ id: 'b', w: 5 })).toMatchObject({ w: 5 });
    });

    it('re-derives every width from its size and re-projects on a column change', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 4, h: 10, size: 's', zFlowOrder: 0 },
        { id: 'b', x: 4, y: 0, w: 8, h: 10, size: 'm', zFlowOrder: 1 },
        { id: 'c', x: 0, y: 10, w: 12, h: 10, size: 'xl', zFlowOrder: 2 },
      ]);
      const { engine, onChange } = createEngine(nodes, 16);

      engine.column = 8;
      engine.columnChanged(16, 8);

      expect(nodes.map(({ id, x, y, w }) => ({ id, x, y, w }))).toEqual([
        { id: 'a', x: 0, y: 0, w: 2 },
        { id: 'b', x: 2, y: 0, w: 4 },
        { id: 'c', x: 0, y: 10, w: 8 },
      ]);
      expect(onChange).toHaveBeenCalled();
    });

    it('keeps the size of every node when the page shrinks and grows back', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 4, h: 10, size: 's' },
        { id: 'b', x: 4, y: 0, w: 12, h: 10, size: 'xl' },
      ]);
      const { engine } = createEngine(nodes, 16);

      engine.column = 4;
      engine.columnChanged(16, 4);
      expect(nodes.map(({ w }) => w)).toEqual([4, 4]);

      engine.column = 16;
      engine.columnChanged(4, 16);
      expect(nodes.map(({ w, size }) => ({ w, size }))).toEqual([
        { w: 4, size: 's' },
        { w: 12, size: 'xl' },
      ]);
    });

    it('reports every column change to the listener, even without nodes', () => {
      const { engine } = createEngine([], 16);
      const listener = vi.fn();
      engine.columnChangeListener = listener;

      engine.columnChanged(16, 12);

      expect(listener).toHaveBeenCalledWith(12);
    });
  });

  it('syncs z-flow order from the current visual layout', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'bottom', x: 0, y: 10, w: 2, h: 10, zFlowOrder: 0 },
      { id: 'top-right', x: 2, y: 0, w: 2, h: 10, zFlowOrder: 1 },
      { id: 'top-left', x: 0, y: 0, w: 2, h: 10, zFlowOrder: 2 },
    ];
    const { engine } = createEngine(nodes);

    engine.syncZFlowOrderFromLayout();

    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['bottom', 2],
      ['top-right', 1],
      ['top-left', 0],
    ]);
  });

  it('moves the given nodes to the front of the z-flow order, keeping the rest in order', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'existing-1', x: 0, y: 0, w: 1, h: 10, zFlowOrder: 0 },
      { id: 'existing-2', x: 1, y: 0, w: 1, h: 10, zFlowOrder: 1 },
      { id: 'added-1', x: 2, y: 0, w: 1, h: 10 },
      { id: 'added-2', x: 3, y: 0, w: 1, h: 10 },
    ];
    const { engine } = createEngine(nodes);

    engine.moveNodesToFront(['added-1', 'added-2']);

    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['existing-1', 2],
      ['existing-2', 3],
      ['added-1', 0],
      ['added-2', 1],
    ]);
  });
});
