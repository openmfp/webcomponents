import type { GridStackNode } from 'gridstack';
import type { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export type ZFlowGridStackNode = GridStackNode & {
  zFlowOrder?: number;
};

type NotifyableGridStackEngine = GridStackEngine & {
  _notify?: () => unknown;
};

export function hasZFlowOrder(nodes: ZFlowGridStackNode[]): boolean {
  return nodes.some((n) => n.zFlowOrder !== undefined);
}

export function seedNodeOrder(nodes: ZFlowGridStackNode[]): void {
  if (hasZFlowOrder(nodes)) return;

  const sorted = [...nodes].sort((a, b) => {
    const ay = a.y ?? 0;
    const by = b.y ?? 0;
    if (ay !== by) return ay - by;
    return (a.x ?? 0) - (b.x ?? 0);
  });

  sorted.forEach((n, i) => {
    n.zFlowOrder = i;
  });
}

export function sortNodesByZFlowOrder(
  nodes: ZFlowGridStackNode[],
): ZFlowGridStackNode[] {
  return [...nodes].sort((a, b) => {
    if (a.zFlowOrder !== undefined && b.zFlowOrder !== undefined) {
      return a.zFlowOrder - b.zFlowOrder;
    }
    if (a.zFlowOrder !== undefined) return -1;
    if (b.zFlowOrder !== undefined) return 1;
    const ay = a.y ?? 0;
    const by = b.y ?? 0;
    if (ay !== by) return ay - by;
    return (a.x ?? 0) - (b.x ?? 0);
  });
}

export interface ProjectedNode {
  id: string;
  row: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZFlowRowItem {
  id?: string;
  x?: number;
  w?: number;
}

export function getZFlowRowHeight(nodes: ZFlowGridStackNode[]): number {
  return Math.max(...nodes.map((n) => n.h ?? 1), 1);
}

export function projectZFlowLayout(
  nodes: ZFlowGridStackNode[],
  columnCount: number,
): ProjectedNode[] {
  const result: ProjectedNode[] = [];
  let curX = 0;
  let curRow = 0;
  const rowHeight = getZFlowRowHeight(nodes);

  for (const node of nodes) {
    if (!node.id) continue;
    const w = Math.min(node.w ?? 1, columnCount);
    const h = node.h ?? rowHeight;

    if (curX > 0 && curX + w > columnCount) {
      curX = 0;
      curRow++;
    }

    result.push({
      id: node.id,
      row: curRow,
      x: curX,
      y: curRow * rowHeight,
      w,
      h,
    });
    curX += w;
  }

  return result;
}

export function resolveDropRowFromRect(
  dragRectTopPx: number,
  dragRectHeightPx: number,
  rowHeightPx: number,
  rowCount: number,
  previousRow: number,
): number {
  if (rowHeightPx <= 0 || rowCount <= 0) return previousRow;

  const clampedPreviousRow = Math.max(0, Math.min(previousRow, rowCount - 1));
  const dragBottomPx = dragRectTopPx + dragRectHeightPx;
  let bestRow = clampedPreviousRow;
  let bestOverlap = 0;

  for (let row = 0; row < rowCount; row++) {
    const rowTopPx = row * rowHeightPx;
    const rowBottomPx = rowTopPx + rowHeightPx;
    const overlap = Math.max(
      0,
      Math.min(dragBottomPx, rowBottomPx) - Math.max(dragRectTopPx, rowTopPx),
    );

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestRow = row;
    }
  }

  return bestOverlap > 0 ? bestRow : clampedPreviousRow;
}

export function resolveInsertionSlotFromRow(
  dragRectCenterXPx: number,
  rowNodes: ZFlowRowItem[],
  sourceId: string,
  cellWidthPx: number,
): number {
  const candidates = rowNodes.filter((n) => n.id !== sourceId);
  if (candidates.length === 0) return 0;

  for (let i = 0; i < candidates.length; i++) {
    const n = candidates[i];
    const nodeX = (n.x ?? 0) * cellWidthPx;
    const nodeW = (n.w ?? 1) * cellWidthPx;
    const nodeMid = nodeX + nodeW / 2;

    if (dragRectCenterXPx <= nodeMid) return i;
  }

  return candidates.length;
}

export function reorderByInsertionSlot(
  orderedIds: string[],
  sourceId: string,
  targetSlot: number,
): string[] {
  const withoutSource = orderedIds.filter((id) => id !== sourceId);
  const clamped = Math.max(0, Math.min(targetSlot, withoutSource.length));
  withoutSource.splice(clamped, 0, sourceId);
  return withoutSource;
}

export function applyProjectedLayout(
  nodes: ZFlowGridStackNode[],
  projected: ProjectedNode[],
): void {
  for (const proj of projected) {
    const node = nodes.find((n) => n.id === proj.id);
    if (!node) continue;
    if (
      node.x !== proj.x ||
      node.y !== proj.y ||
      node.w !== proj.w ||
      node.h !== proj.h
    ) {
      node.x = proj.x;
      node.y = proj.y;
      node.w = proj.w;
      node.h = proj.h;
      (node as unknown as { _dirty: boolean })._dirty = true;
    }
  }
}

export function notifyEngine(engine: GridStackEngine): void {
  (engine as NotifyableGridStackEngine)._notify?.();
}
