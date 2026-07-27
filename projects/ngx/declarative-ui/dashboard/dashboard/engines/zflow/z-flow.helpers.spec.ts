import {
  projectZFlowLayout,
  resolveDropRowFromRect,
  resolveInsertionSlotFromProjectedRect,
  resolveInsertionSlotFromRow,
} from './z-flow.helpers';

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
