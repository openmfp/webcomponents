import type { CardSize } from '../../../models';
import type { CardMoveCommand } from '../keyboard/keyboard.types';
import type { GridStackNode } from 'gridstack';
import type { GridStackEngine } from 'gridstack/dist/gridstack-engine';

export type ZFlowGridStackNode = GridStackNode & {
  zFlowOrder?: number;
  size?: CardSize;
};

type NotifyableGridStackEngine = GridStackEngine & {
  _notify?: () => unknown;
};

type FinalizableGridStackEngine = GridStackEngine & {
  cleanNodes: () => GridStackEngine;
  saveInitial: () => GridStackEngine;
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

export function finalizeEngineChange(engine: GridStackEngine): void {
  const finalizableEngine = engine as FinalizableGridStackEngine;
  finalizableEngine.cleanNodes();
  finalizableEngine.saveInitial();
}
