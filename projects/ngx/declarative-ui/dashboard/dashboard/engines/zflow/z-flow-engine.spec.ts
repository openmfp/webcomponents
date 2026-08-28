import { ZflowGridStackEngine } from './z-flow-engine';
import type { ZFlowGridStackNode } from './z-flow.helpers';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';

function createEngine(nodes: ZFlowGridStackNode[]): {
  engine: ZflowGridStackEngine;
  onChange: ReturnType<typeof vi.fn>;
} {
  const onChange = vi.fn();
  const engine = new ZflowGridStackEngine({
    column: 4,
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

    it('dispatches grow and shrink through the keyboard command entry point', () => {
      const nodes = withInternalIds([
        { id: 'a', x: 0, y: 0, w: 1, h: 10, maxW: 4 },
        { id: 'b', x: 1, y: 0, w: 1, h: 10 },
      ]);
      const { engine } = createEngine(nodes);

      expect(engine.applyKeyboardCommand('a', 'grow')).toBe(true);
      expect(nodes[0].w).toBe(2);
      expect(engine.applyKeyboardCommand('a', 'shrink')).toBe(true);
      expect(nodes[0].w).toBe(1);
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

  it('keeps non-dragged nodes visually frozen during z-flow drag', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 10 },
      { id: 'b', x: 2, y: 0, w: 2, h: 10 },
      { id: 'c', x: 0, y: 10, w: 2, h: 10 },
      { id: 'd', x: 2, y: 10, w: 2, h: 10 },
    ];
    const { engine, onChange } = createEngine(nodes);
    const source = nodes[2] as GridStackNode & { _moving: boolean };

    source._moving = true;

    const changed = engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 10,
      rect: { x: 0, y: 0, w: 200, h: 100 },
    } as GridStackMoveOpts);

    expect(changed).toBe(true);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'a', x: 2, y: 0 },
      { id: 'b', x: 0, y: 10 },
      { id: 'c', x: 0, y: 0 },
      { id: 'd', x: 2, y: 10 },
    ]);
    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 0],
      ['d', 3],
    ]);
    expect(onChange).toHaveBeenCalledWith([nodes[0], nodes[1], source]);
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

  it('snaps resize width and projects the affected nodes through z-flow', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'a', x: 0, y: 0, w: 2, h: 10, minW: 1, maxW: 4 },
      { id: 'b', x: 2, y: 0, w: 2, h: 10 },
      { id: 'c', x: 0, y: 10, w: 2, h: 10 },
    ];
    const { engine, onChange } = createEngine(nodes);
    const opts: GridStackMoveOpts = { w: 3, resizing: true };

    const changed = engine.moveNodeCheck(nodes[0], opts);

    expect(changed).toBe(true);
    expect(opts.w).toBe(4);
    expect(
      nodes.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        w: node.w,
      })),
    ).toEqual([
      { id: 'a', x: 0, y: 0, w: 4 },
      { id: 'b', x: 0, y: 10, w: 2 },
      { id: 'c', x: 2, y: 10, w: 2 },
    ]);
    expect(onChange).toHaveBeenCalled();
  });

  it('does not pull the previous row tail down when dragging a wide card to the next row start', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'recent', x: 0, y: 0, w: 1, h: 10, zFlowOrder: 0 },
      { id: 'quick', x: 1, y: 0, w: 1, h: 10, zFlowOrder: 1 },
      { id: 'team', x: 2, y: 0, w: 1, h: 10, zFlowOrder: 2 },
      { id: 'cost', x: 3, y: 0, w: 1, h: 10, zFlowOrder: 3 },
      { id: 'favorites', x: 0, y: 10, w: 1, h: 10, zFlowOrder: 4 },
      { id: 'resource', x: 1, y: 10, w: 2, h: 10, zFlowOrder: 5 },
    ];
    const { engine } = createEngine(nodes);
    const source = nodes[5] as GridStackNode & { _moving: boolean };

    source._moving = true;

    const changed = engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 10,
      rect: { x: 0, y: 100, w: 200, h: 100 },
    } as GridStackMoveOpts);

    expect(changed).toBe(true);
    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['recent', 0],
      ['quick', 1],
      ['team', 2],
      ['cost', 3],
      ['favorites', 5],
      ['resource', 4],
    ]);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'recent', x: 0, y: 0 },
      { id: 'quick', x: 1, y: 0 },
      { id: 'team', x: 2, y: 0 },
      { id: 'cost', x: 3, y: 0 },
      { id: 'favorites', x: 2, y: 10 },
      { id: 'resource', x: 0, y: 10 },
    ]);

    engine.commitZFlowLayout();

    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'recent', x: 0, y: 0 },
      { id: 'quick', x: 1, y: 0 },
      { id: 'team', x: 2, y: 0 },
      { id: 'cost', x: 3, y: 0 },
      { id: 'favorites', x: 2, y: 10 },
      { id: 'resource', x: 0, y: 10 },
    ]);
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

  it('re-projects the entire layout (not only the dragged node) on a z-flow drag', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'recent', x: 0, y: 0, w: 1, h: 10 },
      { id: 'quick', x: 1, y: 0, w: 1, h: 10 },
      { id: 'team', x: 2, y: 0, w: 1, h: 10 },
      { id: 'favorites', x: 0, y: 10, w: 1, h: 10 },
      { id: 'resource', x: 1, y: 10, w: 1, h: 10 },
      { id: 'news', x: 2, y: 10, w: 1, h: 10 },
    ];
    const { engine } = createEngine(nodes);
    const source = nodes[3] as GridStackNode & { _moving: boolean };

    source._moving = true;

    const changed = engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 10,
      rect: { x: 200, y: 0, w: 100, h: 100 },
    } as GridStackMoveOpts);

    // favorites is dragged to the top row at (2,0). The whole layout re-projects:
    // the other non-adjacent nodes (recent/quick/team/resource/news) are repositioned
    // to their projected coordinates, not only favorites.
    expect(changed).toBe(true);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'recent', x: 0, y: 0 },
      { id: 'quick', x: 1, y: 0 },
      { id: 'team', x: 3, y: 0 },
      { id: 'favorites', x: 2, y: 0 },
      { id: 'resource', x: 0, y: 10 },
      { id: 'news', x: 1, y: 10 },
    ]);
  });

  it('re-projects a non-adjacent sibling when a node crosses rows (top-vs-bottom row drag)', () => {
    const nodes: ZFlowGridStackNode[] = [
      { id: 'recent', x: 0, y: 0, w: 1, h: 10 },
      { id: 'quick', x: 1, y: 0, w: 1, h: 10 },
      { id: 'team', x: 2, y: 0, w: 1, h: 10 },
      { id: 'favorites', x: 0, y: 10, w: 1, h: 10 },
      { id: 'resource', x: 1, y: 10, w: 1, h: 10 },
      { id: 'news', x: 2, y: 10, w: 1, h: 10 },
    ];
    const { engine } = createEngine(nodes);
    const source = nodes[5] as GridStackNode & { _moving: boolean };

    source._moving = true;

    const changed = engine.moveNodeCheck(source, {
      cellWidth: 100,
      cellHeight: 10,
      rect: { x: 200, y: 0, w: 100, h: 100 },
    } as GridStackMoveOpts);

    // news (2,10) is dragged to (2,0) — a cross-row move that lands in the top row
    // next to team (2,0). team is non-adjacent to news and is repositioned to (3,0),
    // while recent/quick (top row) and favorites/resource (bottom row) keep their
    // positions. changed=true signals a reorder.
    expect(changed).toBe(true);
    expect(
      nodes.map((node) => ({ id: node.id, x: node.x, y: node.y })),
    ).toEqual([
      { id: 'recent', x: 0, y: 0 },
      { id: 'quick', x: 1, y: 0 },
      { id: 'team', x: 3, y: 0 },
      { id: 'favorites', x: 0, y: 10 },
      { id: 'resource', x: 1, y: 10 },
      { id: 'news', x: 2, y: 0 },
    ]);
  });
});
