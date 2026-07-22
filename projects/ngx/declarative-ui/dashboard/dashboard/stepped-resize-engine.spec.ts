import { SteppedResizeGridStackEngine } from './stepped-resize-engine';
import type { ZFlowGridStackNode } from './z-flow.helpers';
import type { GridStackMoveOpts, GridStackNode } from 'gridstack';

function createEngine(
  nodes: ZFlowGridStackNode[],
): {
  engine: SteppedResizeGridStackEngine;
  onChange: ReturnType<typeof vi.fn>;
} {
  const onChange = vi.fn();
  const engine = new SteppedResizeGridStackEngine({
    column: 4,
    nodes,
    onChange,
  });

  return { engine, onChange };
}

describe('SteppedResizeGridStackEngine', () => {
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
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 2, y: 0 },
      { id: 'c', x: 0, y: 0 },
      { id: 'd', x: 2, y: 10 },
    ]);
    expect(nodes.map((node) => [node.id, node.zFlowOrder])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 0],
      ['d', 3],
    ]);
    expect(onChange).toHaveBeenCalledWith([source]);
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
      { id: 'favorites', x: 0, y: 10 },
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
});
