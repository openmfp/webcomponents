import {
  projectZFlowLayout,
  resolveDropRowFromRect,
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
});
