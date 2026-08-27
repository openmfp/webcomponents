import type { GridStackNode } from 'gridstack';
import type { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export type ZFlowGridStackNode = GridStackNode & {
  zFlowOrder?: number;
};

export type CardMoveCommand =
  'left' | 'right' | 'up' | 'down' | 'row-start' | 'row-end';

type NotifyableGridStackEngine = GridStackEngine & {
  _notify?: () => unknown;
};

export function hasZFlowOrder(nodes: ZFlowGridStackNode[]): boolean {
  return nodes.some((n) => n.zFlowOrder !== undefined);
}

export function syncNodeOrderFromLayout(nodes: ZFlowGridStackNode[]): void {
  const sorted = [...nodes].sort(compareNodesByLayoutPosition);

  sorted.forEach((n, i) => {
    n.zFlowOrder = i;
  });
}

export function seedNodeOrder(nodes: ZFlowGridStackNode[]): void {
  if (hasZFlowOrder(nodes)) return;

  syncNodeOrderFromLayout(nodes);
}

export function normalizeNodeOrder(nodes: ZFlowGridStackNode[]): void {
  seedNodeOrder(nodes);
  sortNodesByZFlowOrder(nodes).forEach((node, index) => {
    node.zFlowOrder = index;
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

function compareNodesByLayoutPosition(
  a: ZFlowGridStackNode,
  b: ZFlowGridStackNode,
): number {
  const ay = a.y ?? 0;
  const by = b.y ?? 0;
  if (ay !== by) return ay - by;
  return (a.x ?? 0) - (b.x ?? 0);
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

export interface ZFlowDragRect {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
}

const PROJECTED_SLOT_OVERLAP_THRESHOLD = 0.5;

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

export function resolveInsertionSlotFromProjectedRect(
  orderedNodes: ZFlowGridStackNode[],
  sourceId: string,
  columnCount: number,
  dragRect: ZFlowDragRect,
  cellWidthPx: number,
  cellHeightPx: number,
  previousSlot: number,
): number {
  if (cellWidthPx <= 0 || cellHeightPx <= 0) {
    return previousSlot;
  }

  const orderedIds = orderedNodes
    .filter((node) => node.id)
    .map((node) => node.id as string);
  const nodesById = new Map(
    orderedNodes
      .filter((node): node is ZFlowGridStackNode & { id: string } => !!node.id)
      .map((node) => [node.id, node]),
  );
  const idsWithoutSource = orderedIds.filter((id) => id !== sourceId);
  const sourceNode = nodesById.get(sourceId);

  if (!sourceNode) return previousSlot;

  let bestSlot = previousSlot;
  let bestOverlapRatio = 0;
  let bestProjectedSource: ProjectedNode | undefined;

  for (let slot = 0; slot <= idsWithoutSource.length; slot++) {
    const candidateIds = reorderByInsertionSlot(orderedIds, sourceId, slot);
    const candidateNodes = candidateIds
      .map((id) => nodesById.get(id))
      .filter((node): node is ZFlowGridStackNode & { id: string } => !!node);
    const projectedSource = projectZFlowLayout(
      candidateNodes,
      columnCount,
    ).find((projected) => projected.id === sourceId);

    if (!projectedSource) continue;

    const overlapAreaPx = getRectOverlapAreaPx(dragRect, {
      leftPx: projectedSource.x * cellWidthPx,
      topPx: projectedSource.y * cellHeightPx,
      widthPx: projectedSource.w * cellWidthPx,
      heightPx: projectedSource.h * cellHeightPx,
    });
    const projectedAreaPx =
      projectedSource.w * cellWidthPx * projectedSource.h * cellHeightPx;
    const overlapRatio =
      projectedAreaPx > 0 ? overlapAreaPx / projectedAreaPx : 0;

    if (
      overlapRatio > bestOverlapRatio ||
      (overlapRatio === bestOverlapRatio &&
        bestProjectedSource &&
        isSameProjectedPosition(projectedSource, bestProjectedSource) &&
        slot > bestSlot)
    ) {
      bestOverlapRatio = overlapRatio;
      bestProjectedSource = projectedSource;
      bestSlot = slot;
    }
  }

  if (bestOverlapRatio > PROJECTED_SLOT_OVERLAP_THRESHOLD) return bestSlot;

  return Math.max(0, Math.min(previousSlot, idsWithoutSource.length));
}

export function resolveZFlowKeyboardInsertionSlot(
  nodes: ZFlowGridStackNode[],
  sourceId: string,
  command: CardMoveCommand,
  columnCount: number,
): number | null {
  syncNodeOrderFromLayout(nodes);
  const ordered = sortNodesByZFlowOrder(nodes).filter((node) => node.id);
  const source = projectZFlowLayout(ordered, columnCount).find(
    (node) => node.id === sourceId,
  );
  if (!source) return null;

  const orderedIds = ordered.map((node) => node.id as string);
  const idsWithoutSource = orderedIds.filter((id) => id !== sourceId);
  const candidates: {
    slot: number;
    projected: ProjectedNode;
  }[] = [];

  for (let slot = 0; slot <= idsWithoutSource.length; slot++) {
    const candidateIds = reorderByInsertionSlot(orderedIds, sourceId, slot);
    const candidateNodes = candidateIds
      .map((id) => ordered.find((node) => node.id === id))
      .filter((node): node is ZFlowGridStackNode & { id: string } => !!node);
    const projected = projectZFlowLayout(candidateNodes, columnCount).find(
      (node) => node.id === sourceId,
    );
    if (!projected) continue;
    if (projected.row === source.row && projected.x === source.x) continue;

    const isDirectionalMatch =
      (command === 'left' &&
        projected.row === source.row &&
        projected.x < source.x) ||
      (command === 'right' &&
        projected.row === source.row &&
        projected.x > source.x) ||
      (command === 'up' && projected.row === source.row - 1) ||
      (command === 'down' && projected.row === source.row + 1) ||
      (command === 'row-start' &&
        projected.row === source.row &&
        projected.x < source.x) ||
      (command === 'row-end' &&
        projected.row === source.row &&
        projected.x > source.x);

    if (isDirectionalMatch) candidates.push({ slot, projected });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const distance = (candidate: typeof a): number => {
      if (command === 'up' || command === 'down') {
        return Math.abs(candidate.projected.x - source.x);
      }
      if (command === 'row-start') return candidate.projected.x;
      if (command === 'row-end') return -candidate.projected.x;
      return Math.abs(candidate.projected.x - source.x);
    };

    return (
      distance(a) - distance(b) ||
      Math.abs(a.slot - orderedIds.indexOf(sourceId)) -
        Math.abs(b.slot - orderedIds.indexOf(sourceId)) ||
      a.slot - b.slot
    );
  });

  return candidates[0].slot;
}

function isSameProjectedPosition(a: ProjectedNode, b: ProjectedNode): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function getRectOverlapAreaPx(a: ZFlowDragRect, b: ZFlowDragRect): number {
  const overlapWidthPx = Math.max(
    0,
    Math.min(a.leftPx + a.widthPx, b.leftPx + b.widthPx) -
      Math.max(a.leftPx, b.leftPx),
  );
  const overlapHeightPx = Math.max(
    0,
    Math.min(a.topPx + a.heightPx, b.topPx + b.heightPx) -
      Math.max(a.topPx, b.topPx),
  );

  return overlapWidthPx * overlapHeightPx;
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
